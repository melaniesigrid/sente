import { describe, it, expect } from "vitest";
import { TRAINER, giftDue, pickGift, giftOutcome, trainerReport } from "./sensei.js";

const always = () => 0;
const never = () => 0.999;

describe("when a gift is due", () => {
  it("never before the first few moves of his own, never too soon after the last", () => {
    expect(giftDue({ ownMoves: TRAINER.firstGiftAfter - 1, moveNumber: 10, size: 9, rng: always })).toBe(false);
    expect(giftDue({ ownMoves: TRAINER.firstGiftAfter, moveNumber: 12, size: 9, rng: always })).toBe(true);
    expect(giftDue({ ownMoves: 10, moveNumber: 20, size: 9, lastGift: 10 - TRAINER.minGap + 1, rng: always })).toBe(false);
    expect(giftDue({ ownMoves: 10, moveNumber: 20, size: 9, lastGift: 10 - TRAINER.minGap, rng: always })).toBe(true);
  });

  it("never in the endgame, and only by chance otherwise", () => {
    expect(giftDue({ ownMoves: 30, moveNumber: 60, size: 9, rng: always })).toBe(false);
    expect(giftDue({ ownMoves: 10, moveNumber: 20, size: 9, rng: never })).toBe(false);
  });
});

describe("picking a gift", () => {
  const top = [
    { move: [3, 3], prob: 0.6 },
    { move: [2, 2], prob: 0.3 },   // too good to be a gift: half the best
    { move: [5, 5], prob: 0.2 },   // a third of the best: a gift
    { move: null, prob: 0.1 },     // a pass is never a gift
    { move: [0, 0], prob: 0.01 },  // too bad to be a move anybody plays
  ];
  it("takes a clearly worse move off the shortlist, and names the honest one", () => {
    const g = pickGift(top, always);
    expect(g.move).toEqual([5, 5]);
    expect(g.best).toEqual([3, 3]);
    expect(g.bestProb).toBe(0.6);
  });
  it("gives nothing when nothing on the list is worse enough yet playable", () => {
    expect(pickGift([top[0], top[1]], always)).toBeNull();
    expect(pickGift([top[0], top[4]], always)).toBeNull();
    expect(pickGift([top[0]], always)).toBeNull();
    expect(pickGift(null, always)).toBeNull();
  });
  it("never picks a pass even when it is the only worse thing", () => {
    expect(pickGift([top[0], top[3]], always)).toBeNull();
  });
});

const pt = (move, black, color = null) => ({ move, black, color });

describe("what a gift was worth", () => {
  // White gives at move 10: Black from 40% to 60%. Black's reply keeps 55%: kept.
  const points = [pt(9, 0.4, "b"), pt(10, 0.6, "w"), pt(11, 0.55, "b")];
  it("reads the gift as the giver's own loss and the reply as what was held", () => {
    const o = giftOutcome(points, 10, "w");
    expect(o.gift).toBeCloseTo(0.2);
    expect(o.kept).toBe(true);
  });
  it("calls a reply that gave it all back a miss", () => {
    const o = giftOutcome([pt(9, 0.4, "b"), pt(10, 0.6, "w"), pt(11, 0.42, "b")], 10, "w");
    expect(o.kept).toBe(false);
  });
  it("cannot say when the reply was not looked at, or the gift itself was not", () => {
    expect(giftOutcome([pt(9, 0.4, "b"), pt(10, 0.6, "w")], 10, "w").kept).toBeNull();
    expect(giftOutcome([pt(10, 0.6, "w"), pt(11, 0.5, "b")], 10, "w")).toBeNull();
  });
  it("is not a gift at all when the giver did not lose by it", () => {
    const o = giftOutcome([pt(9, 0.5, "b"), pt(10, 0.5, "w"), pt(11, 0.5, "b")], 10, "w");
    expect(o.gift).toBe(0);
    expect(o.kept).toBeNull();
  });
});

describe("the report", () => {
  const points = [
    pt(0, 0.5), pt(1, 0.5, "b"), pt(2, 0.5, "w"),
    pt(3, 0.3, "b"),   // Black's mistake: 20 points
    pt(4, 0.5, "w"),   // White's gift back
    pt(5, 0.6, "b"),   // Black gains 10 here
    pt(6, 0.6, "w"),
  ];
  it("names your turning points, your best moves and the gifts, graded", () => {
    const r = trainerReport(points, [{ move: 4, best: [1, 1] }], "b");
    expect(r.looked).toBe(7);
    expect(r.turns.map((t) => t.move)).toEqual([3]);
    expect(r.gained.map((s) => s.move)).toEqual([5]);
    expect(r.gifts).toHaveLength(1);
    expect(r.gifts[0].kept).toBe(true);
    expect(r.gifts[0].best).toEqual([1, 1]);
    expect(r.steady.moves).toBe(3);
    expect(r.worst.move).toBe(3);
  });
  it("copes with nothing looked at", () => {
    const r = trainerReport([], [{ move: 4, best: null }], "b");
    expect(r.looked).toBe(0);
    expect(r.turns).toEqual([]);
    expect(r.steady).toBeNull();
    expect(r.gifts[0].kept).toBeNull();
  });
});
