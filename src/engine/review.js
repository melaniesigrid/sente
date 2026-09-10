/* ----------------------- REVIEW (pure) -----------------------
   Walking back through a finished game. Everything here is derived from the record's
   own move log by replaying it, so a reviewed position is the position that was really
   on the board and not a second, drifting reconstruction of it.

   `replay` already rebuilds a record from a prefix of its log and throws the same
   errors the live transitions do, which is exactly the guarantee review needs: if a
   log has been tampered with, review refuses it rather than drawing a fiction.

   None of this belongs in a view. A move number is a fact about the record, and so is
   which move captured something. */

import { replay, lastMoveIndex } from "./record.js";
import { idx } from "./board.js";

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
    cur = replay(rec, upto.slice(0, i + 1));
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
    const next = replay(rec, moves.slice(0, i + 1));
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
