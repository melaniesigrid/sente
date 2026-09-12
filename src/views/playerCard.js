/* ----------------------- A PLAYER'S CARD (pure) -----------------------
   The lines under somebody else's name, free of React so the wording can be
   tested without rendering a page.

   Everything about time here is deliberately coarse. `lastSeen` is already on
   every public player the server serves, so this file does not decide what is
   known: it decides what is said, and what is said about a stranger is "played
   this week", never an hour of a day. A friend seeing that somebody is at a
   board right now is a different thing with its own consent, and it does not
   come through here.

   The facts are read from `server/profile.js` rather than restated, so a field
   added there appears on this page in the same commit that adds it. */
import { FACTS } from "../../server/profile.js";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

/** "March 2026". The month and the year, because the day somebody made an
 *  account is nobody's business and nobody's interest either. */
export function monthYear(at) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return null;
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Whole calendar days from `a` to `b`, so a game at eleven last night is
 *  "yesterday" at nine this morning rather than "today, ten hours ago". */
function daysApart(a, b) {
  const start = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  return Math.round((start(b) - start(a)) / 86400000);
}

/** "Here since March 2026", or null for a player record without a date on it. */
export function joinedText(createdAt) {
  const when = createdAt ? monthYear(createdAt) : null;
  return when ? `Here since ${when}` : null;
}

/** How recently they played, in the widest bucket that is still true. Nothing
 *  finer than a day, and nothing at all without a stamp to go on. */
export function seenText(lastSeen, now = Date.now()) {
  if (!lastSeen) return null;
  const days = daysApart(lastSeen, now);
  if (days < 0) return "Played today";          // a clock slightly behind the server's
  if (days === 0) return "Played today";
  if (days === 1) return "Played yesterday";
  if (days < 7) return "Played this week";
  if (days < 31) return "Played this month";
  const when = monthYear(lastSeen);
  return when ? `Last played ${when}` : null;
}

/** The ids in a presence answer, as a set. The answer names only the people
 *  who are here AND who let this viewer know, so an id absent from it means one
 *  of those two things and the screen must not guess which. */
export const hereSet = (answer) => new Set((answer && answer.online) || []);

/** The one line about when somebody was last at a board.
 *
 *  "Here now" replaces the last-played line rather than sitting beside it: two
 *  lines saying "Here now · played this week" is the same fact twice, and the
 *  second one is the weaker version of the first. Somebody who is not here, or
 *  who has not said we may know, gets exactly what they got before presence
 *  existed, which is a bucket no finer than a day. */
export function presenceLine(isHere, lastSeen, now = Date.now()) {
  return isHere ? "Here now" : seenText(lastSeen, now);
}

/** The record, or an honest sentence when there is not one yet. A player with
 *  no finished game has no rank worth reading either, which is why the badge
 *  beside this carries its own question mark. */
export function recordText(player) {
  const wins = player.wins ?? 0;
  const losses = player.losses ?? 0;
  const draws = player.draws ?? 0;
  if (!wins && !losses && !draws) return "No finished games yet";
  const parts = [`${wins} W`, `${losses} L`];
  if (draws) parts.push(`${draws} drawn`);
  return parts.join(" · ");
}

/** The facts this player actually filled in, in the order `profile.js` lists
 *  them. An empty field is left out rather than shown as a blank row: three
 *  empty rows look like a form somebody failed, and this is not their form. */
export function factRows(player) {
  const facts = player?.facts ?? {};
  return FACTS
    .filter((f) => typeof facts[f.key] === "string" && facts[f.key].trim() !== "")
    .map((f) => ({ key: f.key, label: f.label, value: facts[f.key] }));
}

/** Is there anything on this card besides the numbers the server computed?
 *  A page with nothing said on it gets one line saying so, rather than a wide
 *  empty space that reads as a page that failed to load. */
export function saidAnything(player) {
  return !!(player?.bio && player.bio.trim()) || factRows(player).length > 0;
}
