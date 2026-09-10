import { faceOf } from "../content/clockFace.js";

/* ----------------------- CLOCK FACE -----------------------
   One side's clock, drawn to sit inside the vs-strip rather than in a bar of its own:
   a clock is not chrome, it is part of who is sitting at the table.

   Pressure is a colour shift and nothing else — no flashing, no sound, no growing
   digits — because the point is to be readable at a glance while reading a board.
   Byo-yomi periods are pips, one per period still in hand, so the count is legible
   without arithmetic.

   The digits are `aria-hidden` and the accessible name lives on the element itself:
   a `role="timer"` that changed ten times a second under `aria-live` would make the
   board unusable with a screen reader. */

const dots = (n) => Array.from({ length: n }, (_, i) => i);

export function ClockFace({ clock, color, active = false, timed = true, align = "left" }) {
  if (!clock) return null;
  if (!timed) return <span className={`clock-face untimed ${align}`}>no clock</span>;

  const face = faceOf(clock, color);
  const label = face.flagged
    ? "out of time"
    : `${face.text}${face.inByoyomi ? `, byo-yomi, ${face.periods} period${face.periods === 1 ? "" : "s"} left` : ""}`;

  return (
    <span
      role="timer"
      aria-label={label}
      className={[
        "clock-face",
        align,
        `p-${face.pressure}`,
        active ? "running" : "",
        face.inByoyomi ? "byoyomi" : "",
        face.flagged ? "flagged" : "",
      ].filter(Boolean).join(" ")}
    >
      <span className="clock-digits" aria-hidden="true">{face.text}</span>
      {face.inByoyomi && (
        <span className="clock-pips" aria-hidden="true">
          {dots(face.periods).map((i) => <i key={i} className="clock-pip" />)}
        </span>
      )}
    </span>
  );
}
