import { describe, it, expect } from "vitest";
import {
  createBoard, idx, inB, colRow, starPoints, chainAt, withStone, boardFromRows, boardToRows,
  COLUMN_LETTERS, colLabel, rowLabel, pointLabel,
} from "./board.js";

describe("createBoard", () => {
  it.each([9, 13, 19])("makes an empty %ix%i board", (n) => {
    const b = createBoard(n);
    expect(b.size).toBe(n);
    expect(b.cells).toHaveLength(n * n);
    expect(b.cells.every(v => v === null)).toBe(true);
  });
  it("rejects nonsense sizes", () => {
    expect(() => createBoard(0)).toThrow(RangeError);
    expect(() => createBoard(4.5)).toThrow(RangeError);
    expect(() => createBoard(26)).toThrow(RangeError);
  });
});

describe("idx / inB / colRow", () => {
  it("indexes row-major with the size", () => {
    expect(idx(9, 0, 0)).toBe(0);
    expect(idx(9, 8, 0)).toBe(8);
    expect(idx(9, 0, 1)).toBe(9);
    expect(idx(19, 3, 3)).toBe(60);
    expect(colRow(19, 60)).toEqual([3, 3]);
    expect(colRow(13, 168)).toEqual([12, 12]);
  });
  it("bounds-checks per size", () => {
    expect(inB(9, 8, 8)).toBe(true);
    expect(inB(9, 9, 0)).toBe(false);
    expect(inB(13, 12, 12)).toBe(true);
    expect(inB(13, 13, 0)).toBe(false);
    expect(inB(19, -1, 5)).toBe(false);
    expect(inB(19, 18, 18)).toBe(true);
  });
});

describe("starPoints", () => {
  it("gives the five 3-3 hoshi plus tengen on 9x9", () => {
    expect(starPoints(9)).toEqual([
      { c: 2, r: 2 }, { c: 6, r: 2 }, { c: 2, r: 6 }, { c: 6, r: 6 }, { c: 4, r: 4 },
    ]);
  });
  it("gives four 4-4 points plus tengen on 13x13", () => {
    const pts = starPoints(13);
    expect(pts).toHaveLength(5);
    expect(pts).toContainEqual({ c: 3, r: 3 });
    expect(pts).toContainEqual({ c: 9, r: 9 });
    expect(pts).toContainEqual({ c: 6, r: 6 });
  });
  it("gives nine points on 19x19", () => {
    const pts = starPoints(19);
    expect(pts).toHaveLength(9);
    expect(pts).toContainEqual({ c: 3, r: 3 });
    expect(pts).toContainEqual({ c: 15, r: 15 });
    expect(pts).toContainEqual({ c: 9, r: 9 });
    expect(pts).toContainEqual({ c: 3, r: 9 });
    expect(pts).toContainEqual({ c: 9, r: 15 });
  });
});

describe("chainAt", () => {
  it("floods a connected group and counts its liberties", () => {
    const b = boardFromRows([
      "XX.......",
      "X........",
      ".........",
      ".........", ".........", ".........", ".........", ".........", ".........",
    ]);
    const ch = chainAt(b, 0, 0);
    expect(ch.stones).toHaveLength(3);
    expect(ch.libs.size).toBe(3);
  });
  it("does not cross colours", () => {
    const b = boardFromRows([
      "XO.......",
      "OX.......",
      ".........",
      ".........", ".........", ".........", ".........", ".........", ".........",
    ]);
    expect(chainAt(b, 0, 0).stones).toEqual([[0, 0]]);
    expect(chainAt(b, 0, 0).libs.size).toBe(0);
  });
  it("works in the middle of a 19x19 board", () => {
    let b = createBoard(19);
    b = withStone(b, 9, 9, "b");
    b = withStone(b, 10, 9, "b");
    b = withStone(b, 9, 10, "w");
    const ch = chainAt(b, 9, 9);
    expect(ch.stones).toHaveLength(2);
    expect(ch.libs.size).toBe(5);
  });
  it("on an empty point floods the empty region without liberties", () => {
    const b = boardFromRows(["X..", "...", "..."]);
    const ch = chainAt(b, 2, 2);
    expect(ch.stones).toHaveLength(8);
    expect(ch.libs.size).toBe(0);
  });
});

describe("rows helpers", () => {
  it("round-trips", () => {
    const rows = ["X.O", ".X.", "O.."];
    expect(boardToRows(boardFromRows(rows))).toEqual(rows);
  });
  it("withStone does not mutate the source", () => {
    const a = createBoard(9);
    const b = withStone(a, 4, 4, "b");
    expect(a.cells[idx(9, 4, 4)]).toBeNull();
    expect(b.cells[idx(9, 4, 4)]).toBe("b");
  });
});

describe("coordinates", () => {
  it("skips the letter I, as every go book does", () => {
    expect(COLUMN_LETTERS).not.toContain("I");
    expect(colLabel(0)).toBe("A");
    expect(colLabel(7)).toBe("H");
    expect(colLabel(8)).toBe("J");
    expect(colLabel(18)).toBe("T");
  });
  it("numbers rows from the bottom", () => {
    expect(rowLabel(19, 0)).toBe(19);
    expect(rowLabel(19, 18)).toBe(1);
    expect(rowLabel(9, 0)).toBe(9);
  });
  it("names a point the way a book would", () => {
    expect(pointLabel(19, 3, 3)).toBe("D16");
    expect(pointLabel(19, 15, 15)).toBe("Q4");
    expect(pointLabel(9, 4, 4)).toBe("E5");
    expect(pointLabel(19, 8, 10)).toBe("J9");
  });
  it("has a letter for every column of the biggest board", () => {
    for (let c = 0; c < 19; c++) expect(colLabel(c)).toMatch(/^[A-HJ-T]$/);
  });
});
