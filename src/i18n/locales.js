/* ----------------------- LOCALES (the languages, as data) -----------------------
   A language is data, the way a room and a pairing are: an id, the name it calls
   itself, and the BCP-47 tag the browser and Intl speak. Adding one is adding an
   entry here and a catalogue beside it — nothing in a view changes.

   `endonym` is the name in that language, because a language picker is the one
   list a reader may not be able to read: somebody looking for Spanish is looking
   for "Español", not for "Spanish". `name` is the English name, for the places
   that are already speaking English about the set.

   `system` is a pointer at a language rather than a language, exactly like the
   `system` theme: the device says which one, and `resolveLocale` turns it into a
   real id before anything is read. */

/** The language everything is authored in, and the floor every lookup lands on. */
export const BASE_LOCALE = "en";

/** Follow the device. A profile ships set to this. */
export const SYSTEM_LOCALE = "system";

export const LOCALES = [
  { id: "en", tag: "en", name: "English", endonym: "English" },
  { id: "es", tag: "es", name: "Spanish", endonym: "Español" },
];

const byId = new Map(LOCALES.map(l => [l.id, l]));

/** Every id a profile may legally hold: a language we ship, or `system`. */
export function isLocaleId(id) {
  return id === SYSTEM_LOCALE || byId.has(id);
}

/** The locale with this id, or the base locale. Never throws. */
export function localeOf(id) {
  return byId.get(id) || byId.get(BASE_LOCALE);
}

/** What the profile's stored id means on this device right now.
 *
 *  Pure on purpose, like `resolveTheme`: the caller reads `navigator.languages`
 *  and hands the list in, so this module still knows nothing about a browser.
 *  The device is asked in its own order of preference, and only the primary
 *  subtag is matched — a reader who asked for `es-419` wants Spanish, and we do
 *  not ship a Latin American cut to tell them apart from a reader in Madrid. */
export function resolveLocale(id, deviceTags = []) {
  if (id !== SYSTEM_LOCALE) return byId.has(id) ? id : BASE_LOCALE;
  for (const tag of deviceTags) {
    if (typeof tag !== "string") continue;
    const primary = tag.toLowerCase().split("-")[0];
    if (byId.has(primary)) return primary;
  }
  return BASE_LOCALE;
}
