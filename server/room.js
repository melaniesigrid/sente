/* ----------------------- GAME ROOM (pure) -----------------------
   The wire protocol for one online game, as a reducer over a plain room
   object. The Durable Object is a thin adapter: it parses a socket frame,
   calls `applyMessage`, stores the returned room and broadcasts the returned
   events. Everything a rule could touch goes through the engine's GameRecord,
   so the server refuses exactly the moves the client would.

   A room seats a roster, not two colours. Two seats is an ordinary game; four
   is pair go, where the teams alternate b1 w1 b2 w2 and nobody plays twice
   running. Both are the same code path. The server asks the engine's
   `canSeatPlay` whose turn it is, which is the same call the client greys the
   board with, so the two can never disagree about it.

   Room:
     { id, size, komi, handicap, rated, pair,
       seats: { b1: Player, w1: Player, b2?: Player, w2?: Player },
       record: GameRecord, chat: [{ from, name, text, at }],
       undo: null | { by: SeatId, at }, createdAt, endedAt, settled }

   Client -> server frames (`t` is the type):
     play {c, r} · pass · resign · markDead {c, r} · accept
     undoRequest · undoAccept · undoDecline · chat {text}

   Server -> client frames:
     state {room}   the full room, after every change and on join
     chat {msg}     one new chat line
     undo {status}  "asked" | "declined" for the requester's benefit
     error {reason, detail}

   `applyMessage(room, seat, msg, now)` returns `{ room, events }`. `seat` is a
   seat id ("b1", "w1", "b2", "w2") or null for a spectator. Events are
   `{ to, frame }` where `to` is "all", "seat" (the sender), a seat id, or
   "team:b" / "team:w". A refused action returns the same room and one error
   event. Nothing here throws on bad input. */

import {
  createGame, play, pass, resign, markDead, acceptScore, undo, replay,
  IllegalMoveError, IllegalTransitionError,
} from "../src/engine/record.js";
import {
  createRoster, canSeatPlay, seatToPlay, colorOfSeat, rotationOf, isPair, teamSeats,
} from "../src/engine/rengo.js";
import { hashBoard } from "../src/engine/zobrist.js";
import { lineFrom, playInLine, clampMove, reviewLength, canBranch } from "../src/engine/review.js";

export const SIZES = [9, 13, 19];
export const MAX_CHAT = 240;
export const CHAT_KEEP = 200;
/* How many points one side may have lit at once while reading a game together.
   A pointing hand is a sentence, not a diagram: past a handful of rings nobody
   can tell which stone is being talked about, and the oldest one falls off. */
export const MAX_MARKS = 6;

/** Build a room. `black` and `white` are `{ id, name, tint, rating, rd }`; pass
 *  `blackPartner` and `whitePartner` as well for a pair table, and both must be
 *  given or neither. A team of two against a team of one is not a game.
 *
 *  A pair room is never rated, whoever asks. A win in which a partner played
 *  half the moves is evidence about the pair and not about either player, and
 *  the one place that has to be enforced rather than promised is the server. */
export function createRoom({
  id, size = 9, black, white, blackPartner = null, whitePartner = null,
  rated = true, komi, handicap = 0, now = Date.now(),
}) {
  if (!SIZES.includes(size)) throw new RangeError(`bad size ${size}`);
  const seats = createRoster({
    b1: seat(black), w1: seat(white),
    ...(blackPartner ? { b2: partnerOf(blackPartner, black) } : {}),
    ...(whitePartner ? { w2: partnerOf(whitePartner, white) } : {}),
  });
  const pair = isPair(seats);
  const record = createGame({ size, komi, handicap, players: roomPlayers(seats) });
  return {
    version: 1,
    id, size, komi: record.komi, handicap, pair, rated: pair ? false : rated,
    seats,
    record, chat: [], undo: null, review: null,
    createdAt: now, endedAt: null, settled: null,
  };
}

/* A seat as the room stores it. `kind` and `name` are what the engine's roster
   validates; everything else rides along verbatim. A partner run by a player's
   own browser still sits here as a bot, because that is what it is.

   `runBy` is the player id whose browser answers for a bot seat. Joseki runs no
   KataGo on the server - the network is a file the browser downloads - so an
   online partner is played by the device of the person it is partnering, and
   submitted over their socket like any other move. The cost is stated at the
   table: a team's partner needs that team's device online. */
