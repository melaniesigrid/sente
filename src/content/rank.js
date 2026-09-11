/* ----------------------- RANK & RATING -----------------------
   The rating scale is OGS's, number for number:

       rank  = ln(rating / 525) * 23.15
       rating = 525 * e^(rank / 23.15)

   where rank 30 is 1 dan and every rank below it is one kyu weaker. A rating
   from Joseki therefore means the same thing as a rating from OGS, so 12 kyu
   here is 12 kyu there, and the ladder does not have to be re-learned when a
   player goes looking for a human opponent.

   A rank is shown to one decimal — 12.0k is a strong twelve kyu, 12.9k a weak
   one — because a whole rank takes a long time to cross and a number that never
   moves reads as a number that is not listening. The whole-rank label is the
   floor of that decimal, so the two can never disagree. Progress up the scale
   is measured by Glicko-2 in `src/engine/glicko.js`. */
import { isProvisional } from "../engine/glicko.js";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** OGS's two constants. Do not tune these: they are what makes the scale shared. */
export const RATING_A = 525;
export const RATING_C = 23.15;

/** The ladder in rank numbers: 30 is 1 dan. The two ends sit a tenth inside the
 *  outermost rank, so a player pinned at the bottom reads 25.9k with the whole
 *  rank still to climb, and one pinned at the top reads 9.9d. */
export const MIN_RANK_VALUE = 4.1;
export const MAX_RANK_VALUE = 38.9;

/** The continuous rank number behind a rating, clamped to the ladder. */
export const rankValue = (rating) =>
  clamp(Math.log(Math.max(rating, 1) / RATING_A) * RATING_C, MIN_RANK_VALUE, MAX_RANK_VALUE);

/** The rating at a rank number. Inverse of `rankValue` inside the ladder. */
export const ratingOfValue = (value) => RATING_A * Math.exp(value / RATING_C);

export const MIN_RATING = ratingOfValue(MIN_RANK_VALUE);   // 25.0k, the floor
export const MAX_RATING = ratingOfValue(MAX_RANK_VALUE);   // 9.9d, the ceiling
export const DAN_RATING = ratingOfValue(30);               // where kyu ends and dan begins

/** A rating as a grade: `{ n, unit }`, n counted the way that grade is spoken —
 *  kyu downward (25 weakest, 1 strongest), dan upward.
 *
 *  n is snapped to nine decimals first. Both labels below truncate rather than
 *  round, so an exact boundary that arrives as 3.9999999999 from the logarithm
 *  would otherwise be shown a whole rank weaker than it is. */
export function gradeOf(rating) {
  const v = rankValue(rating);
  const snap = (n) => Math.round(n * 1e9) / 1e9;
  if (v >= 30) return { n: snap(v - 29), unit: "d" };
  return { n: snap(Math.max(1, 30 - v)), unit: "k" };
}

/** A rank to one decimal: "12.4k", "2.1d". Truncated, never rounded, so the
 *  decimal always sits inside the whole rank `rankOf` reports. */
export function preciseRankOf(rating) {
  const { n, unit } = gradeOf(rating);
  return `${(Math.floor(n * 10) / 10).toFixed(1)}${unit}`;
}

/** The whole rank: "12k", "3d". */
export function rankOf(rating) {
  const { n, unit } = gradeOf(rating);
  return `${Math.floor(n)}${unit}`;
}

/** Inverse of `rankOf`: the rating at the centre of a rank label ("12k", "3d"). */
export function ratingOfRank(label) {
  const m = /^(\d+)([kd])$/.exec(label);
  if (!m) throw new RangeError(`bad rank ${label}`);
  const n = parseInt(m[1], 10);
  const v = m[2] === "k" ? 30 - n - 0.5 : 29 + n + 0.5;
  return clamp(ratingOfValue(v), MIN_RATING, MAX_RATING);
}

/** Every rank a game can be played at, weakest first: 25k .. 1k, 1d .. 9d. */
export const RANK_LADDER = [
  ...Array.from({ length: 25 }, (_, i) => `${25 - i}k`),
  ...Array.from({ length: 9 }, (_, i) => `${i + 1}d`),
];

