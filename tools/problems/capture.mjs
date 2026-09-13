/* ----------------------- THE CAPTURE CENSUS -----------------------
   The eye-space census is complete and small. Every sealed space of three to
   six points was enumerated, walled in and solved, and after the mirror images
   were folded together it came to fifty-eight distinct questions. That is not
   a shortage of work, it is the size of the subject: a sealed space either has
   a vital point or it does not, and there are only so many sealed spaces.
   Seeding them with stones does not help, and it is worth writing down why. A
   stone placed inside an eye space either touches the wall, in which case it
   joins the wall and the space is simply smaller, or it does not, in which
   case it splits the space in two and the group has two eyes or none. Either
   way the question that comes out is a question the bare census already asked.

   Volume, and everything below about ten kyu, lives here instead: not "can
   this group make two eyes" but "can this chain be taken off the board". That
   question has as many answers as there are ways to arrange stones, and the
   arrangements are what this enumerates.

   A white chain of one to three stones is drawn in a box, some of its
   liberties are filled with black stones, and one further stone of either
   colour may be dropped anywhere else in the box, which is where throw-ins and
   snapbacks come from. Every arrangement is then solved by `catchers`, and an
   arrangement is kept only when it asks a question with one answer:

     exactly one black move catches the chain,
     the chain is safe if Black does nothing,
     and there is something else Black could have played.

   Nothing here ships. `author.mjs` turns the output into drills.

     node tools/problems/capture.mjs                 corner, chains of 1-3
     node tools/problems/capture.mjs --anchors edge,open --out capture.json */
import { writeFileSync } from "node:fs";
import { board, catches, catchers, fightRegion, legal, show, P, fmt, at } from "./prove.mjs";
import { idx, chainAt, tryPlay } from "../../src/engine/index.js";

const SIZE = 9;
const BOX = 4;
const ANCHORS = { corner: { c: 0, r: 0 }, edge: { c: 2, r: 0 }, open: { c: 2, r: 2 } };
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inB = (p) => p.c >= 0 && p.r >= 0 && p.c < SIZE && p.r < SIZE;
const same = (a, b) => a.c === b.c && a.r === b.r;
const has = (list, p) => list.some(q => same(q, p));

/** Every connected set of `n` points inside the box, anchored so that it
 *  touches the box's corner: a chain drawn floating in the middle of the box
 *  is the same chain drawn against its edge, one square over. */
function chains(n, off) {
  const cells = [];
  for (let r = 0; r < BOX; r++) for (let c = 0; c < BOX; c++) cells.push(P(c, r));
  const out = new Map();
  const walk = (chosen, start) => {
    if (chosen.length === n) {
      if (!chosen.some(p => p.r === 0) || !chosen.some(p => p.c === 0)) return;
      const seen = new Set([`${chosen[0].c},${chosen[0].r}`]), stack = [chosen[0]];
      while (stack.length) {
        const p = stack.pop();
        for (const [dc, dr] of N4) {
          const q = P(p.c + dc, p.r + dr), k = `${q.c},${q.r}`;
          if (!seen.has(k) && has(chosen, q)) { seen.add(k); stack.push(q); }
        }
      }
      if (seen.size === n) out.set(fmt(chosen), chosen.map(p => P(p.c + off.c, p.r + off.r)));
      return;
    }
    for (let i = start; i < cells.length; i++) walk([...chosen, cells[i]], i + 1);
  };
  walk([], 0);
  return [...out.values()];
}

/** The liberties of a set of points, on the board. */
function liberties(stones) {
  const out = [];
  for (const p of stones) for (const [dc, dr] of N4) {
    const q = P(p.c + dc, p.r + dr);
    if (inB(q) && !has(stones, q) && !has(out, q)) out.push(q);
  }
  return out;
}

/** Every subset of `list` of size `k`. */
function subsets(list, k) {
  if (k === 0) return [[]];
  const out = [];
  const walk = (chosen, start) => {
    if (chosen.length === k) { out.push(chosen.slice()); return; }
    for (let i = start; i < list.length; i++) walk([...chosen, list[i]], i + 1);
  };
  walk([], 0);
  return out;
}

/** A move that touches none of the mover's own stones. */
const isPlacement = (bd, m, colour) => !N4.some(([dc, dr]) => {
  const q = P(m.c + dc, m.r + dr);
  return inB(q) && bd.cells[idx(SIZE, q.c, q.r)] === colour;
});

/** The answer is a stone Black gives away: after it is played, White can take
 *  it straight back. Throw-ins and snapbacks both look like this, and it is
 *  the single hardest thing to see in a capturing problem. */
function isSacrifice(bd, m) {
  const ch = chainAt(bd, m.c, m.r);
  return ch.libs.size === 1;
}

