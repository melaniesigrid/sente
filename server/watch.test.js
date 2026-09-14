import { describe, it, expect } from "vitest";
import { watchable, isLive, seatedIds, peopleToAsk, watchRow, STALE_MS, MAX_WATCH, liveKey } from "./watch.js";

/* The claim under test is the one in the module header: a game in progress is
   offered to a viewer only when every player at the board lets that viewer
   see they are here, under the same three-way setting presence uses. */

const NOW = 1_800_000_000_000;
const person = (id, showOnline) => ({ id, name: id.toUpperCase(), tint: "mint", showOnline });
const game = (id, black, white, extra = {}) => ({
  id, size: 19, rated: true, pair: false,
  black: { id: black, name: black.toUpperCase(), tint: "mint" },
  white: { id: white, name: white.toUpperCase(), tint: "coral" },
  phase: "playing", moves: 40, toPlay: "b", createdAt: NOW - 10_000, updatedAt: NOW - 5_000,
  ...extra,
});
const people = (...ps) => new Map(ps.map((p) => [p.id, p]));

describe("isLive", () => {
  it("is a game that has not ended", () => {
    expect(isLive(game("g_1", "a", "b"))).toBe(true);
    expect(isLive(game("g_1", "a", "b", { phase: "scoring" }))).toBe(true);
    expect(isLive(game("g_1", "a", "b", { phase: "ended" }))).toBe(false);
    expect(isLive(game("g_1", "a", "b", { endedAt: NOW }))).toBe(false);
    expect(isLive(null)).toBe(false);
  });
});

describe("seatedIds", () => {
  it("names both lead seats at an ordinary table", () => {
    expect(seatedIds(game("g_1", "a", "b"))).toEqual(["a", "b"]);
  });
  it("names every partner with a record at a pair table, and no house player", () => {
    const g = game("g_1", "a", "b", {
      pair: true,
      teams: { b: [{ id: "a", name: "A" }, { name: "Ren", kind: "bot" }], w: [{ id: "b", name: "B" }, { id: "c", name: "C" }] },
    });
    expect(seatedIds(g).sort()).toEqual(["a", "b", "c"]);
  });
  it("collects the people to ask across several games once each", () => {
    expect(peopleToAsk([game("g_1", "a", "b"), game("g_2", "b", "c")]).sort()).toEqual(["a", "b", "c"]);
  });
});

describe("watchable", () => {
  it("shows a stranger only the games where both players let anybody see them", () => {
    const out = watchable(
      [game("g_1", "a", "b"), game("g_2", "a", "c")],
      null, people(person("a", "everyone"), person("b", "everyone"), person("c", "friends")), new Set(), NOW,
    );
    expect(out.map((g) => g.id)).toEqual(["g_1"]);
  });

  it("one player who chose nobody keeps the whole table off the list", () => {
    const out = watchable([game("g_1", "a", "b")], "v",
      people(person("a", "everyone"), person("b", "nobody")), new Set(["b"]), NOW);
    expect(out).toEqual([]);
  });

  it("a friend is shown a friends-only player's game, a stranger is not", () => {
    const games = [game("g_1", "a", "b")];
    const ppl = people(person("a", "friends"), person("b", "everyone"));
    expect(watchable(games, "v", ppl, new Set(["a"]), NOW)).toHaveLength(1);
    expect(watchable(games, "v", ppl, new Set(), NOW)).toHaveLength(0);
    expect(watchable(games, null, ppl, new Set(["a"]), NOW)).toHaveLength(0);
  });

  it("the default, never having chosen, is friends", () => {
    const games = [game("g_1", "a", "b")];
    const ppl = people(person("a", undefined), person("b", "everyone"));
    expect(watchable(games, "v", ppl, new Set(["a"]), NOW)).toHaveLength(1);
    expect(watchable(games, "v", ppl, new Set(), NOW)).toHaveLength(0);
  });

  it("leaves out the viewer's own games: those are their tables, not a show", () => {
    const out = watchable([game("g_1", "v", "b")], "v",
      people(person("v", "everyone"), person("b", "everyone")), new Set(), NOW);
    expect(out).toEqual([]);
  });

  it("leaves out a game with a player whose record is gone", () => {
    const out = watchable([game("g_1", "a", "b")], null, people(person("a", "everyone")), new Set(), NOW);
    expect(out).toEqual([]);
  });

  it("leaves out finished and stale games", () => {
    const ppl = people(person("a", "everyone"), person("b", "everyone"));
    const out = watchable([
      game("g_over", "a", "b", { phase: "ended", endedAt: NOW - 1 }),
      game("g_stale", "a", "b", { updatedAt: NOW - STALE_MS - 1 }),
      game("g_edge", "a", "b", { updatedAt: NOW - STALE_MS }),
      game("g_new", "a", "b", { updatedAt: undefined, createdAt: NOW - 1000 }),
    ], null, ppl, new Set(), NOW);
    expect(out.map((g) => g.id).sort()).toEqual(["g_edge", "g_new"]);
  });

  it("at a pair table every partner with a record has to agree", () => {
    const g = game("g_1", "a", "b", {
      pair: true,
      teams: { b: [{ id: "a", name: "A" }, { name: "Ren", kind: "bot" }], w: [{ id: "b", name: "B" }, { id: "c", name: "C" }] },
    });
    const ppl = people(person("a", "everyone"), person("b", "everyone"), person("c", "nobody"));
    expect(watchable([g], null, ppl, new Set(), NOW)).toEqual([]);
    ppl.set("c", person("c", "everyone"));
    expect(watchable([g], null, ppl, new Set(), NOW)).toHaveLength(1);
  });

  it("is freshest first and capped", () => {
    const ppl = people(person("a", "everyone"), person("b", "everyone"));
    const games = Array.from({ length: MAX_WATCH + 5 }, (_, i) => game(`g_${i}`, "a", "b", { updatedAt: NOW - i * 1000 }));
    const out = watchable(games.reverse(), null, ppl, new Set(), NOW);
    expect(out).toHaveLength(MAX_WATCH);
    expect(out[0].id).toBe("g_0");
    expect(out[MAX_WATCH - 1].id).toBe(`g_${MAX_WATCH - 1}`);
  });

  it("hands the lobby a row and not the whole summary", () => {
    const row = watchRow(game("g_1", "a", "b", { teams: { b: [], w: [] }, result: null, endedAt: null }));
    expect(Object.keys(row).sort()).toEqual(
      ["black", "id", "moves", "pair", "phase", "rated", "size", "toPlay", "updatedAt", "white"]);
    expect(row.black).toEqual({ id: "a", name: "A", tint: "mint" });
  });

  it("names its storage key by the game", () => {
    expect(liveKey("g_abc")).toBe("live:g_abc");
  });
});
