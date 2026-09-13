/* ----------------------- AN INVITATION, IN WORDS (pure) -----------------------
   What an invitation says on a card, what the button beside it offers, and
   what the page says when the server refuses one. Pure, so the wording can be
   read in one place and tested without a browser, the way `friendship.js` is.

   The terms are said in full on every row. An invitation is an agreement about
   a board, and a row that said only "Ana invited you" would ask somebody to
   press accept to find out what they had agreed to. */

import { BASE_LOCALE, makeT, lineOr } from "../i18n/index.js";
import { cleanTerms } from "../../server/invites.js";

const EN = makeT(BASE_LOCALE);

export { HANDICAPS, cleanTerms } from "../../server/invites.js";

/** The terms of one invitation as a sentence: the board, the handicap if there
 *  is one, and whether it counts. Rated is said out loud in both directions,
 *  because "this one does not count" is the thing a person most wants to know
 *  before sitting down, and its absence would read as an oversight. */
export function termsText(invite, t = EN) {
  const { size, handicap, rated } = cleanTerms(invite);
  const board = t("online.invites.terms.board", { size });
  const stones = handicap ? t("online.invites.terms.handicap", { count: handicap }) : null;
  const counts = t(rated ? "online.invites.terms.rated" : "online.invites.terms.unrated");
  return [board, stones, counts].filter(Boolean).join(" · ");
}

/** Which colour the person reading this will play, given who asked. The guest
 *  takes Black: whoever asked chose the board, the handicap and whether it
 *  counts, so the least they can do is play White. */
export const colourFor = (invite, meId) => (invite && invite.to === meId ? "b" : "w");

/** What the button on somebody's page should say and do about a game.
 *
 *  Four standings, and the one that matters is somebody who has already
 *  invited you: a page offering "Invite" there would put a second board in the
 *  air across a table where the first question was still waiting. */
export function inviteAction(standing, t = EN) {
  switch (standing) {
    case "invited":
      return { act: null, label: t("online.invites.act.invited"), done: true,
        undo: { act: "forget", label: t("online.invites.act.takeBack") } };
    case "inviting":
      return { act: "accept", label: t("online.invites.act.accept"), done: false,
        undo: { act: "forget", label: t("online.invites.act.decline") } };
    case "cannot":
      return { act: null, label: t("online.invites.act.cannot"), done: false, undo: null };
    default:
      return { act: "invite", label: t("online.invites.act.invite"), done: false, undo: null };
  }
}

/** Where these two stand over a board, from the two lists the server sent me.
 *  `canReach` is whether this person may be invited at all, which is the same
 *  question as whether they may be written to and is answered by the server. */
export function standingOver(invites, id, canReach = true) {
  if (!invites || !id) return canReach ? "none" : "cannot";
  const on = (list, whose) => Array.isArray(list) && list.some((i) => i && i[whose] === id);
  if (on(invites.incoming, "from")) return "inviting";
  if (on(invites.outgoing, "to")) return "invited";
  return canReach ? "none" : "cannot";
}

/** What just happened, said back to the person who did it. The server answers
 *  with an outcome rather than a bare 200, because "withdrawn" and "declined"
 *  come from the same call and mean opposite things to whoever pressed. */
export const INVITE_OUTCOMES = ["invited", "changed", "declined", "withdrawn", "nothing"];

export const inviteOutcomeText = (outcome, t = EN) =>
  lineOr(t, `online.invites.outcome.${outcome}`, t("online.invites.outcome.done"));

/** Every reason an invitation can be refused, in the house voice. */
export const INVITE_ERRORS = [
  "offline", "no-server", "unauthorized", "no-player", "yourself", "not-met",
  "no-invite", "they-asked-first", "too-many-invites", "their-invites-are-full",
  "too-many-invites-sent",
];

export const inviteErrorText = (reason, t = EN) =>
  lineOr(t, `online.invites.error.${reason}`, t("online.invites.error.unknown", { reason }));

/** The lists with one invitation taken out by hand, so a press shows its
 *  result at once instead of after a second round trip. The server is still
 *  the authority: every call that uses this replaces both lists when the
 *  answer arrives. */
export function withoutInvite(invites, id) {
  const base = invites || { incoming: [], outgoing: [] };
  return {
    incoming: (base.incoming || []).filter((i) => i.from !== id),
    outgoing: (base.outgoing || []).filter((i) => i.to !== id),
  };
}

/** Is there anything on either shelf? An empty invitations card says so in one
 *  line rather than showing two empty headings. */
export const shelfIsEmpty = (invites) =>
  !invites || [invites.incoming, invites.outgoing].every((l) => !l || l.length === 0);
