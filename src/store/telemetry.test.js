import { suggestLevel } from "../content/level.js";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  CAP, KINDS, STORE_KEY, sanitizeGame, sanitizeLog, pushGame,
  recordAgainst, byBot, summarize, loadTelemetry, recordGame, clearTelemetry,
} from "./telemetry.js";

const game = (over = {}) => ({
  at: "2026-09-11", size: 9, handicap: 0, bot: "hoshi", botRank: "18k",
  kind: "rated", result: "B+3.5", won: true, moves: 74, ...over,
});

describe("one game", () => {
  it("keeps exactly the fields it is allowed to keep", () => {
    const clean = sanitizeGame({ ...game(), name: "Mel", moveList: [[3, 3]], opponentEmail: "x@y.z" });
    expect(Object.keys(clean).sort())
      .toEqual(["at", "bot", "botRank", "handicap", "kind", "moves", "result", "size", "won"]);
  });

  it("accepts a game nobody won, and a game with no house player", () => {
    expect(sanitizeGame(game({ won: null }))).toBeTruthy();
    expect(sanitizeGame(game({ bot: null, botRank: null, kind: "master" }))).toBeTruthy();
  });

  it("refuses anything malformed", () => {
    for (const bad of [
      null, [], "x", 3,
      game({ at: "today" }), game({ at: 20260911 }),
      game({ size: 0 }), game({ size: 9.5 }), game({ size: -19 }),
      game({ handicap: -1 }), game({ moves: -1 }),
      game({ kind: "friendly" }), game({ result: "" }), game({ result: 3 }),
      game({ won: "yes" }), game({ bot: 7 }), game({ botRank: 18 }),
    ]) {
      expect(sanitizeGame(bad)).toBeNull();
    }
  });
});

describe("the log", () => {
  it("drops malformed entries and keeps only the last CAP", () => {
    const many = Array.from({ length: CAP + 10 }, (_, i) => game({ moves: i }));
    const out = sanitizeLog([...many, "rubbish", null]);
    expect(out.length).toBe(CAP);
    // The oldest went, not the newest.
    expect(out[out.length - 1].moves).toBe(CAP + 9);
    expect(out[0].moves).toBe(10);
  });

  it("is empty when what was stored is not a list", () => {
    for (const bad of [null, {}, "x", 4]) expect(sanitizeLog(bad)).toEqual([]);
  });

  it("pushes one game and rolls the oldest out when it is full", () => {
    let log = [];
    for (let i = 0; i < CAP + 3; i++) log = pushGame(log, game({ moves: i }));
    expect(log.length).toBe(CAP);
    expect(log[0].moves).toBe(3);
    expect(log[CAP - 1].moves).toBe(CAP + 2);
  });

  it("refuses to push a game that is not one, and does not disturb the log", () => {
    const log = [sanitizeGame(game())];
    expect(pushGame(log, { at: "nope" })).toBe(log);
  });

  it("never mutates the log it was handed", () => {
    const log = [sanitizeGame(game())];
    pushGame(log, game({ moves: 2 }));
    expect(log.length).toBe(1);
  });
});

describe("what it is for", () => {
  const log = [
    game({ bot: "hoshi", won: true }), game({ bot: "hoshi", won: false }),
    game({ bot: "hoshi", won: false }), game({ bot: "tetsu", won: true }),
    // These three are not evidence about a rank, and must not be counted.
    game({ bot: "hoshi", won: true, kind: "coached" }),
    game({ bot: "hoshi", won: true, kind: "duel" }),
    game({ bot: "hoshi", won: null }),
  ].map(sanitizeGame);

  it("counts only rated, decided games against a house player", () => {
    expect(recordAgainst(log, "hoshi")).toEqual({ games: 3, wins: 1, losses: 2 });
    expect(recordAgainst(log, "tetsu")).toEqual({ games: 1, wins: 1, losses: 0 });
    expect(recordAgainst(log, "nobody")).toEqual({ games: 0, wins: 0, losses: 0 });
  });

  it("lists the house players most played first, since a rate over two games is not a rate", () => {
    expect(byBot(log).map(r => r.bot)).toEqual(["hoshi", "tetsu"]);
  });

  it("leaves out a house player with no rated game to its name", () => {
    const onlyCoached = [game({ bot: "yuki", kind: "coached" })].map(sanitizeGame);
    expect(byBot(onlyCoached)).toEqual([]);
  });

  it("summarises what is held and over what span", () => {
    const spread = [
      game({ at: "2026-09-01", size: 9 }),
      game({ at: "2026-09-11", size: 19, won: false }),
      game({ at: "2026-09-05", size: 9, kind: "duel", won: null }),
    ].map(sanitizeGame);
    expect(summarize(spread)).toMatchObject({
      games: 3, rated: 2, wins: 1, losses: 1,
      sizes: { 9: 2, 19: 1 }, from: "2026-09-01", to: "2026-09-11", full: false,
    });
  });

  it("says when it is full, because that is when it starts forgetting", () => {
    expect(summarize(Array.from({ length: CAP }, () => sanitizeGame(game()))).full).toBe(true);
  });

  it("summarises an empty log without inventing a span", () => {
    expect(summarize([])).toMatchObject({ games: 0, moves: 0, from: null, to: null, full: false });
  });
});

