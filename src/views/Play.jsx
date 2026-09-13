import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Users, Handshake, Minus, Plus, Home, TrendingUp, TrendingDown, X } from "lucide-react";
import { Avatar, RankBadge, Btn, Statement } from "../components/ui.jsx";

import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { DuelCard } from "../components/DuelCard.jsx";
import { personasFor, PERSONAS, personaById, localizePersona } from "../content/personas.js";
import { rankOf, ratingOfRank, stepRank, rankInRange, rankWithHandicap, RANK_LADDER } from "../content/rank.js";
import { SIZES, defaultKomi, RULESET_IDS, rulesetOf } from "../engine/index.js";
import { loadLobby, saveLobby, HANDICAPS, KOMI_STEPS } from "../store/lobby.js";
import { duelMode } from "../content/duel.js";
import { dayKey } from "../content/kata.js";
import { suggestLevel, suggestionText } from "../content/level.js";
import { loadTelemetry } from "../store/telemetry.js";
import { CLOCK_PRESETS, presetById, presetText, presetShort } from "../content/clockFace.js";
import { MastersRow } from "../components/MastersRow.jsx";
import { PairCard } from "../components/PairCard.jsx";
import { loadSession } from "./session.js";
import { Game } from "./Game.jsx";
import { OnlineCard } from "./OnlineLobby.jsx";
import { OnlineGame } from "./OnlineGame.jsx";
import { PairGame } from "./PairGame.jsx";
import { useT } from "../components/langStore.js";

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

function routeSession({ profile, resume, openGame, withBot, t }) {
  if (resume) return resume;
  if (openGame) return { mode: { kind: "online", gameId: openGame } };
  const persona = withBot ? personaById(withBot) : null;
  if (!persona) return null;
  const lobby = loadLobby();
  return { mode: { kind: "bot", persona: localizePersona(persona, t), rank: lobby.rank ?? rankOf(profile.rating) } };
}

