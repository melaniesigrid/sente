import { describe, it, expect } from "vitest";
import { tierWindow } from "./Learn.jsx";

const lesson = (id) => ({ id });

describe("tierWindow", () => {
  it("shows a bounded window around the next unfinished lesson", () => {
    const lessons = Array.from({ length: 18 }, (_, i) => lesson(`l${i + 1}`));
    const profile = { lessonsDone: lessons.slice(0, 7).map((l) => l.id) };
    const shown = tierWindow(lessons, profile);
    expect(shown.map((l) => l.id)).toEqual(lessons.slice(5, 15).map((l) => l.id));
  });

  it("shows a trailing window when every lesson in the tier is done", () => {
    const lessons = Array.from({ length: 14 }, (_, i) => lesson(`l${i + 1}`));
    const profile = { lessonsDone: lessons.map((l) => l.id) };
    const shown = tierWindow(lessons, profile);
    expect(shown.map((l) => l.id)).toEqual(lessons.slice(4).map((l) => l.id));
  });
});
