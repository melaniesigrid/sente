/* ----------------------- DAILY DUEL -----------------------
   One game per calendar day, the same for everyone: the date picks the house
   player and seeds its noise, and the engine makes each reply a pure function
   of (seed, position). Two people who play the same moves see the same game,
   so a result is comparable with no server behind it. One attempt a day, never
   rated, and the result is a line of text you can paste anywhere.

   Starting the duel is the attempt: `duelStarted` is written at the first
   stone, so leaving the table cannot buy a second go. `duelDate` and the result
   code arrive when the game ends.

   Pure functions; the date is a "YYYY-MM-DD" key (see kata.js) so the logic is
   testable and free of time zones. The player is always Black. */
import { hashString } from "../engine/index.js";
import { previousDay } from "./kata.js";
import { RANK_LADDER } from "./rank.js";

/** The seed the house player plays with today. */
export function duelSeed(key) {
  return hashString(`duel:${key}`);
}

/** Today's host, picked from the persona list by the date. */
export function duelPersona(personas, key) {
  if (!personas.length) return null;
  return personas[hashString(`duel-host:${key}`) % personas.length];
}

/** The rank today's host plays at: somewhere in the persona's home range, picked by
 *  the date. Fixed for everyone, because the human network's reply depends on it. */
export function duelRank(persona, key) {
  const [weak, strong] = persona.range || [RANK_LADDER[0], RANK_LADDER[0]];
  const lo = Math.max(0, RANK_LADDER.indexOf(weak)), hi = Math.max(lo, RANK_LADDER.indexOf(strong));
  return RANK_LADDER[lo + (hashString(`duel-rank:${key}`) % (hi - lo + 1))];
}

/** Every duel is played on this board, so results compare across the day. */
export const DUEL_SIZE = 9;

/** The game mode the Play view runs today's duel in, or null with no personas. */
export function duelMode(personas, key) {
  const persona = duelPersona(personas, key);
  return persona ? { kind: "duel", persona, seed: duelSeed(key), key, rank: duelRank(persona, key), size: DUEL_SIZE, handicap: 0 } : null;
}

/** "open" (not started today), "playing" (started, no result yet) or "done". */
export function duelState(profile, key) {
  if (profile.duelDate === key) return "done";
  return profile.duelStarted === key ? "playing" : "open";
}

/** Profile patch when today's duel starts. Idempotent within a day. */
export function startDuel(profile, key) {
  if (profile.duelStarted === key) return {};
  return { duelStarted: key };
}

/** Outcome of a finished record from Black's chair.
 *  `code` is go notation: "B+12.5", "W+R", "Jigo". `won` is null for jigo. */
export function duelOutcome(rec) {
  if (rec.phase !== "ended" || !rec.result) return null;
  const { winner, method, margin } = rec.result;
  const moves = rec.moves.filter(m => m.type === "play").length;
  const won = winner === null ? null : winner === "b";
  const code = winner === null ? "Jigo" : `${winner === "b" ? "B" : "W"}+${method === "resign" ? "R" : margin}`;
  return { won, method, margin, moves, code };
}

/** Profile patch after finishing today's duel. Idempotent within a day.
 *  The streak counts consecutive days won; a missed day or a loss ends it, and a
 *  drawn game (jigo) carries it unchanged. */
export function recordDuel(profile, key, outcome) {
  if (profile.duelDate === key) return {};
  const won = outcome.won === true, drawn = outcome.won === null;
  const carried = profile.duelDate === previousDay(key) ? profile.duelStreak : 0;
  const duelStreak = won ? carried + 1 : drawn ? carried : 0;
  return {
    duelStarted: key,
    duelDate: key,
    duelResult: outcome.code,
    duelMoves: outcome.moves || 0,
    duelPlayed: (profile.duelPlayed || 0) + 1,
    duelWins: (profile.duelWins || 0) + (won ? 1 : 0),
    duelStreak,
    duelBestStreak: Math.max(profile.duelBestStreak || 0, duelStreak),
  };
}

/** The page to paste with a result: origin and path only, nothing personal. */
export function duelShareUrl(loc) {
  return loc && loc.origin ? `${loc.origin}${loc.pathname || "/"}` : "";
}

/** Plain-text result for the clipboard. `url` is optional. */
export function duelShareText({ key, personaName, code, moves, url }) {
  const lines = [
    `Joseki Daily Duel · ${key}`,
    `vs ${personaName} (house bot) · ${code}${moves ? ` in ${moves} moves` : ""}`,
  ];
  if (url) lines.push(url);
  return lines.join("\n");
}

/** One line for a card: "Won by 12.5", "Lost by resignation", "Jigo". */
export function duelResultText(code) {
  if (!code) return "";
  if (code === "Jigo") return "Jigo";
  const [side, by] = code.split("+");
  const verb = side === "B" ? "Won" : "Lost";
  return by === "R" ? `${verb} by resignation` : `${verb} by ${by}`;
}
