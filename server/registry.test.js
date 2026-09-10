import { describe, it, expect } from "vitest";
import { cleanKey, publicPlayer, hasPlayed } from "./players.js";

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
});

describe("hasPlayed", () => {
  it("is true only once a rated game is finished", () => {
    expect(hasPlayed({ wins: 0, losses: 0, draws: 0 })).toBe(false);
    expect(hasPlayed({ wins: 0, losses: 0 })).toBe(false);
    expect(hasPlayed({ wins: 1, losses: 0, draws: 0 })).toBe(true);
    expect(hasPlayed({ wins: 0, losses: 0, draws: 1 })).toBe(true);
  });
});
