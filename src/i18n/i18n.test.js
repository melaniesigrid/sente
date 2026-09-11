import { describe, it, expect } from "vitest";
import { PALETTES, STONE_SETS } from "../theme/index.js";
import { TYPEFACES } from "../content/typeface.js";
import { BELTS } from "../content/rank.js";
import {
  BASE_LOCALE, SYSTEM_LOCALE, LOCALES, CATALOGUES, isLocaleId, localeOf, resolveLocale,
  makeT, flatten, interpolate, pluralCategory,
} from "./index.js";

/* The three namespaces whose English lives in the data file that owns the
   thing, not in en.js. A translation overlays them by id, so they are checked
   against the data below rather than against English. */
const OVERLAYS = ["room.", "stones.", "type.", "belt."];
const isOverlay = (key) => OVERLAYS.some(p => key.startsWith(p));
const others = LOCALES.filter(l => l.id !== BASE_LOCALE);
const HOLE = /\{(\w+)\}/g;
const holesIn = (line) => new Set([...String(line).matchAll(HOLE)].map(m => m[1]));
const lines = (entry) => (typeof entry === "string" ? [entry] : Object.values(entry));

describe("locales", () => {
  it("ships a catalogue for every language it offers", () => {
    for (const l of LOCALES) expect(CATALOGUES[l.id], l.id).toBeTruthy();
  });

  it("accepts its own ids and `system`, and nothing else", () => {
    expect(isLocaleId(SYSTEM_LOCALE)).toBe(true);
    for (const l of LOCALES) expect(isLocaleId(l.id), l.id).toBe(true);
    expect(isLocaleId("tlh")).toBe(false);
    expect(isLocaleId("")).toBe(false);
    expect(isLocaleId(undefined)).toBe(false);
  });

  it("falls back to the base language rather than throwing", () => {
    expect(localeOf("tlh").id).toBe(BASE_LOCALE);
    expect(resolveLocale("tlh")).toBe(BASE_LOCALE);
    expect(resolveLocale(SYSTEM_LOCALE, [])).toBe(BASE_LOCALE);
    expect(resolveLocale(SYSTEM_LOCALE, ["tlh", "jbo"])).toBe(BASE_LOCALE);
  });

  it("takes the device's first language it can actually read", () => {
    expect(resolveLocale(SYSTEM_LOCALE, ["es"])).toBe("es");
    expect(resolveLocale(SYSTEM_LOCALE, ["tlh", "es-MX", "en"])).toBe("es");
    // A region we do not cut separately is still that language.
    expect(resolveLocale(SYSTEM_LOCALE, ["es-419"])).toBe("es");
    expect(resolveLocale(SYSTEM_LOCALE, ["ES-ar"])).toBe("es");
  });

  it("lets a stated choice outrank the device", () => {
    expect(resolveLocale("en", ["es"])).toBe("en");
    expect(resolveLocale("es", ["en", "en-GB"])).toBe("es");
  });

  it("names itself in its own language", () => {
    for (const l of LOCALES) {
      expect(l.endonym.length, l.id).toBeGreaterThan(1);
      expect(l.tag, l.id).toMatch(/^[a-z]{2}(-[A-Za-z]+)?$/);
    }
  });
});

describe("filling a line in", () => {
  it("fills the holes it is given", () => {
    expect(interpolate("Palette {name}", { name: "Kaya" })).toBe("Palette Kaya");
    expect(interpolate("{a} and {b}", { a: "one", b: "two" })).toBe("one and two");
  });

  it("leaves a hole nobody filled visible rather than printing undefined", () => {
    expect(interpolate("Palette {name}", {})).toBe("Palette {name}");
    expect(interpolate("Palette {name}", { name: undefined })).toBe("Palette {name}");
    expect(interpolate("no holes", { name: "x" })).toBe("no holes");
  });

  it("picks a plural form by the language's own rules", () => {
    expect(pluralCategory("en", 1)).toBe("one");
    expect(pluralCategory("en", 0)).toBe("other");
    // French counts zero as singular, which is why the catalogue names
    // categories instead of holding a singular and a plural.
    expect(pluralCategory("fr", 0)).toBe("one");
    expect(pluralCategory("es", 2)).toBe("other");
  });
});

