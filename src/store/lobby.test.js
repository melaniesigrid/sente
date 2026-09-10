import { describe, it, expect } from "vitest";
import { sanitizeLobby, loadLobby, saveLobby, defaultLobby, LOBBY_KEY, KOMI_STEPS } from "./lobby.js";

const memStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
};

describe("lobby preferences", () => {
  it("defaults to 19x19, AGA rules, no handicap, no clock, the board's own komi", () => {
    expect(defaultLobby).toEqual({ rules: "aga", size: 19, handicap: 0, komi: null, clock: "none" });
    expect(loadLobby(memStorage())).toEqual(defaultLobby);
    expect(loadLobby(null)).toEqual(defaultLobby);
  });
  it("round-trips a table", () => {
    const s = memStorage();
    const table = { rules: "japanese", size: 13, handicap: 4, komi: 4.5, clock: "standard" };
    expect(saveLobby(table, s)).toBe(true);
    expect(loadLobby(s)).toEqual(table);
  });
  it("falls back per field on junk", () => {
    expect(sanitizeLobby(null)).toEqual(defaultLobby);
    expect(sanitizeLobby({ size: 11, handicap: 3 })).toEqual({ ...defaultLobby, handicap: 3 });
    expect(sanitizeLobby({ size: 9, handicap: 1 })).toEqual({ ...defaultLobby, size: 9 });
    expect(sanitizeLobby({ clock: "blitz" })).toEqual({ ...defaultLobby, clock: "blitz" });
    expect(sanitizeLobby({ clock: "made-up" })).toEqual(defaultLobby);
    expect(sanitizeLobby({ size: "19", handicap: 12 })).toEqual(defaultLobby);
    expect(sanitizeLobby({ rules: "ing" })).toEqual(defaultLobby);
    expect(sanitizeLobby({ rules: "nz" })).toEqual({ ...defaultLobby, rules: "nz" });
    expect(sanitizeLobby({ komi: 7.25 })).toEqual(defaultLobby);
    expect(KOMI_STEPS.every(k => sanitizeLobby({ komi: k }).komi === k)).toBe(true);
    expect(KOMI_STEPS).toContain(7);      // New Zealand komi is a whole number
    expect(KOMI_STEPS).toContain(0);      // and a handicap game there has none at all
    const s = memStorage();
    s.setItem(LOBBY_KEY, "{not json");
    expect(loadLobby(s)).toEqual(defaultLobby);
  });
  it("says so when it cannot write, and sanitizes what it does write", () => {
    expect(saveLobby({ size: 9, handicap: 0 }, null)).toBe(false);
    const full = { getItem: () => null, setItem: () => { throw new Error("quota exceeded"); } };
    expect(saveLobby({ size: 9, handicap: 0 }, full)).toBe(false);
    const s = memStorage();
    saveLobby({ size: 11, handicap: 1 }, s);
    expect(loadLobby(s)).toEqual(defaultLobby);
  });
});
