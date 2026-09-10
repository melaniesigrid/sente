import { describe, it, expect } from "vitest";
import { formatMs, spendableMs, pressureOf, faceOf, presetText, runningSide, CLOCK_PRESETS, presetById } from "./clockFace.js";
import { createClock, tick } from "../engine/clock.js";
import { createGame, play, pass, resign, timeout } from "../engine/index.js";

const absolute = (mainMs) => createClock({ type: "absolute", mainMs });
const byoyomi = (mainMs, periods = 3, periodMs = 30_000) =>
  createClock({ type: "byoyomi", mainMs, periods, periodMs });

describe("formatMs", () => {
  it("shows minutes and seconds, and hours only when there are hours", () => {
    expect(formatMs(0)).toBe("0:00");
    expect(formatMs(9_000)).toBe("0:09");
    expect(formatMs(60_000)).toBe("1:00");
    expect(formatMs(605_000)).toBe("10:05");
    expect(formatMs(3_600_000)).toBe("1:00:00");
    expect(formatMs(3_723_000)).toBe("1:02:03");
  });
  it("rounds up, so a face reads 0:00 only when the time is really gone", () => {
    expect(formatMs(1)).toBe("0:01");
    expect(formatMs(999)).toBe("0:01");
    expect(formatMs(1_000)).toBe("0:01");
    expect(formatMs(1_001)).toBe("0:02");
  });
  it("never shows negative time", () => {
    expect(formatMs(-5_000)).toBe("0:00");
  });
});

describe("spendableMs", () => {
  it("is main time before byo-yomi and the current period after", () => {
    const c = byoyomi(10_000);
    expect(spendableMs(c, "b")).toBe(10_000);
    const { clock } = tick(c, "b", 10_000);
    expect(clock.b.inByoyomi).toBe(true);
    expect(spendableMs(clock, "b")).toBe(30_000);
  });
});

describe("pressureOf", () => {
  it("reads the spendable time, not the total left", () => {
    expect(pressureOf(absolute(600_000), "b")).toBe("calm");
    expect(pressureOf(absolute(60_000), "b")).toBe("low");
    expect(pressureOf(absolute(10_000), "b")).toBe("urgent");
    expect(pressureOf(absolute(0), "b")).toBe("urgent");
  });
  it("does not shout at a player with periods in hand", () => {
    // Main time gone, but a full 30 s period to spend: low, not urgent.
    const { clock } = tick(byoyomi(5_000), "b", 5_000);
    expect(clock.b.inByoyomi).toBe(true);
    expect(clock.b.periods).toBe(3);
    expect(pressureOf(clock, "b")).toBe("low");
  });
  it("turns urgent inside the last ten seconds of a period", () => {
    let c = tick(byoyomi(1_000), "b", 1_000).clock;
    c = tick(c, "b", 21_000).clock;
    expect(pressureOf(c, "b")).toBe("urgent");
  });
});

describe("faceOf", () => {
  it("shows main time with no pips before byo-yomi", () => {
    expect(faceOf(byoyomi(600_000), "b")).toEqual({
      text: "10:00", pressure: "calm", inByoyomi: false, periods: 0, flagged: false,
    });
  });
  it("shows the current period and the periods in hand once byo-yomi starts", () => {
    const { clock } = tick(byoyomi(2_000), "b", 2_000);
    expect(faceOf(clock, "b")).toEqual({
      text: "0:30", pressure: "low", inByoyomi: true, periods: 3, flagged: false,
    });
  });
  it("counts a lost period down", () => {
    let c = tick(byoyomi(1_000), "b", 1_000).clock;
    c = tick(c, "b", 31_000).clock;
    expect(faceOf(c, "b").periods).toBe(2);
  });
  it("reads 0:00 and flagged when the side has run out", () => {
    const { clock } = tick(absolute(5_000), "b", 5_000);
    expect(clock.expired).toBe("b");
    expect(faceOf(clock, "b")).toMatchObject({ text: "0:00", pressure: "urgent", flagged: true });
  });
  it("leaves the other side alone when one flags", () => {
    const { clock } = tick(absolute(5_000), "b", 5_000);
    expect(faceOf(clock, "w").flagged).toBe(false);
  });
  it("never reports periods for a clock that has none", () => {
    expect(faceOf(absolute(1_000), "b").periods).toBe(0);
    expect(faceOf(createClock({ type: "fischer", mainMs: 1_000, incrementMs: 5_000 }), "b").periods).toBe(0);
  });
});

describe("runningSide", () => {
  const c = absolute(60_000);
  it("runs the side to move when the game times it", () => {
    expect(runningSide(c, createGame({ size: 9 }), "bw")).toBe("b");
    expect(runningSide(c, play(createGame({ size: 9 }), 4, 4), "bw")).toBe("w");
  });
  it("stops on the house player’s turn, because only the human is timed", () => {
    const g = createGame({ size: 9 });
    expect(runningSide(c, g, "b")).toBe("b");
    expect(runningSide(c, play(g, 4, 4), "b")).toBeNull();
  });
  it("stops for scoring and for a finished game", () => {
    let g = createGame({ size: 9 });
    g = pass(g); g = pass(g);
    expect(g.phase).toBe("scoring");
    expect(runningSide(c, g, "bw")).toBeNull();
    expect(runningSide(c, resign(createGame({ size: 9 })), "bw")).toBeNull();
    expect(runningSide(c, timeout(createGame({ size: 9 })), "bw")).toBeNull();
  });
  it("stops once a side has flagged, so no one is charged twice", () => {
    const { clock } = tick(absolute(1_000), "b", 1_000);
    expect(runningSide(clock, createGame({ size: 9 }), "bw")).toBeNull();
  });
  it("runs nothing when the game has no clock", () => {
    expect(runningSide(null, createGame({ size: 9 }), "bw")).toBeNull();
  });
});

describe("CLOCK_PRESETS", () => {
  it("offers none plus one of every kind the engine knows", () => {
    expect(CLOCK_PRESETS[0].preset).toBeNull();
    const types = CLOCK_PRESETS.slice(1).map((p) => p.preset.type);
    expect(new Set(types)).toEqual(new Set(["absolute", "byoyomi", "fischer"]));
  });
  it("every preset builds a clock the engine accepts", () => {
    for (const p of CLOCK_PRESETS) {
      if (p.preset) expect(() => createClock(p.preset)).not.toThrow();
    }
  });
  it("falls back to no clock for an id it does not know", () => {
    expect(presetById("nonsense").id).toBe("none");
    expect(presetById("blitz").preset.type).toBe("fischer");
  });
});

describe("presetText", () => {
  it("says what each preset is in the same words everywhere", () => {
    expect(presetText(null)).toBe("No clock");
    expect(presetText({ type: "absolute", mainMs: 600_000 })).toBe("10 min");
    expect(presetText({ type: "byoyomi", mainMs: 600_000, periods: 3, periodMs: 30_000 }))
      .toBe("10 min + 3 x 30 s");
    expect(presetText({ type: "fischer", mainMs: 300_000, incrementMs: 5_000 }))
      .toBe("5 min + 5 s / move");
  });
});
