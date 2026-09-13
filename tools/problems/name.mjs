/* ----------------------- SAMENESS AND NAMES -----------------------
   The census hands back a heap of positions, and a heap has two problems a
   collection cannot have. Some of them are the same problem twice, mirrored,
   and most of them have no name.

   Sameness first. A corner reflects along its diagonal, an edge reflects left
   to right, and a space in the open has all eight symmetries of a square. So
   each position is reduced to a local pattern - the eye space, and which of
   its points already hold a stone of which colour - and then to the smallest
   spelling of that pattern under the symmetries the anchor allows. Two
   positions with the same canonical spelling are the same problem, however
   differently they happen to be drawn on the board.

   Names second. `Gateway to All Marvels` is a catalogue of named techniques
   rather than a pile of positions, and its editors were right: a shape you can
   name is a shape you can look for. The traditional names are given for the
   spaces that have them and nothing is invented for the ones that do not - a
   shape described as "six points, bent" is honest, and a shape handed a name
   somebody made up last week is not.

   Nothing here ships; `author.mjs` writes the names it chooses into the data. */
import { P } from "./prove.mjs";

/** The eight symmetries of the square, as point maps on a w-by-h box. */
const OPS = [
  (p) => P(p.c, p.r),
  (p, w) => P(w - 1 - p.c, p.r),
  (p, w, h) => P(p.c, h - 1 - p.r),
  (p, w, h) => P(w - 1 - p.c, h - 1 - p.r),
  (p) => P(p.r, p.c),
  (p, w, h) => P(h - 1 - p.r, p.c),
  (p, w) => P(p.r, w - 1 - p.c),
  (p, w, h) => P(h - 1 - p.r, w - 1 - p.c),
];

/** Which of the eight an anchor is allowed: a corner may only be reflected in
 *  its diagonal, an edge only left to right, a space in the open any way at
 *  all. Reflecting a corner left to right would move the 1-1 point, and the
 *  1-1 point is half of what a corner problem is about. */
const ALLOWED = { corner: [0, 4], edge: [0, 1], open: [0, 1, 2, 3, 4, 5, 6, 7] };

/** One position as a local pattern: rows of `.` for an empty point of the eye
 *  space, `o` for a white stone inside it, `x` for a black one. Points outside
 *  the space are ` `, because the wall is a consequence of the space and not a
 *  separate fact. */
export function pattern(space, stones = []) {
  const cs = space.map(p => p.c), rs = space.map(p => p.r);
  const c0 = Math.min(...cs), r0 = Math.min(...rs);
  const w = Math.max(...cs) - c0 + 1, h = Math.max(...rs) - r0 + 1;
  const grid = Array.from({ length: h }, () => Array(w).fill(" "));
  for (const p of space) grid[p.r - r0][p.c - c0] = ".";
  for (const s of stones) grid[s.p.r - r0][s.p.c - c0] = s.colour === "w" ? "o" : "x";
  return { w, h, grid };
}

const spell = (grid) => grid.map(row => row.join("")).join("/");

/** The smallest spelling of a pattern under the symmetries `anchor` allows.
 *  Positions that share one are the same problem. */
export function canonical(pat, anchor = "corner") {
  const ops = (ALLOWED[anchor] || ALLOWED.corner).map(i => OPS[i]);
  let best = null;
  for (const op of ops) {
    const first = op(P(0, 0), pat.w, pat.h), second = op(P(1, 0), pat.w, pat.h);
    const flips = first.c === second.c;           // the map transposed the box
    const w = flips ? pat.h : pat.w, h = flips ? pat.w : pat.h;
    const grid = Array.from({ length: h }, () => Array(w).fill(" "));
    for (let r = 0; r < pat.h; r++) for (let c = 0; c < pat.w; c++) {
      const q = op(P(c, r), pat.w, pat.h);
      grid[q.r][q.c] = pat.grid[r][c];
    }
    const s = spell(grid);
    if (best === null || s < best) best = s;
  }
  return best;
}

/* ----------------------- THE NAMED SPACES -----------------------
   Each shape is written as its rows, so the file shows what it looks like
   instead of spelling a canonical key nobody can read. Only names a
   life-and-death book would recognise are here; a shape with no traditional
   name gets described rather than handed one somebody made up. */
const BY_ROWS = [
  { rows: ["..."], name: "the straight three" },
  { rows: ["..", ". "], name: "the bent three" },
  { rows: ["...."], name: "the straight four" },
  { rows: ["...", ".  "], name: "the bent four" },
  { rows: ["..", ".."], name: "the square four" },
  { rows: ["...", " . "], name: "the pyramid four" },
  { rows: ["....."], name: "the straight five" },
  { rows: ["....", ".   "], name: "the bent five" },
  { rows: ["...", ".. "], name: "the bulky five" },
  { rows: [" . ", "...", " . "], name: "the crossed five" },
  { rows: ["......"], name: "the straight six" },
  { rows: ["...", "..."], name: "the six-point rectangle" },
  { rows: ["....", " .  "], name: "the rabbitty six" },
];

const fromRows = (rows) => {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const grid = rows.map(r => [...r.padEnd(w, " ")]);
  return { w, h, grid };
};

const NAMES = new Map();
for (const { rows, name } of BY_ROWS) NAMES.set(canonical(fromRows(rows), "open"), name);

/** The traditional name of an eye space, or null. The space alone: a stone
 *  standing inside it does not change what the shape is called. */
export function spaceName(space) {
  const bare = pattern(space);
  return NAMES.get(canonical(bare, "open")) || null;
}

/** What to call a space with no traditional name: its size and whether it is
 *  straight, bent or blocky. Plain description, nothing invented. */
export function describe(space) {
  const n = space.length;
  const rows = new Set(space.map(p => p.r)), cols = new Set(space.map(p => p.c));
  const words = ["", "one point", "two points", "three points", "four points",
    "five points", "six points", "seven points", "eight points"][n] || `${n} points`;
  if (rows.size === 1 || cols.size === 1) return `${words} in a row`;
  if (rows.size === 2 && cols.size === 2) return `${words} in a square`;
  return `${words}, bent`;
}

export const nameOf = (space) => spaceName(space) || describe(space);
