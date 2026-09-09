import { describe, it, expect } from "vitest";
import { dayKey, dailyProblem, previousDay, attend, liveStreak } from "./kata.js";

const probs = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("kata of the day", () => {
  it("formats a local day key", () => {
    expect(dayKey(new Date(2026, 8, 9, 23, 59))).toBe("2026-09-09");
    expect(dayKey(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
  });
  it("is deterministic per day and varies across days", () => {
    expect(dailyProblem(probs, "2026-09-09")).toBe(dailyProblem(probs, "2026-09-09"));
    const picks = new Set(Array.from({ length: 30 }, (_, i) => dailyProblem(probs, `2026-09-${String(i + 1).padStart(2, "0")}`).id));
    expect(picks.size).toBeGreaterThan(1);
    expect(dailyProblem([], "2026-09-09")).toBeNull();
  });
  it("steps back a day across month and year boundaries", () => {
    expect(previousDay("2026-09-09")).toBe("2026-09-08");
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
    expect(previousDay("2026-01-01")).toBe("2025-12-31");
  });
  it("builds a streak on consecutive days and resets after a gap", () => {
    let p = { kataDate: "", kataStreak: 0, kataBest: 0 };
    p = { ...p, ...attend(p, "2026-09-07") };
    expect(p).toEqual({ kataDate: "2026-09-07", kataStreak: 1, kataBest: 1 });
    p = { ...p, ...attend(p, "2026-09-08") };
    expect(p.kataStreak).toBe(2);
    expect(attend(p, "2026-09-08")).toEqual({});
    p = { ...p, ...attend(p, "2026-09-11") };
    expect(p).toEqual({ kataDate: "2026-09-11", kataStreak: 1, kataBest: 2 });
  });
  it("keeps yesterday's streak alive until tonight", () => {
    const p = { kataDate: "2026-09-08", kataStreak: 4, kataBest: 4 };
    expect(liveStreak(p, "2026-09-08")).toBe(4);
    expect(liveStreak(p, "2026-09-09")).toBe(4);
    expect(liveStreak(p, "2026-09-10")).toBe(0);
  });
});
