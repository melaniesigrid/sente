import { describe, it, expect } from "vitest";
import { PERSONAS, personaById, personasFor, FAITHFULNESS, faithfulnessOf } from "./personas.js";
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

  /* The page a house player now has is built out of these two fields and the
     temperature. A persona without them would render a page with holes in it,
     and the holes would be where the honesty was supposed to go. */
  it("each says how it plays and what its tell is, in the house voice", () => {
    for (const p of PERSONAS) {
      for (const k of ["plays", "tell"]) {
        expect(p[k], `${p.id}.${k}`).toBeTruthy();
        expect(p[k].length, `${p.id}.${k}`).toBeGreaterThan(80);
        /* The chat lines may shout, because a character shouting is the
           character. Prose about the character may not. */
        expect(p[k], `${p.id}.${k}`).not.toMatch(/!/);
      }
      /* A page that prints the temperature beside the band must not contradict
         itself, so the band has to say what the number says. */
      expect(p.plays, `${p.id}.plays states its temperature`)
        .toContain(p.profile.temperature.toFixed(1));
    }
  });

  it("sorts into faithfulness bands, and every temperature lands in one", () => {
    const froms = FAITHFULNESS.map(b => b.from);
    expect(froms).toEqual([...froms].sort((a, b) => b - a));
    expect(froms[froms.length - 1]).toBe(0);
    for (const p of PERSONAS) {
      const band = faithfulnessOf(p);
      expect(band, p.id).toBeTruthy();
      expect(p.profile.temperature, p.id).toBeGreaterThanOrEqual(band.from);
    }
    /* The bands have to separate somebody, or they are one band with four
       names on it. */
    expect(new Set(PERSONAS.map(p => faithfulnessOf(p).key)).size).toBeGreaterThan(2);
  });
});
