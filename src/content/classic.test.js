import { describe, it, expect } from "vitest";
import {
  CLASSIC, CHAPTERS, SAYINGS, CLASSIC_SOURCE, PREFACE, KINDS, LEVELS, NAMES,
  BELOW_THE_LEVELS, chapterByNumber, chapterForLesson, sayingOfTheDay, sayingBySeed,
  levelForRank, levelByNumber, namesIdentified, sayingForResult, afterGameTexts, lessonIdsForChapter,
} from "./classic.js";
import { RANK_LADDER } from "./rank.js";
import { lessonById, lessonsInSeries, seriesByKey } from "./library.js";

describe("the Classic", () => {
  it("has thirteen chapters in order, each with a theme, prose and at least two sayings", () => {
    expect(CHAPTERS.map(ch => ch.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    for (const ch of CHAPTERS) {
      expect(ch.title).toBeTruthy();
      expect(ch.theme).toBeTruthy();
      expect(ch.sayings.length).toBeGreaterThanOrEqual(2);
      expect(ch.text.length, `chapter ${ch.n} prose`).toBeGreaterThanOrEqual(2);
      // A paragraph may be a single closing line ("Whoever knows themselves is
      // enlightened."), but never a fragment.
      for (const p of ch.text) expect(p.length, `chapter ${ch.n}`).toBeGreaterThan(30);
    }
  });

  it("carries the preface and Huan Tan's three kinds of player", () => {
    expect(PREFACE.text.length).toBeGreaterThanOrEqual(2);
    expect(KINDS.map(k => k.key)).toEqual(["inexpert", "average", "skillful"]);
    for (const k of KINDS) expect(k.name && k.text).toBeTruthy();
  });

  it("every chapter's lessons are in the library, and the series is exactly those lessons", () => {
    for (const ch of CHAPTERS) {
      for (const id of lessonIdsForChapter(ch)) {
        const lesson = lessonById(id);
        expect(lesson, `lesson ${id} for chapter ${ch.n}`).not.toBeNull();
        expect(lesson.series).toBe(CLASSIC.key);
        expect(lesson.chapter).toBe(ch.n);
        expect(lesson.sources).toContain(CLASSIC_SOURCE);
      }
    }
    expect(seriesByKey("classic")).not.toBeNull();
    // Every chapter is represented, in order, and the series holds nothing else.
    const inSeries = lessonsInSeries("classic");
    expect(inSeries.map(l => l.chapter)).toEqual([...inSeries.map(l => l.chapter)].sort((a, b) => a - b));
    expect(new Set(inSeries.map(l => l.chapter))).toEqual(new Set(CHAPTERS.map(ch => ch.n)));
    expect(inSeries.map(l => l.id).sort())
      .toEqual(CHAPTERS.flatMap(lessonIdsForChapter).sort());
  });

  it("finds the chapter for a lesson, including a chapter's extra lessons", () => {
    expect(chapterForLesson("classic-miscellany").n).toBe(13);
    expect(chapterForLesson("classic-corner-shapes").n).toBe(13);
    expect(lessonIdsForChapter(chapterByNumber(2))).toEqual(["classic-calculation"]);
  });

  it("speaks in the house voice: no exclamation marks, no unattributed quotation marks", () => {
    for (const s of SAYINGS) {
      expect(s.text).not.toMatch(/!/);
      expect(s.text).not.toMatch(/["“”]/);
    }
    expect(CLASSIC.blurb).not.toMatch(/!/);
  });

  it("renders every chapter, the preface, the levels and the names without exclamation marks or quotation marks", () => {
    const prose = [
      ...PREFACE.text, ...KINDS.map(k => k.text), BELOW_THE_LEVELS,
      ...CHAPTERS.flatMap(ch => ch.text),
      ...LEVELS.map(l => l.text), ...NAMES.map(n => n.text),
    ];
    for (const p of prose) {
      expect(p, p).not.toMatch(/!/);
      expect(p, p).not.toMatch(/["“”]/);
    }
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

describe("the closing saying after a game", () => {
  it("only ever offers texts that are real sayings of the book", () => {
    for (const text of afterGameTexts()) {
      expect(SAYINGS.some(s => s.text === text), text).toBe(true);
    }
  });

  it("gives every outcome a saying, stable for a given game, and nothing for junk", () => {
    for (const kind of ["win", "loss", "jigo", "shared"]) {
      const s = sayingForResult(kind, 3);
      expect(s, kind).not.toBeNull();
      expect(SAYINGS).toContain(s);
      expect(sayingForResult(kind, 3)).toBe(s);
    }
    expect(sayingForResult("nonsense", 0)).toBeNull();
  });

  it("is harder on the winner than on the loser, which is the book's own emphasis", () => {
    const wins = [0, 1, 2, 3].map(i => sayingForResult("win", i).text).join(" ");
    expect(wins).toMatch(/flatters themselves|Do not boast/);
    const losses = [0, 1, 2, 3].map(i => sayingForResult("loss", i).text).join(" ");
    expect(losses).toMatch(/look for the reason in yourself/);
  });
});

describe("the nine levels (chapter twelve)", () => {
  it("is nine steps, numbered from the top, one per dan rank", () => {
    expect(LEVELS.map(l => l.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(LEVELS.map(l => l.rank)).toEqual(["9d", "8d", "7d", "6d", "5d", "4d", "3d", "2d", "1d"]);
    for (const l of LEVELS) {
      expect(l.name).toBeTruthy();
      expect(RANK_LADDER).toContain(l.rank);
    }
    expect(new Set(LEVELS.map(l => l.name)).size).toBe(9);
  });

  it("gives every dan rank a level and every kyu rank none, as the chapter insists", () => {
    for (const rank of RANK_LADDER) {
      const level = levelForRank(rank);
      if (rank.endsWith("d")) {
        expect(level, rank).not.toBeNull();
        expect(level.rank).toBe(rank);
      } else {
        expect(level, rank).toBeNull();
      }
    }
    expect(levelForRank("30k")).toBeNull();
    expect(levelForRank("junk")).toBeNull();
    expect(BELOW_THE_LEVELS).toBeTruthy();
  });

  it("the first level is the strongest and the ninth the weakest it will count", () => {
    expect(levelByNumber(1).rank).toBe("9d");
    expect(levelByNumber(9).rank).toBe("1d");
    expect(levelByNumber(10)).toBeNull();
  });
});

describe("the thirty-two names (chapter eleven)", () => {
  it("is exactly thirty-two, numbered in the order the chapter lists them", () => {
    expect(NAMES).toHaveLength(32);
    expect(NAMES.map(n => n.n)).toEqual([...Array(32).keys()].map(i => i + 1));
    expect(new Set(NAMES.map(n => n.name)).size).toBe(32);
  });

  it("claims a modern term only where it is sure, and never guesses one it is not", () => {
    for (const n of NAMES) {
      expect(typeof n.sure).toBe("boolean");
      expect(n.text).toBeTruthy();
      if (n.sure) expect(n.modern, n.name).toBeTruthy();
    }
    expect(namesIdentified().length).toBeGreaterThan(10);
    expect(namesIdentified().length).toBeLessThan(32);
    expect(namesIdentified().every(n => n.modern)).toBe(true);
  });
});
