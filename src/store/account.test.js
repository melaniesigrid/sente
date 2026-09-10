import { describe, it, expect, vi } from "vitest";
import { loadAccount, saveAccount, clearAccount, ACCOUNT_KEY } from "./account.js";

const mem = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), size: () => m.size };
};
const token = "a".repeat(64);
const player = { id: "p_1", name: "Ada", rating: 1500 };

describe("account store", () => {
  it("round-trips a token and player", () => {
    const s = mem();
    expect(saveAccount({ token, player }, s)).toBe(true);
    expect(loadAccount(s)).toEqual({ token, player });
    clearAccount(s);
    expect(loadAccount(s)).toBeNull();
  });
  it("refuses to save a malformed token", () => {
    const s = mem();
    expect(saveAccount({ token: "short", player }, s)).toBe(false);
    expect(saveAccount({ token, player: null }, s)).toBe(false);
    expect(s.size()).toBe(0);
  });
  it("drops garbage from storage with one warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const raw of ["{", "[]", JSON.stringify({ token: "x", player }), JSON.stringify({ token, player: {} })]) {
      const s = mem();
      s.setItem(ACCOUNT_KEY, raw);
      expect(loadAccount(s)).toBeNull();
      expect(s.getItem(ACCOUNT_KEY)).toBeNull();
    }
    expect(warn).toHaveBeenCalledTimes(4);
    warn.mockRestore();
  });
  it("is quiet without storage", () => {
    expect(loadAccount(null)).toBeNull();
    expect(saveAccount({ token, player }, null)).toBe(false);
    expect(() => clearAccount(null)).not.toThrow();
  });
});
