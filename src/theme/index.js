/* ----------------------- THEME (the import surface) -----------------------
   Views and the shell import from here and nowhere else inside src/theme, the
   same way they import the engine from src/engine/index.js.

     PALETTES        the named rooms, as data
     HOUSE_THEME     "house" — the design system as drawn, and the fallback
     SYSTEM_THEME    "system" — follow the device; a pointer, not a palette
     DOJO_THEME      "dojo" — the one a player built themselves
     resolveTheme    a stored id + prefers-dark -> the id to actually draw
     themeOf         id (+ the player's dojo palette) -> a palette
     themeVars       the custom properties .sente-root needs
     isDark          does this palette put the app in a dark room
     auditPalette    the contrast rules, measured, worst first
     paletteFrom     a named room, completed, ready to edit
     sanitizePalette untrusted stored data -> a palette or null
     TONES           what a palette is authored from, in editing order
     SWATCHES        the drawer the dojo picks from: every tone the rooms use, by role
     STONE_SETS      the stone sets, as data; a room names one, a player overrides it
     stonesOf        a set id -> the set
     stoneSetOf      an id + the player's choice -> the set the board is played with
*/
export {
  PALETTES, HOUSE_THEME, SYSTEM_THEME, SYSTEM_PAIR, DOJO_THEME, TONES, TONE_KEYS, REQUIRED_TONES,
  themeOf, themeVars, isDark, isThemeId, resolveTheme, sanitizePalette, paletteFrom, auditPalette,
} from "./theme.js";
export { contrast, luminance, grade, isHex, isDarkColor, toTriple } from "./color.js";
export { RULES, CLOSENESS, TOKEN_NAMES } from "./tokens.js";
export { stoneSetOf } from "./theme.js";
export { completeTones, tokensFor, deriveLights, deriveStoneB, stonesFor } from "./derive.js";
export {
  STONE_SETS, AUTO_STONES, HOUSE_STONES, stonesOf, isStoneId, cutBlack, cutWhite,
} from "./stones.js";
export { SWATCHES, swatchesFor, isStockTone, roomsNamed } from "./swatches.js";
