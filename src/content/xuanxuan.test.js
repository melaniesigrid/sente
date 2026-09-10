import { describe, it, expect } from "vitest";
import { tryPlay, chainAt, idx, opponent } from "../engine/index.js";
import { XUANXUAN, XUANXUAN_SOURCE } from "./xuanxuan.js";
import { BOOKS, bookById, lessonsInBook, lessonById } from "./library.js";
import { setupToBoard } from "./positions.js";

/* ----------------------- A LIFE-AND-DEATH SOLVER -----------------------
   Exhaustive alternating search inside an eyespace. A group is alive only if
   it finishes with two eyes: surviving on the board is not the same thing,
   because an enclosed group with one eye is filled at the attacker's leisure.

   Three things this got wrong before it got them right, all worth keeping in
   the comment so the next person does not repeat them:

     1. Terminating on "still on the board" calls a dead straight three alive.
        The terminal test has to be two eyes.
     2. `cells.join("")` renders an empty point as an empty string, so ["b",null]
        and [null,"b"] produce the same memo key. Empty needs its own character.
     3. A result produced at the depth cap is only valid at that depth, so the
        cap has to be part of the key, or a truncated answer gets reused higher
        up the tree.

   It is validated below against shapes whose answers are already settled. */

const neighbours = (size, c, r) => [[c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]]
  .filter(([x, y]) => x >= 0 && y >= 0 && x < size && y < size);

/** Empty points every one of whose orthogonal neighbours is in `chainSet`. */
function eyeCount(board, chainSet) {
  let eyes = 0;
  for (let r = 0; r < board.size; r++) for (let c = 0; c < board.size; c++) {
    if (board.cells[idx(board.size, c, r)] !== null) continue;
    if (neighbours(board.size, c, r).every(([x, y]) => chainSet.has(idx(board.size, x, y)))) eyes++;
  }
  return eyes;
}

function chainSetAt(board, c, r, color) {
  if (board.cells[idx(board.size, c, r)] !== color) return null;
  return new Set(chainAt(board, c, r).stones.map(([x, y]) => idx(board.size, x, y)));
}

/** True if the defending chain at `anchor` lives against perfect attack. */
export function alive(board, anchor, defender, toMove, region, depth = 0, passes = 0, seen = new Map()) {
  const set = chainSetAt(board, anchor.c, anchor.r, defender);
  if (!set) return false;
  if (eyeCount(board, set) >= 2) return true;
  if (depth > 24 || passes >= 2) return eyeCount(board, set) >= 2;

  const key = board.cells.map(v => (v === null ? "." : v)).join("") + toMove + passes + ":" + depth;
  if (seen.has(key)) return seen.get(key);

  const results = [];
  for (const m of region) {
    if (board.cells[idx(board.size, m.c, m.r)] !== null) continue;
    const res = tryPlay(board, m.c, m.r, toMove);
    if (!res.ok) continue;
    results.push(alive(res.board, anchor, defender, opponent(toMove), region, depth + 1, 0, seen));
  }
  results.push(alive(board, anchor, defender, opponent(toMove), region, depth + 1, passes + 1, seen));

  const out = toMove === defender ? results.some(Boolean) : results.every(Boolean);
  seen.set(key, out);
  return out;
}

const P = (c, r) => ({ c, r });
const ANCHOR = P(0, 0);

/** Which points in `region` kill the white group at the anchor. */
const killingPoints = (setup, region, size = 9) => region.filter(m => {
  const res = tryPlay(setupToBoard(setup, size), m.c, m.r, "b");
  return res.ok && !alive(res.board, ANCHOR, "w", "w", region);
});

/** Which points let White live when White plays first. */
const livingPoints = (setup, region, size = 9) => region.filter(m => {
  const res = tryPlay(setupToBoard(setup, size), m.c, m.r, "w");
  return res.ok && alive(res.board, ANCHOR, "w", "b", region);
});

