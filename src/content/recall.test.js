import { describe, it, expect } from "vitest";
import {
  BOXES, SESSION_SIZE, cardKey, parseCardKey, cardsInLesson, sanitizeEntry,
  enrol, grade, scheduledCards, dueCards, recallSummary, daysUntil,
} from "./recall.js";
import { LIBRARY, lessonById } from "./library.js";
import { addDays } from "./kata.js";

const TODAY = "2026-09-11";

const lesson = {
  id: "demo", size: 9,
  steps: [
    { type: "info" },
    { type: "quiz", toPlay: "b", answers: [] },
    { type: "sequence", moves: [] },
    { type: "choice", options: [] },
  ],
};

describe("cards", () => {
  it("takes the quiz and choice steps and nothing else", () => {
    expect(cardsInLesson(lesson).map(c => c.stepIndex)).toEqual([1, 3]);
  });
  it("numbers a card among its lesson's questions, not among its steps", () => {
    expect(cardsInLesson(lesson).map(c => c.ordinal)).toEqual([1, 2]);
  });

  it("keys round-trip", () => {
    expect(parseCardKey(cardKey("demo", 3))).toEqual({ lessonId: "demo", stepIndex: 3 });
  });
  it("refuses things that are not keys", () => {
    for (const bad of ["", "demo", "#2", "demo#", "demo#x", "demo#-1", 7, null]) {
      expect(parseCardKey(bad)).toBeNull();
    }
  });
  it("keeps a lesson id that itself contains a hash", () => {
    expect(parseCardKey("a#b#2")).toEqual({ lessonId: "a#b", stepIndex: 2 });
  });
});

describe("entries", () => {
  it("accepts a well-formed entry and clamps the box to the last one", () => {
    expect(sanitizeEntry({ box: 99, due: TODAY })).toEqual({ box: BOXES.length - 1, due: TODAY });
  });
  it("refuses anything else", () => {
    for (const bad of [null, [], 3, { box: 1 }, { due: TODAY }, { box: -1, due: TODAY },
      { box: 1.5, due: TODAY }, { box: 0, due: "11 September" }]) {
      expect(sanitizeEntry(bad)).toBeNull();
    }
  });
});

describe("enrolling", () => {
  it("puts every question in the first box, due tomorrow, never today", () => {
    const s = enrol({}, lesson, TODAY);
    expect(Object.keys(s).sort()).toEqual(["demo#1", "demo#3"]);
    expect(s["demo#1"]).toEqual({ box: 0, due: addDays(TODAY, BOXES[0]) });
    expect(dueCards([lesson], s, TODAY)).toEqual([]);
  });
  it("leaves a card that has already climbed where it is", () => {
    const before = { "demo#1": { box: 3, due: "2026-10-01" } };
    expect(enrol(before, lesson, TODAY)["demo#1"]).toEqual(before["demo#1"]);
  });
});

describe("grading", () => {
  it("moves a recalled card up a box and out by that box's interval", () => {
    const s = grade({ "demo#1": { box: 1, due: TODAY } }, "demo#1", true, TODAY);
    expect(s["demo#1"]).toEqual({ box: 2, due: addDays(TODAY, BOXES[2]) });
  });
  it("stops at the last box", () => {
    const top = BOXES.length - 1;
    const s = grade({ "demo#1": { box: top, due: TODAY } }, "demo#1", true, TODAY);
    expect(s["demo#1"].box).toBe(top);
  });
  it("sends a missed card back to the first box, due tomorrow and not today", () => {
    const s = grade({ "demo#1": { box: 4, due: TODAY } }, "demo#1", false, TODAY);
    expect(s["demo#1"]).toEqual({ box: 0, due: addDays(TODAY, BOXES[0]) });
    expect(dueCards([lesson], s, TODAY)).toEqual([]);
  });
  it("grades a card it has never seen", () => {
    expect(grade({}, "demo#1", true, TODAY)["demo#1"]).toEqual({ box: 1, due: addDays(TODAY, BOXES[1]) });
  });
});

