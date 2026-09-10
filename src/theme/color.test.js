import { describe, it, expect } from "vitest";
import { parseHex, isHex, toHex, toTriple, mix, lighten, darken, luminance, contrast, grade, isDarkColor } from "./color.js";

describe("colour maths", () => {
  it("parses and formats a hex colour", () => {
    expect(parseHex("#e8e4db")).toEqual([232, 228, 219]);
    expect(parseHex("#FFFFFF")).toEqual([255, 255, 255]);
    expect(toHex([0, 128, 255])).toBe("#0080ff");
    expect(toTriple("#5f8c7e")).toBe("95,140,126");
  });

  it("throws on a colour it cannot read, rather than guessing", () => {
    for (const bad of ["#fff", "e8e4db", "rgb(1,2,3)", "", null, undefined, "#gggggg"]) {
      expect(() => parseHex(bad), String(bad)).toThrow();
    }
  });

  it("recognises a well-formed hex without throwing", () => {
    expect(isHex("#e8e4db")).toBe(true);
    expect(isHex("#FFF")).toBe(false);
    expect(isHex(42)).toBe(false);
    expect(isHex(null)).toBe(false);
  });

  it("clamps and rounds out-of-range channels", () => {
    expect(toHex([-20, 300, 127.6])).toBe("#00ff80");
  });

  it("mixes toward a target, and lands on it at t = 1", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(lighten("#808080", 1)).toBe("#ffffff");
    expect(darken("#808080", 1)).toBe("#000000");
  });

  it("agrees with the WCAG reference points", () => {
    expect(luminance("#000000")).toBeCloseTo(0, 5);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 2);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("gives the same ratio whichever way round the pair is", () => {
    expect(contrast("#4b463c", "#e8e4db")).toBeCloseTo(contrast("#e8e4db", "#4b463c"), 10);
  });

  it("names what a ratio is good for", () => {
    expect(grade(21)).toBe("body");
    expect(grade(4.5)).toBe("body");
    expect(grade(3.2)).toBe("large");
    expect(grade(2.99)).toBe("mark");
    expect(grade(1.2)).toBe("none");
  });

  it("calls the four dark rooms dark and the three light ones light", () => {
    for (const hex of ["#17140f", "#24262a", "#1c1e1c", "#1a1d26"]) expect(isDarkColor(hex), hex).toBe(true);
    for (const hex of ["#e8e4db", "#ebe0c8", "#e6e9ee"]) expect(isDarkColor(hex), hex).toBe(false);
  });
});
