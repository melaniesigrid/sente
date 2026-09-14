import { describe, it, expect } from "vitest";
import { ARCHETYPES, NO_ARCHETYPE, archetypeOf, isArchetypeId, localizeArchetype } from "./archetypes.js";
import { makeT } from "../i18n/index.js";

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
});
