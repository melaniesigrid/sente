/* ----------------------- THE RING BUFFER -----------------------
   The last fifty games, kept so the house players can be tuned against what
   really happens at the board rather than against what their bios claim. A
   persona that is losing nine games in ten to the rank it is supposed to be
   playing is badged wrong, and there is no way to know that without counting.

   Three rules hold this honest, and they are the whole design.

   It never leaves the device. There is no endpoint, no beacon, no fetch in
   this module and none anywhere that reads it. It is in its own storage key
   rather than on the profile precisely so that it cannot be swept along when
   a profile learns how to sync.

   It keeps no moves and no names. A game is recorded as its shape: board
   size, handicap, ruleset, which house player, what rank that player was
   asked to play, how it ended, how long it took. A record you could replay
   is a record of what somebody played, and that is not what this is for.

   It forgets. Fifty entries, oldest out first, and the player can empty it
   from their profile at any time.

   Pure except for the three functions at the bottom that touch storage. */

export const STORE_KEY = "sente-telemetry-v1";

/** How many games are kept. Fifty is enough to see a persona's win rate move
 *  and short enough that a season of play does not accumulate a history. */
export const CAP = 50;

/** How a game was played, which decides whether its result means anything about
 *  a rank: only a `rated` game does. */
/* The kinds of game the ring buffer keeps apart. Only "rated" is evidence about
   a rank: a duel is seeded, a master has no rank, a coached game had help, and a
   pair game had a 7 dan playing half of it. `suggestLevel` reads "rated" alone,
   so a new kind can never quietly start moving the level suggestion. */
export const KINDS = ["rated", "coached", "duel", "master", "pair"];

const isCount = (n) => Number.isInteger(n) && n >= 0;
const isDayKey = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** One game, with every field checked, or null if it is not one. `won` is
 *  null for a game that was not the player's to win (a jigo, or a master
 *  study), and `bot` is null where no house player sat down. */
export function sanitizeGame(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { at, size, handicap, bot, botRank, kind, result, won, moves } = value;
  if (!isDayKey(at)) return null;
  if (!isCount(size) || size < 2) return null;
  if (!isCount(handicap) || !isCount(moves)) return null;
  if (!KINDS.includes(kind)) return null;
  if (typeof result !== "string" || !result) return null;
  if (bot !== null && typeof bot !== "string") return null;
  if (botRank !== null && typeof botRank !== "string") return null;
  if (won !== null && typeof won !== "boolean") return null;
  return { at, size, handicap, bot, botRank, kind, result, won, moves };
}

/** A stored log, keeping only well-formed games and only the last `cap`. */
export function sanitizeLog(value, cap = CAP) {
  if (!Array.isArray(value)) return [];
  return value.map(sanitizeGame).filter(Boolean).slice(-cap);
}

/** The log with one more game on the end, oldest dropped once it is full.
 *  Returns the log unchanged when the game is not one. */
export function pushGame(log, game, cap = CAP) {
  const clean = sanitizeGame(game);
  if (!clean) return log;
  return [...log, clean].slice(-cap);
}

/** What the log says about one house player: how often the human beat it, over
 *  rated games only. A coached game had help and a master study is not a match,
 *  so neither is evidence about a rank. */
export function recordAgainst(log, botId) {
  const games = log.filter(g => g.kind === "rated" && g.bot === botId && g.won !== null);
  const wins = games.filter(g => g.won).length;
  return { games: games.length, wins, losses: games.length - wins };
}

/** Every house player the log has seen, strongest evidence first: the ones
 *  played most, since a rate over two games is not a rate. */
export function byBot(log) {
  const ids = [...new Set(log.filter(g => g.bot).map(g => g.bot))];
  return ids
    .map(id => ({ bot: id, ...recordAgainst(log, id) }))
    .filter(r => r.games > 0)
    .sort((a, b) => b.games - a.games || (a.bot < b.bot ? -1 : 1));
}

/** The shape of the log as a whole: what is in it, and over what span. */
export function summarize(log) {
  const rated = log.filter(g => g.kind === "rated");
  const decided = rated.filter(g => g.won !== null);
  const sizes = {};
  for (const g of log) sizes[g.size] = (sizes[g.size] || 0) + 1;
  const days = log.map(g => g.at).sort();
  return {
    games: log.length,
    rated: rated.length,
    wins: decided.filter(g => g.won).length,
    losses: decided.filter(g => !g.won).length,
    // The commonest board, and how many of the log it accounts for.
    sizes,
    moves: log.reduce((n, g) => n + g.moves, 0),
    from: days[0] || null,
    to: days[days.length - 1] || null,
    full: log.length >= CAP,
  };
}

/* ----------------------- STORAGE -----------------------
   The only three functions here that are not pure. Every one of them survives
   a browser that refuses local storage entirely: a private window still plays
   go, it just does not remember. */

export function loadTelemetry() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? sanitizeLog(JSON.parse(raw)) : [];
  } catch {
    // Unreadable or unparseable: an empty log is the right answer, and losing
    // a tuning aid is not worth a message in front of somebody playing a game.
    return [];
  }
}

/** Append one game and save. Returns the new log, saved or not. */
export function recordGame(game) {
  const next = pushGame(loadTelemetry(), game);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or refused. The log is a convenience; the game is not.
  }
  return next;
}

export function clearTelemetry() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // Nothing to do: if it cannot be removed it could not have been written.
  }
  return [];
}
