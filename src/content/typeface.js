/* ----------------------- TYPEFACES (the pairings) -----------------------
   A pairing is data, like a persona or a seal colour: a display face, the face
   that carries the italic voice, and a body face. Nothing else about the design
   system moves: the stone palette and the two-shadow neumorphism are fixed, and
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
   13px it is decoration standing where a word should be, and the ornament voice
   is read mid-sentence, at reading size. So the quote voice is always a serif (
   its own where the pairing has one, Fraunces' or Newsreader's italic where it
   does not) and the captions follow the italic when that italic is real and the
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
   counted in: Courier's skeleton, stems with weight in them, and a real bold,
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
    // could not do that job: at 13px it was decoration where a word should be.
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

/* ----------------------- THE SCRIPT FALLBACK -----------------------
   None of the pairings has a Han glyph in it, and none of them ever will: a
   full CJK family is five to fifteen megabytes and this whole app is smaller
   than one of them. So Chinese and Japanese are set in the faces the reader
   already has, and the pairing still does its job, because a browser falls
   through per character: the Latin in a Chinese sentence is still Fraunces,
   and only the Han comes off the device.

   The two scripts get different lists on purpose. They share characters and
   draw several of them differently, so a Japanese reader served a Chinese face
   sees the wrong shapes rather than a missing glyph, which is the harder kind
   of wrong to notice.

   A serif voice keeps a serif fallback. The quotation voice and the didone
   display are the whole reason the pairings exist, and Songti or Mincho under
   them is nearer to the intent than a gothic would be; `serif` and `sans-serif`
   at the end of the pairing's own list is what says which, and the typewriter
   counts as one: a passage from the Classic set in a gothic would be a notice
   board, and the machine that types it is a slab face to begin with.

   Cyrillic is the same problem one size smaller. None of the pairings has a
   Cyrillic glyph either: the display faces are Typecase demo cuts, and the five
   Google text families are self-hosted as the latin and latin-ext subsets
   alone, because that is all Google cuts for them. A Russian or Ukrainian
   sentence would otherwise land on whatever the generic keyword resolves to,
   which is a real face with real Cyrillic on every platform and is simply not
   as good a drawing as the ones named here.

   Russian and Ukrainian share one list, and that is not laziness: the two are
   set in the same letters. Ukrainian uses four that Russian does not (i, i with
   a diaeresis, ye, and ghe with upturn), but a face that has Cyrillic has them,
   and nothing in either language asks for a different shape of a shared letter
   the way Chinese and Japanese do. */
const CYRILLIC = {
  sans: "'PT Sans', 'Segoe UI', 'Helvetica Neue', 'Noto Sans', 'Arial', sans-serif",
  serif: "'PT Serif', 'Georgia', 'Times New Roman', 'Noto Serif', serif",
};

/* Hebrew is the third version of the same problem, and it brings one of its
   own. None of the pairings has a Hebrew glyph, so the letters come off the
   device exactly as the Han and the Cyrillic do. But Hebrew also has no italic
   and no case: there is no second drawing of the alphabet to lean on, and the
   slanted voices in this design system are load-bearing. A browser asked for
   italic where no italic exists synthesises one by shearing the upright, which
   is the faux oblique this file opens by refusing. So a script may say it has
   no italic, and the pairing's slanted voices come back upright for it.

   The same is arguably true of Han, and Chinese and Japanese are deliberately
   left alone here: they shipped in the drawing they shipped in, and changing
   how they are set is a design decision somebody should make on purpose rather
   than a side effect of adding a language. */
const HEBREW = {
  sans: "'Arial Hebrew', 'Segoe UI', 'Noto Sans Hebrew', 'Arial', sans-serif",
  serif: "'Frank Ruehl CLM', 'FrankRuehl', 'New Peninim MT', 'David', 'Noto Serif Hebrew', serif",
  italic: false,
};

const SCRIPTS = {
  zh: {
    sans: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Source Han Sans SC', sans-serif",
    serif: "'Songti SC', 'SimSun', 'Noto Serif CJK SC', 'Source Han Serif SC', serif",
  },
  ja: {
    sans: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', 'Noto Sans CJK JP', sans-serif",
    serif: "'Hiragino Mincho ProN', 'Yu Mincho', 'YuMincho', 'Noto Serif CJK JP', 'Source Han Serif JP', serif",
  },
  ru: CYRILLIC,
  uk: CYRILLIC,
  he: HEBREW,
};

/** Does this language have a second, slanted drawing of its alphabet to fall
 *  back on. False only where the script has no italic at all, and what it buys
 *  is an upright instead of a sheared upright. */
export function hasItalic(locale) {
  return SCRIPTS[locale]?.italic !== false;
}

/** A family list with the reader's own faces behind it for a script none of
 *  the pairings can set, or the list unchanged for a language written in Latin
 *  letters. The pairing's own generic keyword picks the register, so a didone
 *  keeps a Mincho and a grotesk keeps a gothic. */
export function withScript(families, locale) {
  const fallback = SCRIPTS[locale];
  if (!fallback || typeof families !== "string") return families;
  const generic = /(^|,\s*)(serif|sans-serif|monospace|system-ui|cursive|fantasy)\s*$/.exec(families);
  const stack = /(^|,\s*)(serif|monospace)\s*$/.test(families) ? fallback.serif : fallback.sans;
  /* Ahead of the generic, not behind it. A generic family always matches, so a
     generic sitting in front of the fallback names ends per-character fallback before
     the browser ever reads them. Blink and Gecko resolve the generic and carry on
     in practice, but the spec does not promise that and the fix is free. */
  return generic
    ? `${families.slice(0, generic.index)}, ${stack}`
    : `${families}, ${stack}`;
}

/** The custom properties `.sente-root` needs for a pairing. The shell spreads
 *  these onto the root element's style, so no stylesheet is rewritten. */
export function typefaceVars(id, locale) {
  const t = typefaceOf(id);
  const script = (families) => withScript(families, locale);
  /* A script with no italic gets upright everywhere a pairing asks for a slant,
     rather than a sheared upright the browser drew itself. */
  const slant = (style) => (hasItalic(locale) ? style : "normal");
  return {
    "--font-display": script(t.display),
    "--font-display-italic": script(t.italic),
    "--display-italic-style": slant(t.italicStyle),
    "--font-body": script(t.body),
    "--font-quote": script(quoteOf(t)),
    "--font-typewriter": script(TYPEWRITER),
    "--quote-style": t.quote ? slant(t.quoteStyle) : "normal",
    "--font-caption": script(captionOf(t)),
    "--caption-style": captionOf(t) === t.italic ? slant(t.italicStyle) : "normal",
    "--w-display": String(t.weight),
    "--w-display-strong": String(t.strong),
    "--display-tracking": t.tracking,
    "--display-leading": String(t.leading),
  };
}
