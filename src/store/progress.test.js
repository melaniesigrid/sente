import { describe, it, expect } from "vitest";
import {
  progressOf, cleanProgress, mergeProgress, applyProgress, progressBytes,
  PROGRESS_FIELDS, SETS, HIGH, LATEST, MAPS, PROGRESS_MAX_BYTES,
} from "./progress.js";
import { defaultProfile, sanitizeProfile } from "./profile.js";

describe("progressOf", () => {
  it("takes the record of what was done and leaves the preferences", () => {
    const p = { ...defaultProfile, lessonsDone: ["liberties"], theme: "night", name: "Ada", sound: true };
    const out = progressOf(p);
    expect(out.lessonsDone).toEqual(["liberties"]);
    for (const key of ["theme", "name", "sound", "typeface", "stones", "locale", "tint", "onboarded"]) expect(key in out).toBe(false);
  });
  it("covers every progress field the profile defines, and only those", () => {
    for (const key of PROGRESS_FIELDS) expect(key in defaultProfile, key).toBe(true);
    expect(new Set(PROGRESS_FIELDS).size).toBe(PROGRESS_FIELDS.length);
    expect(PROGRESS_FIELDS).toEqual([...Object.keys(SETS), ...HIGH, ...LATEST, ...MAPS]);
  });
  it("leaves out what the profile does not carry rather than defaulting it", () => {
    expect(progressOf({ streak: 3 })).toEqual({ streak: 3 });
    expect(progressOf(null)).toEqual({});
  });
});

describe("cleanProgress", () => {
  it("is null for anything that is not an object", () => {
    for (const v of [null, undefined, 7, "x", []]) expect(cleanProgress(v)).toBeNull();
  });
  it("keeps well-shaped fields and drops the rest, without inventing any", () => {
    const out = cleanProgress({
      lessonsDone: ["a", "a", "b"], problemsDone: "nope", tierPassed: [1, 2.5], chain: ["2026-09-01"],
      chainBest: 2, kataBest: -1, rating: 1500, kataDate: "2026-09-15", duelMoves: "many", duelDate: 7,
      recall: { "a#1": { box: 2, due: "2026-09-20" } }, bookProgress: [], theme: "night", extra: 1,
    });
    expect(out).toEqual({
      lessonsDone: ["a", "b"], chain: ["2026-09-01"], chainBest: 2, kataDate: "2026-09-15",
      recall: { "a#1": { box: 2, due: "2026-09-20" } },
    });
  });
  it("keeps everything a real profile sends", () => {
    const p = sanitizeProfile({ ...defaultProfile, lessonsDone: ["liberties"], chainBest: 4 });
    expect(cleanProgress(progressOf(p))).toEqual(progressOf(p));
  });
});

