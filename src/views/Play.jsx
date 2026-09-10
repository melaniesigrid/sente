import { useState, useMemo } from "react";
import { Play, Users, Handshake, Minus, Plus, Home } from "lucide-react";
import { Avatar, RankBadge, Btn } from "../components/ui.jsx";
import { DuelCard } from "../components/DuelCard.jsx";
import { PERSONAS, personasFor } from "../content/personas.js";
import { rankOf, preciseRankOf, ratingOfRank, stepRank, rankInRange, rankWithHandicap, RANK_LADDER } from "../content/rank.js";
import { duelMode } from "../content/duel.js";
import { dayKey } from "../content/kata.js";
import { SIZES, defaultKomi } from "../engine/index.js";
import { loadLobby, saveLobby, HANDICAPS, KOMI_STEPS } from "../store/lobby.js";
import { loadSession } from "./session.js";
import { Game } from "./Game.jsx";

/* ----------------------- PLAY (lobby) -----------------------
   `resume` is `{ mode, record }` from the Home card; it seeds the first
   session only, a fresh mount without it shows the lobby.

   The table (board size, handicap, komi) is set once here and rides on the
   session mode; the record is built from it in Game. Komi defaults to what the
   board is owed — the smaller the board the smaller the first move is worth —
   and is shown rather than hidden. A player who wants a gentler game can move
   it, in half points so no game can end in a draw. */
export function PlayView({ profile, setProfile, notify, resume }) {
  // session: null | { mode: {kind:'bot', persona, rank, size, handicap} | {kind:'local', size, handicap} | duel, record? }
  const [session, setSession] = useState(() => resume || null);
  // The level the next game is played at. Starts at the player's own rank; every house
  // player adapts to it, so nobody has to "graduate" to an opponent.
  const myRank = rankOf(profile.rating);
  const [rank, setRank] = useState(myRank);
  const [table, setTableState] = useState(loadLobby);
  const setTable = (patch) => setTableState(t => { const n = { ...t, ...patch }; saveLobby(n); return n; });
  const today = dayKey();
  // The saved table is re-read whenever the lobby shows, so leaving a duel mid-game is reflected.
  const saved = useMemo(() => (session ? null : loadSession(undefined, today)), [session, today]);
  if (!session) {
    const first = RANK_LADDER[0], last = RANK_LADDER[RANK_LADDER.length - 1];
    const hi = HANDICAPS.indexOf(table.handicap);
    const komi = table.komi ?? defaultKomi(table.handicap, table.size);
    const ki = KOMI_STEPS.indexOf(komi);
    const ratedAs = rankWithHandicap(rank, table.handicap);
    const sit = (mode) => setSession({ mode: { ...mode, size: table.size, handicap: table.handicap, komi } });
    return (
      <div className="stack">
        <h2 className="section-title">Find a game</h2>
        <p className="lede">
          Play a house opponent — each with their own style and table talk — or hand the
          device across the table for a face-to-face game. House players adapt to the level
          you pick, from 25 kyu to 9 dan, and play any board. Networked matchmaking joins
          the same seat when the server lands.
        </p>
        <div className="rank-picker neu-card" role="group" aria-label="Level to play at">
          <div className="rank-picker-label">
            <strong>Play at</strong>
            <span className="fine">{rank === myRank ? `your level · ${preciseRankOf(profile.rating)}` : `you are ${preciseRankOf(profile.rating)}`}</span>
          </div>
          <div className="rank-picker-controls">
            <Btn icon={Minus} small label="One rank weaker" disabled={rank === first} onClick={() => setRank(stepRank(rank, -1))} />
            <RankBadge rating={ratingOfRank(rank)} size="lg" />
            <Btn icon={Plus} small label="One rank stronger" disabled={rank === last} onClick={() => setRank(stepRank(rank, 1))} />
            {rank !== myRank && <Btn icon={Home} small onClick={() => setRank(myRank)}>My level</Btn>}
          </div>
        </div>
        <div className="rank-picker neu-card table-picker" role="group" aria-label="The table">
          <div className="rank-picker-label">
            <strong>The table</strong>
            <span className="fine">
              {table.komi === null ? `komi ${komi}, what this board is owed` : `komi ${komi}, your choice`}
              {table.handicap ? ` · White plays first · rated as ${ratedAs}` : ""}
            </span>
          </div>
          <div className="rank-picker-controls">
            <div className="seg" role="radiogroup" aria-label="Board size">
              {SIZES.map(n => (
                <button key={n} type="button" role="radio" aria-checked={table.size === n}
                  className={`seg-btn ${table.size === n ? "active" : ""}`} onClick={() => setTable({ size: n })}>
                  {n}×{n}
                </button>
              ))}
            </div>
            <div className="rank-picker-controls" role="group" aria-label="Komi">
              <Btn icon={Minus} small label="Less komi" disabled={ki <= 0} onClick={() => setTable({ komi: KOMI_STEPS[ki - 1] })} />
              <span className="handicap-num" aria-live="polite">{komi} komi</span>
              <Btn icon={Plus} small label="More komi" disabled={ki >= KOMI_STEPS.length - 1} onClick={() => setTable({ komi: KOMI_STEPS[ki + 1] })} />
              {table.komi !== null && <Btn icon={Home} small onClick={() => setTable({ komi: null })}>Default</Btn>}
            </div>
            <div className="rank-picker-controls" role="group" aria-label="Handicap stones">
              <Btn icon={Minus} small label="Fewer handicap stones" disabled={hi <= 0} onClick={() => setTable({ handicap: HANDICAPS[hi - 1] })} />
              <span className="handicap-num" aria-live="polite">{table.handicap ? `${table.handicap} stones` : "No handicap"}</span>
              <Btn icon={Plus} small label="More handicap stones" disabled={hi >= HANDICAPS.length - 1} onClick={() => setTable({ handicap: HANDICAPS[hi + 1] })} />
            </div>
          </div>
        </div>
        <DuelCard profile={profile} today={today} mode={duelMode(PERSONAS, today)}
          saved={saved && saved.mode.kind === "duel" ? saved : null} onPlay={setSession} />
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
        {/* Chapter nine of the Classic answers the charge that a game of
            invasion and killing must be a false Way. It is the oldest
            statement of the reason every player here is labeled honestly. */}
        <p className="fine lobby-creed">
          Every player above is a bot, and says so. The classic settled the
          question nine centuries ago: a small Way, but the same Way as war,
          and its rule for players was to be honest and not incorrect.
        </p>
      </div>
    );
  }
  return (
    <Game mode={session.mode} initial={session.record} onExit={() => setSession(null)}
      profile={profile} setProfile={setProfile} notify={notify} />
  );
}
