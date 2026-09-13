/* ----------------------- THE DIRECTORY (pure) -----------------------
   How one player finds another by typing their handle.

   Until this file, the only people reachable in Joseki were the hundred on the
   ladder. A club whose members have not played a rated game yet could not find
   each other at all, which is the one thing the server was built for.

   The shape is a small index beside the players:

     find:<term>:<id>

   A term is a folded piece of a handle, and a handle contributes one term for
   the whole of it and one for each word in it. So `Ana Melendez` is written
   three times — `anamelendez`, `ana`, `melendez` — and is found by any of them.
   Searching is then a bounded `list({ prefix })`, which is a walk over the
   matches and never over the players. The ladder already scans; nothing here
   may add a second one.

   Three properties are deliberate and worth keeping.

   **It is a prefix, never a substring.** `list` bounds a range lexicographically
   and that is the only thing storage can do cheaply. It also means the index
   cannot be asked "who has an `e` in their name", which is the question a
   crawler asks.

   **Two characters, at least.** One character would answer with a slice of the
   membership sorted alphabetically, which is a directory of everybody wearing
   a search box.

   **Results are capped and the count is never given.** You get the first twenty
   matches and no total, so the index cannot be used to measure how many people
   are here or how many are named anything in particular. `GET /api/stats`
   publishes the one number that is nobody's business in particular. */

/** How short a search may be. Two, matching the shortest handle `cleanName`
 *  will accept, so every handle here is reachable by typing all of it. */
export const MIN_QUERY = 2;

/** How many matches one search answers with. Twenty is a screen; it is a cap
 *  on the answer and not a page, because a directory you can page through to
 *  the end is a membership list. */
export const MAX_RESULTS = 20;

/** How many terms one handle may contribute. A handle is 18 characters, so
 *  this is only ever reached by somebody spacing out single letters; the cap
 *  is here so one account cannot write an unbounded number of index keys. */
export const MAX_TERMS = 6;

/** A piece of text folded to what it has in common with the way somebody will
 *  type it looking for it: no case, no accents, no punctuation, no spaces.
 *
 *  Accents go because `José` is typed `jose` by anybody without the key for it,
 *  and a directory that insists on the accent is one where half a club cannot
 *  find the other half. Punctuation and spaces go for the same reason and one
 *  more: the separator in the index key has to be a character a folded term can
 *  never contain, and that is only true if the folding says which ones survive
 *  rather than which ones do not. */
export function fold(s) {
  if (typeof s !== "string") return "";
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Every way this handle may be looked up: the whole of it, and each of its
 *  words. De-duplicated, because `Ana` folds to the same term whole and in
 *  part, and a term written twice would answer twice. */
export function terms(name) {
  if (typeof name !== "string") return [];
  const whole = fold(name);
  const found = new Set();
  if (whole) found.add(whole);
  for (const word of name.split(/[\s._·-]+/)) {
    if (found.size >= MAX_TERMS) break;
    const t = fold(word);
    if (t) found.add(t);
  }
  return [...found].slice(0, MAX_TERMS);
}

/** The prefix every key of this index shares. */
export const FIND_PREFIX = "find:";

/** The key one term of one player's handle is written under. The id is last so
 *  that a term shared by two people is two keys under one prefix, and the id
 *  can be read back off the end without storing it twice. */
export const findKey = (term, id) => `${FIND_PREFIX}${term}:${id}`;

/** Every key a player's handle should have. */
export const findKeys = (name, id) => terms(name).map((t) => findKey(t, id));

/** The id in an index key, or null for a key that is not one. Read from the
 *  last colon rather than by splitting: a folded term never contains one, but
 *  reading from the end is true whatever an older version of `fold` allowed. */
export function idFrom(key) {
  if (typeof key !== "string" || !key.startsWith(FIND_PREFIX)) return null;
  const at = key.lastIndexOf(":");
  const id = at > FIND_PREFIX.length - 1 ? key.slice(at + 1) : "";
  return id || null;
}

/** What somebody typed, folded and judged. `null` for anything too short to
 *  ask with, which the route answers as an empty search rather than an error:
 *  a search box is typed into one letter at a time and the first letter is not
 *  a mistake. */
export function query(raw) {
  const q = fold(raw);
  return q.length >= MIN_QUERY ? q : null;
}

/** The ids one page of index keys names, each of them once and in the order
 *  the keys came back. A person matching on two terms is one result. */
export function idsFrom(keys) {
  const seen = new Set();
  for (const key of keys) {
    const id = idFrom(key);
    if (id) seen.add(id);
  }
  return [...seen];
}

/** The matches, closest first.
 *
 *  Three bands, and the reason for them is the club: somebody typing a whole
 *  handle wants that person and not the four people whose handles begin the
 *  same way, and somebody typing the start of one wants the short handles
 *  before the long ones. Inside a band the order is the folded handle, so the
 *  same search always answers in the same order however storage felt. */
export function closest(people, q) {
  const band = (p) => {
    const whole = fold(p.name);
    if (whole === q) return 0;
    if (whole.startsWith(q)) return 1;
    return 2;
  };
  return [...people].sort((a, b) => {
    const d = band(a) - band(b);
    if (d) return d;
    const an = fold(a.name), bn = fold(b.name);
    if (an.length !== bn.length) return an.length - bn.length;
    return an < bn ? -1 : an > bn ? 1 : 0;
  });
}
