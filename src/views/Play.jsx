import { useState } from "react";
import { Play, Users, Handshake, Minus, Plus, Home } from "lucide-react";
import { Avatar, RankBadge, Btn } from "../components/ui.jsx";
import { personasFor } from "../content/personas.js";
import { rankOf, ratingOfRank, stepRank, rankInRange, RANK_LADDER } from "../content/rank.js";
import { Game } from "./Game.jsx";

/* ----------------------- PLAY (lobby) -----------------------
   `resume` is `{ mode, record }` from the Home card; it seeds the first
   session only, a fresh mount without it shows the lobby. */
export function PlayView({ profile, setProfile, notify, resume }) {
  // session: null | { mode: {kind:'bot', persona} | {kind:'local'}, record? }
  const [session, setSession] = useState(() => resume || null);
  // The level the next game is played at. Starts at the player's own rank; every house
  // player adapts to it, so nobody has to "graduate" to an opponent.
  const myRank = rankOf(profile.rating);
  const [rank, setRank] = useState(myRank);
  if (!session) {
    const first = RANK_LADDER[0], last = RANK_LADDER[RANK_LADDER.length - 1];
    return (
      <div className="stack">
        <h2 className="section-title">Find a game</h2>
        <p className="lede">
          Play a house opponent — each with their own style and table talk — or hand the
          device across the table for a face-to-face game. House players adapt to the level
          you pick, from 25 kyu to 9 dan, so choose the company you like. Networked
          matchmaking joins the same seat when the server lands.
        </p>
        <div className="rank-picker neu-card" role="group" aria-label="Level to play at">
          <div className="rank-picker-label">
            <strong>Play at</strong>
            <span className="fine">{rank === myRank ? "your level" : `you are ${myRank}`}</span>
          </div>
          <div className="rank-picker-controls">
            <Btn icon={Minus} small label="One rank weaker" disabled={rank === first} onClick={() => setRank(stepRank(rank, -1))} />
            <RankBadge rating={ratingOfRank(rank)} size="lg" />
            <Btn icon={Plus} small label="One rank stronger" disabled={rank === last} onClick={() => setRank(stepRank(rank, 1))} />
            {rank !== myRank && <Btn icon={Home} small onClick={() => setRank(myRank)}>My level</Btn>}
          </div>
        </div>
        <div className="grid3">
          {personasFor(rank).map(p => (
            <button key={p.id} className="neu-card persona-card" onClick={() => setSession({ mode: { kind: "bot", persona: p, rank } })}>
              <div className="persona-top">
                <Avatar name={p.name} tint={p.tint} size={52} bot />
                <div>
                  <h3>{p.name}</h3>
                  <p className="persona-tag">{p.tagline}</p>
                </div>
                <RankBadge rating={ratingOfRank(rank)} />
              </div>
              <p className="persona-bio">{p.bio}</p>
              <span className="persona-cta"><Play size={13} /> {rankInRange(rank, p.range) ? `Challenge at ${rank} · at home here` : `Challenge at ${rank}`}</span>
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
