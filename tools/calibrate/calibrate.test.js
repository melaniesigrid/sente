/* The calibration harness is a measuring instrument, and an instrument nobody
   checked is a rumour. Two things in it can be wrong quietly: the eye rule,
   which decides when a game has been played out, and the statistics, which
   decide what the run is allowed to claim. Both are pure, so both are tested
   here. The network itself is not — it is 53 MB and answering it is the slow
   part of a run, not the part that has bugs of ours in it. */
import { describe, it, expect } from "vitest";
import { boardFromRows, createGame, play, pass } from "../../src/engine/index.js";
import { isEye, cleanupMoves, playItOut } from "./cleanup.mjs";
import { wilson, separated, PAIRINGS } from "./run.mjs";
import { MOVE_CAP, sideFor } from "./play.mjs";

/* A board, written the way boardToRows prints one: X black, O white, . empty. */
const b = (...rows) => boardFromRows(rows);

describe("the eye rule", () => {
  it("calls a corner surrounded by one colour an eye", () => {
    // Black holds the top-left corner: both neighbours and the one diagonal.
    const board = b(".X...",
                    "XX...",
                    ".....",
                    ".....",
                    ".....");
    expect(isEye(board, 0, 0, "b")).toBe(true);
    expect(isEye(board, 0, 0, "w")).toBe(false);
  });

  it("refuses a point with an empty neighbour", () => {
    const board = b(".X...",
                    ".....",
                    ".....",
                    ".....",
                    ".....");
    expect(isEye(board, 0, 0, "b")).toBe(false);      // (0,1) below it is empty
  });

  it("refuses an occupied point", () => {
    const board = b("XX...", "XX...", ".....", ".....", ".....");
    expect(isEye(board, 0, 0, "b")).toBe(false);
  });

  it("wants three of four diagonals in the middle", () => {
    const bare = b(".....", "..X..", ".X.X.", "..X..", ".....");
    expect(isEye(bare, 2, 2, "b")).toBe(false);        // neighbours yes, diagonals none
    const withDiags = b(".....", ".XXX.", ".X.X.", ".XX..", ".....");
    expect(isEye(withDiags, 2, 2, "b")).toBe(true);    // three of four
  });

  it("is conservative where it errs: a false eye is not an eye", () => {
    // A corner whose only diagonal is white: cuttable, so not an eye.
    const board = b(".X...", "XO...", ".....", ".....", ".....");
    expect(isEye(board, 0, 0, "b")).toBe(false);
  });
});

describe("playing it out", () => {
  it("offers every legal move except filling its own eyes", () => {
    const rec = createGame({ size: 5 });
    const all = cleanupMoves(rec, "b");
    expect(all.length).toBe(25);                       // an empty board has no eyes
  });

  it("finishes an empty board rather than hanging on it", () => {
    // Both sides fill the whole board and then have nothing but eyes left.
    const out = playItOut(createGame({ size: 5 }), { rng: () => 0 });
    expect(out.stalled).toBe(false);
    expect(out.moves).toBeGreaterThan(0);
    expect(out.rec.board.cells.filter(Boolean).length).toBeGreaterThan(10);
  });

  it("leaves a living shape alone instead of filling its eyes", () => {
    const out = playItOut(createGame({ size: 5 }), { rng: () => 0 });
    // Whatever the cleanup did, it did not fill every point: eyes survive.
    const empty = out.rec.board.cells.filter(c => c === null).length;
    expect(empty).toBeGreaterThan(0);
  });

  /* The bug this catches: two passes move the record out of "playing", so a
     cleanup loop that only runs while it is playing does nothing at all and
     the dead stones stay on the board being counted as territory. */
  it("resumes a record that two passes put into scoring", () => {
    let rec = createGame({ size: 5 });
    rec = play(rec, 2, 2);
    rec = pass(rec);
    rec = pass(rec);
    expect(rec.phase).toBe("scoring");
    const out = playItOut(rec, { rng: () => 0 });
    expect(out.moves, "the cleanup did nothing").toBeGreaterThan(0);
    expect(out.rec.board.cells.filter(Boolean).length).toBeGreaterThan(1);
  });
});

describe("what a run is allowed to claim", () => {
  it("widens the interval when there is little evidence", () => {
    const few = wilson(2, 2), many = wilson(20, 20);
    expect(few.lo).toBeLessThan(many.lo);
  });

  it("refuses to call two wins out of two a separation", () => {
    expect(separated(wilson(2, 2))).toBe(false);
  });

  it("calls ten out of ten a separation", () => {
    expect(separated(wilson(10, 10))).toBe(true);
  });

  it("does not separate a coin, however many games", () => {
    expect(separated(wilson(50, 100))).toBe(false);
  });

  it("brackets the point estimate", () => {
    const ci = wilson(7, 10);
    expect(ci.lo).toBeLessThanOrEqual(0.7);
    expect(ci.hi).toBeGreaterThanOrEqual(0.7);
  });

  it("stays inside nought and one", () => {
    for (const [w, n] of [[0, 1], [1, 1], [0, 0], [3, 5]]) {
      const ci = wilson(w, n);
      expect(ci.lo).toBeGreaterThanOrEqual(0);
      expect(ci.hi).toBeLessThanOrEqual(1);
    }
  });
});

describe("the ladder it runs", () => {
  it("asks each pairing in one direction only, so a result reads one way", () => {
    for (const p of PAIRINGS) {
      expect(p.a, p.id).toBeTruthy();
      expect(p.b, p.id).toBeTruthy();
      expect(p.why, `${p.id} does not say what it is for`).toBeTruthy();
    }
  });

  it("gives every pairing a distinct id", () => {
    expect(new Set(PAIRINGS.map(p => p.id)).size).toBe(PAIRINGS.length);
  });

  it("caps a game generously enough that hitting the cap means something", () => {
    expect(MOVE_CAP(9)).toBeGreaterThan(150);
    expect(MOVE_CAP(19)).toBeGreaterThan(700);
  });

  it("hands each side the other's rank, the way the lobby does", () => {
    const s = sideFor("5k", 0.8, "15k");
    expect(s.oppRank).toBe("15k");
    expect(s.profile.rank).toBe("5k");
  });
});
