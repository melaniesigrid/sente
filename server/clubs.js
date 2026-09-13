/* ----------------------- THE CLUB (pure) -----------------------
   A named place with a roll of members, and the very small amount of authority
   anybody has inside it.

   The whole design is argued in `docs/designs/the-club.md`. Three things from
   it are worth having in front of you before changing any of this.

   **Nobody is added to a club.** Joining is always a call the joining player
   makes with their own token. There is no route, and no function in this file,
   that puts one player into a club on another player's say-so. That is not a
   technicality: `src/content/legal.js` says "There is no list anybody can be
   added to", and a club is a list. The sentence stays true only this way, and
   it happens to be how a person expects a link to work.

   **Three roles and four powers, and no matrix.** Founder, keeper, member. A
   keeper may take down a line and show a member the door; a founder may also
   name keepers, change the club, roll its code and close it. There are no
   per-channel overrides and no custom roles. The permission system is the part
   of a chat server that is most often got wrong and most expensive to get
   wrong, so this one is small enough to read in a sitting.

   **A club is unlisted until it says otherwise.** Found by its code, unless a
   founder lists it. The default is the private one, for the same reason
   presence defaults to friends.

   Storage, all of it on the Registry, because "what are my clubs" is the first
   question every screen asks and it must be one key:

     club:<clubId>              the record
     member:<clubId>:<playerId> one row a member, so the roll is one bounded list
     clubs:<playerId>           the ids this player is in, newest first
     code:<code>                the club a code opens

   Nothing here knows about storage, sockets or names beyond comparing them. */

/** How many clubs one player may be in. Past a person's actual life, nowhere
 *  near a crawler: the cap is here so one account cannot grow a record that no
 *  longer fits in an invocation's budget. */
export const MAX_CLUBS = 20;

/** How many members one club may hold. The same number as the friends cap, for
 *  the same reason: far past a club, and bounded. */
export const MAX_MEMBERS = 200;

/** How many clubs one player may make in a day. A club costs a record and a
 *  code, and somebody making forty of them is not making clubs. */
export const FOUND_LIMIT = 5;
export const FOUND_WINDOW_MS = 24 * 60 * 60 * 1000;

export const NAME_MIN = 2;
export const NAME_MAX = 32;
export const ABOUT_MAX = 200;

/** The three roles, most authority first. The order is the order, so a
 *  comparison is an index and never a table. */
export const ROLES = ["founder", "keeper", "member"];

/** What each role may do. Written as the list of roles that hold each power
 *  rather than as a map of role to powers, because every question asked of it
 *  is "may this role do this", and one shape that answers the question asked
 *  cannot drift from another shape that answers it backwards. */
export const POWERS = {
  // Take one line out of a hall. The line goes; nothing takes its place.
  takeDownLine: ["founder", "keeper"],
  // Show a member the door. They keep everything of their own.
  showTheDoor: ["founder", "keeper"],
  // Add or rename a channel.
  keepChannels: ["founder", "keeper"],
  // Name and unname keepers.
  nameKeepers: ["founder"],
  // The name, the description, and whether it is listed.
  changeTheClub: ["founder"],
  // Issue a new code, which stops the old one.
  rollTheCode: ["founder"],
  // Close it for good.
  closeTheClub: ["founder"],
};

/** May a member with this role do this? Anything unknown is refused, both the
 *  role and the power, because the safe answer to a question this file has not
 *  heard of is no. */
export const may = (role, power) =>
  Object.hasOwn(POWERS, power) && POWERS[power].includes(role);

/** Anything a person typed, as one line.
 *
 *  A newline, a tab or a carriage return becomes a space; every other control
 *  character is dropped. The difference matters and was found by a test: a
 *  newline that is simply deleted joins the two words either side of it, so a
 *  description pasted out of a message came back reading "onetwo". The
 *  characters that were never visible leave nothing behind; the ones that were
 *  a gap leave a gap. */
