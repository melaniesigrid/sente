/* ----------------------- THE TESUJI CENSUS -----------------------
   The capture census could not find a snapback, and said so. The reason was
   structural rather than a bug: `catches` watches one chain and asks whether
   it comes off the board, and in a snapback the chain that comes off is not
   the chain it was watching. A solver written around a target never sees the
   move, and it never sees a throw-in or a capture under the stones either, for
   the same reason.

   `prisoners` in the prover asks the other question: over the whole sequence,
   how many stones does Black take, less the stones White takes back. A stone
   given away costs one and comes back as three, and a search that counts to
   the end of the fight finds it.

   This enumerates the same arrangements the capture census does - a white
   chain, some of its liberties filled with black stones, and one or two
   further stones nearby - and re-solves every one of them by counting
   prisoners instead of chasing a target. An arrangement is kept when it asks a
   question with one answer: exactly one move is best for Black, the second
   best is worth strictly less, and doing nothing is worth less than the move.

   ----------------------- AND WHAT IT DID NOT FIND -----------------------

   No snapback. The solver can represent one and does: an early run found two,
   and they went away when the region was corrected, because with a stray white
   stone inside it Black had a bigger capture elsewhere and the sacrifice was
   only second best. With the region right and one white group on the board,
   the census across the corner, the edge and the open board turned up none at
   all, and the reason is worth writing down rather than trying harder.

   A snapback is a two-liberty shape. Black plays one of the two liberties,
   giving a stone away; White captures with the other; and White's chain, now
   one stone longer, has only the point it just emptied. But that argument is
   symmetric. If it works at one of the two points it works at the other, so
   the position has two right answers and is not a problem at all - and the
   census drops it for exactly that reason. A real snapback is asymmetric, and
   the asymmetry has to come from the surrounding stones. Filling liberties
   until White has three rather than two was tried, and found nothing either.

   So the shape this enumeration produces is not the shape a snapback needs.
   What it needs is a group with room to live, one defect in it, and stones
   around it that make the two sides of the defect different: a corner position
   from a real game rather than a chain with stones dropped beside it. That is
   a different generator, and it is written up in TODO.md rather than guessed
   at here.

   What the census does find is the other half of the family: fights where the
   winning move pays later rather than now. Those are the drills this ships,
   and they are the first in the collection above 5 kyu.

   Nothing here ships. `author.mjs` turns the output into drills.

     node tools/problems/tesuji.mjs                 corner, chains of 2-4
     node tools/problems/tesuji.mjs --anchors edge,open --out tesuji.json */
import { writeFileSync } from "node:fs";
import {
  board, captureValues, tesujiRegion, readingHorizon, legal, show,
} from "./prove.mjs";
import { chains, liberties, subsets, around, has, inB, ANCHORS } from "./capture.mjs";
import { idx, chainAt } from "../../src/engine/index.js";

const SIZE = 9;

/** How many separate white chains stand on the board. */
function whiteChains(bd) {
  const seen = new Set();
  let n = 0;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (bd.cells[idx(SIZE, c, r)] !== "w") continue;
    const key = chainAt(bd, c, r).stones.map(([x, y]) => `${x},${y}`).sort().join(" ");
    if (seen.has(key)) continue;
    seen.add(key);
    n++;
  }
  return n;
}


/** One arrangement, solved by counting prisoners. Returns the drill or null. */
function ask(setup, area, opts = {}) {
  const { cap = 7 } = opts;
  const bd = board(setup, SIZE);
  if (legal(bd) !== null) return null;

  /* The prover's own definition of the fight, so the census, the author and
     the test that re-proves the shipped board all search the same points. */
  const region = tesujiRegion(bd);
  if (region.length < 3 || region.length > 8) return null;

  /* Nothing floating: every stone has to be part of this fight. */
  if ([...setup.w, ...setup.b].some(p => !has(area, p))) return null;

  /* One white group, and this one is not tidiness. A second white chain gives
     Black somewhere else to play, and somewhere else is usually worth more
     than the tesuji: the first snapback this census found stopped being a
     snapback the moment the region was widened to include a stray white stone,
     because capturing that stone as well was worth a stone more. A tesuji
     problem is a question about one group, so the board holds one group. */
  if (whiteChains(bd) !== 1) return null;

  const v = captureValues(bd, region, "b", { cap });
  if (v.moves.length < 2) return null;
  const best = v.moves[0], second = v.moves[1];
  if (best.net <= 0) return null;                       // nothing to win
  if (best.net <= v.pass) return null;                  // waiting is as good
  if (best.net <= second.net) return null;              // no unique answer

  /* ----------------------- WHAT SURVIVED THE CENSUS -----------------------
     The first run kept every position where one move was uniquely best, and
     the result was a lesson in what a filter is for. Almost all of them were
     two or three white stones alone on an edge with a couple of black ones
     near them: positions whose honest description is not "find the tesuji"
     but "this group was never alive". The life-and-death census already has
     those, and draws them better, walled in and sealed rather than adrift on
     an empty board.

     So the bar is different for the two halves of what comes out. A sacrifice
     is self-evidently a tesuji and is kept on sight: Black gives a stone away
     and still comes out ahead, and no amount of staring at the position makes
     that an obvious move. Everything else has to prove it is a fight rather
     than a corpse: Black committed at least as many stones as White, the move
     takes the whole white group rather than a fragment of it, and it is not
     an atari that merely happens to work. */
  if (!best.sacrifice) {
    if (setup.b.length < setup.w.length) return null;
    if (best.net < setup.w.length) return null;
    if (best.takes > 0 && best.net <= best.takes) return null;
  }

  const depth = readingHorizon(bd, region, "b", best.point, cap);

  return {
    kind: "tesuji",
    setup, answer: best.point, net: best.net, second: second.net,
    sacrifice: best.sacrifice ? 1 : 0, takes: best.takes,
    region: region.length, decoys: region.length - 1,
    whites: setup.w.length, depth,
    corner: region.some(p => p.c === 0 && p.r === 0) ? 1 : 0,
  };
}

