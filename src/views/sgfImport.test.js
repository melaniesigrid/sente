import { describe, it, expect } from "vitest";
import { readSgf, importSummary, SUPPORTED_SIZES } from "./sgfImport.js";
import { toSgf, createGame, play, pass, resign, MAX_SGF_BYTES } from "../engine/index.js";

const game = () => {
  let g = createGame({ size: 9, players: { b: "Melanie", w: "Hoshi (house bot)" } });
  g = play(g, 4, 4); g = play(g, 2, 2); g = play(g, 6, 6);
  return g;
};

describe("readSgf, the happy path", () => {
  it("opens a game Sente wrote", () => {
    const res = readSgf(toSgf(game()));
    expect(res.ok).toBe(true);
    expect(res.record.size).toBe(9);
    expect(res.record.moves).toHaveLength(3);
  });
  it("opens a resigned game and keeps its result", () => {
    const res = readSgf(toSgf(resign(game())));
    expect(res.ok).toBe(true);
    expect(res.record.result).toMatchObject({ method: "resign" });
  });
  it("keeps a handicap and its komi", () => {
    let g = createGame({ size: 19, handicap: 4 });
    g = play(g, 5, 5);
    const res = readSgf(toSgf(g));
    expect(res.ok).toBe(true);
    expect(res.record.handicap).toBe(4);
    expect(res.record.komi).toBe(0.5);
  });
});

describe("readSgf never throws, and names every refusal", () => {
  it("refuses an empty file", () => {
    for (const v of ["", "   ", null, undefined, 42]) {
      const res = readSgf(v, "game.sgf");
      expect(res.ok).toBe(false);
      expect(res.reason).toBe("empty");
    }
  });
  it("refuses a file over the byte cap without trying to parse it", () => {
    const res = readSgf("(".repeat(MAX_SGF_BYTES + 1), "huge.sgf");
    expect(res).toMatchObject({ ok: false, reason: "too-big" });
    expect(res.message).toContain("256 KB");
  });
  it("names the byte where the parse gave up", () => {
    const res = readSgf("(;FF[4]SZ[9]", "broken.sgf");
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("parse");
    expect(res.message).toMatch(/at byte \d+/);
  });
  it("refuses a board size the app cannot draw", () => {
    const res = readSgf("(;FF[4]SZ[7];B[dd])", "seven.sgf");
    expect(res).toMatchObject({ ok: false, reason: "size" });
    expect(res.message).toContain("7×7");
  });
  it("refuses a file with no moves in it", () => {
    const res = readSgf("(;FF[4]SZ[9])", "empty-game.sgf");
    expect(res).toMatchObject({ ok: false, reason: "no-moves" });
  });
  it("refuses a move the rules refuse rather than drawing an impossible board", () => {
    // Two black stones on the same point.
    const res = readSgf("(;FF[4]SZ[9];B[dd];W[ee];B[dd])", "cheat.sgf");
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("illegal");
    expect(res.message).toContain("cheat.sgf");
    expect(res.message).toContain("occupied");
  });
  it("puts the file's name in every message", () => {
    for (const bad of ["", "(;FF[4]SZ[7];B[dd])", "(;FF[4]SZ[9]"]) {
      expect(readSgf(bad, "mygame.sgf").message).toContain("mygame.sgf");
    }
  });
  it("says 'the file' when it was not given a name", () => {
    expect(readSgf("").message).toContain("the file");
  });
});

describe("importSummary", () => {
  it("names the players when the file does", () => {
    const s = importSummary(game());
    expect(s).toContain("Melanie vs Hoshi (house bot)");
    expect(s).toContain("9×9");
    expect(s).toContain("3 moves");
    expect(s).toContain("komi 5.5");   // what a 9x9 is owed
  });
  it("leaves the players out when the file has none", () => {
    let g = createGame({ size: 19 });
    g = play(g, 3, 3); g = pass(g);
    const s = importSummary(g);
    expect(s).not.toContain("vs");
    expect(s).toContain("2 moves");
  });
  it("says the handicap when there is one", () => {
    let g = createGame({ size: 19, handicap: 4 });
    g = play(g, 5, 5);
    expect(importSummary(g)).toContain("4 stones");
  });
});

describe("SUPPORTED_SIZES", () => {
  it("is the three boards the app draws", () => {
    expect(SUPPORTED_SIZES).toEqual([9, 13, 19]);
  });
});
