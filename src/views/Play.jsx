import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play, Users, Handshake, Minus, Plus, Home, TrendingUp, TrendingDown, X,
  GraduationCap, Bot, UserRound, CircleDot, UsersRound, Radio,
} from "lucide-react";
import { Avatar, RankBadge, Btn, Card } from "../components/ui.jsx";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { DuelCard } from "../components/DuelCard.jsx";
import { personasFor, PERSONAS, personaById, localizePersona } from "../content/personas.js";
import { KE_JIE, SENSEI_ID, trainerRank, MODES } from "../content/sensei.js";
import { rankOf, ratingOfRank, stepRank, rankInRange, rankWithHandicap, RANK_LADDER } from "../content/rank.js";
import { SIZES, defaultKomi, RULESET_IDS, rulesetOf, modeRules, DEFAULT_MODE } from "../engine/index.js";
import { loadLobby, saveLobby, HANDICAPS, KOMI_STEPS } from "../store/lobby.js";
import { ACCOUNT_KEY, loadAccount } from "../store/account.js";
import { useTrainerAccess } from "./useTrainer.js";
import { duelMode } from "../content/duel.js";
import { dayKey } from "../content/kata.js";
import { suggestLevel, suggestionText } from "../content/level.js";
import { loadTelemetry } from "../store/telemetry.js";
import { CLOCK_PRESETS, presetById, presetText, presetShort } from "../content/clockFace.js";
import { MastersRow } from "../components/MastersRow.jsx";
import { PairCard } from "../components/PairCard.jsx";
import { MokuCard } from "../components/Moku.jsx";
import { loadSession } from "./session.js";
import { Game } from "./Game.jsx";
import { OnlineCard } from "./OnlineLobby.jsx";
import { OnlineGame } from "./OnlineGame.jsx";
import { PairGame } from "./PairGame.jsx";
import { useT } from "../components/langStore.js";
import { serverEnabled } from "../net/api.js";

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

function routeSession({ profile, trainerOn, resume, openGame, withBot, t }) {
  if (resume) return resume;
  if (openGame) return { mode: { kind: "online", gameId: openGame } };
  /* The private trainer is asked for by his id too, from a letter on the dashboard.
     Only when this profile or account has unlocked him; otherwise the request falls to the lobby. */
  if (withBot === SENSEI_ID) {
    if (!trainerOn) return null;
    const lobby = loadLobby();
    // Asked for by name from a letter: the ordinary lesson, which is the mode
    // he would pick himself. The other five are chosen on his card.
    return { mode: { kind: "bot", persona: KE_JIE, rank: trainerRank(lobby.rank ?? rankOf(profile.rating), modeRules(DEFAULT_MODE).rankStep), senseiMode: DEFAULT_MODE } };
  }
  const persona = withBot ? personaById(withBot) : null;
  if (!persona) return null;
  const lobby = loadLobby();
  return { mode: { kind: "bot", persona: localizePersona(persona, t), rank: lobby.rank ?? rankOf(profile.rating) } };
}

function ChoiceCard({ icon: Icon, title, note, meta = null, onClick, className = "" }) {
  return (
    <button className={`neu-card play-choice ${className}`.trim()} onClick={onClick}>
      <span className="play-choice-icon" aria-hidden="true"><Icon size={26} strokeWidth={2.1} /></span>
      <div className="play-choice-copy">
        <h3>{title}</h3>
        <p>{note}</p>
      </div>
      {meta ? <span className="play-choice-meta">{meta}</span> : null}
    </button>
  );
}

function StepCard({ icon: Icon, title, note, children, actions = null, className = "" }) {
  return (
    <Card inset className={`play-step ${className}`.trim()}>
      <div className="play-step-head">
        <span className="play-step-icon" aria-hidden="true"><Icon size={20} strokeWidth={2.2} /></span>
        <div className="play-step-copy">
          <strong>{title}</strong>
          <p className="fine">{note}</p>
        </div>
        {actions ? <div className="play-step-actions">{actions}</div> : null}
      </div>
      {children}
    </Card>
  );
}

