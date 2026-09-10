import { describe, it, expect } from "vitest";
import {
  RULESETS, RULESET_IDS, DEFAULT_RULES, rulesetOf, isRulesId, defaultKomi, handicapBonus,
} from "./rulesets.js";
import { SIZES } from "./board.js";
import { createGame, play, pass, acceptScore, markDead } from "./record.js";
import { scoreBoard } from "./score.js";
import { idx } from "./board.js";

describe("the rulesets", () => {
  it("are complete: every one names a count, a komi for every board, and a handicap answer", () => {
    for (const id of RULESET_IDS) {
      const set = RULESETS[id];
      expect(set.id).toBe(id);
      expect(["area", "territory"]).toContain(set.scoring);
      expect(["none", "n", "n-1"]).toContain(set.handicapComp);
      expect(typeof set.suicide).toBe("boolean");
      expect(set.name && set.tagline && set.blurb).toBeTruthy();
      for (const size of SIZES) expect(typeof set.komi[size]).toBe("number");
    }
  });
  it("agree with the published values for each set", () => {
    expect(RULESETS.japanese.scoring).toBe("territory");
    expect(RULESETS.japanese.komi[19]).toBe(6.5);
    expect(RULESETS.chinese.komi[19]).toBe(7.5);
    expect(RULESETS.aga.komi[19]).toBe(7.5);
    expect(RULESETS.nz.komi[19]).toBe(7);        // whole number: New Zealand allows a draw
    expect(RULESETS.nz.suicide).toBe(true);
    expect(RULESETS.japanese.suicide).toBe(false);
  });
  it("owe a smaller board a smaller komi under every set", () => {
    for (const id of RULESET_IDS) {
      expect(defaultKomi(0, 9, id)).toBeLessThanOrEqual(defaultKomi(0, 19, id));
      expect(defaultKomi(0, 13, id)).toBeLessThanOrEqual(defaultKomi(0, 19, id));
    }
  });
  it("drop komi to the tie-breaker once a handicap has settled the balance", () => {
    expect(defaultKomi(4, 19, "japanese")).toBe(0.5);
    expect(defaultKomi(4, 19, "aga")).toBe(0.5);
    expect(defaultKomi(4, 19, "nz")).toBe(0);    // whole-number komi, so a draw stays possible
  });
  it("pay for handicap stones the way each set says", () => {
    expect(handicapBonus(4, "aga")).toBe(3);        // n - 1
    expect(handicapBonus(4, "chinese")).toBe(4);    // n
    expect(handicapBonus(4, "nz")).toBe(0);
    expect(handicapBonus(4, "japanese")).toBe(0);   // a stone is not a point in a territory count
    expect(handicapBonus(0, "aga")).toBe(0);
  });
  it("fall back rather than throw on an id from a stored table or a file", () => {
    expect(rulesetOf("ing")).toBe(RULESETS[DEFAULT_RULES]);
    expect(rulesetOf(undefined)).toBe(RULESETS[DEFAULT_RULES]);
    expect(isRulesId("ing")).toBe(false);
    expect(isRulesId("japanese")).toBe(true);
    expect(defaultKomi(0, 19, "ing")).toBe(defaultKomi(0, 19, DEFAULT_RULES));
  });
  it("keep AGA as the default, which is what the app has always counted", () => {
    expect(DEFAULT_RULES).toBe("aga");
    expect(createGame({ size: 19 }).rules).toBe("aga");
    expect(createGame({ size: 19 }).komi).toBe(7.5);
    expect(createGame({ size: 19, rules: "nonsense" }).rules).toBe("aga");
  });
});

