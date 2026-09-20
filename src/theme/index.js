/* ----------------------- THEME (the import surface) -----------------------
   Views and the shell import from here and nowhere else inside src/theme, the
   same way they import the engine from src/engine/index.js.

     PALETTES        the three rooms, as data
     BOARD           the wood, one colour, the same in every room
     HOUSE_THEME     "tatami": the design system as drawn, and the fallback
     REVIEW_THEME    "kifu": the room a finished game is read in
     CHOOSABLE_ROOMS the rooms a profile may hold: PALETTES minus the review room
     migrateThemeId  a stored id from an older set of rooms -> a room that exists
     SYSTEM_THEME    "system": follow the device; a pointer, not a palette
     DOJO_THEME      "dojo": the one a player built themselves
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
  PALETTES, CHOOSABLE_ROOMS, HOUSE_THEME, REVIEW_THEME, SYSTEM_THEME, SYSTEM_PAIR, DOJO_THEME,
  TONES, TONE_KEYS, REQUIRED_TONES, migrateThemeId,
  themeOf, themeVars, isDark, isThemeId, resolveTheme, sanitizePalette, paletteFrom, auditPalette,
} from "./theme.js";
export { contrast, luminance, grade, isHex, isDarkColor, toTriple } from "./color.js";
export { RULES, CLOSENESS, TOKEN_NAMES, BOARD_RULES, BOARD, PREVIEW_PX } from "./tokens.js";
export { stoneSetOf, withStones } from "./theme.js";
export { completeTones, tokensFor, deriveLights, deriveBoard, boardFor, stonesFor } from "./derive.js";
export {
  STONE_SETS, AUTO_STONES, HOUSE_STONES, stonesOf, isStoneId, cutBlack, cutWhite,
} from "./stones.js";
export { SWATCHES, swatchesFor, isStockTone, roomsNamed } from "./swatches.js";
