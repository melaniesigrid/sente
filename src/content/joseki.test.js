import { describe, it, expect } from "vitest";
import { createBoard, tryPlay, chainAt, idx } from "../engine/index.js";
import { JOSEKI, CORNERS, BOARD, SOURCE, colourAt, cornerById, josekiForCorner } from "./joseki.js";
import { rankToNumber } from "./library.js";

/* What a test can hold a joseki to, and what it cannot.

   It cannot hold it to being a joseki. That is a judgement about the balance
   of a corner, and `tryPlay` has no opinions. The judgement was checked a
   different way, by walking every sequence out with the human network this
   server ships (`tools/joseki/policy.py`), and what came back is recorded on
   each move as `rank` and `p`. This file holds the recording honest: a move
   the network did not put first is a move that has to be marked `chosen`, so
   nothing in the dictionary is quietly presented as the only move when it was
   somebody's choice.

   Everything else here is ordinary and checkable: the colours alternate from
   Black, every move is legal in the position before it, nothing is captured
   on the way through (a joseki that loses stones has stopped being a joseki
   and started being a fight), and the first stone sits on the point the corner
   is named after. */

describe("the dictionary", () => {
  it("cites what it was checked against", () => {
    for (const k of ["net", "profile", "tool", "credit"]) expect(SOURCE[k], k).toBeTruthy();
    expect(SOURCE.credit).not.toMatch(/!/);
  });

  it("has unique corners, and says which ones it has not written yet", () => {
    const ids = CORNERS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CORNERS.some(c => c.written)).toBe(true);
    for (const c of CORNERS) {
      expect(c.name, c.id).toBeTruthy();
      expect(c.blurb, c.id).toBeTruthy();
      expect(c.blurb, c.id).not.toMatch(/!/);
      expect(josekiForCorner(c.id).length > 0, `${c.id} says written: ${c.written}`).toBe(!!c.written);
    }
  });

  it("has unique joseki, each filed under a corner it knows, easiest first", () => {
    const ids = JOSEKI.map(j => j.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const j of JOSEKI) expect(cornerById(j.corner), j.id).toBeTruthy();
    for (const c of CORNERS) {
      const ranks = josekiForCorner(c.id).map(j => rankToNumber(j.rank));
      expect(ranks.every(Number.isFinite), c.id).toBe(true);
      expect(ranks, c.id).toEqual([...ranks].sort((a, b) => a - b));
    }
  });
});

describe.each(JOSEKI.map(j => [j.id, j]))("%s", (id, j) => {
  it("has a name, a blurb and a result, in the house voice", () => {
    for (const k of ["name", "blurb", "result"]) expect(j[k], k).toBeTruthy();
    for (const k of ["blurb", "result"]) expect(j[k], j[k]).not.toMatch(/!/);
    expect(j.moves.length).toBeGreaterThanOrEqual(6);
  });

  it("starts on the point its corner is named after", () => {
    const corner = cornerById(j.corner);
    expect(j.moves[0].c).toBe(corner.point.c);
    expect(j.moves[0].r).toBe(corner.point.r);
  });

  it("says something about every move, and never shouts", () => {
    for (const [i, m] of j.moves.entries()) {
      expect(m.text, `move ${i + 1}`).toBeTruthy();
      expect(m.text, `move ${i + 1}`).not.toMatch(/!/);
    }
  });

  /* The recording, held honest. A move the network did not rank first in the
     corner is a choice somebody made, and it has to be labelled one. */
  it("marks as a choice every move the network did not put first", () => {
    for (const [i, m] of j.moves.entries()) {
      expect(m.check, `move ${i + 1} has no recorded check`).toBeTruthy();
      expect(m.check.rank, `move ${i + 1}`).toBeGreaterThanOrEqual(1);
      expect(m.check.p, `move ${i + 1}`).toBeGreaterThanOrEqual(0);
      expect(m.check.p, `move ${i + 1}`).toBeLessThanOrEqual(1);
      if (m.check.rank !== 1) {
        expect(m.chosen, `move ${i + 1} ranked ${m.check.rank} and is not marked a choice`).toBe(true);
      }
    }
  });

  it("plays out on a 19x19 board, in turn, with nothing captured", () => {
    let board = createBoard(BOARD);
    for (const [i, m] of j.moves.entries()) {
      expect(board.cells[idx(BOARD, m.c, m.r)], `move ${i + 1} lands on a stone`).toBeNull();
      const res = tryPlay(board, m.c, m.r, colourAt(i));
      expect(res.ok, `move ${i + 1} at (${m.c},${m.r}): ${res.reason}`).toBe(true);
      expect(res.captured.length, `move ${i + 1} captures`).toBe(0);
      board = res.board;
    }
    /* And the finished corner is a corner: every stone still on the board,
       every chain breathing, and all of it inside one quadrant. */
    for (const [i, m] of j.moves.entries()) {
      expect(board.cells[idx(BOARD, m.c, m.r)], `move ${i + 1} is gone`).toBe(colourAt(i));
      expect(chainAt(board, m.c, m.r).libs.size, `move ${i + 1} cannot breathe`).toBeGreaterThan(0);
      expect(m.c, `move ${i + 1} left the corner`).toBeLessThan(Math.ceil(BOARD / 2));
      expect(m.r, `move ${i + 1} left the corner`).toBeLessThan(Math.ceil(BOARD / 2));
    }
  });
});
