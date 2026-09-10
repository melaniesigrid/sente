import { describe, it, expect } from "vitest";
import { createBoard, withStone, idx } from "../board.js";
import { hashBoard } from "../zobrist.js";
import {
  TRANSFORMS, transformPoint, inverseTransform, transformBoard, canonical, canonicalMove, bookKey, fromCanonical,
} from "./symmetries.js";

const N = 19;

describe("transformPoint", () => {
  it("has eight distinct transforms and each inverse undoes it", () => {
    const pt = [2, 5];
    const seen = new Set();
    for (const t of TRANSFORMS) {
      const [c, r] = transformPoint(t, ...pt, N);
      seen.add(`${c},${r}`);
      expect(transformPoint(inverseTransform(t), c, r, N)).toEqual(pt);
      expect(fromCanonical(t, c, r, N)).toEqual(pt);
    }
    expect(seen.size).toBe(8);
  });

  it("keeps tengen fixed and maps a corner to the four corners", () => {
    for (const t of TRANSFORMS) expect(transformPoint(t, 9, 9, N)).toEqual([9, 9]);
    const corners = new Set(TRANSFORMS.map((t) => transformPoint(t, 0, 0, N).join(",")));
    expect([...corners].sort()).toEqual(["0,0", "0,18", "18,0", "18,18"]);
  });
});

describe("transformBoard and canonical", () => {
  const board = withStone(withStone(createBoard(N), 15, 3, "b"), 3, 3, "w");

  it("moves stones the same way transformPoint moves points", () => {
    for (const t of TRANSFORMS) {
      const tb = transformBoard(board, t);
      const [c, r] = transformPoint(t, 15, 3, N);
      expect(tb.cells[idx(N, c, r)]).toBe("b");
      expect(tb.cells.filter(Boolean).length).toBe(2);
    }
  });

  it("gives every orientation the same canonical hash", () => {
    const { hash } = canonical(board);
    for (const t of TRANSFORMS) expect(canonical(transformBoard(board, t)).hash).toBe(hash);
  });

  it("returns the transform that reaches the canonical orientation and its ties", () => {
    const { hash, t, ties } = canonical(board);
    expect(hashBoard(transformBoard(board, t))).toBe(hash);
    expect(ties).toEqual([t]);                       // an asymmetric position has one
    expect(canonical(createBoard(N)).ties).toEqual(TRANSFORMS);
  });

  it("gives mirror-image moves on a symmetric position one canonical index", () => {
    const empty = createBoard(N);
    const a = canonicalMove(empty, 16, 3, "b"), b = canonicalMove(empty, 2, 15, "b"), c = canonicalMove(empty, 3, 2, "b");
    expect(a.idx).toBe(b.idx);
    expect(a.idx).toBe(c.idx);
    expect(a.key).toBe(b.key);
    expect(canonicalMove(empty, 3, 3, "b").idx).not.toBe(a.idx);   // a 4-4 is a different move
    // On an asymmetric position the index is just the move under `t`.
    const { t } = canonical(board);
    const [tc, tr] = transformPoint(t, 15, 15, N);
    expect(canonicalMove(board, 15, 15, "w").idx).toBe(tr * N + tc);
  });

  it("carries the book move back to the real board through the inverse", () => {
    // Real position: black 4-4 top right, white 4-4 top left; the book was built on the
    // canonical orientation and stores the reply there.
    const { t } = canonical(board);
    const reply = [15, 15];                             // a reply on the real board
    const [cc, cr] = transformPoint(t, ...reply, N);     // as the book stores it
    expect(fromCanonical(t, cc, cr, N)).toEqual(reply);
  });

  it("on a symmetric position any tying inverse yields an equivalent point", () => {
    // Four 4-4 stones of one colour: every transform maps the board onto itself.
    let sym = createBoard(N);
    for (const [c, r] of [[3, 3], [15, 3], [3, 15], [15, 15]]) sym = withStone(sym, c, r, "b");
    const hashes = TRANSFORMS.map((t) => hashBoard(transformBoard(sym, t)));
    expect(new Set(hashes).size).toBe(1);
    expect(canonical(sym).t).toBe(0);
    // A stored 3-3 invasion at (2, 2) comes back as one of the four 3-3 points under
    // every tying transform, never somewhere else.
    for (const t of TRANSFORMS) {
      const [c, r] = fromCanonical(t, 2, 2, N);
      expect([2, 16]).toContain(c);
      expect([2, 16]).toContain(r);
    }
  });

  it("empty board is its own canonical form", () => {
    expect(canonical(createBoard(9))).toMatchObject({ hash: 0, t: 0 });
  });
});

describe("bookKey", () => {
  it("separates the two sides to move on the same position", () => {
    expect(bookKey(12345, "b")).not.toBe(bookKey(12345, "w"));
    expect(bookKey(12345, "b")).toBe(bookKey(12345, "b"));
  });
});
