import { describe, it, expect } from "vitest";
import { createClock, tick, onMove, remainingMs, CLOCK_TYPES } from "./clock.js";

describe("createClock", () => {
  it("rejects unknown presets", () => {
    expect(() => createClock({ type: "hourglass" })).toThrow(RangeError);
    expect(() => createClock(null)).toThrow(RangeError);
  });
  it("gives both sides the same starting state", () => {
    const c = createClock({ type: "byoyomi", mainMs: 60000, periods: 3, periodMs: 10000 });
    expect(c.b).toEqual({ mainMs: 60000, periods: 3, periodMs: 10000, inByoyomi: false });
    expect(c.w).toEqual(c.b);
    expect(c.expired).toBeNull();
  });
});

describe("absolute", () => {
  it("counts down and expires at zero with a named event", () => {
    let c = createClock({ type: "absolute", mainMs: 5000 });
    let t = tick(c, "b", 3000);
    expect(t.expired).toBe(false);
    expect(t.event).toBeNull();
    expect(t.clock.b.mainMs).toBe(2000);
    expect(t.clock.w.mainMs).toBe(5000);
    t = tick(t.clock, "b", 2000);
    expect(t.expired).toBe(true);
    expect(t.event).toBe("expired");
    expect(t.clock.b.mainMs).toBe(0);
    expect(t.clock.expired).toBe("b");
  });
  it("onMove changes nothing and an expired clock stays expired", () => {
    const c = createClock({ type: "absolute", mainMs: 1000 });
    expect(onMove(c, "b")).toEqual(c);
    const dead = tick(c, "w", 5000).clock;
    expect(tick(dead, "w", 1).clock).toEqual(dead);
    expect(onMove(dead, "w")).toEqual(dead);
  });
  it("does not mutate", () => {
    const c = createClock({ type: "absolute", mainMs: 1000 });
    tick(c, "b", 400);
    expect(c.b.mainMs).toBe(1000);
  });
});

describe("byo-yomi", () => {
  const preset = { type: "byoyomi", mainMs: 10000, periods: 3, periodMs: 5000 };

  it("enters byo-yomi when main time runs out, carrying the overflow", () => {
    const t = tick(createClock(preset), "b", 12000);
    expect(t.event).toBe("byoyomi");
    expect(t.expired).toBe(false);
    expect(t.clock.b).toEqual({ mainMs: 0, periods: 3, periodMs: 3000, inByoyomi: true });
  });
  it("resets the period on a move without consuming it", () => {
    let c = tick(createClock(preset), "b", 12000).clock;
    c = onMove(c, "b");
    expect(c.b.periods).toBe(3);
    expect(c.b.periodMs).toBe(5000);
  });
  it("loses a period when one runs out", () => {
    let c = tick(createClock(preset), "b", 10000).clock;
    const t = tick(c, "b", 5000);
    expect(t.event).toBe("period-lost");
    expect(t.clock.b.periods).toBe(2);
    expect(t.clock.b.periodMs).toBe(5000);
    expect(t.expired).toBe(false);
  });
  it("consumes several periods in one long tick", () => {
    const c = tick(createClock(preset), "b", 10000).clock;
    const t = tick(c, "b", 11000);
    expect(t.event).toBe("period-lost");
    expect(t.clock.b.periods).toBe(1);
    expect(t.clock.b.periodMs).toBe(4000);
  });
  it("expires when the last period runs out", () => {
    const c = tick(createClock(preset), "b", 10000).clock;
    const t = tick(c, "b", 15000);
    expect(t.expired).toBe(true);
    expect(t.event).toBe("expired");
    expect(t.clock.b.periods).toBe(0);
    expect(t.clock.expired).toBe("b");
  });
  it("a stone played inside the last period keeps the game alive", () => {
    let c = tick(createClock(preset), "b", 10000).clock;
    c = tick(c, "b", 10000).clock; // two periods gone
    expect(c.b.periods).toBe(1);
    c = tick(c, "b", 4999).clock;
    c = onMove(c, "b");
    expect(c.b.periodMs).toBe(5000);
    expect(c.b.periods).toBe(1);
    expect(c.expired).toBeNull();
  });
  it("remainingMs sums main time and every period", () => {
    const c = createClock(preset);
    expect(remainingMs(c, "b")).toBe(10000 + 15000);
    const later = tick(c, "b", 12000).clock;
    expect(remainingMs(later, "b")).toBe(3000 + 10000);
  });
  it("only touches the side that is ticking", () => {
    const t = tick(createClock(preset), "w", 12000);
    expect(t.clock.b).toEqual(createClock(preset).b);
    expect(t.clock.w.inByoyomi).toBe(true);
  });
});

