import { describe, it, expect } from "vitest";
import { PLAIN_WORDS, STATEMENTS, plainFor, statementFor } from "./plain.js";
import { makeT } from "../i18n/index.js";

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
    expect(statementFor("home")).toEqual(STATEMENTS.home);
  });

  /* The three lines are read from the catalogue one at a time, so a language
     that has translated two of them shows two translated and one English
     rather than dropping the statement. */
  it("reads each line in the language it is handed", () => {
    const es = makeT("es");
    expect(statementFor("home", es)).toHaveLength(3);
    expect(statementFor("home", es)).not.toEqual(STATEMENTS.home);
    expect(plainFor("home", es)).not.toBe(PLAIN_WORDS.home);
  });
});
