/* ----------------------- THE NAMED ROOMS -----------------------
   A palette is data, like a pairing or a persona. Four colours are always
   written by hand — ground, ink, mark, shell — and the rest is derived
   (derive.js) unless a hand-mixed tone beat the computed one, which is what the
   `light`/`dark`/`grid` overrides below are.

   Adding a room is one entry here — four colours, ground/ink/mark/shell. `npm test` will then hold it to the same
   rules the dojo shows a designer live: ink at 4.5:1, the mark no dimmer than
   the house eucalyptus, and the two lights within 2.4:1 of the ground, which is
   the whole illusion.

   `house` is the design system as drawn and stays the default. */

export const PALETTES = [
  {
    id: "house",
    name: "House",
    mood: "Light",
    note: "Warm stone paper and a eucalyptus mark. The design system as drawn.",
    ground: "#e8e4db", ink: "#4b463c", accent: "#5f8c7e", cream: "#f2ede3",
    light: "#fbf8f2", dark: "#c4beb1", danger: "#b0715f",
  },
  {
    id: "kaya",
    name: "Kaya",
    mood: "Light",
    note: "The board's own wood: pale honey, and a caramel mark. Warmest of the light rooms.",
    ground: "#ebe0c8", ink: "#4a4133", accent: "#8d693a", cream: "#f8f1de",
    light: "#fbf3dd", dark: "#cabb9b", danger: "#b0604a",
  },
  {
    id: "porcelain",
    name: "Porcelain",
    mood: "Light",
    note: "Cool white clay with an indigo mark. Quiet, modern, a little clinical.",
    ground: "#e6e9ee", ink: "#3b4453", accent: "#4a6fa5", cream: "#f6f8fb",
    light: "#ffffff", dark: "#c2c8d3", danger: "#a85a63",
  },
  {
    id: "damson",
    name: "Damson",
    mood: "Light",
    note: "Pastel plum paper under a damson mark. Dusk, with the lamp not on yet.",
    ground: "#eae2ec", ink: "#463d4b", accent: "#7b4f86", cream: "#f4eef5",
    light: "#f9f3fa", dark: "#c8bccb", danger: "#b0605f",
  },
  {
    id: "cinnabar",
    name: "Cinnabar",
    mood: "Light",
    note: "Blush paper, oxblood ink, and a lacquer-red mark. The one room led by a warm colour rather than by a neutral.",
    ground: "#f0dcd3", ink: "#45211a", accent: "#b0392a", cream: "#fdf3ee",
    // Every other light room warns in terracotta, which in a red room would be
    // the mark saying it again. A loss here is plum: still warm, still not
    // neutral, and impossible to mistake for the accent beside it.
    danger: "#7a2f52",
  },
  {
    id: "lacquer",
    name: "Lacquer",
    mood: "Dark",
    note: "Black lacquer and gold leaf. The formal room: a tournament board under a low lamp.",
    ground: "#17140f", ink: "#e9e0cd", accent: "#c9a45c", cream: "#f2e9d5",
    light: "#241f17", dark: "#0a0806", danger: "#c4705c",
    // The one room whose grid is not drawn in ink: gold leaf on black lacquer,
    // which is the object this palette is named for.
    grid: "#9c7f4c",
  },
  {
    id: "graphite",
    name: "Graphite",
    mood: "Dark",
    note: "Dark grey and champagne. The same room as Lacquer with the warmth taken out.",
    ground: "#24262a", ink: "#dfe1e5", accent: "#d3b273", cream: "#edeff2",
    light: "#2f3238", dark: "#17181b", danger: "#cf7f6d",
  },
  {
    id: "sumi",
    name: "Sumi",
    mood: "Dark",
    note: "Ink wash on a near-black ground, with celadon. House after dark.",
    ground: "#1c1e1c", ink: "#dededa", accent: "#7fa892", cream: "#eef0ea",
    light: "#262a26", dark: "#111310", danger: "#c07a68",
  },
  {
    id: "yohen",
    name: "Yohen",
    mood: "Dark",
    note: "Kiln-changed indigo and copper. The night game, played by the window.",
    ground: "#1a1d26", ink: "#dcdfe8", accent: "#c07f52", cream: "#eaecf3",
    light: "#242833", dark: "#101219", danger: "#c76a6a",
  },
  {
    id: "foxfire",
    name: "Foxfire",
    mood: "Dark",
    note: "Wet bark and a chartreuse mark. The brightest thing in the set against the darkest ground in it.",
    ground: "#14170f", ink: "#e3e9d5", accent: "#b9d94a", cream: "#f1f5e2",
    // The mark sits a long way above the ink in luminance, which no other dark
    // room does: gold, copper and celadon all sit under theirs. It is what makes
    // this room read as lit from inside rather than lamplit.
    danger: "#d9705a",
  },
];

/** The room the design system was drawn in. Every rule's floor is measured
 *  against it, and it is what anything unrecognised falls back to. */
export const HOUSE_THEME = "house";

/** The id a palette built in the dojo answers to. It is not in PALETTES: it
 *  lives in the profile, one per device, and only exists once someone has made
 *  one. */
export const DOJO_THEME = "dojo";

/** Follow the device. This is what a profile ships set to, because someone
 *  opening Joseki at night on a dark machine should not be handed full-brightness
 *  cream and left to go find the setting.
 *
 *  It is not a palette and never appears in PALETTES — it is a pointer at two of
 *  them, resolved at render time by resolveTheme(). Sumi rather than Lacquer for
 *  the dark half: Lacquer is a formal room you choose, Sumi is house after dark,
 *  and the automatic answer should be the quiet one. */
export const SYSTEM_THEME = "system";
export const SYSTEM_PAIR = { light: HOUSE_THEME, dark: "sumi" };
