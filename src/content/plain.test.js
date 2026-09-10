import { describe, it, expect } from "vitest";
import { PLAIN_WORDS, plainFor } from "./plain.js";

describe("plain words", () => {
  it("covers every screen that sets one", () => {
    expect(Object.keys(PLAIN_WORDS).sort())
      .toEqual(["home", "ladder", "learn", "play", "profile", "tsumego"]);
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
