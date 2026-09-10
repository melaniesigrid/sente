import { describe, it, expect } from "vitest";
import { createGame, play, pass } from "../record.js";
import { encodePosition, encodeMeta, encodeInputs, inverseRank, RANKS, PRO_YEARS } from "./features.js";

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

  it("writes the pro profile: inverse rank 1 both sides, rated, time control unknown", () => {
    const m = encodeMeta({ pro: true, year: 1846, boardArea: 361 });
    expect(m[0]).toBe(1);
    expect(m[1]).toBe(1);
    expect(m[6]).toBe(1);
    expect(m[7]).toBe(0);
    expect(m[40]).toBe(1);
    expect(m[41]).toBe(0);
    expect(m[74]).toBe(0);    // rated
    expect(m[75]).toBe(1);    // tc unknown
    expect(m[79]).toBe(0);    // not byo-yomi
    expect(m[83]).toBeCloseTo(-0.9, 5);
    expect(m[86]).toBe(0);
    expect(m[156]).toBe(1);   // GoGoD
    expect(m[153]).toBe(0);
  });

  it("dates the pro profile at June 1 of the year, before and after 1970", () => {
    const a = encodeMeta({ pro: true, year: 1969, boardArea: 361 });
    const b = encodeMeta({ pro: true, year: 1970, boardArea: 361 });
    // weekly sinusoid: 1969-06-01 is 214 days before 1970-01-01, 1970-06-01 is 151 after
    expect(a[87]).toBeCloseTo(Math.cos((-214 / 7) * 2 * Math.PI), 5);
    expect(b[88]).toBeCloseTo(Math.sin((151 / 7) * 2 * Math.PI), 5);
  });

  it("uses the modern (Go4Go) source from 2021 and refuses years outside the range", () => {
    expect(encodeMeta({ pro: true, year: 2017, boardArea: 361 })[156]).toBe(1);
    expect(encodeMeta({ pro: true, year: 2021, boardArea: 361 })[157]).toBe(1);
    expect(PRO_YEARS.max).toBe(2023);
    expect(() => encodeMeta({ pro: true, year: 1799, boardArea: 361 })).toThrow(RangeError);
    expect(() => encodeMeta({ pro: true, year: 2024, boardArea: 361 })).toThrow(RangeError);
    expect(() => encodeMeta({ pro: true, boardArea: 361 })).toThrow(RangeError);
  });

  it("pro wins over a rank the bot seam spread in", () => {
    const m = encodeMeta({ pro: true, year: 1846, rank: "5k", oppRank: "20k", boardArea: 361 });
    expect(m[7]).toBe(0);
    expect(m[41]).toBe(0);
  });

  it("encodeInputs bundles everything", () => {
    const enc = encodeInputs(createGame({ size: 13 }), { rank: "10k" });
    expect(enc.size).toBe(13);
    expect(enc.meta.length).toBe(192);
    expect(enc.global.length).toBe(19);
  });
});
