/* ----------------------- THE DEMO LOOP -----------------------
   What the front door's board promises a visitor: that it is a real game, and
   that you can follow it. The first is the engine's business and is tested
   there. The second is these three facts, and they are easy to drop without
   anything failing to build, which is why they are held here. */
import { describe, it, expect } from "vitest";
import {
  openingFrame, nextFrameWith, demoMove, demoCount, demoSpent, DEMO_MOVES,
} from "./selfPlay.js";
import { idx } from "../engine/index.js";

const SIZE = 9;
const stonesOn = (board) => board.cells.filter(v => v !== null).length;

/** One tick, exactly as MiniSelfPlay takes one: pick a move, then step it. */
const step = (frame, size = SIZE) => nextFrameWith(frame, demoMove(frame), size);

/** A whole demo game as the component would step it. */
function play(size = SIZE, ticks = 400) {
  const frames = [openingFrame(size)];
  for (let i = 0; i < ticks; i++) frames.push(step(frames.at(-1), size));
  return frames;
}

describe("the self-playing demo", () => {
  it("opens on an empty board with nothing to say", () => {
    const f = openingFrame(SIZE);
    expect(stonesOn(f.rec.board)).toBe(0);
    expect(f.rec.toPlay).toBe("b");
    expect(f.last).toBe(null);
    expect(f.took).toEqual([]);
  });

  it("marks the stone it just played", () => {
    const f = step(openingFrame(SIZE), SIZE);
    expect(stonesOn(f.rec.board)).toBe(1);
    expect(demoCount(f)).toBe(1);
    // the mark points at the one stone on the board, not at some other point
    expect(f.rec.board.cells[f.last]).toBe("b");
  });

  // The second player. The dashboard hands in the network's move instead of
  // the heuristic's, and the stepping has to be the same stepping.
  it("plays a move handed to it, whoever chose it", () => {
    const f = nextFrameWith(openingFrame(SIZE), [4, 4], SIZE);
    expect(f.rec.board.cells[idx(SIZE, 4, 4)]).toBe("b");
    expect(f.rec.toPlay).toBe("w");
    expect(f.last).toBe(idx(SIZE, 4, 4));
  });

  it("treats a move the rules refuse as a pass rather than stalling", () => {
    const played = nextFrameWith(openingFrame(SIZE), [4, 4], SIZE);
    const onTop = nextFrameWith(played, [4, 4], SIZE);
    expect(stonesOn(onTop.rec.board)).toBe(1);
    expect(onTop.rec.passes).toBe(1);
    expect(onTop.rec.toPlay).toBe("b");
  });

  it("never mutates the frame it was given", () => {
    const before = openingFrame(SIZE);
    const snapshot = before.rec.board.cells.slice();
    step(before, SIZE);
    expect(before.rec.board.cells).toEqual(snapshot);
    expect(demoCount(before)).toBe(0);
  });

  // The capture key. A capture is drawn once and replayed on the next one; if
  // this stopped changing per move, the second capture would never be drawn.
  it("gives every move a different key from the move before it", () => {
    const frames = play();
    const moves = frames.filter((f, i) => i > 0 && demoCount(f) === demoCount(frames[i - 1]) + 1);
    expect(moves.length).toBeGreaterThan(20);
    for (const [i, f] of moves.entries()) {
      if (i > 0) expect(demoCount(f)).not.toBe(demoCount(moves[i - 1]));
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
        expect(f.rec.board.cells[idx(SIZE, c, r)]).toBe(null);
      }
    }
  });

  it("starts over rather than sitting on a finished game", () => {
    const frames = play(SIZE, 600);
    const restarts = frames.filter((f, i) => i > 0 && demoCount(f) === 0 && demoCount(frames[i - 1]) !== 0);
    expect(restarts.length, "no game ever restarted").toBeGreaterThan(0);
    for (const f of restarts) {
      expect(stonesOn(f.rec.board)).toBe(0);
      expect(f.last).toBe(null);
      expect(f.took).toEqual([]);
    }
    // and it never runs away past the limit
    expect(Math.max(...frames.map(demoCount))).toBeLessThanOrEqual(DEMO_MOVES + 1);
  });
});

/* ----------------------- ENDING, AND STARTING AGAIN -----------------------
   The chooser is allowed to have nothing to say, and both of them do: the
   heuristic returns null when every point it would consider is bad, and the
   network returns null when it is asked about a game that is already over.
   Neither may leave the board stuck on a position nobody is adding to. */
describe("a demo with nothing to play", () => {
  const SIZE9 = 9;

  it("passes rather than stalling when handed no move", () => {
    const played = nextFrameWith(openingFrame(SIZE9), [4, 4], SIZE9);
    const passed = nextFrameWith(played, null, SIZE9);
    expect(passed.rec.passes).toBe(1);
    expect(passed.rec.toPlay).toBe("b");
    // the mark stays on the last stone, because a pass did not move it
    expect(passed.last).toBe(idx(SIZE9, 4, 4));
    expect(passed.took).toEqual([]);
  });

  it("is spent once both sides have passed, and deals a new board", () => {
    let f = nextFrameWith(openingFrame(SIZE9), [4, 4], SIZE9);
    f = nextFrameWith(f, null, SIZE9);
    f = nextFrameWith(f, null, SIZE9);
    expect(f.rec.phase).not.toBe("playing");
    expect(demoSpent(f)).toBe(true);
    const fresh = nextFrameWith(f, [2, 2], SIZE9);
    expect(demoCount(fresh)).toBe(0);
    expect(stonesOn(fresh.rec.board)).toBe(0);
    expect(fresh.last).toBe(null);
  });

  it("keeps the size it was playing when nobody tells it one", () => {
    const f = step(openingFrame(13));
    expect(f.rec.size).toBe(13);
    expect(stonesOn(f.rec.board)).toBe(1);
    const handed = nextFrameWith(openingFrame(13), [6, 6]);
    expect(handed.rec.size).toBe(13);
  });
});
