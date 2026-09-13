import { describe, it, expect } from "vitest";
import {
  isLive, sideOf, isYourMove, waitingText, turnText, dashLine, opponentName, dashboard,
} from "./dashboard.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

/* These are English assertions about wording, so they ask in English. The
   parity test is what holds the other languages to the same lines. */
const EN = makeT(BASE_LOCALE);

const NOW = 1_700_000_000_000;
const ago = (mins) => NOW - mins * 60_000;

const game = (over = {}) => ({
  id: "g1", size: 19, rated: true, pair: false, moves: 40,
  phase: "playing", toPlay: "b",
  black: { id: "me", name: "Ann" },
  white: { id: "them", name: "Bo" },
  teams: { b: [{ id: "me", name: "Ann" }], w: [{ id: "them", name: "Bo" }] },
  result: null, createdAt: ago(600), endedAt: null, updatedAt: ago(5),
  ...over,
});

describe("isLive", () => {
  it("counts playing and scoring, because somebody is waiting in both", () => {
    expect(isLive(game())).toBe(true);
    expect(isLive(game({ phase: "scoring" }))).toBe(true);
  });

  it("does not count a finished game, or nothing at all", () => {
    expect(isLive(game({ phase: "ended" }))).toBe(false);
    expect(isLive(null)).toBe(false);
  });
});

describe("sideOf", () => {
  it("finds the seat, including the second one of a pair team", () => {
    expect(sideOf(game(), "me")).toBe("b");
    expect(sideOf(game({ teams: { b: [{ id: "x" }, { id: "me" }], w: [{ id: "them" }] } }), "me")).toBe("b");
  });

  it("falls back to the lead seats when there are no teams", () => {
    expect(sideOf(game({ teams: undefined }), "them")).toBe("w");
  });

  it("is null for a spectator", () => {
    expect(sideOf(game(), "nobody")).toBe(null);
  });
});

describe("isYourMove", () => {
  it("is true when the turn is yours", () => {
    expect(isYourMove(game({ toPlay: "b" }), "me")).toBe(true);
    expect(isYourMove(game({ toPlay: "w" }), "me")).toBe(false);
  });

  /* Counting waits on everybody who has not accepted, so it is yours to answer
     whatever `toPlay` happens to say. */
  it("is true in scoring for either player", () => {
    expect(isYourMove(game({ phase: "scoring", toPlay: "w" }), "me")).toBe(true);
    expect(isYourMove(game({ phase: "scoring", toPlay: "b" }), "them")).toBe(true);
  });

  it("is false for somebody not in the game", () => {
    expect(isYourMove(game(), "nobody")).toBe(false);
  });
});

describe("waitingText", () => {
  it("widens through minutes, hours and days", () => {
    expect(waitingText(ago(0), EN, NOW)).toBe("just now");
    expect(waitingText(ago(1), EN, NOW)).toBe("1 minute");
    expect(waitingText(ago(40), EN, NOW)).toBe("40 minutes");
    expect(waitingText(ago(60), EN, NOW)).toBe("1 hour");
    expect(waitingText(ago(300), EN, NOW)).toBe("5 hours");
    expect(waitingText(ago(60 * 24), EN, NOW)).toBe("1 day");
    expect(waitingText(ago(60 * 24 * 9), EN, NOW)).toBe("9 days");
  });

  it("says just now rather than a negative for a clock slightly behind", () => {
    expect(waitingText(NOW + 60_000, EN, NOW)).toBe("just now");
  });

  it("says nothing without a stamp", () => {
    expect(waitingText(null, EN, NOW)).toBe(null);
    expect(waitingText(0, EN, NOW)).toBe(null);
  });

  it("never says anything about a person, only a length of time", () => {
    for (const m of [0, 1, 30, 90, 3000]) {
      expect(waitingText(ago(m), EN, NOW)).not.toMatch(/online|here|away|seen/i);
    }
  });
});

describe("turnText", () => {
  it("speaks from your seat", () => {
    expect(turnText(game({ toPlay: "b" }), "me", EN)).toBe("Your move");
    expect(turnText(game({ toPlay: "w" }), "me", EN)).toBe("Their move");
  });

  it("names the colour for somebody watching", () => {
    expect(turnText(game({ toPlay: "w" }), "nobody", EN)).toBe("White to move");
  });

  it("says counting during scoring", () => {
    expect(turnText(game({ phase: "scoring" }), "me", EN)).toBe("Counting");
  });
});

