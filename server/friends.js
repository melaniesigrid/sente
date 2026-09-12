/* ----------------------- FRIENDS (pure) -----------------------
   Who knows whom, and what asking, accepting and forgetting do to both sides
   of that. Pure, so the whole policy can be read and tested in one place
   rather than inferred from a Durable Object that is mostly storage calls.

   The shape is a `book` per player, holding three lists of ids:

     friends    settled, both sides agreed
     outgoing   people this player has asked
     incoming   people who have asked this player

   An edge is written on BOTH players' books, never on one. That costs a second
   write and buys the thing that matters: reading your own friends is one key
   and never a scan over everybody, which is what the ten milliseconds a Worker
   invocation gets will actually pay for. The ladder already scans; nothing
   here may add a second one.

   Every function takes both books and returns both books. Nothing here knows
   about storage, ids beyond comparing them, or names. */

/** How many friends one player may have. Far past a club, nowhere near a
 *  crawler: the cap is here so one account cannot grow a record that no longer
 *  fits in an invocation's budget, not to tell anybody how to play. */
export const MAX_FRIENDS = 200;

/** How many requests may be in the air in either direction. Reached by
 *  somebody asking everybody, which is the behaviour this is here to stop. */
export const MAX_PENDING = 100;

/** How many people one player may ask in an hour. Generous for somebody who
 *  has just joined a club and is adding everybody they know, useless to a
 *  script working down the ladder. */
export const ASK_LIMIT = 60;
export const ASK_WINDOW_MS = 60 * 60 * 1000;

/** An empty book, and the shape every other function here promises to return. */
export const emptyBook = () => ({ friends: [], outgoing: [], incoming: [] });

/** A stored book, read defensively. Storage holds whatever an older version of
 *  this file put there, and a book that has lost its shape must read as an
 *  empty one rather than throw inside a request nobody can retry. */
export function readBook(stored) {
  const list = (v) => (Array.isArray(v) ? v.filter(isEntry) : []);
  if (!stored || typeof stored !== "object") return emptyBook();
  return {
    friends: list(stored.friends),
    outgoing: list(stored.outgoing),
    incoming: list(stored.incoming),
  };
}

const isEntry = (e) => !!e && typeof e === "object" && typeof e.id === "string" && e.id !== "";

/** Is this id in this list? */
export const has = (list, id) => list.some((e) => e.id === id);

/** The list without that id. Always a new array: a book is never edited in place,
 *  so a refusal halfway through a transition cannot leave one side changed. */
export const without = (list, id) => list.filter((e) => e.id !== id);

/** The list with that id at the front, and never twice. Newest first, because
 *  every screen that shows one of these lists shows the recent end of it. */
export const withEntry = (list, id, at) => [{ id, at }, ...without(list, id)];

/** Is this player already known to that one, in any of the three senses? */
export function standing(book, id) {
  if (has(book.friends, id)) return "friends";
  if (has(book.outgoing, id)) return "asked";
  if (has(book.incoming, id)) return "asking";
  return "none";
}

/** Make the two of them friends, on both books at once. Used by `ask` when the
 *  asking crossed in the post and by `accept` when it did not. */
function bind(mine, theirs, meId, themId, now) {
  return {
    mine: {
      friends: withEntry(mine.friends, themId, now),
      outgoing: without(mine.outgoing, themId),
      incoming: without(mine.incoming, themId),
    },
    theirs: {
      friends: withEntry(theirs.friends, meId, now),
      outgoing: without(theirs.outgoing, meId),
      incoming: without(theirs.incoming, meId),
    },
  };
}

/** Would either side go over the friend cap by binding these two? Answered for
 *  both, because a refusal has to be the same refusal whichever of them pressed. */
function full(mine, theirs, meId, themId) {
  if (!has(mine.friends, themId) && mine.friends.length >= MAX_FRIENDS) return "your-list-is-full";
  if (!has(theirs.friends, meId) && theirs.friends.length >= MAX_FRIENDS) return "their-list-is-full";
  return null;
}

