/* ----------------------- RANK & RATING ----------------------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function rankOf(rating) {
  if (rating < 3000) return `${clamp(Math.round((3000 - rating) / 100), 1, 25)}k`;
  return `${clamp(Math.floor((rating - 3000) / 100) + 1, 1, 9)}d`;
}

/** Inverse of `rankOf`: the rating at the centre of a rank label ("12k", "3d"). */
export function ratingOfRank(label) {
  const m = /^(\d+)([kd])$/.exec(label);
  if (!m) throw new RangeError(`bad rank ${label}`);
  const n = parseInt(m[1], 10);
  return m[2] === "k" ? 3000 - 100 * n : 3000 + 100 * (n - 1);
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

/** Is `label` inside the inclusive range `[weak, strong]`? */
export function rankInRange(label, [weak, strong]) {
  const i = RANK_LADDER.indexOf(label);
  return i >= RANK_LADDER.indexOf(weak) && i <= RANK_LADDER.indexOf(strong);
}

export function eloDelta(userR, oppR, result) {
  const expected = 1 / (1 + Math.pow(10, (oppR - userR) / 400));
  return Math.round(32 * (result - expected));
}

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

/** Lowest rating that `rankOf` still reads as `k` kyu (round-half-up boundary). */
export const kyuFloor = (k) => 2951 - 100 * k;

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
  return { belt: nxt, at: nxt.id === "black" ? 3000 : kyuFloor(nxt.kyuMax) };
}

/** Atari hints are training wheels: white and yellow belts get them, orange and up read for themselves. */
export const hintsForBelt = (belt) => belt.id === "white" || belt.id === "yellow";
