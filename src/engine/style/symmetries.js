/* ----------------------- BOARD SYMMETRIES (pure) -----------------------
   The eight symmetries of the square board, numbered 0..7 as three bits:

     bit 0  transpose (swap column and row)
     bit 1  mirror columns (c -> N-1-c)
     bit 2  mirror rows    (r -> N-1-r)

   `transformPoint` applies the transpose first, then the mirrors. A position's
   canonical form is the transform whose hash is smallest, so a master's opening book
   can be keyed once and looked up from any of the eight orientations. Only the board
   is hashed (positional hashes ignore the side to move); a book key adds it back. */

import { colRow, idx } from "../board.js";
import { hashBoard } from "../zobrist.js";

export const TRANSFORMS = [0, 1, 2, 3, 4, 5, 6, 7];

/** Map (c, r) on an N x N board through transform `t`. */
export function transformPoint(t, c, r, N) {
  if (t & 1) [c, r] = [r, c];
  if (t & 2) c = N - 1 - c;
  if (t & 4) r = N - 1 - r;
  return [c, r];
}

/** The transform that undoes `t`: mirrors are their own inverse but must run
 *  before the transpose, which is the same as swapping the two mirror bits when the
 *  transpose bit is set. */
export function inverseTransform(t) {
  if (!(t & 1)) return t;
  const flipC = (t >> 1) & 1, flipR = (t >> 2) & 1;
  return 1 | (flipR << 1) | (flipC << 2);
}

/** The board seen through transform `t`. */
export function transformBoard(board, t) {
  const { size, cells } = board;
  if (t === 0) return board;
  const out = Array(cells.length).fill(null);
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === null) continue;
    const [c, r] = colRow(size, i);
    const [tc, tr] = transformPoint(t, c, r, size);
    out[idx(size, tc, tr)] = cells[i];
  }
  return { size, cells: out };
}

/** Smallest hash over the eight orientations and the transform that produced it.
 *  A symmetric position ties between transforms; the lowest `t` wins, and because
 *  every tying transform maps the position onto itself, undoing any of them lands
 *  the book's move on a point that is equivalent under the symmetry. */
export function canonical(board) {
  let best = null;
  for (const t of TRANSFORMS) {
    const hash = hashBoard(transformBoard(board, t));
    if (best === null || hash < best.hash) best = { hash, t };
  }
  return best;
}

/** Book key for a position: the canonical hash plus the side to move. */
export const bookKey = (hash, toPlay) => `${toPlay}${hash.toString(36)}`;

/** Take a move stored in canonical orientation back to the real board. */
export function fromCanonical(t, c, r, N) {
  return transformPoint(inverseTransform(t), c, r, N);
}
