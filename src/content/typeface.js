/* ----------------------- TYPEFACES (the pairings) -----------------------
   A pairing is data, like a persona or a seal colour: a display face, the face
   that carries the italic voice, and a body face. Nothing else about the design
   system moves — the stone palette and the two-shadow neumorphism are fixed, and
   every face is normalised onto Fraunces' optical size in fontfaces.js, so
   picking a pairing changes the voice and not the layout.

   `leading` is the hero's line height: a face with long ascenders needs more of it
   than Fraunces does at the same size.

   A pairing speaks in four voices, and only the first two are set by the face
   that gives the pairing its name:

     display   headings and numerals              --font-display
     quote     Moku, the sayings, the asides      --font-quote
     caption   the footer, the small labels       --font-caption
     ornament  the lesson numeral, the vs mark    --font-display-italic

   A fifth voice belongs to no pairing at all: the sayings of the Classic are
   typed, not set, and every pairing types them on the same machine. See
   TYPEWRITER below.

   A script is a display face and nothing else. It cannot carry a quotation and it
   cannot carry a caption: at 13px it is decoration standing where a word should
   be. So the scripts here are the ornament voice only, the quote voice is always
   a serif — its own where the pairing has one, Fraunces' or Newsreader's italic
   where it does not — and the captions fall to the body face. The exceptions are
   the two pairings marked `serifless`, Signal and Hoshi, whose whole idea is that
   there is no serif anywhere in them; they quote in their own italic instead.

   Nothing here is ever slanted by the browser. The Typecase cuts are single-style,
   and a faux oblique on a hairline didone or on a script is the tell of a page
   nobody set: only the Google faces, which ship a real italic, are asked for one.

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
  "&family=Courier+Prime:ital,wght@0,400;0,700;1,400" +
  "&display=swap');";

/* ----------------------- THE TYPED VOICE -----------------------
   A quotation is typed, not set. Sente's sayings are one person at a machine
   putting down someone else's words, so they come out of a typewriter in every
   pairing, the way the signature stays one hand in every pairing. This stack is
   not part of any pairing and never changes with one; `--font-typewriter` is the
   one token typefaceVars returns the same value for every time.

   Courier Prime is the typewriter face that was drawn to be read rather than to
   be counted in: same twelve-pitch skeleton as Courier, heavier stems, a real
   italic and a real bold, so the marked words in a saying have somewhere to go. */
export const TYPEWRITER = "'Courier Prime', 'Courier New', monospace";

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
    quote: "'Fraunces', serif", quoteStyle: "italic",
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
    quote: "'Fraunces', serif", quoteStyle: "italic",
    weight: 400, strong: 400, tracking: "0.005em", leading: 1.18,
    credit: "Welorac and Bellique via Typecase (demo cuts, personal use)",
  },
  {
    id: "galliard",
    name: "Galliard House",
    note: "The one three-part family we have, doing all three jobs: high-contrast serif for the headings, its script for the whisper, its own sans for the facts.",
    display: "'sente-galliard-serif', 'Fraunces', serif",
    italic: "'sente-galliard-script', 'Fraunces', serif",
    italicStyle: "normal",
    body: "'sente-galliard-sans', 'Hanken Grotesk', sans-serif",
    caption: "'sente-galliard-sans', 'Hanken Grotesk', sans-serif",
    quote: "'sente-galliard-serif', 'Fraunces', serif", quoteStyle: "normal",
    weight: 400, strong: 400, tracking: "0em", leading: 1.06,
    credit: "Maison Galliard, serif and script and sans, via Typecase (demo cuts, personal use)",
  },
  {
    id: "wedge",
    name: "Wedge",
    note: "Wedge serifs, a narrow stance, and no script anywhere. The most matter-of-fact of them all.",
    display: "'sente-kuigaf', 'Fraunces', serif",
    italic: "'sente-kuigaf', 'Fraunces', serif",
    italicStyle: "normal",
    body: HANKEN,
    quote: "'sente-kuigaf', 'Fraunces', serif", quoteStyle: "normal",
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
    quote: "'Newsreader', Georgia, serif", quoteStyle: "italic",
    weight: 400, strong: 400, tracking: "0.01em", leading: 1.1,
    credit: "Raventhorn and Ronalltie via Typecase (demo cuts, personal use) · Newsreader (Production Type, OFL)",
  },
  {
    id: "signal",
    name: "Signal",
    note: "No serifs at all: a tall condensed sans for the headings against a plain grotesk. The loudest and the flattest.",
    display: "'sente-further', 'Hanken Grotesk', sans-serif",
    italic: "'sente-further', 'Hanken Grotesk', sans-serif",
    italicStyle: "normal",
    body: "'Instrument Sans', sans-serif",
    quote: "'Instrument Sans', sans-serif", quoteStyle: "italic",
    serifless: true,
    weight: 400, strong: 400, tracking: "0.015em", leading: 1.06,
    credit: "Further via Typecase (demo cut, personal use) · Instrument Sans (OFL)",
  },
  {
    id: "hoshi",
    name: "Hoshi",
    note: "Geometric to the bone, and set the way the modernists set a poster: perfect circles at hairline weight, tracked wide, nothing decorative anywhere. Named for the star points it is drawn from.",
    display: "'sente-cocogoose', 'Hanken Grotesk', sans-serif",
    italic: "'sente-cocogoose-italic', 'Hanken Grotesk', sans-serif",
    italicStyle: "normal",
    body: HANKEN,
    quote: "'sente-cocogoose-italic', 'Hanken Grotesk', sans-serif", quoteStyle: "normal",
    serifless: true,
    weight: 400, strong: 400, tracking: "0.06em", leading: 1.14,
    credit: "Cocogoose Pro, Thin and Light Italic (Zetafonts, trial, personal use) · Hanken Grotesk (OFL)",
  },
  {
    id: "vitrine",
    name: "Vitrine",
    note: "The shop window on the good street: a didone cut down to hairlines, a plain grotesk underneath it, and the sayings in a newsreader italic. Extreme contrast up top and nothing raised anywhere else.",
    display: "'sente-qliesya', 'Fraunces', serif",
    italic: "'sente-qliesya', 'Fraunces', serif",
    italicStyle: "normal",
    body: "'Instrument Sans', sans-serif",
    quote: "'Newsreader', Georgia, serif", quoteStyle: "italic",
    weight: 400, strong: 400, tracking: "0.045em", leading: 1.08,
    credit: "Qliesya via Typecase (demo cut, personal use) · Instrument Sans and Newsreader (OFL)",
  },
];

export const DEFAULT_TYPEFACE = "house";

/** The face a quotation, an aside or Moku speaks in: never a script, and a serif
 *  wherever the pairing has one. */
export function quoteOf(t) {
  return t.quote || t.body;
}

/** The face small type speaks in: the pairing's own `caption` if it names one,
 *  otherwise the italic when it is a true italic and the body face when it is a
 *  script. */
export function captionOf(t) {
  return t.caption || (t.italicStyle === "italic" ? t.italic : t.body);
}

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
    "--font-quote": quoteOf(t),
    "--font-typewriter": TYPEWRITER,
    "--quote-style": t.quote ? t.quoteStyle : "normal",
    "--font-caption": captionOf(t),
    "--caption-style": captionOf(t) === t.italic ? t.italicStyle : "normal",
    "--w-display": String(t.weight),
    "--w-display-strong": String(t.strong),
    "--display-tracking": t.tracking,
    "--display-leading": String(t.leading),
  };
}