export function PlayView({ profile, setProfile, notify, resume, openGame = null, withBot = null, go = null }) {
  const t = useT();
  const [account, setAccount] = useState(() => (serverEnabled() ? loadAccount() : null));
  useEffect(() => {
    if (!serverEnabled()) return undefined;
    const refresh = () => setAccount(loadAccount());
    const onStorage = (e) => { if (!e.key || e.key === ACCOUNT_KEY) refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const trainerOn = useTrainerAccess(profile, account);
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
  const [session, setSession] = useState(() => routeSession({ profile, trainerOn, resume, openGame, withBot, t }) || linkedGame());
  const lastRouteKey = useRef(routeKey);
  useEffect(() => {
    if (routeKey === lastRouteKey.current && !(trainerOn && withBot === SENSEI_ID)) return;
    lastRouteKey.current = routeKey;
    setSession(routeSession({ profile, trainerOn, resume, openGame, withBot, t }) || linkedGame());
  }, [routeKey, profile, trainerOn, resume, openGame, withBot, t]);
  const restoreLobbyRoute = () => {
    if (openGame) {
      setOpponent("human");
      setHumanMode("online");
      setAiMode(null);
      return true;
    }
    return false;
  };
  const leaveSession = () => {
    if (withBot) {
      setSession(routeSession({ profile, trainerOn, resume, openGame, withBot, t }));
      return;
    }
    setSession(null);
    if (restoreLobbyRoute()) return;
    setOpponent(null);
    setHumanMode(null);
    setAiMode(null);
  };
  // The level the next game is played at. Starts at the player's own rank; every house
  // player adapts to it, so nobody has to "graduate" to an opponent.
  const myRank = rankOf(profile.rating);
  const [table, setTableState] = useState(loadLobby);
  const setTable = (patch) => setTableState((saved) => {
    const next = { ...saved, ...patch };
    saveLobby(next);
    return next;
  });
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
  const [opponent, setOpponent] = useState(null);
  const [humanMode, setHumanMode] = useState(null);
  const [aiMode, setAiMode] = useState(null);
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
    const choice = opponent === "human" ? humanMode : aiMode;
    const humanGame = opponent === "human";
    const showLevel = choice === "house" || choice === "kejie";
    const showTable = !!choice && choice !== "duel";
    const showBoardOnly = choice === "team";
    /* The table decides the handicap, except where the seat itself is the lesson:
       a teaching game is four stones in front of you by definition, so a mode that
       names its own handicap keeps it, and the komi owed follows the stones that
       are actually on the board rather than the ones the picker last showed. */
    const sit = (mode) => {
      const stones = mode.handicap ?? table.handicap;
      setSession({
        mode: {
          ...mode, size: table.size, handicap: stones, rules: table.rules, clock,
          komi: table.komi ?? defaultKomi(stones, table.size, table.rules),
        },
      });
    };
    const chooseOpponent = (next) => {
      setOpponent(next);
      setHumanMode(null);
      setAiMode(null);
    };
    const tableNote = showBoardOnly
      ? t("play.stepTableNoteTeam", {}, "Choose the board before you open a team table.")
      : choice === "online"
        ? t("play.stepTableNoteOnline", {}, "Choose the board and rules before you look for an online opponent.")
        : choice === "local"
          ? t("play.stepTableNoteLocal", {}, "Set the board first, then hand the device across the table.")
          : choice === "kejie"
            ? t("play.stepTableNoteKeJie", {}, "Set the board and level, then sit down with Ke Jie.")
            : t("play.stepTableNoteHouse", {}, "Set the board and level, then choose the house player you want.");
    return (
      <div className="stack arrives">
        <ScreenHeader
          label={t("play.label")}
          title={<>{t("play.titleBefore")}<em>{t("play.titleEm")}</em>{t("play.titleAfter")}</>}
          lede={t("play.lede")} />
        <MokuCard
          title={t("profile.table.moku")}
          note={t("play.mokuNote", {}, "One decision at a time: choose who you want to play, then how, then the board.")} />
        {!opponent && (
          <StepCard icon={Play}
            title={t("play.stepOpponentHead", {}, "Who you want to play")}
            note={t("play.stepOpponentNote", {}, "Start with one choice. The rest of the table waits until you need it.")}>
            <div className="play-choice-grid">
              <ChoiceCard icon={UserRound} title={t("play.opponentHuman", {}, "Human")}
                note={t("play.choiceHumanNote", {}, "Play another person online or hand the device across the table.")}
                onClick={() => chooseOpponent("human")} />
              <ChoiceCard icon={Bot} title={t("play.opponentAi", {}, "AI")}
                note={t("play.choiceAiNote", {}, "Choose a house player or open today’s fixed duel.")}
                onClick={() => chooseOpponent("ai")} />
              {trainerOn && (
                <ChoiceCard icon={GraduationCap} title={KE_JIE.name}
                  note={t("play.choiceKeJieNote", {}, "A direct line to Ke Jie on this device.")}
                  meta={t("play.trainer.note")}
                  className="play-choice-special"
                  onClick={() => { setOpponent("ai"); setHumanMode(null); setAiMode("kejie"); }} />
              )}
            </div>
          </StepCard>
        )}
        {opponent === "human" && !humanMode && (
          <StepCard icon={UserRound}
            title={t("play.stepHumanHead", {}, "How you want to play")}
            note={t("play.stepHumanNote", {}, "Choose the shape of the game. The board comes after that.")}
            actions={<Btn icon={X} small onClick={() => chooseOpponent(null)}>{t("play.changeWho", {}, "Change who")}</Btn>}>
            <div className="play-choice-grid">
              <ChoiceCard icon={Radio} title={t("play.onlineTitle", {}, "Online match")}
                note={t("play.onlineNote", {}, "Find another person on the server and play a rated game.")}
                meta={t("play.onlineMeta", {}, "rated online")}
                onClick={() => setHumanMode("online")} />
              <ChoiceCard icon={Handshake} title={t("play.passPlay")}
                note={t("play.passBio")}
                meta={t("play.passTag")}
                onClick={() => setHumanMode("local")} />
              <ChoiceCard icon={UsersRound} title={t("play.teamTitle", {}, "Team play")}
                note={t("play.teamNote", {}, "Open a rengo or pair-go table when more than two people are sitting down.")}
                meta={t("play.teamMeta", {}, "secondary")}
                onClick={() => setHumanMode("team")} />
            </div>
          </StepCard>
        )}
        {opponent === "ai" && !aiMode && (
          <StepCard icon={Bot}
            title={t("play.stepAiHead", {}, "How you want to play")}
            note={t("play.stepAiNote", {}, "Choose a house player, or take the one fixed duel the day offers.")}
            actions={<Btn icon={X} small onClick={() => chooseOpponent(null)}>{t("play.changeWho", {}, "Change who")}</Btn>}>
            <div className="play-choice-grid">
              <ChoiceCard icon={Bot} title={t("play.aiHouseTitle", {}, "House players")}
                note={t("play.aiHouseNote", {}, "Pick a style, then set the level and board before you sit down.")}
                meta={t("play.aiHouseMeta", {}, "adaptive strength")}
                onClick={() => setAiMode("house")} />
              <ChoiceCard icon={CircleDot} title={t("duel.head")}
                note={t("play.aiDuelNote", {}, "One host, one board, one attempt today.")}
                meta={t("play.aiDuelMeta", {}, "fixed daily board")}
                onClick={() => setAiMode("duel")} />
            </div>
          </StepCard>
        )}
        {showLevel && (
          <StepCard icon={Bot}
            title={t("play.levelGroup")}
            note={choice === "kejie"
              ? t("play.choiceKeJieNote", {}, "A direct line to Ke Jie on this device.")
              : t("play.aiHouseNote", {}, "Pick a style, then set the level and board before you sit down.")}
            actions={<div className="row">
              <Btn icon={X} small onClick={() => setAiMode(null)}>{t("play.changeHow", {}, "Change how")}</Btn>
              <Btn icon={X} small onClick={() => chooseOpponent(null)}>{t("play.changeWho", {}, "Change who")}</Btn>
            </div>}>
            <div className="rank-picker" role="group" aria-label={t("play.levelGroup")}>
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
              {suggestion && dismissed !== suggestion.to && (
                <div className="level-nudge">
                  {suggestion.won ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span className="fine">{suggestionText(suggestion, t)}</span>
                  <Btn small onClick={() => setRank(suggestion.to)}>{t("play.nudgePlay", { rank: suggestion.to })}</Btn>
                  <Btn icon={X} small label={t("play.keepLevel")} onClick={() => setDismissed(suggestion.to)} />
                </div>
              )}
            </div>
          </StepCard>
        )}
        {showTable && (
          <StepCard icon={Play}
            title={t("play.stepTableHead", {}, "Set the table")}
            note={tableNote}
            actions={<div className="row">
              <Btn icon={X} small onClick={() => (humanGame ? setHumanMode(null) : setAiMode(null))}>{t("play.changeHow", {}, "Change how")}</Btn>
              <Btn icon={X} small onClick={() => chooseOpponent(null)}>{t("play.changeWho", {}, "Change who")}</Btn>
            </div>}>
            <div className="rank-picker table-picker" role="group" aria-label={t("play.tableGroup")}>
              <div className="rank-picker-label">
                <strong>{t("play.table")}</strong>
                <span className="fine">
                  {showBoardOnly
                    ? t("game.caption.board", { size: table.size })
                    : <>
                      {t("play.tableKomi", {
                        rules: t(`ruleset.${set.id}.name`, null, set.name),
                        scoring: t(`ruleset.${set.id}.scoring`, null, set.scoring),
                        komi,
                      })}
                      {table.komi === null ? "" : t("play.tableOwn")}
                      {table.handicap ? t("play.tableHandicap", { rank: ratedAs }) : ""}
                      {clock ? t("play.tableClock", { clock: presetText(clock, t) }) : ""}
                    </>}
                </span>
              </div>
              <div className="rank-picker-controls">
                <div className="seg" role="radiogroup" aria-label={t("play.sizeGroup")}>
                  {SIZES.map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={table.size === n}
                      className={`seg-btn ${table.size === n ? "active" : ""}`} onClick={() => setTable({ size: n })}>
                      {n}×{n}
                    </button>
                  ))}
                </div>
                {!showBoardOnly && (
                  <>
                    <div className="rank-picker-controls" role="group" aria-label={t("play.rulesGroup")}>
                      <Btn icon={Minus} small label={t("play.prevRules")} disabled={ri <= 0}
                        onClick={() => setTable({ rules: RULESET_IDS[ri - 1] })} />
                      <span className="handicap-num" aria-live="polite"
                        title={t(`ruleset.${set.id}.blurb`, null, set.blurb)}>{t(`ruleset.${set.id}.name`, null, set.name)}</span>
                      <Btn icon={Plus} small label={t("play.nextRules")} disabled={ri >= RULESET_IDS.length - 1}
                        onClick={() => setTable({ rules: RULESET_IDS[ri + 1] })} />
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
                    {/* Not on the trainer's table: there the stones belong to the
                        lesson, and only one of his six puts any down. A picker
                        reading "no handicap" above a row that seats you with four
                        would be telling you the opposite of what happens. */}
                    {choice !== "kejie" && (
                      <div className="rank-picker-controls" role="group" aria-label={t("play.handicapGroup")}>
                        <Btn icon={Minus} small label={t("play.fewerStones")} disabled={hi <= 0} onClick={() => setTable({ handicap: HANDICAPS[hi - 1] })} />
                        <span className="handicap-num" aria-live="polite">{table.handicap ? t("play.stones", { count: table.handicap }) : t("play.noHandicap")}</span>
                        <Btn icon={Plus} small label={t("play.moreStones")} disabled={hi >= HANDICAPS.length - 1} onClick={() => setTable({ handicap: HANDICAPS[hi + 1] })} />
                      </div>
                    )}
                    <div className="seg" role="radiogroup" aria-label={t("play.clockGroup")}>
                      {CLOCK_PRESETS.map((p) => (
                        <button key={p.id} type="button" role="radio" aria-checked={table.clock === p.id}
                          className={`seg-btn ${table.clock === p.id ? "active" : ""}`} onClick={() => setTable({ clock: p.id })}>
                          {presetShort(p, t)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </StepCard>
        )}
        {humanMode === "online" && (
          <OnlineCard profile={profile} notify={notify} onPlay={setSession} go={go}
            size={table.size} setSize={(n) => setTable({ size: n })}
            mode="normal" showBoardPicker={false} onAccount={setAccount} />
        )}
        {humanMode === "team" && (
          <OnlineCard profile={profile} notify={notify} onPlay={setSession} go={go}
            size={table.size} setSize={(n) => setTable({ size: n })}
            mode="team" showBoardPicker={false} onAccount={setAccount} />
        )}
        {aiMode === "kejie" && (
          /* His card is not one button any more. He teaches six different ways
             and which one she wants is the actual decision at this step, so the
             card is the man and the list under it is the lesson. Each row sits
             down straight away: choosing how is choosing to play. */
          <div className="neu-card persona-card trainer-card">
            <div className="persona-top">
              <Avatar name={KE_JIE.name} tint={KE_JIE.tint} size={52} bot />
              <div>
                <h3>{KE_JIE.name}<span className="here-dot" title={t("home.trainer.here")} /></h3>
                <p className="persona-tag">{KE_JIE.tagline}</p>
              </div>
              <RankBadge rating={ratingOfRank(trainerRank(rank))} />
            </div>
            <p className="persona-bio">{KE_JIE.bio}</p>
            <div className="trainer-modes" role="group" aria-label={t("play.trainer.how")}>
              {MODES.map((m) => {
                const rules = modeRules(m.id);
                const at = trainerRank(rank, rules.rankStep);
                return (
                  <button key={m.id} className="neu-card trainer-mode"
                    onClick={() => sit({
                      kind: "bot", persona: KE_JIE, rank: at,
                      // Not `|| undefined`: a mode that declares no stones declares
                      // zero of them, and `0 ?? table.handicap` keeps the zero. Coercing
                      // it away let a handicap left on the lobby table follow her into
                      // an even game with him.
                      handicap: rules.handicap, senseiMode: m.id,
                    })}>
                    <div className="trainer-mode-top">
                      <strong>{m.name}</strong>
                      <span className="fine">
                        {at}
                        {rules.handicap ? ` · ${t("play.stones", { count: rules.handicap })}` : ""}
                      </span>
                    </div>
                    <span className="fine trainer-mode-promise">{m.promise}</span>
                  </button>
                );
              })}
            </div>
            <span className="persona-cta"><GraduationCap size={13} /> {t("play.trainer.cta", { name: KE_JIE.name })} <span className="fine">&middot; {t("play.trainer.note")}</span></span>
            <p className="fine trainer-about">{KE_JIE.about}</p>
          </div>
        )}
        {aiMode === "house" && (
          <>
            <div className="grid3">
              {personasFor(rank).map((localized) => localizePersona(localized, t)).map((p) => (
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
            <MastersRow onSit={(mode) => setSession({ mode: { ...mode, clock } })} />
          </>
        )}
        {humanMode === "local" && (
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
        )}
        {aiMode === "duel" && (
          <div className="row">
            <Btn icon={X} small onClick={() => setAiMode(null)}>{t("play.changeHow", {}, "Change how")}</Btn>
            <Btn icon={X} small onClick={() => chooseOpponent(null)}>{t("play.changeWho", {}, "Change who")}</Btn>
          </div>
        )}
        {aiMode === "duel" && (
          <DuelCard profile={profile} today={today} mode={duelMode(PERSONAS, today)}
            saved={saved && saved.mode.kind === "duel" ? saved : null} onPlay={setSession} />
        )}
        {humanMode === "team" && <PairCard profile={profile} onPlay={sit} />}
      </div>
    );
  }
  if (session.mode.kind === "pair") {
    return <PairGame mode={session.mode} initial={session.record} onExit={leaveSession} profile={profile} notify={notify} />;
  }
  if (session.mode.kind === "online") {
    return <OnlineGame gameId={session.mode.gameId} onExit={leaveSession} profile={profile} notify={notify} go={go} />;
  }
  return (
    <Game mode={session.mode} initial={session.record} onExit={leaveSession}
      profile={profile} setProfile={setProfile} notify={notify} />
  );
}
