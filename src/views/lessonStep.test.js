import { describe, it, expect } from "vitest";
import {
  initStep, resetStep, stepReducer, marksFor, boardLocked, sideToMove, wrongTextFor,
  canReveal, isGated, DEFAULT_WRONG, TIMINGS, REVEAL_AFTER, GATE_FROM,
} from "./lessonStep.js";
import { lessonById, LIBRARY } from "../content/library.js";
import { idx } from "../engine/index.js";

const run = (lesson, step, actions) => actions.reduce((s, a) => stepReducer(lesson, step, s, a), initStep(lesson, step));
const at = (s, c, r) => s.board.cells[idx(s.board.size, c, r)];
const texts = (s) => s.log.map(e => e.text);
const last = (s) => s.log[s.log.length - 1];

describe("info", () => {
  const lesson = lessonById("liberties");
  const step = lesson.steps[0];
  it("starts solved with the board locked and its marks", () => {
    const s = initStep(lesson, step);
    expect(s.status).toBe("solved");
    expect(s.log).toEqual([]);
    expect(boardLocked(step, s)).toBe(true);
    expect(marksFor(step)).toEqual(step.marks);
  });
  it("never offers a reveal", () => {
    expect(canReveal(step, { ...initStep(lesson, step), attempts: 9 })).toBe(false);
  });
});

describe("quiz", () => {
  const lesson = lessonById("two-eyes");
  const step = lesson.steps[2]; // black to play (1,0); refutation at (0,0)
  it("solves on the answer, logging the success text and the captures", () => {
    const s = run(lesson, step, [{ type: "play", c: 1, r: 0 }]);
    expect(s.status).toBe("solved");
    expect(last(s)).toEqual({ tone: "success", text: step.success });
    expect(at(s, 1, 0)).toBe("b");
    expect(s.pending).toBeNull();
  });
  it("marks a wrong point and keeps the correction after the marker clears", () => {
    const s = run(lesson, step, [{ type: "play", c: 5, r: 5 }]);
    expect(s.status).toBe("wrong");
    expect(s.wrong).toEqual({ c: 5, r: 5 });
    expect(s.attempts).toBe(1);
    expect(last(s)).toEqual({ tone: "correction", text: wrongTextFor(step) });
    expect(s.pending).toEqual({ ms: TIMINGS.wrongHold, action: { type: "clearWrong" } });
    expect(at(s, 5, 5)).toBeNull();
    const cleared = stepReducer(lesson, step, s, s.pending.action);
    expect(cleared.status).toBe("open");
    expect(cleared.wrong).toBeNull();
    expect(cleared.pending).toBeNull();
    // The words stay. This is the whole point of the log.
    expect(cleared.log).toEqual(s.log);
  });
  it("does not repeat the same correction twice in a row", () => {
    let s = run(lesson, step, [{ type: "play", c: 5, r: 5 }, { type: "clearWrong" }]);
    s = stepReducer(lesson, step, s, { type: "play", c: 6, r: 6 });
    expect(s.log).toHaveLength(1);
    expect(s.attempts).toBe(2);
  });
  it("treats an illegal point as wrong without touching the board", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 1 }]); // occupied
    expect(s.status).toBe("wrong");
  });
  it("says why a refutation fails as the stone lands, then plays the punishment", () => {
    const s1 = run(lesson, step, [{ type: "play", c: 0, r: 0 }]);
    expect(s1.status).toBe("busy");
    expect(at(s1, 0, 0)).toBe("b");
    expect(s1.attempts).toBe(1);
    expect(last(s1).tone).toBe("correction");
    expect(last(s1).text).toMatch(/only one eye/);
    expect(s1.pending).toEqual({ ms: TIMINGS.reply, action: { type: "refute" } });
    const s2 = stepReducer(lesson, step, s1, s1.pending.action);
    expect(at(s2, 1, 0)).toBe("w");
    expect(s2.status).toBe("review");
    expect(s2.pending).toBeNull();
    expect(s2.log).toEqual(s1.log); // the reply adds a stone, not a second sentence
    expect(boardLocked(step, s2)).toBe(false);
  });
  it("a click after a refutation resets the stones and keeps the transcript", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 0 }, { type: "refute" }]);
    const again = stepReducer(lesson, step, s, { type: "play", c: 4, r: 4 });
    expect(again.board).toEqual(initStep(lesson, step).board);
    expect(again.status).toBe("open");
    expect(again.log).toEqual(s.log);
    expect(stepReducer(lesson, step, s, { type: "reset" })).toEqual(again);
  });
  it("ignores clicks while busy or solved", () => {
    const solved = run(lesson, step, [{ type: "play", c: 1, r: 0 }]);
    expect(stepReducer(lesson, step, solved, { type: "play", c: 5, r: 5 })).toBe(solved);
  });
  it("offers Show me after two misses and plays the answer out", () => {
    let s = initStep(lesson, step);
    expect(canReveal(step, s)).toBe(false);
    s = run(lesson, step, [
      { type: "play", c: 5, r: 5 }, { type: "clearWrong" },
      { type: "play", c: 6, r: 6 }, { type: "clearWrong" },
    ]);
    expect(s.attempts).toBe(REVEAL_AFTER);
    expect(canReveal(step, s)).toBe(true);
    const shown = stepReducer(lesson, step, s, { type: "reveal" });
    expect(shown.status).toBe("solved");
    expect(shown.revealed).toBe(true);
    expect(at(shown, 1, 0)).toBe("b");
    expect(last(shown)).toEqual({ tone: "success", text: step.success });
    expect(canReveal(step, shown)).toBe(false);
  });
});