/** The rank `delta` steps stronger (positive) or weaker (negative), clamped to the ladder. */
export function stepRank(label, delta) {
  const i = RANK_LADDER.indexOf(label);
  if (i < 0) throw new RangeError(`bad rank ${label}`);
  return RANK_LADDER[clamp(i + delta, 0, RANK_LADDER.length - 1)];
}

/** The rank a game is rated against once White gives `stones` handicap stones: one rank
 *  per stone, the usual convention, clamped to the ladder. Zero stones leaves it alone. */
export function rankWithHandicap(label, stones) {
  return stones >= 2 ? stepRank(label, -stones) : label;
}

/** Is `label` inside the inclusive range `[weak, strong]`? */
export function rankInRange(label, [weak, strong]) {
  const i = RANK_LADDER.indexOf(label);
  return i >= RANK_LADDER.indexOf(weak) && i <= RANK_LADDER.indexOf(strong);
}

/** How far a rating moved, in ranks: positive is stronger. Small by design —
 *  a settled player crosses a tenth of a rank in a game. */
export const rankGain = (before, after) => rankValue(after) - rankValue(before);

export const TINTS = {
  eucalyptus: "#5f8c7e", coral: "#d98873", sun: "#d9b36a",
  mint: "#8fb7a3", sky: "#7d9db8", grape: "#9c86ad",
};

/* ----------------------- BELTS (the dojo) -----------------------
   Go's kyu/dan grades are the same ladder karate uses, so we wear them the same
   way: five coloured belts across the kyu ranks, black at dan. A belt is derived
   from the rank, never stored, so it can never disagree with the rating.
   Colours are the existing palette; nothing new is introduced. */
export const BELTS = [
  { id: "white",  label: "White belt",  color: "#f2ede3", kyuMax: 25, kyuMin: 21 },
  { id: "yellow", label: "Yellow belt", color: TINTS.sun, kyuMax: 20, kyuMin: 16 },
  { id: "orange", label: "Orange belt", color: TINTS.coral, kyuMax: 15, kyuMin: 11 },
  { id: "green",  label: "Green belt",  color: TINTS.eucalyptus, kyuMax: 10, kyuMin: 6 },
  { id: "blue",   label: "Blue belt",   color: TINTS.sky, kyuMax: 5, kyuMin: 1 },
  { id: "black",  label: "Black belt",  color: "#4b463c", kyuMax: 0, kyuMin: 0 },
];

/** The rating where `k` kyu begins: at this rating you are one rank weaker, and
 *  one point above it `rankOf` reads `k`. The bottom of the band, exclusive. */
export const kyuFloor = (k) => ratingOfValue(29 - k);

/** The rating where a belt's weakest rank begins — the bottom of its bar. */
export const beltFloor = (belt) => (belt.id === "black" ? DAN_RATING : kyuFloor(belt.kyuMax));

export function beltOf(rating) {
  const label = rankOf(rating);
  if (label.endsWith("d")) return BELTS[BELTS.length - 1];
  const k = parseInt(label, 10);
  return BELTS.find(b => k <= b.kyuMax && k >= b.kyuMin) || BELTS[0];
}

/** The belt after the current one and the rating that earns it, or null at black. */
export function nextBelt(rating) {
  const cur = beltOf(rating);
  const i = BELTS.indexOf(cur);
  if (i >= BELTS.length - 1) return null;
  const nxt = BELTS[i + 1];
  return { belt: nxt, at: beltFloor(nxt) };
}

/** Atari hints are training wheels: white and yellow belts get them, orange and up read for themselves. */
export const hintsForBelt = (belt) => belt.id === "white" || belt.id === "yellow";

/** Whether a player gets the training wheels, belt and certainty together. A new
 *  account is seated at 10k — a green belt nobody has earned yet — so the wheels
 *  stay on while the rank is still a guess, and come off when the rating has
 *  settled somewhere orange or stronger. A weak belt keeps them either way. */
export const hintsFor = (rating, rd) => isProvisional(rd) || hintsForBelt(beltOf(rating));
