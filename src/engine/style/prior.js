/* ----------------------- STYLE PRIOR (pure) -----------------------
   A small lean the master's way, applied to the network's own shortlist. Per axis
   the eval measured how the master's moves differ from the network's choices on
   the same positions (`masterMoves` against `baseline`, in units of `moveSpread`);
   a candidate that sits on the master's side of that difference scores positive,
   on the network's side negative, and zero when master and network agree. The
   result is in logit units and scaled by λ, which the eval chose on the dev split.

     prior(i) = λ · Σ_axis clamp(z_master) · clamp(z_candidate)
     z_master     = (masterMoves[a] − baseline[a]) / moveSpread[a]
     z_candidate  = (candidate[a] − baseline[a]) / moveSpread[a]

   Only the per-move axes take part (line, contact, tenuki, thickness, quadrant,
   atari); a candidate whose axis is undefined (no enemy stone yet, say) skips it.
   The pass scores zero. */

import { moveAxesVector } from "./features.js";

export const DEFAULT_LAMBDA = 1;
export const DEFAULT_CLAMP = 2;

const clampTo = (x, c) => Math.max(-c, Math.min(c, x));

/** The lean per axis, clamped; null on axes the style data cannot compare. */
export function styleLean(style, clamp = DEFAULT_CLAMP) {
  const { moveAxes, masterMoves, baseline, moveSpread } = style;
  if (!moveAxes || !masterMoves || !baseline || !moveSpread) return null;
  const lean = {};
  for (const a of moveAxes) {
    const m = masterMoves[a], b = baseline[a], s = moveSpread[a];
    lean[a] = m == null || b == null || s == null || s <= 0 ? null : clampTo((m - b) / s, clamp);
  }
  return lean;
}

/** Build the prior for one position. Returns a function of the candidate index, or
 *  null when the style data has no baseline yet (the eval has not run).
 *  @param {object} style   master.style from the master's JSON
 *  @param {object} rec     GameRecord at the position
 *  @param {object} [o]     { lambda, clamp } */
export function stylePrior(style, rec, o = {}) {
  const lambda = o.lambda ?? DEFAULT_LAMBDA, clamp = o.clamp ?? DEFAULT_CLAMP;
  const lean = styleLean(style, clamp);
  if (!lean || lambda === 0) return null;
  const { moveAxes, baseline, moveSpread } = style;
  const N = rec.board.size, NN = N * N;
  const color = rec.toPlay;
  let lastEnemy = null;
  for (let k = rec.moves.length - 1; k >= 0; k--) {
    const m = rec.moves[k];
    if (m.type === "play" && m.color !== color) { lastEnemy = [m.c, m.r]; break; }
  }
  const ctx = { lastEnemy, moveNumber: rec.moves.length + 1 };
  const cache = new Map();
  return (i) => {
    if (i === NN) return 0;
    let v = cache.get(i);
    if (v === undefined) {
      const axes = moveAxesVector(rec.board, i % N, Math.floor(i / N), color, ctx);
      v = 0;
      for (const a of moveAxes) {
        if (lean[a] === null || axes[a] == null) continue;
        v += lean[a] * clampTo((axes[a] - baseline[a]) / moveSpread[a], clamp);
      }
      v *= lambda;
      cache.set(i, v);
    }
    return v;
  };
}