describe("wrongTextFor", () => {
  it("uses the step's own line, else the neutral default — never the hint", () => {
    expect(wrongTextFor({ wrongText: "Nope.", hint: "Hint." })).toBe("Nope.");
    expect(wrongTextFor({ hint: "Hint." })).toBe(DEFAULT_WRONG);
    expect(wrongTextFor({})).toBe(DEFAULT_WRONG);
    const opening = lessonById("first-9x9-opening");
    expect(wrongTextFor(opening.steps[4])).toBe(opening.steps[4].wrongText);
  });
});

describe("sequence", () => {
  const lesson = lessonById("connect-cut");
  const step = lesson.steps[3]; // b(3,3) w(4,4) b(3,1) — short, so the reply is on a timer
  it("keeps every commentary line instead of overwriting it", () => {
    const s0 = initStep(lesson, step);
    expect(sideToMove(step, s0)).toBe("b");
    expect(isGated(step)).toBe(false);
    const s1 = stepReducer(lesson, step, s0, { type: "play", c: 3, r: 3 });
    expect(s1.status).toBe("busy");
    expect(texts(s1)).toEqual([step.commentary[0]]);
    expect(s1.pending).toEqual({ ms: TIMINGS.reply, action: { type: "reply" } });
    expect(boardLocked(step, s1)).toBe(true);
    const s2 = stepReducer(lesson, step, s1, { type: "reply" });
    expect(at(s2, 4, 4)).toBe("w");
    expect(s2.status).toBe("open");
    expect(texts(s2)).toEqual([step.commentary[0], step.commentary[1]]);
    expect(sideToMove(step, s2)).toBe("b");
    const s3 = stepReducer(lesson, step, s2, { type: "play", c: 3, r: 1 });
    expect(s3.status).toBe("solved");
    expect(texts(s3)).toEqual([...step.commentary, step.success]);
    expect(at(s3, 3, 2)).toBeNull(); // the capture happened
    expect(s3.flash).toEqual([[3, 2]]);
  });
  it("a wrong move marks the point, keeps the correction, and does not advance", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 0 }]);
    expect(s.status).toBe("wrong");
    expect(s.wrong).toEqual({ c: 0, r: 0 });
    expect(last(s)).toEqual({ tone: "correction", text: wrongTextFor(step) });
    expect(s.moveIdx).toBe(0);
    expect(at(s, 0, 0)).toBeNull();
    const cleared = stepReducer(lesson, step, s, { type: "clearWrong" });
    expect(cleared.wrong).toBeNull();
    expect(cleared.status).toBe("open");
    expect(cleared.log).toEqual(s.log);
  });
  it("ends solved when the scripted reply is the last move", () => {
    const ko = lessonById("ko");
    const seq = ko.steps[2]; // 4 moves, ends on white's retake
    expect(isGated(seq)).toBe(true);
    let s = initStep(ko, seq);
    s = stepReducer(ko, seq, s, { type: "play", c: 4, r: 3 });
    // Long sequences wait for the learner rather than a clock.
    expect(s.status).toBe("await");
    expect(s.pending).toBeNull();
    expect(boardLocked(seq, s)).toBe(true);
    s = stepReducer(ko, seq, s, { type: "reply" });
    expect(s.status).toBe("open");
    s = stepReducer(ko, seq, s, { type: "play", c: 7, r: 6 });
    expect(s.status).toBe("await");
    s = stepReducer(ko, seq, s, { type: "reply" });
    expect(s.status).toBe("solved");
    expect(texts(s)).toEqual([...seq.commentary, seq.success]);
    expect(at(s, 3, 3)).toBe("w");
    expect(at(s, 4, 3)).toBeNull();
  });
  it("reveal plays the whole sequence out with all of its lines", () => {
    const s = stepReducer(lesson, step, { ...initStep(lesson, step), attempts: 2 }, { type: "reveal" });
    expect(s.status).toBe("solved");
    expect(s.revealed).toBe(true);
    expect(texts(s)).toEqual([...step.commentary, step.success]);
    expect(at(s, 3, 2)).toBeNull();
  });
});

