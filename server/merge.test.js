import { describe, it, expect } from "vitest";
import { reseat, reseatSummary, reseatRoom, mergedGames, mergedRecord, mergedFeatured } from "./merge.js";
import { createRoom, seatOf, controls } from "./room.js";

const A = { id: "a", name: "Ada", tint: "coral", rating: 1500, rd: 350 };
const B = { id: "b", name: "Bea", tint: "sky", rating: 1600, rd: 100 };
const Z = { id: "z", name: "Zed", tint: "moss", avatarAt: 7 };

describe("reseat", () => {
  it("swaps the old person for the new one and leaves everybody else alone", () => {
    expect(reseat({ id: "b", name: "Bea", tint: "sky" }, "b", Z)).toEqual({ id: "z", name: "Zed", tint: "moss", avatarAt: 7 });
    const other = { id: "a", name: "Ada" };
    expect(reseat(other, "b", Z)).toBe(other);
    expect(reseat(null, "b", Z)).toBe(null);
  });

  it("rewrites the lead seats and the teams of a summary", () => {
    const sum = { id: "g1", black: A, white: B, teams: { b: [A], w: [B, { id: "d", name: "Dee" }] } };
    const out = reseatSummary(sum, "b", Z);
    expect(out.white.id).toBe("z");
    expect(out.black).toBe(A);
    expect(out.teams.w.map((e) => e.id)).toEqual(["z", "d"]);
    expect(reseatSummary({ id: "g2", black: A, white: B }, "b", Z).teams).toBeUndefined();
  });
});

describe("reseatRoom", () => {
  it("gives the old person's chair to the new one, so the new id holds the seat", () => {
    const room = createRoom({ id: "g1", size: 9, black: A, white: B, now: 1 });
    const out = reseatRoom(room, "b", Z);
    expect(seatOf(out, "z")).toBe("w1");
    expect(seatOf(out, "b")).toBe(null);
    expect(out.seats.w1.name).toBe("Zed");
    expect(out.seats.b1).toBe(room.seats.b1);
    // The record itself is history and is not rewritten.
    expect(out.record).toBe(room.record);
  });

  it("is the same object when the old person never sat here", () => {
    const room = createRoom({ id: "g1", size: 9, black: A, white: B, now: 1 });
    expect(reseatRoom(room, "nobody", Z)).toBe(room);
  });

  it("hands a partner the old person's browser ran to the new id", () => {
    const bot = { id: "bot1", name: "Tatsuo", kind: "bot", rank: "7d", rating: 2000, rd: 60 };
    const room = createRoom({ id: "g1", size: 9, black: A, white: B, blackPartner: bot, whitePartner: { ...bot, id: "bot2" }, now: 1 });
    const out = reseatRoom(room, "a", Z);
    expect(out.seats.b2.runBy).toBe("z");
    expect(out.seats.w2.runBy).toBe("b");
    expect(controls(out, "z")).toEqual(["b1", "b2"]);
  });
});

describe("mergedGames", () => {
  const g = (id, at, white = B) => ({ id, black: A, white, updatedAt: at });
  it("folds the other list in, once each, newest first, capped", () => {
    const mine = [g("g3", 30), g("g1", 10)];
    const theirs = [g("g4", 40), g("g1", 11), g("g2", 20)];
    const out = mergedGames(mine, theirs, "b", Z, 3);
    expect(out.map((x) => x.id)).toEqual(["g4", "g3", "g2"]);
    // The row that came across is rewritten; the survivor's own rows are not.
    expect(out[0].white.id).toBe("z");
    expect(out[1].white.id).toBe("b");
  });
  it("keeps the survivor's copy of a game both have", () => {
    const out = mergedGames([g("g1", 10)], [g("g1", 99)], "b", Z, 24);
    expect(out).toHaveLength(1);
    expect(out[0].updatedAt).toBe(10);
  });
});

describe("mergedRecord", () => {
  const into = { id: "z", rating: 1381, rd: 290, vol: 0.06, wins: 1, losses: 0, draws: 0, createdAt: 500, lastSeen: 900, avatarAt: null, email: "z@example.com", pw: { x: 1 }, sessions: ["h"] };
  const from = { id: "b", rating: 1280, rd: 314, vol: 0.06, wins: 1, losses: 2, createdAt: 100, lastSeen: 300, avatarAt: 42 };
  it("sums the record and keeps the survivor's rating, address, password and sessions", () => {
    const out = mergedRecord(into, from);
    expect(out).toMatchObject({ wins: 2, losses: 2, draws: 0, rating: 1381, rd: 290, email: "z@example.com", pw: { x: 1 }, sessions: ["h"] });
  });
  it("takes the earlier birthday, the later visit, and a picture only if the survivor had none", () => {
    const out = mergedRecord(into, from);
    expect(out.createdAt).toBe(100);
    expect(out.lastSeen).toBe(900);
    expect(out.avatarAt).toBe(42);
    expect(mergedRecord({ ...into, avatarAt: 9 }, from).avatarAt).toBe(9);
  });
});

describe("mergedFeatured", () => {
  it("keeps the survivor's pins first and fills from the other's, never past the cap", () => {
    const mine = [{ id: "g1", note: "mine", at: 1 }];
    const theirs = [{ id: "g1", note: "theirs", at: 2 }, { id: "g2", note: "", at: 3 }, { id: "g3", note: "", at: 4 }, { id: "g4", note: "", at: 5 }];
    const out = mergedFeatured(mine, theirs);
    expect(out.map((e) => e.id)).toEqual(["g1", "g2", "g3"]);
    expect(out[0].note).toBe("mine");
  });
});
