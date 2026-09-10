/* ----------------------- BOARD (pure) -----------------------
   A board is a plain object so callers never thread `size` around:

     board = { size: 9, cells: [null, "b", "w", ...] }   // cells.length === size * size

   `cells` is a flat, row-major array of `null | "b" | "w"`; the point at column c
   (0..size-1, left to right) and row r (0..size-1, top to bottom) lives at index
   `r * size + c`:

        c →  0   1   2
     r ↓   +---+---+---+
       0   | 0 | 1 | 2 |
           +---+---+---+
       1   | 3 | 4 | 5 |
           +---+---+---+
       2   | 6 | 7 | 8 |
           +---+---+---+

   Boards are treated as immutable values: every rule function returns a new board and
   never mutates its input. `cells` is JSON-serialisable as-is, which is what the record
   and the future wire format rely on. */

export const NBRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const SIZES = [9, 13, 19];

export const idx = (size, c, r) => r * size + c;
export const inB = (size, c, r) => c >= 0 && c < size && r >= 0 && r < size;
export const colRow = (size, i) => [i % size, Math.floor(i / size)];

/* ----- coordinates -----
   The board is lettered left to right and numbered bottom to top, and the letter I is
   skipped, because on a printed diagram it is indistinguishable from the number 1 and
   from a lowercase l. Every go book, server and tournament sheet does this; a board
   that labelled a column "I" would disagree with every one of them.

   This is not SGF's alphabet. `pointToSgf` uses a..s including i, which is correct
   there and wrong here. */
export const COLUMN_LETTERS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

/** Column letter for a zero-based column index: 0 is A, 8 is J. */
export const colLabel = (c) => COLUMN_LETTERS[c] ?? "?";

/** Row number for a zero-based row index: row 0 is the top, and the top row of a
  * 19x19 board is 19. */
export const rowLabel = (size, r) => size - r;

/** A point in the usual notation, e.g. "Q16" on 19x19. */
export const pointLabel = (size, c, r) => `${colLabel(c)}${rowLabel(size, r)}`;

export function createBoard(size) {
  if (!Number.isInteger(size) || size < 2 || size > 25) throw new RangeError(`bad board size ${size}`);
  return { size, cells: Array(size * size).fill(null) };
}

/** Copy of `board` with `color` at (c, r). Used by setup (handicap, SGF AB/AW). */
export function withStone(board, c, r, color) {
  const cells = board.cells.slice();
  cells[idx(board.size, c, r)] = color;
  return { size: board.size, cells };
}

/** Points where the goban is decorated with a hoshi. 9 and 13 get five, 19 gets nine. */
export function starPoints(size) {
  if (size < 7) return [];
  const e = size >= 13 ? 3 : 2;
  const f = size - 1 - e;
  const mid = (size - 1) / 2;
  const pts = [[e, e], [f, e], [e, f], [f, f]];
  if (Number.isInteger(mid)) {
    pts.push([mid, mid]);
    if (size >= 19) pts.push([e, mid], [f, mid], [mid, e], [mid, f]);
  }
  return pts.map(([c, r]) => ({ c, r }));
}

/** Flood the chain containing (c, r). Returns its stones and the set of liberty indices.
 *  On an empty point the "chain" is the connected empty region (used by scoring). */
export function chainAt(board, c, r) {
  const { size, cells } = board;
  const color = cells[idx(size, c, r)];
  const start = idx(size, c, r);
  const seen = new Set([start]);
  const stack = [[c, r]];
  const stones = [];
  const libs = new Set();
  while (stack.length) {
    const [x, y] = stack.pop();
    stones.push([x, y]);
    for (const [dx, dy] of NBRS) {
      const nx = x + dx, ny = y + dy;
      if (!inB(size, nx, ny)) continue;
      const i = idx(size, nx, ny);
      const v = cells[i];
      if (v === null && color !== null) libs.add(i);
      else if (v === color && !seen.has(i)) { seen.add(i); stack.push([nx, ny]); }
    }
  }
  return { stones, libs };
}

/** Build a board from rows of text: `.` empty, `X` black, `O` white. Test and fixture helper. */
export function boardFromRows(rows) {
  const size = rows.length;
  const board = createBoard(size);
  rows.forEach((row, r) => {
    if (row.length !== size) throw new RangeError(`row ${r} has ${row.length} cells, expected ${size}`);
    for (let c = 0; c < size; c++) {
      const ch = row[c];
      if (ch === "X") board.cells[idx(size, c, r)] = "b";
      else if (ch === "O") board.cells[idx(size, c, r)] = "w";
    }
  });
  return board;
}

export function boardToRows(board) {
  const out = [];
  for (let r = 0; r < board.size; r++) {
    let row = "";
    for (let c = 0; c < board.size; c++) {
      const v = board.cells[idx(board.size, c, r)];
      row += v === "b" ? "X" : v === "w" ? "O" : ".";
    }
    out.push(row);
  }
  return out;
}
