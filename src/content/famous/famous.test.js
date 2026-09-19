import { describe, it, expect, vi } from "vitest";
import {
  MATCHES, GAMES, ALL_GAMES, gameById, matchById, gamesOf,
  movesOf, recordFor, phaseAt, noteAt, seatAt, seatSideAt, hasSeats, notedMoves, exportCredit,
} from "./index.js";
import { RECORDS } from "./records.js";
import { RULESET_IDS } from "../../engine/index.js";

/* ----------------------- THE FAMOUS GAMES -----------------------
   What this suite is for: the shelf makes claims about real games played by real
   people, and the two ways it could be wrong are both checked here.

   It could be wrong about the board - a move that is not legal, a record that does
   not replay, a count that disagrees with the file. Every game is replayed through
   the rules and every number is compared against the record rather than against the
   prose.

   It could be wrong about the rights. Historic game records are public domain and
   the commentary published beside them is not, so this suite holds the line that no
   note is a copy: the generated records carry no comments at all, every study cites
   where it comes from, and a quotation carries a name and a date or it does not
   ship. */

describe("the shelf", () => {
  it("has three matches and fifteen games, and every match's list resolves", () => {
    expect(MATCHES).toHaveLength(3);
    expect(ALL_GAMES).toHaveLength(15);
    for (const m of MATCHES) {
      expect(gamesOf(m)).toHaveLength(m.games.length);
      expect(gamesOf(m).map(g => g.id)).toEqual(m.games);
    }
  });

  it("gives every game a unique kebab-case id that has a record beside it", () => {
    const ids = ALL_GAMES.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
      expect(RECORDS[id]).toBeTruthy();
    }
  });

  it("points every game at a match that exists, and no orphans", () => {
    for (const g of ALL_GAMES) {
      expect(matchById(g.match)).toBeTruthy();
      expect(matchById(g.match).games).toContain(g.id);
    }
    expect(Object.keys(GAMES).sort()).toEqual(Object.keys(RECORDS).sort());
  });

  it("dates every game as a real day", () => {
    for (const g of ALL_GAMES) {
      expect(g.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(g.date))).toBe(false);
      expect(g.dateText.length).toBeGreaterThan(6);
    }
  });
});

