import { useState } from "react";
import { passageFor, emphasize, markBudget, CLASSIC } from "../content/classic.js";

/* ----------------------- PASSAGE (a page from the Classic) -----------------------
   A passage from Zhang Ni's thirteen chapters, set in the pairing's italic voice
   with a quiet citation. Every mount draws a fresh one for its context, so the same
   screen greets a returning visitor with different words; a tap draws another.
   The picking is pure (`passageFor` in content/classic.js); this file only
   chooses a seed and draws. Sizes: "lg" for a hero, default for a page, "sm"
   for a card corner.

   A few words carry the mark (`emphasize`, same file, which ranks the words of
   strength above the words of the board). They are <strong>, because that is
   what they are — the emphasis is in the markup, not only in the colour, so it
   survives a screen reader and a stylesheet that never loads. */
export function Passage({ context = "any", size = "", className = "" }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const p = passageFor(context, seed);
  if (!p) return null;
  return (
    <figure
      className={`passage ${size} ${className}`}
      onClick={() => setSeed(s => s + 1)}
      title="Another page"
    >
      <blockquote className="passage-text">
        {emphasize(p.text, markBudget(p.text)).map((part, i) => (
          part.mark
            ? <strong className="passage-key" key={i}>{part.text}</strong>
            : <span key={i}>{part.text}</span>
        ))}
      </blockquote>
      <figcaption className="passage-cite">
        {CLASSIC.author} · {CLASSIC.short} · chapter {p.chapter}, {p.title}
      </figcaption>
    </figure>
  );
}
