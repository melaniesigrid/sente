/* ----------------------- THE DEMO LOOP -----------------------
   What the front door's board promises a visitor: that it is a real game, and
   that you can follow it. The first is the engine's business and is tested
   there. The second is these three facts, and they are easy to drop without
   anything failing to build, which is why they are held here. */
import { describe, it, expect } from "vitest";
import { openingFrame, nextFrame, DEMO_MOVES } from "./selfPlay.js";
import { idx } from "../engine/index.js";

const SIZE = 9;
const stonesOn = (board) => board.cells.filter(v => v !== null).length;

/** A whole demo game as the component would step it. */
function play(size = SIZE, ticks = 400) {
  const frames = [openingFrame(size)];
  for (let i = 0; i < ticks; i++) frames.push(nextFrame(frames.at(-1), size));
  return frames;
}

describe("the self-playing demo", () => {
  it("opens on an empty board with nothing to say", () => {
    const f = openingFrame(SIZE);
    expect(stonesOn(f.board)).toBe(0);
    expect(f.turn).toBe("b");
    expect(f.last).toBe(null);
    expect(f.took).toEqual([]);
  });

  it("marks the stone it just played", () => {
    const f = nextFrame(openingFrame(SIZE), SIZE);
    expect(stonesOn(f.board)).toBe(1);
    expect(f.n).toBe(1);
    // the mark points at the one stone on the board, not at some other point
    expect(f.board.cells[f.last]).toBe("b");
  });

  it("never mutates the frame it was given", () => {
    const before = openingFrame(SIZE);
    const snapshot = before.board.cells.slice();
    nextFrame(before, SIZE);
    expect(before.board.cells).toEqual(snapshot);
    expect(before.n).toBe(0);
  });

  // The capture key. A capture is drawn once and replayed on the next one; if
  // this stopped changing per move, the second capture would never be drawn.
  it("gives every move a different key from the move before it", () => {
    const frames = play();
    const moves = frames.filter((f, i) => i > 0 && f.n === frames[i - 1].n + 1);
    expect(moves.length).toBeGreaterThan(20);
    for (const [i, f] of moves.entries()) {
      if (i > 0) expect(f.n).not.toBe(moves[i - 1].n);
    }
  });

  // The ghosts. This is the half that was missing: the demo used to delete
  // captured stones with no sign they had ever been there.
  it("reports the stones a capturing move took, and takes them off the board", () => {
    const frames = play(SIZE, 2000);
    const captures = frames.filter((f, i) => i > 0 && f.took.length > 0 && f.took !== frames[i - 1].took);
    expect(captures.length, "self-play produced no captures to check").toBeGreaterThan(0);

    for (const f of captures) {
      for (const [c, r] of f.took) {
        // the point it says it lifted is a point it actually cleared
        expect(f.board.cells[idx(SIZE, c, r)]).toBe(null);
      }
    }
  });

  it("starts over rather than sitting on a finished game", () => {
    const frames = play(SIZE, 600);
    const restarts = frames.filter((f, i) => i > 0 && f.n === 0 && frames[i - 1].n !== 0);
    expect(restarts.length, "no game ever restarted").toBeGreaterThan(0);
    for (const f of restarts) {
      expect(stonesOn(f.board)).toBe(0);
      expect(f.last).toBe(null);
      expect(f.took).toEqual([]);
    }
    // and it never runs away past the limit
    expect(Math.max(...frames.map(f => f.n))).toBeLessThanOrEqual(DEMO_MOVES + 1);
  });
});
