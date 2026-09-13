/* ----------------------- THE ENDGAME SOLVER -----------------------
   `endgame-last-points` quotes six numbers, and a lesson that quotes a number
   nothing checks is back to being an assertion. So the numbers are re-derived
   here, on every build, from the position the lesson actually ships: the board
   is read out of the lesson data rather than written again, so the two cannot
   drift apart.

   It is a test of the tool rather than of the app, which is why it sits beside
   the tool. If the engine's scoring ever changes, this is what says which
   sentence in the lesson became false. */
import { describe, it, expect } from "vitest";
import { chainAt, idx, createBoard } from "../../src/engine/index.js";
import { solver, emptyPoints, finalScore, P, fmt } from "./endgame.mjs";
import lesson from "../../src/content/lessons/tier6/endgame-last-points.js";

/** The lesson's own position, built the way the app builds it. */
function boardOf(setup, size = 9) {
  const b = createBoard(size);
  (setup.b || []).forEach(p => { b.cells[idx(size, p.c, p.r)] = "b"; });
  (setup.w || []).forEach(p => { b.cells[idx(size, p.c, p.r)] = "w"; });
  return b;
}

const board = boardOf(lesson.steps[0].setup);
const region = emptyPoints(board);

/* The four points the lesson marks and argues about. */
const DAME = P(8, 8);
const TERRITORY = [P(8, 0), P(8, 1)];
const EYE = P(8, 6);

describe("the position the lesson ships", () => {
  it("is the one the lesson marks: four empty points and nothing else", () => {
    expect(region.length).toBe(7);
    expect(fmt(lesson.steps[0].marks)).toBe(fmt([DAME, ...TERRITORY, EYE]));
  });

  it("has Black in one chain of thirty-seven stones with exactly four liberties", () => {
    const chain = chainAt(board, 8, 5);
    expect(chain.stones.length).toBe(37);
    expect(chain.libs.size).toBe(4);
    const libs = [...chain.libs].map(i => P(i % 9, Math.floor(i / 9)));
    expect(fmt(libs)).toBe(fmt([DAME, ...TERRITORY, EYE]));
  });

  /* The count step says four. It is the same four, and the step's answer is
     held to the engine rather than to the author's memory. */
  it("answers the count step's question", () => {
    const step = lesson.steps.find(s => s.type === "count");
    expect(step.answer).toBe(chainAt(board, 8, 5).libs.size);
  });
});

describe("what the last points are worth under Japanese rules", () => {
  const S = solver(region, { rules: "japanese" });
  const v = S.values(board, "b");
  const worth = (p) => v.moves.find(m => m.point.c === p.c && m.point.r === p.r).score;

  it("starts level: three points each, and a tie either way", () => {
    expect(finalScore(board, 0, "japanese").totals).toEqual({ b: 3, w: 3 });
    expect(S.solve(board, "b")).toBe(0);
    expect(S.solve(board, "w")).toBe(0);
  });

  it("makes the neutral point free, and passing just as good", () => {
    expect(worth(DAME)).toBe(0);
    expect(v.pass).toBe(0);
  });

  it("charges a point for filling your own territory", () => {
    for (const p of TERRITORY) expect(worth(p), fmt([p])).toBe(-1);
  });

  /* The number the lesson is really about. Forty-one is three points of
     territory plus the thirty-eight stones that stop being alive. */
  it("charges forty-one for filling your own eye", () => {
    expect(worth(EYE)).toBe(-41);
  });
});

describe("and what they are worth under Chinese rules", () => {
  const S = solver(region, { rules: "chinese" });
  const v = S.values(board, "b");
  const worth = (p) => v.moves.find(m => m.point.c === p.c && m.point.r === p.r).score;

  it("counts the stones too, so the same board reads forty each", () => {
    expect(finalScore(board, 0, "chinese").totals).toEqual({ b: 40, w: 40 });
  });

  /* The whole of the fourth step: the move that was worth nothing is now the
     game, and the pass that was correct now loses. */
  it("makes the neutral point worth the game, and passing lose it", () => {
    expect(worth(DAME)).toBe(1);
    expect(v.pass).toBe(-1);
    expect(S.solve(board, "b")).toBe(1);
    expect(S.solve(board, "w")).toBe(-1);
  });

  it("still ends the group for filling its eye", () => {
    expect(worth(EYE)).toBe(-42);
  });
});

describe("the solver itself", () => {
  /* A one-point eye each and a neutral point between: the smallest board where
     "both alive, nothing to gain" is the right answer, and a check that the
     search stops instead of filling eyes to keep the game going. */
  const tiny = boardOf({
    b: [P(0, 1), P(1, 1), P(1, 0)],
    w: [P(3, 0), P(3, 1), P(2, 1)],
  }, 4);

  it("passes rather than filling its own eye when nothing is to be gained", () => {
    const S = solver(emptyPoints(tiny), { rules: "japanese" });
    const v = S.values(tiny, "b");
    const eye = v.moves.find(m => m.point.c === 0 && m.point.r === 0);
    expect(eye.score).toBeLessThanOrEqual(v.pass);
  });

  it("agrees with itself whichever side is asked to move first", () => {
    const S = solver(region, { rules: "japanese" });
    expect(S.solve(board, "b")).toBe(S.solve(board, "w"));
  });
});
