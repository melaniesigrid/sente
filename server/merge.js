/* ----------------------- MERGE (pure) -----------------------
   Folding one handle into another, for the operator. Somebody who claimed a
   handle, lost the browser it lived in, and claimed a second one has two
   records and wants one. Everything that moves is decided here, without
   storage, so the arithmetic can be tested without a Durable Object.

   WHAT MOVES AND WHAT DOES NOT
   The games move: the lobby list, the archive rows, the pinned rows, and the
   seat in every Room those games were played in, so opening one of them from
   the surviving handle gives its owner their own chair and not a spectator's.
   The record moves: wins, losses and draws are summed. The rating does NOT
   move: two Glicko-2 trios are not summable, and the surviving handle's is the
   one its owner has been playing under. The address, the password and the
   sessions do not move either, because the surviving handle keeps its own, and
   an operator merges INTO the handle that can sign in. */

import { MAX_FEATURED } from "./featured.js";

/** One seat or summary entry with the old id swapped for the new person. A
 *  seat that was never the old person comes back untouched, same object. */
export function reseat(entry, fromId, who) {
  if (!entry || entry.id !== fromId) return entry;
  return {
    ...entry,
    id: who.id,
    name: who.name,
    ...(who.tint !== undefined ? { tint: who.tint } : {}),
    ...(who.avatarAt !== undefined ? { avatarAt: who.avatarAt } : {}),
  };
}

/** The lobby's summary of a game (and an archive row, which is a subset of
 *  one) with the old person replaced in the lead seats and the teams. */
export function reseatSummary(summary, fromId, who) {
  const teams = summary.teams
    ? { b: (summary.teams.b ?? []).map((e) => reseat(e, fromId, who)), w: (summary.teams.w ?? []).map((e) => reseat(e, fromId, who)) }
    : summary.teams;
  return { ...summary, black: reseat(summary.black, fromId, who), white: reseat(summary.white, fromId, who), teams };
}

/** A room with the old person's chair given to the new one, and any partner
 *  seat their browser ran now run by the new id. Returns the same object when
 *  the old person never sat here, so a caller can tell nothing changed. */
export function reseatRoom(room, fromId, who) {
  let changed = false;
  const seats = {};
  for (const id of Object.keys(room.seats)) {
    const s = room.seats[id];
    let next = s;
    if (s.kind === "human" && s.id === fromId) { next = reseat(s, fromId, who); changed = true; }
    else if (s.kind === "bot" && s.runBy === fromId) { next = { ...s, runBy: who.id }; changed = true; }
    seats[id] = next;
  }
  return changed ? { ...room, seats } : room;
}

/** The surviving handle's lobby list with the other's games folded in: no game
 *  twice, newest first, and still capped. */
export function mergedGames(mine, theirs, fromId, who, keep) {
  const seen = new Set(mine.map((g) => g.id));
  const added = theirs.filter((g) => !seen.has(g.id)).map((g) => reseatSummary(g, fromId, who));
  const at = (g) => g.updatedAt ?? g.endedAt ?? g.createdAt ?? 0;
  return [...mine, ...added].sort((a, b) => at(b) - at(a)).slice(0, keep);
}

/** The surviving record: the two win/loss records summed, the earlier of the
 *  two birthdays, the later of the two visits, a picture if only the other had
 *  one. The rating, the address, the password and the sessions are the
 *  survivor's own and are not touched. */
export function mergedRecord(into, from) {
  const n = (v) => Number(v) || 0;
  return {
    ...into,
    wins: n(into.wins) + n(from.wins),
    losses: n(into.losses) + n(from.losses),
    draws: n(into.draws) + n(from.draws),
    createdAt: Math.min(n(into.createdAt) || Infinity, n(from.createdAt) || Infinity) || into.createdAt,
    lastSeen: Math.max(n(into.lastSeen), n(from.lastSeen)) || into.lastSeen,
    avatarAt: into.avatarAt ?? from.avatarAt ?? null,
  };
}

/** The survivor's pinned games first, then the other's until the page is
 *  full. A game pinned by both keeps the survivor's line. */
export function mergedFeatured(mine, theirs) {
  const seen = new Set(mine.map((e) => e.id));
  return [...mine, ...theirs.filter((e) => !seen.has(e.id))].slice(0, MAX_FEATURED);
}
