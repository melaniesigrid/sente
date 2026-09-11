/* ----------------------- I18N (the import surface) -----------------------
   Views and the shell import from here and nowhere else inside src/i18n, the
   same way they import the engine from src/engine/index.js and the palette from
   src/theme/index.js.

     LOCALES         the languages we ship, as data
     BASE_LOCALE     "en" — what everything is authored in, and the floor
     SYSTEM_LOCALE   "system" — follow the device; a pointer, not a language
     resolveLocale   a stored id + the device's languages -> the id to read in
     localeOf        an id -> the language
     isLocaleId      may a profile hold this id
     makeT           a locale id -> t(key, vars, fallback)
     lineOr          the line for a key, or a given answer when nobody has one
     flatten/keysOf  the catalogue as dotted keys, for the tests

   Nothing here knows about React: the shell reads `navigator.languages` and
   hands the answer in, exactly as it does for prefers-color-scheme. The hook
   that does the reading is `src/components/lang.jsx`.
*/
export {
  LOCALES, BASE_LOCALE, SYSTEM_LOCALE, isLocaleId, localeOf, resolveLocale,
} from "./locales.js";
export { makeT, lineOr, flatten, keysOf, CATALOGUES } from "./catalog.js";
export { interpolate, pluralCategory, isPlural, pickForm } from "./format.js";
