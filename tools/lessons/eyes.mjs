/* ----------------------- THE EYE SPACE CENSUS -----------------------
   A lesson that says "three in a row dies and four in a row lives" is making a
   claim about every position of that shape, and the honest way to make it is to
   solve them all. This is the dev tool the life-and-death lessons in Tiers 2
   to 4 were written from: it enumerates eye spaces, walls each one in so that
   the surrounding chain has no liberty except the space itself, and solves the
   life and death exhaustively from both sides.

   Nothing here ships. Nothing under src/ imports it.

     node tools/lessons/eyes.mjs             the census, the way the lessons cite it
     node tools/lessons/eyes.mjs --lessons   every position the lessons use, re-proved

   Three things are worth knowing before trusting the output.

   The solver is exhaustive inside the region it is given, so a dead verdict is
   a proof, and an alive verdict means "not killable inside this eye space",
   which is the question a tsumego asks. The defender may pass: if passing still
   survives, the group is alive.

   The ko rule is threaded through the search, and a pass clears the ko ban,
   which is what a ko threat played elsewhere amounts to. `koSensitive` re-runs
   the search with the ko rule switched off and reports whether the verdict
   moved. A shape whose life rests on a ko is a rules argument rather than a
   shape to know by sight, and a lesson should say so instead of calling it a
   clean kill.

   And the walls are built so that the only liberties the surrounded chain has
   are the points of the eye space. No outside liberty, nothing to appeal to:
   what the verdict measures is the shape of the space and nothing else. */
import { createBoard, idx, colRow, chainAt, tryPlay, opponent, boardToRows, boardFromRows } from "../../src/engine/index.js";

const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const show = (b) => boardToRows(b).join("\n");
export const fromRows = (rows) => boardFromRows(rows);
const at = (b, p) => b.cells[idx(b.size, p.c, p.r)];
const key = (b) => b.cells.map(v => (v === "b" ? "X" : v === "w" ? "O" : ".")).join("");

/* ---------- the solver ----------
   Attacker to kill, defender to live, confined to `region`. */
export function killable(board, target, region, depth, opts = {}) {
  const { attacker = "b", first = attacker, ignoreKo = false } = opts;
  const memo = new Map();

  function search(b, toMove, left, passed, ko) {
    if (at(b, target) === null) return true;                  // the group came off the board
    if (left <= 0) return false;
    const k = `${key(b)}|${toMove}|${left}|${passed}|${ko}`;
    if (memo.has(k)) return memo.get(k);
    memo.set(k, false);                                       // cycle guard

    let out = toMove !== attacker;
    for (const i of region) {
      if (b.cells[i] !== null) continue;
      const [c, r] = colRow(b.size, i);
      const res = tryPlay(b, c, r, toMove, { koPoint: ignoreKo ? null : ko });
      if (!res.ok) continue;
      const sub = search(res.board, opponent(toMove), toMove === attacker ? left - 1 : left, 0, res.ko);
      if (toMove === attacker && sub) { out = true; break; }
      if (toMove !== attacker && !sub) { out = false; break; }
    }
    // The defender passing is a ko threat played elsewhere: it clears the ban.
    if (toMove !== attacker && out && !passed && !search(b, attacker, left, 1, null)) out = false;
    memo.set(k, out);
    return out;
  }
  return search(board, first, depth, 0, opts.koPoint ?? null);
}

/** True when the verdict depends on the ko rule, and a lesson owes the reader a word about it. */
export function koSensitive(board, target, region, depth, opts = {}) {
  return killable(board, target, region, depth, opts)
      !== killable(board, target, region, depth, { ...opts, ignoreKo: true });
}

/* ---------- eye spaces ----------
   A shape is a connected set of points. `build` surrounds one with a single
   defending chain and seals that chain in, so its liberties are exactly the
   space. Filling the bounding box rather than tracing the outline matters: a
   cross or a flower has diagonal gaps, and an outline drawn around one of those
   is two chains rather than one wall. */
export function shapes(size, box) {
  const seen = new Set(), out = [];
  const k = (s) => s.map(([c, r]) => `${c},${r}`).sort().join(" ");
  const grow = (s) => {
    if (s.length === size) { if (!seen.has(k(s))) { seen.add(k(s)); out.push([...s]); } return; }
    for (const [c, r] of s) for (const [dc, dr] of ORTH) {
      const nc = c + dc, nr = r + dr;
      if (nc < box.c0 || nc > box.c1 || nr < box.r0 || nr > box.r1) continue;
      if (s.some(([x, y]) => x === nc && y === nr)) continue;
      grow([...s, [nc, nr]]);
    }
  };
  for (let r = box.r0; r <= box.r1; r++) for (let c = box.c0; c <= box.c1; c++) grow([[c, r]]);
  return out;
}

