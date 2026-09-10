import { Bot, Crown, Shield, Star } from "lucide-react";
import { TINTS, rankOf, preciseRankOf, beltOf } from "../content/rank.js";
import { isProvisional } from "../engine/index.js";

/* ----------------------- SHARED UI ----------------------- */
export const Card = ({ children, className = "", inset, ...rest }) => (
  <div className={`neu-card ${inset ? "neu-inset" : ""} ${className}`} {...rest}>{children}</div>
);

export const Btn = ({ icon: Icon, children, onClick, primary, disabled, small, label }) => (
  <button className={`btn ${primary ? "btn-accent" : ""} ${small ? "btn-sm" : ""} ${children ? "" : "btn-icon"}`}
    onClick={onClick} disabled={disabled} aria-label={label} title={label}>
    {Icon && <Icon size={small ? 14 : 16} strokeWidth={2.2} />}
    {children && <span>{children}</span>}
  </button>
);

export const Pill = ({ icon: Icon, children, tone }) => (
  <div className={`status-pill ${tone || ""}`}>
    {Icon && <Icon size={15} strokeWidth={2.2} />}
    <span>{children}</span>
  </div>
);

/* `src` is a picture the player chose. It sits inside the same ring the
   initial sits in, so a table with one photograph and one letter still reads
   as one row of avatars rather than two kinds of thing. The initial stays
   underneath it: a picture that fails to load leaves a letter, not a hole. */
export const Avatar = ({ name, tint, size = 44, bot, src, className = "" }) => (
  <div className={`avatar ${className}`} style={{ width: size, height: size, color: TINTS[tint] || TINTS.eucalyptus }}>
    <span style={{ fontSize: size * 0.4 }}>{(name || "?").slice(0, 1).toUpperCase()}</span>
    {src && <img className="avatar-img" src={src} alt="" loading="lazy" decoding="async" />}
    {bot && <span className="avatar-bot"><Bot size={11} strokeWidth={2.4} /></span>}
  </div>
);

/* The badge carries the belt as a thin stripe under the rank, so the dojo
   colour travels everywhere a rank is shown without any extra chrome. */
/* `precise` shows the rank to a tenth - the player's own rank, where a game
   that moved them a fraction should be visible. A house player is shown at the
   whole rank it was asked to play, because that is all it was asked. `rd` is the
   rating deviation: while it is wide the rank is still a guess, and the badge
   says so with a question mark rather than pretending otherwise. */
export const RankBadge = ({ rating, size = "md", precise = false, rd }) => {
  const whole = rankOf(rating);
  const label = precise ? preciseRankOf(rating) : whole;
  const belt = beltOf(rating);
  const dan = whole.endsWith("d");
  const unsure = rd !== undefined && isProvisional(rd);
  const Icon = dan ? Crown : parseInt(whole) <= 10 ? Star : Shield;
  const title = `Rating ${Math.round(rating)} · ${belt.label}${unsure ? " · still settling" : ""}`;
  return (
    <div className={`rank-badge ${size}`} title={title}>
      <Icon size={size === "lg" ? 18 : 14} strokeWidth={2.2} />
      <span>{label}{unsure ? "?" : ""}</span>
      <span className="belt-stripe" style={{ background: belt.color }} aria-hidden="true" />
    </div>
  );
};

/** A tied belt: the band plus a knot. `belt` is an entry from BELTS. */
export const BeltRibbon = ({ belt, className = "" }) => (
  <div className={`belt-ribbon ${className}`} style={{ "--belt": belt.color }} role="img" aria-label={belt.label}>
    <span className="belt-band" />
    <span className="belt-knot" />
    <span className="belt-tail belt-tail-l" />
    <span className="belt-tail belt-tail-r" />
  </div>
);

/** A neumorphic on/off switch. */
export const Toggle = ({ on, onChange, label }) => (
  <button className={`toggle ${on ? "on" : ""}`} role="switch" aria-checked={on} aria-label={label}
    onClick={() => onChange(!on)}>
    <span className="toggle-knob" />
  </button>
);

/* ----------------------- A PULL QUOTE -----------------------
   One condensed idea lifted out of the prose and set large between the
   paragraphs, the way a magazine pulls a line into the margin. Where a
   `Passage` is Zhang Ni's voice, this is ours: the same idea in ordinary
   modern words, labelled as a gloss so it is never taken for a quotation of
   the text beside it. `label` names the register; the default suits the book.
   `size` is "sm" for a card corner, default for a page. */
export const PullQuote = ({ children, label = "In plain words", size = "" }) => (
  <aside className={`pull-quote ${size}`.trim()}>
    <p className="pull-line">{children}</p>
    <span className="pull-label">{label}</span>
  </aside>
);

/* ----------------------- A STATEMENT -----------------------
   The same idea as the pull quote, in six words instead of sixty, and set as
   large as the screen will bear. A screen carries one quotation and one
   statement: the quotation is Zhang Ni's voice (`Passage`), set in the italic,
   and the statement is the house's, set in the display face — because two
   blocks of the same italic stacked together read as one long quote nobody
   finishes, which is the bug this replaced.

   Three lines, worn three ways by the stylesheet: capitals in the display
   face, then the italic voice, then the same capitals drawn as an outline. The
   words are data (`STATEMENTS` in content/plain.js). The plain-words sentence
   goes under them as `children`, small and in the body face, still carrying
   the label that says whose words they are.

   The lines rise out of a mask on arrival, one after another. It is a
   flourish and never the content: the whole statement is the paragraph's
   accessible name from the first frame, the animated spans are hidden from a
   reader, and less motion means the lines are simply already up. */
export const Statement = ({ lines, children, label = "In plain words" }) => {
  if (!lines || lines.length === 0) return null;
  return (
    <section className="statement">
      <p className="statement-lines" aria-label={lines.join(" ")}>
        {lines.map((line, i) => (
          <span className="statement-mask" key={i} aria-hidden="true">
            <span className="statement-line">{line}</span>
          </span>
        ))}
      </p>
      {children ? (
        <p className="statement-gloss">
          <span className="pull-label">{label}</span>
          <span>{children}</span>
        </p>
      ) : null}
    </section>
  );
};
