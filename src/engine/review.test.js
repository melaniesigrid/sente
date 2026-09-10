import { describe, it, expect } from "vitest";
import {
  atMove, moveNumbers, captureMoves, nextCapture, prevCapture,
  reviewLength, clampMove, markerAt, reviewLabel, playedMoves,
} from "./review.js";
import { createGame, play, pass, resign, timeout } from "./record.js";
import { idx } from "./board.js";

const seq = (rec, fns) => fns.reduce((r, f) => f(r), rec);
const P = (c, r) => (g) => play(g, c, r);

describe("reviewLength and clampMove", () => {
  it("counts positions, not log entries", () => {
    let g = createGame({ size: 9 });
    expect(reviewLength(g)).toBe(0);
    g = seq(g, [P(4, 4), P(2, 2)]);
    expect(reviewLength(g)).toBe(2);
  });
  it("ignores a resignation and a flag, which are not positions to stand at", () => {
    let g = seq(createGame({ size: 9 }), [P(4, 4)]);
    expect(reviewLength(resign(g))).toBe(1);
    expect(reviewLength(timeout(g, "w"))).toBe(1);
    expect(playedMoves(resign(g))).toHaveLength(1);
  });
  it("counts a pass as a position", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), (r) => pass(r)]);
    expect(reviewLength(g)).toBe(2);
  });
  it("clamps anything into range", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), P(2, 2)]);
    expect(clampMove(g, -5)).toBe(0);
    expect(clampMove(g, 99)).toBe(2);
    expect(clampMove(g, 1.7)).toBe(1);
    expect(clampMove(g, NaN)).toBe(0);
  });
});

describe("atMove", () => {
  it("gives the empty opening at zero", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), P(2, 2)]);
    const start = atMove(g, 0);
    expect(start.moves).toHaveLength(0);
    expect(start.board.cells.every((c) => c === null)).toBe(true);
  });
  it("keeps handicap stones at the opening position", () => {
    const g = seq(createGame({ size: 9, handicap: 4 }), [P(4, 4)]);
    const start = atMove(g, 0);
    expect(start.board.cells.filter((c) => c === "b")).toHaveLength(4);
    expect(start.toPlay).toBe("w");
  });
  it("walks to any position in between", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), P(2, 2), P(6, 6)]);
    expect(atMove(g, 1).board.cells[idx(9, 4, 4)]).toBe("b");
    expect(atMove(g, 1).board.cells[idx(9, 2, 2)]).toBeNull();
    expect(atMove(g, 2).board.cells[idx(9, 2, 2)]).toBe("w");
    expect(atMove(g, 3).moves).toHaveLength(3);
  });
  it("restores stones that were captured later", () => {
    // Black takes a white stone at (0,0) on move 3.
    let g = createGame({ size: 9, setup: { w: [[0, 0]] } });
    g = seq(g, [P(0, 1), (r) => pass(r), P(1, 0)]);
    expect(g.board.cells[0]).toBeNull();
    expect(atMove(g, 2).board.cells[0]).toBe("w");
  });
  it("stands at the last position of a resigned game", () => {
    const g = resign(seq(createGame({ size: 9 }), [P(4, 4), P(2, 2)]));
    expect(atMove(g, reviewLength(g)).board.cells[idx(9, 2, 2)]).toBe("w");
  });
});

describe("moveNumbers", () => {
  it("numbers the stones on the board", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), P(2, 2), P(6, 6)]);
    const n = moveNumbers(g, 3);
    expect(n.get(idx(9, 4, 4))).toBe(1);
    expect(n.get(idx(9, 2, 2))).toBe(2);
    expect(n.get(idx(9, 6, 6))).toBe(3);
  });
  it("stops at the position asked for", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), P(2, 2), P(6, 6)]);
    expect(moveNumbers(g, 2).has(idx(9, 6, 6))).toBe(false);
    expect(moveNumbers(g, 0).size).toBe(0);
  });
  it("gives a captured stone no number, because it is not there to carry one", () => {
    let g = createGame({ size: 9, setup: { w: [[0, 0]] } });
    g = seq(g, [P(0, 1), (r) => pass(r), P(1, 0)]);
    const n = moveNumbers(g, 3);
    expect(n.has(0)).toBe(false);
    expect(n.get(idx(9, 0, 1))).toBe(1);
  });
  it("gives a pass no point on the board", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), (r) => pass(r)]);
    expect(moveNumbers(g, 2).size).toBe(1);
  });
  it("numbers a re-used point with the stone standing there now", () => {
    // (0,0) is played by white, captured, and later played again by black.
    let g = createGame({ size: 9, setup: { w: [[0, 0]] } });
    g = seq(g, [P(0, 1), (r) => pass(r), P(1, 0)]);   // move 3 captures (0,0)
    g = seq(g, [(r) => pass(r), P(0, 0)]);            // move 5 black plays there
    const n = moveNumbers(g, 5);
    expect(n.get(0)).toBe(5);
  });
});

describe("captureMoves", () => {
  it("finds the move that took stones, and how many", () => {
    let g = createGame({ size: 9, setup: { w: [[0, 0]] } });
    g = seq(g, [P(0, 1), (r) => pass(r), P(1, 0)]);
    expect(captureMoves(g)).toEqual([{ move: 3, stones: 1, by: "b" }]);
  });
  it("is empty in a game where nothing was taken", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), P(2, 2)]);
    expect(captureMoves(g)).toEqual([]);
  });
  it("scrubs forward and back between captures", () => {
    const caps = [{ move: 3, stones: 1, by: "b" }, { move: 9, stones: 2, by: "w" }];
    expect(nextCapture(caps, 0).move).toBe(3);
    expect(nextCapture(caps, 3).move).toBe(9);
    expect(nextCapture(caps, 9)).toBeNull();
    expect(prevCapture(caps, 10).move).toBe(9);
    expect(prevCapture(caps, 9).move).toBe(3);
    expect(prevCapture(caps, 3)).toBeNull();
    expect(prevCapture([], 5)).toBeNull();
  });
});

describe("markerAt and reviewLabel", () => {
  it("marks the stone just played, and nothing at the start", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), P(2, 2)]);
    expect(markerAt(g, 0)).toBeNull();
    expect(markerAt(g, 1)).toBe(idx(9, 4, 4));
    expect(markerAt(g, 2)).toBe(idx(9, 2, 2));
  });
  it("names the position, and says when it is a pass", () => {
    const g = seq(createGame({ size: 9 }), [P(4, 4), (r) => pass(r)]);
    expect(reviewLabel(g, 0)).toBe("Start");
    expect(reviewLabel(g, 1)).toBe("Move 1 · Black");
    expect(reviewLabel(g, 2)).toBe("Move 2 · White passes");
  });
});