describe("the queue", () => {
  const schedule = {
    "demo#1": { box: 0, due: "2026-09-01" },   // most overdue
    "demo#3": { box: 2, due: "2026-09-10" },
    "gone#0": { box: 0, due: "2026-09-01" },   // lesson no longer in the library
    "demo#0": { box: 0, due: "2026-09-01" },   // an info step: not a card
    "demo#9": { box: 0, due: "2026-09-01" },   // a step index past the end
    "demo#2": { box: 0, due: "2026-12-01" },   // held (and a sequence, so not a card at all)
  };
  it("drops keys whose lesson or step is gone, or was never a question", () => {
    expect(scheduledCards([lesson], schedule).map(c => c.key)).toEqual(["demo#1", "demo#3"]);
  });
  it("asks for the most overdue first and caps the sitting", () => {
    expect(dueCards([lesson], schedule, TODAY).map(c => c.key)).toEqual(["demo#1", "demo#3"]);
    expect(dueCards([lesson], schedule, TODAY, 1).map(c => c.key)).toEqual(["demo#1"]);
  });
  it("hands the step and its lesson back with the card", () => {
    const [first] = dueCards([lesson], schedule, TODAY);
    expect(first.lesson).toBe(lesson);
    expect(first.step).toBe(lesson.steps[1]);
  });
  it("summarises what is waiting and what is held", () => {
    const sum = recallSummary([lesson], schedule, TODAY);
    expect(sum).toMatchObject({ total: 2, due: 2, session: 2, known: 0, nextDue: null });
  });
  it("names the day the next card comes back, and how far off it is", () => {
    const held = { "demo#1": { box: 2, due: "2026-09-20" } };
    expect(recallSummary([lesson], held, TODAY))
      .toMatchObject({ due: 0, session: 0, nextDue: "2026-09-20", nextIn: 9 });
  });

  it("has no next day, and no count, when everything is due", () => {
    const all = { "demo#1": { box: 0, due: TODAY } };
    expect(recallSummary([lesson], all, TODAY)).toMatchObject({ nextDue: null, nextIn: null });
  });
  it("counts a card in the last box as known", () => {
    const top = { "demo#1": { box: BOXES.length - 1, due: "2026-12-01" } };
    expect(recallSummary([lesson], top, TODAY).known).toBe(1);
  });
  it("never asks for more than a sitting", () => {
    const many = {};
    for (let i = 0; i < 40; i++) many[`demo#1`] = { box: 0, due: "2026-09-01" };
    expect(dueCards([lesson], many, TODAY).length).toBeLessThanOrEqual(SESSION_SIZE);
  });
});

describe("counting days", () => {
  it("counts whole days forward and back, across a month end", () => {
    expect(daysUntil(TODAY, TODAY)).toBe(0);
    expect(daysUntil(TODAY, "2026-09-12")).toBe(1);
    expect(daysUntil("2026-09-28", "2026-10-02")).toBe(4);
    expect(daysUntil(TODAY, "2026-09-10")).toBe(-1);
  });
});

describe("against the real library", () => {
  it("every lesson in the library that asks a question makes a card", () => {
    const withQuestions = LIBRARY.filter(l => l.steps.some(s => s.type === "quiz" || s.type === "choice"));
    expect(withQuestions.length).toBeGreaterThan(0);
    for (const l of withQuestions) expect(cardsInLesson(l).length).toBeGreaterThan(0);
  });
  it("a card's step is always one the recall player can ask", () => {
    for (const l of LIBRARY) {
      for (const c of cardsInLesson(l)) {
        expect(["quiz", "choice"]).toContain(c.step.type);
        expect(lessonById(c.lessonId)).toBe(l);
      }
    }
  });
  it("enrolling every lesson schedules every question exactly once", () => {
    let s = {};
    for (const l of LIBRARY) s = enrol(s, l, TODAY);
    const expected = LIBRARY.reduce((n, l) => n + cardsInLesson(l).length, 0);
    expect(Object.keys(s).length).toBe(expected);
    expect(scheduledCards(LIBRARY, s).length).toBe(expected);
  });
});
