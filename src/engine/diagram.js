/* ----------------------- THE DIAGRAM ATOM (pure) -----------------------
   One position, small enough to put in a letter and render on a card, and
   complete enough that a move played on it can be judged by the same rules
   kernel the board uses.

   THE WHOLE BOARD, AND A CROP TO LOOK THROUGH IT
   The obvious shape for a shareable corner is the corner: a handful of stones
   and the rectangle they sit in. That shape cannot be played on. Go's rules
   are not local — the liberties of a chain that leaves the rectangle are
   outside it, and so capture, suicide and ko are all undecidable from the
   fragment alone. A cropped position is a picture of a position and not a
   position.

   So an atom carries `cells` for the whole board, exactly the shape the
   engine already uses (`{size, cells}`), and `bounds` is a viewport: what to
   draw, never what to compute with. `playOn` does not consult it.

   THE ORDER OF THE FIELDS IS THE ORDER OF THE CONCERNS
   `size` and `cells` are the position. `toPlay` is whose turn it is, which a
   diagram needs and a board does not carry. `bounds` is presentation.

   WHAT IS NOT HERE
   No comment, no label, no move number, no game id. An atom is a position and
   the things said about it belong to whatever is carrying it — a letter, a
   roll row, a hall message. Keeping those out is what lets one atom be shown
   in three places without three shapes. */

import { idx, inB, colRow, createBoard, withStone } from "./board.js";
import { tryPlay, opponent } from "./rules.js";
import { replay } from "./record.js";
import { parseSgf, pointToSgf, pointFromSgf } from "./sgf.js";

/** How many lines of empty board to leave around the stones by default. Two
 *  is enough that a shape reads as sitting in a corner rather than jammed
 *  against the edge of the picture, and small enough that a 3-4 point and a
 *  star point still land on one card. */
export const DEFAULT_PAD = 2;

/** The smallest rectangle holding every stone, grown by `pad` and clipped to
 *  the board. INCLUSIVE on all four sides: `c0` and `c1` are both columns you
 *  draw, so a one-stone diagram with pad 0 is `c0 === c1`.
 *
 *  An empty board has no stones to bound, so it bounds the whole board rather
 *  than an empty rectangle: the honest crop of "nothing yet" is the board. */
export function boundsOf(cells, size, pad = DEFAULT_PAD) {
  let c0 = size, r0 = size, c1 = -1, r1 = -1;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === null) continue;
    const [c, r] = colRow(size, i);
    if (c < c0) c0 = c;
    if (c > c1) c1 = c;
    if (r < r0) r0 = r;
    if (r > r1) r1 = r;
  }
  if (c1 < 0) return { c0: 0, r0: 0, c1: size - 1, r1: size - 1 };
  const p = Math.max(0, Math.floor(Number(pad)) || 0);
  return {
    c0: Math.max(0, c0 - p),
    r0: Math.max(0, r0 - p),
    c1: Math.min(size - 1, c1 + p),
    r1: Math.min(size - 1, r1 + p),
  };
}

/** How many lines wide and tall a crop is. Inclusive bounds, so both ends
 *  count. */
export const boundsSize = (b) => ({ w: b.c1 - b.c0 + 1, h: b.r1 - b.r0 + 1 });

/** Is this point inside the crop? Used by the renderer and by nothing that
 *  decides legality. */
export const inBounds = (b, c, r) => c >= b.c0 && c <= b.c1 && r >= b.r0 && r <= b.r1;

/** An atom from a board and whose turn it is. `bounds` is computed unless one
 *  is handed in, so the common case never has to think about it. */
export function diagramOf(board, toPlay = "b", opts = {}) {
  const { pad = DEFAULT_PAD, bounds = null } = opts;
  return {
    size: board.size,
    cells: board.cells.slice(),
    toPlay: toPlay === "w" ? "w" : "b",
    bounds: bounds ?? boundsOf(board.cells, board.size, pad),
  };
}

/** The position a game record stood in after `moveNo` moves, as an atom.
 *
 *  `moveNo` is a count and not an index: 0 is the setup before anybody moved,
 *  and `rec.moves.length` is the position now. Out of range clamps rather than
 *  throwing — a letter written about move 40 of a game that was later taken
 *  back to move 30 should still open. */
export function diagramAt(rec, moveNo = rec.moves.length, opts = {}) {
  const n = Math.max(0, Math.min(Math.floor(Number(moveNo) || 0), rec.moves.length));
  const at = n === rec.moves.length ? rec : replay(rec, rec.moves.slice(0, n));
  return diagramOf(at.board, at.toPlay, opts);
}

/** Play a move on an atom.
 *
 *  This is the whole reason an atom carries the whole board. The rules kernel
 *  is handed the position exactly as it would be handed a game's, so a reply
 *  to a letter is judged by the same code as a move at a table: same capture,
 *  same suicide rule, same simple ko.
 *
 *  What is NOT the same is superko. An atom has no history — it is one
 *  position, not a game — so a repetition further back than the immediate ko
 *  cannot be seen and is not claimed to be. A diagram is a question about a
 *  shape and not a resumed game; if that ever stops being true, the atom needs
 *  hashes and this comment needs deleting.
 *
 *  `{ok:false, reason}` in the kernel's own vocabulary, so a caller that
 *  already renders a board refusal renders this one. */
export function playOn(atom, c, r, color = atom.toPlay) {
  if (!inB(atom.size, c, r)) return { ok: false, reason: "offboard" };
  const res = tryPlay({ size: atom.size, cells: atom.cells }, c, r, color);
  if (!res.ok) return res;
  return {
    ok: true,
    atom: {
      size: atom.size,
      cells: res.board.cells,
      toPlay: opponent(color),
      // The crop does not move when a stone lands inside it. A reply that
      // plays outside the picture grows the picture to include the answer,
      // because a diagram whose answer is off-screen is not an answer.
      bounds: inBounds(atom.bounds, c, r)
        ? atom.bounds
        : growTo(atom.bounds, c, r, atom.size),
    },
    captured: res.captured,
  };
}

