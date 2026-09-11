import { describe, it, expect } from "vitest";
import { TYPEFACES, DEFAULT_TYPEFACE, TYPEWRITER, typefaceOf, typefaceVars, captionOf, quoteOf, GOOGLE_FAMILIES } from "./typeface.js";
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
