/* ----------------------- SHAPE (pure) -----------------------
   Names the shapes a move just made, so a house player can say something true
   about them. Detection only: what a shape means, and who says it in which
   words, is content (`src/content/commentary.js`), not a rule.

   Everything here is local to the stone just played. There is no board sweep:
   `empty-triangle` and `dumpling` read the four 2x2 windows that contain the
   move, `tigers-mouth` reads the move's empty neighbours. That is O(1) per move
   and it keeps the detector honest - it reports what you just made, never a
   clump you made forty moves ago and have now extended.

   Design notes for the two rules that are easy to get wrong:

   A tiger's mouth is NOT a 2x2 shape. Three same-colour stones inside a 2x2
   with the fourth point empty has exactly one reading and it is the empty
   triangle. A mouth lives on the empty point: stones at (0,0), (2,0) and (1,1)
   around an empty (1,0). The predicate is "exactly one on-board neighbour of P
   is empty and every other is mine" - equivalently, an enemy stone played at P
   would have exactly one liberty. That handles interior, edge and corner with
   no special case, and it excludes both the broken mouth (an enemy stone poked
   into the fourth slot still leaves three friendly neighbours) and the one-point
   eye (no empty neighbour at all), which a plain neighbour count does not.

   A dumpling is structural, not a ratio. Liberties-per-stone does not separate
   it: a 2x2 block in the open centre has 8 liberties over 4 stones, and a
   threshold low enough to be distinctive only catches groups two moves from
   death - which is an atari warning wearing a nicer name, and Joseki takes atari
   hints away as the player improves. The solid 2x2 block is exact and is what
   players mean by a dango. Its four stones are always one chain, since each is
   orthogonally adjacent to two others in the block.

   The two shapes are not mutually exclusive and are not meant to be: a position
   can be both an empty triangle and a tiger's mouth, and both readings are true.
   The selector's severity order decides which one is worth saying. */
import { NBRS, chainAt, idx, inB } from "./board.js";

/** Every shape this module can name. Content must cover all of them.
 *  The order breaks ties between shapes of equal severity, so the more surprising
 *  remark comes first: told you have made a dango, you learn more than being told
 *  about the empty triangle inside it. */
export const SHAPES = ["tigers-mouth", "dumpling", "empty-triangle"];

/** How loud a finding is. Higher wins when two shapes land on one move.
 *  `warn` is reserved: nothing in the first set uses it, and promoting a shape
 *  into it means re-checking every collision below it. */
export const SEVERITY_RANK = { warn: 3, praise: 2, note: 1 };

/** The four 2x2 windows that contain (c, r), as arrays of four points.
 *  Only windows that fit on the board are returned. */
function windowsAt(size, c, r) {
  const out = [];
  for (const r0 of [r - 1, r]) {
    for (const c0 of [c - 1, c]) {
      if (!inB(size, c0, r0) || !inB(size, c0 + 1, r0 + 1)) continue;
      out.push([[c0, r0], [c0 + 1, r0], [c0, r0 + 1], [c0 + 1, r0 + 1]]);
    }
  }
  return out;
}

/** On-board orthogonal neighbours of (c, r). */
function neighbours(size, c, r) {
  const out = [];
  for (const [dx, dy] of NBRS) {
    const nc = c + dx, nr = r + dy;
    if (inB(size, nc, nr)) out.push([nc, nr]);
  }
  return out;
}

/**
 * Name the shapes the move just made.
 *
 * @param {{ size: number, cells: (null|"b"|"w")[] }} board  position AFTER the move
 * @param {{ c: number, r: number }|null} move  the stone just played; null for a
 *        pass, a resignation, or setup stones
 * @param {{ color: "b"|"w", captured?: [number, number][] }} opts
 *        `color` is the colour that played. `captured` is `rec.lastCaptured` and is
 *        unused today; ponnuki is the first shape that will need it.
 * @returns {{ id: string, color: "b"|"w", stones: [number, number][], severity: string }[]}
 *          At most one finding per shape id, in `SHAPES` order.
 */
export function detectShapes(board, move, opts = {}) {
  if (!move || !board) return [];
  const { size, cells } = board;
  const { c, r } = move;
  if (!inB(size, c, r)) return [];
  const color = opts.color ?? cells[idx(size, c, r)];
  if (color !== "b" && color !== "w") return [];

  const at = (x, y) => cells[idx(size, x, y)];
  const out = [];
  // Each loop below breaks after its one find, and the closing SHAPES.map keeps
  // the first of any id, so nothing here needs to dedupe.
  const add = (id, stones, severity) => out.push({ id, color, stones, severity });

  const windows = windowsAt(size, c, r);

  // Empty triangle: a 2x2 holding three of my stones and one empty point.
  for (const win of windows) {
    const mine = win.filter(([x, y]) => at(x, y) === color);
    const empty = win.filter(([x, y]) => at(x, y) === null);
    if (mine.length === 3 && empty.length === 1) { add("empty-triangle", mine, "note"); break; }
  }

  // Dumpling: the move sits in a solid 2x2 block of my own stones.
  for (const win of windows) {
    if (win.every(([x, y]) => at(x, y) === color)) { add("dumpling", win, "note"); break; }
  }

  // Tiger's mouth: an empty neighbour of the move with exactly one empty
  // neighbour of its own, every other neighbour mine. Corners are excluded -
  // a one-stone corner mouth is technically a mouth and rhetorically silly.
  for (const [px, py] of neighbours(size, c, r)) {
    if (at(px, py) !== null) continue;
    const nb = neighbours(size, px, py);
    if (nb.length < 3) continue;
    const empties = nb.filter(([x, y]) => at(x, y) === null);
    if (empties.length !== 1) continue;
    if (!nb.every(([x, y]) => at(x, y) === null || at(x, y) === color)) continue;
    const guards = nb.filter(([x, y]) => at(x, y) === color);
    /* The mouth only bites if the teeth are not the ones in danger. A guard whose
       last liberty IS the mouth point turns an enemy play there from suicide into a
       capture, and the shape becomes the opposite of what it looks like. Praising
       that would make the coach loudest exactly when the player is about to be
       punished, which costs more trust than staying quiet ever does. At most three
       chain floods, and only once a candidate mouth has already been found. */
    if (guards.some(([x, y]) => chainAt(board, x, y).libs.size < 2)) continue;
    add("tigers-mouth", guards, "praise");
    break;
  }

  return SHAPES.map((id) => out.find((f) => f.id === id)).filter(Boolean);
}
