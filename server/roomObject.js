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
    await this.maybeSettle(next);
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
      ? teamSeats(room.seats, ev.to.slice(5)).map((id) => room.seats[id].id)
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
