import { describe, it, expect } from "vitest";
import { RUN, gamesAt, currentRun, suggestLevel, suggestionText } from "./level.js";
import { RANK_LADDER } from "./rank.js";

/** A log entry, in the shape store/telemetry.js keeps. Oldest first, as the
 *  ring buffer stores them. */
const g = (over = {}) => ({
  at: "2026-09-11", size: 19, handicap: 0, bot: "ren", botRank: "10k",
  kind: "rated", result: "B+3.5", won: true, moves: 120, ...over,
});
const wins = (n, over = {}) => Array.from({ length: n }, () => g({ won: true, ...over }));
const losses = (n, over = {}) => Array.from({ length: n }, () => g({ won: false, ...over }));

describe("what counts as evidence", () => {
  it("counts rated, even games at the level asked about", () => {
    expect(gamesAt(wins(2), "10k").length).toBe(2);
  });

  it("ignores a game at another level", () => {
    expect(gamesAt(wins(3, { botRank: "5k" }), "10k")).toEqual([]);
  });

  it("ignores a handicap game, because the handicap is the thing being measured", () => {
    expect(gamesAt(wins(3, { handicap: 4 }), "10k")).toEqual([]);
  });

  it("ignores coached games, duels and master studies", () => {
    for (const kind of ["coached", "duel", "master"]) {
      expect(gamesAt(wins(3, { kind }), "10k"), kind).toEqual([]);
    }
  });

  it("ignores a game nobody won", () => {
    expect(gamesAt([g({ won: null })], "10k")).toEqual([]);
  });

  it("survives an empty or missing log", () => {
    expect(gamesAt([], "10k")).toEqual([]);
    expect(gamesAt(undefined, "10k")).toEqual([]);
    expect(currentRun([], "10k")).toBeNull();
  });
});

describe("the run", () => {
  it("counts the most recent games, not the oldest", () => {
    // Won long ago, losing now: the run is the losing one.
    expect(currentRun([...wins(5), ...losses(2)], "10k")).toEqual({ won: false, length: 2 });
  });

  it("is broken outright by one game the other way", () => {
    expect(currentRun([...wins(9), ...losses(1)], "10k")).toEqual({ won: false, length: 1 });
  });

  it("counts every game when they all agree", () => {
    expect(currentRun(wins(4), "10k")).toEqual({ won: true, length: 4 });
  });

  it("is not confused by games at another level sitting between", () => {
    const log = [...wins(1), ...losses(3, { botRank: "5k" }), ...wins(2)];
    expect(currentRun(log, "10k")).toEqual({ won: true, length: 3 });
  });
});

describe("the suggestion", () => {
  it("says nothing below the threshold", () => {
    for (let n = 0; n < RUN; n++) expect(suggestLevel(wins(n), "10k"), `${n}`).toBeNull();
  });

  it("moves the level stronger after a run of wins", () => {
    expect(suggestLevel(wins(RUN), "10k")).toMatchObject({ from: "10k", to: "9k", won: true, length: RUN });
  });

  it("moves the level weaker after a run of losses", () => {
    expect(suggestLevel(losses(RUN), "10k")).toMatchObject({ from: "10k", to: "11k", won: false, length: RUN });
  });

  it("says nothing at the strong end of the ladder after wins", () => {
    const top = RANK_LADDER[RANK_LADDER.length - 1];
    expect(suggestLevel(wins(RUN, { botRank: top }), top)).toBeNull();
  });

  it("says nothing at the weak end of the ladder after losses", () => {
    const bottom = RANK_LADDER[0];
    expect(suggestLevel(losses(RUN, { botRank: bottom }), bottom)).toBeNull();
  });

  it("still suggests at the strong end when the run is losses", () => {
    const top = RANK_LADDER[RANK_LADDER.length - 1];
    expect(suggestLevel(losses(RUN, { botRank: top }), top).to).not.toBe(top);
  });

  it("says nothing about a rank that is not on the ladder", () => {
    expect(suggestLevel(wins(RUN, { botRank: "42k" }), "42k")).toBeNull();
  });

  it("stops suggesting once the run is broken", () => {
    expect(suggestLevel([...wins(RUN), ...losses(1)], "10k")).toBeNull();
  });
});

describe("the words", () => {
  it("say what was counted, so the player can disagree with it", () => {
    const up = suggestionText(suggestLevel(wins(RUN), "10k"));
    expect(up).toContain(String(RUN));
    expect(up).toContain("10k");
    expect(up).toContain("9k");
    expect(up).toContain("harder");

    const down = suggestionText(suggestLevel(losses(4), "10k"));
    expect(down).toContain("4");
    expect(down).toContain("11k");
    expect(down).toContain("fairer");
  });

  it("keeps the house voice, and says nothing when there is nothing to say", () => {
    expect(suggestionText(suggestLevel(wins(RUN), "10k"))).not.toMatch(/!/);
    expect(suggestionText(null)).toBe("");
  });
});
