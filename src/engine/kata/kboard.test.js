import { describe, it, expect } from "vitest";
import { boardFromRows, chainAt, idx } from "../board.js";
import { KBoard, BLACK, WHITE, EMPTY, iterLadders } from "./kboard.js";

const fromRows = (rows) => KBoard.fromCells(boardFromRows(rows));

describe("KBoard chain tracking", () => {
  it("agrees with chainAt on liberties for every stone", () => {
    const rows = [
      ".X.O.....",
      "XXOO.....",
      ".XO......",
      "..X.OO...",
      "....O.O..",
      ".........",
      "...XX.O..",
      "..XOOX...",
      "...X.X...",
    ];
    const board = boardFromRows(rows);
    const kb = fromRows(rows);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (board.cells[idx(9, c, r)] === null) continue;
      expect(kb.numLiberties(kb.loc(c, r))).toBe(chainAt(board, c, r).libs.size);
    }
  });

  it("captures on play and restores everything on undo", () => {
    const kb = fromRows([
      ".O.......",
      "OXO......",
      ".........",
      ".........",
      ".........",
      ".........",
      ".........",
      ".........",
      ".........",
    ]);
    const before = kb.copy();
    const rec = kb.playRecordedUnsafe(WHITE, kb.loc(1, 2));
    expect(kb.board[kb.loc(1, 1)]).toBe(EMPTY);
    kb.undo(rec);
    expect(Array.from(kb.board)).toEqual(Array.from(before.board));
    expect(Array.from(kb.groupLibertyCount)).toEqual(Array.from(before.groupLibertyCount));
    expect(kb.simpleKoPoint).toBe(before.simpleKoPoint);
  });

  it("sets the simple ko point after a single-stone recapture shape", () => {
    const kb = fromRows([
      ".XO......",
      "X.XO.....",
      ".XO......",
      ".........",
      ".........",
      ".........",
      ".........",
      ".........",
      ".........",
    ]);
    kb.playUnsafe(WHITE, kb.loc(1, 1));      // captures the black stone at (2,1)
    expect(kb.board[kb.loc(2, 1)]).toBe(EMPTY);
    expect(kb.simpleKoPoint).toBe(kb.loc(2, 1));
  });
});

describe("ladder search", () => {
  it("finds a working ladder on an open board", () => {
    // White stone at (4,4) with black on two sides and a diagonal black stone: classic ladder.
    const kb = fromRows([
      ".........",
      ".........",
      ".........",
      "....X....",
      "...XO....",
      ".....X...",
      ".........",
      ".........",
      ".........",
    ]);
    const working = kb.searchIsLadderCapturedAttackerFirst2Libs(kb.loc(4, 4));
    expect(working.length).toBe(2); // both ataris ladder it toward opposite corners
  });

  it("reports no ladder when breakers sit on both paths", () => {
    const kb = fromRows([
      ".........",
      ".......O.",
      ".........",
      "....X....",
      "...XO....",
      ".....X...",
      ".........",
      ".O.......",
      ".........",
    ]);
    // One ladder runs to the lower-left, the other to the upper-right; both are broken.
    const working = kb.searchIsLadderCapturedAttackerFirst2Libs(kb.loc(4, 4));
    expect(working).toEqual([]);
  });

  it("iterLadders visits laddered stones only once per chain", () => {
    const kb = fromRows([
      ".........",
      ".........",
      ".........",
      "....X....",
      "...XOX...",
      ".........",
      ".........",
      ".........",
      ".........",
    ]);
    const seen = [];
    iterLadders(kb, (loc) => seen.push(loc));
    // One-liberty white stone escapes upward? (4,5) is open: extend gives 3 libs, so not laddered.
    // Either way the callback must not repeat a location.
    expect(new Set(seen).size).toBe(seen.length);
  });
});

describe("pass-alive area", () => {
  it("marks a two-eyed corner group and its eyes as black area", () => {
    const kb = fromRows([
      ".X.X.....",
      "XXXX.....",
      ".........",
      ".........",
      ".........",
      ".........",
      ".........",
      ".........",
      "........O",
    ]);
    const area = new Int8Array(kb.arrSize);
    kb.calculateArea(area, true, true, true, false);
    expect(area[kb.loc(0, 0)]).toBe(BLACK);
    expect(area[kb.loc(2, 0)]).toBe(BLACK);
    expect(area[kb.loc(1, 0)]).toBe(BLACK);
    expect(area[kb.loc(4, 4)]).toBe(EMPTY);
    expect(area[kb.loc(8, 8)]).toBe(WHITE); // non-pass-alive stones are still counted as stones
  });

  it("marks nothing on an empty board", () => {
    const kb = new KBoard(9);
    const area = new Int8Array(kb.arrSize);
    kb.calculateArea(area, true, true, true, false);
    expect(area.every((v) => v === EMPTY)).toBe(true);
  });
});