/* The suite runs in node, where there is no local storage, so these three
   functions are exercised against a stub of one. It is the browser contract and
   nothing more: strings in, strings out, and it may refuse. Adding jsdom to the
   project for one module would be a heavier dependency than the module. */
function fakeStorage({ failRead = false, failWrite = false } = {}) {
  const data = new Map();
  return {
    getItem(k) { if (failRead) throw new Error("blocked"); return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { if (failWrite) throw new Error("QuotaExceeded"); data.set(k, String(v)); },
    removeItem(k) { data.delete(k); },
    clear() { data.clear(); },
  };
}

describe("storage", () => {
  beforeEach(() => { globalThis.localStorage = fakeStorage(); });
  afterEach(() => { delete globalThis.localStorage; vi.restoreAllMocks(); });

  it("round-trips through the browser under its own key", () => {
    recordGame(game());
    expect(localStorage.getItem(STORE_KEY)).toBeTruthy();
    expect(loadTelemetry()).toEqual([sanitizeGame(game())]);
  });

  it("stays out of the profile, so it cannot be swept along when a profile syncs", () => {
    recordGame(game());
    expect(STORE_KEY).not.toMatch(/profile/);
    expect(localStorage.getItem("sente-profile-v3")).toBeNull();
  });

  it("reads an empty log out of nonsense rather than throwing", () => {
    localStorage.setItem(STORE_KEY, "{not json");
    expect(loadTelemetry()).toEqual([]);
  });

  it("keeps playing when storage refuses to be written", () => {
    globalThis.localStorage = fakeStorage({ failWrite: true });
    expect(() => recordGame(game())).not.toThrow();
    // The caller still gets the log it would have had, so the session is consistent.
    expect(recordGame(game())).toEqual([sanitizeGame(game())]);
  });

  it("keeps playing when storage refuses to be read", () => {
    globalThis.localStorage = fakeStorage({ failRead: true });
    expect(loadTelemetry()).toEqual([]);
    expect(() => recordGame(game())).not.toThrow();
  });

  it("keeps playing when there is no storage at all", () => {
    delete globalThis.localStorage;
    expect(loadTelemetry()).toEqual([]);
    expect(() => clearTelemetry()).not.toThrow();
  });

  it("forgets everything on request", () => {
    recordGame(game());
    expect(clearTelemetry()).toEqual([]);
    expect(loadTelemetry()).toEqual([]);
  });
});

describe("the promise", () => {
  it("names every kind of game the app can record", () => {
    expect(KINDS).toEqual(["rated", "coached", "duel", "master", "pair"]);
  });
  it("keeps every kind that is not evidence about a rank out of the suggestion", () => {
    // The guard behind the list: only a rated game moves the level the lobby
    // suggests. A duel is seeded, a master has no rank, a coached game had help,
    // and a pair game had a 7 dan playing half of it.
    for (const kind of KINDS.filter(k => k !== "rated")) {
      const log = Array.from({ length: 12 }, (_, i) => ({
        at: "2026-09-09", size: 9, handicap: 0, bot: "tetsu", botRank: "12k",
        kind, result: "R+", won: true, moves: 40 + i,
      }));
      expect(suggestLevel(log, "12k")).toBeNull();
    }
  });
});
