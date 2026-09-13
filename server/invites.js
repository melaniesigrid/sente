/* ----------------------- THE INVITATION (pure) -----------------------
   Asking one named person for a game.

   Until this file the only way to play somebody you knew was to agree on a
   word out of band and both type it into the lobby in the same minute. That
   works, and it is still there; what it is not is an invitation, because
   nothing waits. If your friend is not at their desk in that minute, nothing
   happened, and nobody knows anybody tried.

   An invitation waits. It is a small row on both people's shelves:

     inv:<owner>:<other>

   written on both in one put, so reading "who has asked me for a game" is one
   bounded list and never a walk over everybody. The same object is stored
   under both keys and which way it points is read off `from`, so the two
   copies cannot come to disagree about who asked whom.

   WHO MAY INVITE YOU
   Exactly who may write to you: a friend, or somebody you have finished a game
   against. The rule lives in `post.js` and is asked rather than restated,
   because a server with two answers to "who can reach me" has not got a rule,
   it has got two exceptions.

   IT EXPIRES
   A day. An invitation still good a week later opens a board neither of you
   meant any more, and there are no clocks online, so the game it opens could
   then sit there for another week.

   THE TERMS ARE THE POINT
   A board size and a handicap, agreed by the two people it is between. The
   lobby cannot offer a handicap and says so in a comment, and it is right:
   two strangers have no way to agree on one. Two people who know each other
   do, and that is the difference an invitation makes.

   A handicap game is never rated. That is not a policy about handicaps: a
   rating that counted a four-stone win as an even one would be a wrong number
   on two people's records, and the ratings here are honest before they are
   generous. The server forces it rather than trusting the frame, the way a
   pair table is forced. */

import { SIZES } from "./room.js";

/** How long an invitation stands. See the note above. */
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

/** How many invitations may be waiting on one player at once, and how many one
 *  player may have out. Small on purpose: this is asking somebody you know for
 *  a game, and a person with twenty boards pending has stopped doing that. */
export const MAX_INCOMING = 20;
export const MAX_OUTGOING = 20;

/** How many one player may send in an hour. Reached by somebody inviting every
 *  friend they have twice, which is the behaviour this is here to slow down. */
export const INVITE_LIMIT = 40;
export const INVITE_WINDOW_MS = 60 * 60 * 1000;

/** The handicaps two people may agree on: none, or the two to nine stones the
 *  engine places. Kept here rather than imported from the lobby's own list,
 *  because that one is a browser preference and this one is a contract. */
export const HANDICAPS = [0, 2, 3, 4, 5, 6, 7, 8, 9];

/** The key an invitation is written under on one player's shelf. */
export const inviteKey = (owner, other) => `inv:${owner}:${other}`;
export const invitePrefix = (owner) => `inv:${owner}:`;

/** The terms, read from whatever the browser sent.
 *
 *  Nothing here throws and nothing here trusts: an unknown size becomes the
 *  board most of the world plays on, an unknown handicap becomes none, and a
 *  handicap game is unrated whatever the frame said. */
export function cleanTerms(raw) {
  const t = raw && typeof raw === "object" ? raw : {};
  const size = SIZES.includes(t.size) ? t.size : 19;
  const handicap = HANDICAPS.includes(t.handicap) ? t.handicap : 0;
  // Forced, never trusted. See the note at the top of this file.
  const rated = handicap === 0 && t.rated !== false;
  return { size, handicap, rated };
}

/** A stored invitation, read defensively. Storage holds whatever an older
 *  version of this file put there, and a row that has lost its shape reads as
 *  nothing at all rather than throwing inside a request nobody can retry. */
export function readInvite(stored) {
  if (!stored || typeof stored !== "object") return null;
  if (typeof stored.from !== "string" || typeof stored.to !== "string") return null;
  if (!stored.from || !stored.to || stored.from === stored.to) return null;
  return {
    from: stored.from,
    to: stored.to,
    ...cleanTerms(stored),
    at: Number(stored.at) || 0,
  };
}

/** Is this invitation still standing? */
export const fresh = (inv, now) => !!inv && now - inv.at < INVITE_TTL_MS;

/** The rows on one player's shelf: read, cleared of anything that has aged
 *  out, and split by who did the asking. Newest first both ways, because both
 *  lists are read from the top. */
