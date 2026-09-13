/* ----------------------- SHAPE UP: THE PROOFS -----------------------
   The two positions in the `shapeup` series, re-proved from scratch. The
   library verifier checks that every position is legal and every scripted line
   plays; it cannot check that the claims the prose makes about those positions
   are true. This is where those claims are checked.

     node tools/lessons/shapeup.mjs

   Self-contained on purpose: it reaches into the engine and nothing else, so it
   keeps working whatever happens to the other tools in this directory. Nothing
   here ships. See .claude/rules/lessons.md. */
import { boardFromRows, boardToRows, tryPlay, chainAt, idx } from "../../src/engine/index.js";

const E = ".............";
const show = (b) => boardToRows(b).join("\n");
const libs = (b, c, r) => chainAt(b, c, r).libs.size;
const play = (b, c, r, col) => {
  const res = tryPlay(b, c, r, col);
  if (!res.ok) throw new Error(`(${c},${r}) ${col}: ${res.reason}`);
  return res.board;
};
const joined = (b, p, q) =>
  [...chainAt(b, p[0], p[1]).stones].some(([x, y]) => x === q[0] && y === q[1]);

/* Can `col`, playing alone and unanswered, make every seed one chain inside
   `box` within `plies` moves? Unanswered is deliberate: it is the most
   generous reading of "can they connect", so a no here is a real no. */
function canJoin(b, col, seeds, box, plies) {
  if (seeds.every(s => joined(b, seeds[0], s))) return [];
  if (plies === 0) return null;
  for (const [c, r] of box) {
    if (b.cells[idx(b.size, c, r)] !== null) continue;
    const res = tryPlay(b, c, r, col);
    if (!res.ok) continue;
    const rest = canJoin(res.board, col, seeds, box, plies - 1);
    if (rest) return [[c, r], ...rest];
  }
  return null;
}

const box = (cols, rows) => rows.flatMap(r => cols.map(c => [c, r]));

/* ---------- chapter 1: shape-table ---------- */
function table() {
  const b = boardFromRows([E, E, E, E, "...XX...XX...", E, "...X.X..XX...", E, E, E, E, E, E]);
  const TABLE = [[3, 4], [4, 4], [3, 6], [5, 6]];
  const BAMBOO = [[8, 4], [9, 4], [8, 6], [9, 6]];
  console.log("--- shape-table ---");
  console.log(show(b));

  for (const [c, r] of [[8, 5], [9, 5]]) {
    const cut = play(b, c, r, "w");
    const line = canJoin(cut, "b", BAMBOO, box([7, 8, 9, 10], [3, 4, 5, 6, 7]), 1);
    const after = play(cut, line[0][0], line[0][1], "b");
    console.log(`  bamboo, white (${c},${r}): black answers ${line[0]}, four stones one chain,`,
      `white stone on ${libs(after, c, r)} liberty`);
  }

  const wedge = play(b, 4, 6, "w");
  const region = box([2, 3, 4, 5, 6], [3, 4, 5, 6, 7]);
  for (const n of [1, 2, 3]) {
    console.log(`  table, after the wedge at (4,6): black alone in <=${n}:`,
      JSON.stringify(canJoin(wedge, "b", TABLE, region, n)));
  }
  let x = play(wedge, 4, 5, "b");
  x = play(x, 4, 7, "w");
  console.log(`  the lesson's line: white's two stones hold ${libs(x, 4, 6)} liberties,`,
    "black's bottom stones are joined:", joined(x, [3, 4], [3, 6]), joined(x, [3, 4], [5, 6]));
}

/* ---------- chapter 2: shape-liberty-problem ---------- */
function liberties() {
  const b = boardFromRows([E, E, E, E, E, E, E, E, E, ".....OO......", "....OXX......", E, E]);
  console.log("\n--- shape-liberty-problem ---");
  console.log(show(b));
  console.log("  the pair starts on", libs(b, 5, 10), "liberties");
  for (const [c, r, name] of [[7, 10, "extend"], [6, 11, "descend right"], [5, 11, "descend left"]]) {
    console.log(`  black ${name} (${c},${r}): ${libs(play(b, c, r, "b"), 5, 10)} liberties`);
  }
  for (const [c, r] of [[7, 10], [6, 11], [5, 11]]) {
    console.log(`  white takes (${c},${r}) instead: black on ${libs(play(b, c, r, "w"), 5, 10)}`);
  }
}

table(); liberties();
