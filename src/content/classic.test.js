import { describe, it, expect } from "vitest";
import {
  CLASSIC, CHAPTERS, SAYINGS, PASSAGES, CLASSIC_SOURCE, chapterByNumber, chapterForLesson,
  sayingOfTheDay, sayingBySeed, passagesFor, passageFor,
  PREFACE, KINDS, LEVELS, NAMES, BELOW_THE_LEVELS, levelForRank, levelByNumber,
  namesIdentified, lessonIdsForChapter,
  emphasize, markBudget, MAX_MARKS, STRENGTH_WORDS, CRAFT_WORDS,
} from "./classic.js";
import { RANK_LADDER } from "./rank.js";
import { lessonById, lessonsInSeries, seriesByKey } from "./library.js";

describe("the Classic", () => {
  it("has thirteen chapters in order, each with a theme and at least two sayings", () => {
    expect(CHAPTERS.map(ch => ch.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    for (const ch of CHAPTERS) {
      expect(ch.title).toBeTruthy();
      expect(ch.theme).toBeTruthy();
      expect(ch.sayings.length).toBeGreaterThanOrEqual(2);
      expect(ch.text.length, `chapter ${ch.n} prose`).toBeGreaterThanOrEqual(2);
      // A paragraph may be a single closing line ("Whoever knows themselves is
      // enlightened."), but never a fragment.
      for (const t of ch.text) expect(t.length, `chapter ${ch.n}`).toBeGreaterThan(30);
    }
  });

  // The pull quote a view sets between the paragraphs. It is ours, not Zhang
  // Ni's, so it has to read as plain modern prose: a couple of sentences in the
  // house voice, never a restatement of the one-line theme, and never a line
  // the reader has already met as a saying.
  it("says every chapter again in plain words, long enough to be a gloss and short enough to pull", () => {
    for (const source of [PREFACE, ...CHAPTERS]) {
      const where = source.title;
      expect(source.plain, where).toBeTruthy();
      expect(source.plain.length, where).toBeGreaterThan(90);
      expect(source.plain.length, where).toBeLessThan(340);
      expect(source.plain, where).not.toMatch(/!/);
      expect(source.plain, where).not.toMatch(/["\u201c\u201d]/);
      expect(source.plain, where).not.toBe(source.theme);
      expect(SAYINGS.some(s => s.text === source.plain), where).toBe(false);
    }
  });

  it("carries the preface and Huan Tan's three kinds of player", () => {
    expect(PREFACE.text.length).toBeGreaterThanOrEqual(2);
    expect(KINDS.map(k => k.key)).toEqual(["inexpert", "average", "skillful"]);
    for (const k of KINDS) expect(k.name && k.text).toBeTruthy();
  });

  it("renders the chapters, preface, levels and names in the house voice", () => {
    const prose = [
      ...PREFACE.text, ...KINDS.map(k => k.text), BELOW_THE_LEVELS,
      ...CHAPTERS.flatMap(ch => ch.text),
      ...LEVELS.map(l => l.text), ...NAMES.map(n => n.text),
    ];
    for (const t of prose) {
      expect(t, t).not.toMatch(/!/);
      expect(t, t).not.toMatch(/["“”]/);
    }
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
    const inSeries = lessonsInSeries("classic");
    expect(inSeries.map(l => l.chapter)).toEqual([...inSeries.map(l => l.chapter)].sort((a, b) => a - b));
    expect(new Set(inSeries.map(l => l.chapter))).toEqual(new Set(CHAPTERS.map(ch => ch.n)));
    expect(inSeries.map(l => l.id).sort()).toEqual(CHAPTERS.flatMap(lessonIdsForChapter).sort());
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

  it("passages cover every chapter, keep the voice, and pick by context", () => {
    expect(new Set(PASSAGES.map(p => p.chapter)).size).toBe(13);
    for (const p of PASSAGES) {
      expect(p.text).not.toMatch(/[!"\u201c\u201d]/);
      expect(p.title).toBe(chapterByNumber(p.chapter).title);
      expect(p.contexts.length).toBeGreaterThan(0);
    }
    for (const ctx of ["home", "play", "learn", "tsumego", "ladder", "profile", "win", "loss", "jigo"]) {
      const list = passagesFor(ctx);
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.every(p => p.contexts.includes(ctx))).toBe(true);
    }
    expect(passagesFor("any")).toBe(PASSAGES);
    expect(passagesFor("nope")).toBe(PASSAGES);
    expect(passageFor("loss", 3)).toBe(passageFor("loss", 3));
    expect(passageFor("win", 7).contexts).toContain("win");
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

describe("the words that carry", () => {
  const marks = (t, max) => emphasize(t, max).filter(p => p.mark).map(p => p.text);

  it("puts the text back together exactly, mark or no mark", () => {
    for (const p of PASSAGES) {
      expect(emphasize(p.text).map(x => x.text).join(""), p.text).toBe(p.text);
    }
  });

  it("never strikes the same word twice, and never a stray space", () => {
    for (const p of PASSAGES) {
      const got = marks(p.text, markBudget(p.text));
      expect(new Set(got.map(m => m.toLowerCase())).size, p.text).toBe(got.length);
      for (const m of got) expect(m.trim(), p.text).toBe(m);
    }
  });

  it("treats two inflections of one word as one word, not two", () => {
    // "calculates" and "calculate" are the same entry in the lexicon; marking
    // both is a stutter. The third mark goes to the next distinct word instead.
    expect(marks("He calculates much, and the one who calculates little loses.", 3))
      .toEqual(["calculates", "loses"]);
    expect(marks("The plan is nothing; plans are everything.", 2)).toEqual(["plan"]);
    expect(marks("A stone among stones.", 2)).toEqual(["stone"]);
  });

  it("marks the strength word ahead of the board vocabulary, in reading order", () => {
    expect(marks("Guard the corners and the eyes, but study the initiative."))
      .toEqual(["study", "initiative"]);
    // The losing pole is craft, not strength: victory outranks defeat.
    expect(marks("A defeat teaches what a victory cannot.")).toEqual(["defeat", "victory"]);
    // One strength word among four craft words still earns a mark.
    expect(marks("Territory is lost where the group is weak, but the plan holds."))
      .toEqual(["Territory", "plan"]);
  });

  it("leaves ordinary words alone, and never marks inside a longer word", () => {
    expect(marks("Be honest. Do not deceive.")).toEqual([]);
    expect(marks("The stones are round and move.")).toEqual(["stones"]);
    expect(marks("Winsome talk of a groundless kobold.")).toEqual([]);
  });

  it("gives a long passage a third mark and a short line only two", () => {
    expect(markBudget("Take the corners first.")).toBe(1);
    expect(markBudget(PASSAGES[0].text)).toBeGreaterThanOrEqual(2);
    for (const p of PASSAGES) {
      const b = markBudget(p.text);
      expect(b, p.text).toBeGreaterThanOrEqual(1);
      expect(b, p.text).toBeLessThanOrEqual(3);
      expect(marks(p.text, b).length, p.text).toBeLessThanOrEqual(b);
    }
    expect(MAX_MARKS).toBe(2);
  });

  it("keeps the two tiers disjoint, so a word has one rank and not two", () => {
    const overlap = STRENGTH_WORDS.filter(w => CRAFT_WORDS.includes(w));
    expect(overlap).toEqual([]);
  });

  it("finds something worth marking in most of the Classic", () => {
    const bare = PASSAGES.filter(p => marks(p.text, markBudget(p.text)).length === 0);
    expect(bare.map(p => p.text)).toEqual([]);
  });

  it("is total: any string in, the same string out", () => {
    for (const junk of ["", null, undefined, 7]) {
      const parts = emphasize(junk);
      expect(parts.length).toBeGreaterThan(0);
      expect(parts.map(x => x.text).join("")).toBe(String(junk ?? ""));
    }
    expect(markBudget(null)).toBe(1);
  });
});
