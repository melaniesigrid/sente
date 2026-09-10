/* ----------------------- THEMES (the palette) -----------------------
   A theme is data, like a pairing or a persona. It carries the six tones the
   design system is built from and nothing else:

     ground    the paper everything sits on
     light     the highlight side of every shadow
     dark      the shadow side of every shadow
     ink       the text, and the black stone
     cream     the white stone, the dot, the territory mark
     accent    the one colour that means "this, here"

   The neumorphism itself does not move. Every raised thing is still the same
   two shadows — one light from the top left, one dark from the bottom right —
   and every sunken thing is those two shadows turned inward. A theme only says
   what those two shadows are made of, which is why a dark theme still reads as
   the same object pressed out of a different material rather than as a second
   design.

   `light` and `dark` must sit close to `ground` in value. That closeness is the
   whole illusion: a highlight far from its ground stops looking like light and
   starts looking like a border. On the dark themes the highlight is a warm or
   cool lift of the ground rather than white, because a white edge on a dark
   panel reads as a hairline, not as a lit face.

   `shInk` and `shLite` are the rgb triples the drop shadows and the small inset
   rims are mixed from — the same two lights, available where a shadow needs an
   alpha rather than a solid.

   Stones keep their own colours. Slate and shell are real objects and they do
   not take a tint from the room; the dark themes only lift the black stone's
   crown a little so it separates from the board it sits on.

   `house` is the design system as drawn and stays the default. */

export const THEMES = [
  {
    id: "house",
    name: "House",
    note: "Warm stone paper and a eucalyptus mark. The design system as drawn.",
    mood: "Light",
    ground: "#e8e4db", light: "#fbf8f2", dark: "#c4beb1",
    ink: "#4b463c", cream: "#f2ede3",
    accent: "95,140,126", danger: "#b0715f",
    shInk: "75,70,60", shLite: "251,248,242",
    washA: "rgba(251,248,242,.55)", washB: "rgba(196,190,177,.40)",
    scrim: "rgba(232,228,219,.72)",
  },
  {
    id: "kaya",
    name: "Kaya",
    note: "The board's own wood: pale honey, and a caramel mark. Warmest of the light rooms.",
    mood: "Light",
    ground: "#ebe0c8", light: "#fbf3dd", dark: "#cabb9b",
    ink: "#4a4133", cream: "#f8f1de",
    accent: "141,105,58", danger: "#b0604a",
    shInk: "74,65,51", shLite: "251,243,221",
    washA: "rgba(251,243,221,.55)", washB: "rgba(202,187,155,.42)",
    scrim: "rgba(235,224,200,.74)",
  },
  {
    id: "porcelain",
    name: "Porcelain",
    note: "Cool white clay with an indigo mark. Quiet, modern, a little clinical.",
    mood: "Light",
    ground: "#e6e9ee", light: "#ffffff", dark: "#c2c8d3",
    ink: "#3b4453", cream: "#f6f8fb",
    accent: "74,111,165", danger: "#a85a63",
    shInk: "59,68,83", shLite: "255,255,255",
    washA: "rgba(255,255,255,.6)", washB: "rgba(194,200,211,.42)",
    scrim: "rgba(230,233,238,.74)",
  },
  {
    id: "damson",
    name: "Damson",
    note: "Pastel plum paper under a damson mark. Dusk, with the lamp not on yet.",
    mood: "Light",
    ground: "#eae2ec", light: "#f9f3fa", dark: "#c8bccb",
    ink: "#463d4b", cream: "#f4eef5",
    accent: "123,79,134", danger: "#b0605f",
    shInk: "70,61,75", shLite: "249,243,250",
    washA: "rgba(249,243,250,.58)", washB: "rgba(200,188,203,.42)",
    scrim: "rgba(234,226,236,.74)",
  },
  {
    id: "lacquer",
    name: "Lacquer",
    note: "Black lacquer and gold leaf. The formal room: a tournament board under a low lamp.",
    mood: "Dark",
    ground: "#17140f", light: "#241f17", dark: "#0a0806",
    ink: "#e9e0cd", cream: "#f2e9d5",
    accent: "201,164,92", danger: "#c4705c",
    shInk: "0,0,0", shLite: "78,66,47",
    washA: "rgba(201,164,92,.10)", washB: "rgba(0,0,0,.45)",
    scrim: "rgba(15,13,9,.76)",
    grid: "rgba(201,164,92,.34)",
    stoneB: ["#4a453b", "#2b2721", "#141210"],
  },
  {
    id: "graphite",
    name: "Graphite",
    note: "Dark grey and champagne. The same room as Lacquer with the warmth taken out.",
    mood: "Dark",
    ground: "#24262a", light: "#2f3238", dark: "#17181b",
    ink: "#dfe1e5", cream: "#edeff2",
    accent: "211,178,115", danger: "#cf7f6d",
    shInk: "0,0,0", shLite: "86,91,100",
    washA: "rgba(211,178,115,.08)", washB: "rgba(0,0,0,.38)",
    scrim: "rgba(28,30,33,.76)",
    stoneB: ["#5a564d", "#37342e", "#1e1c19"],
  },
  {
    id: "sumi",
    name: "Sumi",
    note: "Ink wash on a near-black ground, with celadon. House after dark.",
    mood: "Dark",
    ground: "#1c1e1c", light: "#262a26", dark: "#111310",
    ink: "#dededa", cream: "#eef0ea",
    accent: "127,168,146", danger: "#c07a68",
    shInk: "0,0,0", shLite: "72,80,72",
    washA: "rgba(127,168,146,.09)", washB: "rgba(0,0,0,.40)",
    scrim: "rgba(20,22,20,.76)",
    stoneB: ["#565248", "#34312b", "#1b1a17"],
  },
  {
    id: "yohen",
    name: "Yohen",
    note: "Kiln-changed indigo and copper. The night game, played by the window.",
    mood: "Dark",
    ground: "#1a1d26", light: "#242833", dark: "#101219",
    ink: "#dcdfe8", cream: "#eaecf3",
    accent: "192,127,82", danger: "#c76a6a",
    shInk: "0,0,0", shLite: "72,80,98",
    washA: "rgba(192,127,82,.09)", washB: "rgba(0,0,0,.42)",
    scrim: "rgba(18,20,27,.76)",
    stoneB: ["#524e46", "#31302c", "#1a191a"],
  },
];

