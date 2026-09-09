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
    expect(back.mode).toEqual({ kind: "bot", personaId: "hoshi", rank: null });
    expect(back.record).toEqual(rec);
    expect(typeof back.savedAt).toBe("number");
    expect(warn).not.toHaveBeenCalled();
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
