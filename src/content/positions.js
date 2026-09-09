/* ----------------------- POSITIONS -----------------------
   Shared helpers for scripted content: a point literal and the
   setup -> board conversion lessons and problems both use. */
import { createBoard, idx } from "../engine/index.js";

export const pt = (c, r) => ({ c, r });

/** `size` is the lesson's board size; an `info` step may override it with setup.size. */
export function setupToBoard(setup, size = 9) {
  const b = createBoard(setup.size || size);
  (setup.b || []).forEach(p => { b.cells[idx(b.size, p.c, p.r)] = "b"; });
  (setup.w || []).forEach(p => { b.cells[idx(b.size, p.c, p.r)] = "w"; });
  return b;
}
