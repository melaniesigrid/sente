/* The record importer writes points and nothing else. That is not a style choice: a
   game record is a fact and carries no rights, and the commentary published beside
   one is somebody's writing and is in copyright. Several of the SGF files this was
   run against ship a professional's match commentary inside them, so the only way
   the shelf can promise that every word of analysis on it is its own is for the
   generator to be incapable of carrying the other kind. This file holds that line,
   and the three refusals that keep a bad record out of the shelf: a board that is
   not 19x19, a record that starts from a position rather than an empty board, and
   colours that do not alternate. */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  repairRoot, alternates, packMoves, seatOf, seatsOf, readGame, render,
} from "./import.mjs";

const sgf = (body, root = "SZ[19]KM[7.5]") => `(;${root}${body})`;
const moves = (...pts) => pts.map((p, i) => `;${i % 2 === 0 ? "B" : "W"}[${p}]`).join("");

afterEach(() => vi.restoreAllMocks());

describe("the root node repair", () => {
  /* Two of the Wuzhen records in the wild open `(EV[...` instead of `(;EV[...`. The
     parser stays strict, so the repair is here, named, and only for that shape. */
  it("puts back the semicolon two records in the wild are missing", () => {
    expect(repairRoot("(EV[Wuzhen];B[pd])")).toBe("(;EV[Wuzhen];B[pd])");
    expect(repairRoot("﻿(EV[Wuzhen])")).toBe("(;EV[Wuzhen])");
    expect(repairRoot("\n  (EV[x])")).toBe("(;EV[x])");
  });

  it("leaves a well-formed file exactly as it found it", () => {
    const good = "(;EV[Seoul];B[pd])";
    expect(repairRoot(good)).toBe(good);
  });
});

describe("the colour of a move", () => {
  it("is its position, when the record alternates from black", () => {
    expect(alternates([{ color: "b" }, { color: "w" }, { color: "b" }])).toBe(true);
    expect(alternates([{ color: "b" }])).toBe(true);
  });

  /* Go is symmetric apart from the komi, so a white-first record replays through the
     rules without complaint and puts the wrong name on every stone: the two players
     swap on the card and the winner of a resignation comes out backwards. The only
     place to catch it is here, before it is written down. */
  it("refuses a record that starts with white, however well it alternates", () => {
    expect(alternates([{ color: "w" }, { color: "b" }])).toBe(false);
    expect(alternates([{ color: "w" }, { color: "b" }, { color: "w" }])).toBe(false);
  });

  it("cannot be, when it does not", () => {
    expect(alternates([{ color: "b" }, { color: "b" }])).toBe(false);
    expect(alternates([{ color: "b" }, { color: "w" }, { color: "w" }])).toBe(false);
    expect(alternates([]), "and a record with no moves is not a record").toBe(false);
  });
});

describe("packing the moves", () => {
  it("writes two characters a move, in the order they were played", () => {
    expect(packMoves([{ c: 3, r: 3 }, { c: 15, r: 3 }])).toBe("ddpd");
  });

  it("writes a pass as a pair of dots, which is not a point", () => {
    const packed = packMoves([{ c: 3, r: 3 }, { pass: true }, { c: 15, r: 3 }]);
    expect(packed).toBe("dd..pd");
    expect(packed.length).toBe(6);
  });
});

describe("whose hand placed the stone", () => {
  it("reads the one sentence a pair go record uses, and only that one", () => {
    expect(seatOf("This move by black is played by Gu Li.")).toBe("Gu Li");
    expect(seatOf("This move by white is played by Lian Xiao")).toBe("Lian Xiao");
    expect(seatOf("  This move by BLACK is played by Alphago.  ")).toBe("Alphago");
  });

  it("refuses anything else, because anything else is commentary", () => {
    expect(seatOf("White's shape here is thin, and Black should punish it.")).toBe(null);
    expect(seatOf("")).toBe(null);
    expect(seatOf(null)).toBe(null);
  });

  it("numbers the seats against a sorted roster of the names it found", () => {
    const four = ["Gu Li", "Lian Xiao", "Alphago", "Alphago", "Gu Li"]
      .map(n => ({ comment: `This move by black is played by ${n}.` }));
    const { roster, seats } = seatsOf(four, "pair");
    expect(roster).toEqual(["Alphago", "Gu Li", "Lian Xiao"]);
    expect(seats).toEqual([1, 2, 0, 0, 1]);
    expect(seats.map(i => roster[i])).toEqual(["Gu Li", "Lian Xiao", "Alphago", "Alphago", "Gu Li"]);
  });

  it("hands back nothing, loudly, when a comment turns out to be prose", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mixed = [
      { comment: "This move by black is played by Gu Li." },
      { comment: "A famous professional thought this move was slack." },
    ];
    expect(seatsOf(mixed, "pair")).toBe(null);
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).toContain("move 2");
  });
});

