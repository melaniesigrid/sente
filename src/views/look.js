/* ----------------------- WHAT THE LOOK PAGE OFFERS -----------------------
   The two lists behind the pickers, kept out of the view so they can be tested
   the way gameStatus and accountForm are. Neither decides anything: they put
   the rooms and the sets in the order a player should meet them, and write the
   one sentence that has to name what the room you are in is played with. */
import { PALETTES, STONE_SETS, AUTO_STONES, DOJO_THEME, SYSTEM_THEME, themeOf, stoneSetOf } from "../theme/index.js";

/** What the palette picker offers, in the order it offers them: follow the
 *  device first, then the named rooms, then the one this device built.
 *
 *  The System plate is drawn in whichever room it currently resolves to — that
 *  is what `drawAs` is for — so it shows the answer it is giving rather than
 *  standing there grey among ten coloured plates. */
export const roomsFor = (dojo, room) => [
  { id: SYSTEM_THEME, name: "System", mood: "Automatic", drawAs: room },
  ...PALETTES,
  ...(dojo ? [{ ...dojo, id: DOJO_THEME, name: dojo.name || "Your dojo", mood: "Yours" }] : []),
];

/** The stone picker's entries: the room's own set first, which is not a set but
 *  an answer that changes with the room, then the eight in the drawer. */
export const setsFor = (room, dojo) => [
  {
    id: AUTO_STONES,
    name: "The room's own",
    note: `Every room names the set it was designed around: ${themeOf(room, dojo).name} is played with ${stoneSetOf(room, dojo).name.toLowerCase()}. Change rooms and the stones change with them.`,
  },
  ...STONE_SETS,
];
