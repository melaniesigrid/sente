import { describe, it, expect } from "vitest";
import {
  PALETTES, HOUSE_THEME, DOJO_THEME, SYSTEM_THEME, SYSTEM_PAIR,
  themeOf, themeVars, isDark, isThemeId, resolveTheme, sanitizePalette, paletteFrom, auditPalette,
} from "./index.js";
import { TOKEN_NAMES, TONE_KEYS, REQUIRED_TONES, READING } from "./tokens.js";
import { completeTones, deriveLights, deriveStoneB, deriveAccentInk } from "./derive.js";
import { contrast, isHex, luminance } from "./color.js";

const MINE = { ground: "#101014", ink: "#e6e6ea", accent: "#b98cff", cream: "#f2f2f6" };

describe("the named rooms", () => {
  it("has house first, as the reference room", () => {
    expect(PALETTES[0].id).toBe(HOUSE_THEME);
    expect(HOUSE_THEME).toBe("house");
  });

  it("gives every room a unique id, a name, a mood and a note", () => {
    const ids = PALETTES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(DOJO_THEME);
    expect(ids, "system is a pointer at two rooms, not a room").not.toContain(SYSTEM_THEME);
    for (const p of PALETTES) {
      expect(p.name, p.id).toBeTruthy();
      expect(p.note, p.id).toBeTruthy();
      expect(["Light", "Dark"]).toContain(p.mood);
      for (const key of REQUIRED_TONES) expect(isHex(p[key]), `${p.id}.${key}`).toBe(true);
    }
  });

  it("declares the mood its own ground actually has", () => {
    for (const p of PALETTES) expect(isDark(p) ? "Dark" : "Light", p.id).toBe(p.mood);
  });

  // The dojo shows these live and refuses to save a room that breaks one. If this
  // test and that panel ever disagree, one of them is lying to a designer.
  it("holds every room to every rule in the contract", () => {
    for (const p of PALETTES) {
      for (const row of auditPalette(p)) {
        expect(row.pass, `${p.id}: ${row.label} is ${row.ratio.toFixed(2)}:1 (${row.closeness ? "max" : "min"} ${row.min}) — ${row.why}`).toBe(true);
      }
    }
  });

  it("emits exactly the contract's tokens, for every room", () => {
    for (const p of PALETTES) {
      const vars = themeVars(p.id);
      expect(Object.keys(vars).sort(), p.id).toEqual([...TOKEN_NAMES].sort());
      for (const [k, v] of Object.entries(vars)) expect(String(v).length, `${p.id} ${k}`).toBeGreaterThan(0);
    }
  });

  // Two things have to hold at once on a dark board, and they pull against each
  // other: the stone must stay black rather than turning into grey slate, and its
  // crown must still sit above the wood or the piece disappears into it.
  it("seats a black stone into a dark board without letting it vanish", () => {
    for (const p of PALETTES.filter(isDark)) {
      const stones = deriveStoneB(p.ground);
      expect(luminance(stones[0]), `${p.id} crown above ground`).toBeGreaterThan(luminance(p.ground));
      expect(luminance(stones[1]), `${p.id} stone stays dark`).toBeLessThan(luminance("#4b463c"));
    }
  });

  it("gives a dark room a stronger focus ring than a light one", () => {
    const light = themeVars("house")["--accent-ring"];
    const dark = themeVars("lacquer")["--accent-ring"];
    const alpha = s => Number(s.match(/,([.\d]+)\)$/)[1]);
    expect(alpha(dark)).toBeGreaterThan(alpha(light));
  });

  it("gives a dark room a longer raise, because it has less light to spend", () => {
    expect(themeVars("lacquer")["--raise"]).not.toBe(themeVars("house")["--raise"]);
    expect(themeVars("lacquer")["--raise"]).toContain("10px");
  });
});

describe("resolving a theme id", () => {
  it("falls back to house for anything it does not know", () => {
    for (const bad of ["nope", "", null, undefined, 7, {}]) expect(themeOf(bad).id).toBe("house");
  });

  it("only answers to dojo when there is a dojo palette to answer with", () => {
    expect(themeOf(DOJO_THEME).id).toBe("house");
    expect(themeOf(DOJO_THEME, MINE).id).toBe(DOJO_THEME);
    expect(isThemeId(DOJO_THEME, null)).toBe(false);
    expect(isThemeId(DOJO_THEME, MINE)).toBe(true);
    expect(isThemeId("lacquer")).toBe(true);
    expect(isThemeId("nope")).toBe(false);
  });

  it("emits the same token set for a built room as for a named one", () => {
    expect(Object.keys(themeVars(DOJO_THEME, MINE)).sort()).toEqual([...TOKEN_NAMES].sort());
  });

  it("works out a built room's mood from its ground", () => {
    expect(themeOf(DOJO_THEME, MINE).mood).toBe("Dark");
    expect(themeOf(DOJO_THEME, { ...MINE, ground: "#f3f1ec", ink: "#333029" }).mood).toBe("Light");
  });
});

