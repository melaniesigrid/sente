import { describe, it, expect } from "vitest";
import { createGame, play, pass } from "./record.js";
import { describeMove, phaseOf, lineOf, regionOf, policyStanding, distance } from "./explain.js";

const game = (size = 9) => createGame({ size });

/** Play a list of moves alternating from Black, returning the record before and after the last. */
function after(moves, size = 9) {
  let rec = game(size);
  let before = rec;
  for (const [c, r] of moves) { before = rec; rec = play(rec, c, r); }
  return { before, after: rec, move: moves[moves.length - 1] };
}

describe("where a stone is", () => {
  it("counts lines from the nearest edge, the edge being the first", () => {
    expect(lineOf(9, 0, 4)).toBe(1);
    expect(lineOf(9, 2, 2)).toBe(3);
    expect(lineOf(19, 15, 3)).toBe(4);
    expect(lineOf(9, 4, 4)).toBe(5);
  });

  it("names the corner, the side and the centre", () => {
    expect(regionOf(19, 3, 3)).toBe("corner");
    expect(regionOf(19, 9, 2)).toBe("side");
    expect(regionOf(19, 9, 9)).toBe("centre");
    // On 9x9 the fourth line is already the middle of the board.
    expect(regionOf(9, 3, 3)).toBe("centre");
    expect(regionOf(9, 3, 1)).toBe("side");
    expect(regionOf(9, 2, 2)).toBe("corner");
    expect(regionOf(9, 4, 4)).toBe("centre");
  });

  it("phases a game by the share of the board played", () => {
    expect(phaseOf(1, 9)).toBe("opening");
    expect(phaseOf(20, 9)).toBe("middle");
    expect(phaseOf(50, 9)).toBe("endgame");
    expect(phaseOf(40, 19)).toBe("opening");
    expect(phaseOf(200, 19)).toBe("endgame");
  });

  it("measures distance as the larger axis, and none to a pass", () => {
    expect(distance([2, 2], [5, 4])).toBe(3);
    expect(distance(null, [1, 1])).toBeNull();
  });
});

describe("describing a move", () => {
  it("says a pass is a pass, and whether the other side had just passed", () => {
    let rec = game();
    rec = play(rec, 2, 2);
    const facts = describeMove(rec, pass(rec), null);
    expect(facts.pass).toBe(true);
    expect(facts.oppPassed).toBe(false);
    const both = pass(pass(rec));
    expect(describeMove(pass(rec), both, null).oppPassed).toBe(true);
  });

  it("reads contact, and that a lonely stone touched nothing", () => {
    const lone = after([[2, 2]]);
    const f = describeMove(lone.before, lone.after, lone.move);
    expect(f.lonely).toBe(true);
    expect(f.contact).toBe(0);
    expect(f.region).toBe("corner");
    expect(f.line).toBe(3);
    expect(f.phase).toBe("opening");
    const touch = after([[2, 2], [3, 2]]);
    expect(describeMove(touch.before, touch.after, touch.move).contact).toBe(1);
  });

  it("counts an atari it makes and a capture it takes", () => {
    // Black at (4,4); White surrounds three sides, the fourth is the atari.
    const a = after([[4, 4], [3, 4], [0, 0], [5, 4], [0, 1], [4, 3]]);
    const f = describeMove(a.before, a.after, a.move);
    expect(f.ataris).toBe(1);
    expect(f.captured).toBe(0);
    const cap = play(play(a.after, 8, 8), 4, 5);
    const before = play(a.after, 8, 8);
    const g = describeMove(before, cap, [4, 5]);
    expect(g.captured).toBe(1);
  });

  it("knows a self-atari, an escape, a connection and an extension", () => {
    // Black stone at (0,0) with White at (1,0): playing (0,1) connects nothing, extends
    // the corner stone, and leaves it with liberties.
    const ext = after([[0, 0], [1, 0], [0, 1]]);
    const f = describeMove(ext.before, ext.after, ext.move);
    expect(f.extends).toBe(true);
    expect(f.connects).toBe(false);
    expect(f.escaped).toBe(true);   // (0,0) had one liberty and now the chain has two
    expect(f.selfAtari).toBe(false);
    // Two black stones a point apart, joined by the third.
    const join = after([[2, 4], [8, 8], [4, 4], [8, 7], [3, 4]]);
    expect(describeMove(join.before, join.after, join.move).connects).toBe(true);
    // A stone on the edge with White on two sides and the corner point its one liberty.
    const sa = after([[8, 8], [1, 0], [7, 7], [1, 1], [6, 6], [0, 2], [0, 1]]);
    expect(describeMove(sa.before, sa.after, sa.move).selfAtari).toBe(true);
  });

  it("calls a far reply a tenuki and names the shapes the engine sees", () => {
    const far = after([[2, 2], [6, 6], [7, 7]]);
    expect(describeMove(far.before, far.after, far.move).tenuki).toBe(false);
    const away = after([[2, 2], [6, 6], [2, 6]]);
    // (6,6) to (2,6) is four apart: not a tenuki. (6,6) to (1,1) is five: tenuki.
    expect(describeMove(away.before, away.after, away.move).tenuki).toBe(false);
    const gone = after([[2, 2], [6, 6], [1, 1]]);
    expect(describeMove(gone.before, gone.after, gone.move).tenuki).toBe(true);
    const tri = after([[4, 4], [8, 8], [5, 4], [8, 7], [4, 5]]);
    expect(describeMove(tri.before, tri.after, tri.move).shapes).toContain("empty-triangle");
  });
});

describe("standing on the shortlist", () => {
  const top = [{ move: [3, 3], prob: 0.5 }, { move: [2, 2], prob: 0.3 }, { move: null, prob: 0.1 }];
  it("finds the move and reports the best", () => {
    expect(policyStanding(top, [2, 2])).toEqual({ rank: 2, prob: 0.3, best: [3, 3], bestProb: 0.5 });
    expect(policyStanding(top, null).rank).toBe(3);
  });
  it("says so when the move was not on it, or there was no list", () => {
    expect(policyStanding(top, [8, 8]).rank).toBeNull();
    expect(policyStanding(top, [8, 8]).best).toEqual([3, 3]);
    expect(policyStanding(null, [1, 1])).toEqual({ rank: null, prob: null, best: null, bestProb: null });
  });
});
