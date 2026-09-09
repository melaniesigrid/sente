/* ----------------------- RULES (pure) -----------------------
   One entry point, `tryPlay`, that either produces the next board or names why it
   cannot. Reasons: `offboard | occupied | ko | suicide | superko`. Simple ko is caught
   by `koPoint` (cheap, no history needed); positional superko is caught by comparing
   the would-be position's Zobrist hash against `history`. */

import { NBRS, idx, inB, chainAt } from "./board.js";
import { hashBoard, xorStone } from "./zobrist.js";

export const REASONS = ["offboard", "occupied", "ko", "suicide", "superko"];

export const opponent = (color) => (color === "b" ? "w" : "b");

const hasHash = (history, h) => {
  if (!history) return false;
  if (typeof history.has === "function") return history.has(h);
  return history.includes(h);
};

/** Attempt a move at (c, r) for `color`.
 *  @param {object} board        `{size, cells}`
 *  @param {object} [opts]
 *  @param {number|null} [opts.koPoint]  index that simple ko forbids this turn
 *  @param {Set<number>|number[]} [opts.history]  hashes of every earlier position (superko)
 *  @param {number} [opts.hash]  hash of `board`, if the caller already has it
 *  @returns {{ok:true, board, captured:number[][], ko:number|null, hash:number} |
 *            {ok:false, reason:string}} */
export function tryPlay(board, c, r, color, opts = {}) {
  const { size } = board;
  const { koPoint = null, history = null } = opts;
  if (!inB(size, c, r)) return { ok: false, reason: "offboard" };
  const i = idx(size, c, r);
  if (board.cells[i] !== null) return { ok: false, reason: "occupied" };
  if (koPoint === i) return { ok: false, reason: "ko" };

  const opp = opponent(color);
  const cells = board.cells.slice();
  cells[i] = color;
  const nb = { size, cells };
  let hash = xorStone(opts.hash ?? hashBoard(board), size, i, color);

  const captured = [];
  for (const [dx, dy] of NBRS) {
    const nx = c + dx, ny = r + dy;
    if (!inB(size, nx, ny) || cells[idx(size, nx, ny)] !== opp) continue;
    const ch = chainAt(nb, nx, ny);
    if (ch.libs.size === 0) {
      for (const [sx, sy] of ch.stones) {
        const si = idx(size, sx, sy);
        if (cells[si] === opp) {
          cells[si] = null;
          hash = xorStone(hash, size, si, opp);
          captured.push([sx, sy]);
        }
      }
    }
  }

  const mine = chainAt(nb, c, r);
  if (mine.libs.size === 0) return { ok: false, reason: "suicide" };
  if (hasHash(history, hash)) return { ok: false, reason: "superko" };

  let ko = null;
  if (captured.length === 1 && mine.stones.length === 1 && mine.libs.size === 1) {
    ko = idx(size, captured[0][0], captured[0][1]);
  }
  return { ok: true, board: nb, captured, ko, hash };
}

/** Every legal move for `color` as `[c, r]` pairs. */
export function legalMoves(board, color, opts = {}) {
  const out = [];
  const hash = opts.hash ?? hashBoard(board);
  for (let r = 0; r < board.size; r++) for (let c = 0; c < board.size; c++) {
    if (tryPlay(board, c, r, color, { ...opts, hash }).ok) out.push([c, r]);
  }
  return out;
}