export function build(space, boardSize, defender = "w") {
  const b = createBoard(boardSize);
  const inSpace = new Set(space.map(([c, r]) => idx(boardSize, c, r)));
  const put = (c, r, v) => {
    if (c < 0 || r < 0 || c >= boardSize || r >= boardSize) return;
    const i = idx(boardSize, c, r);
    if (!inSpace.has(i) && !b.cells[i]) b.cells[i] = v;
  };
  const c0 = Math.min(...space.map(s => s[0])) - 1, c1 = Math.max(...space.map(s => s[0])) + 1;
  const r0 = Math.min(...space.map(s => s[1])) - 1, r1 = Math.max(...space.map(s => s[1])) + 1;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) put(c, r, defender);
  const wall = [];
  for (let i = 0; i < b.cells.length; i++) if (b.cells[i] === defender) wall.push(colRow(boardSize, i));
  for (const [c, r] of wall) for (const [dc, dr] of ORTH) put(c + dc, r + dr, opponent(defender));
  return { board: b, wall };
}

/** Solve one eye space: with the attacker moving first, with the defender first, and what kills. */
export function judge(space, boardSize, depth = 16) {
  const { board, wall } = build(space, boardSize);
  const seed = { c: wall[0][0], r: wall[0][1] };
  const region = space.map(([c, r]) => idx(boardSize, c, r));
  const oneChain = chainAt(board, seed.c, seed.r).stones.length === wall.length;
  const atk = killable(board, seed, region, depth, { attacker: "b", first: "b" });
  const def = killable(board, seed, region, depth, { attacker: "b", first: "w" });
  const kills = [];
  if (atk) for (const i of region) {
    const [c, r] = colRow(boardSize, i);
    const res = tryPlay(board, c, r, "b");
    if (res.ok && killable(res.board, seed, region, depth, { attacker: "b", first: "w" })) kills.push([c, r]);
  }
  return {
    board, seed, region, oneChain, kills,
    verdict: atk ? (def ? "dead as it stands" : "dies to a placement") : "alive",
    ko: koSensitive(board, seed, region, depth, { attacker: "b", first: "b" }),
  };
}

/* Canonical form under the eight symmetries, so a shape is counted once. */
export function signature(space) {
  const norm = (s) => {
    const c0 = Math.min(...s.map(p => p[0])), r0 = Math.min(...s.map(p => p[1]));
    return JSON.stringify(s.map(([c, r]) => [c - c0, r - r0]).sort((a, b) => a[1] - b[1] || a[0] - b[0]));
  };
  const out = [];
  let s = space.map(([c, r]) => [c, r]);
  for (let flip = 0; flip < 2; flip++) {
    for (let turn = 0; turn < 4; turn++) { out.push(norm(s)); s = s.map(([c, r]) => [r, -c]); }
    s = s.map(([c, r]) => [-c, r]);
  }
  return out.sort()[0];
}

/** A shape drawn as rows of text, for reading a census entry without a board. */
export function sketch(space) {
  const pts = JSON.parse(signature(space));
  const w = Math.max(...pts.map(p => p[0])) + 1, h = Math.max(...pts.map(p => p[1])) + 1;
  const grid = Array.from({ length: h }, () => Array(w).fill("."));
  for (const [c, r] of pts) grid[r][c] = "O";
  return grid.map(row => row.join("")).join("/");
}

/** Every distinct eye space of `size` points, solved in the open board. */
export function census(size, boardSize = 13) {
  const box = { c0: 4, c1: 4 + size - 1, r0: 4, r1: 4 + size - 1 };
  const seen = new Map();
  for (const s of shapes(size, box)) if (!seen.has(signature(s))) seen.set(signature(s), s);
  return [...seen.values()].map((space) => ({ space, sketch: sketch(space), ...judge(space, boardSize) }));
}

/* ---------- the lesson positions ----------
   Each entry is a position a lesson in the library uses, named by its lesson,
   with the question that lesson asks of it. Run with --lessons to re-prove
   them all; the answers are what the lesson files state in their headers.

   `space` is the whole contested area, including points that stones are
   standing on. That is deliberate and it is easy to get wrong: a region of
   only the currently empty points cannot be played on after a capture clears
   it, and the throw-in position is alive or dead depending on whether the
   search is allowed back into the space White has just captured. */