/** Ask somebody to be friends.
 *
 *  Two people who have each asked the other are made friends on the spot. The
 *  alternative is telling the second one "you already have a request from
 *  them", which is a true sentence that asks them to press a different button
 *  to reach the outcome they just asked for.
 *
 *  Asking again when the request is already out is not an error worth refusing
 *  loudly: it is what somebody does when they are not sure the first one
 *  landed. It answers "asked" and changes nothing, so nothing is re-sent. */
export function ask(mine, theirs, meId, themId, now) {
  if (meId === themId) return { error: "yourself" };
  const how = standing(mine, themId);
  if (how === "friends") return { error: "already-friends" };
  if (how === "asked") return { ...bothUnchanged(mine, theirs), outcome: "asked" };
  if (how === "asking") {
    const over = full(mine, theirs, meId, themId);
    if (over) return { error: over };
    return { ...bind(mine, theirs, meId, themId, now), outcome: "friends" };
  }
  const over = full(mine, theirs, meId, themId);
  if (over) return { error: over };
  if (mine.outgoing.length >= MAX_PENDING) return { error: "too-many-asked" };
  if (theirs.incoming.length >= MAX_PENDING) return { error: "their-requests-are-full" };
  return {
    mine: { ...mine, outgoing: withEntry(mine.outgoing, themId, now) },
    theirs: { ...theirs, incoming: withEntry(theirs.incoming, meId, now) },
    outcome: "asked",
  };
}

/** Say yes to a request. Only the person who was asked may do this, so a
 *  request that is not on this player's incoming list is refused whatever the
 *  other side's book says: the incoming list is the record of consent. */
export function accept(mine, theirs, meId, themId, now) {
  if (meId === themId) return { error: "yourself" };
  if (has(mine.friends, themId)) return { error: "already-friends" };
  if (!has(mine.incoming, themId)) return { error: "no-request" };
  const over = full(mine, theirs, meId, themId);
  if (over) return { error: over };
  return { ...bind(mine, theirs, meId, themId, now), outcome: "friends" };
}

/** Undo whatever stands between these two, whichever direction it points.
 *
 *  One function and one route, because from the person pressing it these are
 *  the same act: "I do not want this". Declining a request, taking back one
 *  you sent, and ending a friendship differ only in which list the id was on,
 *  and making the caller know which is making them do the lookup twice.
 *
 *  Nothing is told to the other side. A declined request that announces itself
 *  is worse than one that quietly stops existing, and the person who declined
 *  gets to be the one who decides whether it ever comes up. */
export function forget(mine, theirs, meId, themId) {
  if (meId === themId) return { error: "yourself" };
  const outcome = has(mine.friends, themId) ? "unfriended"
    : has(mine.incoming, themId) ? "declined"
      : has(mine.outgoing, themId) ? "withdrawn"
        : "nothing";
  if (outcome === "nothing") return { ...bothUnchanged(mine, theirs), outcome };
  return {
    mine: { friends: without(mine.friends, themId), outgoing: without(mine.outgoing, themId), incoming: without(mine.incoming, themId) },
    theirs: { friends: without(theirs.friends, meId), outgoing: without(theirs.outgoing, meId), incoming: without(theirs.incoming, meId) },
    outcome,
  };
}

/** This player, gone from somebody else's book. What leaving does to everybody
 *  who knew the person leaving: `DELETE /api/me` promises that nothing is left
 *  behind, and a friendship is two records, so deleting only one of them would
 *  leave the other holding a name that no longer answers. */
export const forgetting = (book, id) => ({
  friends: without(book.friends, id),
  outgoing: without(book.outgoing, id),
  incoming: without(book.incoming, id),
});

/** Everybody whose book mentions this player, so leaving knows which records
 *  to rewrite without looking at anybody else's. */
export const everyoneWhoKnows = (book) =>
  [...new Set([...book.friends, ...book.outgoing, ...book.incoming].map((e) => e.id))];

const bothUnchanged = (mine, theirs) => ({ mine, theirs });
