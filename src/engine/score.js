/* ----------------------- SCORING (pure) -----------------------
   Two counts, chosen by the ruleset (see rulesets.js).

   Area (Chinese, AGA, New Zealand): a colour's score is its living stones plus the
   empty points only it borders. Filling your own territory costs nothing.

   Territory (Japanese): the empty points only it borders, plus every enemy stone it
   has captured: the prisoners taken during play and the dead stones lifted at the
   end. Stones on the board are worth nothing, so filling your own territory costs a
   point. The same board can land on a different winner by half a point, which is why
   the ruleset is named on the result card and not assumed.

   Under both, dead stones are removed first so their points fall to whoever surrounds
   them, and regions bordering both colours (dame, and the shared liberties of a seki)
   are neutral. Points inside a seki are left neutral rather than counted, which is the
   answer both counts give for the shapes a beginner will actually meet.

   White receives komi, and under area scoring whatever the ruleset owes for handicap
   stones. */

import { NBRS, idx, inB } from "./board.js";
import { rulesetOf, handicapBonus as bonusFor, DEFAULT_RULES } from "./rulesets.js";

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
export function scoreBoard(board, { dead = [], komi = 0, handicap = 0, rules = DEFAULT_RULES, captures = null } = {}) {
  const set = rulesetOf(rules);
  const live = removeDead(board, dead);
  const territory = territoryMap(live);
  const tally = { b: { stones: 0, territory: 0 }, w: { stones: 0, territory: 0 } };
  for (let i = 0; i < territory.length; i++) {
    const owner = territory[i];
    if (owner === "neutral") continue;
    if (live.cells[i] !== null) tally[owner].stones++;
    else tally[owner].territory++;
  }
  // A dead stone is a prisoner too: it is lifted at the end and handed over.
  const lifted = { b: 0, w: 0 };
  for (const i of dead) {
    const colour = board.cells[i];
    if (colour === "b") lifted.w++;
    else if (colour === "w") lifted.b++;
  }
  const prisoners = {
    b: (captures ? captures.b : 0) + lifted.b,
    w: (captures ? captures.w : 0) + lifted.w,
  };
  const handicapBonus = bonusFor(handicap, rules);
  const territoryCount = set.scoring === "territory";

  const black = { ...tally.b, area: tally.b.stones + tally.b.territory, prisoners: prisoners.b };
  const white = { ...tally.w, area: tally.w.stones + tally.w.territory, komi, handicapBonus, prisoners: prisoners.w };
  const totals = territoryCount
    ? { b: black.territory + prisoners.b, w: white.territory + prisoners.w + komi + handicapBonus }
    : { b: black.area, w: white.area + komi + handicapBonus };
  const diff = totals.b - totals.w;
  const winner = diff > 0 ? "b" : diff < 0 ? "w" : null;
  return {
    scoring: set.scoring, rules: set.id,
    territory, dead: dead.slice(), black, white, totals,
    winner, margin: Math.abs(diff),
  };
}

/** Quick area estimate with no dead-stone removal and no komi: `{ black, white }`. */
export function estimateScore(board) {
  const s = scoreBoard(board);
  return { black: s.totals.b, white: s.totals.w };
}
