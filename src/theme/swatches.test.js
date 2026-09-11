/* The drawer is generated from the named rooms, so what is worth asserting is
   that it stays a faithful index of them: nothing in it was invented, nothing
   in them was left out, and the dojo can always show a player which swatch they
   are standing on. */
import { describe, it, expect } from "vitest";
import { SWATCHES, swatchesFor, isStockTone, roomsNamed } from "./swatches.js";
import { PALETTES } from "./palettes.js";
import { completeTones } from "./derive.js";
import { TONE_KEYS } from "./tokens.js";
import { isHex, luminance } from "./color.js";

describe("the drawer", () => {
  it("has a row for every tone a palette is authored from", () => {
    expect(Object.keys(SWATCHES).sort()).toEqual([...TONE_KEYS].sort());
  });

  it("offers every colour the named rooms actually use, and only those", () => {
    for (const key of TONE_KEYS) {
      const used = new Set(PALETTES.map(p => completeTones(p)[key]));
      const offered = new Set(swatchesFor(key).map(s => s.hex));
      expect(offered, `the ${key} row`).toEqual(used);
    }
  });

  it("names the rooms each colour came from", () => {
    for (const key of TONE_KEYS) {
      for (const s of swatchesFor(key)) {
        expect(s.rooms.length).toBeGreaterThan(0);
        for (const name of s.rooms) {
          const room = PALETTES.find(p => p.name === name);
          expect(room, `${name} is a room`).toBeTruthy();
          expect(completeTones(room)[key]).toBe(s.hex);
        }
      }
    }
  });

  it("spells every swatch as a hex, and never offers one twice", () => {
    for (const key of TONE_KEYS) {
      const hexes = swatchesFor(key).map(s => s.hex);
      expect(hexes.every(isHex), `the ${key} row`).toBe(true);
      expect(new Set(hexes).size).toBe(hexes.length);
    }
  });

  it("runs light to dark, so a row reads as a run", () => {
    for (const key of TONE_KEYS) {
      const l = swatchesFor(key).map(s => luminance(s.hex));
      expect([...l].sort((a, b) => b - a)).toEqual(l);
    }
  });

  it("knows a stock colour from a hand-mixed one", () => {
    expect(isStockTone("ground", swatchesFor("ground")[0].hex)).toBe(true);
    expect(isStockTone("ground", "#ff00ff")).toBe(false);
    expect(isStockTone("nonsense", "#ffffff")).toBe(false);
    expect(isStockTone("ground", undefined)).toBe(false);
  });

  it("reads a list of rooms as a sentence", () => {
    expect(roomsNamed(["House"])).toBe("House");
    expect(roomsNamed(["House", "Kaya"])).toBe("House and Kaya");
    expect(roomsNamed(["House", "Kaya", "Gilt"])).toBe("House, Kaya and Gilt");
  });
});
