import { Bot, Crown, Shield, Star } from "lucide-react";
import { TINTS, rankOf } from "../content/rank.js";

/* ----------------------- SHARED UI ----------------------- */
export const Card = ({ children, className = "", inset }) => (
  <div className={`neu-card ${inset ? "neu-inset" : ""} ${className}`}>{children}</div>
);

export const Btn = ({ icon: Icon, children, onClick, primary, disabled, small }) => (
  <button className={`btn ${primary ? "btn-accent" : ""} ${small ? "btn-sm" : ""}`}
    onClick={onClick} disabled={disabled}>
    {Icon && <Icon size={small ? 14 : 16} strokeWidth={2.2} />}
    <span>{children}</span>
  </button>
);

export const Pill = ({ icon: Icon, children, tone }) => (
  <div className={`status-pill ${tone || ""}`}>
    {Icon && <Icon size={15} strokeWidth={2.2} />}
    <span>{children}</span>
  </div>
);

export const Avatar = ({ name, tint, size = 44, bot }) => (
  <div className="avatar" style={{ width: size, height: size, color: TINTS[tint] || TINTS.eucalyptus }}>
    <span style={{ fontSize: size * 0.4 }}>{(name || "?").slice(0, 1).toUpperCase()}</span>
    {bot && <span className="avatar-bot"><Bot size={11} strokeWidth={2.4} /></span>}
  </div>
);

export const RankBadge = ({ rating, size = "md" }) => {
  const label = rankOf(rating);
  const dan = label.endsWith("d");
  const Icon = dan ? Crown : parseInt(label) <= 10 ? Star : Shield;
  return (
    <div className={`rank-badge ${size}`} title={`Rating ${rating}`}>
      <Icon size={size === "lg" ? 18 : 14} strokeWidth={2.2} />
      <span>{label}</span>
    </div>
  );
};
