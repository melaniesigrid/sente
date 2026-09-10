/* ----------------------- POLICY MOVE PICKER (pure) -----------------------
   Turns the human network's policy logits into a move. The network says what a
   player of the profiled rank would play; this samples one of those moves at a
   persona's temperature, masks anything illegal under Sente's rules (ko, superko,
   suicide), and keeps passing sensible: a pass is only sampled when the opponent
   has just passed or when the network itself makes it the top choice late in the
   game.

   An optional `bias(i)` (a master's style lean, in logit units) is added to the
   candidates the network already kept, and only to those: it reorders the network's
   own shortlist and can never lift a move from below the floor. `keepSet` is the
   shortlist on its own so the offline eval scores exactly what the browser samples.

   Logits are indexed y * N + x, with the pass at index N * N, exactly as the
   network emits them. `rng` is injectable so tests are deterministic. */

import { legalMoves } from "../rules.js";

/** The sampler's shortlist for a position: legal candidates (plus the pass when it
 *  is reasonable), their softmax probabilities, and the indices within `floor` of
 *  the best.
 *  @returns {{N:number, NN:number, cands:number[], full:number[], pmax:number, keep:number[]}} */
export function keepSet(logits, rec, floor = 0.02) {
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

  // Softmax over the candidates, then drop the long tail.
  let max = -Infinity;
  for (const i of cands) if (logits[i] > max) max = logits[i];
  const probs = cands.map((i) => Math.exp(logits[i] - max));
  const z = probs.reduce((a, b) => a + b, 0);
  const full = probs.map((p) => p / z);
  const pmax = Math.max(...full);
  const keep = [];
  for (let k = 0; k < cands.length; k++) if (full[k] >= pmax * floor) keep.push(k);
  return { N, NN, cands, full, pmax, keep };
}

/** @param {Float32Array|number[]} logits  N*N+1 policy logits
 *  @param {object} rec       GameRecord (board, toPlay, koPoint, hashes, moves)
 *  @param {object} [o]
 *  @param {number} [o.temperature=0.8]  1 samples the human distribution, 0 picks the top move
 *  @param {number} [o.floor=0.02]       ignore moves below this fraction of the best move's probability
 *  @param {(i: number) => number} [o.bias]  added to the kept candidates' logits (pass included)
 *  @param {() => number} [o.rng]
 *  @returns {{move: [number, number] | null, prob: number, top: Array<{move: [number,number]|null, prob: number}>}} */
export function choosePolicyMove(logits, rec, o = {}) {
  const { temperature = 0.8, floor = 0.02, rng = Math.random, bias = null } = o;
  const { N, NN, cands, full, keep } = keepSet(logits, rec, floor);

  // The distribution the persona samples from: the kept candidates, leaned by the
  // bias if there is one, renormalised. `prob` and `top` report this distribution,
  // so what the UI shows is what was sampled.
  let dist = keep.map((k) => full[k]);
  if (bias) {
    dist = keep.map((k, j) => dist[j] * Math.exp(bias(cands[k])));
    const bz = dist.reduce((a, b) => a + b, 0);
    dist = dist.map((p) => p / bz);
  }
  const dmax = Math.max(...dist);
  const weights = temperature <= 0
    ? dist.map((p) => (p === dmax ? 1 : 0))
    : dist.map((p) => Math.pow(p, 1 / temperature));
  const wz = weights.reduce((a, b) => a + b, 0);
  let u = rng() * wz;
  let chosen = keep.length - 1;
  for (let j = 0; j < keep.length; j++) {
    u -= weights[j];
    if (u <= 0) { chosen = j; break; }
  }

  const toMove = (i) => (i === NN ? null : [i % N, Math.floor(i / N)]);
  const top = keep.map((k, j) => ({ move: toMove(cands[k]), prob: dist[j] }))
    .sort((a, b) => b.prob - a.prob).slice(0, 5);
  return { move: toMove(cands[keep[chosen]]), prob: dist[chosen], top };
}