describe("following the device", () => {
  it("points at house in the light and sumi in the dark", () => {
    expect(resolveTheme(SYSTEM_THEME, false)).toBe("house");
    expect(resolveTheme(SYSTEM_THEME, true)).toBe("sumi");
    expect(SYSTEM_PAIR.light).toBe(HOUSE_THEME);
  });

  it("points at two rooms that actually exist", () => {
    for (const id of Object.values(SYSTEM_PAIR)) {
      expect(PALETTES.some(p => p.id === id), id).toBe(true);
    }
    expect(isDark(themeOf(SYSTEM_PAIR.dark))).toBe(true);
    expect(isDark(themeOf(SYSTEM_PAIR.light))).toBe(false);
  });

  it("leaves every other id alone, whatever the device says", () => {
    for (const id of [...PALETTES.map(p => p.id), DOJO_THEME, "nonsense"]) {
      expect(resolveTheme(id, true), id).toBe(id);
      expect(resolveTheme(id, false), id).toBe(id);
    }
  });

  // The profile ships set to "system", so this is the one id that must be legal
  // before a player has chosen anything or built anything.
  it("is a legal profile value with nothing else stored", () => {
    expect(isThemeId(SYSTEM_THEME)).toBe(true);
    expect(isThemeId(SYSTEM_THEME, null)).toBe(true);
  });

  it("draws as house if it somehow reaches themeOf unresolved, rather than throwing", () => {
    expect(themeOf(SYSTEM_THEME).id).toBe("house");
    expect(() => themeVars(SYSTEM_THEME)).not.toThrow();
  });
});

describe("sanitising a stored palette", () => {
  it("keeps a complete one, lowercased", () => {
    const out = sanitizePalette({ ...MINE, ground: "#101014", accent: "#B98CFF" });
    expect(out.accent).toBe("#b98cff");
    expect(out.ground).toBe("#101014");
  });

  it("refuses anything missing a required tone", () => {
    for (const key of REQUIRED_TONES) {
      const partial = { ...MINE };
      delete partial[key];
      expect(sanitizePalette(partial), key).toBeNull();
    }
  });

  it("refuses anything that is not a palette at all", () => {
    for (const bad of [null, undefined, 7, "house", [], { ...MINE, ink: "red" }]) {
      expect(sanitizePalette(bad), String(bad)).toBeNull();
    }
  });

  it("drops junk keys and keeps the optional tones it recognises", () => {
    const out = sanitizePalette({ ...MINE, light: "#1a1a20", evil: "javascript:alert(1)" });
    expect(out.light).toBe("#1a1a20");
    expect(out).not.toHaveProperty("evil");
  });

  it("keeps a name but not an essay", () => {
    expect(sanitizePalette({ ...MINE, name: "  Night shift  " }).name).toBe("Night shift");
    expect(sanitizePalette({ ...MINE, name: "x".repeat(200) }).name).toHaveLength(40);
    expect(sanitizePalette({ ...MINE, name: 7 })).not.toHaveProperty("name");
  });
});

describe("derivation", () => {
  it("completes a four-colour palette into every tone", () => {
    const t = completeTones(MINE);
    for (const key of TONE_KEYS) expect(isHex(t[key]), key).toBe(true);
  });

  it("throws rather than half-build a palette missing a required tone", () => {
    expect(() => completeTones({ ground: "#101014" })).toThrow();
  });

  it("puts the highlight above the ground and the shadow below it, always", () => {
    for (const ground of ["#e8e4db", "#101014", "#ffffff", "#000000", "#7a7a7a"]) {
      const { light, dark } = deriveLights(ground, "#888888");
      expect(luminance(light), `light over ${ground}`).toBeGreaterThanOrEqual(luminance(ground));
      expect(luminance(dark), `dark under ${ground}`).toBeLessThanOrEqual(luminance(ground));
    }
  });

  // The illusion, stated as arithmetic: derived lights must never wander far
  // enough from the ground to read as a border.
  it("keeps derived lights close enough to the ground to read as light", () => {
    for (const ground of ["#e8e4db", "#ebe0c8", "#e6e9ee", "#101014", "#17140f", "#24262a", "#3a3a3a"]) {
      const { light, dark } = deriveLights(ground, "#e6e6ea");
      expect(contrast(light, ground), `light on ${ground}`).toBeLessThan(2.4);
      expect(contrast(dark, ground), `dark on ${ground}`).toBeLessThan(2.4);
    }
  });

  it("leaves the stones alone on paper", () => {
    expect(deriveStoneB("#e8e4db")).toEqual(["#6b655a", "#4b463c", "#3a362e"]);
  });

  it("hands the dojo a complete palette to start editing from", () => {
    for (const p of PALETTES) {
      const start = paletteFrom(p.id);
      for (const key of TONE_KEYS) expect(isHex(start[key]), `${p.id}.${key}`).toBe(true);
      expect(start.name).toContain(p.name);
      expect(auditPalette(start).every(r => r.pass), p.id).toBe(true);
    }
  });
});