describe("opponentName", () => {
  it("names who is across the board", () => {
    expect(opponentName(game(), "me", EN)).toBe("Bo");
    expect(opponentName(game(), "them", EN)).toBe("Ann");
  });

  it("names both partners of a pair team", () => {
    const four = game({ teams: { b: [{ id: "me", name: "Ann" }], w: [{ id: "them", name: "Bo" }, { id: "y", name: "Di" }] } });
    expect(opponentName(four, "me", EN)).toBe("Bo & Di");
  });

  it("falls back to a colour when nobody is named", () => {
    expect(opponentName(game({ teams: { b: [{ id: "me" }], w: [{ id: "them" }] } }), "me", EN)).toBe("White");
  });
});

describe("dashLine", () => {
  it("says whose move it is and how long the board has waited", () => {
    expect(dashLine(game({ toPlay: "b", updatedAt: ago(90) }), "me", EN, NOW))
      .toBe("Your move · waiting 1 hour · 19×19");
  });

  it("says moved just now rather than waiting just now", () => {
    expect(dashLine(game({ updatedAt: NOW }), "me", EN, NOW)).toContain("moved just now");
  });

  it("mentions the things that are not the default", () => {
    const odd = dashLine(game({ pair: true, rated: false }), "me", EN, NOW);
    expect(odd).toContain("pair go");
    expect(odd).toContain("unrated");
    expect(dashLine(game(), "me", EN, NOW)).not.toContain("unrated");
  });
});

describe("the board itself", () => {
  const mk = (id, toPlay, mins) => game({ id, toPlay, updatedAt: ago(mins) });

  it("puts the games waiting on you first", () => {
    const r = dashboard([mk("a", "w", 10), mk("b", "b", 5)], "me", NOW);
    expect(r.yours.map((g) => g.id)).toEqual(["b"]);
    expect(r.theirs.map((g) => g.id)).toEqual(["a"]);
  });

  /* Longest-waiting first inside each group: the person kept waiting longest
     is the one to answer first. */
  it("puts the longest wait at the top of each group", () => {
    const r = dashboard([mk("new", "b", 2), mk("old", "b", 400), mk("mid", "b", 60)], "me", NOW);
    expect(r.yours.map((g) => g.id)).toEqual(["old", "mid", "new"]);
  });

  it("leaves finished games out", () => {
    const r = dashboard([game({ id: "done", phase: "ended" }), mk("live", "b", 1)], "me", NOW);
    expect(r.total).toBe(1);
    expect(r.yours.map((g) => g.id)).toEqual(["live"]);
  });

  /* A game nobody is waiting on you for is still shown, below: the screen is a
     full account of what you have going, not only a list of chores. */
  it("still lists the games that are not waiting on you", () => {
    const r = dashboard([mk("a", "w", 10)], "me", NOW);
    expect(r.waiting).toBe(0);
    expect(r.total).toBe(1);
    expect(r.theirs.length).toBe(1);
  });

  it("counts how many are waiting on you", () => {
    const r = dashboard([mk("a", "b", 1), mk("b", "b", 2), mk("c", "w", 3)], "me", NOW);
    expect(r.waiting).toBe(2);
    expect(r.total).toBe(3);
  });

  it("copes with no games at all", () => {
    expect(dashboard([], "me", NOW)).toEqual({ yours: [], theirs: [], waiting: 0, total: 0, now: NOW });
    expect(dashboard(null, "me", NOW).total).toBe(0);
  });

  it("counts a game in scoring as waiting on you", () => {
    const r = dashboard([game({ phase: "scoring", toPlay: "w" })], "me", NOW);
    expect(r.waiting).toBe(1);
  });
});

/* An empty team list is not an answer. A stored summary whose `teams` arrived
   empty used to beat the lead seat sitting right there, so the dashboard told a
   player that nobody was on a side they were plainly playing: their own game
   sorted as somebody else's and never counted as waiting on them. */
describe("a summary whose teams arrived empty", () => {
  const g = {
    id: "g", size: 19, phase: "playing", toPlay: "b", updatedAt: 1,
    black: { id: "a", name: "Ada" }, white: { id: "b", name: "Bea" },
    teams: { b: [], w: [] },
  };
  it("falls through to the lead seat rather than reporting nobody", () => {
    expect(sideOf(g, "a")).toBe("b");
    expect(sideOf(g, "b")).toBe("w");
  });
  it("still counts the game as waiting on the player whose move it is", () => {
    expect(isYourMove(g, "a")).toBe(true);
    expect(dashboard([g], "a").waiting).toBe(1);
  });
  it("names the opponent from the lead seat too", () => {
    expect(opponentName(g, "a", EN)).toBe("Bea");
  });
  it("says nothing about somebody at neither seat", () => {
    expect(sideOf(g, "stranger")).toBe(null);
    expect(isYourMove(g, "stranger")).toBe(false);
  });
});
