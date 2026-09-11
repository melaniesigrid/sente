import { describe, it, expect } from "vitest";
import {
  FIELD_N, SETTLED, LONGEST, freshField, stepField, advanceField, fieldSpent, fieldStones,
} from "./fieldGame.js";

describe("the field's game", () => {
  it("deals an empty board of the size the page is about", () => {
    const s = freshField();
    expect(s.board.size).toBe(FIELD_N);
    expect(s.board.cells.every(c => c === null)).toBe(true);
    expect(s.turn).toBe("b");
  });

  it("puts a stone down and hands the turn over", () => {
    const s = stepField(freshField());
    expect(s.n).toBe(1);
    expect(s.turn).toBe("w");
    expect(fieldStones(s.board).length).toBe(1);
  });

  it("settles into a position with both colours on it", () => {
    const s = advanceField(freshField(), SETTLED);
    expect(s.n).toBe(SETTLED);
    const stones = fieldStones(s.board);
    expect(stones.some(p => p.colour === "b")).toBe(true);
    expect(stones.some(p => p.colour === "w")).toBe(true);
    // Captures mean stones on the board can be fewer than moves played, never more.
    expect(stones.length).toBeLessThanOrEqual(SETTLED);
    expect(stones.length).toBeGreaterThan(SETTLED / 2);
  });

  it("reports where every stone is, and nothing about the empty points", () => {
    const s = advanceField(freshField(), 12);
    for (const p of fieldStones(s.board)) {
      expect(s.board.cells[p.i]).toBe(p.colour);
      expect(p.i).toBe(p.r * FIELD_N + p.c);
    }
    expect(fieldStones(s.board).length).toBe(s.board.cells.filter(Boolean).length);
  });

  it("calls a game spent rather than letting it spin", () => {
    expect(fieldSpent(freshField())).toBe(false);
    expect(fieldSpent({ ...freshField(), passes: 2 })).toBe(true);
    expect(fieldSpent({ ...freshField(), n: LONGEST })).toBe(true);
  });

  // The whole point of advancing in chunks is that a chunk is bounded work.
  // A spent game must stop the walk rather than burn the rest of the budget.
  it("stops early once the game is spent", () => {
    const spent = { ...freshField(), passes: 2 };
    expect(advanceField(spent, 500)).toBe(spent);
  });
});
