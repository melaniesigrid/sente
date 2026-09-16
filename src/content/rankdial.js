/* ----------------------- THE RANK DIAL -----------------------
   One position, and what the shipped human network says about it at five
   ranks. It is here because the house players are the one part of this site a
   visitor cannot check by playing a game: every bot on every server claims a
   strength, and the claim is usually a search depth turned down until it loses
   often enough. Ours is not that. It is KataGo's human-style network, which
   takes the rank as an input and answers as a player of that rank, and the
   honest way to show that is to ask it the same question five times.

   The position is a 3-3 invasion under a supported star point, which is the
   most-played corner in the game and the one whose answer a player learns
   early: block on the side where you already have a stone. Both blocks are
   legal, both are the network's top two moves at every rank on this list, and
   the interesting number is not which it picks but how sure it is.

   The numbers are measurements, not estimates. `tools/kata/rankdial.mjs` runs
   public/models/humanv0.fp16w.onnx through the same encoder the browser uses
   (src/engine/kata/features.js) on the same single-threaded wasm runtime, so a
   percentage printed here is one a player's own machine would produce. To redo
   them:

     node tools/kata/rankdial.mjs --seq "b:15,3 w:3,15 b:15,9 w:16,2" \
       --ranks 20k,10k,3k,1d,9d --top 4

   rankdial.test.js replays the position through the engine, so a figure that
   has drifted from a position the rules accept fails the build rather than
   printing. What it cannot check is that the numbers still belong to the file
   in public/models: change the model and these have to be measured again.

   Pure data. Nothing here touches React. */

/** The moves that build the position, in this repo's own (column, row) with
 *  row 0 at the top. Black has the star point and an extension down the right
 *  side; White has just invaded at the 3-3 point. */
export const DIAL_MOVES = [
  ["b", 15, 3],
  ["w", 3, 15],
  ["b", 15, 9],
  ["w", 16, 2],
];

export const DIAL_SIZE = 19;

/** The corner the figure shows. Only the viewBox moves: the lines are the real
 *  lines and the edge is the real edge (see Board's `crop`). */
export const DIAL_CROP = { c0: 10, r0: 0, c1: 18, r1: 10 };

/** The two blocks, in the order the bars are drawn. `key` names the copy. */
export const DIAL_CANDIDATES = [
  { key: "side", c: 16, r: 3 },
  { key: "top", c: 15, r: 2 },
];

/** Measured 2026-09-16, strongest last, one row per rank: the probability the
 *  network gives each candidate in DIAL_CANDIDATES order. */
export const DIAL_ROWS = [
  { rank: "20k", p: [0.3052, 0.2710] },
  { rank: "10k", p: [0.5518, 0.2663] },
  { rank: "3k", p: [0.6737, 0.2226] },
  { rank: "1d", p: [0.7225, 0.1886] },
  { rank: "9d", p: [0.9171, 0.0656] },
];

/** What the measurement rests on, printed under the figure. */
export const DIAL_SOURCE = {
  model: "humanv0.fp16w.onnx",
  tool: "tools/kata/rankdial.mjs",
  date: "2026-09-16",
};
