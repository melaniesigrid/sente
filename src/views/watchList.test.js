import { describe, it, expect } from "vitest";
import { watchLine, WATCH_POLL_MS } from "./watchList.js";
import { makeT, BASE_LOCALE } from "../i18n/index.js";

const t = makeT(BASE_LOCALE);
const row = (extra = {}) => ({
  id: "g_1", size: 19, rated: true, pair: false,
  black: { id: "a", name: "Ada", tint: "mint" }, white: { id: "b", name: "Bea", tint: "coral" },
  phase: "playing", moves: 84, toPlay: "w", updatedAt: 1, ...extra,
});

describe("watchLine", () => {
  it("names both players, the board, how far along it is, and who is to move", () => {
    const line = watchLine(row(), t);
    expect(line.who).toBe("Ada vs Bea");
    expect(line.detail).toBe("19×19 · 84 moves · White to move");
  });
  it("never says 'your move': a spectator has none", () => {
    expect(watchLine(row({ toPlay: "b" }), t).detail).toContain("Black to move");
    expect(watchLine(row({ toPlay: "b" }), t).detail).not.toMatch(/your/i);
  });
  it("says counting while the players are agreeing on the dead stones", () => {
    expect(watchLine(row({ phase: "scoring" }), t).detail).toBe("19×19 · 84 moves · counting");
  });
  it("reads a fresh board as one move, not as an error", () => {
    expect(watchLine(row({ moves: 1 }), t).detail).toContain("1 move ·");
    expect(watchLine(row({ moves: undefined }), t).detail).toContain("0 moves");
  });
  it("polls gently: a glance, not a board", () => {
    expect(WATCH_POLL_MS).toBeGreaterThanOrEqual(10_000);
  });
});
