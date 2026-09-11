import { useEffect, useState } from "react";
import { passageFor, emphasize, markBudget, CLASSIC, localizePassage } from "../content/classic.js";
import { typedParts } from "./typedParts.js";
import { useT } from "./langStore.js";

/* ----------------------- PASSAGE (a page from the Classic) -----------------------
   A passage from Zhang Ni's thirteen chapters, typed out on a machine, with a
   quiet citation. Every mount draws a fresh one for its context, so the same
   screen greets a returning visitor with different words; a tap draws another.
   The picking is pure (`passageFor` in content/classic.js); this file only
   chooses a seed and draws. Sizes: "lg" for a hero, default for a page, "sm"
   for a card corner.

   A few words carry the mark (`emphasize`, same file, which ranks the words of
   strength above the words of the board). They are <strong>, because that is
   what they are — the emphasis is in the markup, not only in the colour, so it
   survives a screen reader and a stylesheet that never loads.

   The hero types itself out; the page and the card sizes arrive already set.
   A passage that types is a page being written in front of the reader, and that
   is worth a beat once on a screen. Three of them going at once on the same
   screen would be a tic, and a card in the corner of a lobby is not where anyone
   is waiting for a sentence to finish. Tapping the hero for another page types
   the new one, because that is the whole pleasure of asking for another.

   The typing is a flourish and never the content: the finished passage is the
   element's accessible name from the first frame, the moving spans are hidden
   from screen readers, and a reader who asked for less motion gets it set. */

const REDUCED = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* The front door types too (components/Typed.jsx), and it types at a fixed
   speed, which is right for a section label and a single line. A passage runs
   from 125 to 356 characters, where a fixed speed puts four seconds between the
   shortest and the longest. So the duration is what is held constant here —
   every passage lands in about the same beat — and the speed falls out of the
   length, inside bounds a typist could hold. The two share the pure part
   (typedParts) and the caret; only the clock differs, and it differs on
   purpose. */
const TYPE_MS = 2200;
const TICK = { min: 8, max: 28 };
/** The rest a typist takes at a mark of punctuation, in ticks. */
const REST = { ".": 6, ";": 4, ",": 3, ":": 3 };

const tickFor = (len) => Math.max(TICK.min, Math.min(TICK.max, Math.round(TYPE_MS / Math.max(1, len))));

/** How many characters of `text` are down so far. `on` false means all of them. */
function useTyped(text, on) {
  const start = () => (on && !REDUCED() ? 0 : text.length);
  const [typed, setTyped] = useState(() => ({ text, n: start() }));
  // A new passage starts from nothing without waiting for the effect to say so.
  const shown = typed.text === text ? typed.n : start();

  useEffect(() => {
    if (!on || REDUCED()) return undefined;
    const tick = tickFor(text.length);
    let n = 0;
    let timer = 0;
    const step = () => {
      n += 1;
      setTyped({ text, n });
      if (n >= text.length) return;
      timer = window.setTimeout(step, tick * (REST[text[n - 1]] || 1));
    };
    timer = window.setTimeout(step, 180);   // a breath before the first key
    return () => window.clearTimeout(timer);
  }, [text, on]);

  return shown;
}

export function Passage({ context = "any", size = "", className = "" }) {
  const t = useT();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const authored = passageFor(context, seed);
  const p = authored && localizePassage(authored, t);
  const text = p ? p.text : "";
  const typing = size === "lg";
  const shown = useTyped(text, typing);
  if (!p) return null;

  return (
    <figure
      className={`passage ${size} ${className}`}
      onClick={() => setSeed(s => s + 1)}
      title={t("quote.another")}
    >
      <blockquote className="passage-text" aria-label={p.text}>
        {/* The finished passage, hidden, holding the box open. Without it the
            card grows line by line as the text arrives and the whole page below
            slides down for two seconds, which is a worse thing to watch than a
            passage is a good one. */}
        {typing && <span className="passage-ghost" aria-hidden="true">{p.text}</span>}
        <span className="passage-typed" aria-hidden="true">
          {typedParts(emphasize(p.text, markBudget(p.text)), shown).map((part, i) => (
            part.mark
              ? <strong className="passage-key" key={i}>{part.text}</strong>
              : <span key={i}>{part.text}</span>
          ))}
          {shown < text.length && <span className="type-caret" />}
        </span>
      </blockquote>
      <figcaption className="passage-cite">
        {t("voice.passageCite", {
          author: CLASSIC.author,
          book: t("classicBook.short", null, CLASSIC.short),
          n: p.chapter,
          title: t(`chapter.${p.chapter}.title`, null, p.title),
        })}
      </figcaption>
    </figure>
  );
}
