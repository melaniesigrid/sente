import { describe, it, expect } from "vitest";
import {
  RETAIN_DAYS, DEFAULT_DAYS, MAX_DAYS,
  dayOf, dayBefore, emptyDay, counted, raised, isFinish, sealed, stale,
  clampDays, recent, nextSeal,
} from "./rollup.js";

const at = (iso) => Date.parse(iso);

describe("the day a moment belongs to", () => {
  it("is the UTC date, not a local one", () => {
    expect(dayOf(at("2026-09-11T00:00:00Z"))).toBe("2026-09-11");
    expect(dayOf(at("2026-09-11T23:59:59Z"))).toBe("2026-09-11");
    // Late evening in the Americas is already tomorrow here, on purpose.
    expect(dayOf(at("2026-09-11T23:00:00-05:00"))).toBe("2026-09-12");
  });
  it("steps back a day across a month and a year boundary", () => {
    expect(dayBefore("2026-09-11")).toBe("2026-09-10");
    expect(dayBefore("2026-09-01")).toBe("2026-08-31");
    expect(dayBefore("2026-01-01")).toBe("2025-12-31");
    expect(dayBefore("2028-03-01")).toBe("2028-02-29"); // a leap year
  });
});

describe("counting", () => {
  it("starts a day at nothing at all", () => {
    expect(emptyDay()).toEqual({ newAccounts: 0, gamesStarted: 0, gamesFinished: 0, peakOnline: 0 });
  });
  it("adds without touching the other fields", () => {
    const day = counted(counted(emptyDay(), "newAccounts"), "gamesStarted", 3);
    expect(day).toEqual({ newAccounts: 1, gamesStarted: 3, gamesFinished: 0, peakOnline: 0 });
  });
  it("never mutates the day it was handed", () => {
    const before = emptyDay();
    counted(before, "newAccounts");
    expect(before.newAccounts).toBe(0);
  });
  it("tolerates a field a older row did not have", () => {
    expect(counted({}, "gamesStarted").gamesStarted).toBe(1);
  });
});

describe("the high-water mark", () => {
  it("rises and never falls", () => {
    let day = raised(emptyDay(), 4);
    expect(day.peakOnline).toBe(4);
    day = raised(day, 2);
    expect(day.peakOnline).toBe(4);
    day = raised(day, 9);
    expect(day.peakOnline).toBe(9);
  });
});

describe("telling a new game from a finished one", () => {
  // A room reports itself through one call for both, so this is the only thing
  // standing between gamesStarted and gamesFinished counting the same event.
  it("reads endedAt, which the room sets only when the game is over", () => {
    expect(isFinish({ id: "g1", endedAt: null })).toBe(false);
    expect(isFinish({ id: "g1" })).toBe(false);
    expect(isFinish({ id: "g1", endedAt: 1_700_000_000_000 })).toBe(true);
  });
  it("is false for nothing at all rather than throwing", () => {
    expect(isFinish(null)).toBe(false);
    expect(isFinish(undefined)).toBe(false);
  });
});

describe("sealing a day", () => {
  it("carries the date and the account level alongside the counters", () => {
    const day = counted(emptyDay(), "gamesFinished", 2);
    expect(sealed(day, "2026-09-10", 7)).toEqual({
      date: "2026-09-10", accounts: 7,
      newAccounts: 0, gamesStarted: 0, gamesFinished: 2, peakOnline: 0,
    });
  });
  it("fills in every counter for a day nobody touched", () => {
    // A day the object slept through seals as zeros, so the series has no gap.
    expect(sealed(emptyDay(), "2026-09-10", 1)).toMatchObject({
      date: "2026-09-10", accounts: 1, gamesStarted: 0, peakOnline: 0,
    });
  });
  it("fills in a counter a row from an older shape is missing", () => {
    expect(sealed({ gamesStarted: 4 }, "2026-09-10", 1)).toMatchObject({
      gamesStarted: 4, newAccounts: 0, gamesFinished: 0, peakOnline: 0,
    });
  });
});

describe("the retained window", () => {
  const today = "2026-09-11";
  it("keeps exactly RETAIN_DAYS days, today included", () => {
    const oldest = dayOf(Date.parse(`${today}T00:00:00Z`) - (RETAIN_DAYS - 1) * 86_400_000);
    expect(stale([oldest], today)).toEqual([]);
    expect(stale([dayBefore(oldest)], today)).toEqual([dayBefore(oldest)]);
  });
  it("names only the rows that fell out", () => {
    const dates = ["2024-01-01", "2026-09-10", today];
    expect(stale(dates, today)).toEqual(["2024-01-01"]);
  });
  it("is a promise the code keeps, not only one the notice makes", () => {
    // The privacy notice quotes RETAIN_DAYS. If this ever stops deleting, the
    // notice becomes a sentence describing behaviour the code does not have.
    expect(stale(["2000-01-01"], today)).toHaveLength(1);
  });
});

describe("how many days a caller may ask for", () => {
  it("defaults when the parameter is missing or nonsense", () => {
    for (const v of [null, undefined, "", "many", NaN, {}]) expect(clampDays(v)).toBe(DEFAULT_DAYS);
  });
  it("reads a number given as a string, which is how it arrives", () => {
    expect(clampDays("30")).toBe(30);
  });
  it("clamps to the retained window at the top and one day at the bottom", () => {
    expect(clampDays(9999)).toBe(MAX_DAYS);
    expect(clampDays(0)).toBe(1);
    expect(clampDays(-5)).toBe(1);
  });
});

describe("the window a request gets back", () => {
  const today = "2026-09-11";
  const rows = [
    { date: "2026-09-11", accounts: 3 },
    { date: "2026-09-09", accounts: 2 },
    { date: "2026-06-01", accounts: 1 },
  ];
  it("comes back oldest first whatever order storage gave", () => {
    expect(recent(rows, 30, today).map(r => r.date)).toEqual(["2026-09-09", "2026-09-11"]);
  });
  it("filters by date rather than by count, so a gap is not padded over", () => {
    expect(recent(rows, 3, today).map(r => r.date)).toEqual(["2026-09-09", "2026-09-11"]);
    expect(recent(rows, 1, today).map(r => r.date)).toEqual(["2026-09-11"]);
  });
  it("clamps the window it was asked for", () => {
    expect(recent(rows, 100000, today)).toHaveLength(3);
  });
  it("survives a row with no date in it", () => {
    expect(recent([...rows, null, {}], 30, today).map(r => r.date)).toEqual(["2026-09-09", "2026-09-11"]);
  });
});

describe("when the next seal is due", () => {
  it("is today's 00:05 when the object woke before it", () => {
    expect(nextSeal(at("2026-09-11T00:01:00Z"))).toBe(at("2026-09-11T00:05:00Z"));
  });
  it("is tomorrow's once today's has passed", () => {
    expect(nextSeal(at("2026-09-11T09:00:00Z"))).toBe(at("2026-09-12T00:05:00Z"));
  });
  it("is never a moment already gone, which would wake the object in a loop", () => {
    // Re-arming happens from inside the alarm, at roughly 00:05 itself.
    const now = at("2026-09-11T00:05:00Z");
    expect(nextSeal(now)).toBeGreaterThan(now);
    expect(nextSeal(now)).toBe(at("2026-09-12T00:05:00Z"));
  });
  it("crosses a month end", () => {
    expect(nextSeal(at("2026-08-31T12:00:00Z"))).toBe(at("2026-09-01T00:05:00Z"));
  });
});
