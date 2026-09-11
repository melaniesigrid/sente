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

   A fifth voice belongs to no pairing at all. A passage from the Classic is
   typed, not set, and every pairing types it on the same machine: see
   TYPEWRITER below. The quote voice above still carries Moku and the asides.

   No script stands anywhere in the set. A script is a display face and nothing
   else: it cannot carry a quotation and it cannot carry a caption, because at
   13px it is decoration standing where a word should be — and the ornament voice
   is read mid-sentence, at reading size. So the quote voice is always a serif —
   its own where the pairing has one, Fraunces' or Newsreader's italic where it
   does not — and the captions follow the italic when that italic is real and the
   body face when it is not.

   Nothing here is ever slanted by the browser. The Typecase cuts are single-style,
   and a faux oblique on a hairline didone or on a script is the tell of a page
   nobody set: only the Google faces, which ship a real italic, are asked for one.

   Display faces come from the Typecase library; body faces are Google's open
   text families, self-hosted like everything else, because a UI body face needs
   four real weights and accents and the Typecase text cuts are demo cuts
   without them. Every display face here was
   checked for digits: Joseki sets ranks, ratings and lesson numbers in the display
   face, so a face missing 0-9 could not be used however handsome it was.

   `house` is the design system as drawn and stays the default. */

/** The text families the body side needs. They used to arrive as an @import to
 *  fonts.googleapis.com, which made Google's CDN the one third party a reader's
 *  browser talked to on its own, on every visit, before a stone was placed.
 *  They are served from here now: the files are in src/fonts/google and the
 *  @font-face blocks in src/styles/googleFaces.js, both written by
 *  tools/fonts/fetch.mjs. The weights and axes each one is cut at live in that
 *  tool; this is the list of names, which is what a pairing refers to.
 *  All five are under the Open Font Licence, which is what makes hosting them
 *  here allowed as well as polite. */
export const GOOGLE_FAMILIES = [
  "Fraunces", "Hanken Grotesk", "Instrument Sans", "Newsreader", "Courier Prime",
];

/* ----------------------- THE TYPED VOICE -----------------------
   A passage is typed, not set. Sente's renderings are one person at a machine
   putting down someone else's words a thousand years later, and that is a
   different act from setting a quotation in the pairing's italic: the italic
   makes the classic decorative, the typewriter makes it evidence. So a passage
   comes out of the same machine in every pairing, the way the signature stays
   one hand in every pairing, and `--font-typewriter` is the one token
   typefaceVars returns the same value for every time.

   Courier Prime is the typewriter face drawn to be read rather than to be
   counted in: Courier's skeleton, stems with weight in them, and a real bold —
   which the marked words need, since a mark that is only a colour is not a mark
   on a monochrome screen. */
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
    note: "A low-waisted serif with long ascenders, and Fraunces' italic for the asides. Airy, like a fresh board.",
    display: "'sente-welorac', 'Fraunces', serif",
    // The ornament voice carries the emphasised word in the landing hero and the
    // lesson numerals: mid-sentence, at reading size. A logo script stood here and
    // could not do that job — at 13px it was decoration where a word should be.
    // Fraunces' real italic is legible, and it gives Welorac's roman something to
    // contrast with, which the display face set against itself could not.
    italic: "'Fraunces', serif",
    italicStyle: "italic",
    body: HANKEN,
    quote: "'Fraunces', serif", quoteStyle: "italic",
    weight: 400, strong: 400, tracking: "0.005em", leading: 1.18,
    credit: "Welorac via Typecase (demo cut, personal use) · Fraunces (Undercase, OFL) · Hanken Grotesk (OFL)",
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
