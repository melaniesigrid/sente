import { describe, it, expect } from "vitest";
import { typedParts } from "./typedParts.js";
import { emphasize, markBudget, SAYINGS } from "../content/classic.js";

const parts = [
  { text: "To ", mark: false },
  { text: "strengthen", mark: true },
  { text: " the outside", mark: false },
];
const whole = parts.map(p => p.text).join("");

describe("typedParts", () => {
  it("shows nothing at zero", () => {
    expect(typedParts(parts, 0)).toEqual([]);
  });

  it("stops inside the part the caret is in", () => {
    expect(typedParts(parts, 6)).toEqual([
      { text: "To ", mark: false },
      { text: "str", mark: true },
    ]);
  });

  it("keeps the mark on a part that is only half struck", () => {
    const half = typedParts(parts, 6);
    expect(half[half.length - 1].mark).toBe(true);
  });

  it("gives the whole line back once the count reaches its length", () => {
    expect(typedParts(parts, whole.length)).toEqual(parts);
  });

  it("does not run past the end", () => {
    expect(typedParts(parts, whole.length + 50)).toEqual(parts);
  });

  // Whatever the count, what has been typed is always a prefix of the line:
  // the caret only ever moves forward and never rewrites what is behind it.
  it("is always a prefix of the line it came from", () => {
    for (let n = 0; n <= whole.length; n++) {
      const text = typedParts(parts, n).map(p => p.text).join("");
      expect(whole.startsWith(text)).toBe(true);
      expect(text).toHaveLength(n);
    }
  });

  it("holds for every saying the front door can draw", () => {
    for (const saying of SAYINGS) {
      const p = emphasize(saying.text, markBudget(saying.text));
      expect(typedParts(p, saying.text.length).map(x => x.text).join("")).toBe(saying.text);
    }
  });
});