describe("the records", () => {
  it("replays every game through the rules", () => {
    for (const g of ALL_GAMES) {
      const rec = recordFor(g.id);
      expect(rec).toBeTruthy();
      expect(rec.size).toBe(19);
      expect(rec.moves.filter(m => m.type === "play")).toHaveLength(g.moves);
    }
  });

  it("agrees with the generated record about how long the game was", () => {
    for (const g of ALL_GAMES) {
      expect(RECORDS[g.id].count).toBe(g.moves);
      expect(movesOf(g.id)).toHaveLength(g.moves);
    }
  });

  /* The facts card advertises a ruleset and a komi; the board has to be the one it
     names. Five of the Wuzhen files say RU[AGA] where the summit was played under
     Chinese rules, so the study is the source of truth and this is what holds the
     record to it. Without this the screen could say one thing and play another. */
  it("plays every game under the terms its own page advertises", () => {
    for (const g of ALL_GAMES) {
      const rec = recordFor(g.id);
      expect(rec.komi, g.id).toBe(7.5);
      expect(g.rulesText, g.id).toBe("Chinese");
      /* The literal, not `rulesFromSgf(g.rulesText)` - repeating the expression the
         code evaluates would pass for any mapping, including a wrong one. */
      expect(rec.rules, g.id).toBe("chinese");
      expect(RULESET_IDS, g.id).toContain(rec.rules);
    }
  });

  it("puts every point on the board", () => {
    for (const g of ALL_GAMES) {
      for (const pt of movesOf(g.id)) {
        if (pt === null) continue; // a pass, which none of these games has
        expect(pt[0]).toBeGreaterThanOrEqual(0);
        expect(pt[1]).toBeGreaterThanOrEqual(0);
        expect(pt[0]).toBeLessThan(19);
        expect(pt[1]).toBeLessThan(19);
      }
    }
  });

  it("ends every game the way the match ended it", () => {
    for (const g of ALL_GAMES) {
      const rec = recordFor(g.id);
      expect(rec.phase, g.id).toBe("ended");
      expect(rec.result.winner, g.id).toBe(g.result.winner);
      expect(rec.result.method, g.id).toBe(g.result.method);
    }
  });

  /* A resignation is played, so the record derives the winner from the moves rather
     than copying the study. That is the half of the result worth asserting: the
     counted games carry a margin nothing on the board can check, and comparing a
     copied field with the field it was copied from proves nothing. */
  it("derives the winner of a resignation from the record itself", () => {
    for (const g of ALL_GAMES.filter(x => x.result.method === "resign")) {
      const rec = recordFor(g.id);
      const last = rec.moves[rec.moves.length - 1];
      expect(last.type, g.id).toBe("resign");
      expect(last.color, g.id).toBe(g.result.winner === "b" ? "w" : "b");
    }
  });

  /* A study is hand-written and the record beside it is generated, so the ways this
     fails are typos. None of them should replace the screen with an error card. */
  it("answers with nothing rather than throwing when a record will not replay", () => {
    const keep = RECORDS["fan-hui-1"];
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      RECORDS["fan-hui-1"] = { ...keep, moves: keep.moves.slice(0, 20) };
      expect(recordFor("fan-hui-1"), "a truncated move string").toBe(null);
      RECORDS["fan-hui-1"] = { ...keep, moves: keep.moves.slice(0, -1) };
      expect(recordFor("fan-hui-1"), "an odd-length move string").toBe(null);
      RECORDS["fan-hui-1"] = { ...keep, moves: "zz" + keep.moves.slice(2) };
      expect(recordFor("fan-hui-1"), "a point off the board").toBe(null);
    } finally {
      RECORDS["fan-hui-1"] = keep;
      quiet.mockRestore();
    }
    expect(recordFor("fan-hui-1").moves.length, "and recovers").toBeGreaterThan(200);
  });

  it("carries the two counted games as counts and the rest as resignations", () => {
    const counted = ALL_GAMES.filter(g => g.result.method === "score").map(g => g.id);
    expect(counted).toEqual(["fan-hui-1", "ke-jie-1"]);
    expect(gameById("ke-jie-1").result.margin).toBe(0.5);
    expect(gameById("fan-hui-1").result.margin).toBe(2.5);
  });

  /* The one human win. If this ever stops being true somebody has edited a record. */
  it("keeps the fourth Seoul game as the only one a person won", () => {
    const won = ALL_GAMES.filter(g => {
      const human = g.result.winner === "b" ? g.black : g.white;
      return !/AlphaGo/i.test(human);
    });
    expect(won.map(g => g.id)).toEqual(["lee-sedol-4"]);
    expect(gameById("lee-sedol-4").white).toBe("Lee Sedol");
  });
});

