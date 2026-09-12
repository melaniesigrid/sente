/* ----------------------- BADGES -----------------------
   What a player has done, worked out from what is already known about them.

   THE RULE: MEASURED, NEVER AWARDED
   Every badge here is a function of a player's public record and nothing else.
   There is no grant, no list of who has what, and no way for anybody — an
   operator included — to give one out or take one away. If the arithmetic says
   you have it, you have it, and if the record changes the badge changes with
   it. That is the same rule the eval numbers in `docs/designs/masters-and-books.md`
   are written under, and the reason there is no badge for sportsmanship,
   helpfulness, or being an early adopter: those are claims somebody makes about
   you, and a claim wearing the costume of a measurement is worse than no badge.

   WHY THERE IS NO SERVER CODE FOR THIS
   The fields these read — wins, losses, draws, rating, deviation, the day the
   handle was made — are already on every public player the server serves. So a
   badge is derived where it is drawn, nothing is stored, nothing is migrated,
   and there is no new sentence owed to the privacy notice because nothing new
   is collected. Storing them would be storing a cached answer to a question
   that costs nothing to ask.

   Adding one: give it an id, a label, a line saying plainly what it measures,
   and an `earned` that reads the record. If you cannot write the line without
   using the word "for", it is an award and does not belong here. */

import { isProvisional } from "../engine/index.js";
import { rankOf } from "./rank.js";

const DAY = 24 * 60 * 60 * 1000;

/** Finished games, whichever way they went. */
export const gamesPlayed = (p) => (p?.wins ?? 0) + (p?.losses ?? 0) + (p?.draws ?? 0);

/** Whole days since the handle was made, or 0 without a date. */
export const daysHere = (p, now = Date.now()) =>
  p?.createdAt ? Math.max(0, Math.floor((now - p.createdAt) / DAY)) : 0;

/** The closed set. Order is the order they are drawn in: what you have done at
 *  the board first, then what the ladder knows, then how long you have been
 *  around. Each `hint` says what the badge measures, in the words somebody
 *  would use to check it themselves. */
export const BADGES = [
  {
    id: "first",
    label: "First game",
    hint: "Finished one game against a person",
    earned: (p) => gamesPlayed(p) >= 1,
  },
  {
    id: "ten",
    label: "Ten games",
    hint: "Finished ten games against people",
    earned: (p) => gamesPlayed(p) >= 10,
  },
  {
    id: "fifty",
    label: "Fifty games",
    hint: "Finished fifty games against people",
    earned: (p) => gamesPlayed(p) >= 50,
  },
  {
    id: "hundred",
    label: "A hundred games",
    hint: "Finished a hundred games against people",
    earned: (p) => gamesPlayed(p) >= 100,
  },
  {
    id: "fivehundred",
    label: "Five hundred games",
    hint: "Finished five hundred games against people",
    earned: (p) => gamesPlayed(p) >= 500,
  },
  {
    /* Not "good", not "improving": settled. The deviation is how unsure the
       ladder is, and this says it has stopped being unsure. */
    id: "settled",
    label: "Settled rank",
    hint: "Played enough that the ladder is sure of your rank",
    earned: (p) => gamesPlayed(p) >= 1 && p?.rd !== undefined && !isProvisional(p.rd),
  },
  {
    id: "dan",
    label: "Dan",
    hint: "A settled rank at dan level",
    earned: (p) => gamesPlayed(p) >= 1 && p?.rating !== undefined
      && !isProvisional(p.rd ?? 0) && rankOf(p.rating).endsWith("d"),
  },
  {
    id: "season",
    label: "A season here",
    hint: "Ninety days since this handle was made",
    earned: (p, now) => daysHere(p, now) >= 90,
  },
  {
    id: "year",
    label: "A year here",
    hint: "Three hundred and sixty-five days since this handle was made",
    earned: (p, now) => daysHere(p, now) >= 365,
  },
];

/** Every badge this player has, in the order above. Pure: the same record gives
 *  the same answer, always, wherever it is asked. */
export function badgesFor(player, now = Date.now()) {
  if (!player) return [];
  return BADGES.filter((b) => {
    try { return b.earned(player, now) === true; } catch { return false; }
  });
}

/** The games badges are tiers of one another, so a player with a hundred games
 *  should not wear five badges that all say the same thing. This keeps the
 *  highest of each tiered family and every untiered badge. */
const TIERS = [["first", "ten", "fifty", "hundred", "fivehundred"], ["season", "year"]];

export function badgesShown(player, now = Date.now()) {
  const have = badgesFor(player, now);
  const ids = new Set(have.map((b) => b.id));
  const beaten = new Set();
  for (const tier of TIERS) {
    const best = [...tier].reverse().find((id) => ids.has(id));
    if (best) for (const id of tier) if (id !== best) beaten.add(id);
  }
  return have.filter((b) => !beaten.has(b.id));
}
