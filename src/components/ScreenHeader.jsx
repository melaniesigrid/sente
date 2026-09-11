import { TypedLabel } from "./Typed.jsx";

/* ----------------------- A SCREEN HEADER -----------------------
   The front door's way of opening a section, made available to every screen:
   a small letterspaced label typed out in the accent, a heading at display
   size under it, and a line of prose to say what the screen is for.

   Before this, each screen opened on a bare `<h2>Learn</h2>`, correct, and
   completely silent about where you had arrived. One word at heading size does
   not tell a reader anything the nav had not already told them; the label and
   the lede are what turn a tab into a place.

   `title` takes an <em> for the one word worth leaning on, exactly as the
   landing's headlines do. `lede` is optional: a screen whose purpose is obvious
   from its own contents should not be made to explain itself. */
export function ScreenHeader({ label, title, lede, children, className = "" }) {
  return (
    <header className={`screen-head ${className}`.trim()}>
      {label && <TypedLabel className="screen-label">{label}</TypedLabel>}
      <h2 className="screen-title">{title}</h2>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </header>
  );
}
