import { describe, it, expect } from "vitest";
import { startLine, playInLine, backInLine, lineLabel, canBranch } from "./reviewLine.js";
import { createGame, play, pass, resign, idx, toSgf } from "../engine/index.js";

const game = () => {
  let g = createGame({ size: 9 });
  g = play(g, 4, 4); g = play(g, 2, 2); g = play(g, 6, 6);
  return g;
};

describe("startLine", () => {
  it("branches from the position at that move", () => {
    const line = startLine(game(), 1);
    expect(line.base).toBe(1);
    expect(line.moves).toEqual([]);
    expect(line.record.board.cells[idx(9, 4, 4)]).toBe("b");
    expect(line.record.board.cells[idx(9, 2, 2)]).toBeNull();
  });
  it("branches from the empty start too", () => {
    const line = startLine(game(), 0);
    expect(line.record.board.cells.every((c) => c === null)).toBe(true);
    expect(line.record.toPlay).toBe("b");
  });
});

describe("playInLine", () => {
  it("plays on from the branch point", () => {
    const { line } = playInLine(startLine(game(), 1), 0, 0);
    expect(line.record.board.cells[idx(9, 0, 0)]).toBe("w");
    expect(line.moves).toHaveLength(1);
    expect(line.moves[0]).toMatchObject({ c: 0, r: 0, color: "w" });
  });
  it("keeps playing, alternating colours", () => {
    let line = startLine(game(), 1);
    line = playInLine(line, 0, 0).line;
    line = playInLine(line, 1, 1).line;
    expect(line.moves.map((m) => m.color)).toEqual(["w", "b"]);
  });
  it("refuses an illegal move with the engine's own reason, and does not throw", () => {
    const line = startLine(game(), 1);
    const res = playInLine(line, 4, 4); // already occupied at move 1
    expect(res.error).toBe("occupied");
    expect(res.line).toBeUndefined();
  });
  it("refuses a suicide the same way", () => {
    // White alone in the corner surrounded by black: black to play there is fine,
    // but white playing into a filled eye is suicide.
    let g = createGame({ size: 9, setup: { b: [[0, 1], [1, 0], [1, 1]] } });
    g = play(g, 5, 5); // black
    const line = startLine(g, 1);
    expect(playInLine(line, 0, 0).error).toBe("suicide");
  });
});

describe("backInLine", () => {
  const rec = game();
  it("takes back the last move of the line", () => {
    let line = startLine(rec, 1);
    line = playInLine(line, 0, 0).line;
    line = playInLine(line, 1, 1).line;
    const back = backInLine(rec, line);
    expect(back.moves).toHaveLength(1);
    expect(back.record.board.cells[idx(9, 1, 1)]).toBeNull();
    expect(back.record.board.cells[idx(9, 0, 0)]).toBe("w");
  });
  it("returns null at the branch point, meaning the line is over", () => {
    expect(backInLine(rec, startLine(rec, 1))).toBeNull();
  });
  it("rebuilds from the record, so the branch point is never corrupted", () => {
    let line = startLine(rec, 2);
    line = playInLine(line, 0, 0).line;
    const back = backInLine(rec, line);
    // Move 2's position, intact: both real stones, nothing from the line.
    expect(back.record.board.cells[idx(9, 4, 4)]).toBe("b");
    expect(back.record.board.cells[idx(9, 2, 2)]).toBe("w");
    expect(back.record.board.cells[idx(9, 0, 0)]).toBeNull();
  });
});

describe("a line never touches the game", () => {
  it("leaves the record it branched from untouched", () => {
    const rec = game();
    const before = toSgf(rec);
    let line = startLine(rec, 1);
    line = playInLine(line, 0, 0).line;
    line = playInLine(line, 1, 1).line;
    expect(toSgf(rec)).toBe(before);
    expect(rec.moves).toHaveLength(3);
  });
});

describe("lineLabel", () => {
  it("says where the line left the game and how far it has gone", () => {
    const rec = game();
    expect(lineLabel(startLine(rec, 2))).toBe("Trying a line from move 2");
    expect(lineLabel(startLine(rec, 0))).toBe("Trying a line from the start");
    let line = playInLine(startLine(rec, 2), 0, 0).line;
    expect(lineLabel(line)).toBe("Trying a line · 1 move from move 2");
    line = playInLine(line, 1, 1).line;
    expect(lineLabel(line)).toBe("Trying a line · 2 moves from move 2");
  });
});

describe("canBranch", () => {
  it("is true inside a game that was played", () => {
    expect(canBranch(game(), 1)).toBe(true);
    expect(canBranch(game(), 0)).toBe(true);
  });
  it("is false where nobody is to move", () => {
    let g = createGame({ size: 9 });
    g = play(g, 4, 4); g = pass(g); g = pass(g); // scoring
    expect(canBranch(g, 3)).toBe(false);
  });
  it("is false for a game with no moves at all", () => {
    expect(canBranch(createGame({ size: 9 }), 0)).toBe(false);
  });
  it("is true at a position inside a resigned game", () => {
    expect(canBranch(resign(game()), 2)).toBe(true);
  });
});
