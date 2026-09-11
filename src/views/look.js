/* ----------------------- WHAT THE LOOK PAGE OFFERS -----------------------
   The two lists behind the pickers, kept out of the view so they can be tested
   the way gameStatus and accountForm are. Neither decides anything: they put
   the rooms and the sets in the order a player should meet them, and write the
   one sentence that has to name what the room you are in is played with.

   Both take the reader as their last argument and default to English, so they
   stay pure: the words come in, nothing here reaches for a language. A stone
   set's name is the catalogue's when the catalogue has one and the data file's
   when it does not, which is the same bargain every overlaid line makes. */
import { PALETTES, STONE_SETS, AUTO_STONES, DOJO_THEME, SYSTEM_THEME, themeOf, stoneSetOf } from "../theme/index.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/** What a set is called in the language in force. */
export const setName = (set, t = EN) => t(`stones.${set.id}.name`, null, set.name);

/** What the palette picker offers, in the order it offers them: follow the
 *  device first, then the named rooms, then the one this device built.
 *
 *  The System plate is drawn in whichever room it currently resolves to — that
 *  is what `drawAs` is for — so it shows the answer it is giving rather than
 *  standing there grey among ten coloured plates. */
export const roomsFor = (dojo, room, t = EN) => [
  { id: SYSTEM_THEME, name: t("look.room.systemName"), mood: t("look.room.systemMood"), drawAs: room },
  // A room keeps its name and loses its English: `mood` is the one word on a
  // plate that is a description rather than a name.
  ...PALETTES.map(p => ({ ...p, mood: t(`mood.${p.mood.toLowerCase()}`, null, p.mood) })),
  ...(dojo ? [{ ...dojo, id: DOJO_THEME, name: dojo.name || t("look.room.yours"), mood: t("look.room.yoursMood") }] : []),
];

/** The stone picker's entries: the room's own set first, which is not a set but
 *  an answer that changes with the room, then the eight in the drawer. */
export const setsFor = (room, dojo, t = EN) => [
  {
    id: AUTO_STONES,
    name: t("look.stones.auto"),
    note: t("look.stones.autoNote", {
      room: themeOf(room, dojo).name,
      set: setName(stoneSetOf(room, dojo), t).toLowerCase(),
    }),
  },
  ...STONE_SETS,
];
