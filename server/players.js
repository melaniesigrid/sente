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

/** Everything about a player except the token hash and the volatility. */
export function publicPlayer(p) {
  return {
    id: p.id, name: p.name, tint: p.tint,
    rating: Math.round(p.rating), rd: Math.round(p.rd),
    wins: p.wins, losses: p.losses, draws: p.draws ?? 0,
    createdAt: p.createdAt, lastSeen: p.lastSeen,
  };
}

/** Has this player finished a rated game? Only they stand on the ladder. */
export const hasPlayed = (p) => p.wins + p.losses + (p.draws ?? 0) > 0;
