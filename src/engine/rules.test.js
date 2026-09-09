import { describe, it, expect } from "vitest";
import { tryPlay, legalMoves, chainsInAtari } from "./rules.js";
import { createBoard, idx, boardFromRows, boardToRows, withStone } from "./board.js";
import { hashBoard } from "./zobrist.js";

const E9 = ".........";
const pad9 = (rows) => [...rows, ...Array(9 - rows.length).fill(E9)];

describe("tryPlay reasons", () => {
  it("offboard", () => {
    expect(tryPlay(createBoard(9), 9, 0, "b")).toEqual({ ok: false, reason: "offboard" });
    expect(tryPlay(createBoard(13), 0, 13, "b")).toEqual({ ok: false, reason: "offboard" });
    expect(tryPlay(createBoard(9), -1, 0, "b").reason).toBe("offboard");
  });
  it("occupied", () => {
    const b = withStone(createBoard(9), 4, 4, "w");
    expect(tryPlay(b, 4, 4, "b")).toEqual({ ok: false, reason: "occupied" });
  });
  it("suicide", () => {
    const b = boardFromRows(pad9([".O.......", "O.O......", ".O......."]));
    expect(tryPlay(b, 1, 1, "b")).toEqual({ ok: false, reason: "suicide" });
  });
  it("allows the move if it captures first", () => {
    const b = boardFromRows(pad9([".OX......", "O.OX.....", ".OX......"]));
    const r = tryPlay(b, 1, 1, "b");
    expect(r.ok).toBe(true);
    expect(r.captured).toEqual([[2, 1]]);
  });
  it("removes a multi-stone group", () => {
    const b = boardFromRows(pad9(["OO.......", "XX......."]));
    const r = tryPlay(b, 2, 0, "b");
    expect(r.captured).toHaveLength(2);
    expect(r.board.cells[idx(9, 0, 0)]).toBeNull();
    expect(r.board.cells[idx(9, 1, 0)]).toBeNull();
  });
  it("captures two separate groups at once", () => {
    // (1,0) is the last liberty of both white stones.
    const b = boardFromRows(pad9(["O.OX.....", "XXX......"]));
    const r = tryPlay(b, 1, 0, "b");
    expect(r.captured).toHaveLength(2);
    expect(r.ko).toBeNull();
  });
  it("does not flag ko when the capturing stone has more than one liberty", () => {
    const b = boardFromRows(pad9([".X.......", "XOX......", "........."]));
    const r = tryPlay(b, 1, 2, "b");
    expect(r.captured).toEqual([[1, 1]]);
    expect(r.ko).toBeNull();
  });
  it("ko", () => {
    const b = boardFromRows(pad9([".XO......", "X.XO.....", ".XO......"]));
    const r = tryPlay(b, 1, 1, "w");
    expect(r.ok).toBe(true);
    expect(r.ko).toBe(idx(9, 2, 1));
    expect(tryPlay(r.board, 2, 1, "b", { koPoint: r.ko })).toEqual({ ok: false, reason: "ko" });
    expect(tryPlay(r.board, 2, 1, "b").ok).toBe(true);
  });
  it("returns a fresh board and leaves the input untouched", () => {
    const b = createBoard(9);
    const r = tryPlay(b, 0, 0, "b");
    expect(b.cells[0]).toBeNull();
    expect(r.board.cells[0]).toBe("b");
    expect(r.hash).toBe(hashBoard(r.board));
  });
});

describe("captures on larger boards", () => {
  it("captures a corner stone on 13x13", () => {
    let b = createBoard(13);
    b = withStone(b, 12, 12, "w");
    b = withStone(b, 11, 12, "b");
    const r = tryPlay(b, 12, 11, "b");
    expect(r.ok).toBe(true);
    expect(r.captured).toEqual([[12, 12]]);
    expect(r.board.cells[idx(13, 12, 12)]).toBeNull();
  });
  it("captures a three-stone group in the centre of 19x19", () => {
    let b = createBoard(19);
    for (const [c, r] of [[9, 9], [10, 9], [11, 9]]) b = withStone(b, c, r, "w");
    for (const [c, r] of [[8, 9], [9, 8], [10, 8], [11, 8], [9, 10], [10, 10], [11, 10]]) b = withStone(b, c, r, "b");
    const r = tryPlay(b, 12, 9, "b");
    expect(r.ok).toBe(true);
    expect(r.captured).toHaveLength(3);
    expect(r.board.cells[idx(19, 10, 9)]).toBeNull();
    expect(r.ko).toBeNull();
  });
  it("ko point is reported on 19x19 too", () => {
    let b = createBoard(19);
    // The 9x9 ko shape from above, translated to the centre: white takes at (9,9).
    for (const [c, r] of [[9, 8], [8, 9], [10, 9], [9, 10]]) b = withStone(b, c, r, "b");
    for (const [c, r] of [[10, 8], [11, 9], [10, 10]]) b = withStone(b, c, r, "w");
    const r = tryPlay(b, 9, 9, "w");
    expect(r.ok).toBe(true);
    expect(r.captured).toEqual([[10, 9]]);
    expect(r.ko).toBe(idx(19, 10, 9));
    expect(tryPlay(r.board, 10, 9, "b", { koPoint: r.ko }).reason).toBe("ko");
  });
});

