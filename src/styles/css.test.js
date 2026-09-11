/* ----------------------- THE STYLESHEET, AUDITED -----------------------
   Two rules that a stylesheet cannot enforce on itself. Neither is about
   taste: both are the difference between text somebody can read in every room
   and text that happens to be readable in the room it was drawn in.

   1. No word is dimmed with an opacity. An opacity is a fixed fraction of
      whatever is behind it, and on paper a fraction of the ink is not quiet
      text, it is a rumour of it: House ink at `.55` measures 2.60:1. The two
      quiet inks are derived per room and stop where the rule says stop.
   2. No word is coloured with `--accent` or `--danger`. Both are marks, held
      to 3:1 because that is what a mark needs; `--accent-ink` and
      `--danger-ink` are the same hues carried to 4.5:1, and those are the
      ones that may be spent on glyphs. */
import { describe, it, expect } from "vitest";
import { CSS } from "./css.js";
import { PALETTES, themeVars, contrast, cutBlack, cutWhite, stonesOf, HOUSE_STONES } from "../theme/index.js";
import { TOKEN_NAMES } from "../theme/tokens.js";

/** Every rule in the sheet, as { selector, body }. Good enough for this: the
 *  sheet has no nested at-rule bodies that a brace count would trip on beyond
 *  media queries, which contribute their own inner rules and nothing else. */
function rules(css) {
  const out = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    out.push({ selector: m[1].trim().split("\n").at(-1).trim(), body: m[2] });
  }
  return out;
}

/** The smallest size a rule can render at: the low end of a clamp(), or the
 *  plain px if there is no clamp. Infinity when the rule sets no size at all,
 *  since it then inherits one and cannot claim the large-text licence. */
