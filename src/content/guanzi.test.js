import { describe, it, expect } from "vitest";
import { scoreBoard, tryPlay, opponent } from "../engine/index.js";
import { GUANZI, GUANZI_SOURCE } from "./guanzi.js";
import { BOOKS, bookById, lessonsInBook, lessonById } from "./library.js";
import { setupToBoard } from "./positions.js";

/* The library verifier checks that a `count` step asks for a number. It does
   not check that the number is right, so these lessons check their own: every
   total a Guanzi lesson states is scored here against the engine. A lesson
   that quietly drifts from the position it describes fails the suite. */

const areaOf = (setup, size = 9) => {
  const s = scoreBoard(setupToBoard(setup, size), { komi: 0 });
  return { b: s.black.area, w: s.white.area, neutral: s.territory.filter(t => t === "neutral").length };
};

/** Play an alternating line and return the settled board's areas. */
function playOut(setup, color, moves, size = 9) {
  let board = setupToBoard(setup, size), ko = null;
  for (const m of moves) {
    const res = tryPlay(board, m.c, m.r, color, { koPoint: ko });
    expect(res.ok, `(${m.c},${m.r}) for ${color}: ${res.reason}`).toBe(true);
    board = res.board; ko = res.ko; color = opponent(color);
  }
  const s = scoreBoard(board, { komi: 0 });
  return { b: s.black.area, w: s.white.area, neutral: s.territory.filter(t => t === "neutral").length };
}

describe("the endgame book", () => {
  it("is on the shelf with a source line", () => {
    expect(bookById(GUANZI.key)).not.toBeNull();
    expect(BOOKS.some(b => b.id === "guanzi")).toBe(true);
    expect(GUANZI_SOURCE).toMatch(/Guanzi Pu/);
    const lessons = lessonsInBook("guanzi");
    expect(lessons.length).toBeGreaterThan(0);
    for (const l of lessons) {
      expect(l.track, l.id).toBe("endgame");
      expect(l.sources).toContain(GUANZI_SOURCE);
    }
  });

  it("states no total the engine does not agree with", () => {
    for (const lesson of lessonsInBook("guanzi")) {
      for (const step of lesson.steps) {
        if (step.type !== "count") continue;
        const { b, neutral } = areaOf(step.setup, lesson.size);
        expect(neutral, `${lesson.id}: the counted position must be settled`).toBe(0);
        expect(b, `${lesson.id}: counted area`).toBe(step.answer);
      }
    }
  });
});

describe("What Gote Costs", () => {
  const lesson = lessonById("guanzi-gote-alternates");
  const open = lesson.steps[0].setup;
  const P = (c, r) => ({ c, r });

  it("settles at the same score whoever takes which boundary", () => {
    // The six moves are two hane-block-connect exchanges, one per edge.
    const orders = [
      ["b", [P(4, 8), P(5, 8), P(3, 8), P(3, 0), P(2, 0), P(4, 0)]], // Black takes the bottom
      ["w", [P(3, 8), P(2, 8), P(4, 8), P(4, 0), P(5, 0), P(3, 0)]], // White takes the bottom
      ["b", [P(4, 0), P(5, 0), P(3, 0), P(3, 8), P(2, 8), P(4, 8)]], // Black takes the top first
    ];
    for (const [first, moves] of orders) {
      const out = playOut(open, first, moves);
      expect(out.neutral, `order starting ${first}`).toBe(0);
      expect(out, `order starting ${first}`).toMatchObject({ b: 36, w: 45 });
    }
  });
});

describe("The Hane on the First Line", () => {
  const lesson = lessonById("guanzi-first-line-hane");
  const open = lesson.steps[0].setup;
  const P = (c, r) => ({ c, r });

  it("is worth a point over the plain block, and four over letting White have it", () => {
    // The three totals the lesson quotes, each played to a settled board.
    expect(playOut(open, "b", [P(4, 8), P(5, 8), P(3, 8)]))
      .toMatchObject({ b: 37, w: 44, neutral: 0 });   // Black hanes and connects
    expect(playOut(open, "b", [P(3, 8), P(4, 8)]))
      .toMatchObject({ b: 36, w: 45, neutral: 0 });   // Black blocks solidly
    expect(playOut(open, "w", [P(3, 8), P(2, 8), P(4, 8)]))
      .toMatchObject({ b: 35, w: 46, neutral: 0 });   // White hanes first
  });
});
