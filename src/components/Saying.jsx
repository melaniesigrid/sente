import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";
import { Card } from "./ui.jsx";
import { CLASSIC, emphasize } from "../content/classic.js";

/* ----------------------- A SAYING -----------------------
   One line of Zhang Ni's Classic with its chapter under it. Home shows the
   saying of the day, Learn puts the same block at the head of the series
   card, and both take it from content/classic.js, which is the only place
   the text lives. `children` is whatever the host wants under the line.

   A saying is typed, not set: the typewriter face in every pairing (see
   TYPEWRITER in content/typeface.js), struck out a character at a time with a
   caret at the head of it, and the words the classic keeps returning to struck
   a second time in the accent colour. `emphasize` decides which words those
   are — the view only renders what it gets back.

   The typing is a flourish and never the content. The whole line is on the
   element as its accessible name from the first frame, the animated spans are
   hidden from the reader, and a reader who has asked for less motion gets the
   finished line with no caret and no delay. */

const REDUCED = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Characters per tick, and the rest a typist takes at a mark of punctuation. */
const TICK = 26;
const PAUSE = { ".": 320, ",": 150, ":": 150, ";": 150 };

/** How many characters of `text` to show right now. Counts up to the end and
 *  stops; the caret is the caller's business. */
function useTyped(text) {
  const start = () => (REDUCED() ? text.length : 0);
  const [typed, setTyped] = useState(() => ({ text, n: start() }));
  const timer = useRef(0);
  // A new saying starts from nothing without waiting for the effect to say so.
  const shown = typed.text === text ? typed.n : start();

  useEffect(() => {
    if (REDUCED()) return undefined;
    let n = 0;
    const step = () => {
      n += 1;
      setTyped({ text, n });
      if (n >= text.length) return;
      timer.current = window.setTimeout(step, TICK + (PAUSE[text[n - 1]] || 0));
    };
    timer.current = window.setTimeout(step, 180);   // a breath before the first key
    return () => window.clearTimeout(timer.current);
  }, [text]);

  return shown;
}

/** The parts of a saying that have been typed so far, in order. Pure. */
function typedParts(text, shown) {
  const out = [];
  let at = 0;
  for (const part of emphasize(text)) {
    const take = Math.min(part.text.length, Math.max(0, shown - at));
    at += part.text.length;
    if (take === 0) break;
    out.push({ text: part.text.slice(0, take), mark: part.mark });
  }
  return out;
}

/** The saying itself, typed, in the class the host wants it in. */
export function SayingText({ text, className = "" }) {
  const shown = useTyped(text);

  return (
    <p className={`typed ${className}`.trim()} aria-label={text}>
      <span aria-hidden="true">
        {typedParts(text, shown).map((part, i) => (
          part.mark
            ? <mark className="typed-key" key={i}>{part.text}</mark>
            : <span key={i}>{part.text}</span>
        ))}
        {shown < text.length && <span className="type-caret" />}
      </span>
    </p>
  );
}

export function Saying({ saying }) {
  if (!saying) return null;
  return (
    <>
      <SayingText text={saying.text} className="lesson-text saying-line" />
      <p className="fine">Chapter {saying.chapter}, {saying.title}. {CLASSIC.author}, {CLASSIC.era}.</p>
    </>
  );
}

export function SayingCard({ saying, children }) {
  if (!saying) return null;
  return (
    <Card inset className="stack-sm saying-card">
      <div className="stat-head"><Quote size={15} /><span>{CLASSIC.title}</span></div>
      <Saying saying={saying} />
      {children}
    </Card>
  );
}
