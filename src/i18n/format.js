/* ----------------------- FORMAT (a line, filled in) -----------------------
   Two things happen to a catalogue entry between the file and the screen: the
   holes get filled, and — if the entry is a set of plural forms rather than one
   string — the right form gets picked. Both are pure, and neither ever throws:
   a line with a hole nobody filled comes out with the hole still in it, which is
   a visible bug in a screenshot rather than a crash in front of a player. */

const HOLE = /\{(\w+)\}/g;

/** `"{n} moves"` + `{ n: 3 }` -> `"3 moves"`. A name with no value keeps its
 *  braces, so the gap is obvious the first time anybody looks at the screen. */
export function interpolate(line, vars) {
  if (!vars || typeof line !== "string") return line;
  return line.replace(HOLE, (whole, name) =>
    Object.hasOwn(vars, name) && vars[name] !== undefined && vars[name] !== null
      ? String(vars[name])
      : whole);
}

/** The plural category `count` falls into for this language, per CLDR.
 *  English has two, Spanish has two, French has three (`one` covers 0 and 1,
 *  and `many` catches the millions) — which is exactly why the catalogue names
 *  the categories instead of holding a singular and a plural. */
export function pluralCategory(tag, count) {
  try {
    return new Intl.PluralRules(tag).select(count);
  } catch {
    return count === 1 ? "one" : "other";
  }
}

/** Is this entry a set of plural forms rather than one line? */
export function isPlural(entry) {
  return !!entry && typeof entry === "object" && !Array.isArray(entry) && typeof entry.other === "string";
}

/** One form out of a plural entry: the category this count falls into, or
 *  `other`, which every language is required to author. */
export function pickForm(entry, tag, count) {
  const category = pluralCategory(tag, count);
  return typeof entry[category] === "string" ? entry[category] : entry.other;
}
