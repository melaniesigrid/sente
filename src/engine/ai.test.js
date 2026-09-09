import { describe, it, expect } from "vitest";
import { createBoard, idx, withStone } from "./board.js";
import { tryPlay } from "./rules.js";
import { createGame, play } from "./record.js";
import { aiChooseMove, aiChooseMoveForRecord } from "./ai.js";

describe("aiChooseMove", () => {
  it("returns a legal move on an empty board", () => {
    const m = aiChooseMove(createBoard(9), "b", null, 0);
    expect(m).not.toBeNull();
    expect(tryPlay(createBoard(9), m[0], m[1], "b").ok).toBe(true);
  });
  it("takes an available capture", () => {
    let b = createBoard(9);
    b = withStone(b, 1, 1, "w");
    b = withStone(b, 0, 1, "b"); b = withStone(b, 2, 1, "b"); b = withStone(b, 1, 0, "b");
    const m = aiChooseMove(b, "b", null, 10, { noise: 0 });
    expect(m).toEqual([1, 2]);
  });
  it("never plays on the ko point", () => {
    const b = createBoard(9);
    const ko = idx(9, 4, 4);
    for (let i = 0; i < 20; i++) {
      const m = aiChooseMove(b, "w", ko, 5);
      expect(idx(9, m[0], m[1])).not.toBe(ko);
    }
  });
  it("passes late in the game when nothing is worthwhile", () => {
    // Black owns the whole board with two one-point eyes. Filling either
    // eye is self-atari, so the only sensible choice is to pass.
    const b = createBoard(9);
    b.cells.fill("b");
    b.cells[idx(9, 0, 0)] = null; b.cells[idx(9, 8, 8)] = null;
    expect(aiChooseMove(b, "b", null, 60, { noise: 0 })).toBeNull();
  });
  it("passes late in the game even with a noisy persona", () => {
    const b = createBoard(9);
    b.cells.fill("b");
    b.cells[idx(9, 0, 0)] = null; b.cells[idx(9, 8, 8)] = null;
    for (let i = 0; i < 20; i++) expect(aiChooseMove(b, "b", null, 60, { noise: 6 })).toBeNull();
  });
  it("does not fill its own one-point eye while another move exists", () => {
    // Black wall down column 4; (0,0) is a black eye, the right half is open.
    const b = createBoard(9);
    for (let r = 0; r < 9; r++) b.cells[idx(9, 4, r)] = "b";
    for (let r = 0; r < 9; r++) for (let c = 0; c < 4; c++) b.cells[idx(9, c, r)] = "b";
    b.cells[idx(9, 0, 0)] = null;
    for (let i = 0; i < 20; i++) expect(aiChooseMove(b, "b", null, 40, { noise: 6 })).not.toEqual([0, 0]);
  });
  it.each([13, 19])("plays a legal opening move on %ix%i, preferring the 3rd/4th line", (size) => {
    const b = createBoard(size);
    const m = aiChooseMove(b, "b", null, 0, { noise: 0 });
    expect(tryPlay(b, m[0], m[1], "b").ok).toBe(true);
    const dEdge = Math.min(m[0], m[1], size - 1 - m[0], size - 1 - m[1]);
    expect(dEdge).toBe(2);
  });
  it("scales the pass threshold with board area", () => {
    // Nothing but self-atari eye fills is left. Move 40 is late on 9x9 (threshold 34)
    // but early on 19x19 (threshold 152), so the bot keeps playing there until move 153.
    const b = createBoard(19);
    b.cells.fill("b");
    b.cells[idx(19, 0, 0)] = null; b.cells[idx(19, 18, 18)] = null;
    expect(aiChooseMove(b, "b", null, 40, { noise: 0 })).not.toBeNull();
    expect(aiChooseMove(b, "b", null, 153, { noise: 0 })).toBeNull();
  });
  it("scans a 19x19 board quickly enough for a UI turn", () => {
    const b = createBoard(19);
    const t0 = performance.now();
    for (let i = 0; i < 5; i++) aiChooseMove(b, "b", null, 10);
    expect((performance.now() - t0) / 5).toBeLessThan(100);
  });
});

describe("aiChooseMoveForRecord", () => {
  it("honours superko history from the record", () => {
    //   . X . O      after black sends two and white captures, retaking at (1,0)
    //   X O O O      would repeat the position: the bot must not pick it even
    //   X X X X      though it is the only capture on the board.
    let g = createGame({
      size: 9,
      setup: { b: [[1, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2]], w: [[3, 0], [1, 1], [2, 1], [3, 1]] },
    });
    g = play(g, 2, 0);
    g = play(g, 0, 0);
    for (let i = 0; i < 10; i++) {
      const m = aiChooseMoveForRecord(g, { noise: 0 });
      expect(m).not.toEqual([1, 0]);
      expect(() => play(g, m[0], m[1])).not.toThrow();
    }
  });
  it("returns null once the game has left the playing phase", () => {
    let g = createGame({ size: 9 });
    g = { ...g, phase: "scoring" };
    expect(aiChooseMoveForRecord(g)).toBeNull();
  });
});

describe("seeded house player", () => {
  const position = () => {
    let rec = createGame({ size: 9 });
    rec = play(rec, 4, 4); rec = play(rec, 2, 2); rec = play(rec, 6, 2);
    return rec;
  };
  it("gives the same reply for the same seed and position, on a noisy persona", () => {
    const a = aiChooseMoveForRecord(position(), { noise: 6 }, { seed: 12345 });
    const b = aiChooseMoveForRecord(position(), { noise: 6 }, { seed: 12345 });
    expect(a).toEqual(b);
  });
  it("does not depend on the path taken to the position", () => {
    let other = createGame({ size: 9 });
    other = play(other, 6, 2); other = play(other, 2, 2); other = play(other, 4, 4);
    expect(aiChooseMoveForRecord(other, { noise: 6 }, { seed: 12345 }))
      .toEqual(aiChooseMoveForRecord(position(), { noise: 6 }, { seed: 12345 }));
  });
  it("varies with the seed", () => {
    const seen = new Set();
    for (let s = 0; s < 40; s++) seen.add(String(aiChooseMoveForRecord(position(), { noise: 6 }, { seed: s })));
    expect(seen.size).toBeGreaterThan(1);
  });
  it("accepts an explicit rng and never touches Math.random when seeded", () => {
    const orig = Math.random;
    Math.random = () => { throw new Error("Math.random must not be used"); };
    try {
      expect(aiChooseMove(createBoard(9), "b", null, 0, {}, { rng: () => 0.5 })).not.toBeNull();
      expect(aiChooseMoveForRecord(position(), {}, { seed: 1 })).not.toBeNull();
    } finally { Math.random = orig; }
  });
});
