/* ----------------------- DERIVATION -----------------------
   Six or seven colours in, the whole token set out.

   Everything a palette needs beyond the authored tones is computed here rather
   than typed, for one reason: the rules that make the neumorphism work are
   arithmetic, and arithmetic can be enforced. The highlight has to sit close to
   the ground. The shadow has to sit close on the other side. A black stone on a
   dark board has to be seated toward that board or it reads as grey slate. Left
   to hand-authoring these drift; derived, a new palette is six colours and it
   is correct by construction.

   An author may still override any derived value — the named palettes do,
   where a hand-mixed tone beat the computed one — but nothing is required.

   Which stones a room is played with is data of its own (stones.js). What
   happens to a stone once a room has one is here, because it depends on the
   room: a black stone has to be seated further into a dark board or it reads as
   grey slate lying on top of the wood. */
import { mix, lighten, darken, toTriple, isDarkColor, luminance, contrast } from "./color.js";
import { TONES, READING, LARGE } from "./tokens.js";
import { stonesOf, cutBlack, cutWhite, HOUSE_STONES } from "./stones.js";

/** The two lights, from the ground alone.
 *
 *  On paper the highlight is most of the way to white and the shadow a fifth of
 *  the way to black: a sheet lit from the top left. On a dark ground both moves
 *  shrink — there is less room below the ground than above it — and the
 *  highlight goes toward the ink rather than toward white, because a white edge
 *  on a dark panel reads as a hairline and not as a lit face. */
export function deriveLights(ground, ink) {
  return isDarkColor(ground)
    ? { light: mix(ground, ink, 0.09), dark: darken(ground, 0.45) }
    : { light: lighten(ground, 0.72), dark: darken(ground, 0.18) };
}

/** The quietest version of `tone` that still reads against the ground.
 *
 *  The opposite errand to deriveAccentInk above, and a separate function because
 *  it walks the other way: that one takes a mark that is too faint and carries it
 *  away from the ground until it reads, this one takes the ink and lets it fall
 *  back toward the ground until it is about to stop reading, then keeps the last
 *  step that did.
 *
 *  Secondary text was written as an opacity for years, and an opacity is a fixed
 *  fraction of whatever is behind it: House ink at `.55` measures 2.60:1, which
 *  is not quiet text, it is a rumour of text. This gets what that opacity was
 *  reaching for and stops where the rule says stop. Binary search rather than a
 *  fixed step, because the last usable step is exactly what is wanted here and a
 *  coarse walk overshoots it; twenty halvings land inside a thousandth of a
 *  ratio, far below the precision of a hex. */
export function quieten(tone, ground, floor) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (contrast(mix(tone, ground, mid), ground) >= floor) lo = mid; else hi = mid;
  }
  return mix(tone, ground, lo);
}

/** Secondary text: as quiet as this room's ink gets while still being readable
 *  at any size. A hair over the floor, so rounding in a browser's audit panel
 *  cannot push a passing value back under it. */
export const deriveInk2 = (ink, ground) => quieten(ink, ground, READING + 0.1);

/** Incidental text — the oversized lesson numeral, the rank beside a level, a
 *  step number set at display size. Held to the large-text floor and spent on
 *  nothing small. */
export const deriveInk3 = (ink, ground) => quieten(ink, ground, LARGE + 0.1);

/** A warm warning tone that belongs to this room: the ground pulled a long way
 *  toward a fixed terracotta, so it stays legible on paper and on lacquer. */
export function deriveDanger(ground) {
  return mix(isDarkColor(ground) ? "#e08a72" : "#a95f4c", ground, isDarkColor(ground) ? 0.12 : 0.06);
}

/** The mark, taken to reading contrast.
 *
 *  The accent is held to 2.9:1 because it is a mark — a dot, a ring, a chip —
 *  and a mark is glanced at. A marked WORD is not: it sits inside a sentence and
 *  is read at reading size, so it owes the same 4.5:1 the sentence around it
 *  owes. Colouring one in the raw accent is how a quote ends up with its most
 *  important word as its least legible one.
 *
 *  So: walk the accent away from the ground a step at a time until it clears,
 *  and stop at the first step that does. Only lightness is spent, never hue —
 *  the word has to still read as this room's mark, or it is just a second ink.
 *  A room whose accent already clears gets it back untouched. */
export function deriveAccentInk(accent, ground) {
  const away = isDarkColor(ground) ? lighten : darken;
  for (let t = 0; t < 0.95; t += 0.05) {
    const step = away(accent, t);
    if (contrast(step, ground) >= READING) return step;
  }
  // Nothing in the hue clears on this ground; the ink is the honest fallback.
  return away(accent, 0.95);
}

/** Fill in whatever the author did not write. Returns the complete tone set. */
export function completeTones(tones) {
  const ground = tones.ground;
  const ink = tones.ink;
  const auto = deriveLights(ground, ink);
  const out = {
    ground, ink,
    accent: tones.accent,
    cream: tones.cream,
    light: tones.light || auto.light,
    dark: tones.dark || auto.dark,
    danger: tones.danger || deriveDanger(ground),
    grid: tones.grid,
    // Which set this room is played with. An id rather than colours: the set
    // itself is data in stones.js, and a player may override it for every room
    // at once from the look page.
    stones: tones.stones || HOUSE_STONES,
  };
  for (const tone of TONES) if (!out[tone.key]) throw new Error(`sente: palette is missing ${tone.key}`);
  return out;
}

