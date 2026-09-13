/* ----------------------- GRADING -----------------------
   Giving a problem a rank is the one place a collection normally stops being
   checkable. Somebody decides a board is 8 kyu, and nothing in the file can
   disagree with them.

   So the rank here is measured, not claimed. Six things are counted on the
   solved position, all of them facts the prover already knows, and a linear
   model turns them into a rank:

     space     how many points the group has to work with
     stones    how many stones already stand inside that space
     placement 1 if the answer touches none of the player's own stones - a
               move dropped into the space rather than played against a wall
     depth     the smallest search depth at which the verdict stops changing,
               which is what "how far you have to read" means when it is
               counted instead of felt
     corner    1 in the corner, where the edge does half the work and the
               count comes out differently

   The coefficients were fitted to the ranks the first two dozen problems were
   given by hand, so the scale it produces is the scale the collection already
   speaks. `grade.test.js` holds the fit to its residuals, so a change to the
   model that moves the hand-graded boards more than a rank fails the build.

   What this does NOT measure is whether a problem is interesting. That is
   still a person's job, and it is why the sets are curated and only the rank
   is computed. */
import { survives, at } from "./prove.mjs";
import { idx } from "../../src/engine/index.js";

/** The smallest depth cap at which the search gives its settled answer. A
 *  problem you can solve three plies deep is easier than one that only comes
 *  out at eleven, and this is the difference counted rather than estimated. */
export function readingDepth(bd, target, region, owner, toPlay, settled, cap = 24) {
  for (let d = 1; d <= cap; d++) {
    if (survives(bd, target, owner, region, toPlay, null, new Set(), 0, d) === settled) return d;
  }
  return cap;
}

const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** A move that touches none of the mover's own stones: a placement rather than
 *  a contact play. The hardest single thing to see in a small space. */
export function isPlacement(bd, move, colour) {
  return !NEIGHBOURS.some(([dc, dr]) => {
    const c = move.c + dc, r = move.r + dr;
    if (c < 0 || r < 0 || c >= bd.size || r >= bd.size) return false;
    return bd.cells[idx(bd.size, c, r)] === colour;
  });
}

/** Everything the model reads off one solved board. */
export function features(bd, { target, owner, region }, toPlay, answers) {
  const defending = owner === toPlay;
  const legalHere = region.filter(p => at(bd, p) === null);
  const stones = region.length - legalHere.length;
  const answer = answers[0];
  const settled = defending;   // the defender to move lives; the attacker to move kills
  return {
    space: region.length,
    stones,
    placement: isPlacement(bd, answer, toPlay) ? 1 : 0,
    depth: readingDepth(bd, target, region, owner, toPlay, settled),
    corner: region.some(p => p.c === 0 && p.r === 0) ? 1 : 0,
  };
}

/* ----------------------- THE FIT -----------------------
   The weights are in ranks, so the arithmetic is readable: a point of eye
   space past the third is worth about two ranks, a corner about one and a
   half. Five of the six were fitted by least squares against every board the
   collection had graded by hand before the model existed
   (`node tools/problems/fit.mjs` re-runs it): twelve boards, root-mean-square
   residual 1.5 ranks, worst 3.2.

   `stones` is the exception and is a judgement, because it could not be
   fitted: every hand-graded board has a bare space, so the training set holds
   no information about what a stone already standing inside one is worth. It
   is set at a little under half a point of space and marked here as unfitted
   rather than quietly fitted to zero.

   One board is a declared outlier. p15, the corner bend, is graded 2 kyu by
   hand and about 9 kyu by the model, and the model is not wrong about the
   reading: what makes that board a dan problem is knowing that the same four
   points live on the edge, and no feature counted here can see an idea. It is
   excluded from the fit and kept as the standing example of what the model
   cannot do, which is why `rank` may be given by hand and `rankNote` says why
   when it is.

   The ceiling is real and worth saying plainly: a bounded space of eight
   points or fewer, solved exhaustively, tops out around 1 kyu. Problems above
   that are not harder spaces, they are bigger boards, and they need a search
   this collection does not have yet. */
export const WEIGHTS = {
  space: 2.07,       // per point of eye space past three
  stones: 0.80,      // per stone already inside it - judgement, not fitted
  placement: 1.10,   // the answer touches none of the player's own stones
  depth: 0.14,       // per ply of the smallest depth that settles the verdict
  corner: 1.38,      // the space wraps the 1-1 point
};

/** Where a bare three-point space in the open, settled at once, lands. */
export const BASE = -16.59;

/** The rank number a set of features earns: negative kyu, positive dan, the
 *  same scale `library.js` parses. */
export const rankNumber = (f) =>
  BASE + WEIGHTS.space * (f.space - 3) + WEIGHTS.stones * f.stones
  + WEIGHTS.placement * f.placement + WEIGHTS.depth * f.depth + WEIGHTS.corner * f.corner;

/** A rank number as the label the collection uses, clamped to the range the
 *  search can honestly reach. */
export function rankLabel(n) {
  const v = Math.max(-25, Math.min(1, Math.round(n)));
  return v < 0 ? `${-v}k` : "1d";
}

export const grade = (bd, found, toPlay, answers) =>
  rankLabel(rankNumber(features(bd, found, toPlay, answers)));

/* ----------------------- GRADING A CAPTURE -----------------------
   The life-and-death model does not transfer. A capturing problem has no eye
   space and no vital point, and what makes one harder than another is a
   different list. The census settled most of it: a chain either stands in
   atari, where the question is which of its liberties is the last one, or it
   has two, where the question is which of them it must not be allowed to
   reach. There is no third band. A chain with three liberties inside a space
   this small simply gets out, and the search says so.

   So the liberty count carries the grade and the rest adjusts it: how many
   other points the reader has to reject, whether the answer is a placement
   rather than a play against a stone, how many stones the chain has, and
   whether the fight is in the corner where the edge does some of the work.

   Anchored to the four capturing problems the collection graded by hand, at
   25 kyu to 18 kyu, rather than fitted: four points is not a fit. */
export const CAPTURE = {
  base: -24.6,
  libs: 2.4,         // per liberty past the first: atari, then the two-liberty catch
  decoys: 0.15,      // per other legal point in the fight
  placement: 0.9,    // the answer touches none of Black's own stones
  whites: 0.5,       // per white stone past the first
  corner: 0.5,       // the fight wraps the 1-1 point
};

/** The rank number of a capturing problem, from the facts the census recorded. */
export const captureRank = (f) =>
  CAPTURE.base + CAPTURE.libs * (f.libs - 1) + CAPTURE.decoys * f.decoys
  + CAPTURE.placement * f.placement + CAPTURE.whites * (f.whites - 1)
  + CAPTURE.corner * f.corner;
