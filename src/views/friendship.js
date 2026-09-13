/* ----------------------- FRIENDSHIP (pure) -----------------------
   What the button says, and what the page says when the server refuses. Pure,
   so the wording can be read in one place and tested without a browser.

   The standing between two people is worked out from the caller's own three
   lists rather than asked about per player. The lists are already in hand for
   the friends screen, `GET /api/players/:id` is cached for everybody alike and
   must not learn who is asking, and a page that had to ask a second question
   to know what its own button says would be slower and no more correct. */

import { BASE_LOCALE, makeT, lineOr } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/** Where these two stand, from the three lists the server sent me. */
export function standingWith(book, id) {
  if (!book || !id) return "none";
  const on = (list) => Array.isArray(list) && list.some((p) => p && p.id === id);
  if (on(book.friends)) return "friends";
  if (on(book.outgoing)) return "asked";
  if (on(book.incoming)) return "asking";
  return "none";
}

/** What the button on somebody's page should say and do, given where the two
 *  of you stand. `undo` is the quieter second action beside it, or null.
 *
 *  Four standings, four buttons, and the one that matters is "asking": a page
 *  that showed "Add friend" to somebody who has already asked you would send a
 *  second request across a table where the answer was already waiting. */
export function friendAction(standing, t = EN) {
  switch (standing) {
    case "friends":
      return { act: null, label: t("online.friends.act.friends"), done: true, undo: { act: "forget", label: t("online.friends.act.remove") } };
    case "asked":
      return { act: null, label: t("online.friends.act.asked"), done: true, undo: { act: "forget", label: t("online.friends.act.takeBack") } };
    case "asking":
      return { act: "accept", label: t("online.friends.act.accept"), done: false, undo: { act: "forget", label: t("online.friends.act.decline") } };
    default:
      return { act: "ask", label: t("online.friends.act.add"), done: false, undo: null };
  }
}

/** What just happened, said back to the person who did it. The server answers
 *  every one of these with an outcome rather than a bare 200, because
 *  "withdrawn" and "declined" come back from the same call and mean opposite
 *  things to the person who pressed. */
export const OUTCOMES = ["friends", "asked", "unfriended", "declined", "withdrawn", "nothing"];

export const outcomeText = (outcome, t = EN) =>
  lineOr(t, `online.friends.outcome.${outcome}`, t("online.friends.outcome.done"));

/** Every reason a friend call can be refused, in the house voice. The two
 *  full-list messages are deliberately different: one is something the person
 *  reading it can do something about, and the other is not theirs to fix. */
export const FRIEND_ERRORS = [
  "offline", "no-server", "unauthorized", "no-player", "yourself",
  "already-friends", "no-request", "your-list-is-full", "their-list-is-full",
  "too-many-asked", "their-requests-are-full", "too-many-requests",
];

export const friendErrorText = (reason, t = EN) =>
  lineOr(t, `online.friends.error.${reason}`, t("online.friends.error.unknown", { reason }));

/** The book with one person moved by hand, so a press shows its result at once
 *  instead of after a second round trip. The server is still the authority:
 *  this is what the screen believes until the next fetch, and every call that
 *  uses it replaces the whole book when the answer arrives.
 *
 *  `person` is the public row to move; `to` is the standing to move them to. */
export function moved(book, person, to) {
  const base = book || { friends: [], incoming: [], outgoing: [] };
  const drop = (list) => (list || []).filter((p) => p.id !== person.id);
  const next = { friends: drop(base.friends), incoming: drop(base.incoming), outgoing: drop(base.outgoing) };
  const entry = { ...person, at: Date.now() };
  if (to === "friends") next.friends = [entry, ...next.friends];
  else if (to === "asked") next.outgoing = [entry, ...next.outgoing];
  else if (to === "asking") next.incoming = [entry, ...next.incoming];
  return next;
}

/** Where a given outcome leaves the two of you, so one table maps the server's
 *  word onto the screen's belief and no caller has to remember which is which. */
export const STANDING_AFTER = {
  friends: "friends",
  asked: "asked",
  unfriended: "none",
  declined: "none",
  withdrawn: "none",
  nothing: "none",
};

/** Is there anything at all in this book? An empty friends screen says so in
 *  one line rather than showing three empty headings. */
export const bookIsEmpty = (book) =>
  !book || [book.friends, book.incoming, book.outgoing].every((l) => !l || l.length === 0);

/** Every id on the card, each of them once, so who-is-here can be asked in one
 *  call instead of one per row. The order is the order the card reads in. */
export function everyoneIn(book) {
  if (!book) return [];
  const seen = new Set();
  for (const list of [book.incoming, book.friends, book.outgoing]) {
    for (const p of list || []) if (p && p.id) seen.add(p.id);
  }
  return [...seen];
}
