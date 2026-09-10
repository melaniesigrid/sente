import { describe, it, expect } from "vitest";
import { refusalText, resultLine, statusText, captionText, resignLabel, resultCard, ratingLine, RESIGN_CONFIRM_MS } from "./gameStatus.js";
import { ratingOfRank, ratingOfValue, rankValue } from "../content/rank.js";
import { createGame, pass, acceptScore, resign, timeout } from "../engine/index.js";

describe("refusalText", () => {
  it("names ko, superko and suicide", () => {
    expect(refusalText("ko")).toMatch(/^Ko:/);
    expect(refusalText("superko")).toMatch(/^Superko:/);
    expect(refusalText("suicide")).toMatch(/^Suicide:/);
  });
  it("stays quiet for occupied, offboard and unknown reasons", () => {
    expect(refusalText("occupied")).toBeNull();
    expect(refusalText("offboard")).toBeNull();
    expect(refusalText("wrong-turn")).toBeNull();
    expect(refusalText(undefined)).toBeNull();
  });
});

describe("resultLine", () => {
  it("reads a scored result with the winner's total first", () => {
    const g = acceptScore(pass(pass(createGame({ size: 9, komi: 7.5 }))));
    expect(resultLine(g.result)).toBe("White wins — 7.5 : 0");
    const b = acceptScore(pass(pass(createGame({ size: 9, komi: 0.5, setup: { b: [[4, 4]] } }))));
    expect(resultLine(b.result)).toBe("Black wins — 81 : 0.5");
  });
  it("reads jigo and resignation", () => {
    const j = acceptScore(pass(pass(createGame({ size: 9, komi: 0 }))));
    expect(resultLine(j.result)).toBe("Jigo — 0 : 0");
    expect(resultLine(resign(createGame({ size: 9 })).result)).toBe("White wins by resignation");
    expect(resultLine(timeout(createGame({ size: 9 })).result)).toBe("White wins on time");
    expect(resultLine(timeout(createGame({ size: 9 }), "w").result)).toBe("Black wins on time");
    expect(resultLine(null)).toBeNull();
  });
});

describe("statusText", () => {
  it("prefers the result, then thinking, then whose move", () => {
    const done = acceptScore(pass(pass(createGame({ size: 9 })))).result;
    expect(statusText({ result: done, thinking: true, personaName: "Yuki", turn: "b" })).toMatch(/wins/);
    expect(statusText({ result: null, thinking: true, personaName: "Yuki", turn: "b" })).toBe("Yuki is thinking…");
    expect(statusText({ result: null, thinking: false, personaName: "Yuki", turn: "b" })).toBe("Your move");
    expect(statusText({ result: null, thinking: false, personaName: "Yuki", turn: "w" })).toBe("Yuki to move");
    expect(statusText({ result: null, thinking: false, personaName: null, turn: "b" })).toBe("Black to move");
    expect(statusText({ result: null, thinking: false, personaName: null, turn: "w" })).toBe("White to move");
  });
  it("reads a resignation from either side", () => {
    const g = createGame({ size: 9 });
    expect(statusText({ result: resign(g, "b").result, thinking: false, personaName: "Yuki", turn: "w" })).toBe("White wins by resignation");
    expect(statusText({ result: resign(g, "w").result, thinking: false, personaName: null, turn: "b" })).toBe("Black wins by resignation");
  });
});

describe("a flag has no rows to show", () => {
  it("names the winner and says on time, with no arithmetic to print", () => {
    const card = resultCard(timeout(createGame({ size: 9 }), "b").result);
    expect(card).toEqual({ headline: "White wins", sub: "on time", rows: [] });
  });
  it("reads a flag in the status pill", () => {
    const g = timeout(createGame({ size: 9 }), "b");
    expect(statusText({ result: g.result, thinking: false, personaName: "Yuki", turn: "w" }))
      .toBe("White wins on time");
  });
});

describe("resignLabel", () => {
  it("arms on the first click and names the confirmation window", () => {
    expect(resignLabel(false)).toBe("Resign");
    expect(resignLabel(true)).toBe("Confirm resign?");
    expect(RESIGN_CONFIRM_MS).toBeGreaterThanOrEqual(2000);
  });
});

