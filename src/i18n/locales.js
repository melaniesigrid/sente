/* ----------------------- LOCALES (the languages, as data) -----------------------
   A language is data, the way a room and a pairing are: an id, the name it calls
   itself, and the BCP-47 tag the browser and Intl speak. Adding one is adding an
   entry here and a catalogue beside it: nothing in a view changes.

   `endonym` is the name in that language, because a language picker is the one
   list a reader may not be able to read: somebody looking for Spanish is looking
   for "Español", not for "Spanish". `name` is the English name, for the places
   that are already speaking English about the set.

   `system` is a pointer at a language rather than a language, exactly like the
   `system` theme: the device says which one, and `resolveLocale` turns it into a
   real id before anything is read.

   `dir` is the direction the script runs in, and it lives on the language
   because it is a fact about the language rather than a decision a view is
   allowed to make. The first eight languages all ran left to right and so
   nothing ever had to say so; Hebrew is what makes the field earn its place.
   Absent means `ltr`, which leaves the eight entries saying what is true of
   them instead of decorating them with a default. */

/** The language everything is authored in, and the floor every lookup lands on. */
export const BASE_LOCALE = "en";

/** Follow the device. A profile ships set to this. */
export const SYSTEM_LOCALE = "system";

export const LOCALES = [
  { id: "en", tag: "en", name: "English", endonym: "English" },
  { id: "es", tag: "es", name: "Spanish", endonym: "Español" },
  { id: "fr", tag: "fr", name: "French", endonym: "Français" },
  { id: "de", tag: "de", name: "German", endonym: "Deutsch" },
  { id: "zh", tag: "zh-Hans", name: "Chinese", endonym: "简体中文" },
  { id: "ja", tag: "ja", name: "Japanese", endonym: "日本語" },
  { id: "ru", tag: "ru", name: "Russian", endonym: "Русский" },
  { id: "uk", tag: "uk", name: "Ukrainian", endonym: "Українська" },
  { id: "he", tag: "he", name: "Hebrew", endonym: "עברית", dir: "rtl" },
];

const byId = new Map(LOCALES.map(l => [l.id, l]));

/** The direction a language runs, for the one place that sets it on the
 *  document. Anything that is not explicitly right-to-left is left-to-right:
 *  a language that forgets the field reads the way eight of nine do. */
export function dirOf(id) {
  return localeOf(id).dir === "rtl" ? "rtl" : "ltr";
}

/* A tag a device may still say for a language we know under another name.
   Hebrew was `iw` until 1989 and Android shipped `iw` for years after; a
   reader whose phone still says it is asking for Hebrew and should be given
   it rather than English. Keyed by the primary subtag, which is all
   `resolveLocale` ever compares. */
const LEGACY_TAGS = new Map([["iw", "he"]]);

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
 *  subtag is matched: a reader who asked for `es-419` wants Spanish, and we do
 *  not ship a Latin American cut to tell them apart from a reader in Madrid.
 *
 *  Chinese is the uncomfortable case of the same rule. We ship one cut, and it
 *  is Simplified, so `zh-TW` and `zh-Hant` land on Simplified characters rather
 *  than on English. That is the better of two wrong answers and not a right one:
 *  a Traditional catalogue is a second entry here whenever somebody writes it. */
export function resolveLocale(id, deviceTags = []) {
  if (id !== SYSTEM_LOCALE) return byId.has(id) ? id : BASE_LOCALE;
  for (const tag of deviceTags) {
    if (typeof tag !== "string") continue;
    const primary = tag.toLowerCase().split("-")[0];
    const match = LEGACY_TAGS.get(primary) || primary;
    if (byId.has(match)) return match;
  }
  return BASE_LOCALE;
}
