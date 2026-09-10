/* ----------------------- GAME ROOM (pure) -----------------------
   The wire protocol for one online game, as a reducer over a plain room
   object. The Durable Object is a thin adapter: it parses a socket frame,
   calls `applyMessage`, stores the returned room and broadcasts the returned
   events. Everything a rule could touch goes through the engine's GameRecord,
   so the server refuses exactly the moves the client would.

   Room:
     { id, size, komi, handicap, rated, seats: { b: Player, w: Player },
       record: GameRecord, chat: [{ from, name, text, at }],
       undo: null | { by: "b"|"w", at }, createdAt, endedAt, settled }

   Client -> server frames (`t` is the type):
     play {c, r} · pass · resign · markDead {c, r} · accept
     undoRequest · undoAccept · undoDecline · chat {text}

   Server -> client frames:
     state {room}   the full room, after every change and on join
     chat {msg}     one new chat line
     undo {status}  "asked" | "declined" for the requester's benefit
     error {reason, detail}

   `applyMessage(room, seat, msg, now)` returns `{ room, events }`. `seat` is
   "b", "w" or null for a spectator. Events are `{ to: "all"|"b"|"w"|"seat"
   , frame }`; "seat" means the sender. A refused action returns the same
   room and one error event. Nothing here throws on bad input. */

import {
  createGame, play, pass, resign, markDead, acceptScore, undo, replay,
  IllegalMoveError, IllegalTransitionError,
} from "../src/engine/record.js";
import { hashBoard } from "../src/engine/zobrist.js";

export const SIZES = [9, 13, 19];
export const MAX_CHAT = 240;
export const CHAT_KEEP = 200;

/** Build a room for two seated players. `players` are `{ id, name, tint, rating, rd }`. */
export function createRoom({ id, size = 9, black, white, rated = true, komi, handicap = 0, now = Date.now() }) {
  if (!SIZES.includes(size)) throw new RangeError(`bad size ${size}`);
  const record = createGame({ size, komi, handicap, players: { b: black.name, w: white.name } });
  return {
    version: 1,
    id, size, komi: record.komi, handicap, rated,
    seats: { b: seat(black), w: seat(white) },
    record, chat: [], undo: null,
    createdAt: now, endedAt: null, settled: null,
  };
}

const seat = (p) => ({ id: p.id, name: p.name, tint: p.tint ?? "eucalyptus", rating: p.rating, rd: p.rd });

/** Which seat `playerId` holds, or null. */
export function seatOf(room, playerId) {
  if (room.seats.b.id === playerId) return "b";
  if (room.seats.w.id === playerId) return "w";
  return null;
}

const err = (reason, detail = {}) => ({ to: "seat", frame: { t: "error", reason, ...detail } });
const state = (room) => ({ to: "all", frame: { t: "state", room } });
const ok = (room, ...events) => ({ room, events: [...events, state(room)] });
const refuse = (room, reason, detail) => ({ room, events: [err(reason, detail)] });
const other = (c) => (c === "b" ? "w" : "b");
const isInt = (n) => Number.isInteger(n);

/** Wrap an engine transition: illegal moves and transitions become error events. */
function transition(room, fn) {
  try {
    return { record: fn(room.record), error: null };
  } catch (e) {
    if (e instanceof IllegalMoveError) return { record: null, error: err(e.reason, { c: e.c, r: e.r }) };
    if (e instanceof IllegalTransitionError) return { record: null, error: err("wrong-phase", { phase: e.phase }) };
    throw e;
  }
}

function finish(room, record, now) {
  const ended = record.phase === "ended" && room.record.phase !== "ended";
  return { ...room, record, undo: null, endedAt: ended ? now : room.endedAt };
}

