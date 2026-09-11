/* ----------------------- CONTENT, IN ANOTHER LANGUAGE -----------------------
   The screens' own words live in `src/i18n/<locale>/`. The content's words —
   a lesson's prompt, a problem's explanation, a persona's bio — live in the
   data file that owns them, because that file is where they are written,
   reviewed and verified against the engine. A translation stands in front of
   them by id.

   One walker does it for every shape. Given a piece of content and the key it
   sits under, it returns a copy in which every *text* field has been looked up
   in the catalogue, falling back to the English already in the data. A field
   nobody has translated keeps the words the author wrote; a whole file nobody
   has translated is simply still in English, which is the same bargain the
   screens make.

   Only the fields named below are text. Everything else — a point, a setup, a
   verdict, a rank, an id — is data the engine reads, and translating any of it
   would break the lesson rather than the prose. That list is the contract:
   adding a text field to a lesson means adding its name here, and
   `translate.test.js` holds the two in step.

   Paths are dotted, with array indices as segments, so step three's hint is
   `lesson.<id>.steps.2.hint` and the catalogue nests it the way it nests
   everything else. */

/** Every field in the content that is prose rather than data. */
export const TEXT_FIELDS = new Set([
  "title", "subtitle", "plain", "text", "hint", "success", "wrongText",
  "question", "commentary", "line", "analogy", "name", "blurb", "note",
  "label", "prompt", "explain", "tagline", "bio", "theme", "identity",
  "trains", "era", "partial", "heading", "paras", "list", "terms",
  // A persona's table talk: each is a list of lines it might say.
  "greet", "botCapture", "userCapture", "reply", "win", "loss",
  // A chapter of the Classic carries its prose and the lines lifted out of it.
  "sayings", "modern",
]);

/** Fields that name a thing rather than describe it, and are never translated:
 *  a person, a book, a place. Kept out of TEXT_FIELDS by being checked first,
 *  so a shape that carries both can still be walked in one pass. */
const NEVER = new Set(["id", "key", "src", "url", "href"]);

/** A deep copy of `value` with its text fields read from the catalogue.
 *
 *  A text field may be a string or an array of strings — a document's
 *  paragraphs, a chapter's prose — and an array is translated line by line, by
 *  index, so a paragraph that nobody has reached keeps the one the author
 *  wrote while the ones around it move.
 *
 *  `vars` is handed to every lookup. The legal documents are written around a
 *  handful of constants — the product, the studio, the address to write to —
 *  and a translation says them with holes rather than copying them in, so
 *  changing the address changes it in every language at once.
 *
 *  Pure: the reader comes in, nothing here reaches for a language. Returns the
 *  value itself when there is nothing to translate, so a caller can memoise on
 *  identity and a fully-English language does no copying at all. */
export function localize(value, prefix, t, vars = null) {
  if (Array.isArray(value)) {
    let moved = false;
    const out = value.map((v, i) => {
      const next = localize(v, `${prefix}.${i}`, t, vars);
      if (next !== v) moved = true;
      return next;
    });
    return moved ? out : value;
  }
  if (!value || typeof value !== "object") return value;
  let moved = false;
  const out = {};
  for (const [key, v] of Object.entries(value)) {
    if (NEVER.has(key)) { out[key] = v; continue; }
    const path = `${prefix}.${key}`;
    if (TEXT_FIELDS.has(key) && typeof v === "string") {
      const line = t(path, vars, v);
      out[key] = line;
      if (line !== v) moved = true;
    } else if (TEXT_FIELDS.has(key) && Array.isArray(v) && v.every(x => typeof x === "string")) {
      let lineMoved = false;
      const lines = v.map((x, i) => {
        const line = t(`${path}.${i}`, vars, x);
        if (line !== x) lineMoved = true;
        return line;
      });
      out[key] = lineMoved ? lines : v;
      if (lineMoved) moved = true;
    } else {
      const next = localize(v, path, t, vars);
      out[key] = next;
      if (next !== v) moved = true;
    }
  }
  return moved ? out : value;
}

/** One field of one piece of content, without walking the whole of it. For the
 *  places that show a lesson's title on a card and never open it. */
export function field(item, prefix, name, t, vars = null) {
  return t(`${prefix}.${name}`, vars, item[name]);
}

/** The key a lesson's words sit under. */
export const lessonKey = (lesson) => `lesson.${lesson.id}`;

/** A lesson in the language in force. */
export const localizeLesson = (lesson, t) => localize(lesson, lessonKey(lesson), t);

/** One field of a lesson — its title on a card, say. */
export const lessonField = (lesson, name, t) => field(lesson, lessonKey(lesson), name, t);
