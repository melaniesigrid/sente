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
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/** "March 2026". The month and the year, because the day somebody made an
 *  account is nobody's business and nobody's interest either.
 *
 *  The month is a catalogue line and so is the way the two are joined, because
 *  "March 2026" and "marzo de 2026" are not the same sentence with one word
 *  swapped. */
export function monthYear(at, t = EN) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return null;
  return t("date.monthYear", { month: t(`date.month.${d.getMonth() + 1}`), year: d.getFullYear() });
}

/** Whole calendar days from `a` to `b`, so a game at eleven last night is
 *  "yesterday" at nine this morning rather than "today, ten hours ago". */
function daysApart(a, b) {
  const start = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  return Math.round((start(b) - start(a)) / 86400000);
}

/** "Here since March 2026", or null for a player record without a date on it. */
export function joinedText(createdAt, t = EN) {
  const when = createdAt ? monthYear(createdAt, t) : null;
  return when ? t("player.since", { when }) : null;
}

/** How long ago, in the widest bucket that is still true, as a phrase rather
 *  than a sentence: "yesterday", "this week", "March 2026". Nothing finer than
 *  a day, and nothing at all without a stamp to go on.
 *
 *  It is the phrase and not the sentence because two screens want it in two
 *  frames: a player card says "Played yesterday" and a letter says only when it
 *  arrived. Peeling the verb off an English sentence with `replace` is not a
 *  translation, it is a trick that works in exactly one language. */
export function whenText(at, t = EN, now = Date.now()) {
  if (!at) return null;
  const days = daysApart(at, now);
  if (days <= 0) return t("player.when.today");    // 0, or a clock behind the server's
  if (days === 1) return t("player.when.yesterday");
  if (days < 7) return t("player.when.thisWeek");
  if (days < 31) return t("player.when.thisMonth");
  return monthYear(at, t);
}

/** How recently they played, said as a sentence about a person. */
export function seenText(lastSeen, t = EN, now = Date.now()) {
  const when = whenText(lastSeen, t, now);
  if (!when) return null;
  const days = daysApart(lastSeen, now);
  return t(days < 31 ? "player.played" : "player.lastPlayed", { when });
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
export function presenceLine(isHere, lastSeen, t = EN, now = Date.now()) {
  return isHere ? t("online.friends.hereNow") : seenText(lastSeen, t, now);
}

/** The record, or an honest sentence when there is not one yet. A player with
 *  no finished game has no rank worth reading either, which is why the badge
 *  beside this carries its own question mark. */
export function recordText(player, t = EN) {
  const wins = player.wins ?? 0;
  const losses = player.losses ?? 0;
  const draws = player.draws ?? 0;
  if (!wins && !losses && !draws) return t("player.noGames");
  const parts = [t("player.wins", { count: wins }), t("player.losses", { count: losses })];
  if (draws) parts.push(t("player.draws", { count: draws }));
  return parts.join(" · ");
}

/** The facts this player actually filled in, in the order `profile.js` lists
 *  them. An empty field is left out rather than shown as a blank row: three
 *  empty rows look like a form somebody failed, and this is not their form. */
export function factRows(player, t = EN) {
  const facts = player?.facts ?? {};
  return FACTS
    .filter((f) => typeof facts[f.key] === "string" && facts[f.key].trim() !== "")
    .map((f) => ({ key: f.key, label: t(`fact.${f.key}.label`, null, f.label), value: facts[f.key] }));
}

/** Is there anything on this card besides the numbers the server computed?
 *  A page with nothing said on it gets one line saying so, rather than a wide
 *  empty space that reads as a page that failed to load. */
export function saidAnything(player) {
  return !!(player?.bio && player.bio.trim()) || factRows(player).length > 0;
}
