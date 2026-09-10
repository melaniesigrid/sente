/* ----------------------- LIBRARY VERIFIER -----------------------
   Runs over every lesson in LIBRARY. A lesson that fails here does not ship:
   this is the authoring safety net from docs/designs/lesson-library.md. */
import { describe, it, expect } from "vitest";
import { tryPlay, chainAt, idx, opponent } from "../engine/index.js";
import { LIBRARY, TIERS, TRACKS, SERIES, rankToNumber, lessonById, prereqsMissing, nextLessonFor, currentTierFor, searchLibrary, lessonsInTier, lessonsInSeries, lessonAfter } from "./library.js";
import { LESSONS } from "./lessons.js";
import { setupToBoard } from "./positions.js";

const STEP_TYPES = ["info", "quiz", "sequence", "choice", "count"];
const SIZES = [9, 13, 19];
const at = (board, p) => board.cells[idx(board.size, p.c, p.r)];

/** Every chain on the board must have at least one liberty. */
function legalPosition(board) {
  for (let r = 0; r < board.size; r++) for (let c = 0; c < board.size; c++) {
    if (board.cells[idx(board.size, c, r)] === null) continue;
    if (chainAt(board, c, r).libs.size === 0) return `chain at (${c},${r}) has no liberties`;
  }
  return null;
}

/** Play a scripted line from `board`, alternating from `color`; returns an error string or null. */
function replayLine(board, color, moves) {
  let b = board, ko = null;
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const res = tryPlay(b, m.c, m.r, color, { koPoint: ko });
    if (!res.ok) return `move ${i + 1} (${m.c},${m.r}) for ${color} is illegal: ${res.reason}`;
    b = res.board; ko = res.ko; color = opponent(color);
  }
  return null;
}

