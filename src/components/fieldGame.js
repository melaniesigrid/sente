import { createBoard, tryPlay, aiChooseMove } from "../engine/index.js";

/* ----------------------- THE GAME UNDER THE PAGE -----------------------
   The front door's background is a real game. This is the stepping of it,
   kept out of the component so it can be tested without a renderer and so
   the component is left doing nothing but drawing.

   It is the same three engine calls the house players use. Nothing here
   decides a rule: `tryPlay` says what is legal and this only walks forward.

   The field is 19 lines because that is the board the page is talking about,
   and because a nine-line game is over before it has covered any ground. */

export const FIELD_N = 19;

/* How far in the position is before it is shown. Below about fifty moves a
   19x19 board is four corners and a lot of nothing, which reads as a mistake
   rather than as a game; past two hundred the engine is filling dame and the
   pattern stops changing. */
export const SETTLED = 64;
export const LONGEST = 190;

/** An empty board, black to play. */
export function freshField() {
  return { board: createBoard(FIELD_N), ko: null, turn: "b", n: 0, passes: 0 };
}

/** One move on. A refused or absent move counts as a pass, so a game that has
 *  nowhere left to go ends rather than spinning. */
export function stepField(s) {
  const other = s.turn === "b" ? "w" : "b";
  const mv = aiChooseMove(s.board, s.turn, s.ko, s.n);
  if (!mv) return { ...s, turn: other, passes: s.passes + 1 };
  const res = tryPlay(s.board, mv[0], mv[1], s.turn, { koPoint: s.ko });
  if (!res.ok) return { ...s, turn: other, passes: s.passes + 1 };
  return { board: res.board, ko: res.ko, turn: other, n: s.n + 1, passes: 0 };
}

/** True once the position has run its course and a new game should be dealt. */
export function fieldSpent(s) {
  return s.passes >= 2 || s.n >= LONGEST;
}

/** Walk a state forward by at most `moves`, stopping early if it is spent.
 *  The seed is taken in chunks across frames rather than in one go, so the
 *  work never lands in the same frame as the page's first paint. */
export function advanceField(s, moves) {
  let out = s;
  for (let i = 0; i < moves && !fieldSpent(out); i++) out = stepField(out);
  return out;
}

/** The stones that were on `before` and are not on `after`: a capture, as
 *  drawing instructions. The field draws them for one beat on their way off
 *  the board, because stones coming off is the one moment in a game of go that
 *  a passer-by recognises, and a decoration that skips it is a decoration that
 *  has thrown away the best thing it had.
 *
 *  It compares two positions rather than reading the engine's own capture list
 *  on purpose: the field is drawn from a board and this is a fact about the
 *  two boards, so it cannot fall out of step with what is on screen. A point
 *  that changed colour counts as a departure too, which on a real board it is:
 *  a stone came off it, and another went down. */
export function departed(before, after) {
  const out = [];
  if (!before || !after || before.cells.length !== after.cells.length) return out;
  for (let i = 0; i < before.cells.length; i++) {
    const was = before.cells[i];
    if (!was || after.cells[i] === was) continue;
    out.push({ i, c: i % before.size, r: Math.floor(i / before.size), colour: was });
  }
  return out;
}

/** Every stone on the board, as drawing instructions and nothing else. */
export function fieldStones(board) {
  const out = [];
  for (let i = 0; i < board.cells.length; i++) {
    const colour = board.cells[i];
    if (!colour) continue;
    out.push({ i, c: i % board.size, r: Math.floor(i / board.size), colour });
  }
  return out;
}
