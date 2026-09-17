import { describe, it, expect } from "vitest";
import { roomsFor, setsFor, setName, plateVars, platePalette } from "./look.js";
import { makeT } from "../i18n/index.js";
import { PALETTES, STONE_SETS, AUTO_STONES, DOJO_THEME, SYSTEM_THEME, REVIEW_THEME, stoneSetOf, themeVars } from "../theme/index.js";

const MINE = { ground: "#101014", ink: "#e6e6ea", accent: "#b98cff", cream: "#f2f2f6" };

/** The rooms somebody is allowed to choose: every palette but the one review
 *  mode puts them in. */
const CHOOSABLE = PALETTES.filter(p => p.id !== REVIEW_THEME);

describe("what the look page offers", () => {
  it("leads with the device, then the rooms you can sit in", () => {
    const rooms = roomsFor(null, "tatami");
    expect(rooms[0].id).toBe(SYSTEM_THEME);
    expect(rooms[0].drawAs, "the System plate is drawn in the room it resolves to").toBe("tatami");
    expect(rooms).toHaveLength(CHOOSABLE.length + 1);
    expect(rooms.some(r => r.id === DOJO_THEME), "no dojo built, no dojo plate").toBe(false);
  });

  /* The printed room is somewhere review mode puts you, not a preference.
     Offered as one it put the whole place on the page -- the Play screen
     included -- and silently overrode the stone picker beside it, since a
     printed room draws ink and paper whatever set is in the drawer. */
  it("does not offer the room review mode brings with it", () => {
    for (const dojo of [null, MINE]) {
      for (const room of ["tatami", "night"]) {
        expect(roomsFor(dojo, room).some(r => r.id === REVIEW_THEME),
          `${room}, dojo: ${!!dojo}`).toBe(false);
      }
    }
  });

  it("still keeps the review room a real palette, for review mode to use", () => {
    expect(PALETTES.some(p => p.id === REVIEW_THEME)).toBe(true);
    expect(PALETTES.find(p => p.id === REVIEW_THEME).print).toBe(true);
  });

  it("offers the built room last, named or not", () => {
    expect(roomsFor(MINE, "night").at(-1)).toMatchObject({ id: DOJO_THEME, name: "Your dojo", mood: "Yours" });
    expect(roomsFor({ ...MINE, name: "Dusk" }, "night").at(-1).name).toBe("Dusk");
  });

  it("leads the drawer with the room's own set, and names it", () => {
    const sets = setsFor("kifu", null);
    expect(sets[0].id).toBe(AUTO_STONES);
    expect(sets[0].note).toContain(stoneSetOf("kifu").name.toLowerCase());
    expect(sets.slice(1).map(s => s.id)).toEqual(STONE_SETS.map(s => s.id));
  });

  // A built room carries its own set now, so the sentence is true there too:
  // it must name the set the dojo palette holds, not the house one.
  it("tells a built room the truth about its stones", () => {
    const note = setsFor(DOJO_THEME, { ...MINE, name: "Dusk", stones: "plum" })[0].note;
    expect(note).toContain("Dusk");
    expect(note).toContain("plum & blossom");
  });

  /* The lists are English by default and take a reader when there is one, so a
     Spanish player meets the drawer in Spanish down to the sentence that names
     what the room is played with. */
  it("offers the same lists in the language it is handed", () => {
    const es = makeT("es");
    expect(roomsFor(null, "tatami", es)[0].name).toBe("Sistema");
    expect(roomsFor(MINE, "night", es).at(-1).mood).toBe("Tuya");
    expect(roomsFor(null, "tatami", es).find(r => r.id === "night").mood).toBe("Oscura");
    expect(roomsFor(null, "tatami", es).find(r => r.id === "night").name, "a room keeps its name").toBe("Night");
    const sets = setsFor("kifu", null, es);
    expect(sets[0].name).toBe("Las de la sala");
    expect(sets[0].note).toContain(setName(sets.find(s => s.id === "ebony"), es).toLowerCase());
    expect(sets[0].note).not.toContain("played with");
  });
});

/* A plate is drawn in the material it offers, and a stone plate offers a set.
   In the printed room no set has a look of its own -- a kifu prints in ink and
   paper whatever is in the drawer -- so the plates are drawn as a table room
   draws them or the picker shows nine identical plates and picks between
   nothing. */
describe("the stones a plate is drawn in", () => {
  it("shows a different pair for every set, even in the printed room", () => {
    const kifu = PALETTES.find(p => p.print);
    const drawn = STONE_SETS.map(s => plateVars(kifu.id, null, s.id)["--stone-b-2"]);
    expect(new Set(drawn).size, "eight sets, eight blacks").toBe(STONE_SETS.length);
    for (const v of drawn) expect(v, "and none of them is the page's ink").not.toBe(kifu.ink);
  });

  it("draws the room's own plate in the set the room actually names", () => {
    for (const p of PALETTES) {
      const own = plateVars(p.id, null, AUTO_STONES);
      const named = plateVars(p.id, null, p.stones);
      expect(own, `${p.id} leads with its own set`).toEqual(named);
      expect(own["--stone-b-2"], `${p.id} is not quietly the house set`)
        .toBe(plateVars(p.id, null, p.stones)["--stone-b-2"]);
    }
  });

  it("leaves the board alone: only the plates stop printing", () => {
    const kifu = PALETTES.find(p => p.print);
    expect(platePalette(kifu.id, null).print).toBe(false);
    expect(themeVars(kifu.id)["--board"], "the page itself still prints")
      .toBe(themeVars(kifu.id)["--ground"]);
  });
});
