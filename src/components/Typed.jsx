import { useEffect, useRef, useState } from "react";
import { emphasize, markBudget } from "../content/classic.js";
import { typedParts } from "./typedParts.js";

/* ----------------------- TYPED TEXT -----------------------
   A line struck out one character at a time, with a caret at the head of it,
   in the pairing's machine face. The front door uses it twice: for its section
   labels, and for the saying it sets large.

   It types when it is scrolled to, not when it mounts. A label three sections
   down that finished typing before anybody looked at it is just a label, and
   the whole point of the effect is that a reader watches it happen.

   The typing is a flourish and never the content. The finished line is on the
   element as its accessible name from the first frame, the moving spans are
   hidden from the reader, and anyone who has asked for less motion gets the
   whole line at once, with no caret and no delay. */

const reducedNow = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Characters per tick, and the rest a typist takes at a mark of punctuation. */
const TICK = 26;
const PAUSE = { ".": 320, ",": 150, ":": 150, ";": 150 };

/** How many characters of `text` to show right now, once `go` is true. Counts up
 *  to the end and stops; the caret is the caller's business. */
function useTyped(text, go) {
  const [reduced] = useState(reducedNow);
  const [n, setN] = useState(0);
  const timer = useRef(0);

  useEffect(() => {
    if (!go || reduced) return undefined;
    let at = 0;
    const step = () => {
      at += 1;
      setN(at);
      if (at >= text.length) return;
      timer.current = window.setTimeout(step, TICK + (PAUSE[text[at - 1]] || 0));
    };
    timer.current = window.setTimeout(step, 180);   // a breath before the first key
    return () => window.clearTimeout(timer.current);
  }, [text, go, reduced]);

  return reduced ? text.length : Math.min(n, text.length);
}

/* One observer for every line on the page, not one each.
   A long jump — the End key, a scrollbar drag, an anchor — can carry the page
   past an element without its own observer ever seeing it cross the fold, and a
   line that is never seen never types. So each callback sweeps every line still
   waiting and starts the ones the scroll has already gone by. With one observer
   the sweep runs whenever *any* line moves, which is what makes it reliable. */
const waiting = new Map();   // element -> what to call when it has been reached
let watcher = null;

function sweep() {
  for (const [el, start] of [...waiting]) {
    if (el.getBoundingClientRect().top < window.innerHeight) {
      waiting.delete(el);
      watcher.unobserve(el);
      start();
    }
  }
}

function watch(el, start) {
  if (!watcher) watcher = new IntersectionObserver(sweep, { threshold: 0.1 });
  waiting.set(el, start);
  watcher.observe(el);      // the first callback lands on its own, so the sweep runs
  return () => { waiting.delete(el); watcher.unobserve(el); };
}

/** True once the element has been scrolled to. Never goes back to false: a line
 *  types itself once and then it is simply there. Without an observer to ask it
 *  starts out true, because a line nobody can watch arrive should still be a line. */
function useSeen(ref) {
  const [watchable] = useState(() => typeof IntersectionObserver === "function");
  const [seen, setSeen] = useState(!watchable);

  useEffect(() => {
    const el = ref.current;
    if (seen || !el) return undefined;
    return watch(el, () => setSeen(true));
  }, [ref, seen]);

  return seen;
}

/** A line of the Classic, typed, with the words it keeps returning to marked.
 *  The mark is <strong> as well as a colour, so the emphasis survives a screen
 *  reader and a stylesheet that never loads. */
export function TypedLine({ text, className = "" }) {
  const host = useRef(null);
  const shown = useTyped(text, useSeen(host));
  const parts = emphasize(text, markBudget(text));

  return (
    <p className={`typed ${className}`.trim()} ref={host} aria-label={text}>
      <span aria-hidden="true">
        {typedParts(parts, shown).map((part, i) => (
          part.mark
            ? <strong className="typed-key" key={i}>{part.text}</strong>
            : <span key={i}>{part.text}</span>
        ))}
        {shown < text.length && <span className="type-caret" />}
      </span>
    </p>
  );
}

/** A section label, typed. Plain text only: a label is one short phrase, and
 *  nothing inside it is emphasised over the rest of it. */
export function TypedLabel({ children, className = "" }) {
  const text = String(children ?? "");
  const host = useRef(null);
  const shown = useTyped(text, useSeen(host));

  return (
    <p className={className} ref={host} aria-label={text}>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        {shown < text.length && <span className="type-caret" />}
      </span>
    </p>
  );
}
