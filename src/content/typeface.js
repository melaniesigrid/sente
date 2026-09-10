/* ----------------------- TYPEFACES (the pairings) -----------------------
   A pairing is data, like a persona or a seal colour: a display face, the face
   that carries the italic voice, and a body face. Nothing else about the design
   system moves — the stone palette and the two-shadow neumorphism are fixed, and
   every face is normalised onto Fraunces' optical size in fontfaces.js, so
   picking a pairing changes the voice and not the layout.

   `leading` is the hero's line height: a face with long ascenders needs more of it
   than Fraunces does at the same size.

   Display faces come from the Typecase library; body faces are Google-hosted
   text families, because a UI body face needs four real weights and accents and
   the Typecase text cuts are demo cuts without them. Every display face here was
   checked for digits: Sente sets ranks, ratings and lesson numbers in the display
   face, so a face missing 0-9 could not be used however handsome it was.

   `house` is the design system as drawn and stays the default. */

/** Google families the body side needs, in one lazy stylesheet: a browser only
 *  fetches the files for a family something on the page actually renders. */
export const GOOGLE_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?" +
  "family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,560;0,9..144,640;1,9..144,420" +
  "&family=Hanken+Grotesk:wght@400;500;600;700" +
  "&family=Instrument+Sans:wght@400;500;600;700" +
  "&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400" +
  "&display=swap');";

const HANKEN = "'Hanken Grotesk', sans-serif";

export const TYPEFACES = [
  {
    id: "house",
    name: "House",
    note: "Fraunces and Hanken Grotesk. The design system as drawn.",
    display: "'Fraunces', serif",
    italic: "'Fraunces', serif",
    italicStyle: "italic",
    body: HANKEN,
    weight: 560, strong: 640, tracking: "0em", leading: 1.04,
    credit: "Fraunces (Undercase, OFL) · Hanken Grotesk (Alfredo Marco Pradil, OFL)",
  },
  {
    id: "kaya",
    name: "Kaya",
    note: "A low-waisted serif with long ascenders, and a steady logo script for the asides. Airy, like a fresh board.",
    display: "'sente-welorac', 'Fraunces', serif",
    italic: "'sente-bellique', 'Fraunces', serif",
    italicStyle: "normal",
    body: HANKEN,
    weight: 400, strong: 400, tracking: "0.005em", leading: 1.18,
    credit: "Welorac and Bellique via Typecase (demo cuts, personal use)",
  },
  {
    id: "galliard",
    name: "Galliard",
    note: "One three-part brand system doing all the display work: high-contrast serif for headings, its own script for the italics.",
    display: "'sente-galliard-serif', 'Fraunces', serif",
    italic: "'sente-galliard-script', 'Fraunces', serif",
    italicStyle: "normal",
    body: "'Instrument Sans', sans-serif",
    weight: 400, strong: 400, tracking: "0em", leading: 1.06,
    credit: "Maison Galliard via Typecase (demo cut, personal use) · Instrument Sans (Rodrigo Fuenzalida, OFL)",
  },
  {
    id: "wedge",
    name: "Wedge",
    note: "Wedge serifs, a narrow stance, and no script anywhere. The most matter-of-fact of the six.",
    display: "'sente-kuigaf', 'Fraunces', serif",
    italic: "'sente-kuigaf', 'Fraunces', serif",
    italicStyle: "italic",
    body: HANKEN,
    weight: 400, strong: 400, tracking: "0em", leading: 1.06,
    credit: "Kuigaf via Typecase (demo cut, personal use) · Hanken Grotesk (OFL)",
  },
  {
    id: "clubhouse",
    name: "Clubhouse",
    note: "Spurred Victorian capitals over a newsprint serif, with a signature script for the asides. A go club with a painted window.",
    display: "'sente-raventhorn', 'Fraunces', serif",
    italic: "'sente-ronalltie', 'Fraunces', serif",
    italicStyle: "normal",
    body: "'Newsreader', Georgia, serif",
    weight: 400, strong: 400, tracking: "0.01em", leading: 1.1,
    credit: "Raventhorn and Ronalltie via Typecase (demo cuts, personal use) · Newsreader (Production Type, OFL)",
  },
  {
    id: "signal",
    name: "Signal",
    note: "No serifs at all: a tall condensed sans for the headings against a plain grotesk. The loudest and the flattest.",
    display: "'sente-further', 'Hanken Grotesk', sans-serif",
    italic: "'sente-further', 'Hanken Grotesk', sans-serif",
    italicStyle: "italic",
    body: "'Instrument Sans', sans-serif",
    weight: 400, strong: 400, tracking: "0.015em", leading: 1.06,
    credit: "Further via Typecase (demo cut, personal use) · Instrument Sans (OFL)",
  },
];

export const DEFAULT_TYPEFACE = "house";

/** The pairing with this id, or the house pairing. Never throws. */
export function typefaceOf(id) {
  return TYPEFACES.find(t => t.id === id) || TYPEFACES[0];
}

/** The custom properties `.sente-root` needs for a pairing. The shell spreads
 *  these onto the root element's style, so no stylesheet is rewritten. */
export function typefaceVars(id) {
  const t = typefaceOf(id);
  return {
    "--font-display": t.display,
    "--font-display-italic": t.italic,
    "--display-italic-style": t.italicStyle,
    "--font-body": t.body,
    "--w-display": String(t.weight),
    "--w-display-strong": String(t.strong),
    "--display-tracking": t.tracking,
    "--display-leading": String(t.leading),
  };
}