/** The full custom-property set for a completed tone set. Shadows are themed
 *  too: a dark room has far less luminance to spend on a highlight, so its
 *  raise is longer and softer or the raised state stops reading at all. */
export function tokensFor(tones) {
  const t = completeTones(tones);
  const dark = isDarkColor(t.ground);

  const shInk = dark ? "0,0,0" : toTriple(t.ink);
  const shLite = toTriple(dark ? mix(t.light, t.ink, 0.22) : t.light);
  const accent = toTriple(t.accent);

  const [d, blur] = dark ? [10, 24] : [8, 18];
  const [ds, blurs] = dark ? [6, 15] : [5, 12];
  const { b, w } = stonesFor(t);

  return {
    "--ground": t.ground,
    "--light": t.light,
    "--dark": t.dark,
    "--ink": t.ink,
    // The two quiet inks. Nothing in the stylesheet dims a word with an opacity
    // any more: it asks for the step down it wants, and gets a colour that still
    // reads in the room it is standing in.
    "--ink-2": t.ink2 || deriveInk2(t.ink, t.ground),
    "--ink-3": t.ink3 || deriveInk3(t.ink, t.ground),
    "--cream": t.cream,
    "--danger": t.danger,

    "--accent-rgb": accent,
    // The soft fill behind a selected chip, and the focus ring. They are two
    // tokens because 16% of gold on near-black is nothing: a dark room needs a
    // far stronger ring before keyboard focus is visible at all.
    "--accent-soft": `rgba(${accent},${dark ? ".24" : ".16"})`,
    "--accent-ring": `rgba(${accent},${dark ? ".55" : ".32"})`,
    // The one accent token that is a colour rather than a wash, because it is
    // the only one that lands on a word somebody has to read.
    "--accent-ink": t.accentInk || deriveAccentInk(t.accent, t.ground),
    // The warning has the same two lives the accent does — a pill and a chip at
    // 2.9:1, and the word "Resigned" at reading size — so it is walked up the
    // same way. Same errand, same function.
    "--danger-ink": t.dangerInk || deriveAccentInk(t.danger, t.ground),

    "--sh-ink": shInk,
    "--sh-lite": shLite,

    "--wash-a": dark ? `rgba(${accent},.10)` : `rgba(${shLite},.55)`,
    "--wash-b": dark ? "rgba(0,0,0,.42)" : `rgba(${toTriple(t.dark)},.40)`,
    "--scrim": `rgba(${toTriple(t.ground)},.76)`,
    "--hairline": `rgba(${shInk},${dark ? ".28" : ".14"})`,

    "--grid": t.grid || t.ink,
    // Every belt, seal and rank colour in rank.js is an absolute value chosen
    // against paper: the white belt vanishes on a pale ground and the black one
    // on a dark ground. A contour in the room's own ink gives each band an edge
    // it cannot lose, whatever it is filled with.
    "--belt-edge": `rgba(${toTriple(t.ink)},.42)`,

    "--stone-b-1": b[0], "--stone-b-2": b[1], "--stone-b-3": b[2],
    "--stone-w-1": w[0], "--stone-w-2": w[1], "--stone-w-3": w[2],

    "--raise": `${d}px ${d}px ${blur}px var(--dark), -${d}px -${d}px ${blur}px var(--light)`,
    "--raise-sm": `${ds}px ${ds}px ${blurs}px var(--dark), -${ds}px -${ds}px ${blurs}px var(--light)`,
    "--sink": `inset ${ds}px ${ds}px ${blurs}px var(--dark), inset -${ds}px -${ds}px ${blurs}px var(--light)`,
    "--sink-sm": `inset 3px 3px 8px var(--dark), inset -3px -3px 8px var(--light)`,
  };
}

/** The black stone, seated toward the board it is played on. On paper this
 *  returns the set as cut; on a dark ground it pulls the stone down so it stays
 *  black rather than turning into grey slate, while its crown stays above the
 *  ground so the piece still separates from the wood.
 *
 *  Only the black stone is seated. A white stone barely differs from paper and
 *  never has, and on a dark board it needs no help at all: what separates it
 *  there is its rim and its drop shadow, not its fill. */
export function deriveStoneB(ground, core = stonesOf(HOUSE_STONES).b) {
  const cut = cutBlack(core);
  if (!isDarkColor(ground)) return cut;
  const seat = 0.35 + 0.15 * (1 - Math.min(1, luminance(ground) / 0.32));
  return cut.map((s, i) => mix(s, ground, seat - i * 0.05));
}

/** Both stones a completed tone set is played with, ready for the gradient:
 *  the set's two cores, cut into three stops each, the black one seated into
 *  this room's board. One function, so the board, the swatches and the audit
 *  can never be looking at three different sets of stones. */
export function stonesFor(tones) {
  const set = stonesOf(tones.stones);
  return { b: deriveStoneB(tones.ground, set.b), w: cutWhite(set.w), set };
}
