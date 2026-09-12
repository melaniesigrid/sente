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
      { c: 3, r: 15, label: "D4" },
      { c: 15, r: 3, label: "Q16" },
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
    expect(etiquette({ phase: "scoring", moves: 90 }).length).toBe(2);
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
    expect(etiquette()).toEqual([{ text: "Have a good game", note: "the usual opening" },
      { text: "Onegaishimasu", note: "please, let us play" }]);
  });
});
