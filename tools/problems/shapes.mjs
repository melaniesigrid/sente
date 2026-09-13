/* ----------------------- THE SHAPE SEARCH -----------------------
   Where the eye-shape problems came from. Enumerates every connected space of
   `n` points that fits in a four-by-three box, walls each one in with white
   stones and those in with black, and asks the prover which points kill and
   which live. A space with exactly one of each is a tsumego; a space with none
   of either is a fact about the game worth writing down somewhere else.

   Run it:  node tools/problems/shapes.mjs [corner|edge|open] [size...]
   Default: node tools/problems/shapes.mjs corner 4 5 6

   The anchor moves the same shapes into the corner, onto the edge, or out into
   the open, which is the only variable that matters once the shape is fixed:
   the bend that lives on the edge dies in the corner, and this is what says so. */
import { board, killers, savers, legal, enclosed, show, P, fmt } from "./prove.mjs";
import { idx, chainAt } from "../../src/engine/index.js";

const SIZE = 9;
const inB = (c, r) => c >= 0 && r >= 0 && c < SIZE && r < SIZE;
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const ANCHORS = { corner: { c: 0, r: 0 }, edge: { c: 2, r: 0 }, open: { c: 2, r: 2 } };

/** Every connected set of `n` points inside a `w` by `h` box, normalised so it
 *  touches both edges of the box: a shape floating away from the corner is the
 *  same shape somewhere else, and searching it twice proves nothing twice. */
export function shapes(n, w = 4, h = 3) {
  const cells = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells.push(P(c, r));
  const out = new Map();
  const walk = (chosen, start) => {
    if (chosen.length === n) {
      if (!chosen.some(p => p.r === 0) || !chosen.some(p => p.c === 0)) return;
      const has = (p) => chosen.some(q => q.c === p.c && q.r === p.r);
      const seen = new Set([`${chosen[0].c},${chosen[0].r}`]), stack = [chosen[0]];
      while (stack.length) {
        const p = stack.pop();
        for (const [dc, dr] of N8.slice(0, 4)) {
          const q = P(p.c + dc, p.r + dr), k = `${q.c},${q.r}`;
          if (!seen.has(k) && has(q)) { seen.add(k); stack.push(q); }
        }
      }
      if (seen.size === n) out.set(fmt(chosen), chosen.slice());
      return;
    }
    for (let i = start; i < cells.length; i++) walk([...chosen, cells[i]], i + 1);
  };
  walk([], 0);
  return [...out.values()];
}

/** White around the space, black around the white. Diagonals count, or the
 *  wall comes out in pieces and the group is two groups. */
export function wall(space) {
  const has = (p, set) => set.some(q => q.c === p.c && q.r === p.r);
  const w = [], seenW = new Set();
  for (const p of space) for (const [dc, dr] of N8) {
    const q = P(p.c + dc, p.r + dr), k = `${q.c},${q.r}`;
    if (!inB(q.c, q.r) || has(q, space) || seenW.has(k)) continue;
    seenW.add(k); w.push(q);
  }
  const b = [], seenB = new Set();
  for (const p of w) for (const [dc, dr] of N8) {
    const q = P(p.c + dc, p.r + dr), k = `${q.c},${q.r}`;
    if (!inB(q.c, q.r) || has(q, space) || seenW.has(k) || seenB.has(k)) continue;
    seenB.add(k); b.push(q);
  }
  return { w, b };
}

/** Every space of `n` points at `anchor`, solved. Spaces whose wall comes out
 *  in two chains, or that leave White a liberty outside, are dropped: they are
 *  a different problem from the one being asked. */
export function solve(n, anchor = "corner") {
  const off = ANCHORS[anchor] || ANCHORS.corner;
  const out = [];
  for (const raw of shapes(n)) {
    const space = raw.map(p => P(p.c + off.c, p.r + off.r));
    const setup = wall(space);
    const bd = board(setup, SIZE);
    if (legal(bd) !== null) continue;
    const target = setup.w[0];
    const chain = chainAt(bd, target.c, target.r);
    if (chain.stones.length !== setup.w.length) continue;
    if ([...chain.libs].some(i => !space.some(p => idx(SIZE, p.c, p.r) === i))) continue;
    const region = enclosed(bd, space[0]);
    if (region.length !== space.length) continue;
    out.push({
      n, anchor, space, setup, board: bd, target,
      kill: killers(bd, target, region, "b"),
      live: savers(bd, target, region, "w"),
    });
  }
  return out;
}

if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  const anchor = ANCHORS[process.argv[2]] ? process.argv[2] : "corner";
  const sizes = process.argv.slice(3).map(Number).filter(Number.isFinite);
  const all = (sizes.length ? sizes : [4, 5, 6]).flatMap(n => solve(n, anchor));
  const tsumego = all.filter(r => r.kill.length === 1 && r.live.length === 1);
  console.log(`${anchor}: ${all.length} spaces walled in, ${tsumego.length} with one killing point and one living point`);
  for (const r of tsumego) {
    console.log(`\nspace of ${r.n}: ${fmt(r.space)}   kill ${fmt(r.kill)}   live ${fmt(r.live)}`);
    console.log(show(r.board).split("\n").slice(0, 6).join("\n"));
  }
  const dead = all.filter(r => r.live.length === 0);
  const alive = all.filter(r => r.kill.length === 0);
  console.log(`\ndead however White moves: ${dead.map(r => fmt(r.space)).join(" | ") || "none"}`);
  console.log(`alive however Black moves: ${alive.length} spaces`);
}
