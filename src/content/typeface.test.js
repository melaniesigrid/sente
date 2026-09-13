import { describe, it, expect } from "vitest";
import { TYPEFACES, DEFAULT_TYPEFACE, TYPEWRITER, typefaceOf, typefaceVars, withScript, captionOf, quoteOf, GOOGLE_FAMILIES } from "./typeface.js";
import { FONT_FACES } from "../styles/fontfaces.js";
import { GOOGLE_FACES } from "../styles/googleFaces.js";
import { FAMILIES as FETCHED } from "../../tools/fonts/fetch.mjs";
import { CSS } from "../styles/css.js";

const VARS = [
  "--font-display", "--font-display-italic", "--display-italic-style",
  "--font-body", "--font-quote", "--quote-style", "--font-caption", "--caption-style",
  "--font-typewriter",
  "--w-display", "--w-display-strong", "--display-tracking",
  "--display-leading",
];

describe("typeface pairings", () => {
  it("has unique ids and the house pairing as the default", () => {
    const ids = TYPEFACES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TYPEFACES[0].id).toBe(DEFAULT_TYPEFACE);
    expect(typefaceOf(DEFAULT_TYPEFACE).display).toContain("Fraunces");
  });

  it("describes every pairing", () => {
    for (const t of TYPEFACES) {
      expect(t.name.length, t.id).toBeGreaterThan(0);
      expect(t.note.length, t.id).toBeGreaterThan(20);
      expect(t.credit.length, t.id).toBeGreaterThan(10);
      expect(t.note, t.id).not.toContain("!");   // house style
      expect(t.leading, t.id).toBeGreaterThanOrEqual(1.04);
    }
  });

  it("ends every family stack in a generic family", () => {
    for (const t of TYPEFACES) {
      for (const stack of [t.display, t.italic, t.body, quoteOf(t), captionOf(t)]) {
        expect(stack, `${t.id}: ${stack}`).toMatch(/(serif|sans-serif|monospace)$/);
      }
    }
  });

  it("only names local faces that fontfaces.js declares", () => {
    for (const t of TYPEFACES) {
      for (const family of `${t.display} ${t.italic} ${t.body} ${quoteOf(t)} ${captionOf(t)}`.match(/sente-[a-z-]+/g) || []) {
        expect(FONT_FACES, `${t.id} wants ${family}`).toContain(`font-family: '${family}'`);
      }
    }
  });

  it("asks a single-weight face for weight 400 only", () => {
    for (const t of TYPEFACES.filter(t => t.id !== "house")) {
      expect(t.weight, t.id).toBe(400);
      expect(t.strong, t.id).toBe(400);
    }
  });

  it("never asks the browser to slant a local cut", () => {
    // The Typecase cuts are single-style: a faux oblique on a hairline serif or a
    // script is the tell of a page nobody set. Only the Google faces, which ship a
    // real italic, are ever asked for one.
    for (const t of TYPEFACES) {
      expect(t.italicStyle, t.id).toBe(/sente-/.test(t.italic) ? "normal" : "italic");
    }
  });

  // A script is a display face and nothing else. There is none left in the set,
  // and this is what keeps one from walking back into a caption: the ornament
  // voice is read mid-sentence at reading size, where a script is decoration
  // standing where a word should be.
  it("keeps a script out of every voice, the ornament included", () => {
    for (const t of TYPEFACES) {
      for (const voice of [t.display, t.italic, t.body, quoteOf(t), captionOf(t)]) {
        expect(voice, t.id).not.toMatch(/script|bellique|ronalltie/);
      }
    }
  });

  it("sets the quotes in a serif", () => {
    for (const t of TYPEFACES) expect(quoteOf(t), t.id).toMatch(/serif$/);
  });

  it("never slants a face that has no italic of its own", () => {
    for (const t of TYPEFACES) {
      const local = /sente-/.test(quoteOf(t));       // local cuts are single-style
      expect(t.quoteStyle, t.id).toBe(local ? "normal" : "italic");
    }
  });

  it("sets every token for every pairing", () => {
    for (const t of TYPEFACES) {
      const vars = typefaceVars(t.id);
      expect(Object.keys(vars).sort()).toEqual([...VARS].sort());
      for (const v of VARS) expect(String(vars[v]).length, `${t.id} ${v}`).toBeGreaterThan(0);
    }
  });

  it("types a passage on the same machine, whatever the pairing", () => {
    // The typed voice belongs to no pairing, the way the signature belongs to none.
    // A passage is one person at a typewriter in every room in the house.
    expect(TYPEWRITER).toMatch(/monospace$/);
    for (const t of TYPEFACES) expect(typefaceVars(t.id)["--font-typewriter"], t.id).toBe(TYPEWRITER);
    const name = (TYPEWRITER.match(/^'([^']+)'/) || [])[1];
    expect(GOOGLE_FAMILIES).toContain(name);
    // and the stylesheet asks for it by token, never by name, below the defaults
    const body = CSS.slice(CSS.indexOf(".sente-root *"));
    expect(body).toContain("var(--font-typewriter)");
    expect(body).not.toMatch(/font-family:[^;}]*Courier/);   // the prose may name it; a rule may not
  });

  it("falls back to the house pairing for an unknown id", () => {
    for (const junk of ["", "nope", null, undefined, 7]) {
      expect(typefaceOf(junk).id).toBe(DEFAULT_TYPEFACE);
    }
    expect(typefaceVars("nope")).toEqual(typefaceVars(DEFAULT_TYPEFACE));
  });
});

