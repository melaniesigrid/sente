/* ----------------------- RATING (server side) -----------------------
   Server-authoritative rating. Every player carries `{ rating, rd, vol }`: the
   rating itself, a rating deviation (how unsure we are of it) and a volatility
   (how erratic their results have been). One rated game is one rating period,
   which is the usual simplification for a server that rates game by game.

   The arithmetic is not here. It is `src/engine/glicko.js`, the same module the
   browser runs against house players, because a rating that means one thing
   offline and another online is not a rating. This file is the server's use of
   it: what a new player starts at, how one finished game is settled, and how a
   player stored under the old scale is carried across.

   The scale is OGS's, from `src/content/rank.js`: rank = ln(rating / 525) *
   23.15, and rank 30 is 1 dan. A rating here means what a rating there means.

   Reference: Glickman, "Example of the Glicko-2 system" (2013). The engine's
   test suite reproduces the worked example from that paper. */

import { GLICKO, updateGlicko, isProvisional } from "../src/engine/glicko.js";
import { ratingOfRank, rankOf, preciseRankOf, MIN_RATING, MAX_RATING } from "../src/content/rank.js";

/** Where an unrated player starts: 10 kyu, the same seat the browser gives a
 *  newcomer and the one OGS gives a new account. The wide deviation below is
 *  what carries a newcomer to their real strength quickly, up or down, in an
 *  evening rather than a month. */
export const DEFAULT_RATING = Math.round(ratingOfRank("10k"));
export const DEFAULT_RD = GLICKO.rd;
export const DEFAULT_VOL = GLICKO.vol;
export const TAU = GLICKO.tau;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** A fresh, unrated player. */
export const newRating = () => ({ rating: DEFAULT_RATING, rd: DEFAULT_RD, vol: DEFAULT_VOL });

/** A rating is provisional while its deviation is still wide. */
export const provisional = (p) => isProvisional(p.rd);

/** Rate `player` over `games`: each `{ opponent: { rating, rd }, score }` with score
 *  1 for a win, 0 for a loss, 0.5 for a draw. Returns a new `{ rating, rd, vol }`;
 *  never mutates. With no games the deviation simply grows. */
export function rate(player, games, tau = TAU) {
  const out = updateGlicko(
    player,
    games.map((gm) => ({ rating: gm.opponent.rating, rd: gm.opponent.rd, score: gm.score })),
    tau,
  );
  return { ...out, rating: clamp(out.rating, MIN_RATING, MAX_RATING) };
}

/** Rate both sides of one finished game. `winner` is "b", "w" or null (jigo).
 *  Returns `{ b, w }` with each side's new rating, the signed change, and the
 *  rank it now reads as - the tenth is the part a player actually notices. */
export function rateGame(black, white, winner) {
  // Both sides at once. The engine's `rateAgainst` is the one-sided version.
  const sb = winner === "b" ? 1 : winner === "w" ? 0 : 0.5;
  const nb = rate(black, [{ opponent: white, score: sb }]);
  const nw = rate(white, [{ opponent: black, score: 1 - sb }]);
  const round = (p) => ({ rating: Math.round(p.rating), rd: Math.round(p.rd), vol: p.vol });
  const b = round(nb), w = round(nw);
  return {
    b: { ...b, delta: b.rating - Math.round(black.rating), rank: preciseRankOf(b.rating) },
    w: { ...w, delta: w.rating - Math.round(white.rating), rank: preciseRankOf(w.rating) },
  };
}

/* ----- carrying the old scale across -----
   Ratings were stored on the old scale: a hundred points to a rank, 1500 for a
   newcomer, 3000 for shodan. What a player earned there is a rank, not a number
   of points, so the rank is what crosses. */

const legacyRankOf = (r) => (r < 3000
  ? `${clamp(Math.round((3000 - r) / 100), 1, 25)}k`
  : `${clamp(Math.floor((r - 3000) / 100) + 1, 1, 9)}d`);

/** A stored player's `{ rating, rd, vol }` on the new scale. Deviation and
 *  volatility cross untouched: they are measures of confidence, not of points,
 *  and a player's results were exactly as certain before the change as after. */
export function migrateRating(p) {
  const old = typeof p.rating === "number" && Number.isFinite(p.rating) ? p.rating : 1500;
  return {
    rating: Math.round(ratingOfRank(legacyRankOf(old))),
    rd: Math.round(clamp(Number(p.rd) || DEFAULT_RD, GLICKO.minRd, GLICKO.maxRd)),
    vol: Number.isFinite(p.vol) ? p.vol : DEFAULT_VOL,
  };
}

/** Re-exported so the registry can name a rank without knowing the scale. */
export { rankOf, preciseRankOf };
