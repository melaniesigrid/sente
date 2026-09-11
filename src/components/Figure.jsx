import { useCallback, useRef, useState, useId } from "react";
import { figureFor, figureLives } from "../content/figures.js";

/* ----------------------- THE FIGURE, SET LARGE -----------------------
   A shape out of the game, drawn at the size of the thing it stands behind.

   The statements were the one large type on the site with nothing underneath
   them. Decor put the brand marks behind a section and StoneField put a
   blurred game behind a band, and between those two there was a gap: the
   marks are a logo and the field is a texture, and neither of them is go. A
   statement is the house making a claim in six words. What belongs beside it
   is the same claim in stones — and unlike a logo, it can be true.

   So this draws a figure from content/figures.js, which is a sequence rather
   than a picture: the engine plays it, the ponnuki really takes the stone off,
   and the ladder really is caught on the last line. The drawing then shows the
   playing of it. Stones land in the order a teacher puts them down in, one
   after another, and a stone that gets captured is taken off at the move it
   was actually captured on. That is the whole animation, and it is worth
   having because it is the only decoration on the site that teaches something.

   How it is drawn, and the rules it keeps:

   - The stones are the room's stones. The same three-stop radial the board
     uses, off the same --stone-* tokens, so the figure changes set with the
     board and never names a colour of its own. What is added here and not on
     the board is the shine: at this size a stone is the size of a plum and a
     polished thing that size has a highlight on it and a lit rim where the
     surface turns. Both are drawn in --sh-lite, the light the whole design
     system is lit from, so they stay the same light as every raised card.
   - The house drop-shadows come off, for Decor's reason: two shadows at three
     hundred pixels is a smear, not a relief.
   - It is never in front of anything. z-index 0 in a positioned block, no
     pointer events, aria-hidden, and the words are lifted one layer clear.
   - It plays once, when it is reached, and then holds. A reader who asked for
     less motion is handed the finished position in the first frame — which is
     also what anyone gets who has no IntersectionObserver, because a figure
     nobody can see is worse than a figure that does not move. */

/* The beat between stones. Long enough to read as placing and not as a flicker;
   short enough that the ladder's twenty-eight moves are done inside three
   seconds, which is about as long as a decoration may hold a reader. */
const STEP_MS = 95;

/** One stone, drawn at `r` with the light on it. */
function Stone({ x, y, r, colour, laid, gone, sheen, ids }) {
  const style = {
    "--laid": `${laid * STEP_MS}ms`,
    /* negative, so every stone is already somewhere in the one loop rather than
       waiting to join it: the light is crossing the figure before it is read */
    "--sheen": `${-sheen}ms`,
    ...(gone === null ? null : { "--gone": `${gone * STEP_MS}ms` }),
  };
  return (
    <g className={`fig-stone${gone === null ? "" : " taken"}`} style={style}>
      <circle cx={x} cy={y} r={r} fill={`url(#${colour === "b" ? ids.b : ids.w})`} />
      {/* the rim the light catches as the surface turns away, and the highlight
          it catches where the surface faces it */}
      <circle cx={x} cy={y} r={r * 0.985} fill="none" className="fig-rim" strokeWidth={r * 0.06} />
      <ellipse
        className="fig-shine"
        cx={x - r * 0.3} cy={y - r * 0.34}
        rx={r * 0.31} ry={r * 0.2}
        fill={`url(#${ids.shine})`}
        transform={`rotate(-34 ${x - r * 0.3} ${y - r * 0.34})`}
      />
    </g>
  );
}

/** The figure behind `screen`, or a named one via `figure`. `at` picks the
 *  side it is set against and how far it is allowed off the edge. */