describe("the audit a designer reads", () => {
  it("reports failures first", () => {
    const rows = auditPalette({ ground: "#e8e4db", ink: "#d8d4cb", accent: "#e0ddd4", cream: "#f2ede3" });
    expect(rows[0].pass).toBe(false);
    expect(rows.at(-1).pass).toBe(true);
  });

  it("catches ink nobody could read", () => {
    const rows = auditPalette({ ground: "#e8e4db", ink: "#d8d4cb", accent: "#5f8c7e", cream: "#f2ede3" });
    const ink = rows.find(r => r.id === "ink");
    expect(ink.pass).toBe(false);
    expect(ink.why).toMatch(/AA/);
  });

  it("catches a highlight so far from the ground it has become a border", () => {
    // A mid grey has room to get both wrong: white and black are each a long
    // way from it, and neither reads as a light falling on the surface.
    const rows = auditPalette({ ground: "#7a7a7a", ink: "#0d0d0d", accent: "#0a3f8f", cream: "#f2f2f2", light: "#ffffff", dark: "#000000" });
    expect(rows.find(r => r.id === "close-light").pass).toBe(false);
    expect(rows.find(r => r.id === "close-dark").pass).toBe(false);
  });

  it("passes every named room, which is what makes it a floor and not a wish", () => {
    for (const p of PALETTES) expect(auditPalette(p).filter(r => !r.pass), p.id).toEqual([]);
  });
});

describe("the mark, taken to reading contrast", () => {
  it("clears the body-text floor in every named room, where the raw accent need not", () => {
    for (const p of PALETTES) {
      const vars = themeVars(p.id);
      const ratio = contrast(vars["--accent-ink"], vars["--ground"]);
      expect(ratio, `${p.id}: --accent-ink on --ground`).toBeGreaterThanOrEqual(READING);
    }
  });

  it("clears it for a room somebody built in the dojo too", () => {
    const vars = themeVars(DOJO_THEME, MINE);
    expect(contrast(vars["--accent-ink"], vars["--ground"])).toBeGreaterThanOrEqual(READING);
  });

  it("moves away from the ground, not toward it: darker on paper, lighter on lacquer", () => {
    // The house eucalyptus is short on paper (2.99:1) and has to go down.
    const paper = deriveAccentInk("#5f8c7e", "#e8e4db");
    expect(contrast("#5f8c7e", "#e8e4db")).toBeLessThan(READING);
    expect(luminance(paper)).toBeLessThan(luminance("#5f8c7e"));

    // A deep accent is short on lacquer (2.42:1) and has to come up.
    const lacquer = deriveAccentInk("#3a5a50", "#141414");
    expect(contrast("#3a5a50", "#141414")).toBeLessThan(READING);
    expect(luminance(lacquer)).toBeGreaterThan(luminance("#3a5a50"));
  });

  it("leaves the same accent alone on a ground where it already reads", () => {
    // The eucalyptus that fails on paper passes on lacquer at 4.86:1. Same
    // colour, different room: the derivation spends nothing it does not need to.
    expect(deriveAccentInk("#5f8c7e", "#141414")).toBe("#5f8c7e");
  });

  it("leaves an accent that already reads alone", () => {
    // Near-black on paper is far past the floor; there is nothing to spend.
    const already = deriveAccentInk("#1b1b1b", "#e8e4db");
    expect(already).toBe("#1b1b1b");
  });

  it("is a real colour, and one the stylesheet is allowed to ask for", () => {
    expect(TOKEN_NAMES).toContain("--accent-ink");
    for (const p of PALETTES) expect(isHex(themeVars(p.id)["--accent-ink"]), p.id).toBe(true);
  });
});
