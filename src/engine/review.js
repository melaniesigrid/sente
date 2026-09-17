/* ----------------------- REVIEW (pure) -----------------------
   Walking back through a finished game. Everything here is derived from the record's
   own move log by replaying it, so a reviewed position is the position that was really
   on the board and not a second, drifting reconstruction of it.

   `replay` already rebuilds a record from a prefix of its log and throws the same
   errors the live transitions do, which is exactly the guarantee review needs: if a
   log has been tampered with, review refuses it rather than drawing a fiction.

   None of this belongs in a view. A move number is a fact about the record, and so is
   which move captured something. */

import { replay, lastMoveIndex, play, pass, resign, timeout, withMoveComment, IllegalMoveError } from "./record.js";
import { idx } from "./board.js";

/* One move onto a position already in hand. `replay` rebuilds from the setup every
   time it is called, which is right for seeking to a position and wrong inside a loop
   that walks the whole game: doing it per move made moveNumbers and captureMoves
   quadratic, about 300ms and 230ms on a 289-move record, and Review pays the first of
   those on every arrow key. This applies exactly the transitions replay applies, in the
   same order, so the positions are identical - only the cost is different. */
function step(cur, mv) {
  let out = cur;
  if (mv.type === "play") out = play(out, mv.c, mv.r, mv.color);
  else if (mv.type === "pass") out = pass(out, mv.color);
  else if (mv.type === "resign") out = resign(out, mv.color);
  else if (mv.type === "timeout") out = timeout(out, mv.color);
  else throw new IllegalMoveError("unknown-move", { move: mv });
  if (mv.comment) out = withMoveComment(out, mv.comment);
  return out;
}

/** Moves that actually sit on the board, ignoring a resignation or a flag, which end
 *  a game without being positions you can stand at. */
export const playedMoves = (rec) => rec.moves.filter((m) => m.type === "play" || m.type === "pass");

/** How many positions there are to stand at: the empty board, plus one per played move. */
export const reviewLength = (rec) => playedMoves(rec).length;

/** Clamp `n` into the range of positions this record has. */
export const clampMove = (rec, n) => Math.max(0, Math.min(reviewLength(rec), Math.trunc(n) || 0));

/** The record as it stood after `n` played moves. `n = 0` is the opening position with
 *  handicap stones already placed; `n = reviewLength(rec)` is the last real position. */
export function atMove(rec, n) {
  return replay(rec, playedMoves(rec).slice(0, clampMove(rec, n)));
}

/** Board index → move number, for the stones still standing after `n` moves.
 *
 *  A point can be played more than once in a long game; the number shown is the move
 *  that put the stone currently there, which is the one a reader is looking for. Stones
 *  that were captured carry no number because they are not on the board to carry one. */
export function moveNumbers(rec, n) {
  const upto = playedMoves(rec).slice(0, clampMove(rec, n));
  const out = new Map();
  let cur = replay(rec, []);
  upto.forEach((mv, i) => {
    cur = step(cur, mv);
    if (mv.type !== "play") return;
    out.set(idx(rec.size, mv.c, mv.r), i + 1);
  });
  // Anything no longer on the board was captured along the way.
  for (const key of [...out.keys()]) if (cur.board.cells[key] === null) out.delete(key);
  return out;
}

/** The move numbers (1-based) at which stones came off the board, with how many went.
 *  This is what "jump to the next capture" scrubs between. */
export function captureMoves(rec) {
  const moves = playedMoves(rec);
  const out = [];
  let prev = replay(rec, []);
  for (let i = 0; i < moves.length; i++) {
    const next = step(prev, moves[i]);
    const taken = (next.captures.b + next.captures.w) - (prev.captures.b + prev.captures.w);
    if (taken > 0) out.push({ move: i + 1, stones: taken, by: moves[i].color });
    prev = next;
  }
  return out;
}

/** The next capture strictly after `n`, or null. */
export const nextCapture = (caps, n) => caps.find((c) => c.move > n) ?? null;
/** The last capture strictly before `n`, or null. */
export const prevCapture = (caps, n) => [...caps].reverse().find((c) => c.move < n) ?? null;

/** Where the stone of move `n` sits, for the marker, or null on a pass. */
export function markerAt(rec, n) {
  return lastMoveIndex(atMove(rec, n));
}

/** One line naming the position, e.g. "Move 42 · Black" or "Start". Passes say so,
 *  because a reader scrubbing past one should not think a stone went missing. */
export function reviewLabel(rec, n) {
  const at = clampMove(rec, n);
  if (at === 0) return "Start";
  const mv = playedMoves(rec)[at - 1];
  const who = mv.color === "b" ? "Black" : "White";
  return mv.type === "pass" ? `Move ${at} · ${who} passes` : `Move ${at} · ${who}`;
}

/* ----------------------- TRYING A LINE -----------------------
   "What if he had answered here instead?" A line is scratch: it is never written
   into the record, never saved with it and never exported, because the game that
   was played is the game that was played. It lives here rather than in a view for
   the ordinary reason - the rules are the engine's - and for one new one: two
   people reading a game together try the same line, and the server that keeps
   them in step has to be able to refuse a move the way the board does. */

/** Begin exploring from move `n` of `rec`. */
export function startLine(rec, n) {
  return { base: clampMove(rec, n), record: atMove(rec, n), moves: [] };
}

/** Play one move into the line. Returns `{ line }` or `{ error }` with the engine's
 *  own reason, never a thrown exception, because a misclick is not exceptional. */
export function playInLine(line, c, r) {
  try {
    const record = play(line.record, c, r);
    return { line: { ...line, record, moves: [...line.moves, { c, r, color: line.record.toPlay }] } };
  } catch (e) {
    if (e instanceof IllegalMoveError) return { error: e.reason };
    throw e;
  }
}

/** Take back the last move of the line. At the branch point this returns null, which
 *  the caller reads as "the line is over, go back to the game". */
export function backInLine(rec, line) {
  if (line.moves.length === 0) return null;
  return lineFrom(rec, line.base, line.moves.slice(0, -1));
}

/** Rebuild a line from the moves it is made of. The wire carries a branch point and
 *  a list of points, never a record, so this is what both ends turn that back into a
 *  position: the server to decide whether the next move is legal, the browser to draw
 *  it. Returns null when a move in the list will not play, which is a tampered or a
 *  stale line rather than a position to show.
 *
 *  A line of no moves is a line: it is the branch point itself, which is where the
 *  first stone of a variation is about to go. */
export function lineFrom(rec, base, moves) {
  let line = startLine(rec, base);
  for (const m of moves) {
    const res = playInLine(line, m.c, m.r);
    if (res.error) return null;
    line = res.line;
  }
  return line;
}

/** Whether a position can be explored at all: a line needs somebody to move, and a
 *  game that has ended is over - you branch from a position inside it, not from the
 *  result. `n` past the last move is clamped by `atMove`, so only the phase matters. */
export function canBranch(rec, n) {
  return atMove(rec, n).phase === "playing" && reviewLength(rec) > 0;
}
