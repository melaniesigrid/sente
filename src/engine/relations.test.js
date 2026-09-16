import { describe, it, expect } from "vitest";
import { relationsAt, RELATIONS } from "./relations.js";
import { boardFromRows, createBoard } from "./board.js";

/** The relations reported for a move, so a case reads as the sentence it tests.
 *  Boards are nine rows of nine: "X" black, "O" white, "." empty. */
const rel = (rows, move, color = "b", opts = {}) =>
  relationsAt(boardFromRows(rows), move, { color, ...opts });

const EMPTY9 = [
  ".........", ".........", ".........", ".........", ".........",
  ".........", ".........", ".........", ".........",
];
const put = (rows, ...stones) => {
  const g = rows.map((row) => row.split(""));
  for (const [c, r, s] of stones) g[r][c] = s;
  return g.map((row) => row.join(""));
};

describe("relationsAt housekeeping", () => {
  it("says nothing about a pass, an off-board point or a missing board", () => {
    expect(relationsAt(createBoard(9), null, { color: "b" })).toEqual([]);
    expect(relationsAt(createBoard(9), { c: -1, r: 3 }, { color: "b" })).toEqual([]);
    expect(relationsAt(null, { c: 3, r: 3 }, { color: "b" })).toEqual([]);
    expect(relationsAt(createBoard(9), { c: 3, r: 3 }, {})).toEqual([]);
  });

  it("reports every relation at most once, in RELATIONS order", () => {
    // A stone with a friend beside it, one jumped away, and an enemy touching.
    const rows = put(EMPTY9, [3, 3, "X"], [4, 3, "X"], [5, 3, "X"], [3, 2, "O"]);
    const found = rel(rows, { c: 3, r: 3 });
    expect(new Set(found).size).toBe(found.length);
    expect(found).toEqual(RELATIONS.filter((id) => found.includes(id)));
  });

  it("reads the colour off the board when it is not told one", () => {
    const rows = put(EMPTY9, [3, 3, "X"], [5, 3, "X"]);
    expect(relationsAt(boardFromRows(rows), { c: 3, r: 3 })).toContain("one-point-jump");
  });
});

describe("the jumps", () => {
  it("names a one-point jump when the point between is empty", () => {
    const rows = put(EMPTY9, [3, 3, "X"], [5, 3, "X"]);
    expect(rel(rows, { c: 3, r: 3 })).toContain("one-point-jump");
  });

  it("does not call it a jump when anything at all stands between", () => {
    const blocked = put(EMPTY9, [3, 3, "X"], [4, 3, "O"], [5, 3, "X"]);
    expect(rel(blocked, { c: 3, r: 3 })).not.toContain("one-point-jump");
    const filled = put(EMPTY9, [3, 3, "X"], [4, 3, "X"], [5, 3, "X"]);
    expect(rel(filled, { c: 3, r: 3 })).not.toContain("one-point-jump");
  });

  it("names a knight's move and insists both points of the waist are empty", () => {
    const keima = put(EMPTY9, [3, 3, "X"], [4, 5, "X"]);
    expect(rel(keima, { c: 3, r: 3 })).toContain("knights-move");
    // An enemy stone already at the waist: the two stones are not related.
    const struck = put(keima, [3, 4, "O"]);
    expect(rel(struck, { c: 3, r: 3 })).not.toContain("knights-move");
    const struck2 = put(keima, [4, 4, "O"]);
    expect(rel(struck2, { c: 3, r: 3 })).not.toContain("knights-move");
  });

  it("names the large knight's move and keeps it apart from the small one", () => {
    const rows = put(EMPTY9, [3, 2, "X"], [4, 5, "X"]);
    const found = rel(rows, { c: 3, r: 2 });
    expect(found).toContain("large-knights-move");
    expect(found).not.toContain("knights-move");
  });

  it("names a two-space extension low on the board and not one in the middle", () => {
    const low = put(EMPTY9, [2, 6, "X"], [5, 6, "X"]);
    expect(rel(low, { c: 2, r: 6 })).toContain("two-space-extension");
    const high = put(EMPTY9, [1, 4, "X"], [4, 4, "X"]);
    expect(rel(high, { c: 4, r: 4 })).not.toContain("two-space-extension");
  });
});

