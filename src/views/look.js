/* ----------------------- WHAT THE LOOK PAGE OFFERS -----------------------
   The two lists behind the pickers, kept out of the view so they can be tested
   the way gameStatus and accountForm are. Neither decides anything: they put
   the rooms and the sets in the order a player should meet them, and write the
   one sentence that has to name what the room you are in is played with.

   Both take the reader as their last argument and default to English, so they
   stay pure: the words come in, nothing here reaches for a language. A stone
   set's name is the catalogue's when the catalogue has one and the data file's
   when it does not, which is the same bargain every overlaid line makes. */
import {
  PALETTES, STONE_SETS, AUTO_STONES, DOJO_THEME, SYSTEM_THEME, REVIEW_THEME,
  themeOf, stoneSetOf, withStones, tokensFor,
} from "../theme/index.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/** How wide the still life beside the drawer is drawn, in px.
 *
 *  One number, read twice: the view hands it to the Board as `sizePx` and
 *  writes it onto .look-stones as --look-board, which is the first grid track.
 *  They have to agree. When the track was `auto` it sized itself to the widest
 *  thing in the column -- the contrast sentence, not the board -- and took four
 *  hundred pixels the drawer needed. */
export const PREVIEW_PX = 340;

/** What a set is called in the language in force. */
export const setName = (set, t = EN) => t(`stones.${set.id}.name`, null, set.name);

/** What the palette picker offers, in the order it offers them: follow the
 *  device first, then the rooms you can sit in, then the one this device built.
 *
 *  The System plate is drawn in whichever room it currently resolves to (that
 *  is what `drawAs` is for) so it shows the answer it is giving rather than
 *  standing there grey among the coloured plates.
 *
 *  The review room is not here. It is a real palette and it is in PALETTES, but
 *  it is somewhere review mode puts you rather than somewhere you choose to be:
 *  offered as a preference it turned the whole place into a printed diagram and
 *  took the stone picker with it, since a printed room draws ink and paper
 *  whatever set is in the drawer. See REVIEW_THEME in palettes.js. */
export const roomsFor = (dojo, room, t = EN) => [
  { id: SYSTEM_THEME, name: t("look.room.systemName"), mood: t("look.room.systemMood"), drawAs: room },
  // A room keeps its name and loses its English: `mood` is the one word on a
  // plate that is a description rather than a name.
  ...PALETTES.filter(p => p.id !== REVIEW_THEME)
    .map(p => ({ ...p, mood: t(`mood.${p.mood.toLowerCase()}`, null, p.mood) })),
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

/** The room a stone plate is drawn in: the one in force, with the printing
 *  turned off.
 *
 *  A plate's whole job is to show a set, and in the printed room no set has a
 *  look of its own: a kifu prints in ink and paper whatever is in the drawer,
 *  so nine plates drawn in that room would be nine identical plates and a
 *  picker with nothing to pick between.
 *
 *  Since the review room left the picker this is a guard rather than a
 *  correction: nobody can be standing in a printed room while reading this
 *  page, because the only way into one is review mode, which draws its own
 *  screen. It stays because it costs one spread and it is the thing that would
 *  quietly break if a printed room were ever made choosable again. */
export const platePalette = (room, dojo) => ({ ...themeOf(room, dojo), print: false });

/** The tokens one stone plate wears: the plate palette, played with that set.
 *  Through `withStones`, because the first entry in the picker is not a set —
 *  `auto` means "the room's own", and only withStones knows to leave the
 *  room's own choice standing rather than writing "auto" in as an id nothing
 *  recognises, which resolves to the house set and drew the plate labelled
 *  "the room's own" in a set the room does not play with. */
export const plateVars = (room, dojo, setId) => tokensFor(withStones(platePalette(room, dojo), setId));
