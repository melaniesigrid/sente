/* ----------------------- THE STONE SETS -----------------------
   A go set is two objects, and until now Sente had exactly one of them: Nachi
   slate and Hyuga clam, hard-coded, the same two colours in every room. The
   board was themed and the pieces on it were not, which is the one place the
   illusion broke: a violet room with grey-brown stones is somebody else's
   stones borrowed for the evening.

   So the stones are data now, like a palette or a pairing. A set is two
   colours: the core of the black stone and the core of the white one.
   Everything else (the lit crown, and the rim that turns as the surface curves
   away) is arithmetic, in the same spirit as derive.js: author two colours, get
   a stone. Nothing here asks what room it is in, and since 2026-09-15 nothing
   asks what board either: there is one wood and a stone is cut for it.

   Every named room names the set it is played with, and a player may override
   that from the look page. `auto` is not a set: it means the room decides. */
import { mix, lighten, darken } from "./color.js";

/** Not a set: the answer "whatever this room is played with". Resolved before
 *  anything is drawn, the way `system` is resolved for a palette. */
export const AUTO_STONES = "auto";

/** The set the design system was drawn with, and the fallback for anything
 *  unrecognised. */
export const HOUSE_STONES = "slate";

export const STONE_SETS = [
  {
    id: "slate", name: "Slate & shell",
    note: "Nachi slate and Hyuga clam, cut as they are actually cut. The house set, and the one the design system was drawn around.",
    b: "#4b463c", w: "#f2ede3",
  },
  {
    id: "ebony", name: "Ink & ivory",
    note: "No warmth in the black and none in the white. The tournament set: the sharpest pair in the drawer, and the easiest to read at speed.",
    b: "#22201d", w: "#fbf8f1",
  },
  {
    id: "jade", name: "Jade & shell",
    note: "Green stone, the way a celadon glaze goes nearly black where it pools. Quiet on a dark board, unmistakable on a pale one.",
    b: "#26473c", w: "#edf3ea",
  },
  {
    id: "lapis", name: "Lapis & pearl",
    note: "Blue-black stone against a cool pearl. The coldest set here, and the one that keeps its blue under lamplight.",
    b: "#25334c", w: "#eaeef8",
  },
  {
    id: "plum", name: "Plum & blossom",
    note: "A purple so dark it only shows on the crown, and a white with the same hue in it a shade off paper.",
    b: "#3b2946", w: "#f5ecf4",
  },
  {
    id: "cinnabar", name: "Cinnabar & bone",
    note: "Lacquer red taken almost to black, and bone. The warmest black in the drawer.",
    b: "#48241e", w: "#f8ece2",
  },
  {
    id: "honey", name: "Walnut & honey",
    note: "The wooden set: dark walnut and a honeyed shell. Softest of the eight, and the only one that reads warm on both sides.",
    b: "#3a3025", w: "#f6e6c6",
  },
  {
    id: "moss", name: "Moss & rice",
    note: "Wet moss and unpolished rice. Nearly the house set with the grey taken out of both halves.",
    b: "#333d28", w: "#f0f2e0",
  },
];

export const STONE_IDS = STONE_SETS.map(s => s.id);

/** The set with this id, or the house set. Never throws: it is called with
 *  stored data and with palette data alike. */
export function stonesOf(id) {
  return STONE_SETS.find(s => s.id === id) || STONE_SETS[0];
}

/** Every id a profile may legally hold, `auto` included. */
export function isStoneId(id) {
  return id === AUTO_STONES || STONE_IDS.includes(id);
}

/** The shade a shell rim turns as the surface curves away from the light. It is
 *  warm, and it is warm for every set, because that is what a rim is: less
 *  light, not a different colour. Mixing toward this rather than toward black
 *  is what keeps a white stone from going grey at its edge. */
const RIM = "#b9a98a";

/** One core colour -> the three stops a stone is drawn from: the lit crown,
 *  the body, the rim. The constants are read off the drawn stones and then
 *  applied to every set, so a new set is two colours and nothing else. The
 *  black crown is the body a quarter of the way to white, which is the exact
 *  highlight the game screen was drawn with (2026-09-15): every stone in the
 *  app paints it as one hard, bright disc on the left shoulder, at the size of
 *  a game and at the size of a plum alike.
 *
 *  The white crown is the one stop nothing draws today: a white stone is a
 *  body and a rim, because a highlight on a stone that is already the lightest
 *  thing in the room says nothing. It is cut anyway, so that a set stays two
 *  colours in and a full stone out, and so the pair of cuts stay symmetrical. */
export const cutBlack = (core) => [lighten(core, 0.25), core, darken(core, 0.22)];
/* The rim is a turn of the surface, not a separator, and it cannot become one:
   RIM is within 1.21:1 of the wood, so cutting the rim deeper walks it toward
   the board rather than away from it (measured, every set: a third of the way
   gives 1.31-1.40:1 on kaya, half gives 1.15-1.21:1). What holds a white stone
   off the wood is its body, at 1.6-1.8:1, which is what a real board does. */
export const cutWhite = (core) => [lighten(core, 0.72), core, mix(core, RIM, 0.35)];
