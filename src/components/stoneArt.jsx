/* ----------------------- HOW A STONE IS DRAWN, ONCE -----------------------
   The three gradients a stone is made of: the black one, the white one, and
   the light that sits on both. Two things draw stones at a size where the
   light matters -- the figure beside a statement and the field behind a band --
   and they now agree about what a stone looks like because they take the
   drawing from here rather than each keeping a copy.

   The stops are the board's (components/Board.jsx), which keeps its own set
   because a board is drawn at the size of a game and has no shine on it: at
   20 pixels a highlight is a white pixel in the corner of a disc. Above about
   forty it is the difference between a stone and a circle.

   Every colour is a token. --stone-* is the room's set, cut in theme/stones.js
   and seated for the ground in theme/derive.js, and --sh-lite is the light the
   whole design system is lit by, the same one every raised card is lifted with.
   Nothing here names a colour, so a change of room or of set on the look page
   changes the field and the figures with the board. */

/** The defs a stone needs. `ids` is `{b, w, shine}` -- unique per instance,
 *  because two SVGs on one page may not share a gradient id. A caller builds
 *  them off its own `useId`; they are three template strings and live at the
 *  call site so that this file exports components and nothing else, which is
 *  what lets it reload without taking the page's state with it. */
export function StoneArt({ ids }) {
  return (
    <>
      <radialGradient id={ids.b} cx="0.36" cy="0.34" r="0.85">
        <stop offset="0%" stopColor="var(--stone-b-1)" />
        <stop offset="55%" stopColor="var(--stone-b-2)" />
        <stop offset="100%" stopColor="var(--stone-b-3)" />
      </radialGradient>
      <radialGradient id={ids.w} cx="0.36" cy="0.34" r="0.85">
        <stop offset="0%" stopColor="var(--stone-w-1)" />
        <stop offset="60%" stopColor="var(--stone-w-2)" />
        <stop offset="100%" stopColor="var(--stone-w-3)" />
      </radialGradient>
      <radialGradient id={ids.shine} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="rgba(var(--sh-lite),.82)" />
        <stop offset="52%" stopColor="rgba(var(--sh-lite),.26)" />
        <stop offset="100%" stopColor="rgba(var(--sh-lite),0)" />
      </radialGradient>
    </>
  );
}

/** The highlight, where the surface faces the light. Drawn as an ellipse
 *  turned across the curve rather than a circle, because a sphere's specular
 *  is an ellipse everywhere except dead centre. */
export function Shine({ x, y, r, id, className = "fig-shine" }) {
  const cx = x - r * 0.3, cy = y - r * 0.34;
  return (
    <ellipse
      className={className}
      cx={cx} cy={cy} rx={r * 0.31} ry={r * 0.2}
      fill={`url(#${id})`}
      transform={`rotate(-34 ${cx} ${cy})`}
    />
  );
}
