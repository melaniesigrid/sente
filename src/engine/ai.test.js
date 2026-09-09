import { describe, it, expect } from "vitest";
import { idx, emptyBoard, tryPlay } from "./go.js";
import { aiChooseMove } from "./ai.js";

describe("aiChooseMove", () => {
  it("returns a legal move on an empty board", () => {
    const m = aiChooseMove(emptyBoard(), "b", null, 0);
    expect(m).not.toBeNull();
    expect(tryPlay(emptyBoard(), m[0], m[1], "b", null)).not.toBeNull();
  });
  it("takes an available capture", () => {
    const b = emptyBoard();
    b[idx(1, 1)] = "w";
    b[idx(0, 1)] = "b"; b[idx(2, 1)] = "b"; b[idx(1, 0)] = "b";
    const m = aiChooseMove(b, "b", null, 10, { noise: 0 });
    expect(m).toEqual([1, 2]);
  });
  it("never plays on the ko point", () => {
    const b = emptyBoard();
    const ko = idx(4, 4);
    for (let i = 0; i < 20; i++) {
      const m = aiChooseMove(b, "w", ko, 5);
      expect(idx(m[0], m[1])).not.toBe(ko);
    }
  });
  it("passes late in the game when nothing is worthwhile", () => {
    // Black owns the whole board with two one-point eyes. Filling either
    // eye is self-atari, so the only sensible choice is to pass.
    const b = emptyBoard().fill("b");
    b[idx(0, 0)] = null; b[idx(8, 8)] = null;
    expect(aiChooseMove(b, "b", null, 60, { noise: 0 })).toBeNull();
  });
});