describe("reading one game", () => {
  it("keeps the moves and the komi, and counts what it kept", () => {
    const g = readGame(sgf(moves("pd", "dd", "pp"), "SZ[19]KM[7.5]RU[Chinese]"), "fan-hui-1");
    expect(g).toEqual({
      id: "fan-hui-1", komi: 7.5, moves: "pdddpp", count: 3,
    });
  });

  it("carries no comment of any kind out of a file that has them", () => {
    const withProse = `(;SZ[19]KM[7.5];B[pd]C[A professional's published note about this move.];W[dd])`;
    const g = readGame(withProse, "lee-sedol-2");
    expect(g.moves).toBe("pddd");
    expect(JSON.stringify(g)).not.toMatch(/professional/i);
    /* No ruleset: RU is what one publisher typed, and the study beside the moves says
       what the match was played under. */
    expect(Object.keys(g).sort()).toEqual(["komi", "count", "id", "moves"].sort());
  });

  it("repairs a missing root semicolon on the way in", () => {
    expect(readGame(`(SZ[19]KM[7.5];B[pd];W[dd])`, "wuzhen-team").count).toBe(2);
  });

  it("refuses a board that is not the one these games were played on", () => {
    expect(() => readGame(sgf(moves("dd"), "SZ[13]"), "small")).toThrow(/13x13/);
  });

  it("refuses a record that starts from a position rather than an empty board", () => {
    expect(() => readGame(sgf(moves("dd"), "SZ[19]AB[pd][dp]"), "handi")).toThrow(/setup stones/);
  });

  it("refuses colours that do not alternate", () => {
    expect(() => readGame(`(;SZ[19];B[pd];B[dd])`, "doubled")).toThrow(/alternate/);
  });

  it("refuses a move the rules do not allow, rather than shipping it", () => {
    /* White fills the one point Black has surrounded in the corner: legal SGF,
       illegal go, and the point of replaying every move before anything is written. */
    const suicide = `(;SZ[19];B[ab];W[ss];B[ba];W[aa])`;
    expect(() => readGame(suicide, "bad")).toThrow();
  });

  it("extracts the seats only where a record is asked for them", () => {
    const pair = `(;SZ[19]KM[7.5]` +
      `;B[pd]C[This move by black is played by Gu Li.]` +
      `;W[dd]C[This move by white is played by Lian Xiao.])`;
    expect(readGame(pair, "wuzhen-pair").seats).toBeUndefined();
    const g = readGame(pair, "wuzhen-pair", { seats: true });
    expect(g.roster).toEqual(["Gu Li", "Lian Xiao"]);
    expect(g.seats).toEqual([0, 1]);
  });

  it("refuses to guess when the seats were asked for and are not there", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => readGame(sgf(moves("pd", "dd")), "pair", { seats: true }))
      .toThrow(/not seats/);
  });
});

describe("what gets written out", () => {
  const one = { id: "fan-hui-1", komi: 7.5, moves: "pdddpp", count: 3 };

  it("writes a module the shelf can import, keyed by id", async () => {
    const text = render([one]);
    expect(text).toContain("export const RECORDS = {");
    expect(text).toContain(`"fan-hui-1": {`);
    expect(text).toContain("komi: 7.5, count: 3");
    expect(text.trimEnd().endsWith("};")).toBe(true);
    /* And it is real JavaScript, not a string that looks like some. */
    const mod = await import(`data:text/javascript,${encodeURIComponent(text)}`);
    expect(mod.RECORDS["fan-hui-1"].moves).toBe("pdddpp");
  });

  it("writes the seats beside the moves, and only for a game that has them", () => {
    const paired = { ...one, id: "wuzhen-pair", roster: ["Gu Li", "Lian Xiao"], seats: [0, 1] };
    expect(render([paired])).toContain(`roster: ["Gu Li","Lian Xiao"]`);
    expect(render([paired])).toContain(`seats: [0,1]`);
    expect(render([one])).not.toContain("roster");
  });

  it("wraps a long record instead of writing one enormous line", async () => {
    const long = { ...one, moves: "pd".repeat(200), count: 200 };
    const text = render([long]);
    for (const line of text.split("\n")) expect(line.length).toBeLessThan(100);
    const mod = await import(`data:text/javascript,${encodeURIComponent(text)}`);
    expect(mod.RECORDS["fan-hui-1"].moves).toBe(long.moves);
  });

  it("says in the file itself that the words are not in it", () => {
    expect(render([one])).toMatch(/Do not edit/);
    expect(render([one])).toMatch(/copyright/);
  });
});
