import { describe, it, expect } from "vitest";
import { THEMES, DEFAULT_THEME, themeOf, themeVars, isDark } from "./theme.js";

/** #rrggbb -> relative luminance, so a theme's contrast can be checked rather
 *  than eyeballed. */
function lum(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("themes", () => {
  it("has a house theme as the default, first in the list", () => {
    expect(THEMES[0].id).toBe(DEFAULT_THEME);
    expect(DEFAULT_THEME).toBe("house");
  });

  it("gives every theme a unique id and a complete palette", () => {
    const ids = THEMES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of THEMES) {
      expect(t.name).toBeTruthy();
      expect(t.note).toBeTruthy();
      expect(["Light", "Dark"]).toContain(t.mood);
      for (const key of ["ground", "light", "dark", "ink", "cream", "danger"]) {
        expect(t[key], `${t.id}.${key}`).toMatch(/^#[0-9a-f]{6}$/);
      }
      for (const key of ["accent", "shInk", "shLite"]) {
        expect(t[key], `${t.id}.${key}`).toMatch(/^\d{1,3},\d{1,3},\d{1,3}$/);
      }
    }
  });

  it("keeps text legible on its own ground", () => {
    for (const t of THEMES) {
      expect(ratio(t.ink, t.ground), `${t.id} ink on ground`).toBeGreaterThan(7);
    }
  });

  // The house eucalyptus on house paper sits at 2.99:1 — under AA for body text,
  // which is why the accent is never body text, only a mark. It is the palette as
  // drawn and it sets the floor; no other room is allowed to be dimmer than it.
  it("keeps every accent at least as legible as the house one", () => {
    const hex = t => "#" + t.accent.split(",").map(n => (+n).toString(16).padStart(2, "0")).join("");
    const floor = ratio(hex(THEMES[0]), THEMES[0].ground);
    expect(floor).toBeGreaterThan(2.9);
    for (const t of THEMES) {
      expect(ratio(hex(t), t.ground), `${t.id} accent on ground`).toBeGreaterThanOrEqual(floor - 0.01);
    }
  });

  it("keeps the highlight and the shadow close to the ground, which is the illusion", () => {
    for (const t of THEMES) {
      expect(ratio(t.light, t.ground), `${t.id} light`).toBeLessThan(2.4);
      expect(ratio(t.dark, t.ground), `${t.id} dark`).toBeLessThan(2.4);
      // and on the right side of it
      expect(lum(t.light)).toBeGreaterThan(lum(t.ground));
      expect(lum(t.dark)).toBeLessThan(lum(t.ground));
    }
  });

  it("calls a theme dark exactly when its ground is darker than its ink", () => {
    for (const t of THEMES) {
      expect(isDark(t)).toBe(lum(t.ground) < lum(t.ink));
    }
  });

  it("falls back to the house theme for an unknown id", () => {
    expect(themeOf("no-such-theme").id).toBe("house");
    expect(themeOf(undefined).id).toBe("house");
    expect(themeOf(null).id).toBe("house");
  });

  it("emits the same set of custom properties for every theme", () => {
    const keys = Object.keys(themeVars("house")).sort();
    expect(keys).toContain("--ground");
    expect(keys).toContain("--accent-rgb");
    expect(keys).toContain("--stone-b-1");
    for (const t of THEMES) {
      expect(Object.keys(themeVars(t.id)).sort(), t.id).toEqual(keys);
      for (const v of Object.values(themeVars(t.id))) expect(v).toBeTruthy();
    }
  });

  it("gives the dark themes a lifted black stone so it reads against the board", () => {
    for (const t of THEMES.filter(isDark)) {
      const v = themeVars(t.id);
      expect(lum(v["--stone-b-1"]), `${t.id} stone crown`).toBeGreaterThan(lum(t.ground));
    }
  });
});
