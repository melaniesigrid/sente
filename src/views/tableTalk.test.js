import { describe, it, expect } from "vitest";
import { talkParts, pointsNamed, etiquette } from "./tableTalk.js";
import { parsePoint, pointLabel } from "../engine/index.js";

const joined = (parts) => parts.map((p) => p.s).join("");

describe("parsePoint", () => {
  it("is the inverse of pointLabel on every point of every board", () => {
    for (const size of [9, 13, 19]) {
      for (let c = 0; c < size; c++) {
        for (let r = 0; r < size; r++) {
          expect(parsePoint(size, pointLabel(size, c, r))).toEqual({ c, r });
        }
      }
    }
  });

  it("reads D4 as the lower left star point of a 19x19 board", () => {
    expect(parsePoint(19, "D4")).toEqual({ c: 3, r: 15 });
    expect(parsePoint(19, "Q16")).toEqual({ c: 15, r: 3 });
  });

  it("accepts lowercase and surrounding space", () => {
    expect(parsePoint(19, "d4")).toEqual(parsePoint(19, "D4"));
    expect(parsePoint(19, "  q16 ")).toEqual(parsePoint(19, "Q16"));
  });

  it("refuses the letter I, which is not a column on any board", () => {
    expect(parsePoint(19, "I4")).toBe(null);
    expect(parsePoint(19, "i4")).toBe(null);
  });

  it("refuses a point off the board", () => {
    expect(parsePoint(9, "K5")).toBe(null);   // 9x9 stops at J
    expect(parsePoint(9, "A10")).toBe(null);  // and at 9
    expect(parsePoint(19, "A0")).toBe(null);
    expect(parsePoint(19, "T20")).toBe(null);
  });

  it("refuses a zero-padded number, which is not how a point is written", () => {
    expect(parsePoint(19, "D04")).toBe(null);
    expect(parsePoint(19, "D0")).toBe(null);
    expect(parsePoint(19, "D00")).toBe(null);
    // and the word stays a word rather than lighting the board
    expect(talkParts("D04 is nowhere", 19)).toEqual([{ t: "text", s: "D04 is nowhere" }]);
  });

  it("refuses what is not a coordinate at all", () => {
    for (const s of ["", "D", "4", "DD4", "D4D", "4D", "D 4", "--", null, undefined, 4]) {
      expect(parsePoint(19, s)).toBe(null);
    }
  });
});

describe("talkParts", () => {
  it("finds a point in a sentence and leaves the rest alone", () => {
    const parts = talkParts("the cut at D4 was the whole game", 19);
    expect(parts).toEqual([
      { t: "text", s: "the cut at " },
      { t: "point", s: "D4", c: 3, r: 15 },
      { t: "text", s: " was the whole game" },
    ]);
  });

  it("puts the message back together exactly, whatever it contains", () => {
    for (const s of [
      "D4", "d4 or q16?", "nothing here", "", "I4 is not a point",
      "K5 on nine", "D4,Q16", "  spaced  ", "3D printing", "mod42",
    ]) {
      expect(joined(talkParts(s, 19))).toBe(s);
      expect(joined(talkParts(s, 9))).toBe(s);
    }
  });

  it("keeps the spelling the player used", () => {
    const [pt] = talkParts("d4", 19);
    expect(pt.s).toBe("d4");
    expect(pt).toMatchObject({ c: 3, r: 15 });
  });

  it("does not find a point inside a word or a number", () => {
    expect(talkParts("3D4 sharp", 19).every((p) => p.t === "text")).toBe(true);
    expect(talkParts("mod42 and D4x", 19).every((p) => p.t === "text")).toBe(true);
  });

  it("leaves a coordinate that is off this board as plain words", () => {
    expect(talkParts("K5 is huge", 9)).toEqual([{ t: "text", s: "K5 is huge" }]);
    expect(talkParts("K5 is huge", 19)[0].t).toBe("point");
  });

  it("finds several points in one line", () => {
    const pts = talkParts("D4 then Q16 then D4", 19).filter((p) => p.t === "point");
    expect(pts.map((p) => p.s)).toEqual(["D4", "Q16", "D4"]);
  });

  it("takes a non-string without complaining", () => {
    expect(talkParts(null, 19)).toEqual([]);
    expect(talkParts(undefined, 19)).toEqual([]);
  });
});

describe("pointsNamed", () => {
  it("names each point once, in the order it was named", () => {
    expect(pointsNamed("D4 then Q16 then d4 again", 19)).toEqual([
      { c: 3, r: 15 },
      { c: 15, r: 3 },
    ]);
  });

  it("is empty for a line that names nothing", () => {
    expect(pointsNamed("good game", 19)).toEqual([]);
  });
});

