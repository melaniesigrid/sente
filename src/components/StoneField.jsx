import { useState, useEffect, useRef } from "react";
import {
  FIELD_N, SETTLED, freshField, advanceField, fieldSpent, fieldStones,
} from "./fieldGame.js";

/* ----------------------- THE GROUND -----------------------
   The texture behind the front door's first and last bands: a go position,
   blurred to where it is read as pattern first and a game second.

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

const CELL = 44, MARGIN = 26;
const SPAN = (FIELD_N - 1) * CELL + MARGIN * 2;
const CHUNK = 8;          /* moves per frame while seeding */
const TICK_MS = 3400;     /* a mood, not a demo */

export function StoneField({ live = true }) {
  const [board, setBoard] = useState(null);
  const host = useRef(null);

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

  const at = (n) => MARGIN + n * CELL;

  return (
    <div className={`stone-field${board ? " ready" : ""}`} ref={host} aria-hidden="true">
      {board && (
        <svg viewBox={`0 0 ${SPAN} ${SPAN}`} preserveAspectRatio="xMidYMid slice" focusable="false">
          {fieldStones(board).map(s => (
            <circle key={s.i} cx={at(s.c)} cy={at(s.r)} r={19}
              className={s.colour === "b" ? "fs-b" : "fs-w"} />
          ))}
        </svg>
      )}
    </div>
  );
}
