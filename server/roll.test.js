import { describe, it, expect } from "vitest";
import {
  ROLL_KEEP, ROLL_PAGE, ROLL_PREFIX, stampOf, rollKey,
  TIE_STRANGER, TIE_WROTE, TIE_FRIEND, TIE_PLAYED,
  tieOf, seatsOf, rollFor, rollIsThin,
  gameIdOfRollKey, viewsKey, readViews, withViews,
} from "./roll.js";

const game = (id, endedAt, b, w) => ({
  id, endedAt,
  black: { id: b, name: b },
  white: { id: w, name: w },
});

const pair = (id, endedAt, bs, ws) => ({
  id, endedAt,
  teams: { b: bs.map((x) => ({ id: x, name: x })), w: ws.map((x) => ({ id: x, name: x })) },
});

const near = (o = {}) => ({
  played: new Set(o.played || []),
  friends: new Set(o.friends || []),
  wrote: new Set(o.wrote || []),
});

describe("the view count", () => {
  it("is a whole number or nothing", () => {
    for (const junk of [undefined, null, -1, 1.5, "3", {}]) expect(readViews(junk)).toBe(0);
    expect(readViews(3)).toBe(3);
  });

  it("rides on the row, and a missing tally is 0 rather than a hole", () => {
    const rows = [{ id: "g1" }, { id: "g2" }];
    const out = withViews(rows, new Map([[viewsKey("g1"), 4]]));
    expect(out.map((r) => r.views)).toEqual([4, 0]);
    expect(viewsKey("g1")).toBe("views:g1");
  });

  it("is never a sort key", () => {
    // A game cannot climb the roll by being looked at: the page is ordered
    // by relationship then time, and the tally does not enter into it.
    const rows = [
      { id: "quiet", endedAt: 20, black: { id: "a" }, white: { id: "b" }, views: 0 },
      { id: "loud", endedAt: 10, black: { id: "c" }, white: { id: "d" }, views: 999 },
    ];
    expect(rollFor(rows, {}).map((r) => r.id)).toEqual(["quiet", "loud"]);
  });

  it("reads the game id back off a roll key", () => {
    expect(gameIdOfRollKey(rollKey(1700000000000, "g:with:colons"))).toBe("g:with:colons");
  });
});

describe("keys", () => {
  it("pads the stamp so the keys sort by time as strings", () => {
    expect(stampOf(9).length).toBe(stampOf(1789616082000).length);
    expect(stampOf(9) < stampOf(10)).toBe(true);
    expect(rollKey(5, "g1") < rollKey(6, "g1")).toBe(true);
  });

  it("puts the game id after the stamp so two games in one millisecond both survive", () => {
    expect(rollKey(5, "a")).not.toBe(rollKey(5, "b"));
    expect(rollKey(5, "a").startsWith(ROLL_PREFIX)).toBe(true);
  });

  it("files nonsense at zero rather than somewhere unreachable", () => {
    expect(stampOf(NaN)).toBe(stampOf(0));
    expect(stampOf(-4)).toBe(stampOf(0));
  });
});

describe("seatsOf", () => {
  it("reads a two-seat game", () => {
    expect(seatsOf(game("g", 1, "ana", "marco")).sort()).toEqual(["ana", "marco"]);
  });

  it("reads all four seats at a pair table", () => {
    expect(seatsOf(pair("g", 1, ["ana", "bo"], ["cy", "di"])).sort())
      .toEqual(["ana", "bo", "cy", "di"]);
  });

  it("survives a row with a missing side", () => {
    expect(seatsOf({ id: "g", endedAt: 1, black: { id: "ana" }, white: null })).toEqual(["ana"]);
  });
});

describe("tieOf", () => {
  it("ranks played over friended over wrote-to over stranger", () => {
    expect(tieOf(["x"], near({ played: ["x"] }))).toBe(TIE_PLAYED);
    expect(tieOf(["x"], near({ friends: ["x"] }))).toBe(TIE_FRIEND);
    expect(tieOf(["x"], near({ wrote: ["x"] }))).toBe(TIE_WROTE);
    expect(tieOf(["x"], near())).toBe(TIE_STRANGER);
  });

  it("takes the closest seat at the table, not the first", () => {
    expect(tieOf(["stranger", "pal"], near({ played: ["pal"] }))).toBe(TIE_PLAYED);
  });

  it("prefers played when somebody is both played and friended", () => {
    expect(tieOf(["x"], near({ played: ["x"], friends: ["x"] }))).toBe(TIE_PLAYED);
  });
});

