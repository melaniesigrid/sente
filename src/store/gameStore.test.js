import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { saveGame, loadGame, clearGame, GAME_KEY, GAME_STORE_VERSION } from "./gameStore.js";
import { createGame, play, pass } from "../engine/index.js";

const memStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _map: m,
  };
};

let warn;
beforeEach(() => { warn = vi.spyOn(console, "warn").mockImplementation(() => {}); });
afterEach(() => { warn.mockRestore(); });

describe("gameStore", () => {
  it("saves and loads a replayable record with its mode", () => {
    const s = memStorage();
    let rec = createGame({ size: 9 });
    rec = play(rec, 4, 4); rec = play(rec, 2, 2); rec = pass(rec);
    expect(saveGame({ record: rec, mode: { kind: "bot", personaId: "hoshi" } }, s)).toBe(true);
    const back = loadGame(s);
    expect(back.mode).toEqual({ kind: "bot", personaId: "hoshi", rank: null, key: null, coaching: false });
    expect(back.record).toEqual(rec);
    expect(typeof back.savedAt).toBe("number");
    expect(warn).not.toHaveBeenCalled();
  });
  it("keeps a daily duel's day key and drops a non-string one", () => {
    const s = memStorage();
    saveGame({ record: createGame({ size: 9 }), mode: { kind: "duel", personaId: "tetsu", key: "2026-09-09" } }, s);
    expect(loadGame(s).mode).toEqual({ kind: "duel", personaId: "tetsu", rank: null, key: "2026-09-09", coaching: false });
    saveGame({ record: createGame({ size: 9 }), mode: { kind: "duel", personaId: "tetsu", key: 7 } }, s);
    expect(loadGame(s).mode.key).toBeNull();
  });
  it("carries the coaching flag and the coach's memory across a reload", () => {
    const s = memStorage();
    const spoken = { "empty-triangle": { count: 1, lastMove: 12 } };
    saveGame({ record: createGame({ size: 9 }), mode: { kind: "bot", personaId: "yuki", coaching: true }, spoken }, s);
    const back = loadGame(s);
    expect(back.mode.coaching).toBe(true);
    expect(back.spoken).toEqual(spoken);
  });
  it("defaults coaching to false, so a game that had no help is never marked as if it did", () => {
    const s = memStorage();
    saveGame({ record: createGame({ size: 9 }), mode: { kind: "bot", personaId: "yuki" } }, s);
    expect(loadGame(s).mode.coaching).toBe(false);
    expect(loadGame(s).spoken).toEqual({});
  });
  it("reads a blob written before coaching existed as an uncoached game", () => {
    // The safe direction: a missing flag can only ever restore a rating, never grant
    // one to a game that had the coach whispering.
    const s = memStorage();
    const blob = {
      version: GAME_STORE_VERSION, savedAt: Date.now(),
      mode: { kind: "bot", personaId: "yuki", rank: null, key: null },
      record: createGame({ size: 9 }),
    };
    s.setItem(GAME_KEY, JSON.stringify(blob));
    const back = loadGame(s);
    expect(back.mode.coaching).toBe(false);
    expect(back.spoken).toEqual({});
  });
  it("refuses a spoken map that is not an object", () => {
    const s = memStorage();
    for (const bad of ["nope", 7, ["a"], null]) {
      const blob = {
        version: GAME_STORE_VERSION, savedAt: Date.now(),
        mode: { kind: "bot", personaId: "yuki", rank: null, key: null, coaching: true },
        spoken: bad,
        record: createGame({ size: 9 }),
      };
      s.setItem(GAME_KEY, JSON.stringify(blob));
      expect(loadGame(s).spoken, String(bad)).toEqual({});
    }
  });
  it("treats a truthy-but-not-true coaching value as not coached", () => {
    const s = memStorage();
    const blob = {
      version: GAME_STORE_VERSION, savedAt: Date.now(),
      mode: { kind: "bot", personaId: "yuki", rank: null, key: null, coaching: "yes" },
      record: createGame({ size: 9 }),
    };
    s.setItem(GAME_KEY, JSON.stringify(blob));
    expect(loadGame(s).mode.coaching).toBe(false);
  });
  it("returns null when nothing is stored, without warning", () => {
    expect(loadGame(memStorage())).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });
  it("clearGame empties the slot", () => {
    const s = memStorage();
    saveGame({ record: createGame({ size: 9 }), mode: { kind: "local" } }, s);
    clearGame(s);
    expect(loadGame(s)).toBeNull();
  });
  it("discards corrupt JSON with one warning and removes it", () => {
    const s = memStorage();
    s.setItem(GAME_KEY, "{not json");
    expect(loadGame(s)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/not JSON/);
    expect(s.getItem(GAME_KEY)).toBeNull();
  });
  it("discards a version mismatch", () => {
    const s = memStorage();
    s.setItem(GAME_KEY, JSON.stringify({ version: GAME_STORE_VERSION + 1, mode: { kind: "local" }, record: createGame({ size: 9 }) }));
    expect(loadGame(s)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/version/);
    expect(s.getItem(GAME_KEY)).toBeNull();
  });
  it("discards a malformed blob and a record that does not replay", () => {
    const s = memStorage();
    s.setItem(GAME_KEY, JSON.stringify({ version: GAME_STORE_VERSION, record: { moves: "no" }, mode: { kind: "local" } }));
    expect(loadGame(s)).toBeNull();
    expect(warn.mock.calls[0][0]).toMatch(/malformed/);
    const rec = createGame({ size: 9 });
    const tampered = { ...rec, moves: [{ type: "play", color: "b", c: 4, r: 4 }, { type: "play", color: "w", c: 4, r: 4 }] };
    s.setItem(GAME_KEY, JSON.stringify({ version: GAME_STORE_VERSION, record: tampered, mode: { kind: "local" } }));
    expect(loadGame(s)).toBeNull();
    expect(warn.mock.calls[1][0]).toMatch(/does not replay/);
    expect(s.getItem(GAME_KEY)).toBeNull();
  });
  it("copes with no storage at all", () => {
    expect(saveGame({ record: createGame({ size: 9 }), mode: { kind: "local" } }, null)).toBe(false);
    expect(loadGame(null)).toBeNull();
    expect(() => clearGame(null)).not.toThrow();
  });
  it("copes with a storage that throws", () => {
    const bad = { getItem: () => { throw new Error("quota"); }, setItem: () => { throw new Error("quota"); }, removeItem: () => {} };
    expect(saveGame({ record: createGame({ size: 9 }), mode: { kind: "local" } }, bad)).toBe(false);
    expect(loadGame(bad)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("saved rank", () => {
  it("round-trips the rank the bot game was played at", async () => {
    const { saveGame, loadGame } = await import("./gameStore.js");
    const { createGame } = await import("../engine/index.js");
    const s = new Map();
    const store = { getItem: (k) => s.get(k) ?? null, setItem: (k, v) => s.set(k, v), removeItem: (k) => s.delete(k) };
    saveGame({ record: createGame({ size: 9 }), mode: { kind: "bot", personaId: "yuki", rank: "7k" } }, store);
    expect(loadGame(store).mode.rank).toBe("7k");
  });
});