/* ----------------------- THE HAN FALLBACK -----------------------
   None of the pairings has a Han glyph in it and none of them ever will, so a
   Chinese or Japanese reader is served the faces already on the device, behind
   the pairing rather than instead of it. Three things can go wrong quietly
   here: the fallback goes missing and the reader gets tofu, the two languages
   share a list and a Japanese reader is shown Chinese shapes of the characters
   they have in common -- the harder kind of wrong to notice, because nothing
   is missing -- or the register slips and a didone sits on top of a gothic. */
describe("the Han fallback", () => {
  const FONT_VARS = [
    "--font-display", "--font-display-italic", "--font-body",
    "--font-quote", "--font-caption", "--font-typewriter",
  ];

  it("puts the reader's own Han faces behind every voice, in both languages", () => {
    for (const locale of ["zh", "ja"]) {
      for (const t of TYPEFACES) {
        const vars = typefaceVars(t.id, locale);
        for (const v of FONT_VARS) {
          expect(vars[v], `${locale} ${t.id} ${v}`).toMatch(/(CJK|Han)/);
        }
      }
    }
  });

  it("keeps the pairing in front, so the latin in a chinese sentence is still the pairing", () => {
    /* A browser falls through per character. The Han comes off the device only
       because nothing in front of it has the character, which is only true if
       the pairing's own faces are still the front of the list.

       The generic keyword is the one thing that does NOT stay where it was: a
       generic always matches, so it has to sit behind the Han names or it ends
       the fallback before the browser reads them. So the prefix that must hold
       is the pairing's list with its generic taken off the end. */
    const GENERIC = /(^|,\s*)(serif|sans-serif|monospace|system-ui|cursive|fantasy)\s*$/;
    for (const locale of ["zh", "ja"]) {
      for (const t of TYPEFACES) {
        const vars = typefaceVars(t.id, locale);
        const plain = typefaceVars(t.id);
        for (const v of FONT_VARS) {
          const generic = GENERIC.exec(plain[v]);
          const named = generic ? plain[v].slice(0, generic.index) : plain[v];
          expect(vars[v].startsWith(`${named}, `), `${locale} ${t.id} ${v}`).toBe(true);
          // And the generic is still there, now last, where it can do no harm.
          if (generic) expect(GENERIC.test(vars[v]), `${locale} ${t.id} ${v} generic`).toBe(true);
        }
      }
    }
  });

  it("serves the two languages different faces", () => {
    // They share characters and draw several of them differently. A Japanese
    // reader handed Songti sees the wrong shape rather than a missing glyph.
    for (const t of TYPEFACES) {
      const zh = typefaceVars(t.id, "zh");
      const ja = typefaceVars(t.id, "ja");
      for (const v of FONT_VARS) expect(zh[v], `${t.id} ${v}`).not.toBe(ja[v]);
    }
    expect(withScript("'Fraunces', serif", "zh")).toMatch(/Songti|SC/);
    expect(withScript("'Fraunces', serif", "ja")).toMatch(/Mincho|JP/);
  });

  it("keeps a serif voice in a serif and a sans voice in a gothic", () => {
    // The pairing's own generic keyword is what says which, and `sans-serif`
    // ends in the letters `serif` without being one: reading it as a serif
    // would put a Mincho under every grotesk in the app.
    expect(withScript("'Fraunces', serif", "ja")).toMatch(/Mincho/);
    expect(withScript("'Hanken Grotesk', sans-serif", "ja")).toMatch(/Gothic|Hiragino Sans/);
    expect(withScript("'Hanken Grotesk', sans-serif", "ja")).not.toMatch(/Mincho/);
    expect(withScript("'Hanken Grotesk', sans-serif", "zh")).not.toMatch(/Songti/);
    // The typewriter is a slab to begin with, and a passage set in a gothic
    // would be a notice board.
    expect(withScript(TYPEWRITER, "zh")).toMatch(/Songti/);
  });

  it("puts a Cyrillic face behind both Slavic languages, in the pairing's register", () => {
    // Not a CJK-sized problem: a generic keyword resolves to a real face with
    // real Cyrillic everywhere. It is a better-drawing problem, and the two
    // languages are set in the same letters, so they get the same list.
    expect(withScript("'Fraunces', serif", "ru")).toMatch(/PT Serif|Georgia/);
    expect(withScript("'Fraunces', serif", "uk")).toBe(withScript("'Fraunces', serif", "ru"));
    expect(withScript("'Hanken Grotesk', sans-serif", "ru")).toMatch(/PT Sans|Segoe UI/);
    expect(withScript("'Hanken Grotesk', sans-serif", "ru")).not.toMatch(/PT Serif/);
    // The generic keeps its place at the end, so the browser still has a floor.
    expect(withScript("'Fraunces', serif", "ru").trimEnd()).toMatch(/serif$/);
  });

  it("leaves a latin language, and anything that is not a list, alone", () => {
    for (const locale of ["en", "es", "fr", "de", undefined, null, "tlh", "system"]) {
      expect(withScript("'Fraunces', serif", locale), String(locale)).toBe("'Fraunces', serif");
      for (const t of TYPEFACES) {
        expect(typefaceVars(t.id, locale), `${t.id} ${locale}`).toEqual(typefaceVars(t.id));
      }
    }
    for (const junk of [undefined, null, 7, {}]) {
      expect(withScript(junk, "zh")).toBe(junk);
    }
  });

  it("moves the families and nothing else", () => {
    // Weights, tracking, leading and the two style tokens are the pairing's,
    // not the language's: `--caption-style` is decided by comparing the caption
    // voice with the italic, and a fallback appended to both must not part them.
    for (const t of TYPEFACES) {
      const plain = typefaceVars(t.id);
      for (const locale of ["zh", "ja"]) {
        const vars = typefaceVars(t.id, locale);
        expect(Object.keys(vars).sort(), `${t.id} ${locale}`).toEqual(Object.keys(plain).sort());
        for (const [k, v] of Object.entries(plain)) {
          if (FONT_VARS.includes(k)) continue;
          expect(vars[k], `${t.id} ${locale} ${k}`).toBe(v);
        }
      }
    }
  });

  it("still types a passage on one machine within a language", () => {
    // The typed voice belongs to no pairing. It picks up a Han fallback like
    // every other voice, but it is still the same string in every room.
    for (const locale of ["zh", "ja"]) {
      const typed = typefaceVars(TYPEFACES[0].id, locale)["--font-typewriter"];
      for (const t of TYPEFACES) {
        expect(typefaceVars(t.id, locale)["--font-typewriter"], `${locale} ${t.id}`).toBe(typed);
      }
      // The machine's own faces still lead; only its `monospace` moved to the back.
      expect(typed.startsWith(TYPEWRITER.replace(/,\s*monospace\s*$/, "")), locale).toBe(true);
      expect(typed.endsWith("serif"), locale).toBe(true);
    }
  });
});

