/* ----------------------- THE ROLL (pure) -----------------------
   What happened here lately, ordered by how much it has to do with you.

   THE PROBLEM IT SOLVES
   A player who signs in after a day away lands on a dashboard of their own
   progress and learns nothing about whether anybody else was here. The app
   feels empty whenever nobody happens to be playing, which on a club server of
   a few dozen people is most of the time. The fix is not a place to broadcast.
   It is evidence that the club was here.

   ONE INDEX, NOT ONE PER PERSON
   The obvious shape is a shelf per player: at the end of a game, write a row
   onto each of your friends' shelves, and reading your roll is one key. That
   is how `friends:` and `inv:` work here and it is usually right.

   It is wrong for this. Fan-out pays up to two hundred writes per finished
   game to serve a read that only ever looks at the top of the list, it needs
   a reverse map to know whose cached page to drop, and it has to be undone
   when somebody unfriends. The alternative that was tried first — merging
   every friend's archive at read time — is worse in a quieter way: merging K
   time-sorted streams gives you filter-by-relationship-then-recency, which is
   not "order by relationship" at all. In a club where one member plays every
   day, that member drowns everybody else, which is the exact failure the roll
   exists to avoid.

   So: ONE capped index of finished games, `roll:<stamp>:<gameId>`, one write
   per finished game, read newest-first in a single `list`. Relationship is
   then applied to those rows in memory, where it can actually sort rather than
   only filter. The whole apparatus of cursors across K streams, per-viewer
   caches and reverse invalidation disappears with it.

   WHAT ORDERING MEANS, AND WHAT IT MAY NOT MEAN
   The privacy notice forbids counting visits and says plainly that a game is
   not a visit and an account is not a visit. Ordering by relationship is not
   counting attention: it reads deliberate acts that were already stored —
   you played them, you friended them, you wrote to them. Nothing here counts
   who looked at what, and there is no view count, no "seen by", no trending
   and no like. If a sort key ever needs somebody's attention to compute, it
   does not belong in this file. */

/** How many finished games the roll remembers. The same order of magnitude as
 *  the other capped lists here (a thread keeps 100, the chain 400, deja vu
 *  1500): enough that a quiet week still has something in it, small enough
 *  that the whole index is one bounded read. */
export const ROLL_KEEP = 400;

/** How many rows one page of the roll hands back. */
export const ROLL_PAGE = 24;

/** Fixed width, so the keys sort by time as strings. Same arithmetic as the
 *  archive's, and for the same reason: "9" sorts after "10" and a game from
 *  2001 would otherwise outrank one from next week. */
const STAMP_WIDTH = 14;

export function stampOf(ms) {
  const n = Math.floor(Number(ms));
  return String(Number.isFinite(n) && n > 0 ? n : 0).padStart(STAMP_WIDTH, "0");
}

export const ROLL_PREFIX = "roll:";
export const rollKey = (endedAt, gameId) => `${ROLL_PREFIX}${stampOf(endedAt)}:${gameId}`;

/** How close a row is to you. Higher sorts first.
 *
 *  Played beats friended beats wrote-to, because the roll is about games and
 *  the truest answer to "is this my club" is having sat down with them. A row
 *  with nobody you know scores zero and still appears — the roll of a brand
 *  new player is the house's, or it is an empty box. */
export const TIE_STRANGER = 0;
export const TIE_WROTE = 1;
export const TIE_FRIEND = 2;
export const TIE_PLAYED = 3;

export function tieOf(ids, near) {
  let best = TIE_STRANGER;
  for (const id of ids) {
    if (near.played && near.played.has(id)) return TIE_PLAYED;
    if (near.friends && near.friends.has(id)) best = Math.max(best, TIE_FRIEND);
    else if (near.wrote && near.wrote.has(id)) best = Math.max(best, TIE_WROTE);
  }
  return best;
}

/** Who sat at this game, as ids. Pair tables seat four, so this is not two. */
export function seatsOf(row) {
  const out = [];
  for (const side of ["b", "w"]) {
    const seats = (row.teams && row.teams[side]) || [side === "b" ? row.black : row.white];
    for (const p of seats || []) if (p && p.id) out.push(p.id);
  }
  return out;
}

/** One page of the roll for one viewer.
 *
 *  `rows` are the stored rows newest-first, exactly as the index hands them
 *  over. `near` is `{played, friends, wrote}`, three Sets of ids. `blocked` is
 *  a Set too.
 *
 *  Blocking is applied here and not at write time, because a row is one
 *  object shared by every reader and blocking is one reader's decision. A
 *  blocked person's games are absent, silently, the way their letters are.
 *
 *  Your own games are in it. You know about them, but a roll that skipped them
 *  would read as though you had not been here, and the point of the thing is
 *  showing that people were. */
export function rollFor(rows, near = {}, opts = {}) {
  const { blocked = new Set(), limit = ROLL_PAGE, viewerId = null } = opts;
  const no = blocked instanceof Set ? blocked : new Set(blocked);
  const scored = [];
  for (const row of rows) {
    const ids = seatsOf(row);
    if (ids.some((id) => no.has(id))) continue;
    const others = viewerId ? ids.filter((id) => id !== viewerId) : ids;
    scored.push({ row, tie: tieOf(others, near), at: Number(row.endedAt) || 0 });
  }
  /* Stable within a tier and newest-first inside it: the rows arrive in time
     order, so a stable sort on the tier alone would do — but `at` is compared
     explicitly rather than trusted, because a caller that ever hands these
     over unsorted should still get a sensible page instead of a silent bug. */
  scored.sort((x, y) => (y.tie - x.tie) || (y.at - x.at));
  return scored.slice(0, limit).map((s) => ({ ...s.row, tie: s.tie }));
}

/** Is there enough in the roll to be worth showing?
 *
 *  A roll with nothing anybody knows in it is not a failure — it is a new
 *  player's first look, and the view answers it with featured games and house
 *  players rather than an empty box. This is how the view knows to. */
export const rollIsThin = (page, near = {}) =>
  page.length === 0 || page.every((r) => r.tie === TIE_STRANGER);
