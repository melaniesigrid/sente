import { describe, it, expect } from "vitest";
import {
  winRate, winRateForBlack, swings, turningPoints, nextTurn, prevTurn,
  steadiness, pct, pointAt, winRateLine, graphSummary,
} from "./analysis.js";

/* The value head is three logits: win, loss, no result, always for the side to move.
   That is not a guess; it was read off the network itself (an empty 9x9 answers near
   even, and the same nine-stone position answers 1.00 for Black to play and 0.00 for
   White to play). Everything below rests on it, so it is worth saying out loud. */

const evenish = [0, 0, -20];
const blackSure = [10, -10, -20];

describe("winRate", () => {
  it("softmaxes the three logits", () => {
    expect(winRate(evenish).win).toBeCloseTo(0.5, 6);
    expect(winRate(blackSure).win).toBeGreaterThan(0.99);
  });

  it("takes no-result out of the share, so the graph is of games that finish", () => {
    // Half the mass on no result; the two that remain are even.
    const { win, noResult } = winRate([0, 0, Math.log(2)]);
    expect(noResult).toBeCloseTo(0.5, 6);
    expect(win).toBeCloseTo(0.5, 6);
  });

  it("refuses anything that is not three numbers", () => {
    expect(() => winRate([1, 2])).toThrow(RangeError);
    expect(() => winRate(null)).toThrow(RangeError);
  });
});

describe("winRateForBlack", () => {
  it("passes a black-to-play answer through", () => {
    expect(winRateForBlack(blackSure, "b").black).toBeGreaterThan(0.99);
  });

  it("flips a white-to-play answer, because the graph is always Black's", () => {
    expect(winRateForBlack(blackSure, "w").black).toBeLessThan(0.01);
  });
});

/* A game Black leads, throws away at move 3, and does not get back. */
const points = [
  { move: 0, black: 0.50, color: null },
  { move: 1, black: 0.60, color: "b" },
  { move: 2, black: 0.58, color: "w" },
  { move: 3, black: 0.20, color: "b" },
  { move: 4, black: 0.22, color: "w" },
];

describe("swings", () => {
  it("reads every swing as the mover's own fortunes", () => {
    const s = swings(points);
    expect(s.map((x) => x.move)).toEqual([1, 2, 3, 4]);
    // Black played 1 and gained; the cost is negative.
    expect(s[0]).toMatchObject({ color: "b" });
    expect(s[0].cost).toBeCloseTo(-0.10, 6);
    // White played 2 and gained two points of its own chances.
    expect(s[1].cost).toBeCloseTo(-0.02, 6);
    // Black played 3 and lost 38 of them.
    expect(s[2].cost).toBeCloseTo(0.38, 6);
  });

  it("ignores a move nobody made", () => {
    expect(swings([{ move: 0, black: 0.5, color: null }])).toEqual([]);
  });

  it("refuses to read a swing across a gap", () => {
    // A half-drawn graph must never report two moves of change as one move's mistake.
    const gapped = [
      { move: 0, black: 0.5, color: null },
      { move: 1, black: 0.55, color: "b" },
      { move: 9, black: 0.05, color: "b" },
    ];
    expect(swings(gapped).map((x) => x.move)).toEqual([1]);
  });
});

describe("turningPoints", () => {
  it("keeps only swings big enough to be a mistake, biggest first, then in move order", () => {
    const t = turningPoints(points);
    expect(t.map((x) => x.move)).toEqual([3]);
  });

  it("returns them in move order even when the worst came second", () => {
    const two = [
      { move: 0, black: 0.5, color: null },
      { move: 1, black: 0.3, color: "b" },   // cost .20
      { move: 2, black: 0.9, color: "w" },   // cost .60
    ];
    expect(turningPoints(two).map((x) => x.move)).toEqual([1, 2]);
  });

  it("honours the limit by dropping the smallest, not the latest", () => {
    const many = [
      { move: 0, black: 0.5, color: null },
      { move: 1, black: 0.2, color: "b" },   // cost .30
      { move: 2, black: 0.9, color: "w" },   // cost .70
      { move: 3, black: 0.75, color: "b" },  // cost .15
    ];
    expect(turningPoints(many, { limit: 2 }).map((x) => x.move)).toEqual([1, 2]);
  });

  it("finds nothing in a quiet game", () => {
    expect(turningPoints([
      { move: 0, black: 0.5, color: null },
      { move: 1, black: 0.52, color: "b" },
    ])).toEqual([]);
  });
});

