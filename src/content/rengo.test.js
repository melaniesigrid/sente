import { describe, it, expect } from "vitest";
import {
  PARTNER_RANK, PARTNER_RANKS, partnersFor, pairRoster, rosterFromSaved, opponentSeatOf,
  seatAsk, seatWeights, seatPersona, seatRating, teamLine, pairCaption, pairStatus, seatLine,
} from "./rengo.js";
import { PERSONAS } from "./personas.js";
import { rosterSeats, isPair, rosterPlayers, seatToPlay, DEFAULT_PARTNER_RANK } from "../engine/rengo.js";
import { createGame, play } from "../engine/record.js";
import { ratingOfRank, rankOf } from "./rank.js";

const profile = { name: "Mel", tint: "mint", rating: ratingOfRank("12k"), rd: 60 };
const tetsu = PERSONAS.find((p) => p.id === "tetsu");
const seat = (partnerRank = PARTNER_RANK) =>
  pairRoster({ profile, persona: tetsu, partnerRank });

describe("the partner rank", () => {
  it("is the engine's number, not a second copy of it", () => {
    // The server seats an online pair table and may import from the engine alone,
    // so the constant lives there. Two "7d"s that drift apart is the failure.
    expect(PARTNER_RANK).toBe(DEFAULT_PARTNER_RANK);
  });
  it("defaults to a player worth watching and offers a range of them", () => {
    expect(PARTNER_RANK).toBe("7d");
    expect(PARTNER_RANKS).toContain(PARTNER_RANK);
    expect(PARTNER_RANKS.every((r) => /^\d+d$/.test(r))).toBe(true);
  });
});

describe("partnersFor", () => {
  it("returns two different house players", () => {
    const [a, b] = partnersFor("7d");
    expect(a.id).not.toBe(b.id);
  });
  it("never returns a house player it was told to leave out", () => {
    const [a, b] = partnersFor("7d");
    const [c, d] = partnersFor("7d", [a.id]);
    expect([c.id, d.id]).not.toContain(a.id);
    expect(c.id).toBe(b.id);
  });
  it("is deterministic: the same rank always seats the same two", () => {
    expect(partnersFor("5d").map((p) => p.id)).toEqual(partnersFor("5d").map((p) => p.id));
  });
});

describe("pairRoster", () => {
  it("seats four: you, the opponent, and a partner each", () => {
    const r = seat();
    expect(rosterSeats(r)).toEqual(["b1", "w1", "b2", "w2"]);
    expect(isPair(r)).toBe(true);
  });
  it("puts you in b1 at your own rank, and nobody else is a human", () => {
    const r = seat();
    expect(r.b1).toMatchObject({ kind: "human", name: "Mel", rank: rankOf(profile.rating), you: true });
    for (const id of ["w1", "b2", "w2"]) expect(r[id].kind).toBe("bot");
  });
  it("seats the opponent you picked, playing at your level", () => {
    expect(seat().w1).toMatchObject({ name: tetsu.name, rank: "12k", personaId: "tetsu" });
  });
  it("mirrors the two teams: your opposite number is always at your own rank", () => {
    /* The opposing side is not a pair of dan players. It is your opposite number
       and their partner, exactly as your side is, and that is what makes the
       table a game rather than an exhibition. It is a rule, not a default, so a
       different profile moves the seat with it. */
    for (const label of ["25k", "12k", "4k", "1d", "6d"]) {
      const r = pairRoster({ profile: { ...profile, rating: ratingOfRank(label) }, persona: tetsu });
      expect(r.w1.rank).toBe(label);
      expect(r.b1.rank).toBe(label);
      expect(r.b2.rank).toBe(r.w2.rank);
    }
  });
  it("gives both partners the same strength: a stronger partner on one side is a handicap nobody agreed to", () => {
    const r = seat();
    expect(r.b2.rank).toBe(PARTNER_RANK);
    expect(r.w2.rank).toBe(PARTNER_RANK);
  });
  it("never seats the opponent as a partner, and never the same house player twice", () => {
    // Kaede is at home at 7d, so picking her as the opponent is the case that would collide.
    const kaede = PERSONAS.find((p) => p.id === "kaede");
    const r = pairRoster({ profile, persona: kaede, partnerRank: "7d" });
    const ids = ["w1", "b2", "w2"].map((id) => r[id].personaId);
    expect(new Set(ids).size).toBe(3);
    expect(ids.filter((id) => id === "kaede")).toHaveLength(1);
  });
  it("takes the partner rank it is given", () => {
    expect(seat("1d").b2.rank).toBe("1d");
  });
  it("names the four in the SGF, bots marked as bots", () => {
    const { b, w } = rosterPlayers(seat());
    expect(b).toMatch(/^Mel 12k & \w+ 7d \(bot\)$/);
    expect(w).toMatch(/^Tetsu 12k \(bot\) & \w+ 7d \(bot\)$/);
  });
});

