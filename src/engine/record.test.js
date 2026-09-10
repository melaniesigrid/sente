import { describe, it, expect } from "vitest";
import {
  createGame, play, pass, resign, markDead, acceptScore, undo, replay, handicapPoints, KOMI, defaultKomi,
  lastMoveIndex, resultText, IllegalTransitionError, IllegalMoveError, GameError,
} from "./record.js";
import { idx } from "./board.js";

const seq = (rec, fn) => fn.reduce((r, f) => f(r), rec);

describe("createGame", () => {
  it("defaults to 19x19, komi 7.5, black first", () => {
    const g = createGame();
    expect(g.size).toBe(19);
    expect(g.komi).toBe(7.5);
    expect(g.toPlay).toBe("b");
    expect(g.phase).toBe("playing");
    expect(g.moves).toEqual([]);
    expect(g.hashes).toEqual([0]);
  });
  it("is JSON-serialisable and replayable", () => {
    const g = seq(createGame({ size: 9 }), [r => play(r, 2, 2), r => play(r, 6, 6), r => pass(r)]);
    const copy = JSON.parse(JSON.stringify(g));
    expect(replay(copy)).toEqual(g);
  });
  it("rejects a bad handicap", () => {
    expect(() => createGame({ handicap: 1 })).toThrow(RangeError);
    expect(() => createGame({ handicap: 10 })).toThrow(RangeError);
  });
});

describe("handicap", () => {
  it("places stones on the hoshi in the traditional order", () => {
    expect(handicapPoints(19, 2)).toEqual([[15, 3], [3, 15]]);
    expect(handicapPoints(19, 4)).toEqual([[15, 3], [3, 15], [15, 15], [3, 3]]);
    expect(handicapPoints(19, 5)[4]).toEqual([9, 9]);
    expect(handicapPoints(19, 9)).toHaveLength(9);
    expect(handicapPoints(13, 3)).toEqual([[9, 3], [3, 9], [9, 9]]);
    expect(handicapPoints(9, 2)).toEqual([[6, 2], [2, 6]]);
    expect(handicapPoints(9, 9)).toContainEqual([4, 4]);
  });
  it("rejects unsupported sizes and counts", () => {
    expect(() => handicapPoints(11, 2)).toThrow(RangeError);
    expect(() => handicapPoints(19, 1)).toThrow(RangeError);
    expect(() => handicapPoints(19, 10)).toThrow(RangeError);
  });
  it.each([9, 13, 19])("game with handicap on %ix%i: stones down, komi 0.5, white first", (size) => {
    const g = createGame({ size, handicap: 4 });
    expect(g.komi).toBe(0.5);
    expect(g.toPlay).toBe("w");
    expect(g.setup.b).toHaveLength(4);
    for (const [c, r] of g.setup.b) expect(g.board.cells[idx(size, c, r)]).toBe("b");
    expect(g.hashes[0]).not.toBe(0);
  });
  it("owes a smaller board a smaller komi", () => {
    // The first move is worth less on a small board, so 7.5 everywhere handed
    // White a quarter of a 9x9 for nothing.
    expect(createGame({ size: 9 }).komi).toBe(5.5);
    expect(createGame({ size: 13 }).komi).toBe(6.5);
    expect(createGame({ size: 19 }).komi).toBe(7.5);
    expect(defaultKomi(0, 9)).toBe(5.5);
    expect(defaultKomi(0)).toBe(7.5);          // 19x19 unless told otherwise
    expect(defaultKomi(2, 9)).toBe(0.5);       // a handicap settles it in stones instead
    for (const [size, komi] of Object.entries(KOMI)) expect(defaultKomi(0, Number(size))).toBe(komi);
  });
  it("respects an explicit komi with handicap", () => {
    expect(createGame({ size: 9, handicap: 2, komi: 3.5 }).komi).toBe(3.5);
  });
  it("uses explicit setup stones instead of fixed points when given", () => {
    const g = createGame({ size: 9, setup: { b: [[0, 0]], w: [[8, 8]] }, toPlay: "w" });
    expect(g.board.cells[0]).toBe("b");
    expect(g.board.cells[80]).toBe("w");
    expect(g.toPlay).toBe("w");
  });
});

