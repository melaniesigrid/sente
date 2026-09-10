import { describe, it, expect, vi, afterEach } from "vitest";
import { profileForRank, clampRank, kataChooseMoveForRecord, masterYear } from "./bot.js";
import { humanPolicy } from "./net.js";
import { canonicalMove } from "../style/symmetries.js";
import { StyleDataError } from "../style/master.js";
import { MOVE_AXES } from "../style/features.js";
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

describe("kataChooseMoveForRecord with a master", () => {
  const N = 19;
  const masterFor = (rec, extra = {}) => {
    const { key, idx } = canonicalMove(rec.board, 2, 15, rec.toPlay);
    return {
      id: "shusaku", name: "Shusaku", year: 1846, years: [1837, 1862], games: { even: 349 },
      style: { master: {}, ...extra.style },
      book: { moves: 30, minGames: 3, entries: { [key]: { [idx]: 9, [canonicalMove(rec.board, 3, 15, rec.toPlay).idx]: 1 } } },
      ...extra,
    };
  };

  it("plays the book when the position is in it, without asking the network", async () => {
    const rec = play(createGame({ size: N }), 15, 3);
    const master = masterFor(rec);
    humanPolicy.mockClear();
    const res = await kataChooseMoveForRecord(rec, { master, seed: 3 });
    expect(res.source).toBe("book");
    expect([[2, 15], [3, 15]]).toContainEqual(res.move);
    expect(res.top[0]).toEqual({ move: [2, 15], prob: 0.9 });
    expect(humanPolicy).not.toHaveBeenCalled();
  });

  it("draws the same book move for the same seed on any orientation", async () => {
    const rec = play(createGame({ size: N }), 15, 3);
    const master = masterFor(rec);
    const a = await kataChooseMoveForRecord(rec, { master, seed: 11 });
    const b = await kataChooseMoveForRecord(rec, { master, seed: 11 });
    expect(a.move).toEqual(b.move);
    const mirrored = play(createGame({ size: N }), 3, 15);       // same position, other corner
    const c = await kataChooseMoveForRecord(mirrored, { master, seed: 11 });
    expect(c.source).toBe("book");
    expect(c.move).not.toEqual(a.move);
  });

  it("falls through to the year profile off book and reports the source", async () => {
    let rec = play(createGame({ size: N }), 15, 3);
    rec = play(rec, 3, 15);
    rec = play(rec, 3, 3);
    const master = masterFor(rec);
    master.book.entries = {};
    humanPolicy.mockClear();
    const res = await kataChooseMoveForRecord(rec, { master, seed: 1 });
    expect(res.source).toBe("network");
    expect(humanPolicy).toHaveBeenCalledWith(rec, { pro: true, year: 1846 });
  });

  it("applies the prior only when the eval let it ship, and lean can switch it off", async () => {
    let rec = play(createGame({ size: N }), 15, 3);
    rec = play(rec, 3, 15);
    const zero = Object.fromEntries(MOVE_AXES.map((a) => [a, 0]));
    const one = Object.fromEntries(MOVE_AXES.map((a) => [a, 1]));
    const style = { master: {}, moveAxes: MOVE_AXES, baseline: zero, masterMoves: { ...zero, contact: 1 }, moveSpread: one, lambda: 1 };
    const master = { ...masterFor(rec), style };
    master.book.entries = {};
    expect((await kataChooseMoveForRecord(rec, { master })).source).toBe("network+prior");
    expect((await kataChooseMoveForRecord(rec, { master, lean: 0 })).source).toBe("network");
    master.style.lambda = 0;
    expect((await kataChooseMoveForRecord(rec, { master })).source).toBe("network");
  });

  it("refuses any size but 19x19 with a StyleDataError", async () => {
    const rec = play(createGame({ size: 9 }), 4, 4);
    const master = masterFor(play(createGame({ size: N }), 15, 3));
    await expect(kataChooseMoveForRecord(rec, { master })).rejects.toThrow(StyleDataError);
  });

  it("reads the year from the JSON or the middle of the span", () => {
    expect(masterYear({ year: 1846, years: [1837, 1862] })).toBe(1846);
    expect(masterYear({ years: [1806, 1847] })).toBe(1827);
  });
});
