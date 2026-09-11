/* ----------------------- THE DRAWER -----------------------
   The dojo used to hand a player an eyedropper and sixteen million colours,
   which is not a choice, it is a blank page. A blank page is the one thing a
   design system is supposed to spare you: every colour Joseki ships was mixed
   against a ground, measured, and kept only once it cleared the rules in
   tokens.js. Offering a free hex field beside that work invited somebody to
   throw it away by accident.

   So the dojo now picks from the drawer: for each tone, every value the named
   rooms actually use for that role, deduped and sorted light to dark. Building
   a room becomes what it should have been: taking House's ground, Kaya's ink
   and Cinnabar's mark and seeing whether the three of them can live together,
   and the audit still has something to say, because a stock colour is only
   proven against the room it came from.

   Derived from PALETTES rather than typed, so a new room adds its colours to
   the drawer the moment it lands and nothing here has to be remembered. */
import { PALETTES } from "./palettes.js";
import { completeTones } from "./derive.js";
import { TONES } from "./tokens.js";
import { luminance } from "./color.js";

/** Every value the named rooms use for one tone, each labelled with the rooms
 *  it came from. Sorted light to dark so the row reads as a run rather than as
 *  the order palettes.js happens to be written in. */
function drawer(key) {
  const out = [];
  for (const p of PALETTES) {
    const hex = completeTones(p)[key];
    const seen = out.find(s => s.hex === hex);
    if (seen) seen.rooms.push(p.name);
    else out.push({ hex, rooms: [p.name] });
  }
  return out.sort((a, b) => luminance(b.hex) - luminance(a.hex));
}

/** { toneKey: [{ hex, rooms }] }: what the dojo may offer, by tone. */
export const SWATCHES = Object.fromEntries(TONES.map(t => [t.key, drawer(t.key)]));

/** The swatches for one tone. Never throws; an unknown key has none. */
export function swatchesFor(key) {
  return SWATCHES[key] || [];
}

/** Is this a colour the house actually ships for this role? The dojo can only
 *  produce stock tones now, but a palette stored by an older build may hold a
 *  hand-mixed one, and the picker has to be able to say so rather than quietly
 *  show nothing selected. */
export function isStockTone(key, hex) {
  return swatchesFor(key).some(s => s.hex === (hex || "").toLowerCase());
}

/** Which rooms a colour belongs to, as a sentence fragment: "House and Kaya".
 *  The picker prints it under the chosen swatch, because the useful thing to
 *  know about a stock colour is where you have already seen it working. */
export function roomsNamed(rooms) {
  if (rooms.length === 1) return rooms[0];
  return `${rooms.slice(0, -1).join(", ")} and ${rooms.at(-1)}`;
}
