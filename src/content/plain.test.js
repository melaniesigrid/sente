import { describe, it, expect } from "vitest";
import {
  PLAIN_WORDS, STATEMENTS, LANDING_STATEMENTS, plainFor, statementFor, landingStatement,
} from "./plain.js";

describe("plain words", () => {
  it("covers every screen that sets one", () => {
    expect(Object.keys(PLAIN_WORDS).sort())
      .toEqual(["home", "ladder", "learn", "play", "profile", "recall", "tsumego"]);
  });

  it("speaks in the house voice, at a pullable length", () => {
    for (const [key, text] of Object.entries(PLAIN_WORDS)) {
      expect(text.length, key).toBeGreaterThan(90);
      expect(text.length, key).toBeLessThan(340);
      expect(text, key).not.toMatch(/!/);
      expect(text, key).not.toMatch(/["“”]/);
    }
  });

  it("says plainly that the house players are bots", () => {
    expect(PLAIN_WORDS.play).toMatch(/bot/);
  });

  it("returns null for a screen with no line", () => {
    expect(plainFor("nowhere")).toBeNull();
    expect(plainFor("home")).toBe(PLAIN_WORDS.home);
  });
});

describe("the statement", () => {
  it("gives every screen with a plain line three lines to set large", () => {
    expect(Object.keys(STATEMENTS).sort()).toEqual(Object.keys(PLAIN_WORDS).sort());
    for (const [key, lines] of Object.entries(STATEMENTS)) {
      expect(lines.length, key).toBe(3);
    }
  });

  // The block is set at 8vw. A line that runs past a handful of words wraps,
  // and a wrapped line breaks the mask the three lines rise out of.
  it("keeps every line short enough to stand at display size", () => {
    for (const [key, lines] of Object.entries(STATEMENTS)) {
      for (const line of lines) {
        expect(line.length, `${key}: ${line}`).toBeLessThanOrEqual(18);
        expect(line, key).not.toMatch(/[!"“”]/);
      }
    }
  });

  it("returns null for a screen with no statement", () => {
    expect(statementFor("nowhere")).toBeNull();
    expect(statementFor("home")).toBe(STATEMENTS.home);
  });
});

describe("the front door's statements", () => {
  it("gives every one of them three lines", () => {
    for (const [key, lines] of Object.entries(LANDING_STATEMENTS)) {
      expect(lines.length, key).toBe(3);
    }
  });

  // These are set larger than the screens' statements are — up to 148px — so
  // the ceiling on a line is lower, not higher. A line that wraps breaks the
  // mask the three rise out of.
  it("keeps every line short enough to stand at front-door size", () => {
    for (const [key, lines] of Object.entries(LANDING_STATEMENTS)) {
      for (const line of lines) {
        expect(line.length, `${key}: ${line}`).toBeLessThanOrEqual(16);
        expect(line, key).not.toMatch(/[!"“”]/);
      }
    }
  });

  it("does not collide with the screens' statements", () => {
    for (const key of Object.keys(LANDING_STATEMENTS)) {
      expect(STATEMENTS[key], key).toBeUndefined();
    }
  });

  it("returns null for a statement that is not there", () => {
    expect(landingStatement("nowhere")).toBeNull();
    expect(landingStatement("rules")).toBe(LANDING_STATEMENTS.rules);
  });
});