describe("playing", () => {
  it("play alternates colours, records the move and the hash", () => {
    let g = createGame({ size: 9 });
    g = play(g, 4, 4);
    expect(g.toPlay).toBe("w");
    expect(g.moves).toEqual([{ type: "play", color: "b", c: 4, r: 4 }]);
    expect(g.board.cells[idx(9, 4, 4)]).toBe("b");
    expect(g.hashes).toHaveLength(2);
    expect(lastMoveIndex(g)).toBe(idx(9, 4, 4));
  });
  it("captures update the count and clear passes", () => {
    let g = createGame({ size: 9, setup: { b: [[0, 1]], w: [[0, 0]] } });
    g = play(g, 1, 0); // black captures (0,0)
    expect(g.captures.b).toBe(1);
    expect(g.board.cells[0]).toBeNull();
    expect(g.lastCaptured).toEqual([[0, 0]]);
  });
  it("throws IllegalMoveError with the rules reason", () => {
    let g = createGame({ size: 9 });
    g = play(g, 4, 4);
    expect(() => play(g, 4, 4)).toThrow(IllegalMoveError);
    try { play(g, 4, 4); } catch (e) {
      expect(e.reason).toBe("occupied");
      expect(e).toBeInstanceOf(GameError);
      expect(e.name).toBe("IllegalMoveError");
    }
    expect(() => play(g, 9, 9)).toThrow(/offboard/);
  });
  it("refuses the wrong colour", () => {
    const g = createGame({ size: 9 });
    expect(() => play(g, 0, 0, "w")).toThrow(IllegalMoveError);
    expect(() => pass(g, "w")).toThrow(/wrong-turn/);
  });
  it("enforces simple ko through the record", () => {
    let g = createGame({ size: 9, setup: { b: [[1, 0], [0, 1], [1, 2], [2, 1]], w: [[2, 0], [3, 1], [2, 2]] } });
    // Black to play; white takes the ko at (1,1) after a black tenuki.
    g = play(g, 8, 8);
    g = play(g, 1, 1); // white captures (2,1)
    expect(g.captures.w).toBe(1);
    expect(g.koPoint).toBe(idx(9, 2, 1));
    expect(() => play(g, 2, 1)).toThrow(/ko/);
    g = play(g, 8, 7); g = play(g, 7, 8);
    expect(play(g, 2, 1).captures.b).toBe(1);
  });
  it("enforces positional superko through the hash history", () => {
    //   . X . O      sending two, returning one (see rules.test.js)
    //   X O O O
    //   X X X X
    let g = createGame({
      size: 9,
      setup: { b: [[1, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2]], w: [[3, 0], [1, 1], [2, 1], [3, 1]] },
    });
    g = play(g, 2, 0);            // black sends two
    g = play(g, 0, 0);            // white captures two
    expect(g.captures.w).toBe(2);
    expect(() => play(g, 1, 0)).toThrow(/superko/);
  });
});

describe("passing and scoring", () => {
  it("one pass stays in playing, two consecutive passes enter scoring", () => {
    let g = createGame({ size: 9 });
    g = pass(g);
    expect(g.phase).toBe("playing");
    expect(g.passes).toBe(1);
    g = play(g, 4, 4);
    expect(g.passes).toBe(0);
    g = pass(g); g = pass(g);
    expect(g.phase).toBe("scoring");
    expect(g.moves.map(m => m.type)).toEqual(["pass", "play", "pass", "pass"]);
  });
  it("markDead toggles a whole chain and acceptScore ends the game", () => {
    let g = createGame({ size: 9, komi: 5.5, setup: { b: [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8]], w: [[0, 0], [0, 1]] } });
    g = pass(g); g = pass(g);
    g = markDead(g, 0, 0);
    expect(g.dead).toEqual([idx(9, 0, 0), idx(9, 0, 1)]);
    g = markDead(g, 0, 1);
    expect(g.dead).toEqual([]);
    g = markDead(g, 0, 1);
    const done = acceptScore(g);
    expect(done.phase).toBe("ended");
    expect(done.result.method).toBe("score");
    expect(done.result.winner).toBe("b");
    expect(done.result.margin).toBe(81 - 5.5);
    expect(done.result.score.territory[idx(9, 0, 0)]).toBe("b");
    expect(resultText(done)).toBe("Black wins by 75.5");
  });
  it("scores with komi and handicap compensation", () => {
    let g = createGame({ size: 9, handicap: 2 });
    g = pass(g); g = pass(g);
    const done = acceptScore(g);
    // Two black stones on an otherwise empty board: black owns everything.
    expect(done.result.score.totals).toEqual({ b: 81, w: 0.5 + 1 });
  });
  it("markDead rejects empty points and offboard points", () => {
    let g = createGame({ size: 9 });
    g = pass(g); g = pass(g);
    expect(() => markDead(g, 4, 4)).toThrow(/empty/);
    expect(() => markDead(g, 9, 0)).toThrow(/offboard/);
  });
});

