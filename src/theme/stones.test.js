/* ----------------------- THE STONE SETS, AUDITED -----------------------
   A set is two colours, and the two colours have one job between them: at a
   glance, across a board, at speed, nobody may have to work out whose stone
   that is. So every set is held against every room here, eighty boards,
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
import { deriveBoard, stonesFor, completeTones } from "./derive.js";
import { isHex, luminance, contrast } from "./color.js";
import { TOKEN_NAMES, BOARD } from "./tokens.js";

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

  it("cuts every stone crown, body, rim: light to dark, always", () => {
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
  // they are actually played, the black one seated into the board it is lying
  // on, because that is the pair a player has to tell apart.
  it("keeps the two stones unmistakable, all eighty boards of it", () => {
    for (const p of PALETTES) {
      for (const s of STONE_SETS) {
        const row = auditPalette(p, s.id).find(r => r.id === "stones");
        expect(row.pass, `${p.id} + ${s.id} is ${row.ratio.toFixed(2)}:1`).toBe(true);
      }
    }
  });

  // The rule this design system was missing, and the one a player found for it:
  // the two stones were held 4.5:1 apart from each other and neither was ever
  // measured against the wood. In every dark room that left the black stone at
  // about 1.2:1 on the board and the white one at about 14:1 — one hiding, one
  // shouting, which is exactly how it was reported. Both sides, all eighty
  // boards, or it does not ship.
  it("keeps both stones readable on the board itself, all eighty boards of it", () => {
    for (const p of PALETTES) {
      for (const s of STONE_SETS) {
        for (const row of auditPalette(p, s.id).filter(r => r.id.startsWith("board-"))) {
          expect(row.pass, `${p.id} + ${s.id}: ${row.label} is ${row.ratio.toFixed(2)}:1`).toBe(true);
        }
      }
    }
  });

  // One wood, and every set has to be playable on it. The black stone is the
  // half that binds: the white one is separated from kaya by its rim, at
  // about 1.6:1 for the body, which is what a real board does and not a failure.
  it("plays every set on the one board, black findable and white not shouting", () => {
    for (const s of STONE_SETS) {
      const black = contrast(cutBlack(s.b)[1], BOARD);
      const white = contrast(cutWhite(s.w)[1], BOARD);
      expect(black, `${s.id}: slate on the wood`).toBeGreaterThanOrEqual(2.5);
      expect(white, `${s.id}: shell on the wood`).toBeLessThan(black);
    }
  });

  it("hands every table room the same board, whatever its ground", () => {
    expect(deriveBoard()).toBe(BOARD);
    for (const p of PALETTES.filter(p => !p.print)) expect(themeVars(p.id)["--board"], p.id).toBe(BOARD);
  });

  // A stone is a rock. It is the same rock in every room, and the room is what
  // moves around it.
  it("cuts the same stone in every table room", () => {
    for (const s of STONE_SETS) {
      const cut = [cutBlack(s.b), cutWhite(s.w)];
      for (const p of PALETTES.filter(p => !p.print)) {
        const pair = stonesFor(completeTones({ ...p, stones: s.id }));
        expect([pair.b, pair.w], `${p.id} + ${s.id}`).toEqual(cut);
      }
    }
  });

  // Except on paper, where there is no rock: a kifu prints its stones in ink
  // and paper whatever set the player carries, and neither has a shine, so the
  // crown is the body and the gloss the board draws from it paints nothing.
  it("prints ink and paper in the printed room, whatever the set", () => {
    for (const p of PALETTES.filter(p => p.print)) {
      for (const s of STONE_SETS) {
        const t = completeTones({ ...p, stones: s.id });
        const pair = stonesFor(t);
        expect(pair.b, `${p.id} + ${s.id} black`).toEqual([t.ink, t.ink, t.ink]);
        // Paper, paper, and a line round it. The line is mixed toward the ink
        // rather than being the ink, because these stops are also the gradient
        // the drawn stones on Home and the landing are made of: a rim of solid
        // ink there ramps a three-hundred-pixel white stone to black.
        expect(pair.w.slice(0, 2), `${p.id} + ${s.id} white`).toEqual([t.ground, t.ground]);
        expect(pair.w[2], `${p.id} + ${s.id} rim is not the ink itself`).not.toBe(t.ink);
        expect(contrast(pair.w[2], t.ground), `${p.id} + ${s.id} rim on the page`).toBeGreaterThan(3);
        expect(pair.set.id, "the set is still the player's").toBe(s.id);
      }
      const vars = themeVars(p.id, null, "honey");
      expect(vars["--stone-w-2"], "and the tokens say so").toBe(vars["--ground"]);
      expect(vars["--stone-w-3"], "outlined, not filled with ink").not.toBe(vars["--ink"]);
      expect(vars["--stone-b-2"]).toBe(vars["--ink"]);
    }
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
    expect(stoneSetOf("kifu").id).toBe("ebony");
    expect(stoneSetOf("kifu", null, AUTO_STONES).id).toBe("ebony");
    expect(stoneSetOf("kifu", null, "honey").id).toBe("honey");
    // Stored data is untrusted: an id nobody recognises is not a set, so the
    // room keeps its own rather than the board losing its stones.
    expect(stoneSetOf("kifu", null, "gravel").id).toBe("ebony");
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
