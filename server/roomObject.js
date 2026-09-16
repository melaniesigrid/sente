/* ----------------------- ROOM (Durable Object) -----------------------
   One instance per game, named by the game id. It holds the room object from
   room.js in storage, accepts hibernating WebSockets tagged with the player id
   (or "spectator"), and does nothing a test cannot already cover: parse frame,
   `applyMessage`, store, broadcast. When a game ends it reports the outcome to
   the Registry once and pins the rating changes on the room. */

import { DurableObject } from "cloudflare:workers";
import {
  createRoom, applyMessage, seatOf, reviveRoom, outcome, isPairRoom, leadSeat, controls, actingSeat,
} from "./room.js";
import { teamSeats } from "../src/engine/rengo.js";
import { reseatRoom } from "./merge.js";
import { isTalkFrame, checkTalk, canTalk, talkTarget, mayRelay, TALK_LIMIT, TALK_WINDOW_MS } from "./talk.js";
import { hit } from "./ratelimit.js";

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.room = null;
  }

  async load() {
    if (this.room) return this.room;
    const raw = await this.ctx.storage.get("room");
    this.room = raw ? reviveRoom(raw) : null;
    return this.room;
  }

  async save(room) {
    this.room = room;
    await this.ctx.storage.put("room", room);
  }

  /* ----- RPC from the Worker and the Registry ----- */

  async create(params) {
    if (await this.load()) throw new Error("exists");
    const room = createRoom(params);
    await this.save(room);
    await this.registry().noteGame(summary(room));
    return room;
  }

  async get() {
    return this.load();
  }

  /** Give one person's chair to another, for the operator folding two handles
   *  into one (`Registry.merge`). Sockets already open under the old id keep
   *  their tag until they close; the next one opened under the new id finds
   *  its seat. Answers whether anything here was theirs. */
  async reseat(fromId, who) {
    const room = await this.load();
    if (!room) return false;
    const next = reseatRoom(room, fromId, who);
    if (next === room) return false;
    await this.save(next);
    return true;
  }

  /* ----- sockets ----- */

  async fetch(req) {
    const room = await this.load();
    if (!room) return new Response("no such game", { status: 404 });
    const header = req.headers.get("x-sente-player");
    const player = header ? JSON.parse(header) : null;
    const seat = player ? seatOf(room, player.id) : null;
    const tag = seat ? player.id : "spectator";
    // The seats this player may act in: their chair, plus the partner their
    // browser runs. The client needs it to know when to ask its partner to move.
    const runs = player ? controls(room, player.id).filter((id) => id !== seat) : [];
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [tag, seat ? "seated" : "watching"]);
    server.serializeAttachment({ seat, player: player ? { id: player.id, name: player.name } : null });
    send(server, { t: "state", room });
    send(server, { t: "seat", seat, runs, watching: this.ctx.getWebSockets("watching").length });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return send(ws, { t: "error", reason: "bad-frame" }); }
    if (msg && msg.t === "ping") return send(ws, { t: "pong" });
    const { seat, player } = ws.deserializeAttachment();
    const room = await this.load();
    if (!room) return send(ws, { t: "error", reason: "no-room" });
    /* Signalling for a voice call is relayed and forgotten: it never reaches
       `applyMessage`, so it is never in the room record and never in storage.
       See server/talk.js for why none of that is a security measure. */
    if (isTalkFrame(msg.t)) return this.relayTalk(ws, msg, raw, room, seat);
    if (!seat) {
      if (!player) return send(ws, { t: "error", reason: "sign-in-to-chat" });
      msg = { ...msg, from: player };
    }
    /* Which chair this frame speaks from. A move is applied as whichever seat is
       actually to play when this player controls it, so a client running its own
       partner never has to name the chair and cannot name the wrong one. */
    const acting = seat ? actingSeat(room, player.id, msg.t) : null;
    const { room: next, events } = applyMessage(room, acting, msg);
    if (next !== room) await this.save(next);
    for (const ev of events) this.emit(ev, ws, next);
    /* Tell the Registry the game moved, AFTER the move has gone out to the
       people at the board. Until this existed the lobby's summary was frozen at
       the moment the game was made, so every table in progress read "0 moves,
       your move" however long it had been going: `noteGame` was called when a
       room was created and when it ended, and never in between.

       It is deliberately not awaited. The players feel the broadcast; the list
       is a screen they are not looking at, so a cross-object call has no
       business sitting in front of their stone landing. */
    if (next !== room && next.record.phase !== "ended") {
      this.ctx.waitUntil(this.registry().noteGame(summary(next)));
    }
    await this.maybeSettle(next);
  }

  /* ----- talk: relay one signalling frame, write nothing -----

     Everything refused here is refused for hygiene, not for safety. A player
     whose peer never asked for a call, a frame the wrong shape, a socket going
     too fast: those make the relay useless as a general-purpose channel between
     arbitrary clients. They do nothing about a hostile relay, which is what the
     committed key agreement in talk/ is for. */
  async relayTalk(ws, msg, raw, room, seat) {
    const att = ws.deserializeAttachment() || {};
    if (!seat) return send(ws, { t: "talk/error", reason: "not-seated" });
    if (!canTalk(room)) return send(ws, { t: "talk/error", reason: "no-call-here" });
    const bad = checkTalk(msg, typeof raw === "string" ? raw.length : undefined);
    if (bad) return send(ws, { t: "talk/error", reason: bad });

    /* The opt-in flag rides on the socket, which is the only place it can live
       and still vanish when the call does. It is not in the room and not under
       a key that outlives the connection. */
    let mine = att.talk;
    if (msg.t === "talk/hello") mine = { open: true, role: msg.role };
    else if (msg.t === "talk/bye") mine = { open: false };
    const { bucket, allowed } = hit(att.talkRate, Date.now(), TALK_LIMIT, TALK_WINDOW_MS);
    ws.serializeAttachment({ ...att, talk: mine, talkRate: bucket });
    if (!allowed) return send(ws, { t: "talk/error", reason: "too-fast" });

    const targetId = talkTarget(room, seat);
    if (!targetId) return send(ws, { t: "talk/error", reason: "no-peer" });

    const frame = JSON.stringify({ ...msg, from: seat });
    let delivered = 0;
    let refusal = null;
    for (const peer of this.ctx.getWebSockets(targetId)) {
      const theirs = (peer.deserializeAttachment() || {}).talk;
      const no = mayRelay(msg, mine, theirs);
      if (no) { refusal = no; continue; }
      sendRaw(peer, frame);
      delivered++;
    }
    if (!delivered && refusal) return send(ws, { t: "talk/error", reason: refusal });
    if (!delivered && msg.t !== "talk/bye") return send(ws, { t: "talk/error", reason: "peer-away" });
  }

  async webSocketClose() {}
  async webSocketError() {}

  /* Sockets are tagged by player id, so a target is resolved to the ids sitting
     in it: one for a seat, two for a team at a pair table. */
  emit(ev, sender, room) {
    const frame = JSON.stringify(ev.frame);
    if (ev.to === "seat") return sendRaw(sender, frame);
    if (ev.to === "all") { for (const ws of this.ctx.getWebSockets()) sendRaw(ws, frame); return; }
    const ids = ev.to.startsWith("team:")
      ? teamSeats(room.seats, ev.to.slice(5)).map((id) => room.seats[id]).filter(Boolean).map((seat) => seat.id)
      : room.seats[ev.to] ? [room.seats[ev.to].id] : [];
    for (const pid of ids) for (const ws of this.ctx.getWebSockets(pid)) sendRaw(ws, frame);
  }

  /** Report a finished game to the ladder once; broadcast the rating changes. */
  async maybeSettle(room) {
    const out = outcome(room);
    if (!out || room.settled) return;
    let settled;
    try { settled = await this.registry().settle(out); } catch (e) { settled = { rated: false, error: e.message }; }
    const next = { ...room, settled };
    await this.save(next);
    await this.registry().noteGame(summary(next));
    const frame = JSON.stringify({ t: "state", room: next });
    for (const ws of this.ctx.getWebSockets()) sendRaw(ws, frame);
  }

  registry() {
    return this.env.REGISTRY.get(this.env.REGISTRY.idFromName("main"));
  }
}

/** The lobby's view of a game. `black` and `white` stay the lead seats so a
 *  lobby that has never heard of pair go still renders a pair table as a game
 *  between two named people; `teams` carries the rest for one that has. */
function summary(room) {
  const side = (color) => teamSeats(room.seats, color)
    .map((id) => ({ id: room.seats[id].id, name: room.seats[id].name, tint: room.seats[id].tint }));
  return {
    id: room.id, size: room.size, rated: room.rated, pair: isPairRoom(room),
    black: { id: leadSeat(room, "b").id, name: leadSeat(room, "b").name, tint: leadSeat(room, "b").tint },
    white: { id: leadSeat(room, "w").id, name: leadSeat(room, "w").name, tint: leadSeat(room, "w").tint },
    teams: { b: side("b"), w: side("w") },
    phase: room.record.phase, moves: room.record.moves.length, toPlay: room.record.toPlay,
    result: room.record.result, createdAt: room.createdAt, endedAt: room.endedAt, updatedAt: Date.now(),
  };
}

const send = (ws, frame) => sendRaw(ws, JSON.stringify(frame));
function sendRaw(ws, text) {
  try { ws.send(text); } catch { /* closed */ }
}