describe("resign", () => {
  it("ends the game from playing with the opponent as winner", () => {
    const g = resign(createGame({ size: 9 }));
    expect(g.phase).toBe("ended");
    expect(g.result).toEqual({ winner: "w", method: "resign", margin: null, score: null });
    expect(resultText(g)).toBe("White wins by resignation");
  });
  it("either side may resign during scoring", () => {
    let g = createGame({ size: 9 });
    g = pass(g); g = pass(g);
    expect(resign(g, "w").result.winner).toBe("b");
    expect(resign(g, "b").result.winner).toBe("w");
  });
});

describe("undo", () => {
  it("takes back a play", () => {
    let g = createGame({ size: 9 });
    g = play(g, 4, 4); g = play(g, 2, 2);
    const back = undo(g);
    expect(back.moves).toHaveLength(1);
    expect(back.toPlay).toBe("w");
    expect(back.board.cells[idx(9, 2, 2)]).toBeNull();
    expect(back.hashes).toHaveLength(2);
  });
  it("restores captured stones and counts", () => {
    let g = createGame({ size: 9, setup: { b: [[0, 1]], w: [[0, 0]] } });
    g = play(g, 1, 0);
    expect(g.captures.b).toBe(1);
    const back = undo(g);
    expect(back.captures.b).toBe(0);
    expect(back.board.cells[0]).toBe("w");
  });
  it("from scoring returns to playing and clears dead marks", () => {
    let g = createGame({ size: 9, setup: { w: [[0, 0]] } });
    g = play(g, 4, 4); g = pass(g); g = pass(g);
    g = markDead(g, 0, 0);
    const back = undo(g);
    expect(back.phase).toBe("playing");
    expect(back.dead).toEqual([]);
    expect(back.passes).toBe(1);
    expect(back.toPlay).toBe("b");
  });
  it("refuses with nothing to undo", () => {
    expect(() => undo(createGame({ size: 9 }))).toThrow(/nothing-to-undo/);
  });
});

describe("illegal transitions", () => {
  const scoring = () => { let g = createGame({ size: 9, setup: { b: [[0, 0]] } }); g = pass(g); return pass(g); };
  const ended = () => acceptScore(scoring());
  const resigned = () => resign(createGame({ size: 9 }));

  it("playing forbids markDead and acceptScore", () => {
    const g = createGame({ size: 9 });
    expect(() => markDead(g, 0, 0)).toThrow(IllegalTransitionError);
    expect(() => acceptScore(g)).toThrow(IllegalTransitionError);
  });
  it("scoring forbids play and pass", () => {
    const g = scoring();
    expect(() => play(g, 4, 4)).toThrow(IllegalTransitionError);
    expect(() => pass(g)).toThrow(IllegalTransitionError);
  });
  it("ended forbids everything but reading", () => {
    for (const g of [ended(), resigned()]) {
      expect(() => play(g, 4, 4)).toThrow(IllegalTransitionError);
      expect(() => pass(g)).toThrow(IllegalTransitionError);
      expect(() => resign(g)).toThrow(IllegalTransitionError);
      expect(() => markDead(g, 0, 0)).toThrow(IllegalTransitionError);
      expect(() => acceptScore(g)).toThrow(IllegalTransitionError);
      expect(() => undo(g)).toThrow(IllegalTransitionError);
    }
  });
  it("names the action and phase on the error", () => {
    try { play(ended(), 1, 1); } catch (e) {
      expect(e).toBeInstanceOf(GameError);
      expect(e.name).toBe("IllegalTransitionError");
      expect(e.action).toBe("play");
      expect(e.phase).toBe("ended");
      expect(e.message).toBe("cannot play while ended");
    }
  });
  it("replay rejects a tampered log", () => {
    let g = createGame({ size: 9 });
    g = play(g, 4, 4);
    const bad = { ...g, moves: [...g.moves, { type: "play", color: "w", c: 4, r: 4 }] };
    expect(() => replay(bad)).toThrow(/occupied/);
    const unknown = { ...g, moves: [{ type: "teleport" }] };
    expect(() => replay(unknown)).toThrow(/unknown-move/);
  });
  it("does not mutate the input record", () => {
    const g = createGame({ size: 9 });
    const frozen = JSON.stringify(g);
    play(g, 3, 3); pass(g);
    expect(JSON.stringify(g)).toBe(frozen);
  });
});
