import { describe, it, expect } from "vitest";
import { createGame, play, pass } from "../record.js";
import { choosePolicyMove, keepSet } from "./policy.js";

const logitsFor = (N, entries, base = -10) => {
  const l = new Float32Array(N * N + 1).fill(base);
  for (const [i, v] of entries) l[i] = v;
  return l;
};

describe("choosePolicyMove", () => {
  it("picks the top legal move at temperature 0", () => {
    const rec = createGame({ size: 9 });
    const logits = logitsFor(9, [[4 * 9 + 4, 5], [2 * 9 + 2, 3]]);
    const { move, top } = choosePolicyMove(logits, rec, { temperature: 0 });
    expect(move).toEqual([4, 4]);
    expect(top[0].move).toEqual([4, 4]);
  });

  it("never chooses an occupied or ko-banned point", () => {
    let rec = createGame({ size: 9 });
    const seq = [[2, 0], [1, 0], [3, 1], [0, 1], [2, 2], [1, 2], [5, 5], [2, 1], [1, 1]];
    for (const [c, r] of seq) rec = play(rec, c, r);           // white to move, ko at (2,1)
    const logits = logitsFor(9, [[1 * 9 + 2, 9], [1 * 9 + 1, 8], [7 * 9 + 7, 1]]);
    for (let i = 0; i < 20; i++) {
      const { move } = choosePolicyMove(logits, rec, { temperature: 1, rng: () => i / 20 });
      expect(move).toEqual([7, 7]);
    }
  });

  it("does not pass early even when the network likes it", () => {
    let rec = createGame({ size: 9 });
    rec = play(rec, 4, 4);
    const logits = logitsFor(9, [[81, 9], [3 * 9 + 3, 2]]);
    const { move } = choosePolicyMove(logits, rec, { temperature: 0 });
    expect(move).toEqual([3, 3]);
  });

  it("answers a pass with a pass when the network prefers it", () => {
    let rec = createGame({ size: 9 });
    rec = play(rec, 4, 4);
    rec = pass(rec);
    const logits = logitsFor(9, [[81, 9], [3 * 9 + 3, 2]]);
    const { move } = choosePolicyMove(logits, rec, { temperature: 0 });
    expect(move).toBeNull();
  });

  it("samples proportionally at temperature 1 and ignores the tail", () => {
    const rec = createGame({ size: 9 });
    const logits = logitsFor(9, [[0, Math.log(0.6)], [1, Math.log(0.4)], [2, Math.log(0.001)]], -30);
    const counts = { 0: 0, 1: 0, 2: 0 };
    for (let i = 0; i < 100; i++) {
      const { move } = choosePolicyMove(logits, rec, { temperature: 1, rng: () => (i + 0.5) / 100 });
      counts[move[1] * 9 + move[0]]++;
    }
    expect(counts[0]).toBe(60);
    expect(counts[1]).toBe(40);
    expect(counts[2]).toBe(0);
  });
});

describe("keepSet and bias", () => {
  it("keeps the candidates within the floor of the best legal move", () => {
    const rec = createGame({ size: 9 });
    const logits = logitsFor(9, [[4 * 9 + 4, 5], [2 * 9 + 2, 4], [0, -2]]);
    const { cands, keep, full, pmax } = keepSet(logits, rec, 0.02);
    expect(cands.length).toBe(81);                    // no pass on move 1
    const kept = keep.map((k) => cands[k]);
    expect(kept).toEqual([2 * 9 + 2, 4 * 9 + 4]);
    expect(full[cands.indexOf(4 * 9 + 4)]).toBe(pmax);
  });

  it("a bias reorders the shortlist and never lifts a move from below the floor", () => {
    const rec = createGame({ size: 9 });
    const logits = logitsFor(9, [[4 * 9 + 4, 5], [2 * 9 + 2, 4], [6 * 9 + 6, -3]]);
    const bias = (i) => (i === 2 * 9 + 2 ? 3 : i === 6 * 9 + 6 ? 50 : 0);
    const { move, top, prob } = choosePolicyMove(logits, rec, { temperature: 0, bias });
    expect(move).toEqual([2, 2]);                     // leaned above the network's favourite
    expect(top.map((t) => t.move.join(","))).not.toContain("6,6");   // below the floor stays out
    expect(top[0].prob).toBeCloseTo(prob, 9);
    expect(top.reduce((s, t) => s + t.prob, 0)).toBeCloseTo(1, 9);   // reports the leaned distribution
  });

  it("without a bias the reported probabilities are the network's", () => {
    const rec = createGame({ size: 9 });
    const logits = logitsFor(9, [[4 * 9 + 4, 5], [2 * 9 + 2, 4]]);
    const { top } = choosePolicyMove(logits, rec, { temperature: 0 });
    expect(top[0].prob).toBeCloseTo(Math.exp(5) / (Math.exp(5) + Math.exp(4)), 4);
  });
});
