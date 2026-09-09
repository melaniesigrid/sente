import { useState } from "react";
import { Play, Users, Handshake } from "lucide-react";
import { Avatar, RankBadge } from "../components/ui.jsx";
import { PERSONAS } from "../content/personas.js";
import { Game } from "./Game.jsx";

/* ----------------------- PLAY (lobby) -----------------------
   `resume` is `{ mode, record }` from the Home card; it seeds the first
   session only, a fresh mount without it shows the lobby. */
export function PlayView({ profile, setProfile, notify, resume }) {
  // session: null | { mode: {kind:'bot', persona} | {kind:'local'}, record? }
  const [session, setSession] = useState(() => resume || null);
  if (!session) {
    return (
      <div className="stack">
        <h2 className="section-title">Find a game</h2>
        <p className="lede">
          Play a house opponent — each with their own style, rank, and table talk —
          or hand the device across the table for a face-to-face game. Networked
          matchmaking joins the same seat when the server lands.
        </p>
        <div className="grid3">
          {PERSONAS.map(p => (
            <button key={p.id} className="neu-card persona-card" onClick={() => setSession({ mode: { kind: "bot", persona: p } })}>
              <div className="persona-top">
                <Avatar name={p.name} tint={p.tint} size={52} bot />
                <div>
                  <h3>{p.name}</h3>
                  <p className="persona-tag">{p.tagline}</p>
                </div>
                <RankBadge rating={p.rating} />
              </div>
              <p className="persona-bio">{p.bio}</p>
              <span className="persona-cta"><Play size={13} /> Challenge</span>
            </button>
          ))}
        </div>
        <button className="neu-card persona-card local-card" onClick={() => setSession({ mode: { kind: "local" } })}>
          <div className="persona-top">
            <div className="avatar duo"><Users size={22} strokeWidth={2} /></div>
            <div>
              <h3>Pass & play</h3>
              <p className="persona-tag">Two players, one board</p>
            </div>
          </div>
          <p className="persona-bio">The original multiplayer. Black and White share the device; the ladder sits this one out.</p>
          <span className="persona-cta"><Handshake size={13} /> Sit down</span>
        </button>
      </div>
    );
  }
  return (
    <Game mode={session.mode} initial={session.record} onExit={() => setSession(null)}
      profile={profile} setProfile={setProfile} notify={notify} />
  );
}
