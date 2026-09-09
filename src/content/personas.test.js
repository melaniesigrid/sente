import { describe, it, expect } from "vitest";
import { PERSONAS, personaById, personasFor } from "./personas.js";
import { RANK_LADDER, rankInRange } from "./rank.js";

describe("house players", () => {
  it("each has a home range on the ladder and a sampling temperature", () => {
    for (const p of PERSONAS) {
      expect(RANK_LADDER).toContain(p.range[0]);
      expect(RANK_LADDER).toContain(p.range[1]);
      expect(RANK_LADDER.indexOf(p.range[0])).toBeLessThan(RANK_LADDER.indexOf(p.range[1]));
      expect(p.profile.temperature).toBeGreaterThan(0);
      expect(p.profile.rank).toBeUndefined();
    }
  });

  it("every rank on the ladder has at least one persona at home", () => {
    for (const rank of RANK_LADDER) {
      expect(PERSONAS.some((p) => rankInRange(rank, p.range)), rank).toBe(true);
      const ordered = personasFor(rank);
      expect(ordered.length).toBe(PERSONAS.length);
      expect(rankInRange(rank, ordered[0].range)).toBe(true);
    }
    expect(new Set(PERSONAS.map((p) => p.id)).size).toBe(PERSONAS.length);
    expect(personaById("hoshi").name).toBe("Hoshi");
  });
});
