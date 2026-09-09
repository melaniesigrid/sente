/* ----------------------- POLICY MOVE PICKER (pure) -----------------------
   Turns the human network's policy logits into a move. The network says what a
   player of the profiled rank would play; this samples one of those moves at a
   persona's temperature, masks anything illegal under Sente's rules (ko, superko,
   suicide), and keeps passing sensible: a pass is only sampled when the opponent
   has just passed or when the network itself makes it the top choice late in the
   game.

   Logits are indexed y * N + x, with the pass at index N * N, exactly as the
   network emits them. `rng` is injectable so tests are deterministic. */

import { legalMoves } from "../rules.js";

/** @param {Float32Array|number[]} logits  N*N+1 policy logits
 *  @param {object} rec       GameRecord (board, toPlay, koPoint, hashes, moves)
 *  @param {object} [o]
 *  @param {number} [o.temperature=0.8]  1 samples the human distribution, 0 picks the top move
 *  @param {number} [o.floor=0.02]       ignore moves below this fraction of the best move's probability
 *  @param {() => number} [o.rng]
 *  @returns {{move: [number, number] | null, prob: number, top: Array<{move: [number,number]|null, prob: number}>}} */
export function choosePolicyMove(logits, rec, o = {}) {
  const { temperature = 0.8, floor = 0.02, rng = Math.random } = o;
  const N = rec.board.size, NN = N * N;
  if (logits.length !== NN + 1) throw new RangeError(`expected ${NN + 1} logits, got ${logits.length}`);

  const legal = legalMoves(rec.board, rec.toPlay, {
    koPoint: rec.koPoint ?? null, history: rec.hashes ?? null,
    hash: rec.hashes ? rec.hashes[rec.hashes.length - 1] : undefined,
  });
  const n = rec.moves.length;
  const oppPassed = n > 0 && rec.moves[n - 1].type === "pass";

  // Candidate indices: legal points, plus the pass when it is reasonable.
  const cands = legal.map(([c, r]) => r * N + c);
  let best = -Infinity;
  for (const i of cands) if (logits[i] > best) best = logits[i];
  const passIsTop = logits[NN] >= best;
  const lateGame = n >= Math.round(NN * 0.5);
  if (oppPassed || (passIsTop && lateGame) || cands.length === 0) cands.push(NN);

  // Softmax over the candidates, then drop the long tail before applying temperature.
  let max = -Infinity;
  for (const i of cands) if (logits[i] > max) max = logits[i];
  const probs = cands.map((i) => Math.exp(logits[i] - max));
  const z = probs.reduce((a, b) => a + b, 0);
  const full = probs.map((p) => p / z);
  const pmax = Math.max(...full);
  const keep = [];
  for (let k = 0; k < cands.length; k++) if (full[k] >= pmax * floor) keep.push(k);

  const weights = temperature <= 0
    ? keep.map((k) => (full[k] === pmax ? 1 : 0))
    : keep.map((k) => Math.pow(full[k], 1 / temperature));
  const wz = weights.reduce((a, b) => a + b, 0);
  let u = rng() * wz;
  let chosen = keep[keep.length - 1];
  for (let j = 0; j < keep.length; j++) {
    u -= weights[j];
    if (u <= 0) { chosen = keep[j]; break; }
  }

  const toMove = (i) => (i === NN ? null : [i % N, Math.floor(i / N)]);
  const top = keep.map((k) => ({ move: toMove(cands[k]), prob: full[k] }))
    .sort((a, b) => b.prob - a.prob).slice(0, 5);
  return { move: toMove(cands[chosen]), prob: full[chosen], top };
}
