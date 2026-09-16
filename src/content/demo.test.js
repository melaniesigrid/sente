import { describe, it, expect } from "vitest";
import { demoPair } from "./demo.js";
import { PERSONAS } from "./personas.js";
import { rankInRange, RANK_LADDER } from "./rank.js";

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

  // Not clamped to what the network can imitate on its own: below 20k the bot
  // plays a softened 20k, and the app calls that 23k at every other table, so
  // the demo board calls it 23k too. What it may never be is a rank off the
  // ladder the app plays on.
  it("seats a rank the app can actually play at", () => {
    for (const key of DAYS) {
      const pair = demoPair(PERSONAS, key);
      for (const seat of [pair.b, pair.w]) {
        expect(RANK_LADDER, `${seat.persona.name} at ${seat.rank}`).toContain(seat.rank);
      }
    }
  });

  it("has nobody to seat when there are not two", () => {
    expect(demoPair([], "2026-09-16")).toBe(null);
    expect(demoPair([PERSONAS[0]], "2026-09-16")).toBe(null);
  });
});

describe("the demo pair at the edges", () => {
  it("seats both of exactly two house players", () => {
    const two = PERSONAS.slice(0, 2);
    for (const key of DAYS.slice(0, 20)) {
      const pair = demoPair(two, key);
      expect(new Set([pair.b.persona.id, pair.w.persona.id]).size).toBe(2);
    }
  });

  it("gives a persona with no home range a rank off the ladder's foot", () => {
    const pair = demoPair([{ id: "a", name: "A" }, { id: "b", name: "B" }], "2026-09-16");
    for (const seat of [pair.b, pair.w]) expect(RANK_LADDER).toContain(seat.rank);
  });

  it("has nobody to seat when it is handed nothing at all", () => {
    expect(demoPair(null, "2026-09-16")).toBe(null);
    expect(demoPair(undefined, "2026-09-16")).toBe(null);
  });
});
