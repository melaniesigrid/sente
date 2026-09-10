import { describe, it, expect } from "vitest";
import { TYPEFACES, DEFAULT_TYPEFACE, typefaceOf, typefaceVars, captionOf, quoteOf, GOOGLE_IMPORT } from "./typeface.js";
import { FONT_FACES } from "../styles/fontfaces.js";
import { CSS } from "../styles/css.js";

const VARS = [
  "--font-display", "--font-display-italic", "--display-italic-style",
  "--font-body", "--font-quote", "--quote-style", "--font-caption", "--caption-style",
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

  it("keeps an already-slanted script upright", () => {
    for (const t of TYPEFACES) {
      const script = /script|bellique|ronalltie/.test(t.italic);
      expect(t.italicStyle, t.id).toBe(script ? "normal" : "italic");
    }
  });

  it("keeps a script out of the quotes and the captions", () => {
    for (const t of TYPEFACES) {
      expect(quoteOf(t), t.id).not.toMatch(/script|bellique|ronalltie/);
      expect(captionOf(t), t.id).not.toMatch(/script|bellique|ronalltie/);
    }
  });

  it("sets the quotes in a serif wherever the pairing owns one", () => {
    for (const t of TYPEFACES.filter(t => t.id !== "signal")) {
      expect(quoteOf(t), t.id).toMatch(/serif$/);
    }
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

  it("loads every Google family a pairing asks for", () => {
    for (const t of TYPEFACES) {
      for (const family of [t.display, t.italic, t.body, quoteOf(t), captionOf(t)]) {
        const name = (family.match(/^'([^']+)'/) || [])[1];
        if (!name || name.startsWith("sente-")) continue;
        expect(GOOGLE_IMPORT, `${t.id} wants ${name}`).toContain(`family=${name.replace(/ /g, "+")}`);
      }
    }
  });
});
