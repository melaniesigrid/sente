import { describe, it, expect } from "vitest";
import { cleanKey, publicPlayer, hasPlayed, reseeded } from "./players.js";

describe("rendezvous keys", () => {
  it("keeps a plain word, folded and trimmed", () => {
    expect(cleanKey("  Tea Time!  ")).toBe("teatime");
    expect(cleanKey("game-7_b")).toBe("game-7_b");
  });
  it("is null for anything that is not a word", () => {
    for (const v of [null, undefined, 7, "", "   ", "!!!", {}]) expect(cleanKey(v)).toBeNull();
  });
  it("caps the length", () => {
    expect(cleanKey("x".repeat(80))).toHaveLength(32);
  });
});

describe("publicPlayer", () => {
  it("never carries the token hash or the volatility, and rounds the numbers", () => {
    const out = publicPlayer({
      id: "p_1", name: "Ada", tint: "coral", tokenHash: "secret",
      rating: 1512.7, rd: 190.2, vol: 0.06, wins: 1, losses: 2, draws: 0, claimedFrom: "1.2.3.4",
      createdAt: 1, lastSeen: 2,
    });
    expect(out.tokenHash).toBeUndefined();
    expect(out.vol).toBeUndefined();
    expect(out.claimedFrom).toBeUndefined();
    expect(out).toMatchObject({ id: "p_1", name: "Ada", rating: 1513, rd: 190, wins: 1, losses: 2, draws: 0 });
  });
  it("treats a missing draw count as zero", () => {
    expect(publicPlayer({ rating: 1500, rd: 350, wins: 0, losses: 0 }).draws).toBe(0);
  });

  /* `showOnline` lets a player refuse to say when they are here. `lastSeen`
     moves on nearly everything they do, so serving it to the millisecond let
     anybody rebuild that answer by polling a profile in a loop. It is served
     to the day instead: the same bucket `seenText` already speaks in. */
  it("serves lastSeen to the day, so polling a profile cannot rebuild presence", () => {
    const morning = Date.UTC(2026, 8, 13, 9, 41, 17, 250);
    const evening = Date.UTC(2026, 8, 13, 22, 58, 4, 900);
    const base = { rating: 1500, rd: 350, wins: 0, losses: 0 };
    const seen = (at) => publicPlayer({ ...base, lastSeen: at }).lastSeen;
    expect(seen(morning)).toBe(Date.UTC(2026, 8, 13));
    expect(seen(morning)).toBe(seen(evening));
    // Which day it was still survives, because "has not played since March" is
    // a fair thing to know before asking somebody for a game.
    expect(seen(Date.UTC(2026, 8, 12, 23, 59, 59, 999))).toBe(Date.UTC(2026, 8, 12));
  });

  it("leaves createdAt exact: it never moves, and the operator's list sorts on it", () => {
    const at = Date.UTC(2026, 8, 13, 9, 41, 17, 250);
    expect(publicPlayer({ rating: 1500, rd: 350, wins: 0, losses: 0, createdAt: at }).createdAt).toBe(at);
  });

  it("passes a missing or nonsense lastSeen through rather than inventing a day", () => {
    const base = { rating: 1500, rd: 350, wins: 0, losses: 0 };
    expect(publicPlayer(base).lastSeen).toBeUndefined();
    expect(publicPlayer({ ...base, lastSeen: null }).lastSeen).toBeNull();
  });
});

describe("reseeded", () => {
  const seat = { rating: 1219, rd: 350, vol: 0.06 };
  const ada = {
    id: "p_1", name: "Ada", tint: "coral", email: "ada@example.com", pw: "hash",
    rating: 1680, rd: 62, vol: 0.055, wins: 9, losses: 4, draws: 1, createdAt: 1, lastSeen: 2,
  };
  it("puts the rating and the record back to the newcomer's seat", () => {
    expect(reseeded(ada, seat)).toMatchObject({ ...seat, wins: 0, losses: 0, draws: 0 });
  });
  it("leaves everything that makes them who they are alone", () => {
    const out = reseeded(ada, seat);
    expect(out).toMatchObject({ id: "p_1", name: "Ada", tint: "coral", email: "ada@example.com", pw: "hash", createdAt: 1 });
  });
  it("takes a player off the ladder again, because they have not played", () => {
    expect(hasPlayed(ada)).toBe(true);
    expect(hasPlayed(reseeded(ada, seat))).toBe(false);
  });
});

describe("hasPlayed", () => {
  it("is true only once a rated game is finished", () => {
    expect(hasPlayed({ wins: 0, losses: 0, draws: 0 })).toBe(false);
    expect(hasPlayed({ wins: 0, losses: 0 })).toBe(false);
    expect(hasPlayed({ wins: 1, losses: 0, draws: 0 })).toBe(true);
    expect(hasPlayed({ wins: 0, losses: 0, draws: 1 })).toBe(true);
  });
});
