import { useState, useEffect, useRef, useId } from "react";
import {
  FIELD_N, SETTLED, freshField, advanceField, fieldSpent, fieldStones,
} from "./fieldGame.js";
import { StoneArt, Shine } from "./stoneArt.jsx";

/* ----------------------- THE GROUND -----------------------
   The texture behind the front door's first and last bands: a go position,
   softened to where it is read as ground first and a game second.

   It used to be blurred to thirteen pixels, which is a radius that turns a
   stone into weather. The whole argument for spending a real engine on a
   decoration is that a visitor can see it is a real game, and at that radius
   nobody could -- it was a field of soft dots that happened to be computed
   honestly. The blur is three now: enough that the field stays behind the
   words and never competes with them, little enough that the stones are
   stones, and little enough that a move landing is a thing you can watch.

   Which is the second change. The stones are drawn the way the figures beside
   the statements are drawn, off the same shared gradients, and a stone arriving
   settles in rather than appearing between two frames. One move every couple of
   seconds, in a position that really is being played: it is the slowest thing
   on the page and the only one that is a game.

   It is the real engine playing itself, for the same reason the hero board is:
   this page is not allowed to show anything it cannot show for real, and a
   drawing of a board would have been the one decorative lie on it. Blurred at
   this radius it is also, straightforwardly, the field of soft dots the brief
   asked for. Both descriptions are of the same picture.

   Four things it has to get right:

   - It must not be on the critical path. The hero's words are the page's job.
     The seed is taken eight moves at a time across animation frames after the
     first paint, and the field fades in when it has a position worth showing,
     so nothing here is ever in the same frame as the text a visitor came for.
   - It must not cost anything while nobody is looking. The interval stops when
     the tab is hidden and when the band is scrolled away, and it is started
     rather than stopped by the observer, so a browser without one keeps
     playing instead of showing an empty band forever.
   - A reader who asked for less motion gets the position and not the game: one
     settled board, held.
   - It is decoration and is addressed as such: aria-hidden, no pointer events,
     and nothing in it is announced. */

const CELL = 44, MARGIN = 26, R = 19;
const SPAN = (FIELD_N - 1) * CELL + MARGIN * 2;
/* The board is drawn into a frame half again its own size, so a band shows a
   position rather than six boulders. The stones were the size of a fist when
   the blur came off: at that scale five of them reach the words and the other
   sixty are off the edge, which is a texture pretending to be a game. Pulled
   back, most of the position is on the page, each stone is about the size it
   would be on a real board across a table, and a move landing anywhere in it
   has somewhere to land where it will be seen. */
const VIEW = Math.round(SPAN * 1.5);
const OFF = Math.round((VIEW - SPAN) / 2);
const CHUNK = 8;          /* moves per frame while seeding */
const TICK_MS = 2600;     /* a mood, not a demo, but a visible one */

export function StoneField({ live = true }) {
  const [board, setBoard] = useState(null);
  const host = useRef(null);
  const uid = useId().replace(/[:]/g, "");
  const ids = { b: `fsb-${uid}`, w: `fsw-${uid}`, shine: `fss-${uid}` };

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const moving = live && !reduce;

    let state = freshField();
    let timer = null, frame = 0, dead = false;
    let onScreen = true, awake = true;

    const beat = () => {
      state = fieldSpent(state) ? advanceField(freshField(), SETTLED) : advanceField(state, 1);
      setBoard(state.board);
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { if (moving && !timer && onScreen && awake && !dead) timer = setInterval(beat, TICK_MS); };

    /* The seed, a chunk to a frame. */
    const seed = () => {
      state = advanceField(state, CHUNK);
      if (state.n < SETTLED && !fieldSpent(state)) { frame = requestAnimationFrame(seed); return; }
      if (dead) return;
      setBoard(state.board);
      start();
    };
    frame = requestAnimationFrame(seed);

    const onVisibility = () => { awake = !document.hidden; if (awake) start(); else stop(); };
    document.addEventListener("visibilitychange", onVisibility);

    /* Pause when the band is off screen. This only ever stops the interval;
       a browser with no IntersectionObserver simply keeps playing, which costs
       a couple of milliseconds a move and is the right way to fail. */
    let io = null;
    if (typeof IntersectionObserver === "function" && host.current) {
      io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start(); else stop();
      }, { rootMargin: "120px" });
      io.observe(host.current);
    }

    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      if (io) io.disconnect();
    };
  }, [live]);

  const at = (n) => OFF + MARGIN + n * CELL;

  return (
    <div className={`stone-field${board ? " ready" : ""}`} ref={host} aria-hidden="true">
      {board && (
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} preserveAspectRatio="xMidYMid slice" focusable="false">
          <defs><StoneArt ids={ids} /></defs>
          {/* Keyed by the point it sits on, which is what makes the arriving
              visible: a stone that was not there last tick is a new element and
              settles in, and one that was there is the same element and does
              not move. A capture simply takes its element away. */}
          {fieldStones(board).map(s => (
            <g key={s.i} className="fs-stone">
              <circle cx={at(s.c)} cy={at(s.r)} r={R}
                fill={`url(#${s.colour === "b" ? ids.b : ids.w})`} />
              {/* A white stone on a pale ground is the same value as the
                  ground: without an edge it is a hole in the field rather than
                  a stone in it, and half the position simply does not arrive.
                  The board does not need this because a board has lines under
                  its stones to cut them out. This has none. */}
              <circle cx={at(s.c)} cy={at(s.r)} r={R} className="fs-rim" />
              <Shine x={at(s.c)} y={at(s.r)} r={R} id={ids.shine} className="fs-shine" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
