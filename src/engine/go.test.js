import { describe, it, expect } from "vitest";
import { N, idx, emptyBoard, chainAt, tryPlay, estimateScore } from "./go.js";

/** Build a board from a 9-row ASCII picture: '.' empty, 'X' black, 'O' white. */
function boardFrom(rows) {
  const b = emptyBoard();
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === "X") b[idx(c, r)] = "b";
    else if (ch === "O") b[idx(c, r)] = "w";
  }));
  return b;
}
const E = ".........";

describe("board basics", () => {
  it("is 9x9", () => {
    expect(N).toBe(9);
    expect(emptyBoard()).toHaveLength(81);
  });
  it("rejects off-board and occupied points", () => {
    const b = emptyBoard();
    expect(tryPlay(b, -1, 0, "b", null)).toBeNull();
    expect(tryPlay(b, 9, 0, "b", null)).toBeNull();
    const r = tryPlay(b, 4, 4, "b", null);
    expect(r.board[idx(4, 4)].toString()).toBe("b");
    expect(tryPlay(r.board, 4, 4, "w", null)).toBeNull();
  });
  it("does not mutate the input board", () => {
    const b = emptyBoard();
    tryPlay(b, 0, 0, "b", null);
    expect(b.every(v => v === null)).toBe(true);
  });
});

describe("chainAt", () => {
  it("counts liberties of a lone corner stone", () => {
    const b = boardFrom(["X........", E, E, E, E, E, E, E, E]);
    expect(chainAt(b, 0, 0).libs.size).toBe(2);
  });
  it("groups connected stones and shares liberties", () => {
    const b = boardFrom(["XX.......", E, E, E, E, E, E, E, E]);
    const ch = chainAt(b, 0, 0);
    expect(ch.stones).toHaveLength(2);
    expect(ch.libs.size).toBe(3);
  });
});

describe("capture", () => {
  it("removes a single stone with no liberties", () => {
    const b = boardFrom([
      ".X.......",
      "XOX......",
      ".........",
      E, E, E, E, E, E,
    ]);
    const r = tryPlay(b, 1, 2, "b", null);
    expect(r).not.toBeNull();
    expect(r.captured).toEqual([[1, 1]]);
    expect(r.board[idx(1, 1)]).toBeNull();
  });
  it("removes a multi-stone group", () => {
    const b = boardFrom([
      "OO.......",
      "XX.......",
      E, E, E, E, E, E, E,
    ]);
    const r = tryPlay(b, 2, 0, "b", null);
    expect(r.captured).toHaveLength(2);
    expect(r.board[idx(0, 0)]).toBeNull();
    expect(r.board[idx(1, 0)]).toBeNull();
  });
  it("captures two separate groups at once", () => {
    const b = boardFrom([
      "O.OX.....",
      "XXX......",
      E, E, E, E, E, E, E,
    ]);
    // (1,0) is the last liberty of both white stones.
    const r = tryPlay(b, 1, 0, "b", null);
    expect(r.captured).toHaveLength(2);
  });
});

describe("suicide", () => {
  it("forbids playing into a point with no liberties", () => {
    const b = boardFrom([
      ".O.......",
      "O.O......",
      ".O.......",
      E, E, E, E, E, E,
    ]);
    expect(tryPlay(b, 1, 1, "b", null)).toBeNull();
  });
  it("allows the move if it captures first", () => {
    const b = boardFrom([
      ".OX......",
      "O.OX.....",
      ".OX......",
      E, E, E, E, E, E,
    ]);
    // Black at (1,1) has no liberties itself, but captures the O at (2,1).
    const r = tryPlay(b, 1, 1, "b", null);
    expect(r).not.toBeNull();
    expect(r.captured).toEqual([[2, 1]]);
  });
});

describe("ko", () => {
  const koBoard = boardFrom([
    ".XO......",
    "X.XO.....",
    ".XO......",
    E, E, E, E, E, E,
  ]);
  it("reports a ko point after a single-stone recapture shape", () => {
    // White takes at (1,1), capturing X at (2,1).
    const r = tryPlay(koBoard, 1, 1, "w", null);
    expect(r.captured).toEqual([[2, 1]]);
    expect(r.ko).toBe(idx(2, 1));
  });
  it("forbids immediate recapture at the ko point", () => {
    const r = tryPlay(koBoard, 1, 1, "w", null);
    expect(tryPlay(r.board, 2, 1, "b", r.ko)).toBeNull();
  });
  it("allows recapture once the ko point is cleared", () => {
    const r = tryPlay(koBoard, 1, 1, "w", null);
    expect(tryPlay(r.board, 2, 1, "b", null)).not.toBeNull();
  });
  it("does not flag ko when the capturing stone has more than one liberty", () => {
    const b = boardFrom([
      ".X.......",
      "XOX......",
      ".........",
      E, E, E, E, E, E,
    ]);
    const r = tryPlay(b, 1, 2, "b", null);
    expect(r.ko).toBeNull();
  });
});

describe("estimateScore", () => {
  it("is 0-0 on an empty board", () => {
    expect(estimateScore(emptyBoard())).toEqual({ black: 0, white: 0 });
  });
  it("counts stones plus surrounded territory", () => {
    // Black wall on column 4 splits the board; nothing else placed,
    // so both empty regions touch only black -> all black territory.
    const rows = Array(9).fill("....X....");
    const b = boardFrom(rows);
    const s = estimateScore(b);
    expect(s.black).toBe(81);
    expect(s.white).toBe(0);
  });
  it("leaves contested regions unscored", () => {
    const b = boardFrom(["X.......O", E, E, E, E, E, E, E, E]);
    expect(estimateScore(b)).toEqual({ black: 1, white: 1 });
  });
});
