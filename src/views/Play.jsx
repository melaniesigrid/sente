import { useState, useMemo } from "react";
import { Play, Users, Handshake, Minus, Plus, Home } from "lucide-react";
import { Avatar, RankBadge, Btn, PullQuote } from "../components/ui.jsx";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { plainFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { DuelCard } from "../components/DuelCard.jsx";
import { personasFor, PERSONAS } from "../content/personas.js";
import { rankOf, ratingOfRank, stepRank, rankInRange, rankWithHandicap, RANK_LADDER } from "../content/rank.js";
import { SIZES, defaultKomi, RULESET_IDS, rulesetOf } from "../engine/index.js";
import { loadLobby, saveLobby, HANDICAPS, KOMI_STEPS } from "../store/lobby.js";
import { duelMode } from "../content/duel.js";
import { dayKey } from "../content/kata.js";
import { CLOCK_PRESETS, presetById, presetText } from "../content/clockFace.js";
import { MastersRow } from "../components/MastersRow.jsx";
import { loadSession } from "./session.js";
import { Game } from "./Game.jsx";
import { OnlineCard } from "./OnlineLobby.jsx";
import { OnlineGame } from "./OnlineGame.jsx";

/* ----------------------- PLAY (lobby) -----------------------
   `resume` is `{ mode, record }` from the Home card; it seeds the first
   session only, a fresh mount without it shows the lobby.

   The table (board size, handicap) is set once here and rides on the session
   mode; the record is built from it in Game. Komi is never typed in: it is
   the engine's default for the handicap, shown so nobody is surprised. The
   same board size is what the online card seeks with.

   A `?game=` in the address opens that online table directly (a shared link). */
const GAME_ID = /^g_[0-9a-f]{12}$/;
function linkedGame() {
  try {
    const id = new URLSearchParams(window.location.search).get("game");
    if (id && GAME_ID.test(id)) {
      window.history.replaceState(null, "", window.location.pathname);
      return { mode: { kind: "online", gameId: id } };
    }
  } catch { /* no window */ }
  return null;
}

export function PlayView({ profile, setProfile, notify, resume }) {
  // session: null | { mode: {kind:'bot', persona, rank, size, handicap} | {kind:'local', size, handicap}
  //                  | {kind:'online', gameId} | duel, record? }
  const [session, setSession] = useState(() => resume || linkedGame());
  // The level the next game is played at. Starts at the player's own rank; every house
  // player adapts to it, so nobody has to "graduate" to an opponent.
  const myRank = rankOf(profile.rating);
  const [rank, setRank] = useState(myRank);
  const [table, setTableState] = useState(loadLobby);
  const setTable = (patch) => setTableState(t => { const n = { ...t, ...patch }; saveLobby(n); return n; });
  const today = dayKey();
  // The saved table is re-read whenever the lobby shows, so leaving a duel mid-game is reflected.
  const saved = useMemo(() => (session ? null : loadSession({ today, profile })), [session, today, profile]);
  if (!session) {
    const first = RANK_LADDER[0], last = RANK_LADDER[RANK_LADDER.length - 1];
    const hi = HANDICAPS.indexOf(table.handicap);
    const set = rulesetOf(table.rules);
    const ri = RULESET_IDS.indexOf(set.id);
    // Komi is what the board is owed under these rules, unless the player has
    // said otherwise; a chosen komi survives a change of board or ruleset.
    const owed = defaultKomi(table.handicap, table.size, table.rules);
    const komi = table.komi ?? owed;
    const ki = KOMI_STEPS.indexOf(komi);
    const ratedAs = rankWithHandicap(rank, table.handicap);
    const clock = presetById(table.clock).preset;
    const sit = (mode) => setSession({
      mode: { ...mode, size: table.size, handicap: table.handicap, rules: table.rules, komi, clock },
    });
    return (
      <div className="stack arrives">
        <ScreenHeader
          label="Sit down"
          title={<>Find a <em>game</em>.</>}
          lede="Play another person over the network, take on a house opponent — each with
                their own style and table talk — or hand the device across the table for a
                face-to-face game. House players adapt to the level you pick, from 25 kyu
                to 9 dan, and play any board." />
        <PullQuote>{plainFor("play")}</PullQuote>
        <Passage context="play" />
        <OnlineCard profile={profile} notify={notify} onPlay={setSession} size={table.size} />
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
        <div className="rank-picker neu-card table-picker" role="group" aria-label="The table">
          <div className="rank-picker-label">
            <strong>The table</strong>
            <span className="fine">
              {set.name} {set.scoring} · komi {komi}{table.komi === null ? "" : ", your own"}
              {table.handicap ? ` · White plays first · rated as ${ratedAs}` : ""}
              {clock ? ` · ${presetText(clock)}` : ""}
            </span>
          </div>
          <div className="rank-picker-controls">
            <div className="rank-picker-controls" role="group" aria-label="Rules">
              <Btn icon={Minus} small label="Previous ruleset" disabled={ri <= 0}
                onClick={() => setTable({ rules: RULESET_IDS[ri - 1] })} />
              <span className="handicap-num" aria-live="polite" title={set.blurb}>{set.name}</span>
              <Btn icon={Plus} small label="Next ruleset" disabled={ri >= RULESET_IDS.length - 1}
                onClick={() => setTable({ rules: RULESET_IDS[ri + 1] })} />
            </div>
            <div className="seg" role="radiogroup" aria-label="Board size">
              {SIZES.map(n => (
                <button key={n} type="button" role="radio" aria-checked={table.size === n}
                  className={`seg-btn ${table.size === n ? "active" : ""}`} onClick={() => setTable({ size: n })}>
                  {n}×{n}
                </button>
              ))}
            </div>
            <div className="rank-picker-controls" role="group" aria-label="Komi">
              <Btn icon={Minus} small label="Less komi" disabled={ki <= 0}
                onClick={() => setTable({ komi: KOMI_STEPS[ki - 1] })} />
              <span className="handicap-num" aria-live="polite">{komi} komi</span>
              <Btn icon={Plus} small label="More komi" disabled={ki >= KOMI_STEPS.length - 1}
                onClick={() => setTable({ komi: KOMI_STEPS[ki + 1] })} />
              {table.komi !== null && komi !== owed
                && <Btn icon={Home} small onClick={() => setTable({ komi: null })}>Default</Btn>}
            </div>
            <div className="rank-picker-controls" role="group" aria-label="Handicap stones">
              <Btn icon={Minus} small label="Fewer handicap stones" disabled={hi <= 0} onClick={() => setTable({ handicap: HANDICAPS[hi - 1] })} />
              <span className="handicap-num" aria-live="polite">{table.handicap ? `${table.handicap} stones` : "No handicap"}</span>
              <Btn icon={Plus} small label="More handicap stones" disabled={hi >= HANDICAPS.length - 1} onClick={() => setTable({ handicap: HANDICAPS[hi + 1] })} />
            </div>
            <div className="seg" role="radiogroup" aria-label="Time control">
              {CLOCK_PRESETS.map(p => (
                <button key={p.id} type="button" role="radio" aria-checked={table.clock === p.id}
                  className={`seg-btn ${table.clock === p.id ? "active" : ""}`} onClick={() => setTable({ clock: p.id })}>
                  {p.short}
                </button>
              ))}
            </div>
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
        <MastersRow onSit={(mode) => setSession({ mode: { ...mode, clock } })} />
      </div>
    );
  }
  if (session.mode.kind === "online") {
    return <OnlineGame gameId={session.mode.gameId} onExit={() => setSession(null)} profile={profile} notify={notify} />;
  }
  return (
    <Game mode={session.mode} initial={session.record} onExit={() => setSession(null)}
      profile={profile} setProfile={setProfile} notify={notify} />
  );
}
