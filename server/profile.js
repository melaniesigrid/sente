/* ----------------------- PROFILE (pure) -----------------------
   What a player may say about themselves, and how much of it. Pure so the
   limits live in one readable place rather than scattered through a form and
   a Durable Object that disagree with each other.

   The shape is deliberately small. A profile here is not a social network
   page: it is the few things one player wants to know about another before
   sitting down — how long they have been at this, where they play, what they
   like to play. Four fields, all optional, none of them a status update. */

/** The one paragraph. Long enough for a real sentence or three, short enough
 *  that nobody writes an essay nobody reads. */
export const BIO_MAX = 280;

/** The short facts, each with the length it is allowed and the question it is
 *  really answering. The view renders from this, so a field added here appears
 *  in the form and is accepted by the server in the same commit. */
export const FACTS = [
  { key: "home", max: 40, label: "Where you play", hint: "A club, a city, a kitchen table" },
  { key: "since", max: 4, label: "Playing since", hint: "A year", numeric: true },
  { key: "likes", max: 48, label: "What you like to play", hint: "An opening, a shape, a way of losing" },
];


/** Strip the characters that would let one player's line break another's
 *  layout or smuggle a control code into a log. A newline, a return or a tab
 *  becomes a space — somebody pasting two lines into a one-line field means a
 *  gap, not two words run together — and every other control character is
 *  dropped. The paragraph is the bio; these are single lines. */
function oneLine(v, max) {
  if (typeof v !== "string") return "";
  return Array.from(v)
    .map(ch => {
      const c = ch.codePointAt(0);
      if (c === 10 || c === 13 || c === 9) return " ";
      return c > 31 && c !== 127 ? ch : "";
    })
    .join("").replace(/\s+/g, " ").trim().slice(0, max);
}

/** The bio keeps its paragraph breaks — at most one blank line between them,
 *  so nobody can push the rest of a page off the screen with returns. */
export function cleanBio(v) {
  if (typeof v !== "string") return "";
  const kept = Array.from(v)
    .filter(ch => { const c = ch.codePointAt(0); return c > 31 || ch === "\n"; })
    .join("");
  return kept.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, BIO_MAX);
}

/** A year, as a string, or "". Nothing before go was written down and nothing
 *  in the future; a player who mistypes gets the field back empty rather than
 *  a profile claiming they started in the year 20. */
export function cleanYear(v, now = new Date().getFullYear()) {
  const s = oneLine(String(v ?? ""), 4);
  if (!/^\d{4}$/.test(s)) return "";
  const n = Number(s);
  return n >= 1900 && n <= now ? s : "";
}

/** The facts, cleaned field by field. Unknown keys are dropped rather than
 *  stored: the set of things a profile says is decided here, not by a caller. */
export function cleanFacts(v, now = new Date().getFullYear()) {
  const out = {};
  if (!v || typeof v !== "object") return out;
  for (const { key, max, numeric } of FACTS) {
    const cleaned = numeric ? cleanYear(v[key], now) : oneLine(v[key], max);
    if (cleaned) out[key] = cleaned;
  }
  return out;
}

/* ----- the picture -----
   Kept small on purpose. It is shown at 52 px in the lobby and 96 px on a
   profile, so anything bigger is bytes nobody sees, paid for on a phone. The
   browser resizes before it uploads (`src/net/avatar.js`); this is the wall
   that holds when the browser is not ours. */

export const AVATAR_MAX_BYTES = 64 * 1024;
export const AVATAR_TYPES = ["image/webp", "image/jpeg", "image/png"];

/** Refuse a picture that is not one, or is too big to be the one we asked for.
 *  Returns a reason, or null when it may be stored. */
export function avatarProblem(type, bytes) {
  if (!AVATAR_TYPES.includes(type)) return "bad-image-type";
  if (!Number.isInteger(bytes) || bytes <= 0) return "bad-image";
  if (bytes > AVATAR_MAX_BYTES) return "image-too-big";
  return null;
}

/** Everything a stranger may see about a player: the ladder's view plus the
 *  four things they chose to say. `avatarAt` is when the picture last changed,
 *  which is also what makes its URL cacheable forever and still current. */
export function profileOf(player, base) {
  return {
    ...base,
    bio: player.bio ?? "",
    facts: player.facts ?? {},
    avatarAt: player.avatarAt ?? null,
  };
}