const seat = (p) => {
  const bot = p.kind === "bot";
  return {
    kind: bot ? "bot" : "human",
    id: p.id, name: p.name, tint: p.tint ?? "eucalyptus",
    rating: p.rating, rd: p.rd,
    ...(p.rank ? { rank: p.rank } : {}),
    // Only a bot has a runner. A person plays their own moves, and a `runBy` on a
    // human seat would hand their chair to their partner - which in pair go is not
    // a convenience, it is the one thing the game forbids.
    ...(bot && p.runBy ? { runBy: p.runBy } : {}),
    ...(p.avatarAt !== undefined ? { avatarAt: p.avatarAt } : {}),
  };
};

/* A partner seat. A bot partner defaults to being run by the browser of the
   player it partners; a human partner is just another person at the board and
   is given no runner at all. */
const partnerOf = (p, lead) => seat(p.kind === "bot" ? { ...p, runBy: p.runBy ?? lead.id } : p);

/** Is this a four-seat table? */
export const isPairRoom = (room) => !!room.pair || isPair(room.seats);

/** A pair table with nobody but people at it: rengo as it is actually played. */
export const isAllHuman = (room) =>
  Object.keys(room.seats).every((id) => room.seats[id].kind === "human");

/** The seat that leads a team: the one an ordinary two-seat room calls "b" or "w". */
export const leadSeat = (room, color) => room.seats[color + "1"];

/** SGF-ish names per colour: a team is its players joined by "&". */
export function roomPlayers(seats) {
  const side = (color) => teamSeats(seats, color).map((id) => seats[id].name).join(" & ");
  return { b: side("b"), w: side("w") };
}

/** Which seat `playerId` holds, or null. A player holds at most one seat: the
 *  same person cannot sit twice at one table, and in pair go they must not:
 *  partners may not consult, and there is nothing to stop a player who holds
 *  both chairs of a team from consulting themselves. */
export function seatOf(room, playerId) {
  for (const id of Object.keys(room.seats)) {
    const s = room.seats[id];
    if (s.kind === "human" && s.id === playerId) return id;
  }
  return null;
}

/** Every seat `playerId` may act in: their own chair, plus any bot seat their
 *  browser is running. Two seats at a pair table, one at an ordinary one. */
export function controls(room, playerId) {
  if (!playerId) return [];
  return Object.keys(room.seats).filter((id) => {
    const s = room.seats[id];
    return s.kind === "human" ? s.id === playerId : s.runBy === playerId;
  });
}

/** The seat a frame from `playerId` should be applied as.
 *
 *  A move is applied as whichever seat is actually to play, when that is a seat
 *  this player controls - so a client never has to say which of its two chairs it
 *  means, and cannot get it wrong. Everything else (chat, resign, the count, an
 *  undo) is applied as their own chair, because those are theirs and not their
 *  partner's. Falling back to the own seat also makes a refusal read correctly:
 *  the error says it is not your turn, rather than that you are nobody. */
export function actingSeat(room, playerId, type) {
  const own = seatOf(room, playerId);
  if (type !== "play" && type !== "pass") return own;
  const up = seatToPlay(room.seats, room.record);
  if (up && controls(room, playerId).includes(up)) return up;
  return own;
}

const err = (reason, detail = {}) => ({ to: "seat", frame: { t: "error", reason, ...detail } });
const state = (room) => ({ to: "all", frame: { t: "state", room } });
const ok = (room, ...events) => ({ room, events: [...events, state(room)] });
const refuse = (room, reason, detail) => ({ room, events: [err(reason, detail)] });
const otherColor = (c) => (c === "b" ? "w" : "b");
/* The opposing team, as an event target. An undo is answered by the other side
   rather than by one named person: at a pair table either opponent may decline,
   because the request is against the team's position and not against a chair. */
const otherTeam = (seatId) => "team:" + otherColor(colorOfSeat(seatId));
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

/** Are these two seats on the same team? */
const sameTeam = (a, b) => colorOfSeat(a) === colorOfSeat(b);

/** How many moves one turn of the table is worth: one at a two-seat table, a
 *  whole rotation at a pair table. */
const undoDepth = (room) =>
  (isPairRoom(room) ? rotationOf(room.seats, room.record.firstToPlay).length : 1);

