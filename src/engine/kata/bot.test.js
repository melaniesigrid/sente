import { describe, it, expect, vi, afterEach } from "vitest";
import { profileForRank, clampRank, kataChooseMoveForRecord } from "./bot.js";
import { createGame, play } from "../record.js";

// A stand-in network: flat logits over the board, a little warmer in the middle,
// so sampling at temperature 1 spreads across many points.
vi.mock("./net.js", () => ({
  humanPolicy: vi.fn(async (rec) => {
    const N = rec.size;
    const logits = new Float32Array(N * N + 1).fill(0);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const d = Math.abs(c - (N - 1) / 2) + Math.abs(r - (N - 1) / 2);
      logits[r * N + c] = 2 - d * 0.25;
    }
    logits[N * N] = -20;
    return { logits, value: [0.5, 0.5, 0] };
  }),
}));

afterEach(() => vi.restoreAllMocks());

describe("kataChooseMoveForRecord with a seed", () => {
  it("is a pure function of (seed, position) and never touches Math.random", async () => {
    vi.spyOn(Math, "random").mockImplementation(() => { throw new Error("Math.random used"); });
    const rec = play(createGame({ size: 9 }), 4, 4);
    const a = await kataChooseMoveForRecord(rec, { rank: "5k", temperature: 1, seed: 7 });
    const b = await kataChooseMoveForRecord(rec, { rank: "5k", temperature: 1, seed: 7 });
    expect(a.move).toEqual(b.move);
    const moves = new Set();
    for (let seed = 1; seed <= 24; seed++) {
      const res = await kataChooseMoveForRecord(rec, { rank: "5k", temperature: 1, seed });
      moves.add(res.move.join(","));
    }
    expect(moves.size).toBeGreaterThan(1);
    const other = play(rec, 2, 2);
    const c = await kataChooseMoveForRecord(other, { rank: "5k", temperature: 1, seed: 7 });
    expect(c.move).not.toEqual([2, 2]);
  });
  it("samples with Math.random when no seed is given", async () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const rec = play(createGame({ size: 9 }), 4, 4);
    await kataChooseMoveForRecord(rec, { rank: "5k", temperature: 1 });
    expect(spy).toHaveBeenCalled();
  });
});

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
