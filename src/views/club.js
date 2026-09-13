/* ----------------------- A CLUB, IN WORDS (pure) -----------------------
   What a club's screens say, and what they say when the server refuses. Pure,
   so the wording can be read in one place and tested without a browser, the
   way `friendship.js` and `invitation.js` are.

   The powers come from `server/clubs.js` rather than being restated here. A
   screen that worked out for itself what a keeper may do would be a second
   opinion about a question the server already answers, and the two would part
   company the first time either changed. */

import { BASE_LOCALE, makeT, lineOr } from "../i18n/index.js";
import { may, ROLES, MAX_MEMBERS, NAME_MIN, NAME_MAX, ABOUT_MAX, CODE_LENGTH, cleanCode }
  from "../../server/clubs.js";

const EN = makeT(BASE_LOCALE);

export { may, ROLES, MAX_MEMBERS, NAME_MIN, NAME_MAX, ABOUT_MAX, CODE_LENGTH, cleanCode };

/** What a role is called on a row. A plain member gets no chip at all: the
 *  roll is mostly members, and a badge on every row is a badge on nobody. */
export const roleLabel = (role, t = EN) =>
  (role === "member" || !role ? "" : lineOr(t, `club.role.${role}`, role));

/** The line under a club's name: how many are in it, and whether it can be
 *  found. The two facts somebody deciding whether to join actually wants. */
export function clubLine(club, t = EN) {
  const members = t("club.membersCount", { count: club.members ?? 0 });
  const listed = t(club.listed ? "club.listedYes" : "club.listedNo");
  return `${members} · ${listed}`;
}

/** Whether a name and a description could be sent at all, and why not. Checked
 *  here as well as on the server, because a form that lets somebody press and
 *  then says no has wasted a round trip to tell them what it already knew. */
export function clubProblem({ name, about }, t = EN) {
  const trimmed = (name ?? "").trim();
  if (trimmed.length < NAME_MIN) return t("club.problem.shortName", { min: NAME_MIN });
  if (trimmed.length > NAME_MAX) return t("club.problem.longName", { max: NAME_MAX });
  if ((about ?? "").length > ABOUT_MAX) return t("club.problem.longAbout", { max: ABOUT_MAX });
  return null;
}

/** Whether what somebody typed is shaped like a code. The same folding the
 *  server does, so a person who typed it with a dash in it is not told their
 *  own code is wrong. */
export function codeProblem(typed, t = EN) {
  if (!(typed ?? "").trim()) return t("club.problem.noCode");
  return cleanCode(typed) ? null : t("club.problem.badCode", { length: CODE_LENGTH });
}

/** The acts a screen should offer somebody with this role, in the order they
 *  belong on a page: the ones about the club, then the one about leaving.
 *
 *  `founder` is passed separately from the role because a founder is the only
 *  member who cannot leave, and a button that is offered and then refused is
 *  worse than one that was never there. */
export function clubActs(role) {
  return {
    change: may(role, "changeTheClub"),
    rollCode: may(role, "rollTheCode"),
    close: may(role, "closeTheClub"),
    nameKeepers: may(role, "nameKeepers"),
    showTheDoor: may(role, "showTheDoor"),
    seeCode: role !== null && role !== undefined,
    leave: !!role && role !== "founder",
  };
}

/** What one member's row may offer the person reading it. Nothing at all on
 *  your own row, and nothing on the founder's: the founder cannot be named,
 *  unnamed or shown out by anybody, which is the rule that stops a club being
 *  emptied by one bad afternoon. */
export function rowActs({ myRole, theirRole, mine }) {
  if (mine || theirRole === "founder") return { name: false, unname: false, door: false };
  return {
    name: may(myRole, "nameKeepers") && theirRole === "member",
    unname: may(myRole, "nameKeepers") && theirRole === "keeper",
    // A keeper may show a member out; only a founder may show a keeper out.
    door: may(myRole, "showTheDoor") && (theirRole === "member" || myRole === "founder"),
  };
}

/** Every reason a club call can be refused, in the house voice. */
export const CLUB_ERRORS = [
  "offline", "no-server", "unauthorized", "no-player", "no-club", "bad-club-name",
  "bad-code", "already-a-member", "club-is-full", "too-many-clubs", "not-a-member",
  "not-allowed", "not-yourself", "no-such-role", "founder-cannot-leave",
  "too-many-clubs-made", "no-code",
];

export const clubErrorText = (reason, t = EN) =>
  lineOr(t, `club.error.${reason}`, t("club.error.unknown", { reason }));

/** The clubs list with one taken out by hand, so leaving or closing shows its
 *  result at once rather than after a second round trip. */
export const withoutClub = (clubs, id) => (clubs || []).filter((c) => c.id !== id);

/** The roll with one member's row taken out, for the same reason. */
export const withoutMember = (rollRows, id) => (rollRows || []).filter((m) => m.id !== id);

/** The roll with one member's role changed in place, keeping the order the
 *  server sent: re-sorting on the client would move a row out from under the
 *  finger that just pressed it. */
export const withRole = (rollRows, id, role) =>
  (rollRows || []).map((m) => (m.id === id ? { ...m, role } : m));
