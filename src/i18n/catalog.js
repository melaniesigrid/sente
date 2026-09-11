/* ----------------------- THE CATALOGUE -----------------------
   A catalogue is a nested object of lines, authored per language and flattened
   here to dotted keys. Nesting is for the author — a screen's lines sit together
   and diff together; dotted keys are for the caller, because `t("nav.play")` is
   the whole API and a view should never index into an object it can typo.

   Three rules hold the thing up:

   1. English is the floor. A key missing from a translation falls through to
      English rather than disappearing, so a half-finished language is a page
      with some English on it and never a page with holes in it.
   2. A missing key is loud in development and quiet in production. It returns
      the key itself — visible in a screenshot, harmless to a player — and warns
      once, never on every render.
   3. Nothing here throws. A catalogue is data and data is sometimes wrong; a
      wrong line must not take the screen down with it. */
import { BASE_LOCALE, localeOf } from "./locales.js";
import { interpolate, isPlural, pickForm } from "./format.js";
import { en } from "./en.js";
import { es } from "./es.js";

/** The catalogues we ship, by locale id. A language in LOCALES with no
 *  catalogue here is a language that reads entirely in English, which the
 *  parity test refuses to let happen. */
export const CATALOGUES = { en, es };

/** A nested catalogue as a flat map of dotted key -> line (or plural set).
 *  Pure, and the same function the parity test compares two languages with. */
export function flatten(tree, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string" || isPlural(value)) out.set(path, value);
    else if (value && typeof value === "object") flatten(value, path, out);
  }
  return out;
}

const flat = new Map(Object.entries(CATALOGUES).map(([id, tree]) => [id, flatten(tree)]));

/** Every key the app is authored against. */
export function keysOf(id) {
  return [...(flat.get(id) || flat.get(BASE_LOCALE)).keys()].sort();
}

const warned = new Set();
function missing(key) {
  if (import.meta.env && import.meta.env.PROD) return;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`joseki: no line for "${key}"`);
}

/** The reader for one language: `t(key, vars, fallback)`.
 *
 *  `vars.count` selects the form when the entry is a plural set, and is also
 *  available to fill a `{count}` hole, which is what it is wanted for nearly
 *  every time.
 *
 *  `fallback` is for a line that still lives in a data file — a room's note, a
 *  pairing's credit — on its way into the catalogue. It is used only when the
 *  key is in neither this language nor English, so moving the prose in later is
 *  a catalogue edit and not a second change at the call site. */
export function makeT(id) {
  const locale = localeOf(id);
  const own = flat.get(locale.id);
  const base = flat.get(BASE_LOCALE);
  return function t(key, vars, fallback) {
    let entry = own && own.get(key);
    if (entry === undefined) entry = base.get(key);
    if (entry === undefined) {
      if (typeof fallback === "string") return interpolate(fallback, vars);
      missing(key);
      return key;
    }
    const line = isPlural(entry)
      ? pickForm(entry, locale.tag, vars && typeof vars.count === "number" ? vars.count : 0)
      : entry;
    return interpolate(line, vars);
  };
}
