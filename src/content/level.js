/* ----------------------- THE LEVEL TO PLAY AT -----------------------
   House players adapt to whatever rank they are asked to play, so nobody has
   to graduate to an opponent. What nobody should have to do either is notice,
   on their own, that the level they picked a fortnight ago has stopped being a
   game. This reads the device's own ring buffer (store/telemetry.js) and says
   so, once there is enough evidence to be worth saying.

   What counts as evidence is the whole design.

   Only rated games, and only at the level in question. A coached game had
   help, a duel is a fixed opponent, a master study is not a match, and a game
   at 12k says nothing about whether 8k is too hard.

   Only even games. A handicap changes the strength of the opponent, which is
   the thing being measured; three wins with four stones is not three wins.

   Only a run, and only the most recent one. Three in a row is the threshold:
   two is a coin, and by four the player has worked it out themselves and is
   wondering why nothing said anything. A run that was broken by the last game
   is not a run, so one loss clears a winning streak outright.

   Pure. The log is passed in, the ladder is passed in, and nothing here reads
   storage or a clock. */
import { stepRank, RANK_LADDER } from "./rank.js";

/** Games in a row before the level is worth mentioning. */
export const RUN = 3;

/** The most recent rated, even games at `rank`, newest first. */
export function gamesAt(log, rank) {
  return (log || [])
    .filter(g => g.kind === "rated" && g.botRank === rank && g.handicap === 0 && g.won !== null)
    .slice()
    .reverse();
}

/** The run of same-outcome games at the top of that list: `{ won, length }`,
 *  or null when there are no games at this level at all. A jigo is already
 *  filtered out, so a run is only ever wins or only ever losses. */
export function currentRun(log, rank) {
  const games = gamesAt(log, rank);
  if (!games.length) return null;
  const won = games[0].won;
  let length = 0;
  while (length < games.length && games[length].won === won) length += 1;
  return { won, length };
}

/** A level to suggest instead of `rank`, or null for "the level is fine".
 *
 *  Wins move the suggestion stronger and losses move it weaker, which is the
 *  right way round: the level is the difficulty, not the reward. At either end
 *  of the ladder there is nothing to suggest, and the caller is told nothing
 *  rather than being offered the rank it is already on. */
export function suggestLevel(log, rank) {
  if (!RANK_LADDER.includes(rank)) return null;
  const run = currentRun(log, rank);
  if (!run || run.length < RUN) return null;
  const to = stepRank(rank, run.won ? 1 : -1);
  if (to === rank) return null;              // already at the end of the ladder
  return { from: rank, to, won: run.won, length: run.length };
}

/** The suggestion in words. Says what was counted, not just what to do: a
 *  number a player can check is a suggestion they can disagree with. */
export function suggestionText(s) {
  if (!s) return "";
  const n = s.length;
  return s.won
    ? `${n} even wins in a row at ${s.from}. ${s.to} would be a harder game.`
    : `${n} even losses in a row at ${s.from}. ${s.to} would be a fairer game.`;
}
