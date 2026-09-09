import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeProfile, defaultProfile } from "./profile.js";

let warn;
beforeEach(() => { warn = vi.spyOn(console, "warn").mockImplementation(() => {}); });
afterEach(() => { warn.mockRestore(); });

describe("sanitizeProfile", () => {
  it("keeps a well-formed profile intact and copies its arrays", () => {
    const good = { ...defaultProfile, name: "Ada", tint: "coral", rating: 1234, wins: 3, losses: 1, streak: 2, bestStreak: 2, lessonsDone: ["ko"], problemsDone: ["p1", "p2"], tierPassed: [1, 2], sound: true, kataDate: "2026-09-09", kataStreak: 3, kataBest: 5, duelStarted: "2026-09-09", duelDate: "2026-09-09", duelResult: "B+3.5", duelMoves: 40, duelPlayed: 2, duelWins: 1, duelStreak: 1, duelBestStreak: 1 };
    const out = sanitizeProfile(good);
    expect(out).toEqual(good);
    expect(out.lessonsDone).not.toBe(good.lessonsDone);
    expect(warn).not.toHaveBeenCalled();
  });
  it("fills missing fields from the defaults without warning", () => {
    expect(sanitizeProfile({ name: "Ada" })).toEqual({ ...defaultProfile, name: "Ada" });
    expect(warn).not.toHaveBeenCalled();
  });
  it("resets a null array and names the field once", () => {
    const out = sanitizeProfile({ ...defaultProfile, lessonsDone: null });
    expect(out.lessonsDone).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/lessonsDone/);
  });
  it("resets non-finite or non-numeric numbers", () => {
    const out = sanitizeProfile({ ...defaultProfile, rating: "1200", wins: NaN, losses: Infinity });
    expect(out.rating).toBe(1000);
    expect(out.wins).toBe(0);
    expect(out.losses).toBe(0);
    expect(warn.mock.calls[0][0]).toMatch(/rating, wins, losses/);
  });
  it("resets a wrong-typed name and an unknown tint", () => {
    const out = sanitizeProfile({ ...defaultProfile, name: 42, tint: "neon" });
    expect(out.name).toBe("Player");
    expect(out.tint).toBe("eucalyptus");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/name, tint/);
  });
  it("rejects arrays holding non-strings", () => {
    expect(sanitizeProfile({ ...defaultProfile, problemsDone: ["p1", 7] }).problemsDone).toEqual([]);
  });
  it("resets a non-boolean sound flag", () => {
    expect(sanitizeProfile({ ...defaultProfile, sound: "yes" }).sound).toBe(false);
    expect(warn.mock.calls[0][0]).toMatch(/sound/);
  });
  it("tierPassed must be an array of integer tier ids", () => {
    expect(sanitizeProfile({ ...defaultProfile, tierPassed: [1, 3] }).tierPassed).toEqual([1, 3]);
    expect(sanitizeProfile({ ...defaultProfile, tierPassed: ["1"] }).tierPassed).toEqual([]);
    expect(sanitizeProfile({ ...defaultProfile, tierPassed: [1.5] }).tierPassed).toEqual([]);
    expect(sanitizeProfile({ ...defaultProfile, tierPassed: null }).tierPassed).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(warn.mock.calls[0][0]).toMatch(/tierPassed/);
  });
  it("drops unknown keys", () => {
    expect(sanitizeProfile({ ...defaultProfile, admin: true })).not.toHaveProperty("admin");
  });
  it("falls back entirely when the stored value is not an object", () => {
    for (const raw of [null, "x", 7, [1]]) {
      expect(sanitizeProfile(raw)).toEqual(defaultProfile);
    }
    expect(warn).toHaveBeenCalledTimes(4);
  });
});
