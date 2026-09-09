import { describe, it, expect } from "vitest";
import { rankOf, beltOf, nextBelt, kyuFloor, hintsForBelt, BELTS } from "./rank.js";

describe("belts", () => {
  it("cover every rank without a gap", () => {
    for (let r = 400; r <= 3900; r += 7) expect(BELTS).toContain(beltOf(r));
  });
  it("map kyu bands to belts and dan to black", () => {
    expect(beltOf(400).id).toBe("white");     // 25k
    expect(beltOf(900).id).toBe("white");     // 21k
    expect(beltOf(1000).id).toBe("yellow");   // 20k, the default profile
    expect(beltOf(1450).id).toBe("yellow");   // 16k
    expect(beltOf(1451).id).toBe("orange");   // 15k
    expect(beltOf(2000).id).toBe("green");    // 10k
    expect(beltOf(2600).id).toBe("blue");     // 4k
    expect(beltOf(3000).id).toBe("black");    // 1d
    expect(beltOf(3500).id).toBe("black");
  });
  it("kyuFloor agrees with rankOf at every boundary", () => {
    for (let k = 1; k <= 25; k++) {
      expect(rankOf(kyuFloor(k))).toBe(`${k}k`);
      if (k < 25) expect(rankOf(kyuFloor(k) - 1)).toBe(`${k + 1}k`);
    }
  });
  it("names the next belt and the rating that earns it", () => {
    expect(nextBelt(1000)).toEqual({ belt: BELTS[2], at: kyuFloor(15) });
    expect(beltOf(kyuFloor(15)).id).toBe("orange");
    expect(nextBelt(2600)).toEqual({ belt: BELTS[5], at: 3000 });
    expect(nextBelt(3200)).toBeNull();
  });
  it("gives training wheels to white and yellow only", () => {
    expect(hintsForBelt(beltOf(800))).toBe(true);
    expect(hintsForBelt(beltOf(1000))).toBe(true);
    expect(hintsForBelt(beltOf(1600))).toBe(false);
    expect(hintsForBelt(beltOf(3000))).toBe(false);
  });
});

describe("rank ladder", () => {
  it("ratingOfRank inverts rankOf across the whole ladder", async () => {
    const { RANK_LADDER, ratingOfRank, rankOf, stepRank, rankInRange } = await import("./rank.js");
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
});
