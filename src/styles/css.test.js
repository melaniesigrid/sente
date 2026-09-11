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
  // keeps them so, which is what they are checked against.
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
  // where WCAG's own floor for large text sits, which is the same floor the
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

/* A reader who asked for less motion is the one reader the sheet can fail
   silently. Every other rule here is checked by looking at it; a rule that
   loses the cascade looks exactly like a rule that works, and the only place it
   turns up is on somebody's machine with the system switch on. So the switch is
   checked by arithmetic rather than by reading: a rule that turns an animation
   off has to outweigh the rule it is turning off, or it changes nothing at all.

   It is the trap the landing headline fell into, in the same shape:
   `.fig.playing .fig-ring` does not beat `.fig.playing .fig-ring.out`, however
   far down the sheet it is written. */
describe("the motion switch", () => {
  /* Selectors in this sheet are plain: element names, classes, descendant
     combinators and commas. A "subject" is the last compound, the element a
     rule draws -- and it is a compound and not a class list because some of
     what this sheet animates is a bare element: `.fig-grid line` draws lines. */
  const each = sel => sel.split(",").map(one => one.trim()).filter(Boolean);
  const classes = sel => sel.match(/[.][a-z][a-z0-9-]*/g) || [];
  const compound = (token) => [
    ...(token.match(/^[a-z][a-z0-9-]*/) || []),
    ...(token.match(/[.][a-z][a-z0-9-]*/g) || []),
  ];
  const subject = sel => compound(sel.trim().split(/\s+/).at(-1) || "");
  /** True when `off` is aimed at whatever `on` draws: same element, and every
   *  ancestor it names is one `on` names too. */
  const covers = (off, on) =>
    subject(off).length > 0
    && subject(off).every(c => subject(on).includes(c))
    && classes(off).every(c => classes(on).includes(c));

  /** Every rule in the sheet, flat, with whether it sits inside a
   *  prefers-reduced-motion block. The sheet nests one deep: a media query
   *  with plain rules in it and nothing else. */
  function ruled(source) {
    /* Comments come out first. They are the only thing between a rule's brace
       and the one before it, and leaving them in forced an earlier version of
       this to keep just the last line of a selector -- which silently dropped
       half of every selector written across two lines, and a dropped selector
       reads exactly like a rule that is missing. */
    const css = source.replace(/\/\*[\s\S]*?\*\//g, " ");

    /* The switch's blocks, as [from, to) in the text. A rule is inside one or
       it is not; asking a flat scan to remember where it is inside a media
       query is how a test like this quietly stops testing anything. */
    const blocks = [];
    for (const m of css.matchAll(/@media[^{]*prefers-reduced-motion[^{]*\{/g)) {
      let depth = 1, i = m.index + m[0].length;
      while (i < css.length && depth > 0) {
        if (css[i] === "{") depth++;
        else if (css[i] === "}") depth--;
        i++;
      }
      blocks.push([m.index, i]);
    }
    const out = [];
    for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      const head = m[1].trim().replace(/\s+/g, " ");
      if (!head || head.startsWith("@")) continue;
      out.push({
        selector: head, body: m[2], at: m.index,
        reduce: blocks.some(([a, b]) => m.index > a && m.index < b),
      });
    }
    return out;
  }

  it("stops every animation the switch was written to stop", () => {
    const all = ruled(CSS);
    const quiet = all
      .filter(r => r.reduce && /animation:\s*none|display:\s*none/.test(r.body))
      .flatMap(r => each(r.selector).map(selector => ({ selector, at: r.at })));

    const offenders = [];
    for (const r of all.filter(rule => !rule.reduce && /animation:\s*(?!none)[a-z]/.test(rule.body)))
      for (const sel of each(r.selector)) {
        const aimed = quiet.filter(q => covers(q.selector, sel));
        // a rule the switch says nothing about is not this test's business
        if (!aimed.length) continue;
        /* Specificity first, and source order when specificity ties -- which
           is the whole cascade and not half of it. An equal-weight switch rule
           written ABOVE the rule it means to stop is a silent no-op: it loses
           on order, it looks exactly like a rule that works, and an earlier
           version of this test passed it. */
        if (aimed.some(q => classes(q.selector).length > classes(sel).length)) continue;
        if (aimed.some(q => classes(q.selector).length === classes(sel).length && q.at > r.at)) continue;
        offenders.push(sel);
      }
    expect(offenders, "a switch rule that loses on weight or on order").toEqual([]);
  });

  /* The other half of the same guarantee. The test above catches a switch rule
     that loses on specificity; this one catches the switch rule that was never
     written. They fail on opposite mistakes and a decoration needs both: the
     first is how the capture ring kept animating for a reader who asked for
     none, and the second is the ordinary way the next animation will.

     Scoped to the two decorations this rule is about. The rest of the sheet has
     its own reasons for moving and is not in scope here. */
  it("leaves no decoration animating with the switch on", () => {
    const all = ruled(CSS);
    const quiet = all
      .filter(r => r.reduce && /animation:\s*none|display:\s*none/.test(r.body))
      .flatMap(r => each(r.selector));

    const unguarded = all
      .filter(r => !r.reduce && /animation:\s*(?!none)[a-z]/.test(r.body))
      .flatMap(r => each(r.selector))
      .filter(sel => /\.fig|\.stone-field|\.fs-/.test(sel))
      .filter(sel => !quiet.some(q => covers(q, sel)));

    expect(unguarded, "an animation the switch never mentions").toEqual([]);
  });

  // An animation whose keyframes are not in the sheet is not an error anywhere:
  // the browser runs nothing and the element simply sits there, which looks
  // exactly like a stone that was never told to move. A renamed keyframe block
  // is the ordinary way that happens.
  it("names no animation the sheet does not define", () => {
    const defined = new Set([...CSS.matchAll(/@keyframes\s+([a-z0-9-]+)/g)].map(m => m[1]));
    const used = new Set([...CSS.matchAll(/animation:\s*([a-z][a-z0-9-]*)/g)]
      .map(m => m[1]).filter(n => n !== "none" && n !== "inherit"));
    for (const name of used) expect(defined.has(name), `@keyframes ${name}`).toBe(true);
    expect(used.has("fs-lift"), "the field's departing stone").toBe(true);
    expect(used.has("fig-hole"), "the figure's capture ring").toBe(true);
  });
});
