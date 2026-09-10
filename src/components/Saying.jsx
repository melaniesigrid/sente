import { Quote } from "lucide-react";
import { Card } from "./ui.jsx";
import { CLASSIC } from "../content/classic.js";

/* ----------------------- A SAYING -----------------------
   One line of Zhang Ni's Classic with its chapter under it. Home shows the
   saying of the day, Learn puts the same block at the head of the series
   card, and both take it from content/classic.js, which is the only place
   the text lives. `children` is whatever the host wants under the line. */

export function Saying({ saying }) {
  if (!saying) return null;
  return (
    <>
      <p className="lesson-text saying-line">{saying.text}</p>
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
