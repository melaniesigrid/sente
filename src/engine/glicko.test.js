import { describe, it, expect } from "vitest";
import { GLICKO, updateGlicko, rateAgainst, isProvisional } from "./glicko.js";
/* The engine does not import the app, so the scale is restated here rather than
   borrowed from `src/content/rank.js`: a rank is a factor of e^(1/23.15) in
   rating, which is the OGS scale the app puts on top of these numbers. */
const ratingOfRank = (label) => {
  const n = parseInt(label, 10);
  return 525 * Math.exp((label.endsWith("d") ? 29 + n + 0.5 : 30 - n - 0.5) / 23.15);
};
const rankGain = (before, after) => 23.15 * Math.log(after / before);

describe("glicko-2", () => {
  it("reproduces Glickman's worked example", () => {
    // The example from glicko.net/glicko/glicko2.pdf, section "Example calculation".
    const out = updateGlicko(
      { rating: 1500, rd: 200, vol: 0.06 },
      [
        { rating: 1400, rd: 30, score: 1 },
        { rating: 1550, rd: 100, score: 0 },
        { rating: 1700, rd: 300, score: 0 },
      ],
      0.5,
    );
    expect(out.rating).toBeCloseTo(1464.06, 1);   // the paper's figures, to its own rounding
    expect(out.rd).toBeCloseTo(151.52, 1);
    expect(out.vol).toBeCloseTo(0.05999, 4);
  });

  it("widens the deviation over a period with no games, up to the ceiling", () => {
    const idle = updateGlicko({ rating: 1200, rd: 60, vol: 0.06 }, []);
    expect(idle.rating).toBe(1200);
    expect(idle.rd).toBeGreaterThan(60);
    const long = updateGlicko({ rating: 1200, rd: 349, vol: 0.5 }, []);
    expect(long.rd).toBe(GLICKO.maxRd);
  });

  it("moves a newcomer faster than a settled player", () => {
    const opp = { rating: ratingOfRank("20k"), rd: GLICKO.minRd };
    const newcomer = rateAgainst({ rating: opp.rating, rd: GLICKO.rd, vol: GLICKO.vol }, opp, 1);
    const settled = rateAgainst({ rating: opp.rating, rd: 50, vol: GLICKO.vol }, opp, 1);
    expect(rankGain(opp.rating, newcomer.rating)).toBeGreaterThan(rankGain(opp.rating, settled.rating));
    expect(rankGain(opp.rating, settled.rating)).toBeGreaterThan(0);
    // A settled player crosses a fraction of a rank on one win; a newcomer, more than one.
    expect(rankGain(opp.rating, settled.rating)).toBeLessThan(0.35);
    expect(rankGain(opp.rating, newcomer.rating)).toBeGreaterThan(1);
  });

  it("narrows the deviation as games are played, and never past the floor", () => {
    let p = { rating: ratingOfRank("20k"), rd: GLICKO.rd, vol: GLICKO.vol };
    const opp = { rating: ratingOfRank("20k"), rd: GLICKO.minRd };
    const rds = [];
    for (let i = 0; i < 60; i++) { p = rateAgainst(p, opp, i % 2); rds.push(p.rd); }
    expect(rds[5]).toBeLessThan(GLICKO.rd);
    expect(rds[59]).toBeLessThan(rds[5]);
    expect(rds[59]).toBeGreaterThanOrEqual(GLICKO.minRd);
  });

  it("finds a newcomer's real strength in an evening", () => {
    // Someone who is really about 10k, seeded at 20k, beating 20k opponents.
    let p = { rating: ratingOfRank("20k"), rd: GLICKO.rd, vol: GLICKO.vol };
    for (let i = 0; i < 8; i++) p = rateAgainst(p, { rating: ratingOfRank("20k"), rd: GLICKO.minRd }, 1);
    expect(rankGain(ratingOfRank("20k"), p.rating)).toBeGreaterThan(4);
    expect(isProvisional(p.rd)).toBe(false);
  });

  it("marks a rank as a guess while the deviation is wide", () => {
    expect(isProvisional(GLICKO.rd)).toBe(true);
    expect(isProvisional(GLICKO.provisionalRd + 1)).toBe(true);
    expect(isProvisional(GLICKO.provisionalRd)).toBe(false);
    expect(isProvisional(GLICKO.minRd)).toBe(false);
  });

  it("scores a jigo as half a game, moving nobody far", () => {
    const p = { rating: ratingOfRank("8k"), rd: 60, vol: GLICKO.vol };
    const drawn = rateAgainst(p, { rating: p.rating, rd: GLICKO.minRd }, 0.5);
    expect(Math.abs(rankGain(p.rating, drawn.rating))).toBeLessThan(0.01);
  });

  it("rewards beating a stronger player more than beating a weaker one", () => {
    const p = { rating: ratingOfRank("10k"), rd: 60, vol: GLICKO.vol };
    const overStronger = rateAgainst(p, { rating: ratingOfRank("5k"), rd: GLICKO.minRd }, 1);
    const overWeaker = rateAgainst(p, { rating: ratingOfRank("15k"), rd: GLICKO.minRd }, 1);
    expect(overStronger.rating).toBeGreaterThan(overWeaker.rating);
    const lostToWeaker = rateAgainst(p, { rating: ratingOfRank("15k"), rd: GLICKO.minRd }, 0);
    const lostToStronger = rateAgainst(p, { rating: ratingOfRank("5k"), rd: GLICKO.minRd }, 0);
    expect(lostToWeaker.rating).toBeLessThan(lostToStronger.rating);
  });

  it("keeps a losing streak from erasing a season", () => {
    // Ten straight losses to an even opponent, from a settled rating.
    let p = { rating: ratingOfRank("8k"), rd: 50, vol: GLICKO.vol };
    const start = p.rating;
    for (let i = 0; i < 10; i++) p = rateAgainst(p, { rating: ratingOfRank("8k"), rd: GLICKO.minRd }, 0);
    expect(rankGain(start, p.rating)).toBeGreaterThan(-4);
    expect(rankGain(start, p.rating)).toBeLessThan(-1);
  });
});