function finish(room, record, now) {
  const ended = record.phase === "ended" && room.record.phase !== "ended";
  return { ...room, record, undo: null, endedAt: ended ? now : room.endedAt };
}

/* ----------------------- READING IT TOGETHER -----------------------
   What happens after the last stone. A finished game used to end the room: the
   socket stayed open and there was nothing left to say into it, so both players
   left and each read the game alone, on their own screen, at their own move.
   Two people who have just played a game are the two people most likely to have
   something to say about move 74, and they were being sent to separate rooms to
   say it.

   So a room keeps going. One side asks, the other joins, and from then on the
   position on screen is one position: whoever moves the cursor moves it for both
   of them, either may play a stone into the variation, and either may light a
   point up to say "here". It is the same shared-state-through-the-server idea the
   game itself is, and for the same reason - two boards that can disagree will.

     review: { asked, in: [seatId], move, base, line: [{c,r,color}], marks, since }

   `line` is scratch, exactly as it is when one person reads alone: it is never
   written into the record and never exported. It rides as a branch point and a
   list of points rather than a record, and both ends rebuild it with the engine,
   so the server refuses an illegal variation move the same way the board does.

   Marks are the pointing hand. They belong to the position they were made in, so
   moving the cursor clears them: a ring left behind on a board that has moved on
   is a ring on the wrong stone. */

const readers = (room) => (room.review ? room.review.in : []);
const reading = (room, seatId) => readers(room).includes(seatId);
const reviewEvent = (to, status, extra = {}) => ({ to, frame: { t: "review", status, ...extra } });

/** A fresh shared review, opened at the end of the game, which is where both
 *  players are already standing when it opens. */
const openReview = (room, seatId, now) => ({
  asked: seatId, in: [seatId],
  move: reviewLength(room.record), base: reviewLength(room.record),
  line: [], marks: [], since: now,
});

const samePoint = (a, c, r) => a.c === c && a.r === r;

/** The frames a finished game answers. Returns null for anything that is not one
 *  of them, so the ordinary switch can refuse it as it always has. */
function reviewMessage(room, seatId, msg, now) {
  const t = msg.t;
  if (!t.startsWith("review")) return null;
  if (room.record.phase !== "ended") return refuse(room, "not-over");
  const rv = room.review;

  if (t === "reviewAsk") {
    // Asking into a review that is already open is just joining it.
    if (rv && rv.in.length) return ok({ ...room, review: { ...rv, asked: null, in: [...new Set([...rv.in, seatId])] } });
    return ok(
      { ...room, review: openReview(room, seatId, now) },
      reviewEvent(otherTeam(seatId), "asked", { by: seatId }),
    );
  }
  if (t === "reviewJoin") {
    if (!rv) return refuse(room, "no-review");
    if (reading(room, seatId)) return ok(room);
    return ok({ ...room, review: { ...rv, asked: null, in: [...rv.in, seatId] } });
  }
  if (t === "reviewDecline") {
    /* Declining closes the shared room rather than leaving it standing empty
       around one person. The asker can still read the game alone, which is what
       every finished game has always offered and what this does not take away. */
    if (!rv || !rv.asked || sameTeam(rv.asked, seatId)) return refuse(room, "no-review");
    return ok({ ...room, review: null }, reviewEvent(otherTeam(seatId), "declined"));
  }
  if (t === "reviewLeave") {
    if (!rv) return ok(room);
    const left = rv.in.filter((id) => id !== seatId);
    return ok({ ...room, review: left.length ? { ...rv, in: left } : null });
  }

  // Everything below moves what the other person is looking at.
  if (!rv || !reading(room, seatId)) return refuse(room, "no-review");

  if (t === "reviewMove") {
    if (!isInt(msg.n)) return refuse(room, "bad-point");
    const move = clampMove(room.record, msg.n);
    return ok({ ...room, review: { ...rv, move, base: move, line: [], marks: [] } });
  }
  if (t === "reviewTry") {
    if (!isInt(msg.c) || !isInt(msg.r)) return refuse(room, "bad-point");
    if (!canBranch(room.record, rv.base)) return refuse(room, "wrong-phase", { phase: "ended" });
    const from = lineFrom(room.record, rv.base, rv.line);
    if (!from) return refuse(room, "bad-line");
    /* Refused by the engine, and with the engine's own reason, so the board says
       "that point is taken" rather than "no". It is the same `play` the game
       itself went through: a variation is not a place where the rules relax. */
    const res = playInLine(from, msg.c, msg.r);
    if (res.error) return refuse(room, res.error, { c: msg.c, r: msg.r });
    return ok({ ...room, review: { ...rv, line: res.line.moves, marks: [] } });
  }
  if (t === "reviewBack") {
    if (!rv.line.length) return ok(room);
    return ok({ ...room, review: { ...rv, line: rv.line.slice(0, -1) } });
  }
  if (t === "reviewMark") {
    if (!isInt(msg.c) || !isInt(msg.r)) return refuse(room, "bad-point");
    if (msg.c < 0 || msg.r < 0 || msg.c >= room.size || msg.r >= room.size) return refuse(room, "bad-point");
    const had = rv.marks.some((m) => samePoint(m, msg.c, msg.r));
    // Pointing at a lit point puts it out, so the same tap says "here" and "never mind".
    const marks = had
      ? rv.marks.filter((m) => !samePoint(m, msg.c, msg.r))
      : [...rv.marks, { c: msg.c, r: msg.r, by: seatId }].slice(-MAX_MARKS);
    return ok({ ...room, review: { ...rv, marks } });
  }
  return refuse(room, "unknown-type", { type: t });
}

