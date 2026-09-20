import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { roomsFor, setsFor, setName, plateVars, platePalette } from "./look.js";
import { makeT } from "../i18n/index.js";
import { PALETTES, CHOOSABLE_ROOMS, STONE_SETS, AUTO_STONES, DOJO_THEME, SYSTEM_THEME, REVIEW_THEME, PREVIEW_PX, stoneSetOf, themeVars } from "../theme/index.js";

const MINE = { ground: "#101014", ink: "#e6e6ea", accent: "#b98cff", cream: "#f2f2f6" };

/** The rooms somebody is allowed to choose, named rather than derived.
 *
 *  This was `PALETTES.filter(p => p.id !== REVIEW_THEME)`, which is character
 *  for character the implementation, so it could not fail for any edit to the
 *  filter -- a restatement wearing the words "second opinion". Written out, it
 *  is the opinion: add a room and this list is what has to be changed on
 *  purpose, next to the nine translated sentences that count it. */
const CHOOSABLE_IDS = ["tatami", "night"];

/* Three surfaces ask which rooms can be chosen -- the picker, the profile's
   plate strip and the landing page's count -- and all three read
   CHOOSABLE_ROOMS. The filter written out three times is the one that drifts:
   the profile card carried its own copy for an afternoon, which is long
   enough. The source assertions below are cheap where a render test would need
   a DOM, and they fail the moment somebody writes the filter out by hand. */
const sourceOf = (file) => readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");

describe("which rooms can be chosen", () => {
  it("is every palette except the one review mode brings", () => {
    expect(CHOOSABLE_ROOMS.map(p => p.id)).toEqual(CHOOSABLE_IDS);
    expect(CHOOSABLE_ROOMS.some(p => p.id === REVIEW_THEME)).toBe(false);
    expect(CHOOSABLE_ROOMS.some(p => p.print), "and nothing printed is choosable").toBe(false);
  });

  it("is what the picker is built from, so the two cannot disagree", () => {
    const picker = roomsFor(null, "tatami").filter(r => r.id !== SYSTEM_THEME);
    expect(picker.map(r => r.id)).toEqual(CHOOSABLE_ROOMS.map(p => p.id));
  });

  /* Comments stripped first, and the call site matched rather than the name.
     Written against the bare token this passed on prose: Profile.jsx carries a
     comment that mentions CHOOSABLE_ROOMS, so the positive half was satisfied
     by the comment alone, and the negative half named `.filter` and
     `Object.keys` while the bug's actual shape was `PALETTES.map`. Reverting
     the strip would have left the suite green with the printed room back in
     it. */
  it("is what the profile strip and the landing count are built from too", () => {
    for (const file of ["./Profile.jsx", "./Landing.jsx"]) {
      const src = sourceOf(file).replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
      expect(src, `${file} reads the list, not just the name`)
        .toMatch(/CHOOSABLE_ROOMS\s*\.\s*(map|length|filter|some)/);
      expect(src, `${file} does not reach past it into PALETTES`)
        .not.toMatch(/(?<![A-Z_])PALETTES\s*\.\s*(map|filter|length|some)|Object\.keys\(\s*PALETTES/);
    }
  });

  /* The one room the picker is never asked about is the printed one, which is
     exactly the state an unmigrated stored profile would leave behind. The
     picker still refuses to offer it, which is what this pins.

     What it deliberately does NOT pin: the System plate takes `drawAs` from
     the room in force, so in that state it would be drawn as a printed page,
     and nothing here would be marked chosen. That is a real latent state and
     it has exactly one guard -- migrateThemeId, which sanitizeProfile runs
     before it validates (see profile.test.js). Asserting it twice was
     considered and turned down: a second enforcement point in isThemeId would
     make a palette that still ships fail its own validator. If a write path
     ever reaches profile.theme without sanitizing, this is the comment that
     says where to look. */
  it("offers no printed plate even when the room in force is the printed one", () => {
    for (const dojo of [null, MINE]) {
      const rooms = roomsFor(dojo, REVIEW_THEME);
      expect(rooms.some(r => r.id === REVIEW_THEME), "still not offered").toBe(false);
      expect(rooms.filter(r => r.id !== SYSTEM_THEME).map(r => r.id))
        .toEqual(CHOOSABLE_ROOMS.map(p => p.id).concat(dojo ? [DOJO_THEME] : []));
    }
  });
});

describe("what the look page offers", () => {
  it("leads with the device, then the rooms you can sit in", () => {
    const rooms = roomsFor(null, "tatami");
    expect(rooms[0].id).toBe(SYSTEM_THEME);
    expect(rooms[0].drawAs, "the System plate is drawn in the room it resolves to").toBe("tatami");
    expect(rooms).toHaveLength(CHOOSABLE_IDS.length + 1);
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

  /* The sentence over the picker counts the rooms out loud, in nine languages:
     "two rooms for the same board". Nothing but this holds the prose to the
     data, so a third choosable palette would leave nine translated lines
     saying something untrue about the row underneath them. Add one and
     rewrite look.room.note everywhere before changing this number. */
  it("offers as many rooms as the note in nine languages promises", () => {
    expect(CHOOSABLE_IDS, "two, plus System and whatever the dojo built").toHaveLength(2);
    expect(roomsFor(null, "tatami").filter(r => r.id !== SYSTEM_THEME)).toHaveLength(2);
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

/* The still life and the grid track it sits in are one number read twice: the
   view hands it to the Board as sizePx and writes it onto .look-stones as
   --look-board. The sheet checks that the track reads it (css.test.js); this
   checks the number itself is a width a board can be drawn at. A board is cut
   into nine columns, so a whole number of pixels keeps the grid off the
   half-pixel. */
describe("how wide the still life is drawn", () => {
  it("is one positive whole number of pixels", () => {
    expect(Number.isInteger(PREVIEW_PX), String(PREVIEW_PX)).toBe(true);
    expect(PREVIEW_PX).toBeGreaterThan(0);
  });
});