describe("library shape", () => {
  it("has at least Tier 1 and keeps LESSONS as an alias", () => {
    expect(LIBRARY.length).toBeGreaterThanOrEqual(10);
    expect(LESSONS).toBe(LIBRARY);
  });
  it("ids are unique", () => {
    const ids = LIBRARY.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("is sorted by tier then rank", () => {
    for (let i = 1; i < LIBRARY.length; i++) {
      const a = LIBRARY[i - 1], b = LIBRARY[i];
      expect(a.tier < b.tier || (a.tier === b.tier && rankToNumber(a.rank) <= rankToNumber(b.rank))).toBe(true);
    }
  });
  it("rankToNumber parses kyu and dan and rejects junk", () => {
    expect(rankToNumber("30k")).toBe(-30);
    expect(rankToNumber("1k")).toBe(-1);
    expect(rankToNumber("1d")).toBe(1);
    expect(rankToNumber("4d")).toBe(4);
    expect(rankToNumber("30k")).toBeLessThan(rankToNumber("20k"));
    expect(rankToNumber("1k")).toBeLessThan(rankToNumber("1d"));
    expect(Number.isNaN(rankToNumber("pro"))).toBe(true);
    expect(Number.isNaN(rankToNumber(""))).toBe(true);
  });
  it("tiers and tracks are well formed", () => {
    expect(TIERS.map(t => t.id)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const t of TIERS) {
      expect(Number.isFinite(rankToNumber(t.from))).toBe(true);
      expect(Number.isFinite(rankToNumber(t.to))).toBe(true);
      expect(rankToNumber(t.from)).toBeLessThan(rankToNumber(t.to));
      if (t.exit) expect(SIZES).toContain(t.exit.size);
    }
    expect(TRACKS).toHaveLength(7);
    expect(new Set(TRACKS.map(t => t.key)).size).toBe(7);
  });
  it("Tier 1 ships the ten lessons from the design doc", () => {
    expect(lessonsInTier(1).map(l => l.id).sort()).toEqual([
      "atari-escape", "connect-cut", "edge-first-line", "first-9x9-opening", "ko", "liberties",
      "no-liberty-capture", "passing-and-ending", "territory-count", "two-eyes",
    ]);
  });
});

describe.each(LIBRARY.map(l => [l.id, l]))("lesson %s", (id, lesson) => {
  it("has the required metadata", () => {
    expect(lesson.title).toBeTruthy();
    expect(TIERS.some(t => t.id === lesson.tier)).toBe(true);
    expect(Number.isFinite(rankToNumber(lesson.rank))).toBe(true);
    const tier = TIERS.find(t => t.id === lesson.tier);
    expect(rankToNumber(lesson.rank)).toBeGreaterThanOrEqual(rankToNumber(tier.from));
    expect(rankToNumber(lesson.rank)).toBeLessThanOrEqual(rankToNumber(tier.to));
    expect(TRACKS.some(t => t.key === lesson.track)).toBe(true);
    expect(SIZES).toContain(lesson.size);
    expect(Number.isInteger(lesson.minutes) && lesson.minutes > 0).toBe(true);
    expect(Array.isArray(lesson.prereqs)).toBe(true);
    expect(lesson.steps.length).toBeGreaterThanOrEqual(3);
    expect(lesson.steps.length).toBeLessThanOrEqual(6);
    if (lesson.series !== undefined) {
      expect(SERIES.some(s => s.key === lesson.series)).toBe(true);
      expect(Number.isInteger(lesson.chapter) && lesson.chapter > 0).toBe(true);
      expect(lesson.sources.length).toBeGreaterThan(0);
    }
  });

  it("prerequisites exist, sit in the same or a lower tier, and form no cycle", () => {
    for (const p of lesson.prereqs) {
      const pre = lessonById(p);
      expect(pre, `prereq ${p} missing`).not.toBeNull();
      expect(pre.tier).toBeLessThanOrEqual(lesson.tier);
      expect(p).not.toBe(lesson.id);
    }
    const seen = new Set();
    const walk = (l, path) => {
      for (const p of l.prereqs) {
        expect(path.includes(p), `cycle: ${[...path, p].join(" -> ")}`).toBe(false);
        if (!seen.has(p)) { seen.add(p); walk(lessonById(p), [...path, p]); }
      }
    };
    walk(lesson, [lesson.id]);
  });

  it("speaks in the house voice: no exclamation marks", () => {
    const texts = [];
    for (const s of lesson.steps) {
      for (const k of ["text", "hint", "success", "question", "wrongText"]) if (s[k]) texts.push(s[k]);
      for (const c of s.commentary || []) texts.push(c);
      for (const r of s.refutations || []) texts.push(r.text);
      for (const o of s.options || []) texts.push(o.text);
    }
    for (const t of texts) expect(t, t).not.toMatch(/!/);
  });

  describe.each(lesson.steps.map((s, i) => [i + 1, s]))("step %i", (n, step) => {
    const board = setupToBoard(step.setup, lesson.size);

    it("is a known type with a legal setup", () => {
      expect(STEP_TYPES).toContain(step.type);
      expect(legalPosition(board)).toBeNull();
      if (step.setup.size !== undefined) {
        expect(step.type).toBe("info");
        expect(SIZES).toContain(step.setup.size);
      }
      if (step.type !== "count") expect(step.text).toBeTruthy();
      if (step.wrongText !== undefined) {
        expect(["quiz", "sequence", "count"]).toContain(step.type);
        expect(typeof step.wrongText === "string" && step.wrongText.length > 0).toBe(true);
      }
    });

    if (step.type === "quiz") {
      it("every answer is legal and it has a hint and success text", () => {
        expect(step.answers.length).toBeGreaterThan(0);
        expect(step.hint).toBeTruthy();
        expect(step.success).toBeTruthy();
        for (const a of step.answers) {
          const res = tryPlay(board, a.c, a.r, step.toPlay);
          expect(res.ok, `answer (${a.c},${a.r}): ${res.reason}`).toBe(true);
        }
      });
      it("every refutation plays its move and reply legally and is not an answer", () => {
        for (const rf of step.refutations || []) {
          expect(step.answers.some(a => a.c === rf.move.c && a.r === rf.move.r)).toBe(false);
          expect(rf.text).toBeTruthy();
          expect(replayLine(board, step.toPlay, [rf.move, rf.reply])).toBeNull();
        }
      });
    }

    if (step.type === "sequence") {
      it("replays from setup through every move legally, with commentary per move", () => {
        expect(step.moves.length).toBeGreaterThan(0);
        expect(step.commentary).toHaveLength(step.moves.length);
        expect(step.hint).toBeTruthy();
        expect(replayLine(board, step.toPlay, step.moves)).toBeNull();
      });
    }

    if (step.type === "choice") {
      it("offers two or three empty, legal points with exactly one best", () => {
        expect(step.options.length).toBeGreaterThanOrEqual(2);
        expect(step.options.length).toBeLessThanOrEqual(3);
        expect(step.options.filter(o => o.verdict === "best")).toHaveLength(1);
        for (const o of step.options) {
          expect(["best", "fine", "poor"]).toContain(o.verdict);
          expect(o.text).toBeTruthy();
          expect(at(board, o.point)).toBeNull();
          const res = tryPlay(board, o.point.c, o.point.r, step.toPlay);
          expect(res.ok, `option (${o.point.c},${o.point.r}): ${res.reason}`).toBe(true);
        }
      });
    }

    if (step.type === "count") {
      it("asks a question with a numeric answer and tolerance", () => {
        expect(step.question).toBeTruthy();
        expect(Number.isFinite(step.answer)).toBe(true);
        expect(step.tolerance === undefined || (Number.isFinite(step.tolerance) && step.tolerance >= 0)).toBe(true);
        expect(step.success).toBeTruthy();
      });
    }
  });
});

describe("library helpers", () => {
  const fresh = { lessonsDone: [], tierPassed: [] };
  it("lessonById and prereqsMissing", () => {
    expect(lessonById("ko").title).toBe("The Ko Rule");
    expect(lessonById("nope")).toBeNull();
    const te = lessonById("territory-count");
    expect(prereqsMissing(te, fresh).map(l => l.id)).toEqual(["two-eyes"]);
    expect(prereqsMissing(te, { lessonsDone: ["two-eyes"] })).toEqual([]);
  });
  it("nextLessonFor walks the tier in order and skips done lessons", () => {
    expect(nextLessonFor(fresh).id).toBe("liberties");
    expect(nextLessonFor({ lessonsDone: ["liberties"] }).id).toBe("no-liberty-capture");
    const allTier1 = lessonsInTier(1).map(l => l.id);
    expect(nextLessonFor({ lessonsDone: allTier1, tierPassed: [] }).id).toBe("classic-board"); // first of Tier 2
  });
  it("currentTierFor follows finished tiers and passed exit tests", () => {
    expect(currentTierFor(fresh)).toBe(1);
    expect(currentTierFor({ lessonsDone: [], tierPassed: [1] })).toBe(2);
    const allTier1 = lessonsInTier(1).map(l => l.id);
    expect(currentTierFor({ lessonsDone: allTier1, tierPassed: [] })).toBe(2);
  });
  it("lessonAfter follows the series, else library order, and ends with null", () => {
    expect(lessonAfter(lessonById("liberties")).id).toBe("no-liberty-capture");
    expect(lessonAfter(lessonById("classic-board")).id).toBe("classic-calculation");
    expect(lessonAfter(lessonById("classic-territory")).id).toBe("classic-conflict"); // chapter order, not tier order
    expect(lessonAfter(lessonById("classic-miscellany"))).toBeNull();
    expect(lessonAfter(lessonById("first-9x9-opening")).id).toBe("classic-board"); // tier 1 flows into tier 2
    expect(lessonAfter(null)).toBeNull();
  });
  it("lessonsInSeries returns chapters in order with unique chapter numbers", () => {
    const cs = lessonsInSeries("classic").map(l => l.chapter);
    expect(cs).toEqual([...cs].sort((a, b) => a - b));
    expect(new Set(cs).size).toBe(cs.length);
    expect(lessonsInSeries("nope")).toEqual([]);
  });
  it("searchLibrary matches title and track, case-insensitively", () => {
    expect(searchLibrary("")).toBe(LIBRARY);
    expect(searchLibrary("KO").some(l => l.id === "ko")).toBe(true);
    expect(searchLibrary("judgement").every(l => l.track === "judgement")).toBe(true);
    expect(searchLibrary("judgement").map(l => l.id)).toEqual(expect.arrayContaining(["territory-count", "passing-and-ending"]));
    expect(searchLibrary("Life and death").every(l => l.track === "life")).toBe(true);
    expect(searchLibrary("zzz")).toEqual([]);
  });
});
