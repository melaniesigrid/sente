import { describe, it, expect } from "vitest";
import { createGame, play, tryPlay, RANKS } from "../engine/index.js";
import {
  DIAL_MOVES, DIAL_SIZE, DIAL_CROP, DIAL_CANDIDATES, DIAL_ROWS, DIAL_SOURCE,
} from "./rankdial.js";

/* The figure prints a measurement, so the one thing this file can check is that
   the position it is a measurement of is a position: the engine has to accept
   every move, and both candidates have to be legal answers for the player the
   figure says is to move. The percentages themselves are only as good as the
   run recorded in rankdial.js -- see the banner there. */

const built = () => DIAL_MOVES.reduce(
  (rec, [color, c, r]) => play(rec, c, r, color),
  createGame({ size: DIAL_SIZE }),
);

describe("the rank dial position", () => {
  it("replays through the engine", () => {
    const rec = built();
    expect(rec.moves).toHaveLength(DIAL_MOVES.length);
    expect(rec.phase).toBe("playing");
  });

  it("is Black to play, which is who the figure asks about", () => {
    expect(built().toPlay).toBe("b");
  });

  it("offers two legal blocks on empty points", () => {
    const rec = built();
    expect(DIAL_CANDIDATES).toHaveLength(2);
    for (const { c, r } of DIAL_CANDIDATES) {
      const res = tryPlay(rec.board, c, r, rec.toPlay, { koPoint: rec.koPoint });
      expect(res.ok).toBe(true);
    }
  });

  it("shows the corner the moves are in", () => {
    for (const [, c, r] of DIAL_MOVES.slice(2)) {
      expect(c).toBeGreaterThanOrEqual(DIAL_CROP.c0);
      expect(r).toBeLessThanOrEqual(DIAL_CROP.r1);
    }
    expect(DIAL_CROP.c1).toBe(DIAL_SIZE - 1);
  });
});

describe("the rank dial numbers", () => {
  it("names ranks the network can imitate, weakest first", () => {
    const order = DIAL_ROWS.map(row => RANKS.indexOf(row.rank));
    expect(order.every(i => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => b - a)).toEqual(order);
  });

  it("gives every rank one probability per candidate", () => {
    for (const row of DIAL_ROWS) {
      expect(row.p).toHaveLength(DIAL_CANDIDATES.length);
      for (const p of row.p) {
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1);
      }
      // The two blocks are the network's top two here; a third move taking more
      // than what is left would mean the figure is hiding the real answer.
      expect(row.p[0] + row.p[1]).toBeLessThanOrEqual(1);
      expect(row.p[0]).toBeGreaterThan(row.p[1]);
    }
  });

  it("is the claim the copy makes: certainty climbs with the rank", () => {
    const first = DIAL_ROWS.map(row => row.p[0]);
    expect([...first].sort((a, b) => a - b)).toEqual(first);
    const second = DIAL_ROWS.map(row => row.p[1]);
    expect([...second].sort((a, b) => b - a)).toEqual(second);
  });

  it("says what it was measured against", () => {
    expect(DIAL_SOURCE.model).toMatch(/\.onnx$/);
    expect(DIAL_SOURCE.tool).toMatch(/^tools\//);
    expect(DIAL_SOURCE.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