export const LESSON_POSITIONS = [
  {
    lesson: "life-eye-space", name: "three in a row",
    rows: [".........", ".........", "..XXXXX..", ".XOOOOOX.", ".XO...OX.", ".XOOOOOX.", "..XXXXX..", ".........", "........."],
    seed: { c: 2, r: 3 }, space: [[3, 4], [4, 4], [5, 4]],
  },
  {
    lesson: "life-eye-space", name: "four in a row",
    rows: [".........", ".........", "..XXXXXX.", ".XOOOOOOX", ".XO....OX", ".XOOOOOOX", "..XXXXXX.", ".........", "........."],
    seed: { c: 2, r: 3 }, space: [[3, 4], [4, 4], [5, 4], [6, 4]],
  },
  {
    lesson: "life-eye-space", name: "the square of four",
    rows: [".........", "..XXXX...", ".XOOOOX..", ".XO..OX..", ".XO..OX..", ".XOOOOX..", "..XXXX...", ".........", "........."],
    seed: { c: 2, r: 2 }, space: [[3, 3], [4, 3], [3, 4], [4, 4]],
  },
  {
    lesson: "life-corner-live", name: "five stones, three points, White to play",
    rows: [".........", ".........", ".........", ".........", ".........", ".........", "XXXXX....", "OOOOX....", ".O..X...."],
    seed: { c: 0, r: 7 }, space: [[0, 8], [2, 8], [3, 8]],
  },
  {
    lesson: "life-dead-shapes", name: "the cross five",
    rows: [".........", "..XXXXX..", ".XOOOOOX.", ".XOO.OOX.", ".XO...OX.", ".XOO.OOX.", ".XOOOOOX.", "..XXXXX..", "........."],
    seed: { c: 2, r: 2 }, space: [[4, 3], [3, 4], [4, 4], [5, 4], [4, 5]],
  },
  {
    lesson: "life-dead-shapes", name: "the flower six",
    rows: [".........", ".XXXXX...", "XOOOOOX..", "XO..OOX..", "XO...OX..", "XOO.OOX..", "XOOOOOX..", ".XXXXX...", "........."],
    seed: { c: 1, r: 2 }, space: [[2, 3], [3, 3], [2, 4], [3, 4], [4, 4], [3, 5]],
  },
  {
    lesson: "life-dead-shapes", name: "the rectangular six, which lives in the open",
    rows: [".........", "..XXXXX..", ".XOOOOOX.", ".XO...OX.", ".XO...OX.", ".XOOOOOX.", "..XXXXX..", ".........", "........."],
    seed: { c: 2, r: 2 }, space: [[3, 3], [4, 3], [5, 3], [3, 4], [4, 4], [5, 4]],
  },
  {
    lesson: "life-seki", name: "the standoff",
    rows: [".........", ".........", ".........", ".........", ".........", "XXXXX....", "OOOOX....", "X..OX....", "XXXOX...."],
    seed: { c: 0, r: 6 }, space: [[1, 7], [2, 7]],
  },
  {
    lesson: "life-throw-in", name: "two stones in atari, and they are the answer",
    rows: [".........", ".........", ".........", ".........", ".........", "XXXXX....", "OOOOX....", "OXO.X....", "X...X...."],
    seed: { c: 0, r: 6 },
    space: [[0, 6], [1, 6], [2, 6], [3, 6], [0, 7], [1, 7], [2, 7], [3, 7], [0, 8], [1, 8], [2, 8], [3, 8]],
  },
];

function main() {
  if (process.argv.includes("--lessons")) {
    console.log("LESSON POSITIONS, re-proved\n");
    for (const p of LESSON_POSITIONS) {
      const board = fromRows(p.rows);
      const region = p.space.map(([c, r]) => idx(board.size, c, r));
      const seed = p.seed;
      const chain = chainAt(board, seed.c, seed.r);
      const atk = killable(board, seed, region, 16, { attacker: "b", first: "b" });
      const def = killable(board, seed, region, 16, { attacker: "b", first: "w" });
      const ko = koSensitive(board, seed, region, 16, { attacker: "b", first: "b" });
      const kills = [];
      for (const i of region) {
        const [c, r] = colRow(board.size, i);
        const res = tryPlay(board, c, r, "b");
        if (res.ok && killable(res.board, seed, region, 16, { attacker: "b", first: "w" })) kills.push(`(${c},${r})`);
      }
      console.log(`${p.lesson} - ${p.name}`);
      console.log(show(board));
      console.log(`  wall: ${chain.stones.length} stones, ${chain.libs.size} liberties, all of them inside the space`);
      console.log(`  black first: ${atk ? "DEAD" : "alive"}   white first: ${def ? "DEAD" : "alive"}   ko-sensitive: ${ko}`);
      console.log(`  black moves that kill: ${kills.join(" ") || "none"}\n`);
    }
    return;
  }
  console.log("THE EYE SPACE CENSUS - every distinct shape of 3 to 6 points, in the open board\n");
  let deadTotal = 0, total = 0;
  for (const size of [3, 4, 5, 6]) {
    const rows = census(size);
    const dead = rows.filter(r => r.verdict !== "alive");
    deadTotal += dead.length; total += rows.length;
    console.log(`${size} points: ${rows.length} shapes, ${dead.length} of them die`);
    for (const r of dead) {
      const points = r.kills.map(([c, k]) => `(${c},${k})`).join(" ");
      console.log(`   ${r.sketch.padEnd(18)} ${r.verdict}${r.ko ? " (ko-sensitive)" : ""}`
        + `  killing point${r.kills.length === 1 ? "" : "s"}: ${points || "no move needed"}`);
    }
    const broken = rows.filter(r => !r.oneChain);
    if (broken.length) console.log(`   WARNING: ${broken.length} shapes built a wall that is not one chain`);
  }
  console.log(`\n${deadTotal} of ${total} shapes die. Every other one lives.`);
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("tools/lessons/eyes.mjs")) main();
