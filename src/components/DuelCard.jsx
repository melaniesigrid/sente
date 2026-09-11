import { useState } from "react";
import { Swords, Play, Share2, Check, Hourglass } from "lucide-react";
import { Avatar, Btn, RankBadge } from "./ui.jsx";
import { ratingOfRank } from "../content/rank.js";
import { duelState, duelResultText, duelShareText, duelShareUrl } from "../content/duel.js";
import { useT } from "./langStore.js";

/* ----------------------- DAILY DUEL CARD -----------------------
   The same card on Home and in the lobby. Three states from the profile:
   open (play), playing (resume if the table is still saved, else the attempt
   is spent), done (result and a share button). All facts come from
   content/duel.js; this file only draws them. */

/** Copies the result text; falls back to a prompt where the clipboard is unavailable. */
export function ShareDuelButton({ text, small }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("duel.copyPrompt"), text);
    }
  };
  return <Btn icon={copied ? Check : Share2} small={small} onClick={share}>{t(copied ? "duel.copied" : "duel.share")}</Btn>;
}

/** @param {{ profile, today: string, mode: object|null, saved: object|null, onPlay: (session) => void }} p */
export function DuelCard({ profile, today, mode, saved, onPlay }) {
  const t = useT();
  if (!mode) return null;
  const state = duelState(profile, today);
  const host = mode.persona;
  const code = profile.duelResult;
  const tone = state !== "done" ? "" : code.startsWith("B+") ? "won" : code === "Jigo" ? "" : "lost";
  const line = state === "open"
    ? t("duel.open")
    : state === "playing"
      ? t(saved ? "duel.onTable" : "duel.spent")
      : profile.duelStreak > 1
        ? t("duel.streak", { result: duelResultText(code), days: profile.duelStreak })
        : duelResultText(code);
  return (
    <div className={`neu-card duel-card ${tone}`}>
      <Avatar name={host.name} tint={host.tint} size={52} bot />
      <div className="duel-copy">
        <div className="stat-head"><Swords size={16} /><span>{t("duel.head")}</span></div>
        <strong className="duel-title">{t("duel.vs", { name: host.name })} <span className="fine-inline">{t("duel.host", { tagline: host.tagline })}</span></strong>
        <div className="row"><RankBadge rating={ratingOfRank(mode.rank)} size="sm" /><span className="fine">{t("duel.level")}</span></div>
        <span className="fine">{line}</span>
      </div>
      {state === "open" && <Btn icon={Play} primary small onClick={() => onPlay({ mode })}>{t("duel.play")}</Btn>}
      {state === "playing" && saved && <Btn icon={Play} primary small onClick={() => onPlay(saved)}>{t("duel.resume")}</Btn>}
      {state === "playing" && !saved && <div className="duel-result"><Hourglass size={16} /><span className="fine">{t("duel.untilTomorrow")}</span></div>}
      {state === "done" && (
        <div className="row">
          <div className="duel-result"><span className="stat-num">{code}</span></div>
          <ShareDuelButton small text={duelShareText({ key: today, personaName: host.name, code, moves: profile.duelMoves, url: duelShareUrl(window.location) })} />
        </div>
      )}
    </div>
  );
}
