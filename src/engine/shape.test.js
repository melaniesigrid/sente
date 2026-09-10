import { describe, it, expect } from "vitest";
import { detectShapes, SHAPES, SEVERITY_RANK } from "./shape.js";
import { boardFromRows, createBoard } from "./board.js";

/** Ids reported for a move, so a case reads as the sentence it is testing. */
const ids = (rows, move, color = "b") =>
  detectShapes(boardFromRows(rows), move, { color }).map((f) => f.id);

const find = (rows, move, id, color = "b") =>
  detectShapes(boardFromRows(rows), move, { color }).find((f) => f.id === id);

describe("detectShapes housekeeping", () => {
  it("says nothing about a pass, a resignation, or an off-board point", () => {
    const b = createBoard(9);
    expect(detectShapes(b, null, { color: "b" })).toEqual([]);
    expect(detectShapes(b, { c: -1, r: 0 }, { color: "b" })).toEqual([]);
    expect(detectShapes(null, { c: 0, r: 0 }, { color: "b" })).toEqual([]);
  });

  it("says nothing about an empty point, and reads the colour off the board when told nothing", () => {
    const rows = ["XX...", ".....", ".....", ".....", "....."];
    expect(detectShapes(boardFromRows(rows), { c: 4, r: 4 }, {})).toEqual([]);
    const rows2 = ["XX...", "X....", ".....", ".....", "....."];
    expect(detectShapes(boardFromRows(rows2), { c: 0, r: 1 }, {}).map((f) => f.id)).toContain("empty-triangle");
  });

  it("can be called with no options at all", () => {
    const rows = ["XX...", "X....", ".....", ".....", "....."];
    expect(detectShapes(boardFromRows(rows), { c: 0, r: 1 }).map((f) => f.id)).toContain("empty-triangle");
    expect(detectShapes(createBoard(9), null)).toEqual([]);
  });

  it("reports each shape at most once, in SHAPES order", () => {
    // A 3x3 of black is many empty triangles and many dumplings at once.
    const rows = ["XXX..", "XXX..", "XXX..", ".....", "....."];
    const found = detectShapes(boardFromRows(rows), { c: 1, r: 1 }, { color: "b" });
    const seen = found.map((f) => f.id);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toEqual(SHAPES.filter((id) => seen.includes(id)));
  });
});

describe("empty-triangle", () => {
  it("names three stones in an L with the fourth point empty", () => {
    const rows = ["XX...", "X....", ".....", ".....", "....."];
    expect(ids(rows, { c: 0, r: 1 })).toContain("empty-triangle");
    expect(find(rows, { c: 0, r: 1 }, "empty-triangle").stones).toHaveLength(3);
  });

  it("stays quiet when the fourth point is filled - that is a dumpling, not a triangle", () => {
    const rows = ["XX...", "XX...", ".....", ".....", "....."];
    expect(ids(rows, { c: 1, r: 1 })).not.toContain("empty-triangle");
  });

  it("stays quiet when the fourth point holds an enemy stone", () => {
    const rows = ["XX...", "XO...", ".....", ".....", "....."];
    expect(ids(rows, { c: 1, r: 0 })).not.toContain("empty-triangle");
  });

  it("names a triangle the move made in the corner, where only one window fits", () => {
    // (0,0) is the corner. Its single 2x2 window holds three black and one empty.
    const rows = ["XX...", "X....", ".....", ".....", "....."];
    const f = find(rows, { c: 0, r: 0 }, "empty-triangle");
    expect(f).toBeTruthy();
    expect(f.stones).toHaveLength(3);
  });

  it("names a triangle against the far edge, where the windows below and right are off the board", () => {
    // The move is the bottom right corner; only the window up and left of it fits.
    const rows = [".....", ".....", ".....", "....X", "...XX"];
    expect(ids(rows, { c: 4, r: 4 })).toContain("empty-triangle");
  });

  it("ships as a note, not a warn - it is the most common and most often legitimate", () => {
    const rows = ["XX...", "X....", ".....", ".....", "....."];
    expect(find(rows, { c: 0, r: 1 }, "empty-triangle").severity).toBe("note");
  });
});