describe("rollFor â€” relationship SORTS, it does not only filter", () => {
  /* The failure this whole design reversed a decision to avoid: in a club
     where one member plays every day, pure recency drowns everybody else. */
  it("puts a friend's older game above a stranger's newer one", () => {
    const rows = [
      game("busy3", 300, "loud", "other"),
      game("busy2", 200, "loud", "other"),
      game("mine", 100, "pal", "someone"),
      game("busy1", 50, "loud", "other"),
    ];
    const page = rollFor(rows, near({ friends: ["pal"] }), { viewerId: "me" });
    expect(page[0].id).toBe("mine");
  });

  it("is newest-first inside a tier", () => {
    const rows = [
      game("new", 300, "pal", "x"),
      game("old", 100, "pal", "x"),
    ];
    expect(rollFor(rows, near({ friends: ["pal"] })).map((r) => r.id)).toEqual(["new", "old"]);
  });

  it("sorts correctly even if the caller hands rows over out of order", () => {
    const rows = [
      game("old", 100, "pal", "x"),
      game("new", 300, "pal", "x"),
    ];
    expect(rollFor(rows, near({ friends: ["pal"] })).map((r) => r.id)).toEqual(["new", "old"]);
  });

  it("keeps strangers rather than hiding them, just lower", () => {
    const rows = [game("far", 300, "nobody", "else"), game("near", 100, "pal", "x")];
    const page = rollFor(rows, near({ friends: ["pal"] }));
    expect(page.map((r) => r.id)).toEqual(["near", "far"]);
  });

  it("does not let the viewer's own seat decide the tier", () => {
    // A game I played against a stranger should rank as a stranger's game,
    // not as "played" merely because I am in it.
    const rows = [game("mine", 100, "me", "stranger")];
    const page = rollFor(rows, near({ played: ["me"] }), { viewerId: "me" });
    expect(page[0].tie).toBe(TIE_STRANGER);
  });

  it("keeps the viewer's own games in the roll", () => {
    const page = rollFor([game("mine", 100, "me", "stranger")], near(), { viewerId: "me" });
    expect(page).toHaveLength(1);
  });
});

describe("rollFor â€” blocking", () => {
  it("removes a blocked person's games silently", () => {
    const rows = [game("bad", 300, "troll", "x"), game("ok", 100, "pal", "y")];
    const page = rollFor(rows, near({ friends: ["pal"] }), { blocked: new Set(["troll"]) });
    expect(page.map((r) => r.id)).toEqual(["ok"]);
  });

  it("removes the game even when the blocked person is only one seat of four", () => {
    const rows = [pair("p", 300, ["ana", "troll"], ["cy", "di"])];
    expect(rollFor(rows, near(), { blocked: new Set(["troll"]) })).toEqual([]);
  });

  it("takes a list as readily as a Set", () => {
    const rows = [game("bad", 300, "troll", "x")];
    expect(rollFor(rows, near(), { blocked: ["troll"] })).toEqual([]);
  });
});

describe("rollFor â€” paging", () => {
  it("hands back at most a page", () => {
    const rows = Array.from({ length: 50 }, (_, i) => game(`g${i}`, 1000 - i, "a", "b"));
    expect(rollFor(rows, near())).toHaveLength(ROLL_PAGE);
    expect(rollFor(rows, near(), { limit: 5 })).toHaveLength(5);
  });

  it("is empty for an empty index rather than throwing", () => {
    expect(rollFor([], near())).toEqual([]);
  });
});

describe("rollIsThin", () => {
  it("is thin when there is nothing at all", () => {
    expect(rollIsThin([])).toBe(true);
  });

  it("is thin when nobody in it is known", () => {
    const page = rollFor([game("g", 1, "a", "b")], near());
    expect(rollIsThin(page)).toBe(true);
  });

  it("is not thin once one row is somebody you know", () => {
    const page = rollFor([game("g", 1, "pal", "b")], near({ friends: ["pal"] }));
    expect(rollIsThin(page)).toBe(false);
  });
});

describe("the cap", () => {
  it("is in the same family as the other capped lists here", () => {
    expect(ROLL_KEEP).toBe(400);
    expect(ROLL_PAGE).toBeLessThan(ROLL_KEEP);
  });
});
