/* ----------------------- POSITIONS -----------------------
   Shared helpers for scripted content: a point literal and the
   setup -> board conversion lessons and problems both use. */
import { createBoard, idx } from "../engine/index.js";

export const pt = (c, r) => ({ c, r });

export function setupToBoard(setup) {
  const b = createBoard(setup.size || 9);
  (setup.b || []).forEach(p => { b.cells[idx(b.size, p.c, p.r)] = "b"; });
  (setup.w || []).forEach(p => { b.cells[idx(b.size, p.c, p.r)] = "w"; });
  return b;
}
