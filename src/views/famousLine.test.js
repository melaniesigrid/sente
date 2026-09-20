import { describe, it, expect } from "vitest";
import {
  shelfLine, winnerName, seatsLine, notesLine, matchLine, seatLine, panelAt, chapterLine,
} from "./famousLine.js";
import { gameById, matchById, ALL_GAMES } from "../content/famous/index.js";

/* The wording of the record room, checked without rendering anything. Every helper
   takes the reader last and answers in English when nobody passes one, which is what
   makes this file possible. */

const g2 = () => gameById("lee-sedol-2");
const g4 = () => gameById("lee-sedol-4");
const pair = () => gameById("wuzhen-pair");

describe("the lines on a card", () => {
  it("names the winner of a resignation and of a count", () => {
    expect(winnerName(g2())).toBe("AlphaGo");
    expect(winnerName(g4())).toBe("Lee Sedol");
    expect(winnerName(null)).toBe("");
  });

  it("says when, how long and how it ended", () => {
    expect(shelfLine(g2())).toBe("10 March 2016 · 211 moves · AlphaGo by resignation");
    expect(shelfLine(gameById("ke-jie-1"))).toBe("23 May 2017 · 289 moves · AlphaGo by 0.5");
    expect(shelfLine(null)).toBe("");
  });

  it("puts both seats in one line with the colours named", () => {
    expect(seatsLine(g4())).toBe("AlphaGo (black) against Lee Sedol (white)");
  });

  it("counts the annotated moves", () => {
    expect(notesLine(g2())).toMatch(/^\d+ moves annotated$/);
    expect(notesLine(null)).toBe("");
  });

  it("writes a match's register", () => {
    expect(matchLine(matchById("lee-sedol"))).toBe("Seoul, 9-15 March 2016 · AlphaGo 4-1");
    expect(matchLine(null)).toBe("");
  });
});

describe("whose hand it was", () => {
  it("answers in the pair go, in rotation, and says which side", () => {
    expect(seatLine(pair(), 1)).toBe("Gu Li played this, for black");
    expect(seatLine(pair(), 2)).toBe("Lian Xiao played this, for white");
    expect(seatLine(pair(), 5)).toBe("Gu Li played this, for black");
  });

  /* The two machines carry one name, so without the colour the line cannot tell them
     apart - and telling them apart is the reason the line exists. */
  it("separates the two machines by the side they sat on", () => {
    expect(seatLine(pair(), 3)).toBe("AlphaGo played this, for black");
    expect(seatLine(pair(), 4)).toBe("AlphaGo played this, for white");
  });

  it("says nothing at all where the record does not know", () => {
    expect(seatLine(g2(), 37)).toBe(null);
    expect(seatLine(pair(), 0)).toBe(null);
    expect(seatLine(null, 4)).toBe(null);
  });
});

describe("the column beside the board", () => {
  it("carries the chapter, the note and the seat for a move", () => {
    const p = panelAt(g2(), 37);
    expect(p.phase.title).toBe("The move");
    expect(p.note).toMatch(/^P10\./);
    expect(p.seat).toBe(null);
    expect(p.atStart).toBe(false);
  });

  it("knows the empty board is the start and has no note of its own", () => {
    const p = panelAt(g2(), 0);
    expect(p.atStart).toBe(true);
    expect(p.note).toBe(null);
    expect(p.phase).toBeTruthy();
  });

  it("leaves the note empty on a move nobody wrote about", () => {
    /* Move 2 of the second Seoul game is an ordinary corner move with nothing to
       say about it, and the panel says nothing. An empty note is the honest answer,
       not a gap to be filled. */
    expect(panelAt(g2(), 2).note).toBe(null);
    expect(panelAt(g2(), 2).phase).toBeTruthy();
  });

  it("hands back nothing for a game that does not exist", () => {
    expect(panelAt(null, 3)).toBe(null);
  });
});

describe("the caption over the board", () => {
  it("numbers the chapter out of the whole game", () => {
    const g = g2();
    expect(chapterLine(g, 37)).toBe(`The move (3 of ${g.phases.length})`);
    expect(chapterLine(g, 1)).toMatch(/\(1 of \d+\)$/);
  });

  it("says nothing at all for a game that does not exist", () => {
    expect(chapterLine(null, 3)).toBe("");
  });

  it("never runs out of chapter, at either end of any game", () => {
    for (const g of ALL_GAMES) {
      expect(chapterLine(g, 0)).toMatch(/\(1 of \d+\)$/);
      expect(chapterLine(g, g.moves)).toMatch(/\(\d+ of \d+\)$/);
    }
  });
});