export const DEFAULT_THEME = "house";

/** Slate and shell, as they are cut. A theme may lift the black stone's crown
 *  so it reads against a dark board; nothing else about a stone is themed. */
const STONE_B = ["#6b655a", "#4b463c", "#3a362e"];
const STONE_W = ["#fdfaf4", "#f2ede3", "#ddd5c6"];

/** The theme with this id, or the house theme. Never throws. */
export function themeOf(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

/** True when a theme's ground is darker than its ink — the app is in a dark
 *  room and anything that assumed a paper ground has to be told. */
export function isDark(t) {
  return t.mood === "Dark";
}

/** The custom properties `.sente-root` needs for a theme. The shell spreads
 *  these onto the root element's style beside the pairing's, so no stylesheet
 *  is rewritten and no class is toggled. */
export function themeVars(id) {
  const t = themeOf(id);
  const b = t.stoneB || STONE_B;
  const w = t.stoneW || STONE_W;
  return {
    "--ground": t.ground,
    "--light": t.light,
    "--dark": t.dark,
    "--ink": t.ink,
    "--cream": t.cream,
    "--accent-rgb": t.accent,
    "--danger": t.danger,
    "--sh-ink": t.shInk,
    "--sh-lite": t.shLite,
    "--wash-a": t.washA,
    "--wash-b": t.washB,
    "--scrim": t.scrim,
    "--grid": t.grid || "var(--ink)",
    "--stone-b-1": b[0], "--stone-b-2": b[1], "--stone-b-3": b[2],
    "--stone-w-1": w[0], "--stone-w-2": w[1], "--stone-w-3": w[2],
  };
}
