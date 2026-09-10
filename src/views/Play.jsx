import { useState, useMemo } from "react";
import { Play, Users, Handshake, Minus, Plus, Home } from "lucide-react";
import { Avatar, RankBadge, Btn } from "../components/ui.jsx";
import { Passage } from "../components/Passage.jsx";
import { DuelCard } from "../components/DuelCard.jsx";
import { personasFor, PERSONAS } from "../content/personas.js";
import { rankOf, ratingOfRank, stepRank, rankInRange, RANK_LADDER } from "../content/rank.js";
import { duelMode } from "../content/duel.js";
import { dayKey } from "../content/kata.js";
import { CLOCK_PRESETS, presetById, presetText } from "../content/clockFace.js";
import { loadSession } from "./session.js";
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
  // The clock the next game is played with. A table preference, not a profile one.
  const [clockId, setClockId] = useState("none");
  const today = dayKey();
  // The saved table is re-read whenever the lobby shows, so leaving a duel mid-game is reflected.
  const saved = useMemo(() => (session ? null : loadSession({ today, profile })), [session, today, profile]);
  if (!session) {
    const first = RANK_LADDER[0], last = RANK_LADDER[RANK_LADDER.length - 1];
    const clock = presetById(clockId).preset;
    const sit = (mode) => setSession({ mode: { ...mode, clock } });
    return (
      <div className="stack">
        <h2 className="section-title">Find a game</h2>
        <p className="lede">
          Play a house opponent — each with their own style and table talk — or hand the
          device across the table for a face-to-face game. House players adapt to the level
          you pick, from 25 kyu to 9 dan, so choose the company you like. Networked
          matchmaking joins the same seat when the server lands.
        </p>
        <Passage context="play" />
        <DuelCard profile={profile} today={today} mode={duelMode(PERSONAS, today)}
          saved={saved && saved.mode.kind === "duel" ? saved : null} onPlay={setSession} />
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
        <div className="rank-picker neu-card" role="group" aria-label="Clock">
          <div className="rank-picker-label">
            <strong>Clock</strong>
            <span className="fine">{clock ? presetText(clock) : "untimed, as most games on a device are"}</span>
          </div>
          <div className="clock-picker" role="radiogroup" aria-label="Time control">
            {CLOCK_PRESETS.map(p => (
              <button key={p.id} type="button" role="radio" aria-checked={clockId === p.id}
                className={`clock-opt ${clockId === p.id ? "active" : ""}`}
                onClick={() => setClockId(p.id)}>{p.short}</button>
            ))}
          </div>
        </div>
        <div className="grid3">
          {personasFor(rank).map(p => (
            <button key={p.id} className="neu-card persona-card" onClick={() => sit({ kind: "bot", persona: p, rank })}>
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
        <button className="neu-card persona-card local-card" onClick={() => sit({ kind: "local" })}>
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
