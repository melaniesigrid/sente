/* ----------------------- THE CENSUS -----------------------
   `shapes.mjs` walls in a bare eye space and asks who lives. That is the first
   page of every life-and-death book and it runs out after about thirty boards,
   because there are only so many shapes that fit in a four-by-three box.

   Real collections get their variety from somewhere else: a stone already
   standing inside the space. One white stone in the middle of a five-point
   space turns a dead shape into a live one; one black stone on the same point
   turns a live one into a corpse. The shape is the same shape. What changed is
   what is already there, and that is the question a tsumego actually asks.

   So this enumerates the same spaces and then seeds them: every way of placing
   up to `--seeds` stones of either colour inside the space, each seeding solved
   from scratch by the prover. A seeding with exactly one killing point is a
   kill problem; one with exactly one living point is a live problem; one with
   neither, or with several, is a fact about the game rather than a puzzle, and
   is counted and dropped.

   Nothing here ships. It writes JSON that `author.mjs` turns into problems.

     node tools/problems/census.mjs                        corner+edge+open, 3-6, 1 seed
     node tools/problems/census.mjs --sizes 3,4,5,6,7 --seeds 2 --out census.json

   Every board it emits has been through `bounded()`, the same function
   `problems.test.js` uses to find the group, so a board that survives the
   census is a board the shipped verifier can re-prove from the data alone. */
import { writeFileSync } from "node:fs";
import { board, killers, savers, koOnlyKillers, bounded, legal, show, P, fmt } from "./prove.mjs";
import { shapes, wall } from "./shapes.mjs";
import { idx, chainAt } from "../../src/engine/index.js";

const SIZE = 9;
const ANCHORS = { corner: { c: 0, r: 0 }, edge: { c: 2, r: 0 }, open: { c: 2, r: 2 } };

/** Every way to put `k` stones of the given colours on `space`, as
 *  `[{p, colour}]` lists. Order does not matter, so the points are taken in
 *  increasing index and each subset is generated once. */
function seedings(space, k) {
  if (k === 0) return [[]];
  const out = [];
  const walk = (chosen, start) => {
    if (chosen.length === k) { out.push(chosen.slice()); return; }
    for (let i = start; i < space.length; i++) {
      for (const colour of ["w", "b"]) walk([...chosen, { p: space[i], colour }], i + 1);
    }
  };
  walk([], 0);
  return out;
}

/** The walled space with the seeding played into it, or null if the result is
 *  not a life-and-death board: an illegal position, a wall that came apart, a
 *  group with a liberty outside the space, or a space the prover will not
 *  quote a verdict from. `bounded` is the gate, so anything that comes back
 *  from here is something `problems.test.js` can find on its own. */
function seeded(space, setup, seeds) {
  const w = [...setup.w], b = [...setup.b];
  for (const s of seeds) (s.colour === "w" ? w : b).push(s.p);
  const bd = board({ w, b }, SIZE);
  if (legal(bd) !== null) return null;
  const found = bounded(bd);
  if (!found) return null;
  if (found.owner !== "w") return null;           // White is always the group under siege
  return { setup: { w, b }, board: bd, ...found };
}

/** One anchored space, every seeding of it up to `maxSeeds`, solved. */
export function census(n, anchor = "corner", maxSeeds = 1) {
  const off = ANCHORS[anchor] || ANCHORS.corner;
  const out = [], seen = new Set();
  for (const raw of shapes(n)) {
    const space = raw.map(p => P(p.c + off.c, p.r + off.r));
    const setup = wall(space);
    const bare = board(setup, SIZE);
    if (legal(bare) !== null) continue;
    /* The wall has to be one white chain breathing only into the space, or the
       board is asking about some other group. */
    const anchorStone = setup.w[0];
    const chain = chainAt(bare, anchorStone.c, anchorStone.r);
    if (chain.stones.length !== setup.w.length) continue;
    if ([...chain.libs].some(i => !space.some(p => idx(SIZE, p.c, p.r) === i))) continue;

    for (let k = 0; k <= maxSeeds; k++) for (const seeds of seedings(space, k)) {
      const pos = seeded(space, setup, seeds);
      if (!pos) continue;
      const stamp = pos.board.cells.map(v => (v === "b" ? 1 : v === "w" ? 2 : 0)).join("");
      if (seen.has(stamp)) continue;
      seen.add(stamp);
      const { target, region } = pos;
      const kill = killers(pos.board, target, region, "b");
      const live = savers(pos.board, target, region, "w");
      out.push({
        n, anchor, seeds: seeds.length, space: fmt(space),
        setup: pos.setup, target, region,
        kill, live,
        koOnly: kill.length ? koOnlyKillers(pos.board, target, region, "b") : [],
      });
    }
  }
  return out;
}

/** A seeding is worth shipping when exactly one point settles it from the side
 *  being asked. Two vital points is a fact, not a question. */
export const killProblems = (rows) => rows.filter(r => r.kill.length === 1);
export const liveProblems = (rows) => rows.filter(r => r.live.length === 1 && r.kill.length > 0);

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const RUN = process.argv[1] && process.argv[1].split(String.fromCharCode(92)).join("/");
if (RUN && import.meta.url.endsWith(RUN)) {
  const anchors = arg("--anchors", "corner,edge,open").split(",");
  const sizes = arg("--sizes", "3,4,5,6").split(",").map(Number);
  const seeds = Number(arg("--seeds", "1"));
  const out = arg("--out", "");
  const rows = [];
  for (const anchor of anchors) for (const n of sizes) {
    const t0 = Date.now();
    const found = census(n, anchor, seeds);
    rows.push(...found);
    console.log(`${anchor} ${n} points: ${found.length} boards, `
      + `${killProblems(found).length} with one killing point, `
      + `${liveProblems(found).length} with one living point `
      + `(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  console.log(`\ntotal: ${rows.length} boards, ${killProblems(rows).length} kills, ${liveProblems(rows).length} lives`);
  if (out) {
    writeFileSync(out, JSON.stringify(rows, null, 1));
    console.log(`written to ${out}`);
  } else {
    const sample = killProblems(rows).slice(0, 2);
    for (const r of sample) {
      console.log(`\n${r.anchor} ${r.n} points, ${r.seeds} seeded   kill ${fmt(r.kill)}`);
      console.log(show(board(r.setup, SIZE)).split("\n").slice(0, 5).join("\n"));
    }
  }
}
