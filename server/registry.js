/* ----------------------- REGISTRY (Durable Object) -----------------------
   One instance, named "main". Owns everything that is not one game:

     accounts     `player:<id>` records and `tok:<sha256>` lookups
     game lists   `games:<playerId>` recent games for the lobby's "your tables"
     matchmaking  `seek:<playerId>` open seeks; lobby sockets are hibernated and
                  tagged with the player id so a match can be pushed to them
     the ladder   a sort over the players, cached for a minute

   Accounts are deliberately light: a display name and a bearer token that the
   browser keeps. There is no password to forget and nothing personal to leak.
   The token is stored hashed; losing it means claiming a new handle. */

import { DurableObject } from "cloudflare:workers";
import { newRating, rateGame } from "./rating.js";
import { randomHex, sha256, cleanName, cleanTint } from "./http.js";
import { cleanKey, publicPlayer, hasPlayed } from "./players.js";
import { SIZES } from "./room.js";

const KEEP_GAMES = 24;
const LADDER_TTL = 60_000;
const LADDER_SIZE = 100;

export class Registry extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ladderCache = null;
  }

  /* ----- accounts ----- */

  async register(rawName, rawTint) {
    const name = cleanName(rawName);
    if (!name) throw new Error("bad-name");
    const id = "p_" + randomHex(8);
    const token = randomHex(32);
    const player = {
      id, name, tint: cleanTint(rawTint), tokenHash: await sha256(token),
      ...newRating(), wins: 0, losses: 0, draws: 0,
      createdAt: Date.now(), lastSeen: Date.now(),
    };
    await this.ctx.storage.put({ [`player:${id}`]: player, [`tok:${player.tokenHash}`]: id });
    return { token, player: publicPlayer(player) };
  }

  /** The player behind a token, or null. */
  async auth(token) {
    if (typeof token !== "string" || token.length !== 64) return null;
    const id = await this.ctx.storage.get(`tok:${await sha256(token)}`);
    if (!id) return null;
    const p = await this.ctx.storage.get(`player:${id}`);
    return p ? publicPlayer(p) : null;
  }

  async player(id) {
    const p = await this.ctx.storage.get(`player:${id}`);
    return p ? publicPlayer(p) : null;
  }

  async update(id, patch) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) throw new Error("no-player");
    const name = patch.name !== undefined ? cleanName(patch.name) : p.name;
    if (!name) throw new Error("bad-name");
    const next = { ...p, name, tint: patch.tint !== undefined ? cleanTint(patch.tint) : p.tint, lastSeen: Date.now() };
    await this.ctx.storage.put(`player:${id}`, next);
    this.ladderCache = null;
    return publicPlayer(next);
  }

  /** Remove a player and their token. Finished games keep their record; the
   *  ladder simply stops listing them. Used by the player (leave) and by admin. */
  async remove(id) {
    const p = await this.ctx.storage.get(`player:${id}`);
    if (!p) return false;
    await this.ctx.storage.delete([`player:${id}`, `tok:${p.tokenHash}`, `games:${id}`, `seek:${id}`]);
    for (const ws of this.ctx.getWebSockets(id)) ws.close(4000, "removed");
    this.ladderCache = null;
    return true;
  }

  /* ----- games ----- */

  /** Rooms call this when a game is made and when it ends, so the lobby list is current. */
  async noteGame(summary) {
    for (const id of [summary.black.id, summary.white.id]) {
      const key = `games:${id}`;
      const list = (await this.ctx.storage.get(key)) || [];
      const rest = list.filter(g => g.id !== summary.id);
      await this.ctx.storage.put(key, [summary, ...rest].slice(0, KEEP_GAMES));
    }
  }

  async gamesOf(id) {
    return (await this.ctx.storage.get(`games:${id}`)) || [];
  }

  /** Settle a finished rated game exactly once. Returns `{ b, w }` rating changes. */
  async settle(out) {
    const doneKey = `settled:${out.id}`;
    const prior = await this.ctx.storage.get(doneKey);
    if (prior) return prior;
    const b = await this.ctx.storage.get(`player:${out.black}`);
    const w = await this.ctx.storage.get(`player:${out.white}`);
    if (!b || !w) throw new Error("no-player");
    let result;
    if (out.rated) {
      const r = rateGame(b, w, out.winner);
      const tally = (p, side) => ({
        ...p, rating: r[side].rating, rd: r[side].rd, vol: r[side].vol,
        wins: p.wins + (out.winner === side ? 1 : 0),
        losses: p.losses + (out.winner && out.winner !== side ? 1 : 0),
        draws: p.draws + (out.winner === null ? 1 : 0),
        lastSeen: Date.now(),
      });
      await this.ctx.storage.put({ [`player:${b.id}`]: tally(b, "b"), [`player:${w.id}`]: tally(w, "w") });
      result = { rated: true, b: { delta: r.b.delta, rating: r.b.rating, rd: r.b.rd }, w: { delta: r.w.delta, rating: r.w.rating, rd: r.w.rd } };
      this.ladderCache = null;
    } else {
      result = { rated: false, b: null, w: null };
    }
    await this.ctx.storage.put(doneKey, result);
    return result;
  }

  /* ----- the ladder ----- */

  async ladder() {
    if (this.ladderCache && Date.now() - this.ladderCache.at < LADDER_TTL) return this.ladderCache.rows;
    const all = await this.ctx.storage.list({ prefix: "player:" });
    // Only players who have finished a rated game stand on the ladder.
    const rows = [...all.values()]
      .filter(hasPlayed)
      .map(publicPlayer)
      .sort((a, b) => b.rating - a.rating || a.rd - b.rd)
      .slice(0, LADDER_SIZE);
    this.ladderCache = { at: Date.now(), rows };
    return rows;
  }

  /** Every account, for the operator. */
  async everyone() {
    const all = await this.ctx.storage.list({ prefix: "player:" });
    return [...all.values()].map(publicPlayer).sort((a, b) => b.createdAt - a.createdAt);
  }

  async stats() {
    const players = await this.ctx.storage.list({ prefix: "player:" });
    const seeks = await this.ctx.storage.list({ prefix: "seek:" });
    return { players: players.size, online: this.ctx.getWebSockets().length, seeking: seeks.size };
  }

  /* ----- lobby sockets and matchmaking -----
     `fetch` only ever receives the lobby upgrade; the router has already
     authenticated the player and passes it in a header. */

  async fetch(req) {
    const player = JSON.parse(req.headers.get("x-sente-player"));
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [player.id]);
    server.serializeAttachment({ id: player.id });
    // A player has one lobby seat: newer tabs replace older ones quietly.
    for (const ws of this.ctx.getWebSockets(player.id)) if (ws !== server) ws.close(4000, "replaced");
    await this.broadcastLobby();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return send(ws, { t: "error", reason: "bad-frame" }); }
    const { id } = ws.deserializeAttachment();
    if (msg.t === "seek") {
      const size = SIZES.includes(msg.size) ? msg.size : 9;
      const rated = msg.rated !== false;
      await this.seek(id, size, rated, cleanKey(msg.key));
    } else if (msg.t === "cancel") {
      await this.ctx.storage.delete(`seek:${id}`);
      send(ws, { t: "seek", status: "idle" });
      await this.broadcastLobby();
    } else if (msg.t === "ping") {
      send(ws, { t: "pong" });
    } else {
      send(ws, { t: "error", reason: "unknown-type" });
    }
  }

  async webSocketClose(ws) {
    const att = ws.deserializeAttachment();
    if (att && this.ctx.getWebSockets(att.id).length <= 1) await this.ctx.storage.delete(`seek:${att.id}`);
    await this.broadcastLobby();
  }

  async webSocketError(ws) { await this.webSocketClose(ws); }

  /** Look for an opponent, or wait to be found. `key` is an optional rendezvous
   *  word: seeks carrying one match only each other, so two people who agree on a
   *  word meet however busy the lobby is, and an open seek never swallows them. */
  async seek(id, size, rated, key = null) {
    const me = await this.ctx.storage.get(`player:${id}`);
    if (!me) return;
    const seeks = await this.ctx.storage.list({ prefix: "seek:" });
    let match = null;
    for (const [k, s] of seeks) {
      if (k === `seek:${id}`) continue;
      if ((s.key ?? null) !== key) continue;
      if (s.size === size && s.rated === rated && this.ctx.getWebSockets(s.id).length) { match = s; break; }
    }
    if (!match) {
      await this.ctx.storage.put(`seek:${id}`, { id, size, rated, key, at: Date.now() });
      this.tell(id, { t: "seek", status: "waiting", size, rated, key });
      await this.broadcastLobby();
      return;
    }
    await this.ctx.storage.delete([`seek:${id}`, `seek:${match.id}`]);
    const opp = await this.ctx.storage.get(`player:${match.id}`);
    if (!opp) return;
    // The waiting player takes Black by courtesy; the newcomer takes White.
    const gameId = "g_" + randomHex(6);
    const seatOf = (p) => ({ id: p.id, name: p.name, tint: p.tint, rating: Math.round(p.rating), rd: Math.round(p.rd) });
    const stub = this.env.ROOM.get(this.env.ROOM.idFromName(gameId));
    await stub.create({ id: gameId, size, rated, black: seatOf(opp), white: seatOf(me) });
    this.tell(match.id, { t: "matched", gameId, color: "b", opponent: seatOf(me), size });
    this.tell(id, { t: "matched", gameId, color: "w", opponent: seatOf(opp), size });
    await this.broadcastLobby();
  }

  tell(playerId, frame) {
    for (const ws of this.ctx.getWebSockets(playerId)) send(ws, frame);
  }

  async broadcastLobby() {
    const seeks = await this.ctx.storage.list({ prefix: "seek:" });
    // Only open seeks are counted; a private rendezvous is nobody else's business.
    const open = [...seeks.values()].filter(s => !s.key).length;
    const frame = { t: "lobby", online: this.ctx.getWebSockets().length, seeking: open };
    for (const ws of this.ctx.getWebSockets()) send(ws, frame);
  }
}

function send(ws, frame) {
  try { ws.send(JSON.stringify(frame)); } catch { /* closed */ }
}

