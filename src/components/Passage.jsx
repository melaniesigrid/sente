import { useState } from "react";
import { passageFor, CLASSIC } from "../content/classic.js";

/* ----------------------- PASSAGE (a page from the Classic) -----------------------
   A passage from Zhang Ni's thirteen chapters, set in the pairing's italic voice
   with a quiet citation. Every mount draws a fresh one for its context, so the same
   screen greets a returning visitor with different words; a tap draws another.
   The picking is pure (`passageFor` in content/classic.js); this file only
   chooses a seed and draws. Sizes: "lg" for a hero, default for a page, "sm"
   for a card corner. */
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
      <blockquote className="passage-text">{p.text}</blockquote>
      <figcaption className="passage-cite">
        {CLASSIC.author} · {CLASSIC.short} · chapter {p.chapter}, {p.title}
      </figcaption>
    </figure>
  );
}