describe("captionText", () => {
  it("states the rules honestly", () => {
    expect(captionText({ komi: 7.5, rated: true })).toBe("AGA area · komi 7.5 · superko · rated");
    expect(captionText({ komi: 7.5, rated: false })).toBe("AGA area · komi 7.5 · superko · unrated");
    expect(captionText({ komi: 7.5, rated: false, duel: true })).toBe("AGA area · komi 7.5 · superko · daily duel, unrated");
  });
  it("names the board and the handicap", () => {
    expect(captionText({ size: 19, komi: 7.5, rated: true })).toBe("19×19 · AGA area · komi 7.5 · superko · rated");
    expect(captionText({ size: 13, komi: 0.5, handicap: 3, rated: true })).toBe("13×13 · 3 stones · AGA area · komi 0.5 · superko · rated");
    expect(captionText({ size: 9, komi: 7.5, handicap: 0, rated: false })).toBe("9×9 · AGA area · komi 7.5 · superko · unrated");
  });
  it("names whichever ruleset the table is set to", () => {
    expect(captionText({ size: 19, komi: 6.5, rules: "japanese", rated: true }))
      .toBe("19×19 · Japanese territory · komi 6.5 · superko · rated");
    expect(captionText({ size: 9, komi: 5, rules: "nz", rated: false }))
      .toBe("9×9 · New Zealand area · komi 5 · superko · unrated");
  });
});

describe("scoring status", () => {
  it("asks for dead stones while scoring, before anything else but a result", () => {
    expect(statusText({ result: null, thinking: true, personaName: "Yuki", turn: "w", phase: "scoring" })).toBe("Mark dead stones, then accept");
    expect(statusText({ result: null, thinking: false, personaName: null, turn: "b", phase: "playing" })).toBe("Black to move");
  });
});

describe("resultCard", () => {
  it("shows every term of a scored game", () => {
    const g = acceptScore(pass(pass(createGame({ size: 9, komi: 7.5, setup: { b: [[4, 4]] } }))));
    const card = resultCard(g.result);
    expect(card.headline).toBe("Black wins");
    expect(card.sub).toBe("by 73.5");
    expect(card.rows[0]).toEqual({ side: "Black", detail: "1 stone + 80 territory", total: 81, winner: true });
    expect(card.rows[1]).toEqual({ side: "White", detail: "0 stones + 0 territory + 7.5 komi", total: 7.5, winner: false });
  });
  it("adds the handicap bonus and reads jigo", () => {
    const h = acceptScore(pass(pass(createGame({ size: 9, handicap: 2, komi: 0.5 }))));
    expect(resultCard(h.result).rows[1].detail).toMatch(/0\.5 komi \+ 1 handicap$/);
    const j = acceptScore(pass(pass(createGame({ size: 9, komi: 0 }))));
    expect(resultCard(j.result).headline).toBe("Jigo");
  });
  it("has no rows for a resignation", () => {
    const card = resultCard(resign(createGame({ size: 9 })).result);
    expect(card).toEqual({ headline: "White wins", sub: "by resignation", rows: [] });
    expect(resultCard(null)).toBeNull();
  });
  it("speaks the rating change in ranks, and says when the rank held", () => {
    const from = ratingOfRank("12k");
    expect(ratingLine({ from, to: ratingOfValue(rankValue(from) + 0.4) })).toBe("12.5k \u2192 12.1k");
    expect(ratingLine({ from, to: ratingOfValue(rankValue(from) - 0.4) })).toBe("12.5k \u2192 12.9k");
    expect(ratingLine({ from, to: from })).toBe("12.5k \u00b7 the rank held");
    expect(ratingLine(null)).toBeNull();
  });
});

describe("model loading status", () => {
  it("reports download progress while the house player thinks", async () => {
    const { statusText, loadingText } = await import("./gameStatus.js");
    expect(loadingText({ loaded: 12_400_000, total: 53_784_796 })).toBe("12 / 54 MB");
    expect(statusText({ result: null, thinking: true, personaName: "Yuki", turn: "w", phase: "playing",
      loading: { loaded: 0, total: 53_784_796 } })).toBe("Yuki is warming up… 0 / 54 MB");
    expect(statusText({ result: null, thinking: true, personaName: "Yuki", turn: "w", phase: "playing", loading: null }))
      .toBe("Yuki is thinking…");
  });
});
