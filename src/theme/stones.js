/* ----------------------- THE STONE SETS -----------------------
   A go set is two objects, and until now Sente had exactly one of them: Nachi
   slate and Hyuga clam, hard-coded, the same two colours in every room. The
   board was themed and the pieces on it were not, which is the one place the
   illusion broke — a violet room with grey-brown stones is somebody else's
   stones borrowed for the evening.

   So the stones are data now, like a palette or a pairing. A set is two
   colours: the core of the black stone and the core of the white one.
   Everything else — the lit crown, the rim that turns as the surface curves
   away, and the seating a dark board asks for — is arithmetic, in the same
   spirit as derive.js: author two colours, get a stone.

   Every named room names the set it is played with, and a player may override
   that from the look page. `auto` is not a set: it means the room decides. */
import { mix, lighten, darken } from "./color.js";

/** Not a set — the answer "whatever this room is played with". Resolved before
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

/** The set with this id, or the house set. Never throws — it is called with
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

/** One core colour -> the three stops the board's gradient wants: the lit
 *  crown, the body, the rim. The constants are read off the drawn house stones
 *  and then applied to every set, so a new set is two colours and nothing else. */
export const cutBlack = (core) => [lighten(core, 0.17), core, darken(core, 0.22)];
export const cutWhite = (core) => [lighten(core, 0.72), core, mix(core, RIM, 0.35)];
