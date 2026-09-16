import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeProfile, defaultProfile, restoreSound, UNMUTE_KEY } from "./profile.js";
import { DEFAULT_TYPEFACE } from "../content/typeface.js";
import { rankOf } from "../content/rank.js";
import { GLICKO, isProvisional } from "../engine/index.js";
import { SYSTEM_THEME, HOUSE_THEME, DOJO_THEME, AUTO_STONES } from "../theme/index.js";
import { SYSTEM_LOCALE } from "../i18n/index.js";

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

describe("sanitizeProfile recall", () => {
  it("keeps well-shaped cards, drops malformed keys and entries", () => {
    const out = sanitizeProfile({
      ...defaultProfile,
      recall: {
        "atari-escape#2": { box: 1, due: "2026-09-20" },
        "no-step": { box: 0, due: "2026-09-20" },      // not a card key
        "atari-escape#x": { box: 0, due: "2026-09-20" },
        "atari-escape#3": { box: 0, due: "soon" },     // not a day key
        "atari-escape#4": "x",
      },
    });
    expect(out.recall).toEqual({ "atari-escape#2": { box: 1, due: "2026-09-20" } });
  });

  it("resets a schedule that is not an object, and says so once", () => {
    expect(sanitizeProfile({ ...defaultProfile, recall: [] }).recall).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("ships empty, so a profile that has never learned anything is asked nothing", () => {
    expect(defaultProfile.recall).toEqual({});
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
    const good = { ...defaultProfile, name: "Ada", tint: "coral", rating: 1234, wins: 3, losses: 1, streak: 2, bestStreak: 2, lessonsDone: ["ko"], problemsDone: ["p1", "p2"], tierPassed: [1, 2], sound: true, kataDate: "2026-09-09", kataStreak: 3, kataBest: 5, duelStarted: "2026-09-09", duelDate: "2026-09-09", duelResult: "B+3.5", duelMoves: 40, duelPlayed: 2, duelWins: 1, duelStreak: 1, duelBestStreak: 1, chain: ["2026-09-08", "2026-09-09"], chainBest: 5 };
    const out = sanitizeProfile(good);
    expect(out).toEqual(good);
    expect(out.lessonsDone).not.toBe(good.lessonsDone);
    expect(warn).not.toHaveBeenCalled();
  });
  /* The one field that is not left as it was found. A profile saved before the
     chain existed has an empty record and a kata streak, and those days really
     were practised, so the record is seeded from the counter on load: see
     seedFromKata in src/content/chain.js. Without it every player holding a run
     the day this shipped would have watched it reset to nothing. */
  it("seeds the practice record from a kata streak that predates it", () => {
    const out = sanitizeProfile({ kataDate: "2026-09-09", kataStreak: 3 });
    expect(out.chain).toEqual(["2026-09-07", "2026-09-08", "2026-09-09"]);
    expect(out.chainBest).toBe(3);
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
  it("keeps a known archetype and resets an unknown one to the plain player", () => {
    expect(sanitizeProfile({ ...defaultProfile, archetype: "tiger" }).archetype).toBe("tiger");
    expect(warn).not.toHaveBeenCalled();
    const out = sanitizeProfile({ ...defaultProfile, archetype: "dragon" });
    expect(out.archetype).toBe("");
    expect(warn.mock.calls[0][0]).toMatch(/archetype/);
    expect(sanitizeProfile({ ...defaultProfile, archetype: 7 }).archetype).toBe("");
  });
  it("gives a profile saved before the masks existed the plain player, without a word", () => {
    const { archetype, ...old } = defaultProfile;
    expect(archetype).toBe("");
    expect(sanitizeProfile(old).archetype).toBe("");
    expect(warn).not.toHaveBeenCalled();
  });
  it("keeps the plain player when it was chosen on purpose, and resets a null mask", () => {
    expect(sanitizeProfile({ ...defaultProfile, archetype: "" }).archetype).toBe("");
    expect(warn).not.toHaveBeenCalled();
    expect(sanitizeProfile({ ...defaultProfile, archetype: null }).archetype).toBe("");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/archetype/);
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
  it("resets a non-boolean sound flag to the default, which is on", () => {
    expect(defaultProfile.sound).toBe(true);
    expect(sanitizeProfile({ ...defaultProfile, sound: "yes" }).sound).toBe(true);
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
  it("ships following the device's language, and resets an unknown one", () => {
    expect(defaultProfile.locale).toBe(SYSTEM_LOCALE);
    expect(sanitizeProfile({}).locale).toBe(SYSTEM_LOCALE);
    expect(sanitizeProfile({ ...defaultProfile, locale: "es" }).locale).toBe("es");
    for (const bad of ["", "tlh", "es-MX", 7, null]) {
      expect(sanitizeProfile({ ...defaultProfile, locale: bad }).locale, String(bad)).toBe(SYSTEM_LOCALE);
    }
    expect(warn.mock.calls[0][0]).toMatch(/locale/);
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
    expect(sanitizeProfile({ ...defaultProfile, theme: "night" }).theme).toBe("night");
    expect(sanitizeProfile({ ...defaultProfile, theme: HOUSE_THEME }).theme).toBe(HOUSE_THEME);
    for (const bad of ["nope", "", 7, null, {}]) {
      expect(sanitizeProfile({ ...defaultProfile, theme: bad }).theme, String(bad)).toBe(SYSTEM_THEME);
    }
  });

  /* Joseki shipped ten rooms before 2026-09-15 and ships three now. A profile
     stored in one of the seven that went away is not a corrupt profile: it is a
     preference, and it is carried to the room that replaced it rather than
     reset to the default. A player who chose a dark room keeps a dark room. */
  it("carries a room that no longer exists forward instead of resetting it", () => {
    expect(sanitizeProfile({ ...defaultProfile, theme: "lacquer" }).theme).toBe("night");
    expect(sanitizeProfile({ ...defaultProfile, theme: "kaya" }).theme).toBe("tatami");
    expect(sanitizeProfile({ ...defaultProfile, theme: "house" }).theme).toBe(SYSTEM_THEME);
  });

  // A set of stones is a preference of its own, kept apart from the room: a
  // player who likes ivory keeps ivory through every room they walk into.
  it("ships letting each room choose its own stones", () => {
    expect(defaultProfile.stones).toBe(AUTO_STONES);
    expect(sanitizeProfile({}).stones).toBe(AUTO_STONES);
  });

  it("keeps a set of stones, and resets one it does not know", () => {
    expect(sanitizeProfile({ ...defaultProfile, stones: "honey" }).stones).toBe("honey");
    for (const bad of ["gravel", "", 7, null, {}]) {
      expect(sanitizeProfile({ ...defaultProfile, stones: bad }).stones, String(bad)).toBe(AUTO_STONES);
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

/* Sound was opt-in and off, and the toggle was three cards deep in the profile,
   so the common report was that the server had no sound at all. It is on by
   default now, and a profile saved under the old default is un-muted once. */
describe("restoreSound", () => {
  // These tests run in node, which has no localStorage; the real thing would be
  // there in a browser, and `restoreSound` already treats its absence as "leave
  // the profile alone", so the stub is what puts the behaviour under test.
  let store;
  beforeEach(() => {
    store = new Map();
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
  });
  afterEach(() => { delete globalThis.localStorage; });

  it("turns sound on for a profile saved while it was opt-in", () => {
    const r = restoreSound({ ...defaultProfile, sound: false });
    expect(r.changed).toBe(true);
    expect(r.profile.sound).toBe(true);
  });

  it("leaves a profile that already had sound alone, and saves nothing", () => {
    const p = { ...defaultProfile, sound: true };
    const r = restoreSound(p);
    expect(r.changed).toBe(false);
    expect(r.profile).toBe(p);
  });

  it("runs once: a mute chosen after it has run is kept", () => {
    restoreSound({ ...defaultProfile, sound: false });
    const muted = { ...defaultProfile, sound: false };
    const r = restoreSound(muted);
    expect(r.changed).toBe(false);
    expect(r.profile.sound).toBe(false);
  });

  it("marks the device even when there was nothing to change", () => {
    restoreSound({ ...defaultProfile, sound: true });
    expect(localStorage.getItem(UNMUTE_KEY)).toBe("1");
  });
});