describe("reading a line", () => {
  const t = makeT("es");

  it("reads in the language asked for", () => {
    expect(t("nav.play")).toBe("Jugar");
    expect(makeT("en")("nav.play")).toBe("Play");
  });

  it("falls through to English rather than leaving a hole", () => {
    const partial = makeT("es");
    // Every key English has, in a language that has it or does not.
    for (const key of flatten(CATALOGUES.en).keys()) {
      expect(typeof partial(key), key).toBe("string");
      expect(partial(key), key).not.toBe("");
    }
  });

  it("returns the key itself when nobody has the line", () => {
    expect(t("no.such.line")).toBe("no.such.line");
  });

  it("takes a fallback for prose that still lives in a data file", () => {
    expect(t("no.such.line", null, "the data's own words")).toBe("the data's own words");
    expect(t("no.such.line", { n: 2 }, "{n} of them")).toBe("2 of them");
    // A line that IS in the catalogue outranks the fallback.
    expect(t("nav.play", null, "Play")).toBe("Jugar");
  });

  it("never throws, whatever it is handed", () => {
    expect(() => t("")).not.toThrow();
    expect(() => makeT("tlh")("nav.play")).not.toThrow();
    expect(makeT("tlh")("nav.play")).toBe("Play");
  });
});

describe.each(others)("$name is complete", (locale) => {
  const base = flatten(CATALOGUES.en);
  const mine = flatten(CATALOGUES[locale.id]);
  const translated = [...mine.keys()].filter(k => !isOverlay(k));

  it("translates every line English has, and invents none", () => {
    expect(translated.sort()).toEqual([...base.keys()].sort());
  });

  it("fills the same holes the English line does", () => {
    for (const key of translated) {
      for (const line of lines(mine.get(key))) {
        const theirs = holesIn(line);
        const ours = new Set([...lines(base.get(key))].flatMap(l => [...holesIn(l)]));
        for (const hole of theirs) {
          expect(ours.has(hole), `${locale.id}: ${key} fills {${hole}}, which the English line has no value for`).toBe(true);
        }
      }
    }
  });

  it("says something on every line", () => {
    for (const [key, entry] of mine) {
      for (const line of lines(entry)) {
        expect(String(line).trim(), `${locale.id}: ${key}`).not.toBe("");
        // House style: nothing here shouts.
        expect(String(line), `${locale.id}: ${key}`).not.toContain("!");
      }
    }
  });

  it("carries the prose the data files hold in English", () => {
    for (const p of PALETTES) expect(mine.get(`room.${p.id}.note`), `${locale.id}: room.${p.id}`).toBeTruthy();
    for (const s of STONE_SETS) {
      expect(mine.get(`stones.${s.id}.name`), `${locale.id}: stones.${s.id}.name`).toBeTruthy();
      expect(mine.get(`stones.${s.id}.note`), `${locale.id}: stones.${s.id}.note`).toBeTruthy();
    }
    for (const f of TYPEFACES) expect(mine.get(`type.${f.id}.note`), `${locale.id}: type.${f.id}`).toBeTruthy();
    for (const b of BELTS) expect(mine.get(`belt.${b.id}.label`), `${locale.id}: belt.${b.id}`).toBeTruthy();
  });

  it("overlays only things that exist, and leaves their holes alone", () => {
    const ids = {
      room: PALETTES.map(p => p.id),
      stones: STONE_SETS.map(s => s.id),
      type: TYPEFACES.map(f => f.id),
      belt: BELTS.map(b => b.id),
    };
    for (const key of [...mine.keys()].filter(isOverlay)) {
      const [ns, id] = key.split(".");
      expect(ids[ns], `${locale.id}: ${key}`).toContain(id);
      for (const line of lines(mine.get(key))) {
        expect(holesIn(line).size, `${locale.id}: ${key} has a hole nothing fills`).toBe(0);
      }
    }
  });
});