describe("fischer", () => {
  const preset = { type: "fischer", mainMs: 30000, incrementMs: 5000 };

  it("adds the increment after a move", () => {
    let c = createClock(preset);
    c = tick(c, "b", 8000).clock;
    c = onMove(c, "b");
    expect(c.b.mainMs).toBe(27000);
    expect(c.w.mainMs).toBe(30000);
  });
  it("caps at maxMs when given", () => {
    let c = createClock({ ...preset, maxMs: 32000 });
    c = onMove(c, "b");
    expect(c.b.mainMs).toBe(32000);
  });
  it("expires when main time is exhausted", () => {
    const t = tick(createClock(preset), "w", 30000);
    expect(t.expired).toBe(true);
    expect(t.event).toBe("expired");
    expect(t.clock.expired).toBe("w");
  });
  it("ignores zero and negative ticks", () => {
    const c = createClock(preset);
    expect(tick(c, "b", 0).clock).toBe(c);
    expect(tick(c, "b", -5).clock).toBe(c);
  });
});

describe("canadian overtime", () => {
  const preset = { type: "canadian", mainMs: 60_000, periodMs: 300_000, stones: 20 };

  it("spends main time first, then opens a block", () => {
    let t = tick(createClock(preset), "b", 30_000);
    expect(t.event).toBeNull();
    expect(t.clock.b.mainMs).toBe(30_000);
    expect(t.clock.b.inByoyomi).toBe(false);
    t = tick(t.clock, "b", 30_000);
    expect(t.event).toBe("byoyomi");
    expect(t.clock.b.mainMs).toBe(0);
    expect(t.clock.b.periodMs).toBe(300_000);
    expect(t.clock.b.stonesLeft).toBe(20);
  });

  it("does not renew the block by running down, only by playing the stones", () => {
    let c = tick(createClock(preset), "b", 60_000).clock;
    c = tick(c, "b", 299_000).clock;
    expect(c.b.periodMs).toBe(1_000);
    expect(c.expired).toBeNull();
    const out = tick(c, "b", 1_000);
    expect(out.expired).toBe(true);
    expect(out.event).toBe("expired");
  });

  it("renews the block, in full, on the last stone of the quota", () => {
    let c = tick(createClock({ ...preset, stones: 3 }), "b", 60_000).clock;
    c = tick(c, "b", 200_000).clock;               // 100s left of the block
    c = onMove(c, "b");
    expect(c.b.stonesLeft).toBe(2);
    expect(c.b.periodMs).toBe(100_000);            // spent time stays spent
    c = onMove(c, "b");
    expect(c.b.stonesLeft).toBe(1);
    c = onMove(c, "b");                            // the quota is met
    expect(c.b.stonesLeft).toBe(3);
    expect(c.b.periodMs).toBe(300_000);            // and the block is whole again
  });

  it("counts nothing off the quota while main time is still running", () => {
    const c = onMove(createClock(preset), "b");
    expect(c.b.stonesLeft).toBe(20);
    expect(c.b.mainMs).toBe(60_000);
  });

  it("reports what is left as main time plus one whole block", () => {
    expect(remainingMs(createClock(preset), "b")).toBe(60_000 + 300_000);
    const over = tick(createClock(preset), "b", 60_000).clock;
    expect(remainingMs(over, "b")).toBe(300_000);
  });
});

describe("simple (per-move) time", () => {
  const preset = { type: "simple", perMoveMs: 10_000 };

  it("starts every side with the allowance", () => {
    const c = createClock(preset);
    expect(c.b.mainMs).toBe(10_000);
    expect(c.w.mainMs).toBe(10_000);
    expect(remainingMs(c, "b")).toBe(10_000);
  });

  it("gives the whole allowance back after each move, spent or not", () => {
    let c = tick(createClock(preset), "b", 7_000).clock;
    expect(c.b.mainMs).toBe(3_000);
    c = onMove(c, "b");
    expect(c.b.mainMs).toBe(10_000);
    expect(c.w.mainMs).toBe(10_000);
  });

  it("flags when a single move runs over, however many have been made", () => {
    let c = createClock(preset);
    for (let i = 0; i < 30; i++) c = onMove(tick(c, "b", 9_000).clock, "b");
    const out = tick(c, "b", 10_000);
    expect(out.expired).toBe(true);
    expect(out.clock.expired).toBe("b");
  });
});

describe("the clock systems", () => {
  it("are the five a server is expected to offer, and every one can be built", () => {
    expect(CLOCK_TYPES).toEqual(["absolute", "byoyomi", "canadian", "fischer", "simple"]);
    expect(() => createClock({ type: "hourglass", mainMs: 1 })).toThrow(RangeError);
  });
});
