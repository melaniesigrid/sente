import { describe, it, expect } from "vitest";
import {
  PALETTES, BOARD, HOUSE_THEME, REVIEW_THEME, DOJO_THEME, SYSTEM_THEME, SYSTEM_PAIR,
  themeOf, themeVars, isDark, isThemeId, resolveTheme, sanitizePalette, paletteFrom, auditPalette,
  migrateThemeId,
} from "./index.js";
import { TOKEN_NAMES, TONE_KEYS, REQUIRED_TONES, READING } from "./tokens.js";
import { completeTones, deriveLights, deriveAccentInk, boardFor } from "./derive.js";
import { stonesOf, cutBlack, cutWhite } from "./stones.js";
import { contrast, isHex, luminance } from "./color.js";

const MINE = { ground: "#101014", ink: "#e6e6ea", accent: "#b98cff", cream: "#f2f2f6" };

describe("the named rooms", () => {
  it("ships three rooms and no more, with tatami first as the reference", () => {
    expect(PALETTES.map(p => p.id)).toEqual(["tatami", "night", "kifu"]);
    expect(PALETTES[0].id).toBe(HOUSE_THEME);
    expect(HOUSE_THEME).toBe("tatami");
    expect(REVIEW_THEME).toBe("kifu");
  });

  it("gives every room a unique id, a name, a mood and a note", () => {
    const ids = PALETTES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(DOJO_THEME);
    expect(ids, "system is a pointer at two rooms, not a room").not.toContain(SYSTEM_THEME);
    for (const p of PALETTES) {
      expect(p.name, p.id).toBeTruthy();
      expect(p.note, p.id).toBeTruthy();
      expect(["Light", "Dark", "Review"]).toContain(p.mood);
      for (const key of REQUIRED_TONES) expect(isHex(p[key]), `${p.id}.${key}`).toBe(true);
    }
  });

  /* Two of the three moods are the room's own ground read back. The third is
     not a brightness at all: Kifu is the room review mode brings with it, and
     what a reader needs to know about it is when it turns up, not how light it
     is. It is still held to being a light room, because it is a printed page. */
  it("declares the mood its own ground actually has, and Review is a light room", () => {
    for (const p of PALETTES) {
      if (p.mood === "Review") expect(isDark(p), p.id).toBe(false);
      else expect(isDark(p) ? "Dark" : "Light", p.id).toBe(p.mood);
    }
  });

  // The dojo shows these live and refuses to save a room that breaks one. If this
  // test and that panel ever disagree, one of them is lying to a designer.
  it("holds every room to every rule in the contract", () => {
    for (const p of PALETTES) {
      for (const row of auditPalette(p)) {
        expect(row.pass, `${p.id}: ${row.label} is ${row.ratio.toFixed(2)}:1 (${row.closeness ? "max" : "min"} ${row.min}): ${row.why}`).toBe(true);
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

  // The board is an object, not a surface of the page: one slab of wood, the
  // same in every room that has a board, and never the ground. A room that drew
  // its own board out of its own ground moved the goban every time the light
  // changed. The printed room is the exception that proves it: a kifu has no
  // board, so its diagram is drawn on its own page.
  it("plays every table room on the one board, which is never the page", () => {
    for (const p of PALETTES.filter(p => !p.print)) {
      const vars = themeVars(p.id);
      expect(vars["--board"], `${p.id} board`).toBe(BOARD);
      expect(vars["--board"], `${p.id} board is not its page`).not.toBe(vars["--ground"]);
      expect(vars["--grid-alpha"], `${p.id} draws its grid quiet on the wood`).not.toBe("1");
    }
    expect(themeVars(DOJO_THEME, MINE)["--board"], "a room built in the dojo plays on it too").toBe(BOARD);
  });

  it("prints the review room on its page, in a hairline of its ink", () => {
    const kifu = PALETTES.find(p => p.id === REVIEW_THEME);
    expect(kifu.print, "review is the printed room").toBe(true);
    const vars = themeVars(REVIEW_THEME);
    expect(vars["--board"]).toBe(vars["--ground"]);
    expect(vars["--grid"]).toBe(vars["--ink"]);
    expect(vars["--grid-alpha"]).toBe("1");
    expect(PALETTES.filter(p => p.print).map(p => p.id), "and it is the only one").toEqual([REVIEW_THEME]);
  });

  /* The mark arrives as a colour, not only as three numbers to build one from.
     A custom property resolves where it is declared, so a single
     `--accent: rgb(var(--accent-rgb))` in the stylesheet is the ROOT's accent
     everywhere it is read, including on a plate or a review sheet carrying its
     own tokens. That is how every room's plate on the look page came to wear
     one mark: the plate set --accent-rgb and nothing read it. */
  it("hands every room its mark as a colour of its own", () => {
    const seen = new Set();
    for (const p of PALETTES) {
      const vars = themeVars(p.id);
      expect(vars["--accent"], p.id).toBe(`rgb(${vars["--accent-rgb"]})`);
      seen.add(vars["--accent"]);
    }
    expect(seen.size, "and no two rooms are marked the same").toBe(PALETTES.length);
    expect(themeVars(DOJO_THEME, MINE)["--accent"], "a built room too")
      .toBe(`rgb(${themeVars(DOJO_THEME, MINE)["--accent-rgb"]})`);
  });

  it("gives a dark room a stronger focus ring than a light one", () => {
    const light = themeVars("tatami")["--accent-ring"];
    const dark = themeVars("night")["--accent-ring"];
    const alpha = s => Number(s.match(/,([.\d]+)\)$/)[1]);
    expect(alpha(dark)).toBeGreaterThan(alpha(light));
  });

  it("gives a dark room a longer raise, because it has less light to spend", () => {
    expect(themeVars("night")["--raise"]).not.toBe(themeVars("tatami")["--raise"]);
    expect(themeVars("night")["--raise"]).toContain("10px");
  });
});

describe("resolving a theme id", () => {
  it("falls back to house for anything it does not know", () => {
    for (const bad of ["nope", "", null, undefined, 7, {}]) expect(themeOf(bad).id).toBe(HOUSE_THEME);
  });

  it("only answers to dojo when there is a dojo palette to answer with", () => {
    expect(themeOf(DOJO_THEME).id).toBe(HOUSE_THEME);
    expect(themeOf(DOJO_THEME, MINE).id).toBe(DOJO_THEME);
    expect(isThemeId(DOJO_THEME, null)).toBe(false);
    expect(isThemeId(DOJO_THEME, MINE)).toBe(true);
    expect(isThemeId("night")).toBe(true);
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

/* Ten rooms became three on 2026-09-15. A stored id from before that is a
   preference somebody set, and it is carried forward rather than dropped: the
   profile store asks this before it validates, so nobody who chose a dark room
   is handed a light one for having chosen the wrong dark room. */
describe("carrying an older room forward", () => {
  it("sends every retired room to a room that exists", () => {
    for (const old of ["kaya", "porcelain", "damson", "cinnabar", "gilt",
      "lacquer", "graphite", "yohen", "prism", "foxfire"]) {
      expect(isThemeId(migrateThemeId(old)), old).toBe(true);
    }
  });

  it("keeps a dark room dark and a light room light", () => {
    for (const old of ["kaya", "porcelain", "damson", "cinnabar", "gilt"]) {
      expect(isDark(themeOf(migrateThemeId(old))), old).toBe(false);
    }
    for (const old of ["lacquer", "graphite", "yohen", "prism", "foxfire"]) {
      expect(isDark(themeOf(migrateThemeId(old))), old).toBe(true);
    }
  });

  it("sends the two rooms the device used to pick back to following the device", () => {
    expect(migrateThemeId("house")).toBe(SYSTEM_THEME);
    expect(migrateThemeId("sumi")).toBe(SYSTEM_THEME);
  });

  it("leaves a current id, system, dojo and nonsense alone", () => {
    for (const id of [...PALETTES.map(p => p.id), SYSTEM_THEME, DOJO_THEME, "nonsense", 7, null]) {
      expect(migrateThemeId(id), String(id)).toBe(id);
    }
  });
});

describe("following the device", () => {
  it("points at tatami in the light and night in the dark", () => {
    expect(resolveTheme(SYSTEM_THEME, false)).toBe("tatami");
    expect(resolveTheme(SYSTEM_THEME, true)).toBe("night");
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

  it("draws as tatami if it somehow reaches themeOf unresolved, rather than throwing", () => {
    expect(themeOf(SYSTEM_THEME).id).toBe(HOUSE_THEME);
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

  // What a stone is cut from, and how the board under it is found, is the
  // subject of stones.test.js: there is a drawer of sets to hold to it now
  // rather than one pair. What belongs here is that every room hands the board
  // a set to be played with.
  it("draws every table room with the set that room names", () => {
    // The printed room names a set for its plate and prints in ink regardless;
    // stones.test.js holds that side.
    for (const p of PALETTES.filter(p => !p.print)) {
      const set = stonesOf(p.stones);
      expect(themeVars(p.id)["--stone-b-2"], p.id).toBe(cutBlack(set.b)[1]);
      expect(themeVars(p.id)["--stone-w-2"], p.id).toBe(cutWhite(set.w)[1]);
    }
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

/* ----------------------- THE PRINTED ROOM -----------------------
   Kifu is the one room without a board. The flag is `print`; derive.js reads
   it and answers with the page wherever a table room would answer with the
   wood, and the audit measures the black stone against that page. */
describe("the printed room", () => {
  const named = (id) => PALETTES.find(p => p.id === id);

  it("carries print as a flag, false unless a room says so", () => {
    expect(completeTones(named("tatami")).print).toBe(false);
    expect(completeTones(named(REVIEW_THEME)).print).toBe(true);
    expect(completeTones({ ...MINE, print: "yes" }).print, "a flag, not whatever was stored").toBe(true);
  });

  it("answers the wood for a table and the page for a print, from one place", () => {
    expect(boardFor(completeTones(named("tatami")))).toBe(BOARD);
    const print = completeTones(named(REVIEW_THEME));
    expect(boardFor(print)).toBe(print.ground);
    expect(boardFor(completeTones({ ...MINE, print: true })), "a room built in the dojo may be printed too").toBe(MINE.ground);
  });

  it("measures the black stone against the page there, and the stone is the ink", () => {
    const kifu = named(REVIEW_THEME);
    const row = auditPalette(kifu).find(r => r.id === "board-b");
    expect(row.ratio).toBeCloseTo(contrast(kifu.ink, kifu.ground), 6);
    expect(row.pass).toBe(true);
  });

  it("plays both table rooms with the one pair the game screen was drawn with", () => {
    const table = PALETTES.filter(p => !p.print).map(p => p.stones);
    expect(table.length, "a morning table and a night one").toBe(2);
    expect(new Set(table).size, "the same set on both").toBe(1);
    expect(table[0]).toBe("ebony");
  });
});
