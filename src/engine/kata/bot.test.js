import { describe, it, expect } from "vitest";
import { profileForRank, clampRank } from "./bot.js";

describe("profileForRank", () => {
  it("passes ranks the network knows straight through", () => {
    expect(profileForRank("12k", 0.7)).toEqual({ rank: "12k", temperature: 0.7 });
    expect(profileForRank("3d", 0.5)).toEqual({ rank: "3d", temperature: 0.5 });
  });
  it("softens the 20k policy for beginners below it", () => {
    const p = profileForRank("25k", 0.8);
    expect(p.rank).toBe("20k");
    expect(p.temperature).toBeCloseTo(2.0);
    expect(profileForRank("21k", 0.8).temperature).toBeCloseTo(1.05);
  });
  it("clamps unknown labels", () => {
    expect(clampRank("30k")).toBe("20k");
    expect(clampRank("12d")).toBe("9d");
    expect(clampRank("nope")).toBeUndefined();
  });
});
