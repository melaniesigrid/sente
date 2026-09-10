import { describe, it, expect } from "vitest";
import { createGame, play } from "../record.js";
import { canonical, canonicalMove, bookKey, transformBoard, TRANSFORMS } from "./symmetries.js";
import { StyleDataError, validateMaster, bookEntry, sampleBook } from "./master.js";

const N = 19;

const good = () => ({
  id: "test", name: "Test", years: [1840, 1850],
  games: { even: 120 },
  style: { master: { contact: 0.5 } },
  book: { moves: 30, minGames: 3, entries: {} },
});

describe("validateMaster", () => {
  it("accepts a well-formed master and returns it", () => {
    const m = good();
    expect(validateMaster(m, "masters/test.json")).toBe(m);
  });

  it.each([
    ["not an object", null],
    ["missing id", { ...good(), id: "" }],
    ["years", { ...good(), years: [1840] }],
    ["games.even", { ...good(), games: {} }],
    ["style.master", { ...good(), style: {} }],
    ["book.entries", { ...good(), book: {} }],
    ["bad entry", { ...good(), book: { entries: { k: 5 } } }],
    ["bad move key", { ...good(), book: { entries: { k: { "x": 3 } } } }],
    ["bad count", { ...good(), book: { entries: { k: { "12": 0 } } } }],
  ])("rejects %s with a StyleDataError naming the file", (_, json) => {
    expect(() => validateMaster(json, "masters/test.json")).toThrow(StyleDataError);
    try { validateMaster(json, "masters/test.json"); } catch (e) { expect(e.message).toMatch(/^masters\/test\.json: /); expect(e.file).toBe("masters/test.json"); }
  });
});

describe("bookEntry", () => {
  it("finds the position from any orientation and maps the moves back", () => {
    // The book was built from one orientation: black 4-4 top right, white to answer at 3-4 bottom left.
    let rec = play(createGame({ size: N }), 15, 3);
    const { key, idx } = canonicalMove(rec.board, 2, 15, "w");
    const master = { ...good(), book: { entries: { [key]: { [idx]: 7, [canonicalMove(rec.board, 3, 15, "w").idx]: 2 } } } };
    const e = bookEntry(master, rec);
    expect(e.moves[0]).toEqual({ c: 2, r: 15, n: 7 });
    expect(e.moves[1]).toEqual({ c: 3, r: 15, n: 2 });
    // A mirrored game reaches the same entry and gets the mirrored reply.
    for (const t of TRANSFORMS) {
      const mirrored = { ...rec, board: transformBoard(rec.board, t) };
      const me = bookEntry(master, mirrored);
      expect(me).not.toBeNull();
      expect(me.moves[0].n).toBe(7);
      // the reply is a 3-4 point in the corner opposite the stone
      const { c, r } = me.moves[0];
      const lines = [Math.min(c, N - 1 - c) + 1, Math.min(r, N - 1 - r) + 1].sort();
      expect(lines).toEqual([3, 4]);
    }
  });

  it("is null off book and keyed by the side to move", () => {
    const rec = play(createGame({ size: N }), 15, 3);
    const { hash } = canonical(rec.board);
    const master = { ...good(), book: { entries: { [bookKey(hash, "b")]: { "40": 3 } } } };
    expect(bookEntry(master, rec)).toBeNull();      // white to move, entry is for black
  });
});

describe("sampleBook", () => {
  const moves = [{ c: 1, r: 1, n: 3 }, { c: 2, r: 2, n: 1 }];
  it("draws by weight and reports the move's share", () => {
    expect(sampleBook(moves, () => 0.1)).toEqual({ c: 1, r: 1, prob: 0.75 });
    expect(sampleBook(moves, () => 0.9)).toEqual({ c: 2, r: 2, prob: 0.25 });
    expect(sampleBook(moves, () => 0.999999)).toEqual({ c: 2, r: 2, prob: 0.25 });
  });
});
