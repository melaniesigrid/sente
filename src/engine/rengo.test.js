import { describe, it, expect } from "vitest";
import {
  SEAT_IDS, RosterError, colorOfSeat, partnerSeat, createRoster, isPair, rosterSeats,
  teamSeats, rotationOf, seatAt, seatToPlay, canSeatPlay, humanSeats, rosterPlayers,
} from "./rengo.js";
import { createGame, play, pass, undo, resign } from "./record.js";

const you = { kind: "human", name: "You", rank: "12k" };
const partner = { kind: "bot", name: "Kaede", rank: "7d" };
const opp = { kind: "bot", name: "Tetsu", rank: "12k" };
const theirs = { kind: "bot", name: "Sora", rank: "7d" };
const pairRoster = () => createRoster({ b1: you, w1: opp, b2: partner, w2: theirs });
const soloRoster = () => createRoster({ b1: you, w1: opp });

describe("seat ids", () => {
  it("rotate black, white, black's partner, white's partner", () => {
    expect(SEAT_IDS).toEqual(["b1", "w1", "b2", "w2"]);
  });
  it("know their colour and their partner", () => {
    expect(SEAT_IDS.map(colorOfSeat)).toEqual(["b", "w", "b", "w"]);
    expect(partnerSeat("b1")).toBe("b2");
    expect(partnerSeat("w2")).toBe("w1");
    expect(partnerSeat("nobody")).toBe(null);
  });
});

describe("createRoster", () => {
  it("keeps a two-seat and a four-seat roster", () => {
    expect(rosterSeats(soloRoster())).toEqual(["b1", "w1"]);
    expect(rosterSeats(pairRoster())).toEqual(["b1", "w1", "b2", "w2"]);
    expect(isPair(soloRoster())).toBe(false);
    expect(isPair(pairRoster())).toBe(true);
  });
  it("refuses a roster with nobody on a side", () => {
    expect(() => createRoster({ b1: you })).toThrow(RosterError);
    expect(() => createRoster({ w1: opp })).toThrow(RosterError);
  });
  it("refuses two against one: teams are the same size or it is not a game", () => {
    expect(() => createRoster({ b1: you, w1: opp, b2: partner })).toThrow(/same number/);
    expect(() => createRoster({ b1: you, w1: opp, w2: theirs })).toThrow(/same number/);
  });
  it("refuses a seat that is neither a human nor a bot, or has no name", () => {
    expect(() => createRoster({ b1: { kind: "ghost", name: "?" }, w1: opp })).toThrow(/human.*bot/);
    expect(() => createRoster({ b1: { kind: "human", name: "" }, w1: opp })).toThrow(/name/);
  });
  it("carries anything else on a seat verbatim, the way the record carries players", () => {
    const r = createRoster({ b1: { ...you, tint: "mint", personaId: null }, w1: { ...opp, personaId: "tetsu" } });
    expect(r.b1.tint).toBe("mint");
    expect(r.w1.personaId).toBe("tetsu");
  });
  it("ignores anything that is not a seat id", () => {
    const r = createRoster({ b1: you, w1: opp, b3: partner, spectator: partner });
    expect(Object.keys(r)).toEqual(["b1", "w1"]);
  });
});

describe("the rotation", () => {
  it("is b1 w1 b2 w2 in an even pair game", () => {
    expect(rotationOf(pairRoster(), "b")).toEqual(["b1", "w1", "b2", "w2"]);
  });
  it("leads each team with its first player when White opens after a handicap", () => {
    expect(rotationOf(pairRoster(), "w")).toEqual(["w1", "b1", "w2", "b2"]);
  });
  it("alternates colour whoever opens: no team ever plays twice running", () => {
    for (const first of ["b", "w"]) {
      const colors = rotationOf(pairRoster(), first).map(colorOfSeat);
      expect(colors).toEqual(first === "b" ? ["b", "w", "b", "w"] : ["w", "b", "w", "b"]);
    }
  });
  it("gives each player exactly half of their team's moves", () => {
    const rot = rotationOf(pairRoster(), "b");
    expect(teamSeats(pairRoster(), "b")).toEqual(["b1", "b2"]);
    expect(rot.filter((s) => s === "b1")).toHaveLength(1);
    expect(rot.filter((s) => s === "b2")).toHaveLength(1);
  });
  it("is just the two players in an ordinary game", () => {
    expect(rotationOf(soloRoster(), "b")).toEqual(["b1", "w1"]);
    expect(rotationOf(soloRoster(), "w")).toEqual(["w1", "b1"]);
  });
});

