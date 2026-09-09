/* ----------------------- SCORING (pure) -----------------------
   Area scoring (Chinese / AGA counting): a colour's score is its living stones plus the
   empty points only it borders. Dead stones are removed first, so their points fall to
   whoever surrounds them. Regions bordering both colours (dame, seki) are neutral.

   White receives komi and, in handicap games, one point per handicap stone after the
   first — the AGA convention that makes area counting agree with territory counting. */

import { NBRS, idx, inB } from "./board.js";

/** Remove `dead` (indices) from a copy of the board. */
export function removeDead(board, dead = []) {
  if (!dead.length) return board;
  const cells = board.cells.slice();
  for (const i of dead) cells[i] = null;
  return { size: board.size, cells };
}

/** Per-point owner map: "b" | "w" | "neutral". Stones own their own point. */
export function territoryMap(board) {
  const { size, cells } = board;
  const n = size * size;
  const map = Array(n).fill("neutral");
  const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (cells[i] !== null) { map[i] = cells[i]; continue; }
    if (seen[i]) continue;
    const region = [];
    const borders = new Set();
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop();
      region.push(j);
      const c = j % size, r = Math.floor(j / size);
      for (const [dx, dy] of NBRS) {
        const nx = c + dx, ny = r + dy;
        if (!inB(size, nx, ny)) continue;
        const k = idx(size, nx, ny);
        const v = cells[k];
        if (v === null) { if (!seen[k]) { seen[k] = 1; stack.push(k); } }
        else borders.add(v);
      }
    }
    if (borders.size === 1) {
      const owner = borders.has("b") ? "b" : "w";
      for (const j of region) map[j] = owner;
    }
  }
  return map;
}

/** Full score. `dead` is a list of point indices whose stones are removed before counting.
 *  Returns totals, a winner ("b" | "w" | null for jigo) with margin, and the territory map. */
export function scoreBoard(board, { dead = [], komi = 0, handicap = 0 } = {}) {
  const live = removeDead(board, dead);
  const territory = territoryMap(live);
  const tally = { b: { stones: 0, territory: 0 }, w: { stones: 0, territory: 0 } };
  for (let i = 0; i < territory.length; i++) {
    const owner = territory[i];
    if (owner === "neutral") continue;
    if (live.cells[i] !== null) tally[owner].stones++;
    else tally[owner].territory++;
  }
  const handicapBonus = handicap >= 2 ? handicap - 1 : 0;
  const black = { ...tally.b, area: tally.b.stones + tally.b.territory };
  const white = { ...tally.w, area: tally.w.stones + tally.w.territory, komi, handicapBonus };
  const totals = { b: black.area, w: white.area + komi + handicapBonus };
  const diff = totals.b - totals.w;
  const winner = diff > 0 ? "b" : diff < 0 ? "w" : null;
  return { territory, dead: dead.slice(), black, white, totals, winner, margin: Math.abs(diff) };
}

/** Quick area estimate with no dead-stone removal and no komi: `{ black, white }`. */
export function estimateScore(board) {
  const s = scoreBoard(board);
  return { black: s.totals.b, white: s.totals.w };
}
