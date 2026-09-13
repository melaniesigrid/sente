/* ----------------------- THEMES (the import surface's engine) -----------------------
   Resolving an id to a palette, a palette to custom properties, and untrusted
   stored data to a palette that cannot break the app. Nothing here knows about
   React; the shell spreads what `themeVars` returns onto one element. */
import { PALETTES, HOUSE_THEME, DOJO_THEME, SYSTEM_THEME, SYSTEM_PAIR } from "./palettes.js";
import { tokensFor, completeTones, stonesFor } from "./derive.js";
import { AUTO_STONES, isStoneId, stonesOf } from "./stones.js";
import { TONES, TONE_KEYS, REQUIRED_TONES, RULES, CLOSENESS, STONE_RULE } from "./tokens.js";
import { isHex, contrast, grade, isDarkColor } from "./color.js";

/** What the profile's stored id means on this device right now. `system` is a
 *  pointer at two rooms rather than a room, so it has to be resolved before
 *  anything can be drawn; every other id resolves to itself.
 *
 *  Pure on purpose: the caller reads the media query and hands the answer in, so
 *  this module still knows nothing about a browser. */
export function resolveTheme(id, prefersDark) {
  return id === SYSTEM_THEME ? (prefersDark ? SYSTEM_PAIR.dark : SYSTEM_PAIR.light) : id;
}

/** The palette with this id, or the house palette. Never throws.
 *  `custom` is the profile's dojo palette, offered when the id asks for it. */
export function themeOf(id, custom = null) {
  if (id === DOJO_THEME && custom) return { ...custom, id: DOJO_THEME, name: custom.name || "Your dojo", mood: isDarkColor(custom.ground) ? "Dark" : "Light" };
  return PALETTES.find(p => p.id === id) || PALETTES[0];
}

/** Whether a theme puts the app in a dark room. Derived from the ground, not
 *  declared, so a palette built in the dojo answers the question too. */
export function isDark(theme) {
  return isDarkColor(theme.ground);
}

/** The custom properties `.sente-root` needs. The shell spreads these onto the
 *  root element's style beside the pairing's, so no stylesheet is rewritten and
 *  no class is toggled. */
export function themeVars(id, custom = null, stones = AUTO_STONES) {
  return tokensFor(withStones(themeOf(id, custom), stones));
}

/** A palette with the stones a player asked for. `auto`, and anything
 *  unrecognised, leaves the room's own set alone, which is how a room keeps
 *  being played with the stones it was designed around. */
export function withStones(theme, stones) {
  return stones && stones !== AUTO_STONES && isStoneId(stones) ? { ...theme, stones } : theme;
}

/** The set a room is actually played with, once the player's choice is applied.
 *  The look page names it; nothing else needs to know. */
export function stoneSetOf(id, custom = null, stones = AUTO_STONES) {
  return stonesOf(withStones(themeOf(id, custom), stones).stones);
}

/** Every id the profile may legally hold: a named room, `system`, or `dojo`
 *  once there is a palette for it to mean. */
export function isThemeId(id, custom = null) {
  if (id === SYSTEM_THEME) return true;
  if (id === DOJO_THEME) return !!custom;
  return PALETTES.some(p => p.id === id);
}

/** Stored JSON is untrusted. A dojo palette survives only if every required
 *  tone is a well-formed hex; anything else and there is no dojo palette, which
 *  the profile then falls back from. Returns null rather than a half-palette. */
export function sanitizePalette(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {};
  for (const key of REQUIRED_TONES) {
    if (!isHex(raw[key])) return null;
    out[key] = raw[key].toLowerCase();
  }
  for (const key of TONE_KEYS) {
    if (out[key] || raw[key] === undefined) continue;
    if (isHex(raw[key])) out[key] = raw[key].toLowerCase();
  }
  if (typeof raw.name === "string" && raw.name.trim()) out.name = raw.name.trim().slice(0, 40);
  // The set a built room is played with is part of the room, not part of the
  // player's override: a dojo started from Sumi keeps jade when it is saved.
  if (isStoneId(raw.stones) && raw.stones !== AUTO_STONES) out.stones = raw.stones;
  return out;
}

/** A palette to start editing from: the named room, completed, so the dojo
 *  opens with every slider already holding a real value rather than a blank. */
export function paletteFrom(id) {
  const t = themeOf(id);
  const full = completeTones(t);
  const out = { name: `${t.name}, edited`, stones: full.stones };
  for (const key of TONE_KEYS) out[key] = full[key];
  return out;
}

/** Every rule in the contract, measured against one palette. The dojo prints
 *  these live and the tests assert them; there is one implementation so the
 *  two can never disagree.
 *
 *  Returns [{ id, label, why, ratio, min, pass, grade }], worst first. */
export function auditPalette(palette, stones = AUTO_STONES) {
  const t = completeTones(withStones(palette, stones));
  const rows = RULES.map(r => {
    const ratio = contrast(t[r.a], t[r.b]);
    return { ...r, ratio, pass: ratio >= r.min, grade: grade(ratio) };
  });
  // Measured on the stones this room is actually played with, both of them:
  // the set is a choice now, and a choice that made the two stones hard to tell
  // apart would be the worst thing a player could do to a board.
  const pair = stonesFor(t);
  const cut = contrast(pair.w[1], pair.b[1]);
  rows.push({ ...STONE_RULE, ratio: cut, pass: cut >= STONE_RULE.min, grade: grade(cut) });
  for (const [key, label] of [["light", "Highlight near ground"], ["dark", "Shadow near ground"]]) {
    const ratio = contrast(t[key], t.ground);
    rows.push({
      id: `close-${key}`, label, why: CLOSENESS.why,
      ratio, min: CLOSENESS.max, pass: ratio <= CLOSENESS.max, closeness: true,
      grade: ratio <= CLOSENESS.max ? "body" : "none",
    });
  }
  return rows.sort((a, b) => Number(a.pass) - Number(b.pass));
}

export { PALETTES, HOUSE_THEME, DOJO_THEME, SYSTEM_THEME, SYSTEM_PAIR, TONES, TONE_KEYS, REQUIRED_TONES };