export function applyMessage(room, seatId, msg, now = Date.now()) {
  if (!msg || typeof msg !== "object" || typeof msg.t !== "string") return refuse(room, "bad-frame");
  const t = msg.t;

  if (t === "chat") {
    const text = typeof msg.text === "string" ? msg.text.trim().slice(0, MAX_CHAT) : "";
    if (!text) return refuse(room, "empty-chat");
    const who = seatId ? room.seats[seatId] : msg.from;
    if (!who || typeof who.id !== "string" || typeof who.name !== "string") return refuse(room, "no-sender");
    /* Chat is one room-wide conversation, never a team channel. Partners may not
       consult in pair go, and a private line to your partner is exactly the thing
       that rule forbids, so the protocol simply has nowhere to put one. */
    const line = { from: who.id, name: who.name.slice(0, 24), seat: seatId, text, at: now };
    const chat = [...room.chat, line].slice(-CHAT_KEEP);
    return { room: { ...room, chat }, events: [{ to: "all", frame: { t: "chat", msg: line } }] };
  }

  if (!seatId) return refuse(room, "spectator");
  const rec = room.record;
  /* A finished game is not a closed room. Chat stays open, and so does reading
     the game back together; everything else is over. */
  const shared = reviewMessage(room, seatId, msg, now);
  if (shared) return shared;
  if (rec.phase === "ended") return refuse(room, "game-over");

  switch (t) {
    case "play": {
      if (!isInt(msg.c) || !isInt(msg.r)) return refuse(room, "bad-point");
      /* The seat, not the colour. At a pair table two people share a colour and
         only one of them is to play, so a colour check would let a player move in
         their partner's turn - the one way a four-seat room can go wrong that a
         two-seat room cannot. */
      if (!canSeatPlay(room.seats, rec, seatId)) {
        return refuse(room, "wrong-turn", { expected: seatToPlay(room.seats, rec) });
      }
      const { record, error } = transition(room, (r) => play(r, msg.c, msg.r, colorOfSeat(seatId)));
      if (error) return { room, events: [error] };
      return ok(finish(room, record, now));
    }
    case "pass": {
      /* The engine allows a pass while scoring, because SGFs from other servers
         record one; at a live table it would say nothing and only move the turn,
         so the room refuses it and the two sides mark and accept instead. */
      if (rec.phase !== "playing") return refuse(room, "wrong-phase");
      if (!canSeatPlay(room.seats, rec, seatId)) {
        return refuse(room, "wrong-turn", { expected: seatToPlay(room.seats, rec) });
      }
      const { record, error } = transition(room, (r) => pass(r, colorOfSeat(seatId)));
      if (error) return { room, events: [error] };
      return ok(finish(room, record, now));
    }
    case "resign": {
      // Resigning is a decision for the whole team, and either partner may take it.
      const { record, error } = transition(room, (r) => resign(r, colorOfSeat(seatId)));
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
      // Acceptance is per colour, not per chair: one member of a team accepting
      // binds the team, the same way either of them may resign it.
      const color = colorOfSeat(seatId);
      if (room.accepted && room.accepted !== color) {
        const { record, error } = transition(room, (r) => acceptScore(r));
        if (error) return { room, events: [error] };
        return ok({ ...finish(room, record, now), accepted: null });
      }
      return ok({ ...room, accepted: color });
    }
    /* Taking a move back. At a two-seat table that is one move, asked for while
       the opponent is to play. At a pair table one move is neither enough nor
       meaningful: undoing it would hand the board to your partner in the middle
       of a round nobody has finished. So a pair undo takes back the whole
       rotation and lands the asker back in their own chair, which means it may
       only be asked for while they are to play - the opposite of the two-seat
       rule, and for the same reason underneath it. */
    case "undoRequest": {
      if (rec.phase !== "playing") return refuse(room, "wrong-phase", { phase: rec.phase });
      if (room.undo) return refuse(room, "undo-pending");
      const mine = canSeatPlay(room.seats, rec, seatId);
      if (isPairRoom(room) ? !mine : mine) return refuse(room, "not-your-move");
      if (rec.moves.length < undoDepth(room)) return refuse(room, "nothing-to-undo");
      return ok({ ...room, undo: { by: seatId, at: now } }, { to: "seat", frame: { t: "undo", status: "asked" } });
    }
    case "undoAccept": {
      // Anyone on the other team may answer; nobody may grant their own team's request.
      if (!room.undo || sameTeam(room.undo.by, seatId)) return refuse(room, "no-undo");
      let record = room.record, error = null;
      for (let i = 0; i < undoDepth(room) && !error; i++) {
        const step = transition({ ...room, record }, (r) => undo(r));
        record = step.record;
        error = step.error;
      }
      if (error) return { room: { ...room, undo: null }, events: [error] };
      return ok({ ...room, record, undo: null });
    }
    case "undoDecline": {
      if (!room.undo || sameTeam(room.undo.by, seatId)) return refuse(room, "no-undo");
      return ok({ ...room, undo: null }, { to: otherTeam(seatId), frame: { t: "undo", status: "declined" } });
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

/** Rooms stored before the roster landed are keyed by colour: `{ b, w }`. They
 *  are games that may still be in progress, so they are migrated on read rather
 *  than abandoned - the two chairs become the two lead seats, which is what they
 *  always were. Written back on the next move like any other change. */
function migrateSeats(raw) {
  if (!raw.seats || raw.seats.b1) return raw;
  if (!raw.seats.b || !raw.seats.w) return null;
  const lift = (p) => ({ kind: "human", ...p });
  return { ...raw, pair: false, seats: { b1: lift(raw.seats.b), w1: lift(raw.seats.w) } };
}

/** Read a stored room back. The board is trusted only once it agrees with the
 *  move log; if it does not, the log is the source of truth and the record is
 *  rebuilt from it. A log that will not replay is discarded. */
export function reviveRoom(input) {
  if (!input || input.version !== 1 || !input.record || !Array.isArray(input.record.moves)) return null;
  const raw = migrateSeats(input);
  if (!raw) return null;
  if (consistent(raw.record)) return raw;
  try {
    const record = replay(raw.record);
    // Replay does not carry the scoring-phase marks or the result; restore them.
    return { ...raw, record: { ...record, dead: raw.record.dead ?? [], phase: raw.record.phase, result: raw.record.result ?? null } };
  } catch { return null; }
}

/** What the ladder needs from a finished room, or null while it is still going.
 *
 *  `black` and `white` are the lead seats, and at a pair table `rated` is false,
 *  so the ladder is handed a game it will decline to rate rather than a game it
 *  rates against the wrong two people. */
export function outcome(room) {
  if (room.record.phase !== "ended" || !room.record.result) return null;
  const { winner, method } = room.record.result;
  return {
    id: room.id, rated: isPairRoom(room) ? false : room.rated, winner, method,
    black: leadSeat(room, "b").id, white: leadSeat(room, "w").id, size: room.size,
    ...(isPairRoom(room) ? { pair: true, seated: Object.keys(room.seats).map((k) => room.seats[k].id) } : {}),
  };
}
