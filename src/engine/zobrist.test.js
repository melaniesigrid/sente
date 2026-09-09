import { describe, it, expect } from "vitest";
import { zobristTable, xorStone, hashBoard } from "./zobrist.js";
import { createBoard, withStone, boardFromRows } from "./board.js";

describe("zobrist", () => {
  it("is deterministic across calls and sizes", () => {
    const a = zobristTable(9), b = zobristTable(9);
    expect(a).toBe(b);
    expect(zobristTable(9).lo[0]).toBe(zobristTable(9).lo[0]);
    expect(zobristTable(9).lo[0]).not.toBe(zobristTable(19).lo[0]);
  });
  it("hashes the empty board to 0 and keeps hashes safe integers", () => {
    expect(hashBoard(createBoard(19))).toBe(0);
    let h = 0;
    for (let i = 0; i < 361; i++) h = xorStone(h, 19, i, i % 2 ? "b" : "w");
    expect(Number.isSafeInteger(h)).toBe(true);
  });
  it("xor is its own inverse", () => {
    const h0 = hashBoard(boardFromRows(["X..", "...", "..O"]));
    const h1 = xorStone(h0, 3, 4, "b");
    expect(h1).not.toBe(h0);
    expect(xorStone(h1, 3, 4, "b")).toBe(h0);
  });
  it("distinguishes colour at the same point", () => {
    expect(xorStone(0, 9, 40, "b")).not.toBe(xorStone(0, 9, 40, "w"));
  });
  it("incremental and full hashing agree", () => {
    let b = createBoard(13);
    let h = 0;
    const stones = [[3, 3, "b"], [9, 9, "w"], [6, 6, "b"], [3, 9, "w"]];
    for (const [c, r, col] of stones) {
      b = withStone(b, c, r, col);
      h = xorStone(h, 13, r * 13 + c, col);
    }
    expect(hashBoard(b)).toBe(h);
  });
  it("is order independent (same position, same hash)", () => {
    const a = withStone(withStone(createBoard(9), 1, 1, "b"), 2, 2, "w");
    const b = withStone(withStone(createBoard(9), 2, 2, "w"), 1, 1, "b");
    expect(hashBoard(a)).toBe(hashBoard(b));
  });
});