export function shelf(rows, meId, now) {
  const alive = rows.map(readInvite).filter((inv) => fresh(inv, now));
  const by = (dir) => alive
    .filter((inv) => (dir === "in" ? inv.to === meId : inv.from === meId))
    .sort((a, b) => b.at - a.at);
  return { incoming: by("in"), outgoing: by("out") };
}

/** The keys on a shelf that have aged out, so that reading one tidies it.
 *  An expired invitation is deleted where it is found rather than swept up on
 *  a schedule: there is no sweeper on a Durable Object that sleeps, and the
 *  only person who needs it gone is the one looking at the shelf it is on. */
export function expired(entries, now) {
  return entries
    .filter(([, value]) => !fresh(readInvite(value), now))
    .map(([key]) => key);
}

/** Ask somebody for a game.
 *
 *  `mine` and `theirs` are the two shelves as stored rows; the answer is the
 *  invitation to write on both of them, or a refusal.
 *
 *  Inviting somebody you have already invited replaces the terms rather than
 *  adding a second row. Changing your mind from 19x19 to 9x9 is an edit of the
 *  one question you asked; two rows from the same person to the same person
 *  are not two questions, they are a mess on somebody's shelf.
 *
 *  Inviting somebody who has already invited you is refused, and deliberately
 *  not turned into a game the way two crossed friend requests are turned into
 *  a friendship. Two people who each asked for a friendship asked for the same
 *  thing. Two people who each asked for a game asked for two boards, possibly
 *  of different sizes with different handicaps, and quietly picking one of
 *  them is picking for both. */
export function offer({ mine, theirs, meId, themId, terms, now }) {
  if (!meId || !themId || meId === themId) return { error: "yourself" };
  const ours = shelf(mine, meId, now);
  if (ours.incoming.some((inv) => inv.from === themId)) return { error: "they-asked-first" };
  const standing = ours.outgoing.some((inv) => inv.to === themId);
  if (!standing && ours.outgoing.length >= MAX_OUTGOING) return { error: "too-many-invites" };
  const yours = shelf(theirs, themId, now);
  if (!yours.incoming.some((inv) => inv.from === meId) && yours.incoming.length >= MAX_INCOMING) {
    return { error: "their-invites-are-full" };
  }
  return {
    invite: { from: meId, to: themId, ...cleanTerms(terms), at: now },
    outcome: standing ? "changed" : "invited",
  };
}

/** Take one up. Only the person who was asked may do this, so an invitation
 *  that is not on this player's incoming list is refused whatever the other
 *  shelf says: the incoming row is the record of having been asked. */
export function takeUp({ mine, meId, themId, now }) {
  if (!meId || !themId || meId === themId) return { error: "yourself" };
  const invite = shelf(mine, meId, now).incoming.find((inv) => inv.from === themId);
  return invite ? { invite } : { error: "no-invite" };
}

/** Undo whatever stands between these two, whichever way it points. One
 *  function and one route, for the reason `friends.js` gives: from the person
 *  pressing it, declining an invitation and taking one back are the same act,
 *  and which shelf the row was on is the server's business to look up rather
 *  than the caller's to know before it may ask.
 *
 *  Nothing is told to the other side. A declined invitation that announced
 *  itself would be a message, and the person declining gets to decide whether
 *  it ever comes up. */
export function drop({ mine, meId, themId, now }) {
  if (!meId || !themId || meId === themId) return { error: "yourself" };
  const ours = shelf(mine, meId, now);
  if (ours.incoming.some((inv) => inv.from === themId)) return { outcome: "declined" };
  if (ours.outgoing.some((inv) => inv.to === themId)) return { outcome: "withdrawn" };
  return { outcome: "nothing" };
}

/** Who sits where.
 *
 *  The person who was invited takes Black. The lobby gives Black to whoever
 *  was waiting, by courtesy; this is that same courtesy pointed at the same
 *  kind of person, the one who did not choose the terms. Whoever asked chose
 *  the board, the handicap and whether it counts.
 *
 *  The engine places a handicap for Black, which is the other reason the guest
 *  sits there: a handicap the inviter took for themselves would be a way to
 *  ask somebody for a game and hand yourself the stones. */
export const seatsFor = (invite) => ({ black: invite.to, white: invite.from });
