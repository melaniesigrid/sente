import { describe, it, expect } from "vitest";
import { refusalText, resultLine, statusText, captionText, resignLabel, RESIGN_CONFIRM_MS } from "./gameStatus.js";
import { createGame, pass, acceptScore, resign } from "../engine/index.js";

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

describe("resignLabel", () => {
  it("arms on the first click and names the confirmation window", () => {
    expect(resignLabel(false)).toBe("Resign");
    expect(resignLabel(true)).toBe("Confirm resign?");
    expect(RESIGN_CONFIRM_MS).toBeGreaterThanOrEqual(2000);
  });
});

describe("captionText", () => {
  it("states the rules honestly", () => {
    expect(captionText({ komi: 7.5, rated: true })).toBe("Area scoring · komi 7.5 · superko · rated");
    expect(captionText({ komi: 7.5, rated: false })).toBe("Area scoring · komi 7.5 · superko · unrated");
  });
});
