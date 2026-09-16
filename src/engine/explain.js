/* ----------------------- EXPLAINING A MOVE (pure) -----------------------
   What can honestly be said about one stone, read off the board and nothing
   else. A trainer that explains every move needs facts to explain it with, and
   every fact here is one the engine can check: which line the stone is on, whether
   it touched anything, what it put in atari, what it captured, whether it left its
   own chain short of breath, which shape it made.

   Nothing here is an opinion. "This is the vital point" is not a fact the board
   holds, so it is not in this file; the network's policy is the only opinion the
   trainer is allowed, and it arrives from outside as `policy`. The words themselves
   live in `src/content/sensei.js`: this file decides what is true, that one decides
   what is worth saying about it and in whose voice. */

import { NBRS, idx, inB, chainAt } from "./board.js";
import { chainsInAtari, opponent } from "./rules.js";
import { detectShapes } from "./shape.js";
import { relationsAt } from "./relations.js";

/** How far through a game a move count is, as a share of the board's points.
 *  The boundaries are conventions, not measurements: on 19x19 the opening is
 *  usually over by move forty and the endgame under way by two hundred. */
export const PHASE_AT = { middle: 0.12, endgame: 0.55 };

export function phaseOf(moveNumber, size) {
  const share = moveNumber / (size * size);
  return share < PHASE_AT.middle ? "opening" : share < PHASE_AT.endgame ? "middle" : "endgame";
}

/** 1-based line from the nearest edge: the first line is the edge itself. */
export const lineOf = (size, c, r) => Math.min(c, r, size - 1 - c, size - 1 - r) + 1;

/** Corner, side or centre. A corner is inside the fourth line on both axes; a
 *  side inside it on one. On 9x9 the third line is the corner's limit, because
 *  a fourth-line move there is already halfway across the board. */
export function regionOf(size, c, r) {
  const reach = size >= 13 ? 4 : 3;
  const dc = Math.min(c, size - 1 - c), dr = Math.min(r, size - 1 - r);
  if (dc < reach && dr < reach) return "corner";
  if (dc < reach || dr < reach) return "side";
  return "centre";
}

/** Chebyshev distance between two points, or null when either is a pass. */
export const distance = (a, b) => (a && b ? Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) : null);

/** Everything the board says about the stone that turned `before` into `after`.
 *
 *  @param {object} before   the GameRecord the move was played into
 *  @param {object} after    the GameRecord the engine produced for it
 *  @param {[number, number]|null} move   the point, or null for a pass
 *  @returns {object} facts; see the fields below. A pass is `{ pass: true, ... }`. */
export function describeMove(before, after, move) {
  const size = before.board.size;
  const color = before.toPlay;
  const moveNumber = after.moves.length;
  const phase = phaseOf(moveNumber, size);
  const last = before.moves.length ? before.moves[before.moves.length - 1] : null;
  const lastPoint = last && last.type === "play" ? [last.c, last.r] : null;
  if (!move) return { pass: true, color, moveNumber, phase, size, oppPassed: !!(last && last.type === "pass") };

  const [c, r] = move;
  const enemy = opponent(color);
  const cellsBefore = before.board.cells;
  const at = (x, y) => (inB(size, x, y) ? cellsBefore[idx(size, x, y)] : undefined);

  // What the stone touched, read on the board it landed on.
  let contact = 0, ownNeighbours = 0, emptyNeighbours = 0;
  const ownChainsBefore = new Set();
  let escaped = false;
  for (const [dx, dy] of NBRS) {
    const x = c + dx, y = r + dy;
    const cell = at(x, y);
    if (cell === undefined) continue;
    if (cell === enemy) contact++;
    else if (cell === color) {
      ownNeighbours++;
      const ch = chainAt(before.board, x, y);
      ownChainsBefore.add([...ch.stones].map(([a, b]) => idx(size, a, b)).sort()[0]);
      if (ch.libs.size === 1) escaped = true;
    } else emptyNeighbours++;
  }

  const own = chainAt(after.board, c, r);
  const libsAfter = own.libs.size;
  // A stone that walked out of atari but is still short of breath did not escape.
  if (escaped && libsAfter < 2) escaped = false;

  const atariBefore = chainsInAtari(before.board, enemy).length;
  const atariAfter = chainsInAtari(after.board, enemy).length;
  const captured = after.lastCaptured.length;

  return {
    pass: false, color, moveNumber, phase, size, c, r,
    line: lineOf(size, c, r),
    region: regionOf(size, c, r),
    contact,                                  // enemy stones touched
    connects: ownChainsBefore.size >= 2,      // joined two of my own chains
    extends: ownChainsBefore.size === 1,      // grew one of my own chains
    lonely: ownNeighbours === 0 && contact === 0,  // nothing adjacent at all
    libs: libsAfter,                          // my chain's liberties after the move
    selfAtari: libsAfter === 1,
    escaped,                                  // took a chain of mine out of atari
    ataris: Math.max(0, atariAfter - atariBefore),  // enemy chains newly in atari
    captured,
    ko: after.koPoint !== null && after.koPoint !== undefined,
    tenuki: lastPoint ? distance(lastPoint, move) > 4 : false,
    near: lastPoint ? distance(lastPoint, move) : null,
    shapes: detectShapes(after.board, { c, r }, { color, captured: after.lastCaptured }).map((s) => s.id),
    // The teacher's wider vocabulary: the jump, the keima, the hane, the cut. The
    // house players do not use it; the trainer names what you played.
    relations: relationsAt(after.board, { c, r }, { color, captured: after.lastCaptured }),
  };
}

/** What the network's shortlist says about a move that was played: where it stood
 *  in the list, how likely the network thought it, and the top choice. The list is
 *  `top` as `choosePolicyMove` reports it, best first.
 *  @returns {{ rank: number|null, prob: number|null, best: [number,number]|null, bestProb: number|null }} */
export function policyStanding(top, move) {
  if (!top || !top.length) return { rank: null, prob: null, best: null, bestProb: null };
  const same = (a, b) => (a === null || b === null ? a === b : a[0] === b[0] && a[1] === b[1]);
  const i = top.findIndex((t) => same(t.move, move));
  return {
    rank: i >= 0 ? i + 1 : null,
    prob: i >= 0 ? top[i].prob : null,
    best: top[0].move,
    bestProb: top[0].prob,
  };
}
