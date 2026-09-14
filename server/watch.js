/* ----------------------- WATCHING (pure) -----------------------
   Which games being played right now a person may be shown, so they can sit
   down beside one.

   THE ROOM WAS ALWAYS OPEN; THE DOOR WAS NOT ON ANY MAP
   `GET /api/game/:id/ws` has accepted a spectator socket since the first
   day of the server, and the table has a "share" chip that copies its link.
   What did not exist was a way to find a game you were not sent to. This
   module is that map: an index of live games in the Registry, and the rule
   for which of them a given viewer is told about.

   PRESENCE DECIDES, NOT THE GAME
   A list of games in progress is a list of who is at their desk right now,
   which is the one thing the privacy notice says Joseki never publishes
   without being told to. So the list is filtered by the same rule presence
   is (`presence.js`): a game is on it for a viewer only when every player at
   the board lets that viewer see they are here. One player who chose
   "nobody" keeps the whole table off the list, because you cannot show a
   game without showing both names. Somebody holding the link can still open
   the room, as they always could; this is about who is handed the link.

   THE LIST NEVER SAYS A GAME IS HIDDEN
   A game that is not on the list is absent, and the absence does not say
   why: it may be over, it may be stale, or one of the players may have
   chosen to be invisible. That is the same silence `whoIsHere` keeps, for
   the same reason.

   STALE IS NOT LIVE
   A game nobody has moved in for an hour is not one anybody is watching, and
   a list of them would be a list of abandoned boards. The index keeps a game
   until it ends; the answer leaves out the ones that have gone quiet. */

import { canSeeOnline } from "./presence.js";

/** The prefix under which the Registry keeps one row per game in progress. */
export const LIVE_PREFIX = "live:";
export const liveKey = (id) => LIVE_PREFIX + id;

/** How long a board may sit without a move and still be offered as live. */
export const STALE_MS = 60 * 60 * 1000;

/** How many games one answer carries. The lobby is a screen, not a search. */
export const MAX_WATCH = 20;

/** Is this summary a game still being played? Scoring counts: the players are
 *  still at the board, and the count is the part a watcher learns most from. */
export const isLive = (summary) =>
  !!summary && !summary.endedAt && summary.phase !== "ended";

/** Everybody seated at the table who has a player record: two ids at an
 *  ordinary table, up to four at a pair one. A partner with no id is a house
 *  player run in a browser, and it has no setting to consult. */
export function seatedIds(summary) {
  const ids = new Set();
  if (summary.teams) {
    for (const side of Object.values(summary.teams)) {
      for (const p of side || []) if (p && p.id) ids.add(p.id);
    }
  }
  for (const p of [summary.black, summary.white]) if (p && p.id) ids.add(p.id);
  return [...ids];
}

/** The ids the caller must fetch records for before asking `watchable`. */
export function peopleToAsk(summaries) {
  const ids = new Set();
  for (const s of summaries) for (const id of seatedIds(s)) ids.add(id);
  return [...ids];
}

/** Of these live games, the ones this viewer may be shown, freshest first.
 *
 *  `people` maps player id to record (for `showOnline`); `friends` is the
 *  viewer's settled friends as a Set of ids. A viewer's own games are left
 *  out: those are already the lobby's "your tables", and a person is not a
 *  spectator at their own board. A game seating somebody whose record is
 *  missing is left out too, since a missing record cannot have said yes. */
export function watchable(summaries, viewerId, people, friends, now = Date.now()) {
  const friendSet = friends instanceof Set ? friends : new Set(friends || []);
  return summaries
    .filter(isLive)
    .filter((s) => now - (s.updatedAt || s.createdAt || 0) <= STALE_MS)
    .filter((s) => {
      const ids = seatedIds(s);
      if (viewerId && ids.includes(viewerId)) return false;
      return ids.length > 0 && ids.every((id) => {
        const p = people instanceof Map ? people.get(id) : people && people[id];
        return canSeeOnline(p, viewerId, friendSet.has(id));
      });
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, MAX_WATCH)
    .map(watchRow);
}

/** What the lobby needs to draw one row and open the room: names, the board,
 *  how far along it is. Nothing about the players beyond what the room itself
 *  shows the moment it opens. */
export function watchRow(s) {
  const person = (p) => (p ? { id: p.id, name: p.name, tint: p.tint } : null);
  return {
    id: s.id, size: s.size, rated: !!s.rated, pair: !!s.pair,
    black: person(s.black), white: person(s.white),
    phase: s.phase, moves: s.moves || 0, toPlay: s.toPlay,
    updatedAt: s.updatedAt || s.createdAt || 0,
  };
}
