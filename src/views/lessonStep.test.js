import { describe, it, expect } from "vitest";
import { initStep, stepReducer, marksFor, boardLocked, sideToMove, wrongTextFor, DEFAULT_WRONG, DEFAULT_PARTIAL, TIMINGS, SCORE, recordAtStop, coordLabel } from "./lessonStep.js";
import { pt } from "../content/positions.js";
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
  it("marks a wrong point with the step's wrong text and clears it after a hold", () => {
    const s = run(lesson, step, [{ type: "play", c: 5, r: 5 }]);
    expect(s.status).toBe("wrong");
    expect(s.wrong).toEqual({ c: 5, r: 5 });
    expect(s.message).toBe(wrongTextFor(step));
    expect(s.tone).toBe("hint");
    expect(s.pending).toEqual({ ms: TIMINGS.wrongHold, action: { type: "clearWrong" } });
    expect(at(s, 5, 5)).toBeNull();
    const cleared = stepReducer(lesson, step, s, s.pending.action);
    expect(cleared.status).toBe("open");
    expect(cleared.wrong).toBeNull();
    expect(cleared.message).toBeNull();
  });
  it("treats an illegal point as wrong without touching the board", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 1 }]); // occupied
    expect(s.status).toBe("wrong");
  });
  it("plays a refutation: move, then reply with text, then waits for the learner", () => {
    const s1 = run(lesson, step, [{ type: "play", c: 0, r: 0 }]);
    expect(s1.status).toBe("busy");
    expect(at(s1, 0, 0)).toBe("b");
    expect(s1.pending).toEqual({ ms: TIMINGS.reply, action: { type: "refute" } });
    const s2 = stepReducer(lesson, step, s1, s1.pending.action);
    expect(at(s2, 1, 0)).toBe("w");
    expect(s2.message).toMatch(/only one eye/);
    expect(s2.status).toBe("review");
    expect(s2.pending).toBeNull();
    expect(boardLocked(step, s2)).toBe(false);
    // The next click anywhere resets; so does an explicit reset.
    expect(stepReducer(lesson, step, s2, { type: "play", c: 4, r: 4 })).toEqual(initStep(lesson, step));
    expect(stepReducer(lesson, step, s2, { type: "reset" })).toEqual(initStep(lesson, step));
  });
  it("ignores clicks while busy or solved", () => {
    const solved = run(lesson, step, [{ type: "play", c: 1, r: 0 }]);
    expect(stepReducer(lesson, step, solved, { type: "play", c: 5, r: 5 })).toBe(solved);
  });
});

describe("wrongTextFor", () => {
  it("prefers wrongText, then hint, then the neutral default", () => {
    expect(wrongTextFor({ wrongText: "Nope.", hint: "Hint." })).toBe("Nope.");
    expect(wrongTextFor({ hint: "Hint." })).toBe("Hint.");
    expect(wrongTextFor({})).toBe(DEFAULT_WRONG);
    const opening = lessonById("first-9x9-opening");
    expect(wrongTextFor(opening.steps[4])).toBe(opening.steps[4].wrongText);
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
  it("a wrong move marks the point, shows the wrong text, and does not advance", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 0 }]);
    expect(s.status).toBe("wrong");
    expect(s.wrong).toEqual({ c: 0, r: 0 });
    expect(s.message).toBe(wrongTextFor(step));
    expect(s.moveIdx).toBe(0);
    expect(at(s, 0, 0)).toBeNull();
    const cleared = stepReducer(lesson, step, s, { type: "clearWrong" });
    expect(cleared.wrong).toBeNull();
    expect(cleared.message).toBeNull();
    expect(cleared.status).toBe("open");
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
  it("another option shows its verdict and waits for the learner's next click", () => {
    const s = run(lesson, step, [{ type: "play", c: 0, r: 0 }]);
    expect(s.status).toBe("review");
    expect(s.verdict).toBe("poor");
    expect(s.tone).toBe("verdict");
    expect(at(s, 0, 0)).toBe("b");
    expect(s.pending).toBeNull();
    expect(stepReducer(lesson, step, s, { type: "play", c: 2, r: 2 })).toEqual(initStep(lesson, step));
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
    expect(s.message).toBe(wrongTextFor(step));
    expect(run(lesson, step, [{ type: "answer", value: "" }]).status).toBe("wrong");
    const cleared = stepReducer(lesson, step, s, { type: "clearWrong" });
    expect(cleared.status).toBe("open");
    expect(cleared.message).toBeNull();
  });
  it("honours tolerance", () => {
    const loose = { ...step, tolerance: 1 };
    expect(run(lesson, loose, [{ type: "answer", value: "17" }]).status).toBe("solved");
  });
});

/* ----- replay and maxim, on an inline lesson so the tests need no authored content ----- */
const replayLesson = {
  id: "study", size: 9,
  steps: [{
    type: "replay", setup: {}, toPlay: "b",
    moves: [pt(2, 2), pt(6, 6), pt(6, 2), pt(2, 6), pt(4, 4), pt(4, 6)],
    stops: [
      { at: 2, answers: [pt(6, 2)], strong: [pt(2, 6)], text: "Black to play.", success: "His move.", partial: "Close.",
        refutations: [{ move: pt(4, 4), reply: pt(6, 2), text: "Too early." }], hint: "The other corner." },
      { at: 4, answers: [pt(4, 4)], text: "Again.", success: "Yes." },
    ],
    text: "Guess his moves.", success: "The end of the excerpt.",
  }, {
    type: "maxim", setup: { b: [pt(4, 4)] }, marks: [pt(4, 4)],
    line: "The board is square and still; the stones are round and moving.",
    analogy: "The frame never changes; the play always does.", text: "One stone at the centre.",
  }],
};
const rstep = replayLesson.steps[0];
const advanceTo = (s, n) => { while (s.moveIdx < n && s.pending) s = stepReducer(replayLesson, rstep, s, s.pending.action); return s; };