export function applyMessage(room, seatColor, msg, now = Date.now()) {
  if (!msg || typeof msg !== "object" || typeof msg.t !== "string") return refuse(room, "bad-frame");
  const t = msg.t;

  if (t === "chat") {
    const text = typeof msg.text === "string" ? msg.text.trim().slice(0, MAX_CHAT) : "";
    if (!text) return refuse(room, "empty-chat");
    const who = seatColor ? room.seats[seatColor] : msg.from;
    if (!who || typeof who.id !== "string" || typeof who.name !== "string") return refuse(room, "no-sender");
    const line = { from: who.id, name: who.name.slice(0, 24), seat: seatColor, text, at: now };
    const chat = [...room.chat, line].slice(-CHAT_KEEP);
    return { room: { ...room, chat }, events: [{ to: "all", frame: { t: "chat", msg: line } }] };
  }

  if (!seatColor) return refuse(room, "spectator");
  const rec = room.record;
  if (rec.phase === "ended" && t !== "chat") return refuse(room, "game-over");

  switch (t) {
    case "play": {
      if (!isInt(msg.c) || !isInt(msg.r)) return refuse(room, "bad-point");
      if (rec.toPlay !== seatColor) return refuse(room, "wrong-turn", { expected: rec.toPlay });
      const { record, error } = transition(room, (r) => play(r, msg.c, msg.r, seatColor));
      if (error) return { room, events: [error] };
      return ok(finish(room, record, now));
    }
    case "pass": {
      if (rec.toPlay !== seatColor) return refuse(room, "wrong-turn", { expected: rec.toPlay });
      const { record, error } = transition(room, (r) => pass(r, seatColor));
      if (error) return { room, events: [error] };
      return ok(finish(room, record, now));
    }
    case "resign": {
      const { record, error } = transition(room, (r) => resign(r, seatColor));
      if (error) return { room, events: [error] };
      return ok(finish(room, record, now));
    }
    case "markDead": {
      if (!isInt(msg.c) || !isInt(msg.r)) return refuse(room, "bad-point");
      const { record, error } = transition(room, (r) => markDead(r, msg.c, msg.r));
      if (error) return { room, events: [error] };
      // A new marking withdraws any standing acceptance: both must agree on the same map.
      return ok({ ...room, record, accepted: null });
    }
    case "accept": {
      if (rec.phase !== "scoring") return refuse(room, "wrong-phase", { phase: rec.phase });
      // The first acceptance waits for the other side; the second settles it.
      if (room.accepted && room.accepted !== seatColor) {
        const { record, error } = transition(room, (r) => acceptScore(r));
        if (error) return { room, events: [error] };
        return ok({ ...finish(room, record, now), accepted: null });
      }
      return ok({ ...room, accepted: seatColor });
    }
    case "undoRequest": {
      if (rec.phase !== "playing") return refuse(room, "wrong-phase", { phase: rec.phase });
      if (room.undo) return refuse(room, "undo-pending");
      // You can only ask for your own last move back, i.e. while the other side is to play.
      if (rec.toPlay === seatColor) return refuse(room, "not-your-move");
      if (!rec.moves.length) return refuse(room, "nothing-to-undo");
      return ok({ ...room, undo: { by: seatColor, at: now } }, { to: "seat", frame: { t: "undo", status: "asked" } });
    }
    case "undoAccept": {
      if (!room.undo || room.undo.by === seatColor) return refuse(room, "no-undo");
      const { record, error } = transition(room, (r) => undo(r));
      if (error) return { room: { ...room, undo: null }, events: [error] };
      return ok({ ...room, record, undo: null });
    }
    case "undoDecline": {
      if (!room.undo || room.undo.by === seatColor) return refuse(room, "no-undo");
      return ok({ ...room, undo: null }, { to: other(seatColor), frame: { t: "undo", status: "declined" } });
    }
    default:
      return refuse(room, "unknown-type", { type: t });
  }
}

/** Does the stored board agree with the stored move log? Two constant-ish checks:
 *  the board must hash to the head of the hash list, and the hash list must be
 *  exactly one longer than the number of stones played (passes and resignations
 *  add no position). Cheap enough to run on every load, unlike a full replay,
 *  whose cost grows with the length of the game. */
function consistent(rec) {
  if (!Array.isArray(rec.hashes) || !rec.hashes.length || !rec.board || !Array.isArray(rec.board.cells)) return false;
  if (rec.board.cells.length !== rec.size * rec.size) return false;
  let plays = 0;
  for (const mv of rec.moves) if (mv && mv.type === "play") plays += 1;
  if (rec.hashes.length !== plays + 1) return false;
  return hashBoard(rec.board) === rec.hashes[rec.hashes.length - 1];
}

/** Read a stored room back. The board is trusted only once it agrees with the
 *  move log; if it does not, the log is the source of truth and the record is
 *  rebuilt from it. A log that will not replay is discarded. */
export function reviveRoom(raw) {
  if (!raw || raw.version !== 1 || !raw.record || !Array.isArray(raw.record.moves)) return null;
  if (consistent(raw.record)) return raw;
  try {
    const record = replay(raw.record);
    // Replay does not carry the scoring-phase marks or the result; restore them.
    return { ...raw, record: { ...record, dead: raw.record.dead ?? [], phase: raw.record.phase, result: raw.record.result ?? null } };
  } catch { return null; }
}

/** What the ladder needs from a finished room, or null while it is still going. */
export function outcome(room) {
  if (room.record.phase !== "ended" || !room.record.result) return null;
  const { winner, method } = room.record.result;
  return { id: room.id, rated: room.rated, winner, method, black: room.seats.b.id, white: room.seats.w.id, size: room.size };
}
