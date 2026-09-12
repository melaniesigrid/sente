/* ----------------------- ANALYSIS (pure) -----------------------
   What a graph of a finished game is made of. The network's opinion of a position
   arrives as three logits; everything downstream of that - turning it into one
   number, reading a swing out of a run of numbers, naming the moves that decided
   the game - is arithmetic on a list, and belongs here rather than in a view.

   One convention, held everywhere: a win rate is Black's. The network answers for
   whoever is to move, so `winRateForBlack` flips it for White and nothing after
   that has to remember whose turn it was. A graph that changed which side it meant
   halfway up would be worse than no graph.

   None of this is a score. The number is what a network trained on human games
   guesses about a position, and the caller is expected to say so; see
   `src/engine/kata/analyse.js` for where it comes from. */

/** The value head is three logits: the side to move wins, loses, or the game ends
 *  with no result. Softmax, then the win share, renormalised past no-result so the
 *  graph is a share of the games that finish. */
export function winRate(value) {
  if (!value || value.length !== 3) throw new RangeError(`value must be 3 logits, got ${value && value.length}`);
  const max = Math.max(value[0], value[1], value[2]);
  const e = [Math.exp(value[0] - max), Math.exp(value[1] - max), Math.exp(value[2] - max)];
  const z = e[0] + e[1] + e[2];
  const noResult = e[2] / z;
  const decided = e[0] + e[1];
  return { win: decided > 0 ? e[0] / decided : 0.5, noResult };
}

/** The same number said as Black's, whoever the network was answering for. */
export function winRateForBlack(value, toPlay) {
  const { win, noResult } = winRate(value);
  return { black: toPlay === "b" ? win : 1 - win, noResult };
}

/** Every point on the graph, in move order, is
 *    { move, black, noResult, color, best }
 *  where `move` is the number of played moves standing on the board (0 is the
 *  opening position), `color` is who played that move (null at move 0) and `best`
 *  is the move the network would have played in that position, or null for a pass.
 *
 *  A swing is read between two neighbouring points, and always as the mover's own
 *  fortunes: Black playing the board from 60% to 40% has lost 20 points of it, and
 *  so has White playing it from 40% to 60%. */
export function swings(points) {
  const out = [];
  for (let i = 1; i < points.length; i++) {
    const before = points[i - 1], after = points[i];
    const color = after.color;
    if (color !== "b" && color !== "w") continue;
    // A swing is between one position and the next one. A list with a gap in it would
    // otherwise quietly report two moves' worth of change as one move's mistake.
    if (after.move !== before.move + 1) continue;
    const mine = (p) => (color === "b" ? p.black : 1 - p.black);
    out.push({
      move: after.move,
      color,
      before: before.black,
      after: after.black,
      cost: mine(before) - mine(after),
    });
  }
  return out;
}

/** The moves that decided the game: the mover's worst swings, biggest first.
 *  `limit` keeps the list short enough to read. `min` is a chosen floor, not a measured
 *  one: it is set where a swing stops looking like a mistake and starts looking like a
 *  searchless network changing its mind between two positions. Somebody who measures
 *  that noise properly should move this number and say so here. */
export function turningPoints(points, { limit = 5, min = 0.12 } = {}) {
  return swings(points)
    .filter((s) => s.cost >= min)
    .sort((a, b) => b.cost - a.cost || a.move - b.move)
    .slice(0, limit)
    .sort((a, b) => a.move - b.move);
}

/** The next turning point strictly after `n`, or null. */
export const nextTurn = (turns, n) => turns.find((t) => t.move > n) ?? null;
/** The last turning point strictly before `n`, or null. */
export const prevTurn = (turns, n) => [...turns].reverse().find((t) => t.move < n) ?? null;

/** What each side gave away, per move they played. Not a strength: it is one
 *  network's opinion of one game, and a game full of settled positions gives a
 *  smaller number than a fight does. */
export function steadiness(points) {
  const out = { b: null, w: null };
  const all = swings(points);
  for (const color of ["b", "w"]) {
    const mine = all.filter((s) => s.color === color);
    if (!mine.length) continue;
    const lost = mine.map((s) => Math.max(0, s.cost));
    const worst = mine.reduce((a, s) => (s.cost > a.cost ? s : a));
    out[color] = {
      moves: mine.length,
      mean: lost.reduce((a, b) => a + b, 0) / lost.length,
      worst: worst.cost > 0 ? worst : null,
    };
  }
  return out;
}

/** Percent, rounded, as the graph writes it everywhere. */
export const pct = (p) => `${Math.round(p * 100)}%`;

/** The point at move `n`, or null when that move has not been looked at yet.
 *  Analysis arrives one position at a time, so a caller can always be ahead of it. */
export const pointAt = (points, n) => points.find((p) => p.move === n) ?? null;

/** One line under the graph: who the network thinks is ahead at move `n`, and what
 *  the move that made the position did to its own player's chances. */
export function winRateLine(points, n) {
  const p = pointAt(points, n);
  if (!p) return null;
  const lead = p.black >= 0.5
    ? `Black ${pct(p.black)}`
    : `White ${pct(1 - p.black)}`;
  const head = `The network gives ${lead}`;
  const prev = pointAt(points, n - 1);
  if (!prev || !p.color) return `${head}.`;
  const who = p.color === "b" ? "Black" : "White";
  const cost = (p.color === "b" ? prev.black - p.black : p.black - prev.black);
  if (Math.abs(cost) < 0.02) return `${head}. This move changed little.`;
  const moved = pct(Math.abs(cost));
  return cost > 0
    ? `${head}. This move cost ${who} ${moved}.`
    : `${head}. This move gained ${who} ${moved}.`;
}

/** What the graph says, for a reader who cannot see it. The shape of a game is who
 *  led and whether it ever changed hands, so that is what this says. */
export function graphSummary(points, total) {
  if (!points.length) return "Win rate graph, nothing analysed yet.";
  const sorted = [...points].sort((a, b) => a.move - b.move);
  const last = sorted[sorted.length - 1];
  let leads = 0;
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i - 1].black >= 0.5) !== (sorted[i].black >= 0.5)) leads++;
  }
  const who = last.black >= 0.5 ? "Black" : "White";
  const end = `by move ${last.move} of ${total} the network gives ${who} ${pct(Math.max(last.black, 1 - last.black))}`;
  const changed = leads === 0 ? "the lead never changed hands"
    : leads === 1 ? "the lead changed hands once"
      : `the lead changed hands ${leads} times`;
  return `Estimated win rate for Black: ${changed}, and ${end}.`;
}