export function Figure({ screen, figure, at = "right", className = "" }) {
  const fig = figure || figureFor(screen);
  /* A reader who asked for less motion, and a browser with no observer, are
     handed the finished position in the first frame. Neither of those is a
     thing to wait for a layout to find out. */
  const [shown, setShown] = useState(() =>
    typeof window === "undefined"
    || typeof IntersectionObserver !== "function"
    || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
  const uid = useId().replace(/[:]/g, "");
  const ids = { b: `fgb-${uid}`, w: `fgw-${uid}`, shine: `fgs-${uid}`, grid: `fgg-${uid}` };

  /* Watching is set up as the element arrives rather than in an effect, so the
     figure above the fold is shown in the frame it is drawn in and not one
     later. Three ways of noticing, because the failure this guards against is
     a figure that is never shown at all, which is far worse than one that does
     not move: the rect at mount catches anything the page has already been
     scrolled past, the observer catches the ordinary case, and the scroll
     catches the long jump -- End, a dragged scrollbar, an anchor -- which can
     carry the page over an element without the observer ever seeing it cross.
     The same trap reveal.js sweeps for. All three stop at the first hit. */
  const seen = useRef(false);
  const watch = useCallback((el) => {
    if (!el || seen.current) return undefined;
    const near = () => el.getBoundingClientRect().top < window.innerHeight;
    const show = () => { seen.current = true; setShown(true); off(); };
    if (typeof IntersectionObserver !== "function") return undefined;
    if (near()) { seen.current = true; setShown(true); return undefined; }

    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting) || near()) show();
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    const onScroll = () => { if (near()) show(); };
    const off = () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return off;
  }, []);

  const lives = figureLives(fig);
  const cell = 100;
  const pad = cell * 0.62;
  const span = (fig.size - 1) * cell + pad * 2;
  const to = (n) => pad + n * cell;
  const r = cell * 0.46;

  /* Where the shape actually is inside its frame, and how far out from there
     it reaches. The mask is centred and sized off the stones rather than off
     the frame, which is the difference between a shape dissolving into the
     ground and a black stone half faded out -- and a half-faded black stone on
     a pale ground reads as a white one, which is the one thing a drawing of a
     go position may never do. Every stone is inside the solid part of the mask
     whatever shape it is: the three-stone triangle dissolves a cell and a half
     out, the ladder carries its far corner because the reach is measured to it.

     The three numbers go out as custom properties because the gradient that
     uses them belongs in the stylesheet with the rest of the drawing, and this
     is the only part of it that has to be counted rather than written. */
  const mid = (pick) => {
    const all = lives.map(pick);
    return (Math.min(...all) + Math.max(...all)) / 2;
  };
  const cx = to(mid(s => s.c)), cy = to(mid(s => s.r));
  const reach = Math.max(...lives.map(s => Math.hypot(to(s.c) - cx, to(s.r) - cy)));
  const rad = reach + cell * 1.7;
  const pct = (n) => `${(n / span) * 100}%`;
  const anchor = {
    "--fig-cx": pct(cx),
    "--fig-cy": pct(cy),
    "--fig-r": pct(rad),
    "--fig-s": `${((reach + cell * 0.62) / rad) * 100}%`,
    "--fig-m": `${((reach + cell * 1.3) / rad) * 100}%`,
  };

  return (
    <span
      className={`fig fig-${at}${shown ? " playing" : ""} ${className}`.trim()}
      ref={watch}
      style={anchor}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${span} ${span}`} focusable="false" preserveAspectRatio="xMidYMid meet">
        <defs>
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
          {/* The lines end sooner than the stones do. The block's own mask is
              sized to carry every stone at full strength, which leaves the grid
              running on past the shape to a corner, and a grid that stops on a
              straight edge reads as the side of a box rather than as a board
              going on. So the lines get a tighter fade of their own, drawn in
              from a cell and a half out. White here is a mask channel and not a
              colour: it is how much of the line survives, nothing else. */}
          <radialGradient id={`${ids.grid}-g`} gradientUnits="userSpaceOnUse"
            cx={cx} cy={cy} r={reach + cell * 1.5}>
            <stop offset="46%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id={ids.grid}>
            <rect x="0" y="0" width={span} height={span} fill={`url(#${ids.grid}-g)`} />
          </mask>
        </defs>

        {/* the lines the shape is played on, at the weight of a whisper */}
        <g className="fig-grid" mask={`url(#${ids.grid})`}>
          {Array.from({ length: fig.size }).map((_, i) => (
            <g key={i}>
              <line x1={to(0)} y1={to(i)} x2={to(fig.size - 1)} y2={to(i)} />
              <line x1={to(i)} y1={to(0)} x2={to(i)} y2={to(fig.size - 1)} />
            </g>
          ))}
        </g>

        {lives.map((s, i) => (
          <Stone key={i} x={to(s.c)} y={to(s.r)} r={r} colour={s.colour}
            laid={s.laid} gone={s.gone} sheen={(s.c + s.r) * 320} ids={ids} />
        ))}
      </svg>
    </span>
  );
}
