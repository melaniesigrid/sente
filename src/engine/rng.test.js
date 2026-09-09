import { describe, it, expect } from "vitest";
import { createRng, hashString, positionSeed } from "./rng.js";

describe("rng", () => {
  it("is deterministic per seed and stays in [0, 1)", () => {
    const a = createRng(42), b = createRng(42);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
  it("differs across seeds", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
  it("hashes strings stably", () => {
    expect(hashString("2026-09-09")).toBe(hashString("2026-09-09"));
    expect(hashString("2026-09-09")).not.toBe(hashString("2026-09-10"));
    expect(hashString("")).toBe(2166136261);
  });
  it("folds seed and position into a 32-bit value that depends on both", () => {
    const s = positionSeed(7, 2 ** 40 + 5);
    expect(Number.isInteger(s) && s >= 0 && s < 2 ** 32).toBe(true);
    expect(positionSeed(7, 2 ** 40 + 5)).toBe(s);
    expect(positionSeed(8, 2 ** 40 + 5)).not.toBe(s);
    expect(positionSeed(7, 2 ** 40 + 6)).not.toBe(s);
    expect(positionSeed(7, 5)).not.toBe(positionSeed(7, 2 ** 40 + 5));
  });
});
