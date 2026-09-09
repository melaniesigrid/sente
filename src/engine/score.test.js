import { describe, it, expect } from "vitest";
import { scoreBoard, estimateScore, territoryMap } from "./score.js";
import { createBoard, idx, withStone, boardFromRows } from "./board.js";

const wall9 = () => boardFromRows(Array(9).fill("....X...."));

describe("estimateScore", () => {
  it("is 0-0 on an empty board", () => {
    expect(estimateScore(createBoard(9))).toEqual({ black: 0, white: 0 });
    expect(estimateScore(createBoard(19))).toEqual({ black: 0, white: 0 });
  });
  it("counts stones plus surrounded territory", () => {
    expect(estimateScore(wall9())).toEqual({ black: 81, white: 0 });
  });
  it("leaves contested regions unscored", () => {
    const b = boardFromRows(["X.......O", ...Array(8).fill(".........")]);
    expect(estimateScore(b)).toEqual({ black: 1, white: 1 });
  });
});

describe("scoreBoard on 9x9", () => {
  it("splits a walled board with a neutral dame column", () => {
    // Black wall on column 3, white wall on column 5, column 4 is dame.
    const b = boardFromRows(Array(9).fill("...X.O..."));
    const s = scoreBoard(b, { komi: 7.5 });
    expect(s.black).toEqual({ stones: 9, territory: 27, area: 36 });
    expect(s.white).toMatchObject({ stones: 9, territory: 27, area: 36, komi: 7.5 });
    expect(s.totals).toEqual({ b: 36, w: 43.5 });
    expect(s.winner).toBe("w");
    expect(s.margin).toBe(7.5);
    for (let r = 0; r < 9; r++) {
      expect(s.territory[idx(9, 4, r)]).toBe("neutral");
      expect(s.territory[idx(9, 0, r)]).toBe("b");
      expect(s.territory[idx(9, 8, r)]).toBe("w");
      expect(s.territory[idx(9, 3, r)]).toBe("b");
    }
  });
  it("reports jigo when totals tie", () => {
    const b = boardFromRows(Array(9).fill("...X.O..."));
    const s = scoreBoard(b, { komi: 0 });
    expect(s.winner).toBeNull();
    expect(s.margin).toBe(0);
  });
  it("removes dead stones and awards their points to the surrounder", () => {
    let b = wall9();
    b = withStone(b, 0, 0, "w");
    b = withStone(b, 8, 8, "w");
    const alive = scoreBoard(b, { komi: 5.5 });
    // Both empty regions now touch a white stone, so they are neutral.
    expect(alive.totals).toEqual({ b: 9, w: 2 + 5.5 });
    const dead = scoreBoard(b, { komi: 5.5, dead: [idx(9, 0, 0), idx(9, 8, 8)] });
    expect(dead.totals).toEqual({ b: 81, w: 5.5 });
    expect(dead.winner).toBe("b");
    expect(dead.margin).toBe(75.5);
    expect(dead.territory[idx(9, 0, 0)]).toBe("b");
    expect(dead.dead).toEqual([idx(9, 0, 0), idx(9, 8, 8)]);
  });
  it("hand-verified endgame position", () => {
    //   c0 1 2 3 4 5 6 7 8
    const b = boardFromRows([
      "...XO....", // r0
      "...XO....", // r1
      "..XXO....", // r2
      "..X..O...", // r3  (3,3) and (4,3) touch both colours: dame
      "..XOOO...", // r4
      "..XO.....", // r5
      "..XO.....", // r6
      "..XO.....", // r7
      "..XO.....", // r8
    ]);
    // Black: 10 stones; territory = columns 0-1 (18) + (2,0),(2,1) (2) = 20 -> area 30.
    // White: 11 stones; territory = rows 0-2 cols 5-8 (12) + rows 3-4 cols 6-8 (6)
    //   + rows 5-8 cols 4-8 (20) = 38 -> area 49. Dame: (3,3), (4,3).
    const s = scoreBoard(b, { komi: 7.5 });
    expect(s.black).toEqual({ stones: 10, territory: 20, area: 30 });
    expect(s.white).toMatchObject({ stones: 11, territory: 38, area: 49 });
    expect(s.territory[idx(9, 3, 3)]).toBe("neutral");
    expect(s.territory[idx(9, 4, 3)]).toBe("neutral");
    expect(s.territory.filter(t => t === "neutral")).toHaveLength(2);
    expect(s.winner).toBe("w");
    expect(s.margin).toBe(49 + 7.5 - 30);
  });
});

describe("scoreBoard on 13x13 and 19x19", () => {
  it("13x13 wall owns the board", () => {
    const b = boardFromRows(Array(13).fill("......X......"));
    const s = scoreBoard(b, { komi: 7.5 });
    expect(s.totals).toEqual({ b: 169, w: 7.5 });
    expect(s.territory.filter(t => t === "b")).toHaveLength(169);
  });
  it("19x19 with a dead invader and a live white corner", () => {
    let b = boardFromRows(Array(19).fill(".........X........."));
    // White lives in the bottom-right 3x3 corner behind a wall at c=15..18, r=15.
    for (let c = 15; c < 19; c++) b = withStone(b, c, 15, "w");
    for (let r = 16; r < 19; r++) b = withStone(b, 15, r, "w");
    // A lone white stone deep in black's left side, marked dead.
    b = withStone(b, 2, 2, "w");
    const s = scoreBoard(b, { komi: 7.5, dead: [idx(19, 2, 2)] });
    // White: 7 stones + 3x3 = 9 territory = 16. Black: wall 19 + left 9x19 = 171 -> 190.
    // The open right side touches both the black wall and the white corner: neutral.
    expect(s.white).toMatchObject({ stones: 7, territory: 9, area: 16 });
    expect(s.black).toEqual({ stones: 19, territory: 171, area: 190 });
    expect(s.territory[idx(19, 12, 5)]).toBe("neutral");
    expect(s.territory[idx(19, 17, 17)]).toBe("w");
    expect(s.territory[idx(19, 2, 2)]).toBe("b");
    expect(s.winner).toBe("b");
  });
});

describe("handicap compensation", () => {
  it("gives white one point per handicap stone after the first", () => {
    const b = boardFromRows(Array(9).fill("...X.O..."));
    expect(scoreBoard(b, { komi: 0.5, handicap: 3 }).totals).toEqual({ b: 36, w: 36 + 0.5 + 2 });
    expect(scoreBoard(b, { komi: 0.5, handicap: 2 }).white.handicapBonus).toBe(1);
    expect(scoreBoard(b, { komi: 7.5, handicap: 0 }).white.handicapBonus).toBe(0);
  });
});

describe("territoryMap", () => {
  it("marks stones as their own colour and seki as neutral", () => {
    const b = boardFromRows(["XO.", "XO.", "XO."]);
    const m = territoryMap(b);
    expect(m[idx(3, 0, 0)]).toBe("b");
    expect(m[idx(3, 1, 0)]).toBe("w");
    expect(m[idx(3, 2, 1)]).toBe("w");
  });
});