describe("choice", () => {
  const lesson = lessonById("first-9x9-opening");
  const step = lesson.steps[1];
  it("shows the options as marks and ignores unmarked points", () => {
    expect(marksFor(step)).toEqual(step.options.map(o => o.point));
    const s = run(lesson, step, [{ type: "play", c: 5, r: 5 }]);
    expect(s).toEqual(initStep(lesson, step));
  });
  it("the best option solves the step", () => {
    const s = run(lesson, step, [{ type: "play", c: 4, r: 4 }]);
    expect(s.status).toBe("solved");
    expect(s.verdict).toBe("best");
    expect(s.attempts).toBe(0);
    expect(last(s).tone).toBe("success");
    expect(last(s).text).toMatch(/Tengen/);
  });
  it("another option logs its verdict and waits for the learner", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 0 }]);
    expect(s.status).toBe("review");
    expect(s.verdict).toBe("poor");
    expect(last(s).tone).toBe("verdict");
    expect(last(s).verdict).toBe("poor");
    expect(s.attempts).toBe(1);
    expect(at(s, 0, 0)).toBe("b");
    expect(s.pending).toBeNull();
    const again = stepReducer(lesson, step, s, { type: "play", c: 2, r: 2 });
    expect(again.board).toEqual(initStep(lesson, step).board);
    expect(again.log).toEqual(s.log);
  });
});

describe("count", () => {
  const lesson = lessonById("territory-count");
  const step = lesson.steps[4]; // 16.5
  it("locks the board and accepts the answer within tolerance", () => {
    const s0 = initStep(lesson, step);
    expect(boardLocked(step, s0)).toBe(true);
    expect(stepReducer(lesson, step, s0, { type: "play", c: 4, r: 4 })).toBe(s0);
    expect(run(lesson, step, [{ type: "answer", value: "16.5" }]).status).toBe("solved");
    expect(run(lesson, step, [{ type: "answer", value: "16,5" }]).status).toBe("solved");
    expect(last(run(lesson, step, [{ type: "answer", value: 16.5 }])).text).toBe(step.success);
  });
  it("rejects a wrong or empty answer, keeping the correction", () => {
    const s = run(lesson, step, [{ type: "answer", value: "17" }]);
    expect(s.status).toBe("wrong");
    expect(last(s)).toEqual({ tone: "correction", text: wrongTextFor(step) });
    expect(run(lesson, step, [{ type: "answer", value: "" }]).status).toBe("wrong");
    const cleared = stepReducer(lesson, step, s, { type: "clearWrong" });
    expect(cleared.status).toBe("open");
    expect(cleared.log).toEqual(s.log);
  });
  it("honours tolerance", () => {
    const loose = { ...step, tolerance: 1 };
    expect(run(lesson, loose, [{ type: "answer", value: "17" }]).status).toBe("solved");
  });
  it("reveal states the count before the success line", () => {
    const s = stepReducer(lesson, step, { ...initStep(lesson, step), attempts: 2 }, { type: "reveal" });
    expect(s.status).toBe("solved");
    expect(texts(s)).toEqual([`The count is ${step.answer}.`, step.success]);
  });
});

describe("resetStep", () => {
  const lesson = lessonById("two-eyes");
  const step = lesson.steps[2];
  it("puts the stones back and keeps the transcript and the miss count", () => {
    const s = run(lesson, step, [{ type: "play", c: 5, r: 5 }]);
    const r = resetStep(lesson, step, s);
    expect(r.board).toEqual(initStep(lesson, step).board);
    expect(r.wrong).toBeNull();
    expect(r.pending).toBeNull();
    expect(r.log).toEqual(s.log);
    expect(r.attempts).toBe(s.attempts);
  });
});

describe("every step in the library can be finished without guessing", () => {
  it("reveal solves every non-info step", () => {
    for (const lesson of LIBRARY) {
      for (const step of lesson.steps) {
        if (step.type === "info") continue;
        const s = stepReducer(lesson, step, { ...initStep(lesson, step), attempts: REVEAL_AFTER }, { type: "reveal" });
        expect(`${lesson.id}: ${s.status}`).toBe(`${lesson.id}: solved`);
        expect(s.log.length).toBeGreaterThan(0);
      }
    }
  });
  it("gating only ever applies to sequences", () => {
    for (const lesson of LIBRARY) {
      for (const step of lesson.steps) {
        if (isGated(step)) {
          expect(step.type).toBe("sequence");
          expect(step.moves.length).toBeGreaterThanOrEqual(GATE_FROM);
        }
      }
    }
  });
});