function smallestSize(body) {
  const clamp = /font-size: clamp\((\d+(?:\.\d+)?)px/.exec(body);
  if (clamp) return Number(clamp[1]);
  const plain = /font(?:-size)?: (?:\d+ )?(\d+(?:\.\d+)?)px/.exec(body);
  return plain ? Number(plain[1]) : 0;
}

/** A rule that draws text rather than a shape. Shapes are allowed an opacity
 *  and are allowed the mark: a territory dot, a step bar, a stone, a rule. */
const DRAWS_TEXT = body =>
  /font-size|font-family|font:|letter-spacing|line-height|text-transform/.test(body);

describe("the stylesheet", () => {
  // The sheet's `.sente-root` block is the one place it may name a colour: it
  // is what a browser draws before the shell has spread a single custom
  // property. The stones there are the house set, and nothing but arithmetic
  // keeps them so — which is what they are checked against.
  it("ships the house set as the stylesheet's own stones", () => {
    const root = CSS.split(".sente-root {")[1].split("\n}")[0];
    const val = (name) => new RegExp(`--stone-${name}: (#[0-9a-f]{6})`).exec(root)[1];
    const set = stonesOf(HOUSE_STONES);
    expect(["b-1", "b-2", "b-3"].map(val)).toEqual(cutBlack(set.b));
    expect(["w-1", "w-2", "w-3"].map(val)).toEqual(cutWhite(set.w));
  });

  // The front door's headline is sized off the window while its column may
  // shrink past it, so a wide display face runs "beautifully" over the board
  // beside it. Both columns are lifted onto one layer to clear the stone field,
  // and on one layer the board wins: it comes second and carries an opaque
  // ground, so the word stopped at it rather than crossing it. The words are
  // what the page is for, so the copy has to outrank it.
  //
  // Declaring a z-index is not enough and that is the whole point of this test:
  // the band rule is three classes wide and comes late in the sheet, so a plain
  // .lp-hero-copy { z-index: 2 } loses the cascade and changes nothing on screen.
  it("keeps the landing headline above the board it can overlap", () => {
    // Every selector in this sheet is plain: classes only, and a class inside
    // :not() weighs what it would weigh outside it.
    const weight = sel => (sel.match(/[.][a-z][a-z0-9-]*/g) || []).length;
    const z = body => { const m = /z-index: (-?\d+)/.exec(body); return m ? Number(m[1]) : null; };

    const all = rules(CSS);
    const band = all.findIndex(r => r.selector.startsWith(".lp-ground >") && z(r.body) !== null);
    const copy = all.findIndex(r => /[.]lp-hero-copy$/.test(r.selector) && z(r.body) !== null);
    expect(band, "the band rule that lifts both columns").toBeGreaterThan(-1);
    expect(copy, "a rule giving .lp-hero-copy its own layer").toBeGreaterThan(-1);

    // above the board, and actually winning the cascade to get there
    expect(z(all[copy].body)).toBeGreaterThan(z(all[band].body));
    expect(weight(all[copy].selector)).toBeGreaterThanOrEqual(weight(all[band].selector));
    expect(copy, "stated after the rule it answers").toBeGreaterThan(band);
  });

  it("dims no word with an opacity", () => {
    const offenders = rules(CSS)
      .filter(r => DRAWS_TEXT(r.body) && /opacity: \.\d/.test(r.body))
      .map(r => r.selector);
    expect(offenders, "use --ink-2 (4.5:1) or --ink-3 (3:1, large type only)").toEqual([]);
  });

  // Large type is the one place the mark may colour a word, because 3:1 is
  // where WCAG's own floor for large text sits — which is the same floor the
  // mark is already held to. Below that size the readable version is the only
  // one allowed, so the exemption is measured from the rule's own font-size
  // rather than granted by name.
  it("colours no word with a mark, unless the word is set large", () => {
    const offenders = rules(CSS)
      .filter(r => DRAWS_TEXT(r.body) && /color: var\(--(accent|danger)\);/.test(r.body))
      .filter(r => smallestSize(r.body) < 24)
      .map(r => r.selector);
    expect(offenders, "use --accent-ink or --danger-ink").toEqual([]);
  });

  it("asks for no colour the token contract does not promise", () => {
    const asked = new Set([...CSS.matchAll(/var\((--[a-z0-9-]+)/g)].map(m => m[1]));
    const promised = new Set([...TOKEN_NAMES, "--accent"]);
    const colourish = [...asked].filter(n => /ink|accent|danger|ground|cream|grid|light|dark/.test(n));
    for (const n of colourish) expect(promised.has(n), `${n} is not in TOKEN_NAMES`).toBe(true);
  });
});

describe("the quiet inks, in every room", () => {
  it("keeps secondary text readable at any size", () => {
    for (const p of PALETTES) {
      const v = themeVars(p.id);
      expect(contrast(v["--ink-2"], v["--ground"]), `${p.id} --ink-2`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps incidental text at the large-text floor", () => {
    for (const p of PALETTES) {
      const v = themeVars(p.id);
      expect(contrast(v["--ink-3"], v["--ground"]), `${p.id} --ink-3`).toBeGreaterThanOrEqual(3);
    }
  });

  // The point of the two is that they are quieter than the ink. A room where
  // they came back at full strength would pass the floors and say nothing.
  it("keeps both quieter than the ink they came from", () => {
    for (const p of PALETTES) {
      const v = themeVars(p.id);
      const [ink, i2, i3] = [v["--ink"], v["--ink-2"], v["--ink-3"]].map(c => contrast(c, v["--ground"]));
      expect(i2, `${p.id}`).toBeLessThan(ink);
      expect(i3, `${p.id}`).toBeLessThan(i2);
    }
  });

  it("carries the mark and the warning up to reading contrast", () => {
    for (const p of PALETTES) {
      const v = themeVars(p.id);
      expect(contrast(v["--accent-ink"], v["--ground"]), `${p.id} --accent-ink`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(v["--danger-ink"], v["--ground"]), `${p.id} --danger-ink`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