/** One arrangement, solved. Returns the drill or null. */
function ask(setup, target, area) {
  const bd = board(setup, SIZE);
  if (legal(bd) !== null) return null;
  if (at(bd, target) !== "w") return null;
  const near = (p) => has(area, p);
  /* The prover's own definition of the fight, so that the census, the author
     and the test that re-proves the shipped board are all searching the same
     region. They were not, once, and the ranks came out a rank apart. */
  const region = fightRegion(bd, target);
  if (region.length < 3 || region.length > 9) return null;
  /* The chain has to be under real pressure and not already lost: if it has a
     liberty outside the box the search cannot see the fight, and if Black can
     do nothing and still win there is no question to ask. */
  const ch = chainAt(bd, target.c, target.r);
  if ([...ch.libs].some(i => !region.some(p => idx(SIZE, p.c, p.r) === i))) return null;
  if (catches(bd, target, region, "b", "w")) return null;      // already lost: not a question
  const hits = catchers(bd, target, region, "b");
  if (hits.length !== 1) return null;

  /* Nothing floating: every stone on the board has to be part of this fight,
     or the drill is a position with litter in it. */
  const all = [...setup.w, ...setup.b];
  if (all.some(p => !near(p))) return null;

  const answer = hits[0];
  const played = tryPlay(bd, answer.c, answer.r, "b");
  const after = played.board;
  let depth = 1;
  if (at(after, target) === "w") {
    for (depth = 2; depth <= 9; depth++) {
      if (catches(after, target, region, "b", "w", { cap: depth })) break;
    }
  }
  return {
    setup, target, answer, region: region.length, whites: setup.w.length,
    libs: ch.libs.size,
    depth, decoys: region.length - 1,
    placement: isPlacement(bd, answer, "b") ? 1 : 0,
    sacrifice: at(after, answer) === "b" && isSacrifice(after, answer) ? 1 : 0,
    corner: area.some(p => p.c === 0 && p.r === 0) ? 1 : 0,
  };
}

/** The fight, not a fixed box: every point within two of the chain. One step
 *  out is where the liberties are, two is where a block or an extension goes,
 *  and a chain that grows a liberty past that ring has got out, which is what
 *  `catches` already counts as an escape. */
function around(chain) {
  const out = [];
  for (const p of chain) {
    for (let dc = -2; dc <= 2; dc++) for (let dr = -2; dr <= 2; dr++) {
      if (Math.abs(dc) + Math.abs(dr) > 2) continue;
      const q = P(p.c + dc, p.r + dr);
      if (inB(q) && !has(out, q)) out.push(q);
    }
  }
  return out;
}

/** Every arrangement of a white chain of `n` stones at `anchor`, solved. */
export function census(n, anchor = "corner", { extra = true } = {}) {
  const off = ANCHORS[anchor] || ANCHORS.corner;
  const out = [], seen = new Set();
  for (const chain of chains(n, off)) {
    if (chain.some(p => !inB(p))) continue;
    const area = around(chain);
    const libs = liberties(chain);
    if (!libs.length) continue;
    /* Fill enough liberties that the chain is in trouble, and never all of
       them: a chain with no liberties is not a problem, it is a mistake. */
    for (let fill = Math.max(0, libs.length - 3); fill < libs.length; fill++) {
      for (const blacks of subsets(libs, fill)) {
        const spare = area.filter(p => !has(chain, p) && !has(blacks, p));
        const extras = extra
          ? [null, ...spare.map(p => ({ p, colour: "w" })), ...spare.map(p => ({ p, colour: "b" }))]
          : [null];
        /* The same arrangement without the extra stone. If it asks the same
           question with the same answer, the extra stone is decoration, and a
           drill with a stone on it that changes nothing is the same drill
           printed twice. */
        const plain = ask({ w: [...chain], b: [...blacks] }, chain[0], area);
        for (const e of extras) {
          const setup = { w: [...chain], b: [...blacks] };
          if (e) (e.colour === "w" ? setup.w : setup.b).push(e.p);
          const bd = board(setup, SIZE);
          const stamp = bd.cells.map(v => (v === "b" ? 1 : v === "w" ? 2 : 0)).join("");
          if (seen.has(stamp)) continue;
          seen.add(stamp);
          const found = ask(setup, chain[0], area);
          if (!found) continue;
          if (e && plain && same(plain.answer, found.answer)) continue;
          out.push({ ...found, n, anchor });
        }
      }
    }
  }
  return out;
}

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const RUN = process.argv[1] && process.argv[1].split(String.fromCharCode(92)).join("/");
if (RUN && import.meta.url.endsWith(RUN)) {
  const anchors = arg("--anchors", "corner,edge,open").split(",");
  const sizes = arg("--sizes", "1,2,3").split(",").map(Number);
  const out = arg("--out", "");
  const rows = [];
  for (const anchor of anchors) for (const n of sizes) {
    const t0 = Date.now();
    const found = census(n, anchor);
    rows.push(...found);
    console.log(`${anchor}, chain of ${n}: ${found.length} with exactly one catching move`
      + ` (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  console.log(`\ntotal ${rows.length}`);
  if (out) {
    writeFileSync(out, JSON.stringify(rows, null, 1));
    console.log(`written to ${out}`);
  } else if (rows.length) {
    for (const r of rows.slice(0, 3)) {
      console.log(`\n${r.anchor}, ${r.whites} white stones, depth ${r.depth},`
        + ` sacrifice ${r.sacrifice}, answer ${r.answer.c},${r.answer.r}`);
      console.log(show(board(r.setup, SIZE)).split("\n").slice(0, 5).join("\n"));
    }
  }
}