describe("counting the same board two ways", () => {
  /* A 9x9 split down the middle: Black owns columns 0-3, White 5-8, with a wall
     of each colour standing on columns 3 and 5. Nothing is dead; the only thing
     that changes between the counts is whether stones are worth anything. */
  const split = () => {
    let g = createGame({ size: 9, rules: "aga", komi: 0 });
    for (let r = 0; r < 9; r++) {
      g = play(g, 3, r, "b");
      g = play(g, 5, r, "w");
    }
    return g;
  };

  it("gives area scoring the stones and territory scoring only the ground", () => {
    const g = split();
    const area = scoreBoard(g.board, { rules: "aga", komi: 0, captures: g.captures });
    const terr = scoreBoard(g.board, { rules: "japanese", komi: 0, captures: g.captures });
    expect(area.scoring).toBe("area");
    expect(terr.scoring).toBe("territory");
    expect(area.totals.b).toBe(36);              // 9 stones + 27 points
    expect(terr.totals.b).toBe(27);              // the ground alone
    expect(area.totals.b - terr.totals.b).toBe(9);
    // An even split is a jigo under both when komi is zero.
    expect(area.winner).toBeNull();
    expect(terr.winner).toBeNull();
  });

  it("counts prisoners for territory scoring and ignores them for area", () => {
    const g = split();
    const withPrisoners = { b: 4, w: 1 };
    const terr = scoreBoard(g.board, { rules: "japanese", komi: 0, captures: withPrisoners });
    const area = scoreBoard(g.board, { rules: "aga", komi: 0, captures: withPrisoners });
    expect(terr.totals.b).toBe(27 + 4);
    expect(terr.totals.w).toBe(27 + 1);
    expect(area.totals.b).toBe(36);              // unchanged: an area count never asks
    expect(area.totals.w).toBe(36);
  });

  it("hands a dead stone over as a prisoner as well as its ground", () => {
    // The same split board, with one lone white stone sitting inside Black's
    // house. It is marked dead at the end: Black takes the stone and the point.
    const wall = { b: [], w: [] };
    for (let r = 0; r < 9; r++) { wall.b.push([3, r]); wall.w.push([5, r]); }
    wall.w.push([1, 1]);
    let g = createGame({ size: 9, rules: "japanese", komi: 0, setup: wall, toPlay: "b" });
    g = pass(pass(g, "b"), "w");
    g = markDead(g, 1, 1);      // markDead takes a point, not an index
    const done = acceptScore(g);
    const s = done.result.score;
    expect(s.black.prisoners).toBe(1);           // the stone itself
    expect(s.black.territory).toBe(27);          // and its point comes back to Black
    expect(s.totals.b).toBe(28);
    expect(s.white.prisoners).toBe(0);
  });

  it("pays the handicap the way the ruleset says, on the same position", () => {
    const g = split();
    const args = { komi: 0.5, handicap: 4, captures: g.captures };
    expect(scoreBoard(g.board, { ...args, rules: "aga" }).white.handicapBonus).toBe(3);
    expect(scoreBoard(g.board, { ...args, rules: "chinese" }).white.handicapBonus).toBe(4);
    expect(scoreBoard(g.board, { ...args, rules: "nz" }).white.handicapBonus).toBe(0);
    expect(scoreBoard(g.board, { ...args, rules: "japanese" }).white.handicapBonus).toBe(0);
  });
});

describe("suicide", () => {
  /* White has a stone at (1,0) with one liberty left, at (0,0). Playing it joins
     a chain of two with no liberties at all, and the pair is lifted. Under every
     ruleset but New Zealand the move is refused before it is made. */
  const corner = (rules) => createGame({
    size: 9, rules, komi: 0, toPlay: "w",
    setup: { b: [[0, 1], [1, 1], [2, 0]], w: [[1, 0]] },
  });

  it("is refused under Japanese, Chinese and AGA rules", () => {
    for (const rules of ["japanese", "chinese", "aga"]) {
      expect(() => play(corner(rules), 0, 0, "w")).toThrow(/suicide/);
    }
  });

  it("is legal under New Zealand rules, and the stones become prisoners", () => {
    const after = play(corner("nz"), 0, 0, "w");
    expect(after.board.cells[idx(9, 0, 0)]).toBeNull();   // lifted the moment it was placed
    expect(after.board.cells[idx(9, 1, 0)]).toBeNull();   // and it took its friend with it
    expect(after.captures.b).toBe(2);                     // Black holds them, not White
    expect(after.captures.w).toBe(0);
    expect(after.toPlay).toBe("b");
  });

  it("leaves Black's surrounding stones alone", () => {
    const after = play(corner("nz"), 0, 0, "w");
    for (const [c, r] of [[0, 1], [1, 1], [2, 0]]) {
      expect(after.board.cells[idx(9, c, r)]).toBe("b");
    }
  });

  /* Sente enforces positional superko under every ruleset, and a one-stone
     self-capture always hands back exactly the position that was there a moment
     ago. So the smallest suicide of all is refused even under New Zealand rules
     - as superko, which is what it is. This is the one place where Sente's
     choice of superko is visible in play, and it is stated rather than hidden. */
  it("refuses a one-stone self-capture as superko, even under New Zealand rules", () => {
    const g = createGame({
      size: 9, rules: "nz", komi: 0, toPlay: "w",
      setup: { b: [[1, 0], [0, 1]], w: [] },
    });
    expect(() => play(g, 0, 0, "w")).toThrow(/superko/);
  });
});