describe("the stylesheet consumes the tokens", () => {
  it("names no font family directly outside the house defaults", () => {
    const body = CSS.slice(CSS.indexOf(".sente-root *"));
    expect(body).not.toContain("Fraunces");
    expect(body).not.toContain("Hanken Grotesk");
  });

  it("declares a default for every token", () => {
    for (const v of VARS) expect(CSS, v).toContain(`${v}:`);
  });

  /* Self-hosted since 2026-09-11. These three hold the chain together: a
     pairing may only name a family that is declared, a declared family must
     actually have files behind it, and the list of names here must match the
     list the fetch tool downloads. Break any link and the face silently falls
     back to a system serif, which is the kind of bug nobody files. */
  it("declares an @font-face for every family it claims to host", () => {
    for (const name of GOOGLE_FAMILIES) {
      expect(GOOGLE_FACES, `no face for ${name}`).toContain(`font-family: '${name}'`);
    }
  });

  it("hosts exactly the families the fetch tool downloads", () => {
    const fetched = FETCHED.map(f => f.split(":")[0].replace(/\+/g, " ")).sort();
    expect(fetched).toEqual([...GOOGLE_FAMILIES].sort());
  });

  it("asks the network for nothing: no @import, no remote url", () => {
    expect(CSS).not.toContain("@import");
    expect(CSS).not.toContain("fonts.googleapis.com");
    expect(CSS).not.toContain("fonts.gstatic.com");
    expect(CSS).not.toMatch(/url\(\s*['"]?https?:/);
  });

  it("keeps the unicode-range on every face, so a latin page skips latin-ext", () => {
    const faces = GOOGLE_FACES.match(/@font-face/g) || [];
    const ranges = GOOGLE_FACES.match(/unicode-range:/g) || [];
    expect(faces.length).toBeGreaterThan(0);
    expect(ranges.length).toBe(faces.length);
  });

  it("loads every Google family a pairing asks for", () => {
    for (const t of TYPEFACES) {
      for (const family of [t.display, t.italic, t.body, quoteOf(t), captionOf(t)]) {
        const name = (family.match(/^'([^']+)'/) || [])[1];
        if (!name || name.startsWith("sente-")) continue;
        expect(GOOGLE_FAMILIES, `${t.id} wants ${name}`).toContain(name);
      }
    }
  });
});