/* ----------------------- WHY TWO LIBERTIES -----------------------
   A snapback is a shape with exactly two liberties, and it took a census to
   see why it has to be. Black plays one of them, giving a stone away; White
   captures by taking the other; and White's chain, now one stone longer, has
   only the point it just emptied, so Black takes everything.

   That means a symmetric two-liberty shape is not a problem. Both points work,
   there is no single answer, and a collection that shipped one would be asking
   a question with two right answers. What makes a real snapback is an
   asymmetry somewhere in the stones around it: one of the two points is
   different from the other, so only one of them is the move.

   So the enumeration aims at exactly that. Liberties are filled until White
   has precisely two left, and then one or two further stones are dropped
   nearby, which is where the asymmetry comes from. */
export function census(n, anchor = "corner", { cap = 7, extras = 2, leave = 2 } = {}) {
  const off = ANCHORS[anchor] || ANCHORS.corner;
  const out = [], seen = new Set();
  for (const chain of chains(n, off)) {
    if (chain.some(p => !inB(p))) continue;
    const area = around(chain);
    const libs = liberties(chain);
    /* Leave White exactly two liberties: fewer is atari and the capture
       census has it, more and the fight is bigger than this region. */
    if (libs.length < leave) continue;
    for (const blacks of subsets(libs, libs.length - leave)) {
      const spare = area.filter(p => !has(chain, p) && !has(blacks, p));
      for (const extra of extraSets(spare, extras)) {
        const setup = { w: [...chain], b: [...blacks] };
        for (const e of extra) (e.colour === "w" ? setup.w : setup.b).push(e.p);
        /* A siege, not a sketch: too few black stones and the board looks like
           nothing is happening, whatever the search says. */
        if (setup.b.length < 2) continue;
        const bd = board(setup, SIZE);
        const stamp = bd.cells.map(v => (v === "b" ? 1 : v === "w" ? 2 : 0)).join("");
        if (seen.has(stamp)) continue;
        seen.add(stamp);
        const found = ask(setup, area, { cap });
        if (!found) continue;
        /* Every stone has to change the answer. A dropped stone that leaves
           the same move best is decoration, and a drill with decoration on it
           is the same drill printed twice with a smudge. This was the single
           biggest source of near-twins in the capture census. */
        if (extra.length && extra.some(e => {
          const without = {
            w: setup.w.filter(p2 => !(e.colour === "w" && p2.c === e.p.c && p2.r === e.p.r)),
            b: setup.b.filter(p2 => !(e.colour === "b" && p2.c === e.p.c && p2.r === e.p.r)),
          };
          const plain = ask(without, area, { cap });
          return plain && plain.answer.c === found.answer.c && plain.answer.r === found.answer.r;
        })) continue;
        out.push({ ...found, n, anchor });
      }
    }
  }
  return out;
}

/** Every way to drop up to `k` further stones of either colour on `spare`. */
function extraSets(spare, k) {
  const out = [[]];
  const stones = [
    ...spare.map(p => ({ p, colour: "w" })),
    ...spare.map(p => ({ p, colour: "b" })),
  ];
  for (let take = 1; take <= k; take++) {
    const walk = (chosen, start) => {
      if (chosen.length === take) { out.push(chosen.slice()); return; }
      for (let i = start; i < stones.length; i++) {
        /* One stone per point: the same point cannot hold both colours. */
        if (chosen.some(c => c.p.c === stones[i].p.c && c.p.r === stones[i].p.r)) continue;
        walk([...chosen, stones[i]], i + 1);
      }
    };
    walk([], 0);
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
  const sizes = arg("--sizes", "2,3").split(",").map(Number);
  /* Two extra stones is where the asymmetry comes from and also where the cost
     comes from: the spare points go up as the square. One is the run that
     finishes; two is the run you leave going. */
  const extras = Number(arg("--extras", "1"));
  const leave = Number(arg("--leave", "2"));
  const out = arg("--out", "");
  const rows = [];
  for (const anchor of anchors) for (const n of sizes) {
    const t0 = Date.now();
    const found = census(n, anchor, { extras, leave });
    rows.push(...found);
    const sac = found.filter(r => r.sacrifice).length;
    console.log(`${anchor}, chain of ${n}: ${found.length} tesuji, ${sac} of them a sacrifice`
      + ` (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  console.log(`\ntotal ${rows.length}, ${rows.filter(r => r.sacrifice).length} sacrifices`);
  if (out) {
    writeFileSync(out, JSON.stringify(rows, null, 1));
    console.log(`written to ${out}`);
  } else {
    for (const r of rows.filter(x => x.sacrifice).slice(0, 3)) {
      console.log(`\nsacrifice: answer ${r.answer.c},${r.answer.r} nets ${r.net},`
        + ` next best ${r.second}, depth ${r.depth}`);
      console.log(show(board(r.setup, SIZE)).split("\n").slice(0, 5).join("\n"));
    }
  }
}
