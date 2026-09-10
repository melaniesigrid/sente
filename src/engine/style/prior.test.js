import { describe, it, expect } from "vitest";
import { createGame, play } from "../record.js";
import { MOVE_AXES } from "./features.js";
import { stylePrior, styleLean, DEFAULT_CLAMP } from "./prior.js";

const N = 19;
const at = (c, r) => r * N + c;

/** A style where the master plays more contact and lower than the network. */
const style = () => {
  const zero = Object.fromEntries(MOVE_AXES.map((a) => [a, 0]));
  const one = Object.fromEntries(MOVE_AXES.map((a) => [a, 1]));
  return {
    moveAxes: MOVE_AXES,
    baseline: { ...zero, line3: 0.3, line4: 0.3, contact: 0.4, thickness: 3, tenuki: 0.3, quadrant: 0.3 },
    masterMoves: { ...zero, line3: 0.5, line4: 0.1, contact: 0.7, thickness: 3, tenuki: 0.3, quadrant: 0.3 },
    moveSpread: { ...one, line3: 0.2, line4: 0.2, contact: 0.1, thickness: 2, tenuki: 0.1, quadrant: 0.1 },
  };
};

describe("styleLean", () => {
  it("is the clamped z-difference per axis, zero where they agree", () => {
    const lean = styleLean(style());
    expect(lean.line3).toBeCloseTo(1, 9);
    expect(lean.line4).toBeCloseTo(-1, 9);
    expect(lean.contact).toBe(DEFAULT_CLAMP);          // (0.7-0.4)/0.1 = 3, clamped to 2
    expect(lean.thickness).toBe(0);
  });

  it("is null without a baseline", () => {
    expect(styleLean({ moveAxes: MOVE_AXES, masterMoves: {} })).toBeNull();
  });
});

describe("stylePrior", () => {
  it("favours the master's side of each axis and ignores the pass", () => {
    let rec = play(createGame({ size: N }), 15, 3);        // white to move, black at 4-4
    const prior = stylePrior(style(), rec, { lambda: 1 });
    expect(prior(N * N)).toBe(0);
    const contact = prior(at(15, 4));                       // touches the black stone, line 4
    const third = prior(at(2, 16));                         // far away, line 3
    const fourth = prior(at(3, 15));                        // far away, line 4
    expect(contact).toBeGreaterThan(fourth);                // contact lean wins
    expect(third).toBeGreaterThan(fourth);                  // line 3 over line 4
  });

  it("scales with λ and is null when λ is 0 or the baseline is missing", () => {
    const rec = play(createGame({ size: N }), 15, 3);
    const p1 = stylePrior(style(), rec, { lambda: 1 });
    const p2 = stylePrior(style(), rec, { lambda: 2 });
    expect(p2(at(2, 16))).toBeCloseTo(2 * p1(at(2, 16)), 9);
    expect(stylePrior(style(), rec, { lambda: 0 })).toBeNull();
    expect(stylePrior({ moveAxes: MOVE_AXES }, rec)).toBeNull();
  });

  it("is zero everywhere when the master matches the network", () => {
    const s = style();
    s.masterMoves = { ...s.baseline };
    const rec = play(createGame({ size: N }), 15, 3);
    const prior = stylePrior(s, rec);
    for (const i of [at(2, 16), at(15, 4), at(9, 9)]) expect(prior(i)).toBe(0);
  });
});
