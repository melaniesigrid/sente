import { describe, it, expect } from "vitest";
import { demoPair } from "./demo.js";
import { PERSONAS } from "./personas.js";
import { rankInRange } from "./rank.js";

const DAYS = Array.from({ length: 120 }, (_, i) => `2026-09-${String((i % 28) + 1).padStart(2, "0")}-${i}`);

describe("the demo pair", () => {
  it("seats two different house players", () => {
    for (const key of DAYS) {
      const pair = demoPair(PERSONAS, key);
      expect(pair.b.persona.id).not.toBe(pair.w.persona.id);
    }
  });

  it("is the same pair all day", () => {
    const a = demoPair(PERSONAS, "2026-09-16");
    const b = demoPair(PERSONAS, "2026-09-16");
    expect(a.b.persona.id).toBe(b.b.persona.id);
    expect(a.w.rank).toBe(b.w.rank);
  });

  it("gives each seat a rank inside that persona's own range", () => {
    for (const key of DAYS) {
      const pair = demoPair(PERSONAS, key);
      for (const seat of [pair.b, pair.w]) {
        expect(rankInRange(seat.rank, seat.persona.range)).toBe(true);
      }
    }
  });

  it("uses more than one of the house players over a month", () => {
    const seen = new Set(DAYS.map(key => demoPair(PERSONAS, key).b.persona.id));
    expect(seen.size).toBeGreaterThan(2);
  });

  it("has nobody to seat when there are not two", () => {
    expect(demoPair([], "2026-09-16")).toBe(null);
    expect(demoPair([PERSONAS[0]], "2026-09-16")).toBe(null);
  });
});