describe("tigers-mouth", () => {
  it("names the mouth: an empty point with three of my stones and one way out", () => {
    // The mouth is (2,2): black above, left and right, open below.
    const rows = [".....", "..X..", ".X.X.", ".....", "....."];
    const f = find(rows, { c: 3, r: 2 }, "tigers-mouth");
    expect(f).toBeTruthy();
    expect(f.severity).toBe("praise");
    expect(f.stones).toHaveLength(3);
  });

  it("does not also report the mouth as an empty triangle", () => {
    // The other half of the pair. If the mouth were specified as a 2x2 pattern
    // both detectors would fire here and the scold would outrank the praise.
    const rows = [".....", "..X..", ".X.X.", ".....", "....."];
    expect(ids(rows, { c: 3, r: 2 })).not.toContain("empty-triangle");
  });

  it("is not the empty triangle: an empty triangle's empty point has only two friendly neighbours", () => {
    const rows = ["XX...", "X....", ".....", ".....", "....."];
    // (1,1) is the empty corner of the triangle. Two black neighbours, two empty.
    expect(ids(rows, { c: 0, r: 1 })).not.toContain("tigers-mouth");
  });

  it("refuses to praise a mouth whose own stones are in atari", () => {
    // (4,2) looks like a mouth: black at (4,1), (3,2) and (5,2) around it, open below.
    // But the guard at (4,1) is surrounded by white and has (4,2) as its last liberty,
    // so a white play there captures instead of walking into one liberty. Praising it
    // would make the coach loudest one move before the player is punished.
    const rows = [
      "....O....", "...OXO...", "...X.X...", ".........", ".........",
      ".........", ".........", ".........", ".........",
    ];
    expect(ids(rows, { c: 5, r: 2 })).not.toContain("tigers-mouth");
  });

  it("still praises a mouth whose stones have room to breathe", () => {
    const rows = [".....", "..X..", ".X.X.", ".....", "....."];
    expect(ids(rows, { c: 3, r: 2 })).toContain("tigers-mouth");
  });

  it("refuses a mouth broken by an enemy stone in the fourth slot", () => {
    // (2,2) has black above, left and right, but below is white, so white
    // plays (2,2) and connects instead of walking into one liberty.
    const rows = [".....", "..X..", ".X.X.", "..O..", "....."];
    expect(ids(rows, { c: 3, r: 2 })).not.toContain("tigers-mouth");
  });

  it("refuses a one-point eye - four friendly neighbours is not a mouth", () => {
    const rows = [".....", "..X..", ".X.X.", "..X..", "....."];
    expect(ids(rows, { c: 2, r: 3 })).not.toContain("tigers-mouth");
  });

  it("names a mouth on the edge, where the point has three neighbours and one is empty", () => {
    // Top edge: (1,0) is empty with black at (0,0) and (2,0), open downwards.
    const rows = ["X.X..", ".....", ".....", ".....", "....."];
    const f = find(rows, { c: 2, r: 0 }, "tigers-mouth");
    expect(f).toBeTruthy();
    expect(f.stones).toHaveLength(2);
  });

  it("refuses an edge point with no way out - that is an eye, not a mouth", () => {
    // (2,0) has black at (1,0), (3,0) and (2,1): all three neighbours filled.
    const rows = [".X.X.", "..X..", ".....", ".....", "....."];
    expect(ids(rows, { c: 2, r: 1 })).not.toContain("tigers-mouth");
  });

  it("names a mouth on the bottom edge, where the windows past the edge are off the board", () => {
    // The mouth is (2,4): black at (1,4) and (3,4), open upwards at (2,3).
    const rows = [".....", ".....", ".....", ".....", ".X.X."];
    const f = find(rows, { c: 3, r: 4 }, "tigers-mouth");
    expect(f).toBeTruthy();
    expect(f.stones).toHaveLength(2);
  });

  it("refuses the corner, where two friendly stones make an eye rather than a mouth", () => {
    // (0,0) has only (1,0) and (0,1) as neighbours, both black: an enemy play there is illegal.
    const rows = [".X...", "X....", ".....", ".....", "....."];
    expect(ids(rows, { c: 0, r: 1 })).not.toContain("tigers-mouth");
  });
});

describe("dumpling", () => {
  it("names a solid 2x2 block the move just completed", () => {
    const rows = ["XX...", "XX...", ".....", ".....", "....."];
    const f = find(rows, { c: 1, r: 1 }, "dumpling");
    expect(f).toBeTruthy();
    expect(f.stones).toHaveLength(4);
    expect(f.severity).toBe("note");
  });

  it("names a block the move completed in the corner, where three of the four windows are off the board", () => {
    const rows = [".....", ".....", ".....", "...XX", "...XX"];
    const f = find(rows, { c: 4, r: 4 }, "dumpling");
    expect(f).toBeTruthy();
    expect(f.stones).toHaveLength(4);
  });

  it("names a block the move completed against the bottom edge", () => {
    const rows = [".....", ".....", ".....", ".XX..", ".XX.."];
    expect(ids(rows, { c: 2, r: 4 })).toContain("dumpling");
  });

  it("stays quiet when the move only extends a chain that already held the block", () => {
    // The 2x2 sits at the top left; the move at (0,3) is far from it.
    const rows = ["XX...", "XX...", "X....", "X....", "....."];
    expect(ids(rows, { c: 0, r: 3 })).not.toContain("dumpling");
  });

  it("stays quiet on four stones in a line, which is not heavy", () => {
    const rows = ["XXXX.", ".....", ".....", ".....", "....."];
    expect(ids(rows, { c: 3, r: 0 })).not.toContain("dumpling");
  });

  it("is not fooled by a mixed square", () => {
    const rows = ["XX...", "XO...", ".....", ".....", "....."];
    expect(ids(rows, { c: 1, r: 0 })).not.toContain("dumpling");
  });
});

describe("collisions and severity", () => {
  it("praise outranks note, which is what makes a mouth read as a mouth", () => {
    expect(SEVERITY_RANK.warn).toBeGreaterThan(SEVERITY_RANK.praise);
    expect(SEVERITY_RANK.praise).toBeGreaterThan(SEVERITY_RANK.note);
  });

  it("reports both when a position is honestly both, leaving the choice to the selector", () => {
    // (2,2) is the empty corner of the triangle (1,1),(2,1),(1,2) and, with
    // (3,2) present, it is also a mouth: black above, left and right, open below.
    const rows = [".....", ".XX..", ".X.X.", ".....", "....."];
    const found = ids(rows, { c: 1, r: 2 });
    expect(found).toContain("empty-triangle");
    expect(found).toContain("tigers-mouth");
  });

  it("works for white as well as black", () => {
    const rows = ["OO...", "O....", ".....", ".....", "....."];
    expect(ids(rows, { c: 0, r: 1 }, "w")).toContain("empty-triangle");
    expect(find(rows, { c: 0, r: 1 }, "empty-triangle", "w").color).toBe("w");
  });
});