describe("replay", () => {
  it("plays itself to the first stop and opens there with the stop's text", () => {
    let s = initStep(replayLesson, rstep);
    expect(s.status).toBe("busy");
    expect(s.pending).toEqual({ ms: TIMINGS.advance, action: { type: "advance" } });
    s = advanceTo(s, 2);
    expect(s.moveIdx).toBe(2);
    expect(s.status).toBe("open");
    expect(s.message).toBe("Black to play.");
    expect(boardLocked(rstep, s)).toBe(false);
    expect(at(s, 2, 2)).toBe("b");
    expect(at(s, 6, 6)).toBe("w");
  });

  it("scores his move in full, keeps the stone, and resumes to the next stop", () => {
    let s = advanceTo(initStep(replayLesson, rstep), 2);
    s = stepReducer(replayLesson, rstep, s, { type: "play", c: 6, r: 2 });
    expect(s.status).toBe("scored");
    expect(s.score).toBe(SCORE.master);
    expect(s.stopsDone).toBe(1);
    expect(s.message).toBe("His move.");
    expect(at(s, 6, 2)).toBe("b");
    expect(s.pending).toEqual({ ms: TIMINGS.afterScore, action: { type: "advance" } });
    // scoring twice at one stop is impossible: the board is locked and play is ignored
    expect(boardLocked(rstep, s)).toBe(true);
    expect(stepReducer(replayLesson, rstep, s, { type: "play", c: 0, r: 0 })).toBe(s);
    s = advanceTo(s, 4);
    expect(s.status).toBe("open");
    expect(s.message).toBe("Again.");
    expect(at(s, 2, 6)).toBe("w");
  });

  it("gives partial credit for a strong move, marks it, and then shows his", () => {
    let s = advanceTo(initStep(replayLesson, rstep), 2);
    s = stepReducer(replayLesson, rstep, s, { type: "play", c: 2, r: 6 });
    expect(s.status).toBe("scored");
    expect(s.score).toBe(SCORE.strong);
    expect(s.message).toBe("Close.");
    expect(marksFor(rstep, s)).toEqual([{ c: 2, r: 6 }]);
    expect(at(s, 2, 6)).toBeNull();
    s = stepReducer(replayLesson, rstep, s, s.pending.action);   // his move is played
    expect(at(s, 6, 2)).toBe("b");
    expect(marksFor(rstep, s)).toEqual([]);
    expect(s.moveIdx).toBe(3);
  });

  it("plays out a refutation, ends in review, and Try again returns to the stop with the score kept", () => {
    let s = advanceTo(initStep(replayLesson, rstep), 2);
    s = stepReducer(replayLesson, rstep, s, { type: "play", c: 4, r: 4 });
    expect(s.status).toBe("busy");
    expect(s.pending.action).toEqual({ type: "refute" });
    s = stepReducer(replayLesson, rstep, s, s.pending.action);
    expect(s.status).toBe("review");
    expect(s.message).toBe("Too early.");
    expect(at(s, 6, 2)).toBe("w");
    s = stepReducer(replayLesson, rstep, s, { type: "reset" });
    expect(s.status).toBe("open");
    expect(s.moveIdx).toBe(2);
    expect(at(s, 4, 4)).toBeNull();
    expect(at(s, 6, 2)).toBeNull();
    expect(s.score).toBe(0);
  });

  it("marks any other point wrong and clears it", () => {
    let s = advanceTo(initStep(replayLesson, rstep), 2);
    s = stepReducer(replayLesson, rstep, s, { type: "play", c: 0, r: 0 });
    expect(s.status).toBe("wrong");
    expect(s.message).toBe(wrongTextFor(rstep.stops[0]));
    s = stepReducer(replayLesson, rstep, s, s.pending.action);
    expect(s.status).toBe("open");
  });

  it("finishes solved at the end of the moves with the step's success text", () => {
    let s = advanceTo(initStep(replayLesson, rstep), 2);
    s = stepReducer(replayLesson, rstep, s, { type: "play", c: 6, r: 2 });
    s = advanceTo(s, 4);
    s = stepReducer(replayLesson, rstep, s, { type: "play", c: 4, r: 4 });
    s = advanceTo(s, 6);
    expect(s.status).toBe("solved");
    expect(s.done).toBe(true);
    expect(s.score).toBe(2 * SCORE.master);
    expect(s.message).toBe("The end of the excerpt.");
    expect(s.pending).toBeNull();
  });

  it("builds the record at a stop for the network and labels coordinates", () => {
    const rec = recordAtStop(replayLesson, rstep, 1);
    expect(rec.moves).toHaveLength(4);
    expect(rec.toPlay).toBe("b");
    expect(rec.board.cells[idx(9, 2, 6)]).toBe("w");
    expect(coordLabel(0, 0, 9)).toBe("A9");
    expect(coordLabel(8, 8, 9)).toBe("J1");
    expect(coordLabel(3, 15, 19)).toBe("D4");
  });
});

describe("maxim", () => {
  const step = replayLesson.steps[1];
  it("starts solved and locked, with its marks", () => {
    const s = initStep(replayLesson, step);
    expect(s.status).toBe("solved");
    expect(boardLocked(step, s)).toBe(true);
    expect(marksFor(step)).toEqual(step.marks);
    expect(DEFAULT_PARTIAL).toMatch(/not his/);
  });
});
