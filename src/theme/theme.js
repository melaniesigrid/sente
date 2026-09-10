/* ----------------------- THEMES (the import surface's engine) -----------------------
   Resolving an id to a palette, a palette to custom properties, and untrusted
   stored data to a palette that cannot break the app. Nothing here knows about
   React; the shell spreads what `themeVars` returns onto one element. */
import { PALETTES, DEFAULT_THEME, DOJO_THEME } from "./palettes.js";
import { tokensFor, completeTones, deriveStoneB } from "./derive.js";
import { TONES, TONE_KEYS, REQUIRED_TONES, RULES, CLOSENESS, STONE_RULE } from "./tokens.js";
import { isHex, contrast, grade, isDarkColor } from "./color.js";

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
export function themeVars(id, custom = null) {
  return tokensFor(themeOf(id, custom));
}

/** Every id the profile may legally hold. */
export function isThemeId(id, custom = null) {
  return id === DOJO_THEME ? !!custom : PALETTES.some(p => p.id === id);
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
  return out;
}

/** A palette to start editing from: the named room, completed, so the dojo
 *  opens with every slider already holding a real value rather than a blank. */
export function paletteFrom(id) {
  const t = themeOf(id);
  const full = completeTones(t);
  const out = { name: `${t.name}, edited` };
  for (const key of TONE_KEYS) out[key] = full[key];
  return out;
}

/** Every rule in the contract, measured against one palette. The dojo prints
 *  these live and the tests assert them; there is one implementation so the
 *  two can never disagree.
 *
 *  Returns [{ id, label, why, ratio, min, pass, grade }], worst first. */
export function auditPalette(palette) {
  const t = completeTones(palette);
  const rows = RULES.map(r => {
    const ratio = contrast(t[r.a], t[r.b]);
    return { ...r, ratio, pass: ratio >= r.min, grade: grade(ratio) };
  });
  const slate = (t.stoneB || deriveStoneB(t.ground))[1];
  const stones = contrast(t.cream, slate);
  rows.push({ ...STONE_RULE, ratio: stones, pass: stones >= STONE_RULE.min, grade: grade(stones) });
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

export { PALETTES, DEFAULT_THEME, DOJO_THEME, TONES, TONE_KEYS, REQUIRED_TONES };