describe("the solver agrees with shapes whose answers are already known", () => {
  /** White walls rows 0-2 across `cols`, minus the eyespace; Black seals outside. */
  const corner = (eye, cols = 6) => {
    const inEye = new Set(eye.map(p => `${p.c},${p.r}`));
    const w = [], b = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < cols; c++) {
      if (!inEye.has(`${c},${r}`)) w.push(P(c, r));
    }
    for (let c = 0; c <= cols; c++) b.push(P(c, 3));
    for (let r = 0; r < 3; r++) b.push(P(cols, r));
    return { w, b };
  };

  it("kills a straight three and cannot kill a straight four", () => {
    const three = [P(1, 1), P(2, 1), P(3, 1)];
    expect(killingPoints(corner(three), three)).toHaveLength(1);

    const four = [P(1, 1), P(2, 1), P(3, 1), P(4, 1)];
    expect(killingPoints(corner(four), four)).toHaveLength(0);
  });

  it("kills a square four however White answers", () => {
    const square = [P(1, 1), P(2, 1), P(1, 2), P(2, 2)];
    const setup = corner(square);
    expect(alive(setupToBoard(setup, 9), ANCHOR, "w", "w", square)).toBe(false);
  });
});

describe("the mysterious classic", () => {
  it("is on the shelf and its lessons cite it", () => {
    expect(bookById(XUANXUAN.key)).not.toBeNull();
    expect(BOOKS.some(b => b.id === "xuanxuan")).toBe(true);
    const lessons = lessonsInBook("xuanxuan");
    expect(lessons.length).toBeGreaterThan(0);
    for (const l of lessons) {
      expect(l.track, l.id).toBe("life");
      expect(l.sources).toContain(XUANXUAN_SOURCE);
    }
  });
});

describe("Five Points and Five Points", () => {
  const lesson = lessonById("xuanxuan-five-points");
  const straight = lesson.steps[0].setup;
  const bulky = lesson.steps[1].setup;
  const straightEye = [P(0, 1), P(1, 1), P(2, 1), P(3, 1), P(4, 1)];
  const bulkyEye = [P(1, 1), P(2, 1), P(3, 1), P(4, 1), P(2, 2)];

  it("gives both shapes the same five points and the same single white chain", () => {
    for (const setup of [straight, bulky]) {
      const board = setupToBoard(setup, 9);
      expect(chainAt(board, 0, 0).stones).toHaveLength(setup.w.length);
      expect(setup.w).toHaveLength(13);
    }
    expect(straightEye).toHaveLength(bulkyEye.length);
  });

  it("cannot kill five in a row, and kills four with a foot at exactly one point", () => {
    expect(killingPoints(straight, straightEye)).toEqual([]);
    const kills = killingPoints(bulky, bulkyEye);
    expect(kills).toEqual([P(2, 1)]);
    // and that point is the answer the lesson asks for
    const quiz = lesson.steps.find(s => s.type === "quiz");
    expect(quiz.answers).toEqual([P(2, 1)]);
  });
});

describe("One Way In, Three Ways Out", () => {
  const lesson = lessonById("xuanxuan-one-way-in");
  const bulky = lesson.steps[0].setup;
  const eye = [P(1, 1), P(2, 1), P(3, 1), P(4, 1), P(2, 2)];

  it("finds three living moves for White against one killing move for Black", () => {
    const kills = killingPoints(bulky, eye);
    const lives = livingPoints(bulky, eye);
    expect(kills).toEqual([P(2, 1)]);
    expect(lives).toEqual([P(2, 1), P(3, 1), P(2, 2)]);
    // The proverb is only a third right, which is the lesson's whole claim.
    expect(lives).toContainEqual(kills[0]);
    expect(lives.length).toBeGreaterThan(kills.length);
  });

  it("asks for exactly those three and refutes moves that really do fail", () => {
    const quiz = lesson.steps.find(s => s.type === "quiz");
    expect(quiz.answers).toEqual(livingPoints(bulky, eye));
    for (const rf of quiz.refutations) {
      expect(livingPoints(bulky, eye)).not.toContainEqual(rf.move);
    }
  });
});
