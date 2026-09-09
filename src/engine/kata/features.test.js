import { describe, it, expect } from "vitest";
import { createGame, play, pass } from "../record.js";
import { encodePosition, encodeMeta, encodeInputs, inverseRank, RANKS } from "./features.js";

const plane = (enc, f) => {
  const N = enc.size, NN = N * N;
  return Array.from({ length: N }, (_, y) =>
    Array.from({ length: N }, (_, x) => (enc.bin[f * NN + y * N + x] ? "1" : "0")).join(""));
};

describe("encodePosition", () => {
  it("fills the on-board plane and komi on an empty board", () => {
    const enc = encodePosition(createGame({ size: 9 }));
    expect(enc.bin.length).toBe(22 * 81);
    expect(plane(enc, 0).every((row) => row === "111111111")).toBe(true);
    expect(enc.global[5]).toBeCloseTo(-7.5 / 20);   // black to move: komi counts against
    expect(enc.global[6]).toBe(1);
    expect(enc.global[7]).toBe(0.5);
    expect(enc.global[14]).toBe(0);
  });

  it("shows stones from the side to move and the last move", () => {
    let rec = createGame({ size: 9 });
    rec = play(rec, 4, 4);                // black
    const enc = encodePosition(rec);      // white to move: black is "opp"
    expect(plane(enc, 2)[4][4]).toBe("1");
    expect(plane(enc, 1)[4][4]).toBe("0");
    expect(plane(enc, 9)[4][4]).toBe("1");
    expect(enc.global[5]).toBeCloseTo(7.5 / 20);
  });

  it("records a pass in the global features and flags that a pass would end the game", () => {
    let rec = createGame({ size: 9 });
    rec = play(rec, 4, 4);
    rec = pass(rec);                      // white passes
    const enc = encodePosition(rec);      // black to move
    expect(enc.global[0]).toBe(1);        // opp's last move was a pass
    expect(plane(enc, 10)[4][4]).toBe("1"); // our move before that
    expect(enc.global[14]).toBe(1);
  });

  it("marks the ko point as banned", () => {
    let rec = createGame({ size: 9 });
    const seq = [[2, 0], [1, 0], [3, 1], [0, 1], [2, 2], [1, 2], [5, 5], [2, 1], [1, 1]];
    for (const [c, r] of seq) rec = play(rec, c, r);
    expect(rec.koPoint).toBe(1 * 9 + 2); // white may not retake at (2,1)
    const enc = encodePosition(rec);
    expect(plane(enc, 6)[1][2]).toBe("1");
  });
});

describe("encodeMeta", () => {
  it("orders ranks strongest first and maps them to KataGo's inverse rank", () => {
    expect(RANKS[0]).toBe("9d");
    expect(inverseRank("9d")).toBe(1);
    expect(inverseRank("1d")).toBe(9);
    expect(inverseRank("1k")).toBe(10);
    expect(inverseRank("20k")).toBe(29);
  });

  it("writes rank bits for both sides", () => {
    const m = encodeMeta({ rank: "5k", oppRank: "1d", boardArea: 81 });
    expect(m[0]).toBe(1);
    expect(m[1]).toBe(1);
    for (let i = 0; i < 14; i++) expect(m[6 + i]).toBe(1);
    expect(m[20]).toBe(0);
    for (let i = 0; i < 9; i++) expect(m[40 + i]).toBe(1);
    expect(m[49]).toBe(0);
    expect(m[74]).toBe(0.5);
    expect(m[79]).toBe(1);
    expect(m[153]).toBe(1);   // KGS source
  });

  it("encodeInputs bundles everything", () => {
    const enc = encodeInputs(createGame({ size: 13 }), { rank: "10k" });
    expect(enc.size).toBe(13);
    expect(enc.meta.length).toBe(192);
    expect(enc.global.length).toBe(19);
  });
});