describe("mergeProgress", () => {
  const A = { data: { lessonsDone: ["a"], problemsDone: ["p1"], kataBest: 2, kataStreak: 1400, streak: 3, chain: ["2026-09-01"], chainBest: 1,
    recall: { x: { box: 1, due: "2026-09-10" }, y: { box: 2, due: "2026-09-12" } }, bookProgress: { L: { stops: 3, score: 4, total: 6 } } }, at: 100 };
  const B = { data: { lessonsDone: ["b"], drillsDone: ["d"], kataBest: 1, kataStreak: 1520, streak: 0, chain: ["2026-09-03"], chainBest: 2,
    recall: { x: { box: 1, due: "2026-09-14" }, y: { box: 0, due: "2026-09-13" }, z: { box: 3, due: "2026-09-30" } }, bookProgress: { L: { stops: 6, score: 3, total: 6 } } }, at: 200 };

  it("joins what either side has done", () => {
    const { data } = mergeProgress(A, B);
    expect(data.lessonsDone).toEqual(["a", "b"]);
    expect(mergeProgress(B, A).data.lessonsDone).toEqual(["a", "b"]);
    expect(data.problemsDone).toEqual(["p1"]);
    expect(data.drillsDone).toEqual(["d"]);
    expect(data.chain).toEqual(["2026-09-01", "2026-09-03"]);
  });
  it("keeps the higher of a count or a best, and the newer of a value that is one thing", () => {
    const { data, at } = mergeProgress(A, B);
    expect(data.kataBest).toBe(2);
    expect(data.chainBest).toBe(2);
    expect(data.kataStreak).toBe(1520);
    expect(data.streak).toBe(0);
    expect(at).toBe(200);
    expect(mergeProgress(B, A).data.kataStreak).toBe(1520);
  });
  it("takes a recall card further along, and of two in the same box the one answered later", () => {
    const { data } = mergeProgress(A, B);
    expect(data.recall.x).toEqual({ box: 1, due: "2026-09-14" });
    expect(data.recall.y).toEqual({ box: 2, due: "2026-09-12" });
    expect(data.recall.z).toEqual({ box: 3, due: "2026-09-30" });
  });
  it("keeps the better run of a replay lesson, score before stops", () => {
    expect(mergeProgress(A, B).data.bookProgress.L).toEqual({ stops: 3, score: 4, total: 6 });
  });
  it("does not matter which side is given first, except where the clock decides", () => {
    const ab = mergeProgress(A, B).data, ba = mergeProgress(B, A).data;
    expect(ab).toEqual(ba);
  });
  it("never reads an absence as a zero", () => {
    const { data } = mergeProgress({ data: { kataBest: 5 }, at: 1 }, { data: { streak: 1500 }, at: 2 });
    expect(data).toEqual({ kataBest: 5, streak: 1500 });
    expect(mergeProgress(null, { data: { kataBest: 1 }, at: 3 })).toEqual({ data: { kataBest: 1 }, at: 3 });
  });
  it("caps the days practised the way the chain itself does", () => {
    const days = Array.from({ length: 450 }, (_, i) => `2025-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}#${i}`);
    const { data } = mergeProgress({ data: { chain: days.slice(0, 300) }, at: 1 }, { data: { chain: days.slice(200) }, at: 2 });
    expect(data.chain).toHaveLength(400);
    expect(data.chain).toEqual([...data.chain].sort());
  });
  it("is idempotent: merging a document with itself changes nothing", () => {
    expect(mergeProgress(A, A)).toEqual(A);
  });
  it("sorts a list of passed tiers as numbers, not as words", () => {
    expect(mergeProgress({ data: { tierPassed: [10, 2] }, at: 1 }, { data: { tierPassed: [1] }, at: 2 }).data.tierPassed).toEqual([1, 2, 10]);
  });
});

describe("applyProgress", () => {
  it("lays the document over the profile and touches nothing else", () => {
    const p = { ...defaultProfile, theme: "night" };
    const out = applyProgress(p, { lessonsDone: ["a"], wins: 2 });
    expect(out.theme).toBe("night");
    expect(out.lessonsDone).toEqual(["a"]);
    expect(out.wins).toBe(2);
    expect(applyProgress(p, null)).toEqual(p);
  });
  it("survives the profile sanitiser, so a pull can be saved as it is", () => {
    const merged = applyProgress(defaultProfile, mergeProgress(
      { data: progressOf({ ...defaultProfile, lessonsDone: ["liberties"] }), at: 1 },
      { data: progressOf({ ...defaultProfile, problemsDone: ["p"] }), at: 2 },
    ).data);
    const back = sanitizeProfile(JSON.parse(JSON.stringify(merged)));
    expect(back.lessonsDone).toEqual(["liberties"]);
    expect(back.problemsDone).toEqual(["p"]);
  });
});

describe("the cap", () => {
  it("leaves the whole library's recall schedule well under it", () => {
    const recall = {};
    for (let i = 0; i < 600; i++) recall[`lesson-${i}#${i % 7}`] = { box: 3, due: "2026-09-15" };
    const doc = { data: { ...progressOf(defaultProfile), recall, lessonsDone: Array.from({ length: 200 }, (_, i) => `lesson-${i}`) }, at: Date.now() };
    expect(progressBytes(doc)).toBeLessThan(PROGRESS_MAX_BYTES / 2);
  });
});