describe("the notes", () => {
  it("attaches every note to a move the game actually has", () => {
    for (const g of ALL_GAMES) {
      for (const key of Object.keys(g.notes)) {
        const n = Number(key);
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(g.moves);
        /* A note on an ordinary move is allowed to be one short sentence - most of
           them are, and padding them out would be worse writing. What is required is
           that it is a sentence and that the game as a whole says something. */
        expect(g.notes[key].length).toBeGreaterThan(12);
        expect(g.notes[key].trim()).toMatch(/[.!?]$/);
      }
    }
  });

  it("puts each note on its own move in the replayed record", () => {
    for (const g of ALL_GAMES) {
      const rec = recordFor(g.id);
      const plays = rec.moves.filter(m => m.type === "play");
      for (const key of Object.keys(g.notes)) {
        expect(plays[Number(key) - 1].comment).toBe(g.notes[key]);
      }
    }
  });

  it("annotates every game and gives the last move of each one a note", () => {
    for (const g of ALL_GAMES) {
      expect(notedMoves(g)).toBeGreaterThanOrEqual(25);
      expect(noteAt(g, g.moves)).toBeTruthy();
      const written = Object.values(g.notes).join(" ");
      expect(written.length).toBeGreaterThan(2000);
    }
  });

  it("covers every move with a chapter, from the first to the last", () => {
    for (const g of ALL_GAMES) {
      expect(g.phases[0].from).toBe(1);
      /* Ascending, and `phaseAt` takes the largest `from` rather than the last in
         array order, so a list written out of sequence fails here rather than putting
         the wrong words under the board. */
      const froms2 = g.phases.map(p => p.from);
      expect(froms2, g.id).toEqual([...froms2].sort((a, b) => a - b));
      for (let n = 0; n <= g.moves; n++) expect(phaseAt(g, n)).toBeTruthy();
      const froms = g.phases.map(p => p.from);
      expect([...froms].sort((a, b) => a - b)).toEqual(froms); // in order
      expect(froms[froms.length - 1]).toBeLessThanOrEqual(g.moves);
    }
  });

  it("puts the two moves everybody knows where they belong", () => {
    expect(noteAt(gameById("lee-sedol-2"), 37)).toMatch(/^P10\./);
    expect(phaseAt(gameById("lee-sedol-2"), 37).from).toBe(37);
    expect(noteAt(gameById("lee-sedol-4"), 78)).toMatch(/^L11\./);
    expect(phaseAt(gameById("lee-sedol-4"), 78).from).toBe(78);
  });
});

describe("who placed the stone", () => {
  it("knows the seats in the pair go and nowhere else", () => {
    expect(hasSeats("wuzhen-pair")).toBe(true);
    for (const g of ALL_GAMES) {
      if (g.id !== "wuzhen-pair") expect(hasSeats(g.id)).toBe(false);
    }
  });

  /* Both machines carry one name in the record, because the file gives one name.
     Which of the two it was is the move's own parity, and saying so is the whole
     point of the seat line in a pair go. */
  it("tells the two machines apart by the side they were sitting on", () => {
    expect(seatAt("wuzhen-pair", 3)).toBe("AlphaGo");
    expect(seatAt("wuzhen-pair", 4)).toBe("AlphaGo");
    expect(seatSideAt("wuzhen-pair", 3)).toBe("b");
    expect(seatSideAt("wuzhen-pair", 4)).toBe("w");
    expect(seatSideAt("wuzhen-pair", 1)).toBe("b");
    expect(seatSideAt("ke-jie-1", 3), "and says nothing where nobody is seated").toBe(null);
    expect(seatSideAt("wuzhen-pair", 0)).toBe(null);
  });

  it("rotates the four seats without exception for two hundred and twenty moves", () => {
    const order = [1, 2, 3, 4].map(n => seatAt("wuzhen-pair", n));
    expect(order).toEqual(["Gu Li", "Lian Xiao", "AlphaGo", "AlphaGo"]);
    for (let n = 1; n <= 220; n++) {
      expect(seatAt("wuzhen-pair", n)).toBe(order[(n - 1) % 4]);
    }
    expect(seatAt("wuzhen-pair", 0)).toBe(null);
    expect(seatAt("wuzhen-pair", 221)).toBe(null);
  });

  it("writes the names as the game spells them, not as the file does", () => {
    expect(RECORDS["wuzhen-pair"].roster).toContain("Alphago");
    expect(seatAt("wuzhen-pair", 3)).toBe("AlphaGo");
  });
});

/* ---------------------------------------------------------------- the rights line */

