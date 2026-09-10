import { Bot, Crown, Shield, Star } from "lucide-react";
import { TINTS, rankOf, beltOf } from "../content/rank.js";

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

export const Avatar = ({ name, tint, size = 44, bot, className = "" }) => (
  <div className={`avatar ${className}`} style={{ width: size, height: size, color: TINTS[tint] || TINTS.eucalyptus }}>
    <span style={{ fontSize: size * 0.4 }}>{(name || "?").slice(0, 1).toUpperCase()}</span>
    {bot && <span className="avatar-bot"><Bot size={11} strokeWidth={2.4} /></span>}
  </div>
);

/* The badge carries the belt as a thin stripe under the rank, so the dojo
   colour travels everywhere a rank is shown without any extra chrome. */
export const RankBadge = ({ rating, size = "md" }) => {
  const label = rankOf(rating);
  const belt = beltOf(rating);
  const dan = label.endsWith("d");
  const Icon = dan ? Crown : parseInt(label) <= 10 ? Star : Shield;
  return (
    <div className={`rank-badge ${size}`} title={`Rating ${rating} · ${belt.label}`}>
      <Icon size={size === "lg" ? 18 : 14} strokeWidth={2.2} />
      <span>{label}</span>
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
