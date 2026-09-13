import { describe, it, expect } from "vitest";
import { BADGES, badgesFor, badgesShown, gamesPlayed, daysHere } from "./badges.js";
import { GLICKO } from "../engine/index.js";
import { ratingOfRank } from "./rank.js";

const NOW = new Date(2026, 8, 12).getTime();
const daysAgo = (n) => NOW - n * 24 * 60 * 60 * 1000;
const settled = GLICKO.provisionalRd - 10;

const player = (over = {}) => ({
  id: "p1", name: "Ann", rating: ratingOfRank("10k"), rd: settled,
  wins: 0, losses: 0, draws: 0, createdAt: daysAgo(1),
  ...over,
});
const ids = (list) => list.map((b) => b.id);

describe("the set itself", () => {
  it("gives every badge an id, a label and a line saying what it measures", () => {
    for (const b of BADGES) {
      expect(b.id, JSON.stringify(b)).toBeTruthy();
      expect(b.label, b.id).toBeTruthy();
      expect(b.hint, b.id).toBeTruthy();
      expect(typeof b.earned, b.id).toBe("function");
    }
  });

  it("has no two badges with the same id", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });

  /* The rule the file is written under, asserted rather than trusted. A badge
     whose line needs the word "for" is an award: somebody decided you deserved
     it. Every one of these has to be checkable by a stranger with the record
     in front of them. */
  it("describes what it measures, never what it is for", () => {
    for (const b of BADGES) {
      expect(b.hint, b.id).not.toMatch(/\bfor\b/i);
      expect(b.hint, b.id).not.toMatch(/award|granted|earned by being|thank|special|honou?r/i);
    }
  });

  it("has no badge that anybody could hand out", () => {
    /* Every badge must be a function of the record alone. If one ever reads a
       field nobody can recompute (a grant list, a flag an operator sets) this
       is where it should be caught: the same record gives the same answer. */
    const p = player({ wins: 40, losses: 40, draws: 0, createdAt: daysAgo(200) });
    expect(ids(badgesFor(p, NOW))).toEqual(ids(badgesFor({ ...p }, NOW)));
  });
});

describe("counting", () => {
  it("counts every finished game, whichever way it went", () => {
    expect(gamesPlayed(player({ wins: 3, losses: 2, draws: 1 }))).toBe(6);
  });

  it("treats missing fields as none rather than NaN", () => {
    expect(gamesPlayed({})).toBe(0);
    expect(gamesPlayed(null)).toBe(0);
  });

  it("counts whole days here, and none without a date", () => {
    expect(daysHere(player({ createdAt: daysAgo(90) }), NOW)).toBe(90);
    expect(daysHere({}, NOW)).toBe(0);
  });
});

describe("what a new handle has", () => {
  it("is nothing at all", () => {
    expect(badgesFor(player(), NOW)).toEqual([]);
  });

  it("is still nothing for a handle with a rating but no finished game", () => {
    expect(ids(badgesFor(player({ rd: settled }), NOW))).toEqual([]);
  });
});

describe("the games tiers", () => {
  const at = (n) => ids(badgesFor(player({ wins: n, rd: GLICKO.provisionalRd + 10 }), NOW));

  it("arrive at the counts they name", () => {
    expect(at(1)).toContain("first");
    expect(at(9)).not.toContain("ten");
    expect(at(10)).toContain("ten");
    expect(at(50)).toContain("fifty");
    expect(at(100)).toContain("hundred");
    expect(at(500)).toContain("fivehundred");
  });

  /* A player with a hundred games should not wear five badges that all say the
     same thing. */
  it("show only the highest reached", () => {
    const shown = ids(badgesShown(player({ wins: 120, rd: GLICKO.provisionalRd + 10 }), NOW));
    expect(shown).toContain("hundred");
    expect(shown).not.toContain("fifty");
    expect(shown).not.toContain("first");
  });

  it("show the only one reached when there is only one", () => {
    expect(ids(badgesShown(player({ wins: 3, rd: GLICKO.provisionalRd + 10 }), NOW))).toEqual(["first"]);
  });
});

describe("settled rank", () => {
  it("arrives when the deviation has come down, and not before", () => {
    expect(ids(badgesFor(player({ wins: 20, rd: GLICKO.provisionalRd + 1 }), NOW))).not.toContain("settled");
    expect(ids(badgesFor(player({ wins: 20, rd: settled }), NOW))).toContain("settled");
  });

  it("needs a finished game, so a fresh handle with a tight deviation has none", () => {
    expect(ids(badgesFor(player({ wins: 0, rd: settled }), NOW))).not.toContain("settled");
  });

  it("goes away again if the deviation reopens, because it is measured and not given", () => {
    const strong = player({ wins: 20, rd: settled });
    expect(ids(badgesFor(strong, NOW))).toContain("settled");
    expect(ids(badgesFor({ ...strong, rd: GLICKO.provisionalRd + 50 }, NOW))).not.toContain("settled");
  });
});

describe("dan", () => {
  it("arrives at a settled dan rating", () => {
    const d = player({ wins: 40, rd: settled, rating: ratingOfRank("1d") });
    expect(ids(badgesFor(d, NOW))).toContain("dan");
  });

  it("does not arrive on a guess, however high the rating", () => {
    const guess = player({ wins: 2, rd: GLICKO.provisionalRd + 100, rating: ratingOfRank("5d") });
    expect(ids(badgesFor(guess, NOW))).not.toContain("dan");
  });

  it("is absent for a kyu player", () => {
    expect(ids(badgesFor(player({ wins: 40, rd: settled, rating: ratingOfRank("3k") }), NOW)))
      .not.toContain("dan");
  });
});

describe("how long they have been here", () => {
  it("arrives at ninety days and again at a year", () => {
    expect(ids(badgesFor(player({ createdAt: daysAgo(89) }), NOW))).not.toContain("season");
    expect(ids(badgesFor(player({ createdAt: daysAgo(90) }), NOW))).toContain("season");
    expect(ids(badgesFor(player({ createdAt: daysAgo(365) }), NOW))).toContain("year");
  });

  it("shows only the longer of the two", () => {
    const shown = ids(badgesShown(player({ createdAt: daysAgo(400) }), NOW));
    expect(shown).toContain("year");
    expect(shown).not.toContain("season");
  });

  it("needs no games at all: it measures time, not play", () => {
    expect(ids(badgesFor(player({ wins: 0, createdAt: daysAgo(400) }), NOW))).toContain("year");
  });
});

describe("robustness", () => {
  it("is empty for no player", () => {
    expect(badgesFor(null, NOW)).toEqual([]);
    expect(badgesShown(null, NOW)).toEqual([]);
  });

  it("survives a record missing everything", () => {
    expect(() => badgesFor({}, NOW)).not.toThrow();
    expect(badgesFor({}, NOW).length).toBe(0);
  });

  it("never throws out of a single badge, whatever the record holds", () => {
    for (const bad of [{ rating: "x" }, { rd: null }, { createdAt: "yesterday" }, { wins: NaN }]) {
      expect(() => badgesFor(bad, NOW), JSON.stringify(bad)).not.toThrow();
    }
  });
});
