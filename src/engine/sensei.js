/* ----------------------- THE TRAINER'S RULES (pure) -----------------------
   A trainer is a house player with two habits the others do not have: it gives
   you something on purpose now and then, and it grades the game afterwards. Both
   are rules about a game, so both are here and not in a view or a content file.

   The gift. Every so often the trainer plays a move the network thought clearly
   worse than its first choice, and says nothing about which one. Whether you
   punished it is read off the evaluation afterwards, and the review names every
   one. The gift is never the top move played badly by accident: it is drawn from
   the network's own shortlist, so it is a move a player of that rank might really
   play, only a worse one than the trainer would have chosen.

   The grade. The evaluation points are the same shape `analyseGame` produces, one
   per position, so the review is arithmetic on the same list the graph is drawn
   from, and the two can never disagree. */

import { swings, turningPoints, steadiness } from "./analysis.js";
import { phaseOf } from "./explain.js";

/** The trainer's habits, named so they can be argued about. */
export const TRAINER = {
  /** Its own moves before the first gift can come. */
  firstGiftAfter: 6,
  /** Its own moves between two gifts, at the least. */
  minGap: 5,
  /** Chance of a gift on any eligible move of its own. */
  chance: 0.22,
  /** A gift is at most this share as likely as the top move, so it is clearly worse... */
  worseBy: 0.4,
  /** ...and at least this share, so it is still a move somebody would play. */
  noWorseThan: 0.04,
  /** A gift counts as taken when your reply kept at least this much of what it gave. */
  keptShare: 0.5,
};

/** Whether the trainer should give something on this move of its own.
 *  @param {object} o
 *  @param {number} o.ownMoves     how many moves the trainer has played so far
 *  @param {number} o.moveNumber   the number this move will have
 *  @param {number} o.size         board size
 *  @param {number|null} o.lastGift  own-move count at the last gift, or null
 *  @param {() => number} o.rng */
export function giftDue({ ownMoves, moveNumber, size, lastGift = null, rng = Math.random }) {
  if (ownMoves < TRAINER.firstGiftAfter) return false;
  if (lastGift !== null && ownMoves - lastGift < TRAINER.minGap) return false;
  // Nothing in the endgame: a bad endgame move is a point or two and teaches little.
  if (phaseOf(moveNumber, size) === "endgame") return false;
  return rng() < TRAINER.chance;
}

/** A worse move off the network's shortlist, or null when the list has nothing
 *  clearly worse yet still playable. `top` is best first, as `choosePolicyMove`
 *  reports it; a pass is never a gift. */
export function pickGift(top, rng = Math.random) {
  if (!top || top.length < 2) return null;
  const best = top[0];
  if (!best.move) return null;
  const cands = top.slice(1).filter((t) =>
    t.move && t.prob <= best.prob * TRAINER.worseBy && t.prob >= best.prob * TRAINER.noWorseThan);
  if (!cands.length) return null;
  const pick = cands[Math.min(cands.length - 1, Math.floor(rng() * cands.length))];
  return { move: pick.move, prob: pick.prob, best: best.move, bestProb: best.prob };
}

const at = (points, n) => points.find((p) => p.move === n) ?? null;

/** What a gift at move `m` by `color` was worth, and whether the reply took it.
 *  Read from the evaluation: the swing the gift cost its giver, and how much of
 *  that the reply held on to. Null when the positions around it were not looked at. */
export function giftOutcome(points, m, color) {
  const before = at(points, m - 1), after = at(points, m), reply = at(points, m + 1);
  if (!before || !after) return null;
  const mine = (p) => (color === "b" ? p.black : 1 - p.black);
  const gift = mine(before) - mine(after);
  if (!reply) return { gift, kept: null };
  const held = mine(before) - mine(reply);
  return { gift, kept: gift > 0 ? held >= gift * TRAINER.keptShare : null };
}

/** The trainer's report on a finished game, for `you` (the colour being trained).
 *  @param {object[]} points   evaluation points, as `analyseGame` produces them
 *  @param {object[]} gifts    [{ move, best }] the trainer gave on purpose
 *  @param {"b"|"w"} you
 *  @returns {{ turns, gifts, steady, worst, gained, looked }} */
export function trainerReport(points, gifts, you = "b") {
  const looked = points.length;
  const yourTurns = turningPoints(points, { limit: 3 }).filter((s) => s.color === you);
  const mine = swings(points).filter((s) => s.color === you);
  const gained = mine.filter((s) => s.cost <= -0.08).sort((a, b) => a.cost - b.cost).slice(0, 2);
  const steady = steadiness(points)[you];
  const trainer = you === "b" ? "w" : "b";
  const graded = gifts.map((g) => ({ ...g, ...(giftOutcome(points, g.move, trainer) ?? { gift: null, kept: null }) }));
  return {
    looked,
    turns: yourTurns,
    gained,
    steady,
    worst: steady ? steady.worst : null,
    gifts: graded,
  };
}
