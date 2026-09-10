import { NBRS, idx, inB, chainAt } from "./board.js";
import { tryPlay } from "./rules.js";
import { hashBoard } from "./zobrist.js";
import { createRng, positionSeed } from "./rng.js";

/* ------------- HOUSE-PLAYER AI (parameterized heuristic) -------------
   Capture-aware move picker whose weights are tuned per persona.
   Honest label everywhere in-app: these are house players (bots),
   not humans — the seam for a real matchmaking backend is the same
   game loop with moves arriving over a socket instead.

   Works on any board size. Edge scoring is by distance from the edge,
   so 3rd/4th-line preferences carry over; the pass threshold scales
   with the board area (34 moves on 9x9, as before).

   Noise comes from `opts.rng` (default Math.random). Pass `opts.seed` instead and
   the noise is drawn from a generator seeded by (seed, position hash): the reply
   is then a pure function of the seed and the board, the same on every device
   and unchanged by undoing and replaying. That is what a shared daily game needs. */
export function aiChooseMove(board, color, koPoint, moveNum, W = {}, opts = {}) {
  const w = { capture: 12, rescue: 9, atari: 3, selfAtari: -15, eyeFill: -20, libs: 0.7,
    edge: 1, noise: 1.5, near: 0.6, ...W };
  const { size } = board;
  const opp = color === "b" ? "w" : "b";
  const hash = opts.hash ?? hashBoard(board);
  const playOpts = { koPoint, history: opts.history ?? null, hash };
  const rng = opts.seed !== undefined ? createRng(positionSeed(opts.seed, hash)) : (opts.rng ?? Math.random);
  let best = null, bestScore = -Infinity, bestBase = -Infinity;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    const res = tryPlay(board, c, r, color, playOpts);
    if (!res.ok) continue;
    const mine = chainAt(res.board, c, r);
    let s = res.captured.length * w.capture;
    for (const [dx, dy] of NBRS) {
      const nx = c + dx, ny = r + dy;
      if (!inB(size, nx, ny)) continue;
      const v = board.cells[idx(size, nx, ny)];
      if (v === color) {
        const ch = chainAt(board, nx, ny);
        if (ch.libs.size === 1 && mine.libs.size >= 2) s += w.rescue;
      } else if (v === opp && res.board.cells[idx(size, nx, ny)] === opp) {
        const ch = chainAt(res.board, nx, ny);
        if (ch.libs.size === 1) s += w.atari;
      }
    }
    if (mine.libs.size === 1 && res.captured.length === 0) s += w.selfAtari;
    // Filling a one-point eye of our own (every neighbour ours or the edge) only ever
    // loses an eye; without this the bot fills its own territory rather than pass.
    let ownEye = res.captured.length === 0;
    for (const [dx, dy] of NBRS) {
      const nx = c + dx, ny = r + dy;
      if (inB(size, nx, ny) && board.cells[idx(size, nx, ny)] !== color) { ownEye = false; break; }
    }
    if (ownEye) s += w.eyeFill;
    s += Math.min(mine.libs.size, 4) * w.libs;
    const dEdge = Math.min(c, r, size - 1 - c, size - 1 - r);
    s += (dEdge === 2 ? 2.2 : dEdge === 3 ? 1.6 : dEdge === 1 ? 0.8 : dEdge === 0 ? -1.5 : 1.0) * w.edge;
    if (moveNum < 8 && dEdge === 2) s += 1.2 * w.edge;
    let near = 0;
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      if (!dc && !dr) continue;
      const nx = c + dc, ny = r + dr;
      if (inB(size, nx, ny) && board.cells[idx(size, nx, ny)] !== null) near++;
    }
    s += (moveNum > 6 ? Math.min(near, 3) * w.near : near === 0 ? 0.5 : near * 0.3);
    const base = s;
    s += rng() * w.noise;
    if (s > bestScore) { bestScore = s; bestBase = base; best = [c, r]; }
  }
  // Pass when nothing worthwhile is left. Judged on the noise-free score so a noisy
  // persona (Hoshi, noise 6) cannot talk itself into playing forever.
  const lateGame = Math.round(size * size * 0.42); // 34 on 9x9
  if (moveNum > lateGame && bestBase < 3) return null;
  return best;
}

/** Same picker, fed from a GameRecord so superko history and the ko point are honoured. */
export function aiChooseMoveForRecord(rec, W = {}, opts = {}) {
  if (rec.phase !== "playing") return null;
  return aiChooseMove(rec.board, rec.toPlay, rec.koPoint, rec.moves.length, W, {
    ...opts, history: rec.hashes, hash: rec.hashes[rec.hashes.length - 1],
  });
}
