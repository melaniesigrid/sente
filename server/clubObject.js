/* ----------------------- CLUB (Durable Object) -----------------------
   One instance per club, named by the club id. It holds the hall from
   `hall.js` in storage, accepts hibernating WebSockets tagged with the
   player id, and does nothing a test cannot already cover: parse a frame,
   `applyHall`, store, broadcast. The Room object is this same shape around a
   board; this one has no board in it.

   It knows nothing about who is a member. A socket is only ever handed to one
   by the Worker, which asks the Registry first and passes the member in a
   header — the same arrangement the Room has with a seat. Nothing in here can
   be reached by somebody the Registry did not vouch for.

   Presence here is a live socket and nothing stored, exactly as in the lobby.
   The difference, and it is the one thing about this that has to be said on
   the screen: `showOnline` does not govern it. A room you walked into is a
   room the people in it can see you in. */

import { DurableObject } from "cloudflare:workers";
import {
  readHall, emptyHall, applyHall, forget, addChannel, renameChannel, removeChannel,
  SAY_LIMIT, SAY_WINDOW_MS,
} from "./hall.js";
import { may } from "./clubs.js";

export class Club extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.hall = null;
    /* How much each player has said lately, in memory. A rate limit that wrote
       to storage would cost a write per sentence, which is the one thing a
       room full of people does constantly. The object is evicted when the room
       goes quiet and the counters go with it, which is the right trade: what
       this exists to stop is a flood in one sitting, and a flood needs the
       room to be awake. */
    this.said = new Map();
  }

  async load(clubId) {
    if (this.hall) return this.hall;
    const raw = await this.ctx.storage.get("hall");
    this.hall = raw ? readHall(raw, clubId) : null;
    return this.hall;
  }

  async save(hall) {
    this.hall = hall;
    await this.ctx.storage.put("hall", hall);
  }

  /* ----- RPC from the Worker and the Registry ----- */

  /** The hall, made if this is the first time anybody has opened it. A club
   *  does not get a hall when it is founded: an object per club that nobody
   *  ever walks into is a cold start and a stored record for nothing. */
  async open(clubId) {
    const had = await this.load(clubId);
    if (had) return had;
    const fresh = emptyHall(clubId);
    await this.save(fresh);
    return fresh;
  }

  /** Every line this player said, gone. Called when somebody leaves Joseki
   *  altogether — never when they leave a club or are shown the door, for the
   *  reason `hall.js` gives at `forget`. */
  async forgetPlayer(playerId) {
    const hall = await this.load(null);
    if (!hall) return false;
    const next = forget(hall, playerId);
    if (next === hall) return false;
    await this.save(next);
    this.tellAll({ t: "hall", hall: next });
    return true;
  }

  /** Everything said here, gone, and everybody standing here told why. Called
   *  when a club is closed.
   *
   *  The FRAME is the contract and the close is hygiene, in that order. That
   *  is not a preference: closing several hibernatable sockets in one call
   *  leaves them half-closed — one closes cleanly, three sit in CLOSING and
   *  never finish, which a three-socket repro found. A client that is told the
   *  room is gone stops on the frame and does not wait to be hung up on, and
   *  the close still goes out for the ordinary single-socket case. */
  async erase() {
    this.tellAll({ t: "closed" });
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.close(4001, "closed"); } catch { /* already closed */ }
    }
    this.hall = null;
    await this.ctx.storage.deleteAll();
    return true;
  }

  /** A change the Registry made that the people standing here should see: a
   *  role named or unnamed, somebody gone, the club renamed. Never a refusal
   *  and never anything about somebody who is not in this club. */
  async announce(frame) {
    this.tellAll(frame);
    /* Somebody who has just been shown the door, or left, is put out of the
       room as well as told: a socket that stayed open would keep receiving a
       conversation they are no longer in. One socket closes cleanly; see the
       note on `erase` for why the frame is what a client should act on. */
    if (frame.t === "left" && frame.who) {
      for (const ws of this.ctx.getWebSockets(frame.who)) {
        try { ws.close(4002, "left"); } catch { /* already closed */ }
      }
    }
    return true;
  }

  /** Add, rename or remove a channel. The Worker has already established that
   *  the caller may keep channels; what is here is the storage. */
  async channel(op, id, name) {
    const hall = await this.open(null);
    const r = op === "add" ? addChannel(hall, id, name)
      : op === "rename" ? renameChannel(hall, id, name)
        : removeChannel(hall, id);
    if (r.error) throw new Error(r.error);
    await this.save(r.hall);
    this.tellAll({ t: "hall", hall: r.hall });
    return r.hall;
  }

  /* ----- sockets ----- */

  async fetch(req) {
    const header = req.headers.get("x-sente-member");
    if (!header) return new Response("not a member", { status: 403 });
    const member = JSON.parse(header);
    const hall = await this.open(member.club);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [member.id]);
    server.serializeAttachment(member);
    send(server, { t: "hall", hall });
    this.tellAll({ t: "here", ids: this.whoIsHere() });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return send(ws, { t: "error", reason: "bad-frame" }); }
    if (msg && msg.t === "ping") return send(ws, { t: "pong" });
    const member = ws.deserializeAttachment();
    const hall = await this.load(member ? member.club : null);
    if (!hall) return send(ws, { t: "error", reason: "no-hall" });
    if (msg && msg.t === "say" && !this.spend(member.id)) {
      return send(ws, { t: "error", reason: "too-much-at-once" });
    }
    const { hall: next, events } = applyHall(hall, member, msg, { now: Date.now(), may });
    if (next !== hall) await this.save(next);
    for (const ev of events) {
      if (ev.to === "actor") send(ws, ev.frame);
      else this.tellAll(ev.frame);
    }
  }

  async webSocketClose() { this.tellAll({ t: "here", ids: this.whoIsHere() }); }
  async webSocketError() { this.tellAll({ t: "here", ids: this.whoIsHere() }); }

  /** Who is standing here, each of them once: one person with two tabs open is
   *  one person in the room. */
  whoIsHere() {
    const ids = new Set();
    for (const ws of this.ctx.getWebSockets()) {
      const m = ws.deserializeAttachment();
      if (m && m.id) ids.add(m.id);
    }
    return [...ids];
  }

  /** Has this player said less than the limit in the last minute? The bucket
   *  is in memory and per object; see the note in the constructor. */
  spend(playerId) {
    const now = Date.now();
    const stamps = (this.said.get(playerId) || []).filter((at) => now - at < SAY_WINDOW_MS);
    if (stamps.length >= SAY_LIMIT) {
      this.said.set(playerId, stamps);
      return false;
    }
    stamps.push(now);
    this.said.set(playerId, stamps);
    return true;
  }

  tellAll(frame) {
    const text = JSON.stringify(frame);
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(text); } catch { /* closed */ }
    }
  }
}

function send(ws, frame) {
  try { ws.send(JSON.stringify(frame)); } catch { /* closed */ }
}
