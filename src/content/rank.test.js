import { describe, it, expect } from "vitest";
import {
  rankOf, preciseRankOf, gradeOf, rankValue, ratingOfValue, ratingOfRank, beltOf, nextBelt,
  beltFloor, kyuFloor, hintsForBelt, BELTS, RANK_LADDER, stepRank, rankInRange,
  rankWithHandicap, rankGain, MIN_RATING, MAX_RATING, DAN_RATING, RATING_A, RATING_C,
} from "./rank.js";

describe("the OGS scale", () => {
  it("is OGS's formula, number for number", () => {
    expect(RATING_A).toBe(525);
    expect(RATING_C).toBe(23.15);
    // The two anchors anyone can check against a rank on OGS.
    expect(ratingOfValue(30)).toBeCloseTo(1918.49, 1);   // 1 dan
    expect(ratingOfValue(29)).toBeCloseTo(1837.38, 1);   // 1 kyu
    expect(rankValue(1918.49)).toBeCloseTo(30, 3);
  });
  it("round-trips a rating through its rank number", () => {
    for (let v = 4.1; v <= 38.9; v += 0.37) expect(rankValue(ratingOfValue(v))).toBeCloseTo(v, 6);
  });
  it("clamps to the ladder at both ends", () => {
    expect(rankOf(1)).toBe("25k");
    expect(rankOf(MIN_RATING - 200)).toBe("25k");
    expect(rankOf(MAX_RATING + 5000)).toBe("9d");
    expect(preciseRankOf(0.5)).toBe("25.9k");
    expect(preciseRankOf(1e9)).toBe("9.9d");
  });
});

describe("a rank to one decimal", () => {
  it("reads as the player expects: 12.0k strong, 12.9k weak", () => {
    const strong = ratingOfValue(18 - 0.05);   // just inside the 12k band, at its top
    const weak = ratingOfValue(17.05);         // just inside it, at its bottom
    expect(preciseRankOf(strong)).toBe("12.0k");
    expect(preciseRankOf(weak)).toBe("12.9k");
    expect(strong).toBeGreaterThan(weak);
  });
  it("never disagrees with the whole rank it sits in", () => {
    for (let v = 4.1; v <= 38.9; v += 0.013) {
      const r = ratingOfValue(v);
      const precise = preciseRankOf(r);
      expect(precise.slice(0, -1).split(".")[0] + precise.slice(-1)).toBe(rankOf(r));
    }
  });
  it("always shows exactly one decimal", () => {
    for (let v = 4.1; v <= 38.9; v += 0.077) expect(preciseRankOf(ratingOfValue(v))).toMatch(/^\d+\.\d[kd]$/);
  });
  it("has no rank between 1.0k and 1.0d", () => {
    // OGS's scale puts the whole 1k band below dan; the tenth is held back there
    // rather than printed as an impossible 0.4k.
    expect(preciseRankOf(DAN_RATING)).toBe("1.0d");
    expect(preciseRankOf(DAN_RATING - 1)).toBe("1.0k");
    expect(gradeOf(DAN_RATING - 1)).toEqual({ n: 1, unit: "k" });
  });
});

describe("rank ladder", () => {
  it("ratingOfRank inverts rankOf across the whole ladder", () => {
    for (const label of RANK_LADDER) expect(rankOf(ratingOfRank(label))).toBe(label);
    expect(RANK_LADDER[0]).toBe("25k");
    expect(RANK_LADDER[RANK_LADDER.length - 1]).toBe("9d");
    expect(stepRank("1k", 1)).toBe("1d");
    expect(stepRank("1d", -1)).toBe("1k");
    expect(stepRank("25k", -3)).toBe("25k");
    expect(stepRank("9d", 2)).toBe("9d");
    expect(rankInRange("12k", ["15k", "5k"])).toBe(true);
    expect(rankInRange("3d", ["15k", "5k"])).toBe(false);
  });
  it("puts every rung above the one below it", () => {
    const ratings = RANK_LADDER.map(ratingOfRank);
    for (let i = 1; i < ratings.length; i++) expect(ratings[i]).toBeGreaterThan(ratings[i - 1]);
  });
  it("measures a move in ranks", () => {
    const a = ratingOfRank("12k");
    expect(rankGain(a, ratingOfValue(rankValue(a) + 1))).toBeCloseTo(1, 6);
    expect(rankGain(a, a)).toBe(0);
    expect(rankGain(ratingOfRank("5k"), ratingOfRank("6k"))).toBeLessThan(0);
  });
});

