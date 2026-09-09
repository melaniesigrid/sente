import { useState } from "react";
import { Swords, Play, Share2, Check, Hourglass } from "lucide-react";
import { Avatar, Btn } from "./ui.jsx";
import { duelState, duelResultText, duelShareText, duelShareUrl } from "../content/duel.js";

/* ----------------------- DAILY DUEL CARD -----------------------
   The same card on Home and in the lobby. Three states from the profile:
   open (play), playing (resume if the table is still saved, else the attempt
   is spent), done (result and a share button). All facts come from
   content/duel.js; this file only draws them. */

/** Copies the result text; falls back to a prompt where the clipboard is unavailable. */
export function ShareDuelButton({ text, small }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your result", text);
    }
  };
  return <Btn icon={copied ? Check : Share2} small={small} onClick={share}>{copied ? "Copied" : "Share result"}</Btn>;
}

/** @param {{ profile, today: string, mode: object|null, saved: object|null, onPlay: (session) => void }} p */
export function DuelCard({ profile, today, mode, saved, onPlay }) {
  if (!mode) return null;
  const state = duelState(profile, today);
  const host = mode.persona;
  const code = profile.duelResult;
  const tone = state !== "done" ? "" : code.startsWith("B+") ? "won" : code === "Jigo" ? "" : "lost";
  const line = state === "open"
    ? "Same host, same board, same replies for everyone today. One attempt, unrated."
    : state === "playing"
      ? (saved ? "Your game is still on the table." : "You left the table, so today's attempt is spent. Tomorrow brings a new host.")
      : `${duelResultText(code)}${profile.duelStreak > 1 ? ` · ${profile.duelStreak} days won in a row` : ""}`;
  return (
    <div className={`neu-card duel-card ${tone}`}>
      <Avatar name={host.name} tint={host.tint} size={52} bot />
      <div className="duel-copy">
        <div className="stat-head"><Swords size={16} /><span>Daily duel</span></div>
        <strong className="duel-title">vs {host.name} <span className="fine-inline">house bot · {host.tagline}</span></strong>
        <span className="fine">{line}</span>
      </div>
      {state === "open" && <Btn icon={Play} primary small onClick={() => onPlay({ mode })}>Play today&rsquo;s</Btn>}
      {state === "playing" && saved && <Btn icon={Play} primary small onClick={() => onPlay(saved)}>Resume</Btn>}
      {state === "playing" && !saved && <div className="duel-result"><Hourglass size={16} /><span className="fine">until tomorrow</span></div>}
      {state === "done" && (
        <div className="row">
          <div className="duel-result"><span className="stat-num">{code}</span></div>
          <ShareDuelButton small text={duelShareText({ key: today, personaName: host.name, code, moves: profile.duelMoves, url: duelShareUrl(window.location) })} />
        </div>
      )}
    </div>
  );
}