export function PlayView({ profile, setProfile, notify, resume, openGame = null, withBot = null, go = null }) {
  const t = useT();
  // session: null | { mode: {kind:'bot', persona, rank, size, handicap} | {kind:'local', size, handicap}
  //                  | {kind:'online', gameId} | duel, record? }
  /* `openGame` is a table asked for by id from somewhere else in the app (the
     archive, and later the dashboard). It outranks the address bar only in
     that it is checked first; both end at the same online session. */
  /* `withBot` is a house player asked for by name from its own page. It sits
     you straight down rather than dropping you in the lobby beside the card
     you just clicked: somebody who pressed "Sit down with Tetsu" has already
     chosen. The level is the table's, exactly as if the card had been
     clicked, so nothing about the game is different from the lobby route. */
  const routeKey = resume
    ? `resume:${resume.mode.kind}:${resume.mode.gameId || resume.mode.persona?.id || ""}:${resume.record?.moves?.length || 0}`
    : openGame ? `online:${openGame}`
     : withBot ? `bot:${withBot}`
       : null;
  const [session, setSession] = useState(() => routeSession({ profile, resume, openGame, withBot, t }) || linkedGame());
  const lastRouteKey = useRef(routeKey);
  useEffect(() => {
    if (routeKey === lastRouteKey.current) return;
    lastRouteKey.current = routeKey;
    setSession(routeSession({ profile, resume, openGame, withBot, t }) || linkedGame());
  }, [routeKey, profile, resume, openGame, withBot, t]);
  // The level the next game is played at. Starts at the player's own rank; every house
  // player adapts to it, so nobody has to "graduate" to an opponent.
  const myRank = rankOf(profile.rating);
  const [table, setTableState] = useState(loadLobby);
  const setTable = (patch) => setTableState(t => { const n = { ...t, ...patch }; saveLobby(n); return n; });
  /* The level rides on the table, so it survives a reload the way the board
     does. `null` there means "my level, whatever it is now": a remembered rank
     would otherwise freeze a player at the strength they were the first time
     they touched the stepper. Stepping it is a deliberate act and is kept. */
  const rank = table.rank ?? myRank;
  const setRank = (r) => setTable({ rank: r === myRank ? null : r });
  /* What the device's own ring buffer says about this level. Read once per
     visit to the lobby rather than per render: it is a file on disk, and it
     cannot change while the lobby is on screen. */
  const log = useMemo(() => (session ? [] : loadTelemetry()), [session]);
  const suggestion = suggestLevel(log, rank);
  const [dismissed, setDismissed] = useState(null);
  const today = dayKey();
  // The saved table is re-read whenever the lobby shows, so leaving a duel mid-game is reflected.
  const saved = useMemo(() => (session ? null : loadSession({ today, profile, t })), [session, today, profile, t]);
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
          label={t("play.label")}
          title={<>{t("play.titleBefore")}<em>{t("play.titleEm")}</em>{t("play.titleAfter")}</>}
          lede={t("play.lede")} />
        <Statement lines={statementFor("play", t)} figure="play">{plainFor("play", t)}</Statement>
        <Passage context="play" />
        <OnlineCard profile={profile} notify={notify} onPlay={setSession} size={table.size} />
        <DuelCard profile={profile} today={today} mode={duelMode(PERSONAS, today)}
          saved={saved && saved.mode.kind === "duel" ? saved : null} onPlay={setSession} />
        <div className="rank-picker neu-card" role="group" aria-label={t("play.levelGroup")}>
          <div className="rank-picker-label">
            <strong>{t("play.playAt")}</strong>
            <span className="fine">{rank === myRank ? t("play.yourLevel") : t("play.youAre", { rank: myRank })}</span>
          </div>
          <div className="rank-picker-controls">
            <Btn icon={Minus} small label={t("play.weaker")} disabled={rank === first} onClick={() => setRank(stepRank(rank, -1))} />
            <RankBadge rating={ratingOfRank(rank)} size="lg" />
            <Btn icon={Plus} small label={t("play.stronger")} disabled={rank === last} onClick={() => setRank(stepRank(rank, 1))} />
            {rank !== myRank && <Btn icon={Home} small onClick={() => setRank(myRank)}>{t("play.myLevel")}</Btn>}
          </div>
          {/* What the last few even games at this level actually went like. It is
              a suggestion and it reads like one: it says what it counted, so a
              player who disagrees has the number to disagree with, and it can be
              waved off without taking it. Nothing here changes the level on its
              own: the house players adapt to whatever they are asked to play,
              and being moved without asking is the opposite of that. */}
          {suggestion && dismissed !== suggestion.to && (
            <div className="level-nudge">
              {suggestion.won ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="fine">{suggestionText(suggestion, t)}</span>
              <Btn small onClick={() => setRank(suggestion.to)}>{t("play.nudgePlay", { rank: suggestion.to })}</Btn>
              <Btn icon={X} small label={t("play.keepLevel")} onClick={() => setDismissed(suggestion.to)} />
            </div>
          )}
        </div>
        <div className="rank-picker neu-card table-picker" role="group" aria-label={t("play.tableGroup")}>
          <div className="rank-picker-label">
            <strong>{t("play.table")}</strong>
            <span className="fine">
              {t("play.tableKomi", {
                rules: t(`ruleset.${set.id}.name`, null, set.name),
                scoring: t(`ruleset.${set.id}.scoring`, null, set.scoring),
                komi,
              })}
              {table.komi === null ? "" : t("play.tableOwn")}
              {table.handicap ? t("play.tableHandicap", { rank: ratedAs }) : ""}
              {clock ? t("play.tableClock", { clock: presetText(clock, t) }) : ""}
            </span>
          </div>
          <div className="rank-picker-controls">
            <div className="rank-picker-controls" role="group" aria-label={t("play.rulesGroup")}>
              <Btn icon={Minus} small label={t("play.prevRules")} disabled={ri <= 0}
                onClick={() => setTable({ rules: RULESET_IDS[ri - 1] })} />
              <span className="handicap-num" aria-live="polite"
                title={t(`ruleset.${set.id}.blurb`, null, set.blurb)}>{t(`ruleset.${set.id}.name`, null, set.name)}</span>
              <Btn icon={Plus} small label={t("play.nextRules")} disabled={ri >= RULESET_IDS.length - 1}
                onClick={() => setTable({ rules: RULESET_IDS[ri + 1] })} />
            </div>
            <div className="seg" role="radiogroup" aria-label={t("play.sizeGroup")}>
              {SIZES.map(n => (
                <button key={n} type="button" role="radio" aria-checked={table.size === n}
                  className={`seg-btn ${table.size === n ? "active" : ""}`} onClick={() => setTable({ size: n })}>
                  {n}×{n}
                </button>
              ))}
            </div>
            <div className="rank-picker-controls" role="group" aria-label={t("play.komiGroup")}>
              <Btn icon={Minus} small label={t("play.lessKomi")} disabled={ki <= 0}
                onClick={() => setTable({ komi: KOMI_STEPS[ki - 1] })} />
              <span className="handicap-num" aria-live="polite">{t("play.komiNum", { komi })}</span>
              <Btn icon={Plus} small label={t("play.moreKomi")} disabled={ki >= KOMI_STEPS.length - 1}
                onClick={() => setTable({ komi: KOMI_STEPS[ki + 1] })} />
              {table.komi !== null && komi !== owed
                && <Btn icon={Home} small onClick={() => setTable({ komi: null })}>{t("play.komiDefault")}</Btn>}
            </div>
            <div className="rank-picker-controls" role="group" aria-label={t("play.handicapGroup")}>
              <Btn icon={Minus} small label={t("play.fewerStones")} disabled={hi <= 0} onClick={() => setTable({ handicap: HANDICAPS[hi - 1] })} />
              <span className="handicap-num" aria-live="polite">{table.handicap ? t("play.stones", { count: table.handicap }) : t("play.noHandicap")}</span>
              <Btn icon={Plus} small label={t("play.moreStones")} disabled={hi >= HANDICAPS.length - 1} onClick={() => setTable({ handicap: HANDICAPS[hi + 1] })} />
            </div>
            <div className="seg" role="radiogroup" aria-label={t("play.clockGroup")}>
              {CLOCK_PRESETS.map(p => (
                <button key={p.id} type="button" role="radio" aria-checked={table.clock === p.id}
                  className={`seg-btn ${table.clock === p.id ? "active" : ""}`} onClick={() => setTable({ clock: p.id })}>
                  {presetShort(p, t)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid3">
          {personasFor(rank).map(localized => localizePersona(localized, t)).map(p => (
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
              <span className="persona-cta"><Play size={13} /> {t(rankInRange(rank, p.range) ? "play.challengeHome" : "play.challenge", { rank })}</span>
            </button>
          ))}
        </div>
        <button className="neu-card persona-card local-card" onClick={() => sit({ kind: "local" })}>
          <div className="persona-top">
            <div className="avatar duo"><Users size={22} strokeWidth={2} /></div>
            <div>
              <h3>{t("play.passPlay")}</h3>
              <p className="persona-tag">{t("play.passTag")}</p>
            </div>
          </div>
          <p className="persona-bio">{t("play.passBio")}</p>
          <span className="persona-cta"><Handshake size={13} /> {t("play.sitDown")}</span>
        </button>
        <PairCard profile={profile} onPlay={sit} />
        <MastersRow onSit={(mode) => setSession({ mode: { ...mode, clock } })} />
      </div>
    );
  }
  if (session.mode.kind === "pair") {
    return <PairGame mode={session.mode} initial={session.record} onExit={() => setSession(null)} profile={profile} notify={notify} />;
  }
  if (session.mode.kind === "online") {
    return <OnlineGame gameId={session.mode.gameId} onExit={() => setSession(null)} profile={profile} notify={notify} go={go} />;
  }
  return (
    <Game mode={session.mode} initial={session.record} onExit={() => setSession(null)}
      profile={profile} setProfile={setProfile} notify={notify} />
  );
}