describe("the connections", () => {
  it("names a bamboo joint: two pairs, two empty points, nothing to throw in", () => {
    // Black at (3,3)+(3,4) and (5,3)+(5,4); the played stone completes a pair.
    const rows = put(EMPTY9, [3, 3, "X"], [3, 4, "X"], [5, 3, "X"], [5, 4, "X"]);
    expect(rel(rows, { c: 3, r: 3 })).toContain("bamboo-joint");
  });

  it("is not a bamboo joint when one of the two points is already taken", () => {
    const rows = put(EMPTY9, [3, 3, "X"], [3, 4, "X"], [5, 3, "X"], [5, 4, "X"], [4, 3, "O"]);
    expect(rel(rows, { c: 3, r: 3 })).not.toContain("bamboo-joint");
  });

  it("names the solid extension and the diagonal, and never both", () => {
    const nobi = put(EMPTY9, [3, 3, "X"], [3, 4, "X"]);
    expect(rel(nobi, { c: 3, r: 3 })).toContain("solid-extension");
    expect(rel(nobi, { c: 3, r: 3 })).not.toContain("diagonal");
    const kosumi = put(EMPTY9, [3, 3, "X"], [4, 4, "X"]);
    expect(rel(kosumi, { c: 3, r: 3 })).toContain("diagonal");
    expect(rel(kosumi, { c: 3, r: 3 })).not.toContain("solid-extension");
  });
});

describe("touching the other player", () => {
  it("names an attachment: contact with nothing of mine beside it", () => {
    const rows = put(EMPTY9, [3, 3, "X"], [3, 2, "O"]);
    expect(rel(rows, { c: 3, r: 3 })).toContain("attachment");
  });

  it("does not call it an attachment when my own stone is already there", () => {
    const rows = put(EMPTY9, [3, 3, "X"], [4, 3, "X"], [3, 2, "O"]);
    expect(rel(rows, { c: 3, r: 3 })).not.toContain("attachment");
  });

  it("names a hane: around the head of a stone that touches my own", () => {
    // Black (3,4) already there, white (3,3) touching it; black bends to (4,3).
    const rows = put(EMPTY9, [3, 4, "X"], [3, 3, "O"], [4, 3, "X"]);
    expect(rel(rows, { c: 4, r: 3 })).toContain("hane");
  });

  it("does not call a plain diagonal a hane when no enemy stone is between", () => {
    const rows = put(EMPTY9, [3, 4, "X"], [4, 3, "X"]);
    expect(rel(rows, { c: 4, r: 3 })).not.toContain("hane");
  });

  it("names a shoulder hit, and only against a stone with room to be pushed", () => {
    const third = put(EMPTY9, [2, 6, "O"], [3, 5, "X"]);
    expect(rel(third, { c: 3, r: 5 })).toContain("shoulder-hit");
    const edge = put(EMPTY9, [1, 8, "O"], [2, 7, "X"]);
    expect(rel(edge, { c: 2, r: 7 })).not.toContain("shoulder-hit");
  });

  it("names a cut: two enemy chains that were holding hands diagonally", () => {
    const rows = put(EMPTY9, [3, 3, "O"], [4, 4, "O"], [4, 3, "X"]);
    expect(rel(rows, { c: 4, r: 3 })).toContain("cut");
  });

  it("is not a cut when the two enemy stones are one chain already", () => {
    // White wraps around, so the two neighbours belong to the same chain.
    const rows = put(EMPTY9, [3, 3, "O"], [4, 4, "O"], [3, 4, "O"], [4, 3, "X"]);
    expect(rel(rows, { c: 4, r: 3 })).not.toContain("cut");
  });

  it("is not a cut when the two enemy stones are on opposite sides", () => {
    const rows = put(EMPTY9, [3, 3, "O"], [5, 3, "O"], [4, 3, "X"]);
    expect(rel(rows, { c: 4, r: 3 })).not.toContain("cut");
  });
});

describe("the ponnuki", () => {
  it("names four stones around one that was just taken", () => {
    const rows = put(EMPTY9, [3, 2, "X"], [2, 3, "X"], [4, 3, "X"], [3, 4, "X"]);
    expect(rel(rows, { c: 3, r: 4 }, "b", { captured: [[3, 3]] })).toContain("ponnuki");
  });

  it("does not name one on the edge, where the diamond cannot close", () => {
    const rows = put(EMPTY9, [0, 2, "X"], [1, 3, "X"], [0, 4, "X"]);
    expect(rel(rows, { c: 0, r: 4 }, "b", { captured: [[0, 3]] })).not.toContain("ponnuki");
  });

  it("does not name one when more than a single stone came off", () => {
    const rows = put(EMPTY9, [3, 2, "X"], [2, 3, "X"], [4, 3, "X"], [3, 4, "X"]);
    expect(rel(rows, { c: 3, r: 4 }, "b", { captured: [[3, 3], [3, 5]] })).not.toContain("ponnuki");
  });
});
