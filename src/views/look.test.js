import { describe, it, expect } from "vitest";
import { roomsFor, setsFor } from "./look.js";
import { PALETTES, STONE_SETS, AUTO_STONES, DOJO_THEME, SYSTEM_THEME, stoneSetOf } from "../theme/index.js";

const MINE = { ground: "#101014", ink: "#e6e6ea", accent: "#b98cff", cream: "#f2f2f6" };

describe("what the look page offers", () => {
  it("leads with the device, then the named rooms", () => {
    const rooms = roomsFor(null, "house");
    expect(rooms[0].id).toBe(SYSTEM_THEME);
    expect(rooms[0].drawAs, "the System plate is drawn in the room it resolves to").toBe("house");
    expect(rooms).toHaveLength(PALETTES.length + 1);
    expect(rooms.some(r => r.id === DOJO_THEME), "no dojo built, no dojo plate").toBe(false);
  });

  it("offers the built room last, named or not", () => {
    expect(roomsFor(MINE, "sumi").at(-1)).toMatchObject({ id: DOJO_THEME, name: "Your dojo", mood: "Yours" });
    expect(roomsFor({ ...MINE, name: "Dusk" }, "sumi").at(-1).name).toBe("Dusk");
  });

  it("leads the drawer with the room's own set, and names it", () => {
    const sets = setsFor("sumi", null);
    expect(sets[0].id).toBe(AUTO_STONES);
    expect(sets[0].note).toContain(stoneSetOf("sumi").name.toLowerCase());
    expect(sets.slice(1).map(s => s.id)).toEqual(STONE_SETS.map(s => s.id));
  });

  // A built room carries its own set now, so the sentence is true there too:
  // it must name the set the dojo palette holds, not the house one.
  it("tells a built room the truth about its stones", () => {
    const note = setsFor(DOJO_THEME, { ...MINE, name: "Dusk", stones: "plum" })[0].note;
    expect(note).toContain("Dusk");
    expect(note).toContain("plum & blossom");
  });
});
