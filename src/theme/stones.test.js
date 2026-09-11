/* ----------------------- THE STONE SETS, AUDITED -----------------------
   A set is two colours, and the two colours have one job between them: at a
   glance, across a board, at speed, nobody may have to work out whose stone
   that is. So every set is held against every room here — eighty boards —
   and not one of them is allowed to come in under the floor the dojo prints.

   The rest is the cut: a stone has a lit crown, a body and a rim, in that
   order, in every room. Get that wrong and the piece stops being a sphere. */
import { describe, it, expect } from "vitest";
import {
  STONE_SETS, STONE_IDS, AUTO_STONES, HOUSE_STONES,
  stonesOf, isStoneId, cutBlack, cutWhite,
} from "./stones.js";
import { PALETTES, HOUSE_THEME } from "./palettes.js";
import { auditPalette, themeVars, stoneSetOf, withStones } from "./theme.js";
import { deriveStoneB, stonesFor, completeTones } from "./derive.js";
import { isHex, luminance, contrast, isDarkColor } from "./color.js";
import { TOKEN_NAMES } from "./tokens.js";

describe("the sets in the drawer", () => {
  it("gives every set a unique id, a name, a note and two well-formed cores", () => {
    expect(new Set(STONE_IDS).size).toBe(STONE_IDS.length);
    expect(STONE_IDS).not.toContain(AUTO_STONES);
    for (const s of STONE_SETS) {
      expect(s.name, s.id).toBeTruthy();
      expect(s.note, s.id).toBeTruthy();
      expect(isHex(s.b), `${s.id}.b`).toBe(true);
      expect(isHex(s.w), `${s.id}.w`).toBe(true);
    }
  });

  it("puts the house set first, as the one the system was drawn with", () => {
    expect(STONE_SETS[0].id).toBe(HOUSE_STONES);
    expect(stonesOf("nothing-of-the-sort").id).toBe(HOUSE_STONES);
  });

  it("accepts auto and every set id, and nothing else", () => {
    expect(isStoneId(AUTO_STONES)).toBe(true);
    for (const id of STONE_IDS) expect(isStoneId(id), id).toBe(true);
    expect(isStoneId("gravel")).toBe(false);
    expect(isStoneId(undefined)).toBe(false);
  });

  it("cuts every stone crown, body, rim — light to dark, always", () => {
    for (const s of STONE_SETS) {
      for (const [half, cut] of [["black", cutBlack(s.b)], ["white", cutWhite(s.w)]]) {
        expect(cut, `${s.id} ${half}`).toHaveLength(3);
        expect(luminance(cut[0]), `${s.id} ${half} crown`).toBeGreaterThan(luminance(cut[1]));
        expect(luminance(cut[1]), `${s.id} ${half} rim`).toBeGreaterThan(luminance(cut[2]));
      }
    }
  });

  it("keeps a black stone black and a white stone white, in every set", () => {
    for (const s of STONE_SETS) {
      expect(luminance(s.b), `${s.id} black`).toBeLessThan(0.12);
      expect(luminance(s.w), `${s.id} white`).toBeGreaterThan(0.68);
    }
  });
});

describe("every set in every room", () => {
  // The one rule a set can break on its own. It is measured on the stones as
  // they are actually played — the black one seated into the board it is lying
  // on — because that is the pair a player has to tell apart.
  it("keeps the two stones unmistakable, all eighty boards of it", () => {
    for (const p of PALETTES) {
      for (const s of STONE_SETS) {
        const row = auditPalette(p, s.id).find(r => r.id === "stones");
        expect(row.pass, `${p.id} + ${s.id} is ${row.ratio.toFixed(2)}:1`).toBe(true);
      }
    }
  });

  it("seats a black stone into a dark board without letting it vanish", () => {
    for (const p of PALETTES.filter(x => isDarkColor(x.ground))) {
      for (const s of STONE_SETS) {
        const cut = deriveStoneB(p.ground, s.b);
        expect(luminance(cut[0]), `${p.id} + ${s.id}: crown above the wood`).toBeGreaterThan(luminance(p.ground));
        expect(contrast(cut[1], "#ffffff"), `${p.id} + ${s.id}: stays dark`).toBeGreaterThan(7);
      }
    }
  });

  it("leaves the stones as cut on paper", () => {
    const slate = stonesOf(HOUSE_STONES);
    expect(deriveStoneB("#e8e4db", slate.b)).toEqual(cutBlack(slate.b));
  });
});

describe("choosing a set", () => {
  it("plays every named room with the set it names", () => {
    for (const p of PALETTES) {
      expect(isStoneId(p.stones), `${p.id} names a real set`).toBe(true);
      expect(stoneSetOf(p.id).id, p.id).toBe(p.stones);
      expect(completeTones(p).stones, p.id).toBe(p.stones);
    }
  });

  it("falls back to the house set for a palette that names none", () => {
    const mine = { ground: "#101014", ink: "#e6e6ea", accent: "#b98cff", cream: "#f2f2f6" };
    expect(stonesFor(completeTones(mine)).set.id).toBe(HOUSE_STONES);
  });

  it("lets a player's choice override the room, and auto leave it alone", () => {
    expect(stoneSetOf("sumi").id).toBe("jade");
    expect(stoneSetOf("sumi", null, AUTO_STONES).id).toBe("jade");
    expect(stoneSetOf("sumi", null, "honey").id).toBe("honey");
    // Stored data is untrusted: an id nobody recognises is not a set, so the
    // room keeps its own rather than the board losing its stones.
    expect(stoneSetOf("sumi", null, "gravel").id).toBe("jade");
    expect(withStones({ ground: "#000000", stones: "jade" }, AUTO_STONES).stones).toBe("jade");
  });

  it("draws the chosen stones in the room's own tokens", () => {
    const house = themeVars(HOUSE_THEME);
    const honeyed = themeVars(HOUSE_THEME, null, "honey");
    expect(honeyed["--stone-w-2"]).toBe(stonesOf("honey").w);
    expect(honeyed["--stone-w-2"]).not.toBe(house["--stone-w-2"]);
    // Only the stones move: the room is untouched by the set on its board, and
    // that is checked against the whole contract rather than a token or two, so
    // a set can never quietly repaint the room it is played in.
    for (const name of TOKEN_NAMES) {
      if (name.startsWith("--stone-")) continue;
      expect(honeyed[name], name).toBe(house[name]);
    }
  });
});
