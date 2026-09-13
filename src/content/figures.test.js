import { describe, it, expect } from "vitest";
import { FIGURES, figureOf, figureFor, playFigure, figureFrames, figureLives } from "./figures.js";
import { chainAt, idx, createBoard, withStone } from "../engine/board.js";
import { tryPlay } from "../engine/rules.js";

/* Every figure is decoration, and every note under one is a claim. A claim on
   this site is checked, including the ones nobody will read: a shape set at
   the size of a section is the most visible go on the front door, and it is
   the one place a wrong diagram would be hardest to notice and worst to ship.
   So the engine is asked, here, whether each figure is what it says it is. */

const at = (b, c, r) => b.cells[idx(b.size, c, r)];
const libsOf = (b, c, r) => chainAt(b, c, r).libs.size;

describe("the figures", () => {
  it("has a unique id and a note for each", () => {
    const ids = FIGURES.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FIGURES) {
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.note.length).toBeGreaterThan(40);
      expect(f.moves.length).toBeGreaterThan(2);
    }
  });

  it("plays every move legally, on the board it says", () => {
    for (const f of FIGURES) {
      expect(() => playFigure(f)).not.toThrow();
      const board = playFigure(f);
      expect(board.size).toBe(f.size);
      for (const [c, r] of f.moves) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(f.size);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThan(f.size);
      }
    }
  });

  it("gives one frame per move, each one move further on", () => {
    for (const f of FIGURES) {
      const frames = figureFrames(f);
      expect(frames.length).toBe(f.moves.length);
      expect(frames[frames.length - 1].cells).toEqual(playFigure(f).cells);
    }
  });

  it("accounts for every stone, including the ones taken off", () => {
    for (const f of FIGURES) {
      const lives = figureLives(f);
      expect(lives.length).toBe(f.moves.length);
      const board = playFigure(f);
      const standing = lives.filter(l => l.gone === null);
      expect(standing.length).toBe(board.cells.filter(Boolean).length);
      for (const l of standing) expect(at(board, l.c, l.r)).toBe(l.colour);
      for (const l of lives) if (l.gone !== null) expect(l.gone).toBeGreaterThan(l.laid);
    }
  });

  it("ponnuki and the ko each lose exactly one stone on the way", () => {
    for (const id of ["ponnuki", "ko"]) {
      const taken = figureLives(figureOf(id)).filter(l => l.gone !== null);
      expect(taken.length).toBe(1);
      expect(taken[0].colour).toBe("w");
    }
  });

  it("falls back rather than throwing on a name it does not know", () => {
    expect(figureOf("no-such-shape").id).toBe(FIGURES[0].id);
    expect(figureFor("no-such-screen").id).toBe(FIGURES[0].id);
    expect(figureFor("learn").id).toBe("ladder");
  });
});

describe("what each figure claims", () => {
  it("ponnuki: the last stone captures, and the hole is surrounded", () => {
    const f = figureOf("ponnuki");
    const before = playFigure(f, f.moves.length - 1);
    const [c, r, colour] = f.moves[f.moves.length - 1];
    const res = tryPlay(before, c, r, colour);
    expect(res.ok).toBe(true);
    expect(res.captured.length).toBe(1);          // exactly one stone comes off
    const board = playFigure(f);
    expect(at(board, 2, 2)).toBe(null);           // and the centre is empty
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      expect(at(board, 2 + dc, 2 + dr)).toBe("b");
    }
  });

  it("tiger's mouth: a stone played into it is in atari at once", () => {
    const board = playFigure(figureOf("tigers-mouth"));
    const into = tryPlay(board, 2, 2, "w");
    expect(into.ok).toBe(true);                        // the mouth is open
    expect(libsOf(into.board, 2, 2)).toBe(1);          // and it is already atari
    const shut = tryPlay(into.board, 2, 3, "b");       // one more stone
    expect(shut.ok).toBe(true);
    expect(shut.captured).toEqual([[2, 2]]);           // and the mouth closes
  });

  it("bamboo joint: a cut on either side is answered on the other", () => {
    const board = playFigure(figureOf("bamboo"));
    const gaps = [[1, 2], [2, 2]];
    for (const [gc, gr] of gaps) {
      const cut = tryPlay(board, gc, gr, "w");
      expect(cut.ok).toBe(true);
      const [oc, or] = gaps.find(([c, r]) => c !== gc || r !== gr);
      const join = tryPlay(cut.board, oc, or, "b");
      expect(join.ok).toBe(true);
      // all four original stones, and the joining one, are now one chain
      expect(chainAt(join.board, 1, 1).stones.length).toBe(5);
    }
  });

  it("ladder: it is a ladder, and it ends in atari on the last line", () => {
    const f = figureOf("ladder");
    const frames = figureFrames(f);
    const board = frames[frames.length - 1];
    const last = f.moves[f.moves.length - 1];
    expect(last[2]).toBe("w");
    expect(libsOf(board, last[0], last[1])).toBe(1);   // White is caught
    expect(last[1]).toBe(f.size - 1);                  // on the bottom line

    // and every White move in it was forced: played into its chain's one liberty
    f.moves.forEach(([, , colour], i) => {
      if (colour !== "w" || i < 4) return;
      const before = frames[i - 1];
      const prev = f.moves.slice(0, i).filter(m => m[2] === "w").pop();
      expect(libsOf(before, prev[0], prev[1])).toBe(1);
    });
  });

  it("ko: Black takes one, and White may not take it straight back", () => {
    const f = figureOf("ko");
    const before = playFigure(f, f.moves.length - 1);
    const take = tryPlay(before, 2, 1, "b");
    expect(take.ok).toBe(true);
    expect(take.captured.length).toBe(1);
    expect(take.ko).not.toBe(null);
    const back = tryPlay(take.board, 1, 1, "w", { koPoint: take.ko });
    expect(back.ok).toBe(false);
    expect(back.reason).toBe("ko");
    // the same move is fine once the ko has been left alone for a turn
    expect(tryPlay(take.board, 1, 1, "w").ok).toBe(true);
  });

  it("two eyes: neither eye can be filled, so the group cannot be taken", () => {
    const board = playFigure(figureOf("two-eyes"));
    const eyes = [[0, 0], [2, 0]];
    for (const [c, r] of eyes) {
      expect(at(board, c, r)).toBe(null);
      const res = tryPlay(board, c, r, "w");
      expect(res.ok).toBe(false);
      expect(res.reason).toBe("suicide");
    }
    // one chain, and the two eyes are its last two liberties
    expect(chainAt(board, 1, 1).stones.length).toBe(6);
  });

  it("empty triangle: seven liberties where a line of three has eight", () => {
    const bent = playFigure(figureOf("empty-triangle"));
    expect(chainAt(bent, 1, 1).stones.length).toBe(3);
    expect(libsOf(bent, 1, 1)).toBe(7);

    let line = createBoard(5);
    for (const c of [1, 2, 3]) line = withStone(line, c, 1, "b");
    expect(chainAt(line, 1, 1).stones.length).toBe(3);
    expect(libsOf(line, 1, 1)).toBe(8);
  });

  it("net: the stone is loose, and every escape is met", () => {
    const f = figureOf("net");
    const board = playFigure(f);
    expect(libsOf(board, 2, 2)).toBe(4);          // not captured, not in atari
    // the four black stones are four separate stones: a net, not a wall
    for (const [c, r] of [[1, 1], [3, 1], [1, 3], [3, 3]]) {
      expect(chainAt(board, c, r).stones.length).toBe(1);
    }
  });
});
