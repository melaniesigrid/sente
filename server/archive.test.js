import { describe, it, expect } from "vitest";
import {
  archivePrefix, stampOf, archiveKey, gameIdOf, pageSize, PAGE_SIZE,
  cursorFor, page, archived, playersOf,
} from "./archive.js";

const summary = (over = {}) => ({
  id: "g_abc", size: 19, rated: true, pair: false,
  black: { id: "p1", name: "Ann", tint: "mint" },
  white: { id: "p2", name: "Bo", tint: "clay" },
  teams: { b: [{ id: "p1", name: "Ann" }], w: [{ id: "p2", name: "Bo" }] },
  phase: "ended", moves: 142, toPlay: "b",
  result: { winner: "b", method: "score", margin: "4.5" },
  createdAt: 1000, endedAt: 2000, updatedAt: 3000,
  ...over,
});

describe("the key", () => {
  it("files a game under its player and its ending", () => {
    expect(archiveKey("p1", 1700000000000, "g_abc")).toBe("arch:p1:01700000000000:g_abc");
  });

  it("gives each player their own prefix, so a page never touches another's", () => {
    expect(archiveKey("p1", 1, "g").startsWith(archivePrefix("p1"))).toBe(true);
    expect(archiveKey("p1", 1, "g").startsWith(archivePrefix("p2"))).toBe(false);
  });

  /* The whole ordering rests on this. A ragged-width stamp sorts "9" after
     "10", so a game from 2001 would outrank one from next week. */
  it("pads every stamp to the same width, so string order is time order", () => {
    const widths = new Set([0, 1, 999, 1_700_000_000_000, 9_999_999_999_999].map((n) => stampOf(n).length));
    expect(widths.size).toBe(1);
  });

  it("sorts keys into the order the games ended", () => {
    const times = [5, 1000, 1_700_000_000_000, 42, 999_999];
    const sorted = times.map((t) => archiveKey("p1", t, "g")).sort();
    const back = sorted.map((k) => Number(/^arch:p1:(\d+):/.exec(k)[1]));
    expect(back).toEqual([...times].sort((a, b) => a - b));
  });

  it("gives two games that ended in the same millisecond a key each", () => {
    expect(archiveKey("p1", 7, "g_one")).not.toBe(archiveKey("p1", 7, "g_two"));
  });

  it("treats a missing or silly ending as the beginning of time rather than NaN", () => {
    for (const bad of [undefined, null, -5, "x"]) {
      expect(stampOf(bad), String(bad)).toBe("0".repeat(14));
    }
  });
});

describe("gameIdOf", () => {
  it("reads the id back out of a key", () => {
    expect(gameIdOf(archiveKey("p1", 1700000000000, "g_abc"))).toBe("g_abc");
  });

  it("keeps an id that has colons in it", () => {
    expect(gameIdOf(archiveKey("p1", 1, "g:with:colons"))).toBe("g:with:colons");
  });

  it("is null for anything that is not one of these keys", () => {
    for (const bad of ["player:p1", "arch:p1", "", null, 7, "arch:p1:notastamp:g"]) {
      expect(gameIdOf(bad), String(bad)).toBe(null);
    }
  });
});

describe("pageSize", () => {
  it("defaults for anything that is not a number", () => {
    for (const bad of [undefined, null, "", "many", NaN, 0, -4]) {
      expect(pageSize(bad), String(bad)).toBe(PAGE_SIZE);
    }
  });

  it("honours a smaller ask and caps a larger one", () => {
    expect(pageSize(5)).toBe(5);
    expect(pageSize("5")).toBe(5);
    expect(pageSize(1000)).toBe(PAGE_SIZE);
  });

  it("rounds a fractional ask down rather than passing it to storage", () => {
    expect(pageSize(5.9)).toBe(5);
  });
});

describe("the cursor", () => {
  /* A cursor is a storage key, so a caller who invents one must not be able to
     page somebody else's archive with it. */
  it("refuses a cursor that belongs to another player", () => {
    const mine = archiveKey("p1", 5, "g");
    expect(cursorFor("p1", mine)).toBe(mine);
    expect(cursorFor("p2", mine)).toBe(null);
  });

  it("refuses a cursor pointing anywhere but the archive", () => {
    for (const bad of ["player:p1", "avatar:p1", "friends:p1", "arch:", ""]) {
      expect(cursorFor("p1", bad), bad).toBe(null);
    }
  });

  it("is null for no cursor at all", () => {
    expect(cursorFor("p1", undefined)).toBe(null);
    expect(cursorFor("p1", null)).toBe(null);
  });
});

describe("a page", () => {
  const entries = (n) => Array.from({ length: n }, (_, i) => ({ key: `arch:p1:k${i}`, value: { id: `g${i}` } }));

  it("hands back the games and a cursor at the end of a full page", () => {
    const r = page(entries(30), 30);
    expect(r.games.length).toBe(30);
    expect(r.cursor).toBe("arch:p1:k29");
  });

  it("says there is no more when the page came back short", () => {
    expect(page(entries(7), 30).cursor).toBe(null);
  });

  it("says there is no more for an empty page", () => {
    expect(page([], 30)).toEqual({ games: [], cursor: null });
  });
});

describe("what is archived", () => {
  it("keeps what a list of past games shows", () => {
    const a = archived(summary());
    expect(a.id).toBe("g_abc");
    expect(a.result.margin).toBe("4.5");
    expect(a.moves).toBe(142);
    expect(a.endedAt).toBe(2000);
    expect(a.black.name).toBe("Ann");
  });

  /* A row is read far more often than written, so the live fields that mean
     nothing once a game is over do not ride along in every one of them. */
  it("drops the fields that only mean something while a game is running", () => {
    const a = archived(summary());
    expect(a.toPlay).toBeUndefined();
    expect(a.updatedAt).toBeUndefined();
    expect(a.phase).toBeUndefined();
  });

  it("keeps the teams, so a pair game still names four people afterwards", () => {
    const four = summary({ pair: true, teams: { b: [{ id: "p1" }, { id: "p3" }], w: [{ id: "p2" }, { id: "p4" }] } });
    expect(archived(four).pair).toBe(true);
    expect(archived(four).teams.b.length).toBe(2);
  });
});

describe("playersOf", () => {
  it("names both players of an ordinary game", () => {
    expect(playersOf(summary()).sort()).toEqual(["p1", "p2"]);
  });

  it("names all four of a pair game", () => {
    const four = summary({ teams: { b: [{ id: "p1" }, { id: "p3" }], w: [{ id: "p2" }, { id: "p4" }] } });
    expect(playersOf(four).sort()).toEqual(["p1", "p2", "p3", "p4"]);
  });

  it("names somebody once who sat on both sides of their own board", () => {
    const solo = summary({
      black: { id: "p1" }, white: { id: "p1" },
      teams: { b: [{ id: "p1" }], w: [{ id: "p1" }] },
    });
    expect(playersOf(solo)).toEqual(["p1"]);
  });

  it("falls back to the two lead seats for a summary with no teams", () => {
    const old = summary({ teams: undefined });
    expect(playersOf(old).sort()).toEqual(["p1", "p2"]);
  });

  it("skips a seat with nobody in it", () => {
    expect(playersOf(summary({ teams: { b: [null, { id: "p1" }], w: [] }, white: null })))
      .toEqual(["p1"]);
  });
});
