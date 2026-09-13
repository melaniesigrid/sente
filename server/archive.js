/* ----------------------- THE ARCHIVE (pure) -----------------------
   Every finished game a player has played, kept, and read back one page at a
   time. Key arithmetic and nothing else, so the ordering can be reasoned about
   without a Durable Object in the room.

   WHY KEYS AND NOT A LIST
   Until now a player's games were one stored array capped at 24
   (`games:<id>`), which is right for the lobby's "your tables" and wrong for
   an archive: an array has to be read whole to be read at all, so an unbounded
   one costs more every game you play, forever, on a Worker with ten
   milliseconds to spend. One key per game costs the same whether you have
   played ten games or ten thousand, and storage will hand back a page of them
   in order without reading the rest.

   THE ORDER IS IN THE KEY
   Storage lists keys in lexicographic order, so the key carries a fixed-width
   timestamp and the ordering falls out of the strings themselves. Fixed width
   matters: "9" sorts after "10" and a game from 2001 would outrank one from
   next week. Newest-first is `reverse`, which storage does itself.

   The summary stored under the key is the lobby's summary and not the record.
   The record stays in its Room, which never deletes one, and is fetched by id
   when somebody actually opens a game. An archive that copied every record
   would be a second copy of every game to keep in step with the first. */

/** Where a player's finished games live. One prefix per player, so a page of
 *  somebody's archive never touches anybody else's keys. */
export const archivePrefix = (playerId) => `arch:${playerId}:`;

/** Wide enough for any millisecond timestamp this side of the year 33658, and
 *  the same width for all of them, which is the whole point. */
const STAMP_WIDTH = 14;

/* `Math.max(0, NaN)` is NaN, so the guard is `isFinite` and not a falsy check:
   a stamp of "NaN" pads to the right width, sorts nowhere in particular, and
   would quietly file a game somewhere no page of the archive reaches. */
export function stampOf(ms) {
  const n = Math.floor(Number(ms));
  return String(Number.isFinite(n) && n > 0 ? n : 0).padStart(STAMP_WIDTH, "0");
}

/** The key one finished game is filed under for one player. The game id is on
 *  the end so two games that ended in the same millisecond still get a key
 *  each, and so the key can be read back apart without consulting the value. */
export const archiveKey = (playerId, endedAt, gameId) =>
  `${archivePrefix(playerId)}${stampOf(endedAt)}:${gameId}`;

/** The game id out of one of those keys, or null for a key that is not one.
 *  The id may itself contain colons in some future scheme, so this takes
 *  everything after the stamp rather than the last segment. */
export function gameIdOf(key) {
  if (typeof key !== "string") return null;
  const m = /^arch:[^:]+:\d+:(.+)$/.exec(key);
  return m ? m[1] : null;
}

/** How many games one page holds. Enough that a club player sees a season at
 *  once, small enough that the whole page fits in one invocation's budget. */
export const PAGE_SIZE = 30;

/** The page size a caller asked for, clamped. Nonsense becomes the default
 *  rather than an error: the honest answer to "give me -4 games" is a page. */
export function pageSize(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return PAGE_SIZE;
  return Math.min(Math.floor(n), PAGE_SIZE);
}

/** A cursor is the key of the last game on the page just read, so the next
 *  page starts after it. It is opaque to the caller and checked on the way
 *  back in: a cursor for somebody else's prefix must not page their archive. */
export function cursorFor(playerId, raw) {
  if (typeof raw !== "string" || raw === "") return null;
  return raw.startsWith(archivePrefix(playerId)) ? raw : null;
}

/** What one page looks like from outside: the games, and the cursor to ask for
 *  the next page with, or null when that was the last of them.
 *
 *  A short page means the end. A full page hands back a cursor even when it
 *  happens to be the last one, because knowing that would cost a second read
 *  and the caller finds out by asking once more and getting nothing. */
export function page(entries, limit) {
  const games = entries.map((e) => e.value);
  const more = entries.length === limit;
  return { games, cursor: more ? entries[entries.length - 1].key : null };
}

/** What is worth keeping about a finished game. The lobby's summary carries
 *  live fields that mean nothing once a game is over (`toPlay`, `updatedAt`),
 *  and an archive row is read far more often than it is written, so it holds
 *  what a list of past games actually shows and nothing else. */
export function archived(summary) {
  return {
    id: summary.id,
    size: summary.size,
    rated: summary.rated,
    pair: Boolean(summary.pair),
    black: summary.black,
    white: summary.white,
    teams: summary.teams,
    moves: summary.moves,
    result: summary.result,
    createdAt: summary.createdAt,
    endedAt: summary.endedAt,
  };
}

/** Both players of a game, each of them once. A pair game has four people and
 *  a game against yourself on two devices has one, and both file correctly. */
export function playersOf(summary) {
  const ids = new Set();
  for (const side of ["b", "w"]) {
    for (const p of (summary.teams && summary.teams[side]) || []) if (p && p.id) ids.add(p.id);
  }
  for (const seat of [summary.black, summary.white]) if (seat && seat.id) ids.add(seat.id);
  return [...ids];
}