/** The crop, grown just far enough to hold one more point, plus a line of air
 *  so the new stone is not against the edge of the picture. */
function growTo(b, c, r, size) {
  return {
    c0: Math.max(0, Math.min(b.c0, c - 1)),
    r0: Math.max(0, Math.min(b.r0, r - 1)),
    c1: Math.min(size - 1, Math.max(b.c1, c + 1)),
    r1: Math.min(size - 1, Math.max(b.r1, r + 1)),
  };
}

/* ----- text ----- */

/** An atom as SGF: a root node with the size, the stones as `AB`/`AW` setup,
 *  and `PL` for the turn.
 *
 *  The crop does not survive. SGF has no property for "look at this part" that
 *  any other reader would honour, and inventing a private one would make a
 *  file that claims to be SGF and is not. `diagramFromSgf` recomputes bounds
 *  with `boundsOf`, which is the same crop for every atom whose crop was
 *  computed — which is all of them until somebody drags the edges by hand. */
export function diagramToSgf(atom) {
  const b = [];
  const w = [];
  for (let i = 0; i < atom.cells.length; i++) {
    const v = atom.cells[i];
    if (v === null) continue;
    const [c, r] = colRow(atom.size, i);
    (v === "b" ? b : w).push(pointToSgf(c, r));
  }
  const parts = [`GM[1]`, `FF[4]`, `SZ[${atom.size}]`];
  if (b.length) parts.push(`AB${b.map((p) => `[${p}]`).join("")}`);
  if (w.length) parts.push(`AW${w.map((p) => `[${p}]`).join("")}`);
  parts.push(`PL[${atom.toPlay === "w" ? "W" : "B"}]`);
  return `(;${parts.join("")})`;
}

/** An atom back out of that text. Bounds are recomputed, per the note above.
 *
 *  `parseSgf` reads a game and a game has no "whose turn is it" property to
 *  read — the turn falls out of the moves. A diagram has no moves, so `PL` is
 *  the only thing that carries it, and it is taken off the root node here
 *  rather than taught to the game parser, which has no use for it. */
export function diagramFromSgf(text, opts = {}) {
  const { pad = DEFAULT_PAD } = opts;
  const parsed = parseSgf(text);
  const size = parsed.size;
  let board = createBoard(size);
  for (const [c, r] of parsed.setup?.b ?? []) board = withStone(board, c, r, "b");
  for (const [c, r] of parsed.setup?.w ?? []) board = withStone(board, c, r, "w");
  const pl = parsed.tree?.nodes?.[0]?.props?.PL?.[0];
  return diagramOf(board, String(pl).toLowerCase() === "w" ? "w" : "b", { pad });
}

/* ----- carrying one ----- */

/** The most an atom may weigh as text. A 19x19 board of alternating stones is
 *  a little over 2KB of SGF; this is past that with room for the property
 *  names, and far short of anything worth streaming. A letter is capped at
 *  2000 characters of prose and one of these. */
export const MAX_DIAGRAM_BYTES = 4096;

/** Is this a diagram atom, as read back off the wire or out of storage?
 *
 *  Stored JSON is untrusted like every other stored JSON here: a diagram that
 *  arrives with the wrong number of cells, a colour that is not b or w, or a
 *  crop outside the board is not repaired, it is refused. A letter carrying a
 *  broken diagram shows its prose and no picture, which is the same thing the
 *  reader would see if the picture had never been attached. */
export function readDiagram(raw) {
  if (!raw || typeof raw !== "object") return null;
  const size = raw.size;
  if (size !== 9 && size !== 13 && size !== 19) return null;
  if (!Array.isArray(raw.cells) || raw.cells.length !== size * size) return null;
  const cells = raw.cells.map((v) => (v === "b" || v === "w" ? v : null));
  const toPlay = raw.toPlay === "w" ? "w" : "b";
  const b = raw.bounds;
  const ok = b && typeof b === "object"
    && Number.isInteger(b.c0) && Number.isInteger(b.r0)
    && Number.isInteger(b.c1) && Number.isInteger(b.r1)
    && b.c0 >= 0 && b.r0 >= 0 && b.c1 < size && b.r1 < size
    && b.c0 <= b.c1 && b.r0 <= b.r1;
  return { size, cells, toPlay, bounds: ok ? { c0: b.c0, r0: b.r0, c1: b.c1, r1: b.r1 } : boundsOf(cells, size) };
}

/** The point an atom is "about", when something wants to name one: the centre
 *  of the crop. Used for a text fallback ("the corner at D4") when a diagram
 *  cannot be drawn. */
export function diagramCentre(atom) {
  return [Math.round((atom.bounds.c0 + atom.bounds.c1) / 2), Math.round((atom.bounds.r0 + atom.bounds.r1) / 2)];
}

/** Two atoms hold the same position. Bounds are presentation and do not count;
 *  whose turn it is does. */
export function sameDiagram(a, b) {
  if (!a || !b || a.size !== b.size || a.toPlay !== b.toPlay) return false;
  for (let i = 0; i < a.cells.length; i++) if (a.cells[i] !== b.cells[i]) return false;
  return true;
}

/** How many stones are on it, which is what decides whether a diagram is worth
 *  drawing at all: an empty board says nothing. */
export const stoneCount = (atom) => atom.cells.reduce((n, v) => (v === null ? n : n + 1), 0);

export { idx };