describe("etiquette", () => {
  it("opens with a greeting and closes with thanks", () => {
    expect(etiquette({ phase: "playing", moves: 0 })[0].text).toBe("Have a good game");
    expect(etiquette({ phase: "ended", moves: 200 })[0].text).toBe("Thank you for the game");
  });

  it("offers the traditional line beside the plain one", () => {
    expect(etiquette({ phase: "playing", moves: 0 }).map((l) => l.text))
      .toContain("Onegaishimasu");
    expect(etiquette({ phase: "ended" }).map((l) => l.text))
      .toContain("Arigatou gozaimashita");
  });

  it("says nothing in the middle of a game", () => {
    expect(etiquette({ phase: "playing", moves: 40 })).toEqual([]);
  });

  it("offers the counting lines while counting", () => {
    expect(etiquette({ phase: "scoring", moves: 90 }).length).toBe(1);
  });

  it("drops a line once this player has said it", () => {
    const said = ["Have a good game"];
    const left = etiquette({ phase: "playing", moves: 0, said });
    expect(left.map((l) => l.text)).toEqual(["Onegaishimasu"]);
    expect(etiquette({ phase: "playing", moves: 0, said: [...said, "Onegaishimasu"] }))
      .toEqual([]);
  });

  it("offers a spectator nothing: the greeting is between the players", () => {
    expect(etiquette({ phase: "playing", moves: 0, seated: false })).toEqual([]);
  });

  it("takes no argument at all without throwing", () => {
    expect(etiquette()).toEqual([
      { id: "goodGame", text: "Have a good game", note: "the usual opening" },
      { id: "onegaishimasu", text: "Onegaishimasu", note: "please, let us play" },
    ]);
  });
});

/* ----- the edges a real chat line runs into ----- */

describe("talkParts at the edges", () => {
  it("keeps reading after a coordinate it had to refuse", () => {
    const parts = talkParts("I4 then D4", 19);
    expect(joined(parts)).toBe("I4 then D4");
    expect(parts.filter((p) => p.t === "point").map((p) => p.s)).toEqual(["D4"]);
  });

  it("lets the board size decide, one message at a time", () => {
    expect(talkParts("T19 is the corner", 19)[0].t).toBe("point");
    expect(talkParts("T19 is the corner", 13)).toEqual([{ t: "text", s: "T19 is the corner" }]);
  });

  it("finds a point on either side of a line break", () => {
    const parts = talkParts("D4\nthen Q16", 19);
    expect(joined(parts)).toBe("D4\nthen Q16");
    expect(parts.filter((p) => p.t === "point").map((p) => p.s)).toEqual(["D4", "Q16"]);
  });

  it("reads a coordinate that punctuation is leaning on", () => {
    for (const s of ["(D4)", "D4.", "D4, then", "at D4!"]) {
      expect(talkParts(s, 19).some((p) => p.t === "point")).toBe(true);
      expect(joined(talkParts(s, 19))).toBe(s);
    }
  });

  it("gives the same answer twice, however many lines came before", () => {
    const first = talkParts("D4 and Q16", 19);
    talkParts("no points here at all", 19);
    talkParts("I4 K5 mod42", 19);
    expect(talkParts("D4 and Q16", 19)).toEqual(first);
  });

  it("finds nothing when the size is not a board", () => {
    expect(talkParts("D4", undefined)).toEqual([{ t: "text", s: "D4" }]);
    expect(talkParts("D4", 0)).toEqual([{ t: "text", s: "D4" }]);
  });
});

describe("pointsNamed at the edges", () => {
  it("is empty for nothing at all", () => {
    expect(pointsNamed(null, 19)).toEqual([]);
    expect(pointsNamed("", 19)).toEqual([]);
  });

  it("names a point only on a board that has it", () => {
    expect(pointsNamed("K5", 19)).toEqual([{ c: 9, r: 14 }]);
    expect(pointsNamed("K5", 9)).toEqual([]);
  });
});

describe("etiquette at the edges", () => {
  it("stops offering the opening once the game is under way", () => {
    expect(etiquette({ phase: "playing", moves: 2 }).length).toBe(2);
    expect(etiquette({ phase: "playing", moves: 3 })).toEqual([]);
  });

  it("treats a phase it has never heard of as the start of a game", () => {
    expect(etiquette({ phase: "waiting", moves: 0 }).map((l) => l.text))
      .toEqual(["Have a good game", "Onegaishimasu"]);
  });

  it("offers a spectator nothing in any phase", () => {
    for (const phase of ["playing", "scoring", "ended"]) {
      expect(etiquette({ phase, moves: 0, seated: false })).toEqual([]);
    }
  });
});

/* The token scanner captures its leading boundary rather than looking behind,
   because a lookbehind is a parse error on Safari before 16.4 and would take
   the whole module down. These pin the boundary behaviour either way. */
describe("the word boundary, without a lookbehind", () => {
  it("finds a point at the very start of a message", () => {
    expect(talkParts("D4 first", 19)[0]).toMatchObject({ t: "point", s: "D4" });
  });
  it("finds two points separated only by punctuation", () => {
    const pts = talkParts("D4,Q16", 19).filter(p => p.t === "point");
    expect(pts.map(p => p.s)).toEqual(["D4", "Q16"]);
  });
  it("keeps the separator as text rather than swallowing it", () => {
    expect(talkParts("D4,Q16", 19).map(p => p.s).join("")).toBe("D4,Q16");
    expect(talkParts("play D4 now", 19).map(p => p.s).join("")).toBe("play D4 now");
  });
  it("still refuses a coordinate glued to a word or a number", () => {
    for (const s of ["3D4", "xD4", "D4x", "D4D5", "mod42"]) {
      expect(talkParts(s, 19).every(p => p.t === "text")).toBe(true);
    }
  });
});

describe("what is offered while counting", () => {
  it("asks a question and never states a verdict about the position", () => {
    const lines = etiquette({ phase: "scoring", moves: 90 });
    expect(lines.map(l => l.text)).toEqual(["Shall we count?"]);
  });
});
