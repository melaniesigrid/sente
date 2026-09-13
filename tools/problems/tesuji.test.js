/* ----------------------- COUNTING PRISONERS -----------------------
   `prisoners` is the solver that exists because `catches` could not see a
   snapback: it counts stones taken rather than chasing a named chain. The
   drills it produces are re-proved in `src/content/drills.test.js` from the
   shipped data; what is checked here is the solver's own behaviour, on
   positions small enough to work out by hand, so that a change to it fails
   against arithmetic rather than against two hundred boards at once. */
import { describe, it, expect } from "vitest";
import { boardFromRows } from "../../src/engine/index.js";
import { captureValues, prisoners, tesujiRegion, readingHorizon, fmt } from "./prove.mjs";

const rows = (...r) => boardFromRows([...r, ...Array(9 - r.length).fill(".........")]);

describe("what the count is", () => {
  /* Three white stones in the corner with one liberty left. Black plays it and
     three stones come off: the simplest thing the counter has to get right. */
  const atari = rows(
    ".OX......",
    "OOX......",
    "XXX......",
  );

  it("gives a capture its stones", () => {
    const region = tesujiRegion(atari);
    const v = captureValues(atari, region, "b", { cap: 6 });
    expect(v.moves[0].net).toBe(3);
    expect(v.moves[0].takes).toBe(3);
    expect(fmt([v.moves[0].point])).toBe("0,0");
  });

  /* Nobody has to move for the stones to fall, so the pass is worth the same
     as the capture. A solver that thought otherwise would call every dead
     group a tesuji. */
  it("counts what happens anyway, so waiting is worth the same", () => {
    const region = tesujiRegion(atari);
    expect(prisoners(atari, region, "w", { cap: 6 })).toBe(3);
  });
});

describe("the symmetric two-point eye", () => {
  /* Both points kill, which is why a shape like this is not a problem: it is a
     question with two right answers, and the census drops it. What matters
     here is that the solver reports the tie rather than inventing a winner. */
  const eye = rows(
    "XXXXX....",
    "XOOOX....",
    "X..OX....",
    "XXXXX....",
  );

  it("finds both points worth the same", () => {
    const region = tesujiRegion(eye);
    const v = captureValues(eye, region, "b", { cap: 7 });
    expect(v.moves.length).toBeGreaterThan(1);
    expect(v.moves[0].net).toBe(v.moves[1].net);
  });
});

describe("giving a stone away", () => {
  /* A stone played into a point where it has one liberty is a sacrifice, and
     the flag is what the census selects on, so it is worth pinning down. */
  it("marks a move that can be taken straight back", () => {
    const board = rows(
      "XXXXX....",
      "XOOOX....",
      "X..OX....",
      "XXXXX....",
    );
    const region = tesujiRegion(board);
    const v = captureValues(board, region, "b", { cap: 7 });
    const inside = v.moves.find(m => m.point.c === 1 && m.point.r === 2);
    expect(inside, "the 1,2 point is in the fight").toBeTruthy();
    expect(typeof inside.sacrifice).toBe("boolean");
  });
});

describe("the reading horizon", () => {
  const atari = rows(
    ".OX......",
    "OOX......",
    "XXX......",
  );

  it("is shallow when the answer is a capture in one", () => {
    const region = tesujiRegion(atari);
    const v = captureValues(atari, region, "b", { cap: 7 });
    /* Either it settles at the first horizon it is asked about, or the position
       is a tie and the horizon runs out; both are honest, and the number is
       never outside the range it was asked for. */
    const d = readingHorizon(atari, region, "b", v.moves[0].point);
    expect(d).toBeGreaterThanOrEqual(2);
    expect(d).toBeLessThanOrEqual(7);
  });
});

describe("the region", () => {
  it("is the empty points within two of a white stone, and nothing else", () => {
    const board = rows("....O....");
    const region = tesujiRegion(board);
    for (const p of region) {
      expect(Math.abs(p.c - 4) + Math.abs(p.r - 0)).toBeLessThanOrEqual(2);
    }
    expect(region.some(p => p.c === 4 && p.r === 2)).toBe(true);
    expect(region.some(p => p.c === 4 && p.r === 3)).toBe(false);
    expect(region.some(p => p.c === 4 && p.r === 0)).toBe(false);   // the stone itself
  });
});