describe("walking between turning points", () => {
  const turns = [{ move: 3 }, { move: 10 }];
  it("goes strictly forward and strictly back", () => {
    expect(nextTurn(turns, 3).move).toBe(10);
    expect(prevTurn(turns, 10).move).toBe(3);
    expect(nextTurn(turns, 10)).toBe(null);
    expect(prevTurn(turns, 3)).toBe(null);
  });
});

describe("steadiness", () => {
  it("counts only what a side gave away, never what it was handed", () => {
    const s = steadiness(points);
    expect(s.b.moves).toBe(2);
    // Black's two moves: gained .10 (counts as 0) and lost .38.
    expect(s.b.mean).toBeCloseTo(0.19, 6);
    expect(s.b.worst.move).toBe(3);
    // White's two moves: gained .02 (counts as 0) and gave .02 back at move 4.
    expect(s.w.mean).toBeCloseTo(0.01, 6);
    expect(s.w.worst.move).toBe(4);
  });

  it("leaves a side that only ever gained without a worst move", () => {
    const clean = [
      { move: 0, black: 0.5, color: null },
      { move: 1, black: 0.7, color: "b" },
    ];
    expect(steadiness(clean).b.mean).toBeCloseTo(0, 6);
    expect(steadiness(clean).b.worst).toBe(null);
  });

  it("says nothing about a side that never moved", () => {
    expect(steadiness([{ move: 0, black: 0.5, color: null }])).toEqual({ b: null, w: null });
  });
});

describe("the words under the graph", () => {
  it("names whoever is ahead, in their own terms", () => {
    expect(winRateLine(points, 1)).toContain("Black 60%");
    expect(winRateLine(points, 3)).toContain("White 80%");
  });

  it("says what the move did", () => {
    expect(winRateLine(points, 3)).toContain("cost Black 38%");
    expect(winRateLine(points, 1)).toContain("gained Black 10%");
  });

  it("does not make a fuss about a move that changed nothing", () => {
    expect(winRateLine(points, 4)).toContain("changed little");
  });

  it("is silent about a position nobody has looked at", () => {
    expect(winRateLine(points, 99)).toBe(null);
    expect(pointAt(points, 99)).toBe(null);
  });

  it("has nothing to say about the move that made the opening position", () => {
    expect(winRateLine(points, 0)).toBe("The network gives Black 50%.");
  });
});

describe("graphSummary", () => {
  it("says how the lead moved, for a reader who cannot see the picture", () => {
    expect(graphSummary(points, 4)).toContain("the lead changed hands once");
    expect(graphSummary(points, 4)).toContain("by move 4 of 4");
    expect(graphSummary(points, 4)).toContain("White 78%");
  });

  it("counts a lead that never moved", () => {
    expect(graphSummary([
      { move: 0, black: 0.5, color: null },
      { move: 1, black: 0.7, color: "b" },
    ], 1)).toContain("never changed hands");
  });

  it("admits when it has nothing", () => {
    expect(graphSummary([], 40)).toContain("nothing analysed yet");
  });
});

describe("pct", () => {
  it("rounds to whole points, the way the graph writes them", () => {
    expect(pct(0.615)).toBe("62%");
    expect(pct(0)).toBe("0%");
    expect(pct(1)).toBe("100%");
  });
});
