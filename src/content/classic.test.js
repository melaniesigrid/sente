import { describe, it, expect } from "vitest";
import { CLASSIC, CHAPTERS, SAYINGS, CLASSIC_SOURCE, chapterByNumber, chapterForLesson, sayingOfTheDay, sayingBySeed } from "./classic.js";
import { lessonById, lessonsInSeries, seriesByKey } from "./library.js";

describe("the Classic", () => {
  it("has thirteen chapters in order, each with a theme and at least two sayings", () => {
    expect(CHAPTERS.map(ch => ch.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    for (const ch of CHAPTERS) {
      expect(ch.title).toBeTruthy();
      expect(ch.theme).toBeTruthy();
      expect(ch.sayings.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every chapter has a lesson in the library, and the library series is exactly the thirteen", () => {
    for (const ch of CHAPTERS) {
      const lesson = lessonById(ch.lessonId);
      expect(lesson, `lesson ${ch.lessonId} for chapter ${ch.n}`).not.toBeNull();
      expect(lesson.series).toBe(CLASSIC.key);
      expect(lesson.chapter).toBe(ch.n);
      expect(lesson.sources).toContain(CLASSIC_SOURCE);
    }
    expect(seriesByKey("classic")).not.toBeNull();
    expect(lessonsInSeries("classic").map(l => l.chapter)).toEqual(CHAPTERS.map(ch => ch.n));
  });

  it("speaks in the house voice: no exclamation marks, no unattributed quotation marks", () => {
    for (const s of SAYINGS) {
      expect(s.text).not.toMatch(/!/);
      expect(s.text).not.toMatch(/["“”]/);
    }
    expect(CLASSIC.blurb).not.toMatch(/!/);
  });

  it("looks up chapters by number and by lesson", () => {
    expect(chapterByNumber(6).title).toBe("On Knowing Oneself");
    expect(chapterByNumber(14)).toBeNull();
    expect(chapterForLesson("classic-details").n).toBe(10);
    expect(chapterForLesson("liberties")).toBeNull();
  });

  it("picks a saying deterministically by day key and by seed", () => {
    const a = sayingOfTheDay("2026-09-10"), b = sayingOfTheDay("2026-09-10");
    expect(a).toEqual(b);
    expect(SAYINGS).toContain(a);
    const days = new Set([...Array(30).keys()].map(d => sayingOfTheDay(`2026-10-${String(d + 1).padStart(2, "0")}`).text));
    expect(days.size).toBeGreaterThan(5);
    expect(sayingBySeed(0)).toBe(SAYINGS[0]);
    expect(sayingBySeed(SAYINGS.length + 2)).toBe(SAYINGS[2]);
  });
});
