import { describe, it, expect } from "vitest";
import { COMMENTARY, PACING, chooseRemark, linesFor, noteSpoken } from "./commentary.js";
import { PERSONAS } from "./personas.js";
import { SHAPES } from "../engine/index.js";

const allLines = () =>
  Object.values(COMMENTARY).flatMap((entry) => Object.values(entry).flat());

describe("the commentary library", () => {
  it("covers every shape the engine can name, and names no shape the engine cannot", () => {
    expect(Object.keys(COMMENTARY).sort()).toEqual([...SHAPES].sort());
  });

  it("gives every shape a default voice, so a new persona is never silent", () => {
    for (const id of SHAPES) {
      expect(COMMENTARY[id].default.length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it("keys every override to a real persona", () => {
    const known = new Set(["default", ...PERSONAS.map((p) => p.id)]);
    for (const [shapeId, entry] of Object.entries(COMMENTARY)) {
      for (const key of Object.keys(entry)) {
        expect(known.has(key), `${shapeId}.${key}`).toBe(true);
        expect(Array.isArray(entry[key]), `${shapeId}.${key}`).toBe(true);
      }
    }
  });

  it("has no exclamation marks - the opponent is excitable, the coach is calm", () => {
    for (const line of allLines()) expect(line, line).not.toMatch(/!/);
  });

  it("writes whole, short sentences", () => {
    for (const line of allLines()) {
      expect(line, line).toMatch(/[.?]$/);
      expect(line.length, line).toBeLessThanOrEqual(90);
    }
  });

  it("gives a persona its own lines first, then the fallback", () => {
    const own = COMMENTARY["empty-triangle"].tetsu;
    const pool = linesFor("empty-triangle", "tetsu");
    expect(pool.slice(0, own.length)).toEqual(own);
    expect(pool).toEqual([...own, ...COMMENTARY["empty-triangle"].default]);
    expect(linesFor("empty-triangle", null)).toEqual(COMMENTARY["empty-triangle"].default);
    expect(linesFor("no-such-shape", "tetsu")).toEqual([]);
  });

  it("falls back to the default voice for a persona with nothing of its own to say", () => {
    // Sora writes no overrides, and a persona the file has never heard of behaves the same.
    expect(COMMENTARY["empty-triangle"].sora).toBeUndefined();
    expect(linesFor("empty-triangle", "sora")).toEqual(COMMENTARY["empty-triangle"].default);
    expect(linesFor("dumpling", "nobody")).toEqual(COMMENTARY.dumpling.default);
  });
});

describe("chooseRemark pacing", () => {
  const triangle = { id: "empty-triangle", severity: "note" };
  const mouth = { id: "tigers-mouth", severity: "praise" };

  it("says nothing when the engine found nothing", () => {
    expect(chooseRemark([], { moveNumber: 10 })).toBe(null);
    expect(chooseRemark(null, { moveNumber: 10 })).toBe(null);
  });

  it("speaks on the first finding of the game", () => {
    const r = chooseRemark([triangle], { moveNumber: 8, personaId: "yuki" });
    expect(r.shapeId).toBe("empty-triangle");
    expect(COMMENTARY["empty-triangle"].yuki).toContain(r.line);
  });

  it("stays quiet until the gap has passed", () => {
    const spoken = { "tigers-mouth": { count: 1, lastMove: 20 } };
    expect(chooseRemark([triangle], { spoken, moveNumber: 20 + PACING.minGap - 1 })).toBe(null);
    expect(chooseRemark([triangle], { spoken, moveNumber: 20 + PACING.minGap })).toBeTruthy();
  });

  it("will not repeat a shape before repeatAfter, and only ever once", () => {
    const first = { "empty-triangle": { count: 1, lastMove: 10 } };
    expect(chooseRemark([triangle], { spoken: first, moveNumber: 10 + PACING.repeatAfter - 1 })).toBe(null);
    const second = chooseRemark([triangle], { spoken: first, moveNumber: 10 + PACING.repeatAfter });
    expect(second).toBeTruthy();

    // A count, not just a move number: the third attempt must fail even though
    // the gap has passed again.
    const twice = { "empty-triangle": { count: 2, lastMove: 45 } };
    expect(chooseRemark([triangle], { spoken: twice, moveNumber: 45 + PACING.repeatAfter * 2 })).toBe(null);
  });

  it("uses a different line on the repeat", () => {
    const one = chooseRemark([triangle], { moveNumber: 10, personaId: "ren" });
    const two = chooseRemark([triangle], {
      spoken: { "empty-triangle": { count: 1, lastMove: 10 } },
      moveNumber: 10 + PACING.repeatAfter,
      personaId: "ren",
    });
    expect(two.line).not.toBe(one.line);
  });

  it("prefers the kind reading when a position is both a triangle and a mouth", () => {
    const r = chooseRemark([triangle, mouth], { moveNumber: 12 });
    expect(r.shapeId).toBe("tigers-mouth");
  });

  it("says nothing rather than scolding once the kinder reading is used up", () => {
    // A position can honestly be both a mouth and an empty triangle. Filtering by
    // eligibility before ranking would, after two mouths, start criticising the third
    // one as an empty triangle - the exact thing the severity order exists to prevent.
    const spoken = { "tigers-mouth": { count: PACING.maxPerShape, lastMove: 36 } };
    expect(chooseRemark([triangle, mouth], { spoken, moveNumber: 70 })).toBe(null);
  });

  it("still speaks a lesser shape when nothing better was in the running", () => {
    const spoken = { "tigers-mouth": { count: PACING.maxPerShape, lastMove: 36 } };
    expect(chooseRemark([triangle], { spoken, moveNumber: 70 }).shapeId).toBe("empty-triangle");
  });

  it("lets a warn outrank praise, though nothing ships as warn yet", () => {
    const urgent = { id: "empty-triangle", severity: "warn" };
    expect(chooseRemark([mouth, urgent], { moveNumber: 12 }).shapeId).toBe("empty-triangle");
  });

  it("says nothing about a shape the library has no words for", () => {
    const stranger = { id: "ponnuki", severity: "praise" };
    expect(chooseRemark([stranger], { moveNumber: 12 })).toBe(null);
  });

  it("speaks in the default voice when the persona has no line of its own", () => {
    const r = chooseRemark([triangle], { moveNumber: 8, personaId: "sora" });
    expect(COMMENTARY["empty-triangle"].default).toContain(r.line);
  });

  it("ranks a severity it does not recognise below every one it does", () => {
    const odd = { id: "tigers-mouth", severity: "shrug" };
    expect(chooseRemark([odd, triangle], { moveNumber: 12 }).shapeId).toBe("empty-triangle");
    // It is still eligible on its own, and reports the severity it was given.
    const alone = chooseRemark([odd], { moveNumber: 12 });
    expect(alone.shapeId).toBe("tigers-mouth");
    expect(alone.severity).toBe("shrug");
  });

  it("keeps the detector's order when severities tie", () => {
    const dumpling = { id: "dumpling", severity: "note" };
    expect(chooseRemark([triangle, dumpling], { moveNumber: 12 }).shapeId).toBe("empty-triangle");
    expect(chooseRemark([dumpling, triangle], { moveNumber: 12 }).shapeId).toBe("dumpling");
  });
});

describe("noteSpoken", () => {
  it("counts utterances and records the move, without mutating", () => {
    const a = {};
    const b = noteSpoken(a, "dumpling", 14);
    expect(a).toEqual({});
    expect(b.dumpling).toEqual({ count: 1, lastMove: 14 });
    expect(noteSpoken(b, "dumpling", 60).dumpling).toEqual({ count: 2, lastMove: 60 });
  });
});