describe("rosterFromSaved", () => {
  it("rebuilds the same four from the persona id and the partner rank alone", () => {
    // Your opposite number's level is not stored: it is not a choice, it is
    // whatever your level is when you sit back down.
    const saved = { personaId: "tetsu", partnerRank: "7d" };
    expect(rosterFromSaved(saved, profile)).toEqual(seat());
  });
  it("gives up rather than guess when the house player has gone", () => {
    expect(rosterFromSaved({ personaId: "nobody", rank: "12k" }, profile)).toBe(null);
  });
});

describe("who a seat is answering", () => {
  it("is the player about to reply, not the one across the board", () => {
    const r = seat();
    expect(opponentSeatOf(r, "b1")).toBe("w1");
    expect(opponentSeatOf(r, "w1")).toBe("b2");
    expect(opponentSeatOf(r, "w2")).toBe("b1");
  });
  it("tells the network both ranks, so a 7 dan is not asked to imitate a 12 kyu", () => {
    const r = seat();
    expect(seatAsk(r, "b2")).toMatchObject({ rank: "7d", oppRank: "7d" });
    expect(seatAsk(r, "w1")).toMatchObject({ rank: "12k", oppRank: "7d" });
    expect(seatAsk(r, "w2")).toMatchObject({ rank: "7d", oppRank: "12k" });
  });
  it("carries the persona's temperature, so a seat still plays in character", () => {
    expect(seatAsk(seat(), "w1").temperature).toBe(tetsu.profile.temperature);
  });
  it("follows the rotation when White opens", () => {
    expect(opponentSeatOf(seat(), "w1", "w")).toBe("b1");
  });
});

describe("a seat's house player", () => {
  it("hands back the persona behind a bot seat, and nothing for a human one", () => {
    expect(seatPersona(seat(), "w1").id).toBe("tetsu");
    expect(seatPersona(seat(), "b1")).toBe(null);
  });
  it("gives the heuristic fallback that persona's weights", () => {
    expect(seatWeights(seat(), "w1")).toBe(tetsu.weights);
    expect(seatWeights(seat(), "b1")).toEqual({});
  });
  it("rates a seat by its rank", () => {
    expect(seatRating(seat().b2)).toBe(ratingOfRank("7d"));
    expect(seatRating({ kind: "bot", name: "x" })).toBe(null);
  });
});

describe("the words at a pair table", () => {
  it("names a team as its two players", () => {
    expect(teamLine(seat(), "b")).toMatch(/^Mel & \w+$/);
  });
  it("says unrated in the caption, not in a footnote", () => {
    const line = pairCaption({ size: 19, komi: 7.5, partnerRank: "7d", myRank: "12k" });
    expect(line).toContain("unrated");
    expect(line).toContain("partners at 7d");
    expect(line).toContain("12k each side");
    expect(line).toContain("19×19");
  });
  it("says whose move it is by name, because a colour names two people here", () => {
    const r = seat();
    expect(pairStatus({ roster: r, seatId: "b1", phase: "playing" })).toBe("Your move");
    expect(pairStatus({ roster: r, seatId: "w1", phase: "playing" })).toBe("Tetsu to move");
    expect(pairStatus({ roster: r, seatId: "w1", phase: "playing", thinking: true }))
      .toBe("Tetsu is thinking…");
    expect(pairStatus({ roster: r, seatId: "w1", phase: "playing", thinking: true, loading: "12 / 53 MB" }))
      .toBe("Tetsu is warming up… 12 / 53 MB");
  });
  it("gives way to the result and to the count", () => {
    const r = seat();
    expect(pairStatus({ roster: r, seatId: "b1", phase: "ended", result: {}, resultLine: "Black wins · 44 : 40" }))
      .toBe("Black wins · 44 : 40");
    expect(pairStatus({ roster: r, seatId: null, phase: "scoring" })).toBe("Mark dead stones, then accept");
  });
  it("attributes a move to a player and a colour both", () => {
    expect(seatLine(seat(), "b2")).toMatch(/^\w+ · Black$/);
    expect(seatLine(seat(), "w1")).toBe("Tetsu · White");
  });
});

describe("a pair roster against a live record", () => {
  it("rotates you, them, your partner, their partner", () => {
    const roster = seat();
    let rec = createGame({ size: 9 });
    const order = [];
    for (let i = 0; i < 4; i++) {
      order.push(roster[seatToPlay(roster, rec)].name);
      rec = play(rec, i, 0);
    }
    expect(order[0]).toBe("Mel");
    expect(order[1]).toBe("Tetsu");
    expect(order[2]).toBe(roster.b2.name);
    expect(order[3]).toBe(roster.w2.name);
  });
});