describe("rankWithHandicap", () => {
  it("gives one rank per stone and leaves an even game alone", () => {
    expect(rankWithHandicap("5k", 0)).toBe("5k");
    expect(rankWithHandicap("5k", 2)).toBe("7k");
    expect(rankWithHandicap("1d", 3)).toBe("3k");
    expect(rankWithHandicap("24k", 9)).toBe("25k");
  });
});

describe("the ladder floor", () => {
  it("pins a beaten beginner at the bottom of 25k, not the top", () => {
    expect(preciseRankOf(MIN_RATING)).toBe("25.9k");
    expect(rankOf(MIN_RATING)).toBe("25k");
    // and there is a whole rank of tenths above the floor to climb
    expect(preciseRankOf(ratingOfRank("25k"))).toBe("25.5k");
  });
  it("pins a champion at the top of 9d", () => {
    expect(preciseRankOf(MAX_RATING)).toBe("9.9d");
    expect(rankOf(MAX_RATING)).toBe("9d");
  });
});

describe("belts", () => {
  it("cover every rank without a gap", () => {
    for (let v = 4.1; v <= 38.9; v += 0.05) expect(BELTS).toContain(beltOf(ratingOfValue(v)));
  });
  it("map kyu bands to belts and dan to black", () => {
    expect(beltOf(ratingOfRank("25k")).id).toBe("white");
    expect(beltOf(ratingOfRank("21k")).id).toBe("white");
    expect(beltOf(ratingOfRank("20k")).id).toBe("yellow");   // the default profile
    expect(beltOf(ratingOfRank("16k")).id).toBe("yellow");
    expect(beltOf(ratingOfRank("15k")).id).toBe("orange");
    expect(beltOf(ratingOfRank("10k")).id).toBe("green");
    expect(beltOf(ratingOfRank("4k")).id).toBe("blue");
    expect(beltOf(DAN_RATING).id).toBe("black");
    expect(beltOf(ratingOfRank("5d")).id).toBe("black");
  });
  it("kyuFloor is the boundary rankOf steps over", () => {
    for (let k = 1; k <= 24; k++) {
      expect(rankOf(kyuFloor(k))).toBe(`${k + 1}k`);       // at the line you are still weaker
      expect(rankOf(kyuFloor(k) + 0.01)).toBe(`${k}k`);    // one point above it you are not
    }
  });
  it("names the next belt and the rating that earns it", () => {
    const yellow = nextBelt(ratingOfRank("20k"));
    expect(yellow.belt).toBe(BELTS[2]);
    expect(yellow.at).toBeCloseTo(kyuFloor(15), 6);
    expect(rankOf(yellow.at + 0.01)).toBe("15k");
    expect(nextBelt(ratingOfRank("4k")).belt).toBe(BELTS[5]);
    expect(nextBelt(ratingOfRank("4k")).at).toBeCloseTo(DAN_RATING, 6);
    expect(nextBelt(ratingOfRank("2d"))).toBeNull();
  });
  it("puts a belt's floor at the line the belt begins on", () => {
    for (const belt of BELTS) {
      const floor = beltFloor(belt);
      expect(beltOf(floor + 0.01)).toBe(belt);
      // A kyu band is closed at its strong end, so the floor rating itself is
      // still the weaker belt. Dan has no band above it, so black owns its line.
      if (belt.id === "black") expect(beltOf(floor)).toBe(belt);
      else if (belt.id !== "white") expect(beltOf(floor)).not.toBe(belt);
    }
  });
  it("gives training wheels to white and yellow only", () => {
    expect(hintsForBelt(beltOf(ratingOfRank("22k")))).toBe(true);
    expect(hintsForBelt(beltOf(ratingOfRank("20k")))).toBe(true);
    expect(hintsForBelt(beltOf(ratingOfRank("14k")))).toBe(false);
    expect(hintsForBelt(beltOf(DAN_RATING))).toBe(false);
  });
});