function oneLine(v) {
  return Array.from(v)
    .map((ch) => {
      const c = ch.codePointAt(0);
      // Tab, newline and carriage return: the control characters that were a gap.
      if (c === 9 || c === 10 || c === 13) return " ";
      return c > 31 && c !== 127 ? ch : "";
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/** A club's name, read from whatever a browser sent: one line, two to
 *  thirty-two characters, or null. Kept close to `cleanName` in `http.js` on
 *  purpose, because a club is named the way a person is. */
export function cleanClubName(v) {
  if (typeof v !== "string") return null;
  const s = oneLine(v).slice(0, NAME_MAX);
  return s.length >= NAME_MIN ? s : null;
}

/** What a club says about itself. Empty is allowed and means it says nothing;
 *  a paragraph break is not, because this is a line and not a page. */
export function cleanAbout(v) {
  return typeof v === "string" ? oneLine(v).slice(0, ABOUT_MAX) : "";
}

/** The alphabet a code is written in: no `0`, `O`, `1`, `I` or `L`, because a
 *  code is read off one screen and typed into another, and those are the five
 *  characters that costs somebody a second try. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 8;

/** A code, built from random bytes the caller supplies. The randomness comes
 *  from outside so this file stays pure and the test can hand it a known
 *  sequence; the shaping is here so there is one answer to what a code looks
 *  like. */
export function codeFrom(bytes) {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += ALPHABET[(bytes[i] ?? 0) % ALPHABET.length];
  }
  return out;
}

/** A code as somebody typed it: upper-cased, with the spaces and dashes people
 *  put into codes when they read them aloud taken out.
 *
 *  A character the alphabet does not contain makes the whole code null rather
 *  than being quietly dropped. Dropping it would turn a code with a typo in it
 *  into a shorter code, which is a different wrong answer arrived at more
 *  slowly. There is nothing to fold: the alphabet has no ambiguous pair in it,
 *  which is the work `ALPHABET` is doing. */
export function cleanCode(v) {
  if (typeof v !== "string") return null;
  const s = v.toUpperCase().replace(/[\s-]+/g, "");
  if (s.length !== CODE_LENGTH) return null;
  return [...s].every((ch) => ALPHABET.includes(ch)) ? s : null;
}

export const clubKey = (id) => `club:${id}`;
export const memberKey = (clubId, playerId) => `member:${clubId}:${playerId}`;
export const memberPrefix = (clubId) => `member:${clubId}:`;
export const clubsKey = (playerId) => `clubs:${playerId}`;
export const codeKey = (code) => `code:${code}`;

/** The player id at the end of a roll key. */
export function memberIdFrom(key) {
  if (typeof key !== "string" || !key.startsWith("member:")) return null;
  const at = key.lastIndexOf(":");
  const id = at > 6 ? key.slice(at + 1) : "";
  return id || null;
}

/** A stored club, read defensively. Storage holds whatever an older version of
 *  this file put there, and a record that has lost its shape must read as
 *  nothing rather than throw inside a request nobody can retry. */
export function readClub(stored) {
  if (!stored || typeof stored !== "object") return null;
  if (typeof stored.id !== "string" || !stored.id) return null;
  const name = cleanClubName(stored.name);
  if (!name) return null;
  return {
    id: stored.id,
    name,
    about: cleanAbout(stored.about),
    listed: stored.listed === true,
    code: typeof stored.code === "string" ? stored.code : "",
    founder: typeof stored.founder === "string" ? stored.founder : "",
    members: Number.isFinite(stored.members) ? Math.max(0, Math.floor(stored.members)) : 0,
    createdAt: Number(stored.createdAt) || 0,
  };
}

/** A stored membership, read defensively. An unknown role reads as `member`:
 *  a row that has lost its shape should leave somebody with less authority
 *  than they had, never more. */
export function readMembership(stored) {
  if (!stored || typeof stored !== "object") return null;
  if (typeof stored.id !== "string" || !stored.id) return null;
  if (typeof stored.club !== "string" || !stored.club) return null;
  return {
    id: stored.id,
    club: stored.club,
    role: ROLES.includes(stored.role) ? stored.role : "member",
    at: Number(stored.at) || 0,
  };
}

/** The list of club ids on a player's record, read defensively and capped. */
export function readMyClubs(stored) {
  if (!Array.isArray(stored)) return [];
  return [...new Set(stored.filter((id) => typeof id === "string" && id !== ""))].slice(0, MAX_CLUBS);
}

/** What anybody may see about a club: its face. The code is never in it — a
 *  code is the key to the front door, and a public face that carried it would
 *  be a door with the key taped to it. */
export function clubFace(club) {
  return {
    id: club.id, name: club.name, about: club.about,
    listed: club.listed, members: club.members, createdAt: club.createdAt,
  };
}

/** May this viewer see that this club exists at all?
 *
 *  A listed club, yes, to anybody. An unlisted one, only to its members: an
 *  answer that told a stranger "that club exists but you may not see it" is
 *  most of what being unlisted was for. The route turns a `false` here into the
 *  same `no-club` a made-up id gets. */
export const maySee = (club, membership) => !!club && (club.listed || !!membership);

/** Found a club. The caller supplies the id, the code and the clock; what is
 *  here is the shape of the record and the one rule that governs it, which is
 *  that the founder is its first member and there are never zero members. */
export function found({ id, name, about, listed, code, founderId, mine, now }) {
  const clean = cleanClubName(name);
  if (!clean) return { error: "bad-club-name" };
  if (readMyClubs(mine).length >= MAX_CLUBS) return { error: "too-many-clubs" };
  const club = {
    id, name: clean, about: cleanAbout(about), listed: listed === true,
    code, founder: founderId, members: 1, createdAt: now,
  };
  return { club, membership: { id: founderId, club: id, role: "founder", at: now } };
}

/** Walk in.
 *
 *  `code` is what the joiner typed, or null. A listed club needs none; an
 *  unlisted one needs the right one. Note what this function does not take: a
 *  founder, an actor, anybody other than the person joining. There is no way
 *  to express "put them in" in this signature, which is the point. */
export function join({ club, membership, mine, playerId, code, now }) {
  if (!club) return { error: "no-club" };
  if (membership) return { error: "already-a-member" };
  if (!club.listed && (!code || code !== club.code)) return { error: "bad-code" };
  if (club.members >= MAX_MEMBERS) return { error: "club-is-full" };
  if (readMyClubs(mine).length >= MAX_CLUBS) return { error: "too-many-clubs" };
  return {
    membership: { id: playerId, club: club.id, role: "member", at: now },
    club: { ...club, members: club.members + 1 },
  };
}

/** Walk out.
 *
 *  A founder may not: a club with no founder has nobody who can close it,
 *  rename it or name a keeper, and it would sit there for good. They hand it
 *  to somebody else first, or they close it. Said in those words by the route,
 *  because "you cannot leave" on its own reads as a bug. */
export function leave({ club, membership }) {
  if (!club || !membership) return { error: "not-a-member" };
  if (membership.role === "founder") return { error: "founder-cannot-leave" };
  return { club: { ...club, members: Math.max(0, club.members - 1) } };
}

/** Name or unname a keeper. Only a founder, and never themselves: a founder who
 *  demoted themselves would be the previous paragraph's problem by another
 *  route. Handing the club over is its own act and not this one. */
export function setRole({ actor, target, role }) {
  if (!actor || !target) return { error: "not-a-member" };
  if (!may(actor.role, "nameKeepers")) return { error: "not-allowed" };
  if (actor.id === target.id) return { error: "not-yourself" };
  if (role !== "keeper" && role !== "member") return { error: "no-such-role" };
  if (target.role === "founder") return { error: "not-allowed" };
  if (target.role === role) return { membership: target, outcome: "unchanged" };
  return { membership: { ...target, role }, outcome: role === "keeper" ? "named" : "unnamed" };
}

/** Show somebody the door.
 *
 *  A keeper may show a member out and nobody else: not the founder, not another
 *  keeper, not themselves. A founder may show out anybody but themselves. The
 *  rule that keepers cannot remove each other is what stops one bad afternoon
 *  from emptying a club. */
export function showTheDoor({ actor, target, club }) {
  if (!actor || !target || !club) return { error: "not-a-member" };
  if (!may(actor.role, "showTheDoor")) return { error: "not-allowed" };
  if (actor.id === target.id) return { error: "not-yourself" };
  if (target.role === "founder") return { error: "not-allowed" };
  if (actor.role === "keeper" && target.role === "keeper") return { error: "not-allowed" };
  return { club: { ...club, members: Math.max(0, club.members - 1) } };
}

/** Change the name, the description, or whether it is listed. A field left out
 *  is left alone; `about` sent empty clears it, because clearing it has to be
 *  possible and an empty description is a real answer. */
export function change({ actor, club, patch }) {
  if (!actor) return { error: "not-a-member" };
  if (!may(actor.role, "changeTheClub")) return { error: "not-allowed" };
  const p = patch && typeof patch === "object" ? patch : {};
  const name = p.name !== undefined ? cleanClubName(p.name) : club.name;
  if (!name) return { error: "bad-club-name" };
  return {
    club: {
      ...club,
      name,
      about: p.about !== undefined ? cleanAbout(p.about) : club.about,
      listed: p.listed !== undefined ? p.listed === true : club.listed,
    },
  };
}

/** The roll, as a screen reads it: founders first, then keepers, then everybody
 *  else, and inside each band the ones who have been here longest first. A club
 *  is a place people arrive at, and the order says who was here when. */
export function roll(members) {
  const rank = (m) => ROLES.indexOf(m.role);
  return [...members].sort((a, b) => {
    const d = rank(a) - rank(b);
    return d || (a.at || 0) - (b.at || 0);
  });
}
