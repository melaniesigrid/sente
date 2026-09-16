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

  // The two shadows are a material, so a thing that rises to meet the pointer
  // has to go down under it. This is the rule that caught the tile, the persona
  // and the lesson card: all three lifted on hover and then had nothing to say
  // at the moment of the click, which is the one moment the reader is asking
  // the question. A press moves a thing one rung down the ladder
  // (--raise, --raise-sm, --press, --sink-sm, --sink), so the check is that the
  // press exists and that it moves a shadow rather than only a pixel: a press
  // that only translates is a thing sliding, not a thing being pushed.
  //
  // .look-btn is the one exception, and it is not one: it is worn with
  // .icon-btn, which presses, and it adds a press of its own only for the room
  // it is currently showing.
  it("presses everything that lifts", () => {
    const bare = (one, pseudo) => one.split(pseudo)[0].replace(/:not\([^)]*\)/g, "").trim();
    const parts = sel => sel.split(",").map(one => one.trim());

    const lifts = new Set();
    const presses = new Set();
    for (const r of rules(CSS)) {
      for (const one of parts(r.selector)) {
        if (one.includes(":hover") && /transform: translateY\(-/.test(r.body)) lifts.add(bare(one, ":hover"));
        if (one.includes(":active") && /box-shadow:/.test(r.body)) presses.add(bare(one, ":active"));
      }
    }
    presses.add(".look-btn");

    const dead = [...lifts].filter(sel => ![...presses].some(p => p === sel || sel.startsWith(p)));
    expect(dead, "a raised thing that cannot be pressed into the ground").toEqual([]);
  });

  // The press and the lift are transforms, and an animation that fills forwards
  // owns every property it touched for the life of the element. The arrive
  // stagger runs on the direct children of .arrives, which is where the cards
  // live, so `both` there quietly cancelled the lift on every card on the
  // dashboard, the lobby and the library. Nothing in a screenshot says so: the
  // rules are all present and the cascade is fine. Only the animation wins.
  it("lets go of the cards it staggered in", () => {
    const arrive = rules(CSS).find(r => /[.]arrives > [*]$/.test(r.selector));
    expect(arrive, "the stagger rule").toBeTruthy();
    expect(arrive.body, "fills backwards, so hover and :active get the transform back")
      .toMatch(/animation:[^;]*backwards;/);
  });

  // In fast, out slow: the shadow answers the finger, and takes its own time
  // coming back. A press that eases in at the same speed as the release reads
  // as the surface catching up rather than as the surface answering.
  it("presses in faster than it comes back up", () => {
    const press = rules(CSS).find(r => /transition-duration/.test(r.body) && r.selector.includes(":active"));
    expect(press, "one rule setting the press duration for all of them").toBeTruthy();
    expect(Number(/transition-duration: \.(\d+)s/.exec(press.body)[1])).toBeLessThan(15);
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

/* ----------------------- A BASIS IS A WIDTH -----------------------
   Two bugs, the same shape, found on a phone. `flex: 2 1 520px` on the board
   well and `flex: 0 1 300px` on the lesson search box were both written while
   looking at a row, where the basis is a width. Both elements also sit in a
   column stack, and there the very same declaration is a HEIGHT: the well
   stood 520px tall around a 334px board, and the search box was a 300px tall
   input. Neither is visible in a text test of the markup and neither throws.

   So: an element that is laid out in a column somewhere may not carry a px
   flex basis unless the selector says which parent it means. A child
   combinator against the row is what says it. */
const COLUMN_DWELLERS = [
  // subject class, and the row-scoped selector it is allowed to be pinned to
  [".board-well", /\.play-wrap\s*>\s*\.board-well$/],
  [".search-row", /\bnever$/],
];

describe("a flex basis in px", () => {
  for (const [cls, allowed] of COLUMN_DWELLERS) {
    it(`is not written unscoped on ${cls}`, () => {
      for (const r of rules(CSS)) {
        if (!r.selector.split(",").some(s => s.trim().endsWith(cls))) continue;
        if (!/(^|;)\s*flex:[^;]*\d+px/.test(r.body)) continue;
        expect(r.selector, `${r.selector} sets a px flex basis where the axis is not known`)
          .toMatch(allowed);
      }
    });
  }

  // The well is the one that is actually square, so it gets the stronger claim:
  // whatever else the rule says, it must not pin the well any main size at all
  // except through the row.
  it("leaves the board well free to be as tall as it is wide", () => {
    const own = rules(CSS).filter(r => r.selector === ".board-well");
    expect(own.length, "the bare .board-well rule went missing").toBeGreaterThan(0);
    for (const r of own) {
      expect(r.body, ".board-well pins a main size").not.toMatch(/(^|;)\s*flex:/);
      expect(r.body, ".board-well pins a height").not.toMatch(/(^|;)\s*height:/);
    }
  });
});

/* ----------------------- THE SHEET RUNS BOTH WAYS -----------------------
   Hebrew is the first language read right to left, and the whole of the
   support for it is one attribute on the document element. That only works
   while the sheet asks for start and end rather than left and right, so this
   is the suite that keeps it asking.

   The failure a physical property causes is quiet: nothing throws, no snapshot
   moves, and a Hebrew page simply has one card left-aligned in a column of
   right-aligned ones, or an arrow pointing back the way it came. Nobody
   reading English will ever see it, which is exactly why it has to be a test
   and not a review. */
describe("the sheet runs in both directions", () => {
  /* Two rules keep their physical sides on purpose.

     `.goban` pins `direction: ltr` because its coordinate margin is text: A1
     belongs in the same corner in Tel Aviv as in Tokyo, and a board that
     mirrored would be a different board.

     The belt is a drawing of a knot rather than a sentence. Its stripe, tails
     and knot are a picture, and a picture does not turn around when the words
     beside it do. */
  const DRAWN = /^\.(goban|belt-|rank-badge)/;

  it("aligns text to the start of the line, never to the left of the screen", () => {
    for (const { selector, body } of rules(CSS)) {
      if (DRAWN.test(selector)) continue;
      expect(/text-align:\s*(left|right)\b/.test(body), `${selector}: ${body.trim()}`).toBe(false);
    }
  });

  it("spaces and rules a box by its start and end, not by its left and right", () => {
    for (const { selector, body } of rules(CSS)) {
      if (DRAWN.test(selector)) continue;
      const physical = body.match(/\b(padding|margin|border)-(left|right)\s*:/g) || [];
      expect(physical, `${selector}: ${physical.join(" ")}`).toEqual([]);
    }
  });

  /* A longhand is the easy half. The sides also hide inside shorthands, and a
     four-value `padding: a b c d` puts b on the right and d on the left as
     surely as `padding-left` does: the review that found these found five of
     them, every one beside a longhand sibling that HAD been converted. Only
     asymmetry matters — `padding: 7px 13px` is the same on both sides and
     mirrors for free. */
  it("spaces a box symmetrically, or logically, shorthand included", () => {
    const parts = (v) => v.match(/(?:[a-z-]+\([^()]*(?:\([^()]*\)[^()]*)*\)|[^\s])+/gi) || [];
    for (const { selector, body } of rules(CSS)) {
      if (DRAWN.test(selector)) continue;
      for (const m of body.matchAll(/\b(padding|margin):\s*([^;]+)/g)) {
        const v = parts(m[2]);
        if (v.length !== 4) continue;
        expect(v[1], `${selector}: ${m[0].trim()}`).toBe(v[3]);
      }
    }
  });

  /* A corner list is the other half. A speech bubble's tail, a card's notch:
     the tight corner is drawn to sit on the same edge as the thing that
     anchors it, and when that anchor is logical the corner has to be too, or
     every bubble in Hebrew points away from the person who said it. */
  it("turns an asymmetric corner around when its anchor is logical", () => {
    const ANCHORED = /inset-inline-(start|end)|border-inline-(start|end)|align-self:\s*flex-(start|end)|margin-inline-(start|end)|float:\s*inline-/;
    for (const { selector, body } of rules(CSS)) {
      if (DRAWN.test(selector) || !ANCHORED.test(body)) continue;
      const r = /border-radius:\s*([^;]+)/.exec(body);
      if (!r) continue;
      const v = r[1].trim().split(/\s+/);
      if (v.length !== 4) continue;
      expect(v[0] === v[1] && v[2] === v[3], `${selector}: ${r[0].trim()}`).toBe(true);
    }
  });

  /* A float is a side too, and `float: left` on a drop cap is the same bug in
     a third spelling. */
  it("floats to a side of the line, not a side of the screen", () => {
    for (const { selector, body } of rules(CSS)) {
      if (DRAWN.test(selector)) continue;
      expect(/float:\s*(left|right)\b/.test(body), `${selector}: ${body.trim()}`).toBe(false);
    }
  });

  /* The pairing decides the slant, so no rule may name one. A literal
     `font-style: italic` walks straight past `hasItalic` and asks a browser
     for an italic Hebrew, which it draws by shearing the upright. */
  it("takes its slant from the pairing and never from a literal", () => {
    for (const { selector, body } of rules(CSS)) {
      // A face declaring which cut it is, is the one place the word belongs.
      if (selector.startsWith("@font-face")) continue;
      const m = /font-style:\s*(italic|oblique)\b/.exec(body);
      expect(m, `${selector}: ${m && m[0]}`).toBe(null);
    }
  });

  it("keeps the board left to right, whatever the page around it does", () => {
    const goban = rules(CSS).find(r => r.selector === ".goban");
    expect(goban).toBeTruthy();
    expect(goban.body).toMatch(/direction:\s*ltr/);
  });

  /* A transform is the one thing a direction cannot turn around by itself:
     `translateX(2px)` means two pixels rightward in every language, and the
     handful of places that mean "onward" rather than "rightward" multiply by
     `--flip`. It is 1 by default and -1 under a right-to-left document, so a
     knob slides toward the end of its track and a decoration hangs off the
     side it was placed on. */
  it("declares the flip once, and turns it over for a right-to-left page", () => {
    expect(CSS).toMatch(/--flip:\s*1\s*;/);
    expect(CSS).toMatch(/\[dir="rtl"\][^{]*\{[^}]*--flip:\s*-1\s*;/);
  });

  it("multiplies every offset transform by the flip, wherever it is anchored logically", () => {
    // A rule anchored to a logical side and then nudged horizontally is by
    // definition talking about onward, not about rightward.
    for (const { selector, body } of rules(CSS)) {
      if (!/inset-inline-(start|end)/.test(body)) continue;
      if (!/transform:[^;]*translate(X\(|\()/.test(body)) continue;
      expect(/var\(--flip[,)]/.test(body), `${selector}: ${body.trim()}`).toBe(true);
    }
  });

  /* The rule above only sees a nudge that is anchored by an inset. A nudge
     anchored by flex, grid or a logical margin means "onward" just as much,
     and would slip past it — which is how the reply arrow nearly shipped
     pointing the wrong way. So every horizontal translate in the sheet has to
     either carry the flip or be a drawing: a keyframe step, a mascot leaning,
     a shape centred on its own middle. */
  it("multiplies every horizontal nudge by the flip, however it is anchored", () => {
    const DRAWING = /^(\d|\.moku|\.belt-|\.goban|\.rank-badge|\.fig-|\.lp-decor)/;
    for (const { selector, body } of rules(CSS)) {
      if (DRAWING.test(selector)) continue;
      const m = /transform:\s*([^;]+)/.exec(body);
      if (!m) continue;
      // A shape centred on its own middle is direction-neutral: -50% of itself
      // is the same distance whichever way the page runs.
      const moved = /translateX?\(\s*(-?[\d.]+px|calc\()/.test(m[1]);
      if (!moved) continue;
      expect(/var\(--flip[,)]/.test(m[1]), `${selector}: ${m[0].trim()}`).toBe(true);
    }
  });

  /* The interface follows the language it was chosen in; the words inside it
     do not always. A passage from the Classic is still English in most
     languages, a journal note is English on purpose, a bio or a line of table
     talk is whatever the person typed. `plaintext` resolves each paragraph
     from its own first strong letter, and it does not inherit, so it has to
     sit on the element that holds the words rather than on its wrapper. */
  it("reads every run of prose from its own first strong letter", () => {
    /* Read straight out of the sheet rather than through `rules()`, whose
       selector is the last line of a list: this one is a list on purpose, and
       every name in it matters. */
    const blocks = [...CSS.matchAll(/([^{}]+)\{([^{}]*unicode-bidi:\s*plaintext[^{}]*)\}/g)];
    expect(blocks.length).toBeGreaterThan(0);
    const classes = blocks.flatMap(m => m[1].match(/\.[a-z][a-z0-9-]*/g) || []);
    expect(classes.length).toBeGreaterThan(10);
    /* Every name in the list is a class the sheet actually draws. A typo here
       is the quietest failure of the lot: the rule parses, the sheet loads,
       and one paragraph keeps its full stop at the wrong end forever. Some of
       these set no type of their own (`.passage-typed` inherits the passage's)
       so what is checked is that the class exists, not that it sizes itself. */
    for (const cls of classes) {
      const drawn = rules(CSS).filter(r => r.selector.includes(cls) && !/unicode-bidi/.test(r.body));
      expect(drawn.length, `${cls} is declared plaintext and styled nowhere`).toBeGreaterThan(0);
    }
  });
});

/* The archetype picker and the mark are drawn with eight classes between them;
   a class the view names and the sheet does not is a silently unstyled button.
   The mask's name is the smallest type on the card, and the card carries the
   whole picker in a grid that is spaced by gap, never by a side. */
describe("the archetype picker", () => {
  const drawn = ["arche-mark", "arche-row", "arche-btn", "arche-glyph", "arche-none", "arche-hanzi", "arche-name", "arche-way"];
  const mine = rules(CSS).filter(r => /\.arche-/.test(r.selector));

  it("styles every class the picker and the mark are drawn with", () => {
    const named = new Set(mine.flatMap(r => [...r.selector.matchAll(/\.(arche-[a-z]+)/g)].map(m => m[1])));
    for (const cls of drawn) expect(named.has(cls), cls).toBe(true);
  });

  it("sets no word on the card below the twelve-pixel floor", () => {
    let sized = 0;
    for (const r of mine) {
      const size = smallestSize(r.body);
      if (!size) continue;
      sized++;
      expect(size, r.selector).toBeGreaterThanOrEqual(12);
    }
    expect(sized).toBeGreaterThan(0);
  });

  it("lifts the chosen mask and sinks the rest, with the two shadows and nothing else", () => {
    const active = mine.find(r => r.selector === ".arche-btn.active");
    const rest = mine.find(r => r.selector === ".arche-btn");
    expect(active.body).toMatch(/var\(--raise-sm\)/);
    expect(rest.body).toMatch(/var\(--sink-sm\)/);
    for (const r of mine) expect(r.body, r.selector).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  });
});

/* ----------------------- THE BOARD AND ITS STONES -----------------------
   The game screen was drawn with the board as the raised object and the stones
   lying flat on it: no stone casts a shadow, the wood is a rect the board owns,
   and the grid takes its strength from the room. Each of those is one line of
   the sheet, and each was the other way round once, so each is pinned. */
describe("the board and its stones", () => {
  const rule = (sel) => rules(CSS).find(r => r.selector === sel);

  it("raises the well as a card of the page, with the wood set into it", () => {
    const well = rule(".board-well");
    expect(well.body).toMatch(/box-shadow: var\(--raise\)/);
    expect(well.body).toMatch(/background: var\(--ground\)/);
    expect(well.body, "the wood is the board's, not the well's").not.toMatch(/--board/);
    expect(rule(".wood").body).toMatch(/fill: var\(--board\)/);
  });

  it("lets the room say how strong the grid is", () => {
    expect(rule(".grid-line").body).toMatch(/stroke-opacity: var\(--grid-alpha\)/);
    expect(rule(".star-pt").body).toMatch(/fill-opacity: calc\(var\(--grid-alpha\)/);
    const root = CSS.split(".sente-root {")[1].split("\n}")[0];
    expect(root, "a default before the shell has spread a room").toMatch(/--grid-alpha: \.\d+;/);
  });

  it("lets no stone cast a shadow", () => {
    for (const sel of [".stone-b", ".stone-w", ".stone-gloss", ".theme-stone.b", ".theme-stone.w"]) {
      const r = rule(sel);
      expect(r, sel).toBeDefined();
      expect(r.body, `${sel} casts a shadow`).not.toMatch(/drop-shadow|--sh-ink|--sh-lite/);
    }
  });

  it("fills every stone from the set's tokens: body, shine, rim", () => {
    expect(rule(".stone-b").body).toMatch(/fill: var\(--stone-b-2\)/);
    expect(rule(".stone-gloss").body).toMatch(/fill: var\(--stone-b-1\)/);
    expect(rule(".stone-w").body).toMatch(/fill: var\(--stone-w-2\)/);
    expect(rule(".stone-w").body).toMatch(/stroke: var\(--stone-w-3\)/);
    expect(rule(".theme-stone.b").body, "the plate draws the stone the board draws").toMatch(/--stone-b-1[^;]*--stone-b-2/);
    expect(rule(".theme-stone.w").body).toMatch(/--stone-w-2/);
    expect(rule(".theme-stone.w").body).toMatch(/--stone-w-3/);
  });

  it("writes a move number in the other stone's colour", () => {
    expect(rule(".stone-num.on-b").body).toMatch(/fill: var\(--stone-w-2\)/);
    expect(rule(".stone-num.on-w").body).toMatch(/fill: var\(--stone-b-2\)/);
  });
});