describe("seatAt", () => {
  it("walks the rotation and wraps", () => {
    const r = pairRoster();
    expect([0, 1, 2, 3, 4, 5].map((i) => seatAt(r, i, "b")))
      .toEqual(["b1", "w1", "b2", "w2", "b1", "w1"]);
  });
  it("refuses a move index that is not a move number", () => {
    expect(() => seatAt(pairRoster(), -1)).toThrow(RangeError);
    expect(() => seatAt(pairRoster(), 1.5)).toThrow(RangeError);
  });
});

describe("a seat against a live record", () => {
  it("agrees with the colour the record is waiting for, move after move", () => {
    const roster = pairRoster();
    let rec = createGame({ size: 9 });
    const played = [];
    for (let i = 0; i < 8; i++) {
      const seat = seatToPlay(roster, rec);
      played.push(seat);
      expect(colorOfSeat(seat)).toBe(rec.toPlay);
      rec = play(rec, i % 9, Math.floor(i / 9) + 1);
    }
    expect(played).toEqual(["b1", "w1", "b2", "w2", "b1", "w1", "b2", "w2"]);
  });
  it("counts a pass as a turn, because in pair go it is your turn you are passing", () => {
    const roster = pairRoster();
    let rec = createGame({ size: 9 });
    rec = pass(rec);
    expect(seatToPlay(roster, rec)).toBe("w1");
  });
  it("starts with White after a handicap", () => {
    const roster = pairRoster();
    const rec = createGame({ size: 9, handicap: 4 });
    expect(rec.toPlay).toBe("w");
    expect(seatToPlay(roster, rec)).toBe("w1");
  });
  it("rewinds the seat when a move is taken back, because the seat is not state", () => {
    const roster = pairRoster();
    let rec = createGame({ size: 9 });
    rec = play(rec, 2, 2);
    rec = play(rec, 6, 6);
    expect(seatToPlay(roster, rec)).toBe("b2");
    rec = undo(rec);
    expect(seatToPlay(roster, rec)).toBe("w1");
    rec = undo(rec);
    expect(seatToPlay(roster, rec)).toBe("b1");
  });
  it("has nobody to play once the game is over", () => {
    const roster = pairRoster();
    const rec = resign(createGame({ size: 9 }), "b");
    expect(seatToPlay(roster, rec)).toBe(null);
    expect(canSeatPlay(roster, rec, "b1")).toBe(false);
  });
  it("lets exactly one seat move, and no seat that is not at the table", () => {
    const roster = pairRoster();
    const rec = createGame({ size: 9 });
    expect(SEAT_IDS.filter((id) => canSeatPlay(roster, rec, id))).toEqual(["b1"]);
    expect(canSeatPlay(soloRoster(), rec, "b2")).toBe(false);
  });
});

describe("who is a human", () => {
  it("lists the human seats in rotation order", () => {
    expect(humanSeats(pairRoster())).toEqual(["b1"]);
    expect(humanSeats(createRoster({ b1: you, w1: { ...you, name: "Them" }, b2: partner, w2: theirs })))
      .toEqual(["b1", "w1"]);
  });
});

describe("rosterPlayers", () => {
  it("names a team as its two players, and says which of them are bots", () => {
    expect(rosterPlayers(pairRoster())).toEqual({
      b: "You 12k & Kaede 7d (bot)",
      w: "Tetsu 12k (bot) & Sora 7d (bot)",
    });
  });
  it("names a single player on each side in an ordinary game", () => {
    expect(rosterPlayers(soloRoster())).toEqual({ b: "You 12k", w: "Tetsu 12k (bot)" });
  });
  it("leaves out a rank nobody has", () => {
    expect(rosterPlayers(createRoster({ b1: { kind: "human", name: "You" }, w1: { kind: "bot", name: "Moku" } })))
      .toEqual({ b: "You", w: "Moku (bot)" });
  });
});
