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
  /* A view with nothing to count passes a string naming what it is showing.
     Math.floor made that NaN, and NaN reached past the end of the list and put
     the catalogue key on the screen: Moku said "moku.idle.NaN" out loud on the
     joseki screen, in every language. */
  it("takes a string seed and still says something", () => {
    const spoken = mokuState({ view: "joseki", seed: "hoshi:5" });
    expect(spoken.line).not.toMatch(/NaN|^moku\./);
    expect(spoken.line.length).toBeGreaterThan(0);
    expect(mokuState({ view: "joseki", seed: "hoshi:5" })).toEqual(spoken);
    expect(mokuState({ view: "joseki", seed: undefined }).line.length).toBeGreaterThan(0);
  });

  /* A seed arrives from whatever the screen happens to be counting, and a
     count is only a number while the thing being counted exists. NaN is the
     shape that got through before: `?? 0` catches a missing seed and not a
     spoiled one. */
  it("says something whatever junk arrives as a seed", () => {
    for (const seed of [NaN, Infinity, -Infinity, -3, 2.7, true, {}, [], null]) {
      const spoken = mokuState({ view: "home", seed });
      expect(MOKU_STATES, String(seed)).toContain(spoken.state);
      expect(spoken.line, String(seed)).not.toMatch(/NaN|undefined|^moku\./);
      expect(spoken.line.length, String(seed)).toBeGreaterThan(0);
    }
  });

  /* Deterministic by seed is the promise, and a hash that answered the same
     for every string would keep it while quietly making Moku say one line
     forever on the screens that pass one. */
  it("spreads string seeds over the list rather than parking on one line", () => {
    const lines = new Set(
      ["hoshi:0", "hoshi:5", "komoku:2", "takamoku:11", "none:0", "sansan:7", "mokuhazushi:3"]
        .map(seed => mokuState({ view: "joseki", seed }).line),
    );
    expect(lines.size).toBeGreaterThan(1);
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
