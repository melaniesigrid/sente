import { describe, it, expect } from "vitest";
import {
  FIELD_N, SETTLED, LONGEST, freshField, stepField, advanceField, fieldSpent, fieldStones,
  departed,
} from "./fieldGame.js";
import { createBoard, withStone } from "../engine/index.js";

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

describe("what came off the board", () => {
  const board = (...stones) => {
    let b = createBoard(FIELD_N);
    for (const [c, r, colour] of stones) b = withStone(b, c, r, colour);
    return b;
  };

  it("names the stone that is gone, and nothing else", () => {
    const before = board([3, 3, "b"], [4, 3, "w"], [5, 5, "b"]);
    const after = board([3, 3, "b"], [5, 5, "b"]);
    expect(departed(before, after)).toEqual([
      { i: 3 * FIELD_N + 4, c: 4, r: 3, colour: "w" },
    ]);
  });

  it("says nothing when a stone is only added", () => {
    const before = board([3, 3, "b"]);
    const after = board([3, 3, "b"], [4, 3, "w"]);
    expect(departed(before, after)).toEqual([]);
    expect(departed(before, before)).toEqual([]);
  });

  it("counts a point that changed hands, because a stone did come off it", () => {
    const before = board([3, 3, "b"]);
    const after = board([3, 3, "w"]);
    expect(departed(before, after)).toEqual([
      { i: 3 * FIELD_N + 3, c: 3, r: 3, colour: "b" },
    ]);
  });

  it("finds every stone of a captured group", () => {
    const before = board([3, 3, "w"], [4, 3, "w"], [5, 3, "w"], [9, 9, "b"]);
    const after = board([9, 9, "b"]);
    expect(departed(before, after).map(s => s.c)).toEqual([3, 4, 5]);
    expect(departed(before, after).every(s => s.colour === "w")).toBe(true);
  });

  it("answers rather than throws when it is handed nothing usable", () => {
    expect(departed(null, board())).toEqual([]);
    expect(departed(board(), null)).toEqual([]);
    expect(departed(createBoard(9), createBoard(13))).toEqual([]);
  });

  it("agrees with a capture the engine actually made", () => {
    // Black surrounds a white stone on the edge and takes it.
    const before = board([0, 0, "w"], [1, 0, "b"]);
    const after = board([1, 0, "b"], [0, 1, "b"]);
    const gone = departed(before, after);
    expect(gone.length).toBe(1);
    expect(gone[0]).toMatchObject({ c: 0, r: 0, colour: "w" });
  });
});
