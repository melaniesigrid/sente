import { describe, it, expect } from "vitest";
import { RANK_LADDER } from "./rank.js";
import {
  duelSeed, duelPersona, duelMode, duelRank, duelState, startDuel, duelOutcome, recordDuel, duelShareText, duelShareUrl, duelResultText,
} from "./duel.js";
import { createGame, play, pass, resign, acceptScore } from "../engine/index.js";

const personas = [{ id: "a" }, { id: "b" }, { id: "c" }];
const fresh = { duelStarted: "", duelDate: "", duelResult: "", duelPlayed: 0, duelWins: 0, duelStreak: 0, duelBestStreak: 0 };

const scoredGame = () => {
  let rec = createGame({ size: 9 });
  rec = play(rec, 4, 4); rec = play(rec, 2, 2); rec = pass(rec); rec = pass(rec);
  return acceptScore(rec);
};

describe("daily duel", () => {
  it("seeds and hosts are fixed per day and vary across days", () => {
    expect(duelSeed("2026-09-09")).toBe(duelSeed("2026-09-09"));
    expect(duelSeed("2026-09-09")).not.toBe(duelSeed("2026-09-10"));
    expect(duelPersona(personas, "2026-09-09")).toBe(duelPersona(personas, "2026-09-09"));
    const hosts = new Set(Array.from({ length: 30 }, (_, i) => duelPersona(personas, `2026-09-${String(i + 1).padStart(2, "0")}`).id));
    expect(hosts.size).toBeGreaterThan(1);
    expect(duelPersona([], "2026-09-09")).toBeNull();
    expect(duelMode([], "2026-09-09")).toBeNull();
    const mode = duelMode(personas, "2026-09-09");
    expect(mode).toEqual({ kind: "duel", persona: duelPersona(personas, "2026-09-09"), seed: duelSeed("2026-09-09"), key: "2026-09-09", rank: duelRank(mode.persona, "2026-09-09"), size: 9, handicap: 0 });
  });
  it("reads a scored outcome from Black's chair", () => {
    const o = duelOutcome(scoredGame());
    expect(o.method).toBe("score");
    expect(o.moves).toBe(2);
    expect(o.code).toMatch(/^[BW]\+\d+(\.\d+)?$/);
    expect(typeof o.won).toBe("boolean");
  });
  it("reads a resignation and an unfinished game", () => {
    let rec = createGame({ size: 9 });
    rec = play(rec, 4, 4);
    expect(duelOutcome(rec)).toBeNull();
    const o = duelOutcome(resign(rec, "b"));
    expect(o).toMatchObject({ won: false, method: "resign", code: "W+R", moves: 1 });
  });
  it("starting is the attempt: open, then playing, then done", () => {
    let p = { ...fresh };
    expect(duelState(p, "2026-09-07")).toBe("open");
    p = { ...p, ...startDuel(p, "2026-09-07") };
    expect(duelState(p, "2026-09-07")).toBe("playing");
    expect(startDuel(p, "2026-09-07")).toEqual({});
    p = { ...p, ...recordDuel(p, "2026-09-07", { won: true, code: "B+3.5" }) };
    expect(duelState(p, "2026-09-07")).toBe("done");
    expect(duelState(p, "2026-09-08")).toBe("open");
    // An abandoned day stays "playing" until midnight and never becomes a result.
    p = { ...p, ...startDuel(p, "2026-09-08") };
    expect(duelState(p, "2026-09-08")).toBe("playing");
    expect(duelState(p, "2026-09-09")).toBe("open");
  });
  it("records one result a day and keeps a streak of wins", () => {
    let p = { ...fresh };
    p = { ...p, ...recordDuel(p, "2026-09-07", { won: true, code: "B+3.5" }) };
    expect(p).toMatchObject({ duelStarted: "2026-09-07", duelDate: "2026-09-07", duelResult: "B+3.5", duelPlayed: 1, duelWins: 1, duelStreak: 1, duelBestStreak: 1 });
    expect(recordDuel(p, "2026-09-07", { won: false, code: "W+R" })).toEqual({});
    p = { ...p, ...startDuel(p, "2026-09-08") };
    p = { ...p, ...recordDuel(p, "2026-09-08", { won: true, code: "B+1.5" }) };
    expect(p.duelStreak).toBe(2);
    p = { ...p, ...recordDuel(p, "2026-09-09", { won: false, code: "W+4.5" }) };
    expect(p).toMatchObject({ duelPlayed: 3, duelWins: 2, duelStreak: 0, duelBestStreak: 2 });
    p = { ...p, ...recordDuel(p, "2026-09-10", { won: true, code: "B+0.5" }) };
    expect(p.duelStreak).toBe(1);
    p = { ...p, ...recordDuel(p, "2026-09-12", { won: true, code: "B+0.5" }) };
    expect(p.duelStreak).toBe(1);
    p = { ...p, ...recordDuel(p, "2026-09-13", { won: null, code: "Jigo" }) };
    expect(p.duelStreak).toBe(1);   // a draw carries the streak
    expect(p.duelWins).toBe(4);
    p = { ...p, ...recordDuel(p, "2026-09-15", { won: null, code: "Jigo" }) };
    expect(p.duelStreak).toBe(0);   // but a missed day still ends it
  });
  it("formats the share text and the card line", () => {
    expect(duelShareText({ key: "2026-09-09", personaName: "Tetsu", code: "B+12.5", moves: 41, url: "https://x/" }))
      .toBe("Joseki Daily Duel · 2026-09-09\nvs Tetsu (house bot) · B+12.5 in 41 moves\nhttps://x/");
    expect(duelShareText({ key: "2026-09-09", personaName: "Tetsu", code: "W+R", moves: 0 }))
      .toBe("Joseki Daily Duel · 2026-09-09\nvs Tetsu (house bot) · W+R");
    expect(duelResultText("B+12.5")).toBe("Won by 12.5");
    expect(duelResultText("W+R")).toBe("Lost by resignation");
    expect(duelResultText("Jigo")).toBe("Jigo");
    expect(duelResultText("")).toBe("");
    expect(duelShareUrl({ origin: "https://x.dev", pathname: "/sente/", hash: "#secret" })).toBe("https://x.dev/sente/");
    expect(duelShareUrl(undefined)).toBe("");
  });
});

describe("duelRank", () => {
  const host = { range: ["15k", "1k"] };
  it("is inside the host's home range and fixed by the day", () => {
    const seen = new Set();
    for (let i = 1; i <= 28; i++) {
      const r = duelRank(host, `2026-02-${String(i).padStart(2, "0")}`);
      expect(RANK_LADDER.indexOf(r)).toBeGreaterThanOrEqual(RANK_LADDER.indexOf("15k"));
      expect(RANK_LADDER.indexOf(r)).toBeLessThanOrEqual(RANK_LADDER.indexOf("1k"));
      seen.add(r);
    }
    expect(seen.size).toBeGreaterThan(1);
    expect(duelRank(host, "2026-09-09")).toBe(duelRank(host, "2026-09-09"));
    expect(duelRank({}, "2026-09-09")).toBe("25k");
  });
});
