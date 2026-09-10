/* The eval's pure parts on a synthetic master: keep-set coverage, the arms, and the
   cross control, without the network. */
import { describe, it, expect } from "vitest";
import { keepSet, networkTop, bookMove, scoreMaster, moveVector, MOVE_AXES } from "./eval.mjs";
import { createBoard, withStone, canonical, bookKey, transformPoint } from "../../src/engine/index.js";

const N = 19;
const at = (c, r) => r * N + c;

describe("keepSet", () => {
  it("keeps legal moves within the floor of the best and reports coverage", () => {
    const sparse = { [at(3, 3)]: 2.0, [at(15, 3)]: 1.0, [at(9, 9)]: -3.0, 361: -9 };
    const legal = [at(3, 3), at(15, 3), at(9, 9), at(0, 0)];
    const { keep, covered } = keepSet(sparse, legal, 0.02);
    expect(keep).toEqual([at(3, 3), at(15, 3)]);     // ln(0.02) = -3.9: -3.0 is inside, missing (0,0) is not
    expect(covered).toBe(true);
  });

  it("flags a dump whose smallest logit is still above the threshold", () => {
    const sparse = { [at(3, 3)]: 2.0, [at(15, 3)]: 1.9 };
    expect(keepSet(sparse, [at(3, 3), at(15, 3), at(0, 0)], 0.02).covered).toBe(false);
  });

  it("ignores illegal points when picking the best", () => {
    const sparse = { [at(3, 3)]: 5.0, [at(15, 3)]: 1.0, [at(0, 0)]: -20 };
    expect(networkTop(sparse, [at(15, 3), at(0, 0)])).toBe(at(15, 3));
  });
});

describe("bookMove", () => {
  it("returns the most played move mapped back to the real orientation", () => {
    const board = withStone(createBoard(N), 15, 3, "b");        // black 4-4 top right
    const { hash, t } = canonical(board);
    const [cc, cr] = transformPoint(t, 3, 15, N);               // white answers at the opposite 4-4
    const book = { entries: { [bookKey(hash, "w")]: { [cr * N + cc]: 5, [at(2, 2)]: 1 } } };
    expect(bookMove(book, board, "w")).toBe(at(3, 15));
    expect(bookMove(book, board, "b")).toBeNull();
  });
});

describe("scoreMaster", () => {
  // One game: the master (black) opens 4-4 then 3-4; the network prefers 3-3 at both.
  const game = {
    file: "g.sgf", masterColor: "b", firstToPlay: "b", split: "test", even: true,
    seq: [["b", 3, 3], ["w", 15, 15], ["b", 16, 3], ["w", 3, 15]],
  };
  const dense = (top, second) => ({ [top]: 3.0, [second]: 2.0, [at(9, 9)]: -6.0, 361: -12 });
  const positions = [
    { file: "g.sgf", k: 0, color: "b", year: 1846, move: [3, 3], logits: dense(at(2, 2), at(3, 3)) },
    { file: "g.sgf", k: 2, color: "b", year: 1846, move: [16, 3], logits: dense(at(16, 2), at(16, 3)) },
  ];
  const emptyKey = bookKey(0, "b");
  const book = { entries: { [emptyKey]: { [at(3, 3)]: 4, [at(2, 2)]: 1 } } };   // the empty board is its own canonical form

  it("counts a mirror-image reply on a symmetric position as agreement", () => {
    const mirrored = [{ ...positions[0], logits: dense(at(15, 15), at(2, 2)) }];   // 4-4 in another corner
    const r = scoreMaster({ games: [game], positions: mirrored, book: { entries: {} } });
    expect(r.arms.a.top1).toBe(1);
  });

  it("scores arm a against the master's move and arm b with the book override", () => {
    const r = scoreMaster({ games: [game], positions, book });
    expect(r.positions).toBe(2);
    expect(r.uncovered).toBe(0);
    expect(r.arms.a.top1).toBe(0);
    expect(r.arms.b.top1).toBe(0.5);       // the book has the first move, not the second
    expect(r.bookHits).toBe(1);
    expect(r.arms.b.top1Opening).toBe(0.5);
    expect(r.arms.b.top1Late).toBeNull();
    expect(r.arms.c).toBeNull();
    expect(r.arms.cross).toBeNull();
    expect(r.bySplit.test).toEqual({ positions: 2, a: 0, b: 0.5 });
  });

  it("runs the cross control with another master's book", () => {
    const cross = { entries: { [emptyKey]: { [at(2, 2)]: 9 } } };
    const r = scoreMaster({ games: [game], positions, book, crossBook: cross });
    expect(r.crossHits).toBe(1);
    expect(r.arms.cross.top1).toBe(0);
  });

  it("measures the arms' style distance from the master's own moves", () => {
    const r = scoreMaster({ games: [game], positions, book });
    expect(r.arms.a.styleDistance).toBeGreaterThan(0);
    expect(r.arms.b.styleDistance).toBeLessThan(r.arms.a.styleDistance);
    for (const a of MOVE_AXES) expect(r.baseline).toHaveProperty(a);
  });

  it("counts an uncovered position instead of scoring it", () => {
    const thin = [{ ...positions[0], logits: { [at(2, 2)]: 3.0, [at(3, 3)]: 2.9 } }];
    const r = scoreMaster({ games: [game], positions: thin, book });
    expect(r.uncovered).toBe(1);
    expect(r.positions).toBe(0);
  });
});

describe("moveVector", () => {
  it("one-hot lines and the per-move axes", () => {
    const v = moveVector(createBoard(N), at(3, 3), "b", { moveNumber: 1 });
    expect(v.line4).toBe(1);
    expect(v.line3).toBe(0);
    expect(v.contact).toBe(0);
    expect(v.tenuki).toBeNull();
  });
});
