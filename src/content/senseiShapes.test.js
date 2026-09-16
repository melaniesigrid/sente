import { describe, it, expect } from "vitest";
import { SHAPE_NOTES, SHAPE_COURSE, shapeToTeach, shapeLine, courseProgress, shapeReading } from "./senseiShapes.js";
import { RELATIONS, SHAPES } from "../engine/index.js";
import { shapeByKey } from "./shapes.js";
import { lessonById } from "./library.js";

describe("the course covers what the engine can see", () => {
  it("has a note for every relation and every shape the engine names", () => {
    for (const id of [...RELATIONS, ...SHAPES]) expect(SHAPE_NOTES[id], id).toBeTruthy();
  });

  it("teaches every note exactly once, in a fixed order", () => {
    expect(SHAPE_COURSE.slice().sort()).toEqual(Object.keys(SHAPE_NOTES).sort());
    expect(new Set(SHAPE_COURSE).size).toBe(SHAPE_COURSE.length);
  });

  it("starts with the connections and leaves judgement for later", () => {
    expect(SHAPE_COURSE[0]).toBe("solid-extension");
    expect(SHAPE_COURSE.indexOf("one-point-jump")).toBeLessThan(SHAPE_COURSE.indexOf("knights-move"));
    expect(SHAPE_COURSE.indexOf("tigers-mouth")).toBeLessThan(SHAPE_COURSE.indexOf("ponnuki"));
  });
});

describe("every note is a finished teaching", () => {
  for (const [id, note] of Object.entries(SHAPE_NOTES)) {
    it(`${id} names itself, warns, and has lines to spare`, () => {
      expect(note.name).toMatch(/\w/);
      expect(note.japanese).toMatch(/·/);
      expect(note.teach.length).toBeGreaterThan(80);
      expect(note.watch.length).toBeGreaterThan(40);
      expect(note.again.length).toBeGreaterThan(1);
      expect(note.mine.length).toBeGreaterThan(1);
    });
  }

  it("points only at articles and lessons that exist", () => {
    for (const [id, note] of Object.entries(SHAPE_NOTES)) {
      if (note.article) expect(shapeByKey(note.article), `${id} article`).toBeTruthy();
      if (note.lesson) expect(lessonById(note.lesson), `${id} lesson`).toBeTruthy();
    }
  });
});

describe("choosing what to say", () => {
  it("takes the earliest thing in the course he has not taught yet", () => {
    expect(shapeToTeach(["knights-move", "one-point-jump"], {})).toBe("one-point-jump");
    expect(shapeToTeach(["knights-move", "one-point-jump"], { "one-point-jump": 2 })).toBe("knights-move");
  });

  it("falls back to the most basic shape once everything has been taught", () => {
    const taught = Object.fromEntries(SHAPE_COURSE.map((id) => [id, 5]));
    expect(shapeToTeach(["knights-move", "one-point-jump"], taught)).toBe("one-point-jump");
  });

  it("says nothing about a shape it has no words for", () => {
    expect(shapeToTeach(["ladder-breaker"], {})).toBe(null);
    expect(shapeToTeach([], {})).toBe(null);
    expect(shapeToTeach(undefined, {})).toBe(null);
    expect(shapeLine("ladder-breaker")).toBe(null);
  });
});

describe("what he says, and how often", () => {
  it("teaches, then warns, then keeps it short", () => {
    const n = SHAPE_NOTES["tigers-mouth"];
    expect(shapeLine("tigers-mouth", { times: 0 })).toBe(n.teach);
    expect(shapeLine("tigers-mouth", { times: 1 })).toBe(n.watch);
    expect(n.again).toContain(shapeLine("tigers-mouth", { times: 2, seed: 7 }));
  });

  it("uses his own words for his own stones, however often he has taught it", () => {
    for (const times of [0, 1, 5]) {
      expect(SHAPE_NOTES.cut.mine).toContain(shapeLine("cut", { times, mine: true, seed: 3 }));
    }
  });

  it("is deterministic in the seed, so a resumed game reads the same", () => {
    expect(shapeLine("hane", { times: 4, seed: 12 })).toBe(shapeLine("hane", { times: 4, seed: 12 }));
  });
});

describe("the syllabus", () => {
  it("counts what has been met and what is firm", () => {
    const fresh = courseProgress({});
    expect(fresh.done).toBe(0);
    expect(fresh.next).toBe(SHAPE_COURSE[0]);
    expect(fresh.total).toBe(SHAPE_COURSE.length);
    const some = courseProgress({ "solid-extension": 4, diagonal: 1 });
    expect(some.done).toBe(2);
    expect(some.firm).toBe(1);
    expect(some.next).toBe("tigers-mouth");
  });

  it("has nothing left to teach once the course is done", () => {
    expect(courseProgress(Object.fromEntries(SHAPE_COURSE.map((id) => [id, 1]))).next).toBe(null);
  });

  it("hands back somewhere to read", () => {
    expect(shapeReading("keima-nonsense")).toBe(null);
    expect(shapeReading("ponnuki")).toMatchObject({ article: "ponnuki", lesson: "shape-ponnuki" });
  });
});