describe("whose words these are", () => {
  /* The generated records must carry moves and nothing else. Several of the SGF
     files these came from ship a professional's published match commentary inside
     them, and the import tool is the thing that stops it travelling. */
  it("keeps no comment of any kind in the generated records", () => {
    for (const r of Object.values(RECORDS)) {
      expect(Object.keys(r).sort()).toEqual(
        r.seats ? ["count", "komi", "moves", "roster", "seats"] : ["count", "komi", "moves"]);
      expect(r.moves).toMatch(/^[a-s.]+$/);
    }
  });

  it("makes every game say where it comes from", () => {
    for (const g of ALL_GAMES) {
      expect(g.sources.length).toBeGreaterThan(0);
      for (const s of g.sources) expect(s.length).toBeGreaterThan(30);
      expect(g.sources.join(" ")).toMatch(/record/i);
    }
  });

  /* The line a downloaded record carries at its head. It says the moves are nobody's
     and the words are the Studio's, which is the same thing the credits page says, and
     it is never part of what a reader sees at the board. */
  it("heads an exported record with its provenance, and never the screen", () => {
    for (const g of ALL_GAMES) {
      const credit = exportCredit(g);
      expect(credit, g.id).toContain("Game record: public domain");
      expect(credit, g.id).toContain("Not licensed for reuse");
      expect(credit, g.id).toContain(g.black);
      expect(credit, g.id).toContain(g.white);
      expect(recordFor(g.id).comment, g.id).toBe(g.opening);
    }
    expect(exportCredit(null)).toBe("");
  });

  it("names and dates every person it quotes", () => {
    for (const g of ALL_GAMES) {
      for (const q of g.quotes) {
        expect(q.who.length).toBeGreaterThan(2);
        expect(q.when).toMatch(/\d{4}/);
        expect(q.text.length).toBeGreaterThan(10);
        /* A quotation is a sentence somebody said, not a passage lifted from a
           published commentary. Anything long enough to be the latter fails here. */
        expect(q.text.split(/\s+/).length).toBeLessThanOrEqual(45);
      }
    }
  });

  it("writes the prose this shelf needs for every game", () => {
    for (const g of ALL_GAMES) {
      /* Every field the facts card renders. A study that omits `clock` shipped an
         empty row with a green suite, and a missing `komi` built a record with an
         undefined one. */
      for (const key of ["title", "subtitle", "where", "clock", "rulesText", "black", "white"]) {
        expect(typeof g[key], `${g.id}.${key}`).toBe("string");
        expect(g[key].length, `${g.id}.${key}`).toBeGreaterThan(1);
      }
      expect(typeof g.komi, g.id).toBe("number");
      expect(typeof g.moves, g.id).toBe("number");
      expect(g.lede.length).toBeGreaterThan(40);
      expect(g.subtitle.length).toBeGreaterThan(10);
      expect(g.opening.length).toBeGreaterThan(40);
      expect(g.story.length).toBeGreaterThanOrEqual(3);
      /* A story may open on one short line - several of them do, and that is the
         writing rather than a gap. What is checked is that the story is a story. */
      expect(g.story.join(" ").length).toBeGreaterThan(900);
      for (const p of g.story) expect(p.length).toBeGreaterThan(40);
      for (const p of g.phases) {
        expect(p.title.length).toBeGreaterThan(3);
        expect(p.text.length).toBeGreaterThan(40);
      }
    }
    for (const m of MATCHES) {
      expect(m.lede.length).toBeGreaterThan(40);
      expect(m.story.length).toBeGreaterThanOrEqual(3);
    }
  });
});

/* ---------------------------------------------------------------- nothing there */

describe("a game that is not on the shelf", () => {
  /* Every one of these is reachable from a link somebody typed or a link that once
     worked, so each answers with nothing rather than throwing. */
  it("answers with nothing rather than throwing, whatever is asked of it", () => {
    expect(gameById("no-such-game")).toBe(null);
    expect(matchById("no-such-match")).toBe(null);
    expect(movesOf("no-such-game")).toEqual([]);
    expect(recordFor("no-such-game")).toBe(null);
    expect(hasSeats("no-such-game")).toBe(false);
    expect(seatAt("no-such-game", 1)).toBe(null);
    expect(gamesOf(null)).toEqual([]);
    expect(notedMoves(null)).toBe(0);
    expect(phaseAt(null, 3)).toBe(null);
    expect(noteAt(null, 3)).toBe(null);
  });

});
