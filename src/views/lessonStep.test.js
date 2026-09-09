import { describe, it, expect } from "vitest";
import { initStep, stepReducer, marksFor, boardLocked, sideToMove, TIMINGS } from "./lessonStep.js";
import { lessonById } from "../content/library.js";
import { idx } from "../engine/index.js";

const run = (lesson, step, actions) => actions.reduce((s, a) => stepReducer(lesson, step, s, a), initStep(lesson, step));
const at = (s, c, r) => s.board.cells[idx(s.board.size, c, r)];

describe("info", () => {
  const lesson = lessonById("liberties");
  const step = lesson.steps[0];
  it("starts solved with the board locked and its marks", () => {
    const s = initStep(lesson, step);
    expect(s.status).toBe("solved");
    expect(boardLocked(step, s)).toBe(true);
    expect(marksFor(step)).toEqual(step.marks);
  });
});

describe("quiz", () => {
  const lesson = lessonById("two-eyes");
  const step = lesson.steps[2]; // black to play (1,0); refutation at (0,0)
  it("solves on the answer, showing the success text and captures", () => {
    const s = run(lesson, step, [{ type: "play", c: 1, r: 0 }]);
    expect(s.status).toBe("solved");
    expect(s.message).toBe(step.success);
    expect(s.tone).toBe("success");
    expect(at(s, 1, 0)).toBe("b");
    expect(s.pending).toBeNull();
  });
  it("marks a wrong point and clears it after a hold", () => {
    const s = run(lesson, step, [{ type: "play", c: 5, r: 5 }]);
    expect(s.status).toBe("wrong");
    expect(s.wrong).toEqual({ c: 5, r: 5 });
    expect(s.pending).toEqual({ ms: TIMINGS.wrongHold, action: { type: "clearWrong" } });
    expect(at(s, 5, 5)).toBeNull();
    const cleared = stepReducer(lesson, step, s, s.pending.action);
    expect(cleared.status).toBe("open");
    expect(cleared.wrong).toBeNull();
  });
  it("treats an illegal point as wrong without touching the board", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 1 }]); // occupied
    expect(s.status).toBe("wrong");
  });
  it("plays a refutation: move, then reply with text, then reset", () => {
    const s1 = run(lesson, step, [{ type: "play", c: 0, r: 0 }]);
    expect(s1.status).toBe("busy");
    expect(at(s1, 0, 0)).toBe("b");
    expect(s1.pending).toEqual({ ms: TIMINGS.reply, action: { type: "refute" } });
    const s2 = stepReducer(lesson, step, s1, s1.pending.action);
    expect(at(s2, 1, 0)).toBe("w");
    expect(s2.message).toMatch(/only one eye/);
    expect(s2.pending).toEqual({ ms: TIMINGS.refuteHold, action: { type: "reset" } });
    const s3 = stepReducer(lesson, step, s2, s2.pending.action);
    expect(s3).toEqual(initStep(lesson, step));
  });
  it("ignores clicks while busy or solved", () => {
    const solved = run(lesson, step, [{ type: "play", c: 1, r: 0 }]);
    expect(stepReducer(lesson, step, solved, { type: "play", c: 5, r: 5 })).toBe(solved);
  });
});

describe("sequence", () => {
  const lesson = lessonById("connect-cut");
  const step = lesson.steps[3]; // b(3,3) w(4,4) b(3,1)
  it("alternates sides and answers automatically after the learner's move", () => {
    const s0 = initStep(lesson, step);
    expect(sideToMove(step, s0)).toBe("b");
    const s1 = stepReducer(lesson, step, s0, { type: "play", c: 3, r: 3 });
    expect(s1.status).toBe("busy");
    expect(s1.message).toBe(step.commentary[0]);
    expect(s1.pending).toEqual({ ms: TIMINGS.reply, action: { type: "reply" } });
    expect(boardLocked(step, s1)).toBe(true);
    const s2 = stepReducer(lesson, step, s1, { type: "reply" });
    expect(at(s2, 4, 4)).toBe("w");
    expect(s2.status).toBe("open");
    expect(s2.message).toBe(step.commentary[1]);
    expect(sideToMove(step, s2)).toBe("b");
    const s3 = stepReducer(lesson, step, s2, { type: "play", c: 3, r: 1 });
    expect(s3.status).toBe("solved");
    expect(s3.message).toBe(step.success);
    expect(at(s3, 3, 2)).toBeNull(); // the capture happened
    expect(s3.flash).toEqual([[3, 2]]);
  });
  it("a wrong move shows the hint and does not advance", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 0 }]);
    expect(s.status).toBe("wrong");
    expect(s.message).toBe(step.hint);
    expect(s.moveIdx).toBe(0);
    expect(at(s, 0, 0)).toBeNull();
  });
  it("ends solved when the scripted reply is the last move", () => {
    const ko = lessonById("ko");
    const seq = ko.steps[2]; // 4 moves, ends on white's retake
    let s = initStep(ko, seq);
    s = stepReducer(ko, seq, s, { type: "play", c: 4, r: 3 });
    s = stepReducer(ko, seq, s, { type: "reply" });
    s = stepReducer(ko, seq, s, { type: "play", c: 7, r: 6 });
    expect(s.status).toBe("busy");
    s = stepReducer(ko, seq, s, { type: "reply" });
    expect(s.status).toBe("solved");
    expect(at(s, 3, 3)).toBe("w");
    expect(at(s, 4, 3)).toBeNull();
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
    expect(s.message).toMatch(/Tengen/);
  });
  it("another option shows its verdict, then resets", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 0 }]);
    expect(s.status).toBe("busy");
    expect(s.verdict).toBe("poor");
    expect(s.tone).toBe("verdict");
    expect(at(s, 0, 0)).toBe("b");
    expect(s.pending).toEqual({ ms: TIMINGS.verdictHold, action: { type: "reset" } });
    expect(stepReducer(lesson, step, s, s.pending.action)).toEqual(initStep(lesson, step));
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
    expect(run(lesson, step, [{ type: "answer", value: 16.5 }]).message).toBe(step.success);
  });
  it("rejects a wrong or empty answer with the hint, then reopens", () => {
    const s = run(lesson, step, [{ type: "answer", value: "17" }]);
    expect(s.status).toBe("wrong");
    expect(s.message).toBe(step.hint);
    expect(run(lesson, step, [{ type: "answer", value: "" }]).status).toBe("wrong");
    expect(stepReducer(lesson, step, s, { type: "clearWrong" }).status).toBe("open");
  });
  it("honours tolerance", () => {
    const loose = { ...step, tolerance: 1 };
    expect(run(lesson, loose, [{ type: "answer", value: "17" }]).status).toBe("solved");
  });
});
