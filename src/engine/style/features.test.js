import { describe, it, expect } from "vitest";
import { createBoard, withStone } from "../board.js";
import { createGame, play, resign } from "../record.js";
import {
  AXES, PRIOR_AXES, lineOf, lineBucket, cornerClass, quadrantOf, phaseOf,
  moveFeatures, gameFeatures, meanStyle, spreadStyle, styleDistance,
} from "./features.js";

const N = 19;

describe("point classes", () => {
  it("lines count from the nearest edge", () => {
    expect(lineOf(0, 5, N)).toBe(1);
    expect(lineOf(3, 3, N)).toBe(4);
    expect(lineOf(18, 9, N)).toBe(1);
    expect(lineOf(9, 9, N)).toBe(10);
    expect(lineBucket(10)).toBe("5+");
    expect(lineBucket(2)).toBe("2");
  });

  it("classes corner points from any corner", () => {
    expect(cornerClass(2, 2, N)).toBe("33");
    expect(cornerClass(16, 2, N)).toBe("33");
    expect(cornerClass(2, 3, N)).toBe("34");
    expect(cornerClass(16, 3, N)).toBe("34");
    expect(cornerClass(3, 3, N)).toBe("44");
    expect(cornerClass(2, 4, N)).toBe("53");
    expect(cornerClass(4, 15, N)).toBe("54");
    expect(cornerClass(9, 3, N)).toBe("other");
  });

  it("quadrants split at tengen and the centre lines count as none", () => {
    expect(quadrantOf(3, 3, N)).toBe(0);
    expect(quadrantOf(15, 3, N)).toBe(1);
    expect(quadrantOf(3, 15, N)).toBe(2);
    expect(quadrantOf(15, 15, N)).toBe(3);
    expect(quadrantOf(9, 2, N)).toBe(-1);
    expect(quadrantOf(2, 9, N)).toBe(-1);
  });

  it("phases by move number", () => {
    expect(phaseOf(1)).toBe("opening");
    expect(phaseOf(40)).toBe("opening");
    expect(phaseOf(41)).toBe("middle");
    expect(phaseOf(150)).toBe("middle");
    expect(phaseOf(151)).toBe("endgame");
  });
});

describe("moveFeatures", () => {
  it("leaves tenuki, thickness and quadrant undefined on an empty board", () => {
    const f = moveFeatures(createBoard(N), 3, 3, "b");
    expect(f).toMatchObject({ line: 4, phase: "opening", contact: 0, tenuki: null, thickness: null, quadrant: null, atariGiven: 0, captures: 0, legal: true });
  });

  it("sees contact, tenuki distance, thickness and the enemy's quadrant", () => {
    let b = createBoard(N);
    b = withStone(b, 3, 3, "w");
    b = withStone(b, 15, 15, "b");
    const near = moveFeatures(b, 3, 4, "b", { lastEnemy: [3, 3], moveNumber: 3 });
    expect(near.contact).toBe(1);
    expect(near.tenuki).toBe(0);
    expect(near.thickness).toBe(12 + 11);
    expect(near.quadrant).toBe(1);        // white's only stone is in quadrant 0
    const far = moveFeatures(b, 15, 3, "b", { lastEnemy: [3, 3], moveNumber: 3 });
    expect(far.contact).toBe(0);
    expect(far.tenuki).toBe(1);
    expect(far.thickness).toBe(12);
    expect(far.quadrant).toBe(0);
  });

  it("counts an atari given and stones captured", () => {
    // White stone at (1,1) with black on three sides; black at (1,2) puts it in atari.
    let b = createBoard(9);
    b = withStone(b, 1, 1, "w");
    b = withStone(b, 0, 1, "b");
    b = withStone(b, 1, 0, "b");
    const atari = moveFeatures(b, 2, 1, "b");
    expect(atari.atariGiven).toBe(1);
    expect(atari.captures).toBe(0);
    const b2 = withStone(b, 2, 1, "b");
    const cap = moveFeatures(b2, 1, 2, "b");
    expect(cap.captures).toBe(1);
    expect(cap.atariGiven).toBe(0);
  });

  it("marks an illegal candidate without throwing", () => {
    const b = withStone(createBoard(9), 4, 4, "w");
    expect(moveFeatures(b, 4, 4, "b").legal).toBe(false);
  });
});

