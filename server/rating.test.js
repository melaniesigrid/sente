import { describe, it, expect } from "vitest";
import { rate, rateGame, newRating, provisional, migrateRating, DEFAULT_RD, DEFAULT_RATING } from "./rating.js";
import { rankOf, preciseRankOf } from "../src/content/rank.js";

describe("glicko-2", () => {
  it("reproduces the worked example from Glickman's paper", () => {
    const p = { rating: 1500, rd: 200, vol: 0.06 };
    const out = rate(p, [
      { opponent: { rating: 1400, rd: 30 }, score: 1 },
      { opponent: { rating: 1550, rd: 100 }, score: 0 },
      { opponent: { rating: 1700, rd: 300 }, score: 0 },
    ]);
    expect(out.rating).toBeCloseTo(1464.06, 1);
    expect(out.rd).toBeCloseTo(151.52, 1);
    expect(out.vol).toBeCloseTo(0.05999, 4);
  });

  it("a newcomer moves a lot, an established player a little", () => {
    const fresh = newRating();
    const vet = { rating: 1500, rd: 50, vol: 0.06 };
    const r = rateGame(fresh, vet, "b");
    expect(r.b.delta).toBeGreaterThan(100);
    expect(Math.abs(r.w.delta)).toBeLessThan(20);
    expect(r.b.rd).toBeLessThan(fresh.rd);
  });

  it("is zero-sum in spirit: the winner rises and the loser falls", () => {
    const a = { rating: 1600, rd: 80, vol: 0.06 };
    const b = { rating: 1600, rd: 80, vol: 0.06 };
    const r = rateGame(a, b, "w");
    expect(r.w.delta).toBeGreaterThan(0);
    expect(r.b.delta).toBeLessThan(0);
    expect(r.b.delta).toBe(-r.w.delta);
  });

  it("jigo between equals leaves the ratings alone but tightens the deviation", () => {
    const a = { rating: 1600, rd: 80, vol: 0.06 };
    const r = rateGame(a, { ...a }, null);
    expect(r.b.delta).toBe(0);
    expect(r.w.delta).toBe(0);
    expect(r.b.rd).toBeLessThan(80);
  });

  it("idle periods widen the deviation but never past the default", () => {
    const p = { rating: 1700, rd: 60, vol: 0.06 };
    let q = rate(p, []);
    expect(q.rating).toBe(1700);
    expect(q.rd).toBeGreaterThan(60);
    for (let i = 0; i < 5000; i++) q = rate(q, []);
    expect(q.rd).toBe(DEFAULT_RD);
  });

  it("never mutates its inputs", () => {
    const p = { rating: 1500, rd: 200, vol: 0.06 };
    const o = { rating: 1400, rd: 30 };
    rate(p, [{ opponent: o, score: 1 }]);
    expect(p).toEqual({ rating: 1500, rd: 200, vol: 0.06 });
    expect(o).toEqual({ rating: 1400, rd: 30 });
  });

  it("flags wide deviations as provisional", () => {
    expect(provisional(newRating())).toBe(true);
    expect(provisional({ rating: 1500, rd: 90, vol: 0.06 })).toBe(false);
  });
});

describe("the scale the server rates on", () => {
  it("seats a newcomer at 20 kyu, the same seat the browser gives one", () => {
    expect(rankOf(DEFAULT_RATING)).toBe("20k");
    expect(preciseRankOf(newRating().rating)).toBe("20.5k");
  });

  it("carries an old-scale player across at the rank they earned", () => {
    // The old scale: a hundred points to a rank, 3000 the first dan.
    const legacy = (old) => rankOf(migrateRating({ rating: old, rd: 80, vol: 0.06 }).rating);
    expect(legacy(1000)).toBe("20k");
    expect(legacy(2000)).toBe("10k");
    expect(legacy(2900)).toBe("1k");
    expect(legacy(3000)).toBe("1d");
    expect(legacy(3500)).toBe("6d");
  });

  it("carries confidence across untouched: it was never measured in points", () => {
    const out = migrateRating({ rating: 2000, rd: 73, vol: 0.055 });
    expect(out.rd).toBe(73);
    expect(out.vol).toBe(0.055);
  });

  it("gives a record with no usable rating the newcomer's seat", () => {
    expect(rankOf(migrateRating({}).rating)).toBe("15k");   // the old default, 1500
    expect(migrateRating({ rating: "nonsense" }).rd).toBe(DEFAULT_RD);
  });

  it("names the rank a finished game leaves each side on", () => {
    const out = rateGame(newRating(), newRating(), "b");
    expect(out.b.rank).toMatch(/^\d+\.\d[kd]$/);
    expect(out.b.rating).toBeGreaterThan(out.w.rating);
    expect(out.b.delta).toBeGreaterThan(0);
    expect(out.w.delta).toBeLessThan(0);
  });
});
