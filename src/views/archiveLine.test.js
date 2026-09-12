import { describe, it, expect } from "vitest";
import { archiveLine, sideOf, verdictOf } from "./archiveLine.js";

const game = (over = {}) => ({
  id: "g1", size: 19, rated: true, pair: false, moves: 142,
  black: { id: "me", name: "Ann" },
  white: { id: "them", name: "Bo" },
  teams: { b: [{ id: "me", name: "Ann" }], w: [{ id: "them", name: "Bo" }] },
  result: { winner: "b", method: "score", margin: "4.5" },
  createdAt: 1, endedAt: 2,
  ...over,
});

describe("sideOf", () => {
  it("finds which side this player sat on", () => {
    expect(sideOf(game(), "me")).toBe("b");
    expect(sideOf(game(), "them")).toBe("w");
  });

  it("finds a player on the second seat of a pair team", () => {
    const four = game({ teams: { b: [{ id: "x" }, { id: "me" }], w: [{ id: "them" }] } });
    expect(sideOf(four, "me")).toBe("b");
  });

  it("falls back to the lead seats for a game recorded before teams existed", () => {
    expect(sideOf(game({ teams: undefined }), "them")).toBe("w");
  });

  it("is null for somebody who was not in the game", () => {
    expect(sideOf(game(), "nobody")).toBe(null);
  });
});

describe("verdictOf", () => {
  it("uses the words the result card uses", () => {
    expect(verdictOf({ winner: "b", method: "score", margin: "4.5" })).toBe("by 4.5");
    expect(verdictOf({ winner: "b", method: "resign" })).toBe("by resignation");
    expect(verdictOf({ winner: "w", method: "timeout" })).toBe("on time");
    expect(verdictOf({ winner: null })).toBe("a draw");
  });

  it("says on the count for a win with no margin recorded", () => {
    expect(verdictOf({ winner: "b", method: "score" })).toBe("on the count");
  });

  it("says unfinished rather than throwing for a game with no result", () => {
    expect(verdictOf(null)).toBe("unfinished");
  });
});

describe("archiveLine", () => {
  it("names the opponent, not both players, in your own archive", () => {
    expect(archiveLine(game(), "me").who).toBe("Bo");
  });

  it("says you won, and by how much", () => {
    const line = archiveLine(game(), "me");
    expect(line.won).toBe(true);
    expect(line.detail).toContain("won by 4.5");
    expect(line.detail).toContain("19×19");
    expect(line.detail).toContain("142 moves");
  });

  it("says you lost from the other seat, about the same game", () => {
    const line = archiveLine(game(), "them");
    expect(line.won).toBe(false);
    expect(line.who).toBe("Ann");
    expect(line.detail).toContain("lost by 4.5");
  });

  /* Three states, not two: a mark that only knows won and lost has to call a
     draw one of them. */
  it("has no winner at all for a draw", () => {
    const line = archiveLine(game({ result: { winner: null } }), "me");
    expect(line.won).toBe(null);
    expect(line.detail).toContain("a draw");
  });

  it("names both sides for a game that was not yours", () => {
    expect(archiveLine(game(), "nobody").who).toBe("Ann vs Bo");
  });

  it("names both partners of a pair team", () => {
    const four = game({
      pair: true,
      teams: { b: [{ id: "me", name: "Ann" }, { id: "x", name: "Cy" }], w: [{ id: "them", name: "Bo" }, { id: "y", name: "Di" }] },
    });
    const line = archiveLine(four, "me");
    expect(line.who).toBe("Bo & Di");
    expect(line.detail).toContain("pair go");
  });

  it("says when a game did not count", () => {
    expect(archiveLine(game({ rated: false }), "me").detail).toContain("unrated");
    expect(archiveLine(game(), "me").detail).not.toContain("unrated");
  });

  it("survives a game with no result rather than blanking the row", () => {
    const line = archiveLine(game({ result: null }), "me");
    expect(line.won).toBe(null);
    expect(line.detail).toContain("unfinished");
    expect(line.who).toBe("Bo");
  });

  it("falls back to a colour when a seat has no name", () => {
    const nameless = game({ teams: { b: [{ id: "me" }], w: [{ id: "them" }] }, white: { id: "them" } });
    expect(archiveLine(nameless, "me").who).toBe("White");
  });
});
