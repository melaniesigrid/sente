/* ----------------------- PRESENCE (pure) -----------------------
   Who is allowed to know that you are here right now.

   Three things about this are worth reading before changing any of it.

   **Presence is never stored.** Being here is a live lobby socket and nothing
   else: the Registry tags each one with its player's id, so "is this person
   here" is a question about memory and never about storage. Nothing is written
   when you arrive and nothing is written when you go, which is why the privacy
   notice can keep saying Joseki has never counted a visit. A stored presence
   would be a log of when somebody is at their desk, kept for as long as
   somebody forgot to delete it.

   **The default is friends, not everyone.** The complaint that started this
   server was that the other places "feel not safe", and a server that
   broadcasts when you are at your desk to anybody who asks is the shape of
   that complaint. So the opt-out the ask called for is the default, and
   telling the world is the thing you turn on.

   **Nothing here ever says somebody is offline.** The answer to "who of these
   people is here" is a list of the ones who are, and everybody else is absent
   from it for one of two reasons that the caller cannot tell apart: they are
   not here, or they did not want you to know. An answer that distinguished
   those two would publish the setting of everybody who chose to hide, which is
   most of what they were hiding. */

/** What a player may choose, and what each choice means to somebody looking.
 *  The order is the order the control offers them: most private first, so the
 *  screen reads as a dial that is turned up rather than a switch to defeat. */
export const SHOW_ONLINE = [
  { id: "nobody", label: "Nobody", hint: "Not even your friends see when you are here" },
  { id: "friends", label: "Your friends", hint: "The people you have both agreed with" },
  { id: "everyone", label: "Anybody", hint: "Anyone who opens your page" },
];

export const SHOW_ONLINE_IDS = SHOW_ONLINE.map((o) => o.id);

/** The setting a player who has never touched it has. Friends, deliberately:
 *  see the note above. Changing this line changes it for everybody who never
 *  chose, which is the one change in this file that needs saying out loud. */
export const DEFAULT_SHOW_ONLINE = "friends";

/** A stored or submitted setting, read safely. Anything that is not one of the
 *  three becomes the default rather than throwing: this arrives from a browser,
 *  and a request with a typo in it should leave a player more private than they
 *  asked for, never less. */
export function cleanShowOnline(v) {
  return SHOW_ONLINE_IDS.includes(v) ? v : DEFAULT_SHOW_ONLINE;
}

/** May `viewerId` be told whether this player is here?
 *
 *  `isFriend` is settled friendship and nothing weaker: somebody who has asked
 *  you and is waiting for an answer is not yet a friend, and a request must not
 *  be a way to watch when somebody is at their desk while they decide.
 *
 *  You can always see yourself, whatever you chose. The setting is about other
 *  people, and a screen that hid your own dot from you would read as broken. */
export function canSeeOnline(subject, viewerId, isFriend) {
  if (!subject || !subject.id) return false;
  if (subject.id === viewerId) return true;
  switch (cleanShowOnline(subject.showOnline)) {
    case "everyone": return true;
    case "friends": return !!isFriend && !!viewerId;
    default: return false;
  }
}

/** Of these people, the ones this viewer may be told are here, and who are.
 *
 *  `subjects` are player records, `here` answers whether an id has a live
 *  socket, and `friendIds` is the viewer's settled friends as a Set. The answer
 *  is a plain list of ids, never a map with `false` in it, for the reason in
 *  the note at the top of this file. */
export function whoIsHere(subjects, viewerId, friendIds, here) {
  const friends = friendIds instanceof Set ? friendIds : new Set(friendIds || []);
  return subjects
    .filter((s) => canSeeOnline(s, viewerId, friends.has(s.id)) && here(s.id))
    .map((s) => s.id);
}

/** How many ids one call may ask about. A friends list is capped at 200 and a
 *  page asks about one, so this is far past any screen; it is here so the route
 *  cannot be turned into a sweep of the whole ladder in a single request. */
export const MAX_ASK = 256;

/** The ids in a `?ids=` parameter: split, trimmed, de-duplicated and capped.
 *  Empty rather than an error for nonsense, because the answer to "which of
 *  these nobodies is here" is honestly an empty list. */
export function askedIds(raw) {
  if (typeof raw !== "string" || raw === "") return [];
  return [...new Set(
    raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0 && s.length <= 64),
  )].slice(0, MAX_ASK);
}
