import { describe, it, expect } from "vitest";
import { PERSONAS, personaById } from "./personas.js";
import { RANKS } from "../engine/index.js";
import { rankOf } from "./rank.js";

describe("house players", () => {
  it("each imitates a rank the human model knows, and the badge agrees", () => {
    for (const p of PERSONAS) {
      expect(RANKS).toContain(p.profile.rank);
      expect(rankOf(p.rating)).toBe(p.profile.rank);
      expect(p.profile.temperature).toBeGreaterThan(0);
    }
  });

  it("covers the ladder from double-digit kyu to dan", () => {
    const ranks = PERSONAS.map((p) => p.profile.rank);
    expect(ranks).toContain("20k");
    expect(ranks.some((r) => r.endsWith("d"))).toBe(true);
    expect(new Set(PERSONAS.map((p) => p.id)).size).toBe(PERSONAS.length);
    expect(personaById("hoshi").name).toBe("Hoshi");
  });
});