/** A short even game: black takes two 4-4 corners, white one 3-4 and one 3-3, then
 *  black attaches and white plays a tenuki. */
function sampleGame() {
  let rec = createGame({ size: N, komi: 7.5 });
  const seq = [[3, 3], [15, 2], [15, 15], [2, 16], [15, 3], [9, 9]];
  for (const [c, r] of seq) rec = play(rec, c, r);
  return rec;
}

describe("gameFeatures", () => {
  it("has every axis and counts the side's own moves only", () => {
    const rec = sampleGame();
    const b = gameFeatures(rec, "b", { year: 1846 });
    for (const a of AXES) expect(b, a).toHaveProperty(a);
    expect(b.moves).toBe(3);
    expect(b.length).toBe(6);
    expect(b.year).toBe(1846);
    expect(b.komi).toBe(7.5);
    expect(b.resigned).toBe(0);
  });

  it("classes first corner moves and lines by phase", () => {
    const rec = sampleGame();
    const b = gameFeatures(rec, "b");
    const w = gameFeatures(rec, "w");
    expect(b.corner_44).toBe(1);          // both black corner moves were 4-4
    expect(w.corner_34).toBe(0.5);
    expect(w.corner_33).toBe(0.5);
    expect(b.line_opening_4).toBeCloseTo(1, 5);   // (15,3) is also line 4
    expect(w["line_opening_5+"]).toBeCloseTo(1 / 3, 5);
    expect(b.line_middle_4).toBe(0);
  });

  it("measures contact, tenuki and thickness from the moves actually played", () => {
    const rec = sampleGame();
    const b = gameFeatures(rec, "b");
    const w = gameFeatures(rec, "w");
    expect(b.contact).toBeCloseTo(1 / 3, 5);      // (15,3) touches white (15,2)
    expect(b.tenuki).toBeCloseTo(1, 5);           // (15,3) touches (15,2) but the last white stone is (2,16)
    expect(w.tenuki).toBeCloseTo(1, 5);           // white played away every time
    expect(b.thickness).toBeGreaterThan(0);
    expect(b.atari100).toBe(0);
    expect(b.sacrificed).toBe(0);
    expect(b.netTraded).toBe(0);
  });

  it("records resignation and unknown year", () => {
    const rec = resign(sampleGame(), "w");
    const b = gameFeatures(rec, "b");
    expect(b.resigned).toBe(1);
    expect(b.year).toBeNull();
    expect(b.length).toBe(6);
  });

  it("refuses a record that does not replay", () => {
    const rec = { ...sampleGame(), moves: [{ type: "play", color: "b", c: 3, r: 3 }, { type: "play", color: "w", c: 3, r: 3 }] };
    expect(() => gameFeatures(rec, "b")).toThrow(RangeError);
  });

  it("names the axes the runtime prior can read from one candidate", () => {
    expect(PRIOR_AXES).toEqual(["line", "contact", "tenuki", "thickness", "quadrant", "atari"]);
  });
});

describe("aggregates", () => {
  const vs = [
    { contact: 0.2, thickness: 4, year: 1840 },
    { contact: 0.4, thickness: 6, year: null },
  ];
  const axes = ["contact", "thickness", "year", "komi"];

  it("means skip nulls and leave empty axes null", () => {
    const m = meanStyle(vs, axes);
    expect(m.contact).toBeCloseTo(0.3, 9);
    expect(m.thickness).toBe(5);
    expect(m.year).toBe(1840);
    expect(m.komi).toBeNull();
  });

  it("spread is the population deviation with a floor", () => {
    const s = spreadStyle(vs, axes);
    expect(s.contact).toBeCloseTo(0.1, 9);
    expect(s.thickness).toBe(1);
    expect(s.year).toBe(1e-3);
    expect(s.komi).toBeNull();
  });

  it("distance is zero to itself and a z-score away from a shifted vector", () => {
    const m = meanStyle(vs, axes), s = spreadStyle(vs, axes);
    expect(styleDistance(m, m, s, axes)).toBe(0);
    const shifted = { ...m, contact: m.contact + 0.2 };
    expect(styleDistance(m, shifted, s, ["contact", "thickness"])).toBeCloseTo(Math.sqrt(4 / 2), 9);
  });
});
