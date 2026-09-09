import { describe, it, expect } from "vitest";
import { mokuState, MOKU_STATES } from "./moku.js";

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
