/* ----------------------- PLAYERS (pure) -----------------------
   The bits of the Registry that are arithmetic and string handling rather
   than storage, kept here so they can be tested without a Durable Object. */

/** A rendezvous word: 1 to 32 plain characters, or null for an open seek.
 *  Seeks carrying a word match only each other, so two people who agree on one
 *  meet however busy the lobby is. */
export function cleanKey(v) {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
  return s.length ? s : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** A stamp coarsened to the day it fell on, in UTC.
 *
 *  `lastSeen` moves on nearly everything a player does, so served to the
 *  millisecond it is a log of when somebody is at their desk, readable by
 *  anybody who polls `/api/players/:id` in a loop. That is the exact thing
 *  `showOnline` exists to let a person refuse (`server/presence.js`), and a
 *  setting that the field beside it quietly defeats is not a setting.
 *
 *  A day is the bucket the cards already choose to speak in: `seenText` in
 *  `src/views/playerCard.js` says "played this week", never an hour. This makes
 *  the API say no more than the page does. Kept public rather than dropped
 *  because "has not played since March" is a fair thing to know about somebody
 *  before asking them for a game; "was here eleven minutes ago" is not. */
export const toDay = (at) =>
  (typeof at === "number" && Number.isFinite(at) ? Math.floor(at / DAY_MS) * DAY_MS : at);

/** Everything about a player except the token hash and the volatility. */
export function publicPlayer(p) {
  return {
    id: p.id, name: p.name, tint: p.tint,
    rating: Math.round(p.rating), rd: Math.round(p.rd),
    wins: p.wins, losses: p.losses, draws: p.draws ?? 0,
    // When their picture last changed, or null. One number, so every place a
    // player is drawn can draw their picture; the bytes are their own request.
    avatarAt: p.avatarAt ?? null,
    // `createdAt` is left exact: it never moves, so it says nothing about when
    // anybody is at their desk, and the operator's list is sorted on it.
    createdAt: p.createdAt, lastSeen: toDay(p.lastSeen),
  };
}

/** A player put back at the newcomer's seat: the rating trio comes from `seat`
 *  and the record goes to zero. Everything that makes them who they are (name,
 *  tint, email, password, picture, the games they played) is left alone, which
 *  is what makes this something an operator can grant without deleting anybody. */
export const reseeded = (p, seat) => ({ ...p, ...seat, wins: 0, losses: 0, draws: 0 });

/** Has this player finished a rated game? Only they stand on the ladder. */
export const hasPlayed = (p) => p.wins + p.losses + (p.draws ?? 0) > 0;
