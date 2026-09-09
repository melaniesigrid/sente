import { N, idx, inB, NBRS, chainAt, tryPlay } from "./go.js";

/* ------------- HOUSE-PLAYER AI (parameterized heuristic) -------------
   Capture-aware move picker whose weights are tuned per persona.
   Honest label everywhere in-app: these are house players (bots),
   not humans — the seam for a real matchmaking backend is the same
   game loop with moves arriving over a socket instead. */
export function aiChooseMove(board, color, koPoint, moveNum, W = {}) {
  const w = { capture: 12, rescue: 9, atari: 3, selfAtari: -15, libs: 0.7,
    edge: 1, noise: 1.5, near: 0.6, ...W };
  const opp = color === "b" ? "w" : "b";
  let best = null, bestScore = -Infinity;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const res = tryPlay(board, c, r, color, koPoint);
    if (!res) continue;
    const mine = chainAt(res.board, c, r);
    let s = res.captured.length * w.capture;
    for (const [dx, dy] of NBRS) {
      const nx = c + dx, ny = r + dy;
      if (!inB(nx, ny)) continue;
      const v = board[idx(nx, ny)];
      if (v === color) {
        const ch = chainAt(board, nx, ny);
        if (ch.libs.size === 1 && mine.libs.size >= 2) s += w.rescue;
      } else if (v === opp && res.board[idx(nx, ny)] === opp) {
        const ch = chainAt(res.board, nx, ny);
        if (ch.libs.size === 1) s += w.atari;
      }
    }
    if (mine.libs.size === 1 && res.captured.length === 0) s += w.selfAtari;
    s += Math.min(mine.libs.size, 4) * w.libs;
    const dEdge = Math.min(c, r, N - 1 - c, N - 1 - r);
    s += (dEdge === 2 ? 2.2 : dEdge === 3 ? 1.6 : dEdge === 1 ? 0.8 : dEdge === 0 ? -1.5 : 1.0) * w.edge;
    if (moveNum < 8 && dEdge === 2) s += 1.2 * w.edge;
    let near = 0;
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      if (!dc && !dr) continue;
      const nx = c + dc, ny = r + dr;
      if (inB(nx, ny) && board[idx(nx, ny)] !== null) near++;
    }
    s += (moveNum > 6 ? Math.min(near, 3) * w.near : near === 0 ? 0.5 : near * 0.3);
    s += Math.random() * w.noise;
    if (s > bestScore) { bestScore = s; best = [c, r]; }
  }
  if (moveNum > 34 && bestScore < 3) return null; // pass when nothing worthwhile
  return best;
}
