import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeProfile, defaultProfile } from "./profile.js";
import { DEFAULT_TYPEFACE } from "../content/typeface.js";
import { rankOf } from "../content/rank.js";
import { GLICKO, isProvisional } from "../engine/index.js";
import { SYSTEM_THEME, HOUSE_THEME, DOJO_THEME } from "../theme/index.js";

let warn;
beforeEach(() => { warn = vi.spyOn(console, "warn").mockImplementation(() => {}); });
afterEach(() => { warn.mockRestore(); });

describe("sanitizeProfile bookProgress", () => {
  it("keeps well-shaped entries, drops malformed ones, resets a wrong value", () => {
    const out = sanitizeProfile({ ...defaultProfile, bookProgress: { "shusaku-vs-gennan": { stops: 3, score: 5, total: 12 }, bad: { stops: -1 }, worse: "x" } });
    expect(out.bookProgress).toEqual({ "shusaku-vs-gennan": { stops: 3, score: 5, total: 12 } });
    expect(out.bookProgress).not.toBe(defaultProfile.bookProgress);
    expect(sanitizeProfile({ ...defaultProfile, bookProgress: [] }).bookProgress).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("the seed", () => {
  it("seats a new player at 10k, unproven, the way OGS does", () => {
    expect(rankOf(defaultProfile.rating)).toBe("10k");
    expect(defaultProfile.rd).toBe(GLICKO.rd);
    expect(isProvisional(defaultProfile.rd)).toBe(true);
  });
});

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
    expect(out.rating).toBe(defaultProfile.rating);
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
  it("keeps a known typeface id and resets an unknown one", () => {
    expect(sanitizeProfile({ ...defaultProfile, typeface: "vitrine" }).typeface).toBe("vitrine");
    for (const bad of ["", "helvetica", 7, null]) {
      expect(sanitizeProfile({ ...defaultProfile, typeface: bad }).typeface).toBe(DEFAULT_TYPEFACE);
    }
    expect(warn.mock.calls[0][0]).toMatch(/typeface/);
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

describe("the stored palette", () => {
  const MINE = { ground: "#101014", ink: "#e6e6ea", accent: "#b98cff", cream: "#f2f2f6" };

  // Someone opening Joseki at night on a dark machine should not be handed
  // full-brightness cream and left to go find the setting.
  it("ships following the device", () => {
    expect(defaultProfile.theme).toBe(SYSTEM_THEME);
    expect(defaultProfile.dojo).toBeNull();
    expect(sanitizeProfile({}).theme).toBe(SYSTEM_THEME);
  });

  it("keeps a named room, and resets one it does not know", () => {
    expect(sanitizeProfile({ ...defaultProfile, theme: "lacquer" }).theme).toBe("lacquer");
    expect(sanitizeProfile({ ...defaultProfile, theme: HOUSE_THEME }).theme).toBe(HOUSE_THEME);
    for (const bad of ["nope", "", 7, null, {}]) {
      expect(sanitizeProfile({ ...defaultProfile, theme: bad }).theme, String(bad)).toBe(SYSTEM_THEME);
    }
  });

  it("keeps a dojo palette, and the theme that points at it", () => {
    const out = sanitizeProfile({ ...defaultProfile, theme: DOJO_THEME, dojo: MINE });
    expect(out.theme).toBe(DOJO_THEME);
    expect(out.dojo.ground).toBe("#101014");
  });

  it("refuses to wear a dojo room that is not there", () => {
    const out = sanitizeProfile({ ...defaultProfile, theme: DOJO_THEME, dojo: { ground: "red" } });
    expect(out.theme).toBe(SYSTEM_THEME);
    expect(out.dojo).toBeNull();
    expect(warn.mock.calls[0][0]).toMatch(/theme|dojo/);
  });

  it("does not let a stored palette alias the profile it came from", () => {
    const stored = { ...defaultProfile, theme: DOJO_THEME, dojo: { ...MINE, evil: "x" } };
    const out = sanitizeProfile(stored);
    expect(out.dojo).not.toBe(stored.dojo);
    expect(out.dojo).not.toHaveProperty("evil");
  });
});