describe("positional superko", () => {
  const koBoard = boardFromRows(pad9([".XO......", "X.XO.....", ".XO......"]));

  it("forbids recreating an earlier position even when koPoint is absent", () => {
    const history = new Set([hashBoard(koBoard)]);
    const take = tryPlay(koBoard, 1, 1, "w", { history });
    expect(take.ok).toBe(true);
    history.add(take.hash);
    // Retaking at (2,1) would restore koBoard exactly: superko.
    const back = tryPlay(take.board, 2, 1, "b", { history });
    expect(back).toEqual({ ok: false, reason: "superko" });
  });

  it("reports ko before superko for the immediate recapture", () => {
    const history = new Set([hashBoard(koBoard)]);
    const take = tryPlay(koBoard, 1, 1, "w", { history });
    history.add(take.hash);
    expect(tryPlay(take.board, 2, 1, "b", { history, koPoint: take.ko }).reason).toBe("ko");
  });

  it("detects a three-ply cycle (sending two, returning one)", () => {
    //   c0 c1 c2 c3           Black (1,0) sits in a corner eye. Black adds (2,0)
    //   .  X  .  O   row0     ("sends two"), white captures both at (0,0), black
    //   X  O  O  O   row1     recaptures the lone white stone at (1,0) ("returns
    //   X  X  X  X   row2     one") and the board is exactly where it started.
    // No single-stone ko is ever flagged, so only positional superko stops it.
    const start = boardFromRows(pad9([".X.O.....", "XOOO.....", "XXXX....."]));
    const history = new Set([hashBoard(start)]);
    const m1 = tryPlay(start, 2, 0, "b", { history });
    expect(m1.ok).toBe(true); expect(m1.ko).toBeNull(); history.add(m1.hash);
    const m2 = tryPlay(m1.board, 0, 0, "w", { history, koPoint: m1.ko });
    expect(m2.ok).toBe(true); expect(m2.captured).toHaveLength(2); expect(m2.ko).toBeNull();
    history.add(m2.hash);
    const m3 = tryPlay(m2.board, 1, 0, "b", { history, koPoint: m2.ko });
    expect(m3).toEqual({ ok: false, reason: "superko" });
    // Without history the same move is a perfectly ordinary one-stone capture.
    const free = tryPlay(m2.board, 1, 0, "b");
    expect(free.ok).toBe(true);
    expect(free.captured).toEqual([[0, 0]]);
    expect(free.hash).toBe(hashBoard(start));
  });

  it("accepts an array history too", () => {
    const history = [hashBoard(koBoard)];
    const take = tryPlay(koBoard, 1, 1, "w", { history });
    history.push(take.hash);
    expect(tryPlay(take.board, 2, 1, "b", { history }).reason).toBe("superko");
  });
});

describe("legalMoves", () => {
  it("lists every empty point on an empty board", () => {
    expect(legalMoves(createBoard(9), "b")).toHaveLength(81);
    expect(legalMoves(createBoard(19), "w")).toHaveLength(361);
  });
  it("excludes suicide and ko points", () => {
    const b = boardFromRows(pad9([".XO......", "X.XO.....", ".XO......"]));
    const r = tryPlay(b, 1, 1, "w");
    const moves = legalMoves(r.board, "b", { koPoint: r.ko });
    expect(moves.some(([c, rr]) => c === 2 && rr === 1)).toBe(false);
    expect(boardToRows(r.board)[1]).toBe("XO.O.....");
  });
});

describe("chainsInAtari", () => {
  it("finds nothing on an empty or safe board", () => {
    expect(chainsInAtari(createBoard(9), "b")).toEqual([]);
    expect(chainsInAtari(withStone(createBoard(9), 4, 4, "b"), "b")).toEqual([]);
  });
  it("reports each one-liberty chain once with its last liberty", () => {
    // White at (4,4) hemmed on three sides; black pair (0,0)-(1,0) hemmed except (1,1).
    const b = boardFromRows(pad9([
      "XXO......",
      "O........",
      ".........",
      "....X....",
      "...XOX...",
    ]));
    const w = chainsInAtari(b, "w");
    expect(w).toHaveLength(1);
    expect(w[0].stones).toEqual([[4, 4]]);
    expect(w[0].liberty).toBe(idx(9, 4, 5));
    const blk = chainsInAtari(b, "b");
    expect(blk).toHaveLength(1);
    expect(blk[0].stones.length).toBe(2);
    expect(blk[0].liberty).toBe(idx(9, 1, 1));
  });
  it("ignores the other colour and chains with two liberties", () => {
    const b = boardFromRows(pad9(["XO......."]));
    expect(chainsInAtari(b, "b")).toHaveLength(1);
    expect(chainsInAtari(b, "w")).toEqual([]);
  });
});
