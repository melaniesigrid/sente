import { describe, it, expect } from "vitest";
import { mokuState, moodFor, MOKU_STATES, MOKU_FACT_STATES, MOKU_MOODS, BORED_AFTER_MS, SLEEPY_AFTER_MS } from "./moku.js";

describe("mokuState", () => {
  it("always resolves to a known state with a line", () => {
    for (const f of [{}, { view: "home" }, { view: "nope" }, { phase: "playing" }, { phase: "ended", result: "win" }]) {
      const s = mokuState(f);
      expect(MOKU_STATES).toContain(s.state);
      expect(typeof s.line).toBe("string");
      expect(s.line.length).toBeGreaterThan(0);
    }
  });
  it("orders facts: promotion beats result beats scoring beats moments beats board state", () => {
    const base = { phase: "playing", myAtari: 1, oppAtari: 1, ko: true, thinking: true, moment: "capture" };
    expect(mokuState({ ...base, result: "loss", promoted: "Orange belt" }).state).toBe("promoted");
    expect(mokuState({ ...base, result: "loss" }).state).toBe("loss");
    expect(mokuState({ ...base, phase: "scoring" }).state).toBe("scoring");
    expect(mokuState(base).state).toBe("capture");
    expect(mokuState({ ...base, moment: "captured" }).state).toBe("captured");
    expect(mokuState({ ...base, moment: null }).state).toBe("watching");
    expect(mokuState({ ...base, moment: null, thinking: false }).state).toBe("atari");
    expect(mokuState({ ...base, moment: null, thinking: false, myAtari: 0 }).state).toBe("ko");
    expect(mokuState({ ...base, moment: null, thinking: false, myAtari: 0, ko: false }).state).toBe("hunting");
    expect(mokuState({ phase: "playing" }).state).toBe("idle");
  });
  it("counts multiple groups in atari", () => {
    expect(mokuState({ phase: "playing", myAtari: 2 }).line).toBe("2 groups of yours are in atari.");
  });
  it("names the belt on promotion", () => {
    expect(mokuState({ promoted: "Green belt" }).line).toMatch(/^Green belt/);
  });
  it("speaks per view outside a game and is deterministic by seed", () => {
    expect(mokuState({ view: "play" }).state).toBe("lobby");
    expect(mokuState({ view: "learn" }).state).toBe("learn");
    expect(mokuState({ view: "tsumego" }).state).toBe("tsumego");
    expect(mokuState({ view: "home", seed: 3 })).toEqual(mokuState({ view: "home", seed: 3 }));
    const lines = new Set([0, 1, 2].map(seed => mokuState({ view: "home", seed }).line));
    expect(lines.size).toBe(3);
  });
});

describe("moku moods", () => {
  const LIVE = { phase: "playing" };

  it("keeps facts and moods disjoint, and every state has lines", () => {
    expect(MOKU_FACT_STATES.filter(s => MOKU_MOODS.includes(s))).toEqual([]);
    expect(MOKU_STATES.length).toBe(MOKU_FACT_STATES.length + MOKU_MOODS.length);
  });

  it("never lets a mood displace a board fact", () => {
    // Every mood signal at once, against each fact that should still win.
    const loud = { idleMs: SLEEPY_AFTER_MS * 10, streak: 9 };
    expect(mokuState({ ...loud, ...LIVE, myAtari: 1 }).state).toBe("atari");
    expect(mokuState({ ...loud, ...LIVE, ko: true }).state).toBe("ko");
    expect(mokuState({ ...loud, ...LIVE, oppAtari: 1 }).state).toBe("hunting");
    expect(mokuState({ ...loud, moment: "capture" }).state).toBe("capture");
    expect(mokuState({ ...loud, result: "loss" }).state).toBe("loss");
    expect(mokuState({ ...loud, promoted: "Green belt" }).state).toBe("promoted");
    expect(mokuState({ ...loud, phase: "scoring" }).state).toBe("scoring");
  });

  it("does not fall asleep on a live board — bored is as far as it goes", () => {
    expect(mokuState({ ...LIVE, idleMs: SLEEPY_AFTER_MS * 10 }).state).toBe("bored");
    expect(mokuState({ ...LIVE, idleMs: BORED_AFTER_MS }).state).toBe("bored");
    expect(mokuState({ ...LIVE, idleMs: BORED_AFTER_MS - 1 }).state).toBe("idle");
  });

  it("sleeps, then bores, off the board", () => {
    expect(mokuState({ view: "home", idleMs: SLEEPY_AFTER_MS }).state).toBe("sleepy");
    expect(mokuState({ view: "home", idleMs: BORED_AFTER_MS }).state).toBe("bored");
    expect(mokuState({ view: "home", idleMs: 0 }).state).toBe("home");
  });

  it("reads form as a signed streak", () => {
    expect(moodFor({ streak: 3 })).toBe("happy");
    expect(moodFor({ streak: 5 })).toBe("playful");
    expect(moodFor({ streak: -3 })).toBe("sad");
    expect(moodFor({ streak: 2 })).toBe(null);
    expect(moodFor({ streak: -2 })).toBe(null);
    expect(moodFor({})).toBe(null);
  });

  it("absence beats form: gone long enough is sleepy however the games went", () => {
    expect(moodFor({ streak: 9, idleMs: SLEEPY_AFTER_MS })).toBe("sleepy");
    expect(moodFor({ streak: -9, idleMs: SLEEPY_AFTER_MS })).toBe("sleepy");
  });

  it("tells a long think from a short one", () => {
    expect(mokuState({ thinking: true }).state).toBe("watching");
    expect(mokuState({ thinking: true, thinkingMs: 3999 }).state).toBe("watching");
    expect(mokuState({ thinking: true, thinkingMs: 4000 }).state).toBe("reading");
  });

  it("is proud of a solved problem, and curious about a hovered point", () => {
    expect(mokuState({ view: "tsumego", solved: true }).state).toBe("proud");
    expect(mokuState({ view: "tsumego", solved: false }).state).toBe("tsumego");
    expect(mokuState({ ...LIVE, pondering: true }).state).toBe("curious");
  });

  it("resolves every mood and fact state to a line that exists", () => {
    const seen = new Set();
    const cases = [
      {}, { view: "home" }, { view: "play" }, { view: "learn" }, { view: "tsumego" },
      { view: "ladder" }, { view: "profile" }, { phase: "playing" },
      { phase: "playing", myAtari: 1 }, { phase: "playing", ko: true },
      { phase: "playing", oppAtari: 1 }, { phase: "playing", pondering: true },
      { phase: "playing", idleMs: BORED_AFTER_MS }, { phase: "scoring" },
      { moment: "capture" }, { moment: "captured" }, { thinking: true },
      { thinking: true, thinkingMs: 9000 }, { result: "win" }, { result: "loss" },
      { result: "jigo" }, { promoted: "Green belt" }, { solved: true },
      { idleMs: SLEEPY_AFTER_MS }, { streak: 3 }, { streak: 5 }, { streak: -3 },
    ];
    for (const f of cases) {
      const s = mokuState(f);
      expect(MOKU_STATES).toContain(s.state);
      expect(s.line.length).toBeGreaterThan(0);
      seen.add(s.state);
    }
    // the moods and the new fact faces are all actually reachable
    for (const s of [...MOKU_MOODS, "reading", "curious", "proud"]) expect(seen).toContain(s);
  });
});
