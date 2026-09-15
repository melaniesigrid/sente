import { describe, it, expect } from "vitest";
import { ARCHETYPES, NO_ARCHETYPE, archetypeOf, isArchetypeId, localizeArchetype } from "./archetypes.js";
import { makeT, LOCALES, BASE_LOCALE } from "../i18n/index.js";

describe("the masks", () => {
  it("each has a distinct id, a glyph, a name in both languages, and a line", () => {
    const ids = new Set(ARCHETYPES.map(a => a.id));
    expect(ids.size).toBe(ARCHETYPES.length);
    for (const a of ARCHETYPES) {
      expect(a.id).toMatch(/^[a-z]+$/);
      expect(a.glyph.length).toBeGreaterThan(0);
      expect(a.hanzi).toMatch(/^[一-鿿]+$/);
      expect(a.name).toMatch(/^The /);
      expect(a.line.length).toBeGreaterThan(10);
    }
  });
  it("the plain player is the empty id, is valid, and is no mask at all", () => {
    expect(NO_ARCHETYPE).toBe("");
    expect(isArchetypeId(NO_ARCHETYPE)).toBe(true);
    expect(archetypeOf(NO_ARCHETYPE)).toBeNull();
  });
  it("finds every mask by id and nothing else", () => {
    for (const a of ARCHETYPES) {
      expect(archetypeOf(a.id)).toBe(a);
      expect(isArchetypeId(a.id)).toBe(true);
    }
    expect(archetypeOf("dragon")).toBeNull();
    expect(isArchetypeId("dragon")).toBe(false);
    expect(isArchetypeId(undefined)).toBe(false);
    expect(isArchetypeId(3)).toBe(false);
  });
  it("reads its name and line in another language and keeps its hanzi", () => {
    const tiger = archetypeOf("tiger");
    const de = localizeArchetype(tiger, makeT("de"));
    expect(de.name).not.toBe(tiger.name);
    expect(de.line).not.toBe(tiger.line);
    expect(de.hanzi).toBe(tiger.hanzi);
    expect(de.glyph).toBe(tiger.glyph);
    expect(localizeArchetype(tiger).name).toBe(tiger.name);
  });
  it("wears an emoji, never a letter, so the Lucide rule holds for every icon that points at a fact", () => {
    for (const a of ARCHETYPES) expect(a.glyph, a.id).toMatch(/^\P{ASCII}+$/u);
  });
  it("reads every mask in every language the app ships, and keeps what is not prose", () => {
    for (const l of LOCALES.filter(l => l.id !== BASE_LOCALE)) {
      const t = makeT(l.id);
      for (const a of ARCHETYPES) {
        const m = localizeArchetype(a, t);
        expect(m, `${l.id}: arche.${a.id}`).not.toBe(a);
        expect(m.name.trim().length, `${l.id}: arche.${a.id}.name`).toBeGreaterThan(0);
        expect(m.line.trim().length, `${l.id}: arche.${a.id}.line`).toBeGreaterThan(0);
        expect(m.id).toBe(a.id);
        expect(m.glyph).toBe(a.glyph);
        expect(m.hanzi).toBe(a.hanzi);
      }
    }
  });
  it("hands English back untouched, so a reader can memoise on identity", () => {
    for (const a of ARCHETYPES) expect(localizeArchetype(a, makeT(BASE_LOCALE))).toBe(a);
  });
  it("falls back to the English words when a language has none for a mask", () => {
    const mute = (key, vars, fallback) => fallback;
    const tiger = archetypeOf("tiger");
    expect(localizeArchetype(tiger, mute)).toBe(tiger);
  });
});
