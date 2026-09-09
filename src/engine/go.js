/* GO ENGINE (pure) — no React, no DOM. Safe to move to a server. */
/* ----------------------- GO ENGINE (pure) ----------------------- */
export const N = 9;
export const idx = (c, r) => r * N + c;
export const inB = (c, r) => c >= 0 && c < N && r >= 0 && r < N;
export const NBRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const emptyBoard = () => Array(N * N).fill(null);

export function chainAt(board, c, r) {
  const color = board[idx(c, r)];
  const seen = new Set([idx(c, r)]);
  const stack = [[c, r]];
  const stones = [];
  const libs = new Set();
  while (stack.length) {
    const [x, y] = stack.pop();
    stones.push([x, y]);
    for (const [dx, dy] of NBRS) {
      const nx = x + dx, ny = y + dy;
      if (!inB(nx, ny)) continue;
      const v = board[idx(nx, ny)];
      if (v === null) libs.add(idx(nx, ny));
      else if (v === color && !seen.has(idx(nx, ny))) {
        seen.add(idx(nx, ny));
        stack.push([nx, ny]);
      }
    }
  }
  return { stones, libs };
}

/** Attempt a move. Returns { board, captured, ko } or null if illegal.
 *  Enforces occupied-point, simple-ko, and suicide rules. */
export function tryPlay(board, c, r, color, koPoint) {
  if (!inB(c, r) || board[idx(c, r)] !== null) return null;
  if (koPoint === idx(c, r)) return null;
  const opp = color === "b" ? "w" : "b";
  const nb = board.slice();
  nb[idx(c, r)] = color;
  const captured = [];
  for (const [dx, dy] of NBRS) {
    const nx = c + dx, ny = r + dy;
    if (!inB(nx, ny) || nb[idx(nx, ny)] !== opp) continue;
    const ch = chainAt(nb, nx, ny);
    if (ch.libs.size === 0) {
      for (const [sx, sy] of ch.stones) {
        if (nb[idx(sx, sy)] === opp) { nb[idx(sx, sy)] = null; captured.push([sx, sy]); }
      }
    }
  }
  const mine = chainAt(nb, c, r);
  if (mine.libs.size === 0) return null; // suicide
  let ko = null;
  if (captured.length === 1 && mine.stones.length === 1 && mine.libs.size === 1) {
    ko = idx(captured[0][0], captured[0][1]); // simple ko
  }
  return { board: nb, captured, ko };
}

/** Area-scoring estimate (Chinese-style): stones + single-color empty regions. */
export function estimateScore(board) {
  const seen = new Set();
  let bT = 0, wT = 0, bS = 0, wS = 0;
  for (let i = 0; i < N * N; i++) {
    if (board[i] === "b") bS++;
    else if (board[i] === "w") wS++;
  }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const i = idx(c, r);
    if (board[i] !== null || seen.has(i)) continue;
    const region = [];
    const borders = new Set();
    const stack = [[c, r]];
    seen.add(i);
    while (stack.length) {
      const [x, y] = stack.pop();
      region.push([x, y]);
      for (const [dx, dy] of NBRS) {
        const nx = x + dx, ny = y + dy;
        if (!inB(nx, ny)) continue;
        const v = board[idx(nx, ny)];
        if (v === null && !seen.has(idx(nx, ny))) { seen.add(idx(nx, ny)); stack.push([nx, ny]); }
        else if (v !== null) borders.add(v);
      }
    }
    if (borders.size === 1) {
      if (borders.has("b")) bT += region.length; else wT += region.length;
    }
  }
  return { black: bS + bT, white: wS + wT };
}
