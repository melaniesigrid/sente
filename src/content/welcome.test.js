import { describe, it, expect } from "vitest";
import { WELCOME_LESSON, WELCOME_STEPS } from "./welcome.js";
import { setupToBoard } from "./positions.js";

// The step types the lesson player knows, mirrored from library.test.js.
const STEP_TYPES = ["info", "quiz", "sequence", "choice", "count", "replay", "maxim"];
import { SIZES, tryPlay, chainAt, idx } from "../engine/index.js";
import { needsOnboarding, defaultProfile } from "../store/profile.js";

/** Every chain on the board must have at least one liberty; a setup that could not
 *  have happened would teach a position the rules forbid. Same check the library
 *  verifier runs on every lesson. */
function legalPosition(board) {
  for (let r = 0; r < board.size; r++) for (let c = 0; c < board.size; c++) {
    if (board.cells[idx(board.size, c, r)] === null) continue;
    if (chainAt(board, c, r).libs.size === 0) return `chain at (${c},${r}) has no liberties`;
  }
  return null;
}

describe("the welcome demo is a well-formed lesson", () => {
  const l = WELCOME_LESSON;

  it("carries the metadata a lesson carries", () => {
    expect(l.id).toBe("welcome");
    expect(l.title).toBeTruthy();
    expect(SIZES).toContain(l.size);
    expect(Number.isInteger(l.minutes) && l.minutes > 0).toBe(true);
    expect(l.prereqs).toEqual([]);
  });
  it("is short enough to finish before anyone gives up", () => {
    expect(l.steps.length).toBeGreaterThanOrEqual(3);
    expect(l.steps.length).toBeLessThanOrEqual(6);
    expect(WELCOME_STEPS).toBe(l.steps.length);
  });
  it("speaks in the house voice: no exclamation marks", () => {
    for (const s of l.steps) {
      for (const k of ["text", "hint", "success", "wrongText"]) {
        if (s[k]) expect(s[k], s[k]).not.toMatch(/!/);
      }
    }
  });
  it("teaches a capture, because that is the rule everything rests on", () => {
    expect(l.steps.some((s) => s.type === "quiz")).toBe(true);
  });
});

describe("every position is legal, checked by the engine", () => {
  describe.each(WELCOME_LESSON.steps.map((s, i) => [i + 1, s]))("step %i", (n, step) => {
    const board = setupToBoard(step.setup, WELCOME_LESSON.size);

    it("is a known step type on a position the rules allow", () => {
      expect(STEP_TYPES).toContain(step.type);
      expect(legalPosition(board)).toBeNull();
      expect(step.text).toBeTruthy();
    });

    if (step.type === "quiz") {
      it("has a hint, success text, and answers the engine accepts", () => {
        expect(step.hint).toBeTruthy();
        expect(step.success).toBeTruthy();
        expect(step.answers.length).toBeGreaterThan(0);
        for (const a of step.answers) {
          const res = tryPlay(board, a.c, a.r, step.toPlay);
          expect(res.ok, `answer (${a.c},${a.r}): ${res.reason}`).toBe(true);
        }
      });
      it("the answer really captures, which is the whole point of the step", () => {
        for (const a of step.answers) {
          const res = tryPlay(board, a.c, a.r, step.toPlay);
          expect(res.captured.length, `answer (${a.c},${a.r}) captured nothing`).toBeGreaterThan(0);
        }
      });
    }
  });
});

describe("needsOnboarding", () => {
  const fresh = { ...defaultProfile };

  it("welcomes a genuinely untouched profile", () => {
    expect(needsOnboarding(fresh)).toBe(true);
  });
  it("never interrupts somebody who has already been through it", () => {
    expect(needsOnboarding({ ...fresh, onboarded: true })).toBe(false);
  });
  it("never interrupts a player with history, flag or no flag", () => {
    expect(needsOnboarding({ ...fresh, wins: 1 })).toBe(false);
    expect(needsOnboarding({ ...fresh, losses: 3 })).toBe(false);
    expect(needsOnboarding({ ...fresh, lessonsDone: ["liberties"] })).toBe(false);
    expect(needsOnboarding({ ...fresh, problemsDone: ["p1"] })).toBe(false);
    expect(needsOnboarding({ ...fresh, name: "Melanie" })).toBe(false);
    expect(needsOnboarding({ ...fresh, rating: 1240 })).toBe(false);
  });
  it("is false for nothing at all rather than throwing", () => {
    expect(needsOnboarding(null)).toBe(false);
    expect(needsOnboarding(undefined)).toBe(false);
  });
});
