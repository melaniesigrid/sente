// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { houseGamesFrom, carryHouseGames, carried, markCarried, HOUSE_RD, CARRIED_KEY } from "./carry.js";
import { ratingOfRank, rankWithHandicap } from "../content/rank.js";

const houseGames = vi.fn();
vi.mock("../net/api.js", () => ({ serverEnabled: () => true, api: { houseGames: (...a) => houseGames(...a) } }));
vi.mock("./account.js", () => ({ saveAccount: () => true }));

const game = (over = {}) => ({ at: "2026-09-18", size: 9, handicap: 0, bot: "tetsu", botRank: "10k", kind: "rated", result: "B+R", won: true, moves: 40, ...over });

describe("houseGamesFrom", () => {
  it("turns each rated game into what the route takes, oldest first, one rank a stone", () => {
    const out = houseGamesFrom([game({ won: false }), game({ botRank: "5k", handicap: 2 })]);
    expect(out).toEqual([
      { opponent: { rating: Math.round(ratingOfRank("10k")), rd: HOUSE_RD }, score: 0 },
      { opponent: { rating: Math.round(ratingOfRank(rankWithHandicap("5k", 2))), rd: HOUSE_RD }, score: 1 },
    ]);
  });
  it("leaves out everything that did not move the device's rating either", () => {
    expect(houseGamesFrom([
      game({ kind: "coached" }), game({ kind: "duel" }), game({ kind: "master", botRank: null }),
      game({ won: null }), game({ botRank: null }), null,
    ])).toEqual([]);
    expect(houseGamesFrom(null)).toEqual([]);
  });
});

describe("carryHouseGames", () => {
  const account = { token: "t".repeat(64), player: { id: "p_1", rating: 1000 } };
  beforeEach(() => { localStorage.clear(); houseGames.mockReset(); });

  it("tells the account once and marks the device", async () => {
    houseGames.mockResolvedValue({ id: "p_1", rating: 1300 });
    const player = await carryHouseGames(account, { log: [game()] });
    expect(player.rating).toBe(1300);
    expect(houseGames).toHaveBeenCalledWith(account.token, houseGamesFrom([game()]));
    expect(carried("p_1")).toBe(true);
    expect(await carryHouseGames(account, { log: [game()] })).toBeNull();
    expect(houseGames).toHaveBeenCalledTimes(1);
  });
  it("marks a device with nothing to carry without a request", async () => {
    expect(await carryHouseGames(account, { log: [game({ kind: "duel" })] })).toBeNull();
    expect(houseGames).not.toHaveBeenCalled();
    expect(carried("p_1")).toBe(true);
  });
  it("leaves no mark when the send fails, so the next visit tries again", async () => {
    houseGames.mockRejectedValue(new Error("down"));
    expect(await carryHouseGames(account, { log: [game()] })).toBeNull();
    expect(carried("p_1")).toBe(false);
  });
  it("is per account: a second person on the same device carries too", async () => {
    markCarried("p_1");
    houseGames.mockResolvedValue({ id: "p_2" });
    expect(await carryHouseGames({ ...account, player: { id: "p_2" } }, { log: [game()] })).toEqual({ id: "p_2" });
    expect(JSON.parse(localStorage.getItem(CARRIED_KEY))).toMatchObject({ p_1: expect.any(Number), p_2: expect.any(Number) });
  });
  it("survives a storage that is junk or refused", async () => {
    localStorage.setItem(CARRIED_KEY, "not json");
    expect(carried("p_1")).toBe(false);
    houseGames.mockResolvedValue({ id: "p_1" });
    expect(await carryHouseGames(account, { log: [game()] })).toEqual({ id: "p_1" });
  });
});
