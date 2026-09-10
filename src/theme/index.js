/* ----------------------- THEME (the import surface) -----------------------
   Views and the shell import from here and nowhere else inside src/theme, the
   same way they import the engine from src/engine/index.js.

     PALETTES        the named rooms, as data
     DEFAULT_THEME   "house" — the design system as drawn
     DOJO_THEME      "dojo" — the one a player built themselves
     themeOf         id (+ the player's dojo palette) -> a palette
     themeVars       the custom properties .sente-root needs
     isDark          does this palette put the app in a dark room
     auditPalette    the contrast rules, measured, worst first
     paletteFrom     a named room, completed, ready to edit
     sanitizePalette untrusted stored data -> a palette or null
     TONES           what a palette is authored from, in editing order
*/
export {
  PALETTES, DEFAULT_THEME, DOJO_THEME, TONES, TONE_KEYS, REQUIRED_TONES,
  themeOf, themeVars, isDark, isThemeId, sanitizePalette, paletteFrom, auditPalette,
} from "./theme.js";
export { contrast, luminance, grade, isHex, isDarkColor, toTriple } from "./color.js";
export { RULES, CLOSENESS, TOKEN_NAMES } from "./tokens.js";
export { completeTones, tokensFor, deriveLights, deriveStoneB } from "./derive.js";
