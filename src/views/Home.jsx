import { useEffect, useMemo, useRef, useState } from "react";
import { serverEnabled } from "../net/api.js";
import { ACCOUNT_KEY, loadAccount } from "../store/account.js";
import { DashboardCard } from "./DashboardCard.jsx";
import { Swords, GraduationCap, Target, Trophy, Play, Trash2, CalendarCheck, BrainCircuit, Check, Circle, MessageCircle, Send, Bot } from "lucide-react";
import { MiniSelfPlay } from "../components/MiniSelfPlay.jsx";
import { Card, Btn, RankBadge, Statement, Avatar } from "../components/ui.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { LESSONS } from "../content/lessons.js";
import { lessonById } from "../content/library.js";
import { PROBLEMS, localizeProblem, localizeSet, currentSet, setProgress } from "../content/problems.js";
import { preciseRankOf } from "../content/rank.js";
import { PERSONAS } from "../content/personas.js";
import { duelMode } from "../content/duel.js";
import { demoPair } from "../content/demo.js";
import { clearGame } from "../store/gameStore.js";
import { useMokuFacts } from "../components/mokuStore.js";
import { DuelCard } from "../components/DuelCard.jsx";
import { ChainLine } from "../components/Chain.jsx";
import { dayKey, dailyProblem } from "../content/kata.js";
import { recallSummary } from "../content/recall.js";
import { LIBRARY } from "../content/library.js";
import { OpenSgf } from "../components/OpenSgf.jsx";
import { Review } from "./Review.jsx";
import { loadSession } from "./session.js";
import { KE_JIE, SENSEI_ID, letterFor, greetingFor, jealousLine, replyTo, bondQuestion, bondYes, bondNo, BOND_AFTER } from "../content/sensei.js";
import { focusFor, trend } from "../engine/index.js";
import { loadTelemetry } from "../store/telemetry.js";
import { personaById } from "../content/personas.js";
import { useTrainerAccess } from "./useTrainer.js";
import {
  loadBox, saveBox, postLetter, markRead, unread, shouldWriteAbout, daysBetween, say, tell, playedWithoutHim, shouldAsk,
} from "../store/sensei.js";
import { useT } from "../components/langStore.js";

/* ----------------------- HOME ----------------------- */
export function Home({ profile, go, onResume }) {
  const t = useT();
  /* Read on every render, so signing in elsewhere on the page shows here on the
     next one; the listeners below only ask for that next render when the tab
     comes back or another tab wrote the account. */
  const account = serverEnabled() ? loadAccount() : null;
  const [, bump] = useState(0);
  useEffect(() => {
    if (!serverEnabled()) return undefined;
    const refresh = () => bump((n) => n + 1);
    const onStorage = (e) => { if (!e.key || e.key === ACCOUNT_KEY) refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  // A game opened from a file. Review takes the whole view while it is open, the
  // same way it does from a finished game.
  const [opened, setOpened] = useState(null);
  // Count only ids that still exist in the library, so a renamed lesson does not inflate progress.
  const lessonsDone = profile.lessonsDone.filter(id => lessonById(id)).length;
  const lessonPct = Math.round((lessonsDone / LESSONS.length) * 100);
  /* The set in front of the reader, and how far through it they are. The whole
     pile is still there under the tile: opening it lands on the set index. */
  const openSet = localizeSet(currentSet(profile.problemsDone), t);
  const setSoFar = setProgress(openSet.id, profile.problemsDone);
  const setPct = setSoFar.total ? Math.round((setSoFar.solved / setSoFar.total) * 100) : 0;
  const games = profile.wins + profile.losses;
  const today = dayKey();
  const [saved, setSaved] = useState(() => loadSession({ today, profile, t }));
  const discard = () => { clearGame(); setSaved(null); };
  const duel = duelMode(PERSONAS, today);
  // Who is playing the demo board, and which engine is answering for them.
  // The pair is today's; the source is whatever MiniSelfPlay settled on when
  // it started, which depends on whether the network is already in memory.
  const pair = useMemo(() => demoPair(PERSONAS, today), [today]);
  const [demoSource, setDemoSource] = useState("heuristic");
  const authoredKata = dailyProblem(PROBLEMS, today);
  const kata = authoredKata && localizeProblem(authoredKata, t);
  const kataDone = profile.kataDate === today;
  const recall = recallSummary(LIBRARY, profile.recall, today);
  const trainerOn = useTrainerAccess(profile, account);
  /* The trainer's thread. Opening the dashboard is when he speaks: a greeting once
     a day, a line about an absence once a day after three days, a line when the
     device's own log shows a game with somebody else, and his question once there
     are enough games behind it. Everything lands in the thread and the thread lands
     in localStorage, on this device only. */
  const [box, setBox] = useState(() => (trainerOn ? loadBox() : null));
  useEffect(() => {
    if (!trainerOn) { setBox(null); return; }
    let b = loadBox();
    let changed = false;
    const post = (fn) => { b = fn(b); changed = true; };
    const bonded = b.bond === "yes";
    if (b.greeted !== today) {
      post((x) => ({ ...say(x, greetingFor(new Date().getHours(), games + x.thread.length, profile.name), today), greeted: today }));
    }
    const log = loadTelemetry();
    const others = playedWithoutHim(log, b, SENSEI_ID);
    if (others.length) {
      const other = personaById(others[others.length - 1].bot);
      post((x) => say(x, jealousLine(other ? other.name : "somebody else", x.thread.length), today));
    }
    if (log.length !== b.seen) post((x) => ({ ...x, seen: log.length }));
    if (shouldWriteAbout(b, today)) {
      const away = daysBetween(b.lastGame, today);
      post((x) => postLetter(x, letterFor({ daysAway: away, name: profile.name, bonded }, away), today));
    }
    if (shouldAsk(b, BOND_AFTER)) post((x) => ({ ...say(x, bondQuestion(profile.name), today), bond: "asked" }));
    if (changed) saveBox(b);
    setBox(b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerOn, today]);
  const [draft, setDraft] = useState("");
  const threadEnd = useRef(null);
  useEffect(() => { const el = threadEnd.current; if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" }); }, [box]);
  const putAway = () => { if (!box) return; const b = markRead(box); saveBox(b); setBox(b); };
  const write = () => {
    const line = draft.trim();
    if (!line || !box) return;
    const focus = focusFor(box.games);
    const reply = replyTo(line, {
      name: profile.name, focus, trend: trend(box.games), profile, games: box.games.length,
      daysAway: daysBetween(box.lastGame, today), bonded: box.bond === "yes", seed: box.thread.length,
      taught: box.taught,
    });
    let b = tell(box, line, today);
    for (const r of reply) b = say(b, r, today, { read: true });
    saveBox(b); setBox(b); setDraft("");
  };
  const answer = (yes) => {
    if (!box) return;
    const b = { ...say(box, yes ? bondYes() : bondNo(), today, { read: true }), bond: yes ? "yes" : "no" };
    saveBox(b); setBox(b);
  };
  const waiting = box ? unread(box).length : 0;
  useMokuFacts({ view: "home", seed: games });
  const greeting = t(games ? "home.greetingBack" : "home.greetingNew");
  // One line naming the next honest thing to do, so the dashboard opens on a
  // suggestion rather than on a wall of numbers.
  const nudge = !games
    ? t("home.nudgeNone")
    : lessonsDone < LESSONS.length
      ? t("home.nudgeLessons", { count: LESSONS.length - lessonsDone })
      : t("home.nudgeDone");
  if (opened) {
    return <Review record={opened} profile={profile} onExit={() => setOpened(null)} />;
  }

  return (
    <div className="stack arrives">
      <Card className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{greeting}</p>
          <h1 className="display">{profile.name}.</h1>
          <div className="row dash-rank">
            <RankBadge rating={profile.rating} rd={profile.rd} size="lg" precise />
            <span className="fine">{games ? t("home.wonOf", { wins: profile.wins, games }) : t("home.noGames")}</span>
          </div>
          <ChainLine profile={profile} today={today} />
          <p className="lede">{nudge}</p>
          <div className="row">
            <Btn icon={Swords} primary onClick={() => go("play")}>{t("home.findGame")}</Btn>
            <Btn icon={GraduationCap} onClick={() => go("learn")}>{t("home.keepLearning")}</Btn>
          </div>
        </div>
        <div className="hero-board">
          {/* The demo names what it is, and the name is not decided here: the
              board plays the house players through the network when the
              network is already loaded and the heuristic when it is not, and
              the line under it says which of those a visitor is watching. */}
          <div aria-hidden="true">
            <MiniSelfPlay sizePx={300} players={pair} onSource={setDemoSource} />
          </div>
          <p className="board-note">
            {demoSource === "kata" && pair
              ? t("home.boardNotePlayers", {
                black: pair.b.persona.name, blackRank: pair.b.rank,
                white: pair.w.persona.name, whiteRank: pair.w.rank,
              })
              : t("home.boardNote")}
          </p>
        </div>
      </Card>

      <Statement lines={statementFor("home", t)} figure="home">{plainFor("home", t)}</Statement>
      {account && <DashboardCard account={account} go={go} />}

      <Card className="passage-card"><Passage context="home" size="lg" /></Card>

      {saved && (
        <Card inset className="resume-card">
          <div className="resume-copy">
            <div className="stat-head"><Play size={16} /><span>{t("home.resume.head")}</span></div>
            <strong>{t("home.resume.vs", { name: saved.opponent })}</strong>
            <span className="fine">{t("home.resume.detail", {
              size: saved.record.size,
              moves: t("home.resume.moves", { count: saved.record.moves.length }),
              toPlay: t(saved.record.toPlay === "b" ? "home.resume.toPlayB" : "home.resume.toPlayW"),
            })}</span>
          </div>
          <div className="row">
            <Btn icon={Play} primary small onClick={() => onResume({ mode: saved.mode, record: saved.record })}>{t("home.resume.resume")}</Btn>
            <Btn icon={Trash2} small onClick={discard}>{t("home.resume.discard")}</Btn>
          </div>
        </Card>
      )}

      {box && (
        <Card className="letter-card">
          <div className="chat-head">
            <Avatar name={KE_JIE.name} tint={KE_JIE.tint} size={28} bot />
            <span className="letter-name">{KE_JIE.name} <span className="fine">&middot; {KE_JIE.nickname}</span></span>
            <span className="fine letter-you">{KE_JIE.yourHandle}</span>
            {waiting > 0 && <span className="letter-unread">{waiting}</span>}
            <span className="bot-chip"><Bot size={11} /> {t("game.chat.trainer")}</span>
          </div>
          <div className="chat-log letter-log" aria-live="polite" onClick={putAway}>
            {box.thread.slice(-40).map((m, i) => (
              <div key={i} className={`bubble ${m.who === "you" ? "mine" : ""}${m.read ? "" : " fresh"}`}>{m.text}</div>
            ))}
            {box.bond === "asked" && (
              <div className="row">
                <Btn small primary onClick={() => answer(true)}>{t("home.trainer.yes")}</Btn>
                <Btn small onClick={() => answer(false)}>{t("home.trainer.notNow")}</Btn>
              </div>
            )}
            <div ref={threadEnd} />
          </div>
          <div className="chat-row">
            <input className="chat-input" value={draft} placeholder={t("home.trainer.placeholder")}
              onChange={(e) => setDraft(e.target.value)} onFocus={putAway}
              onKeyDown={(e) => e.key === "Enter" && write()} aria-label={t("home.trainer.placeholder")} />
            <button className="chat-send" onClick={write} aria-label={t("home.trainer.send")}><Send size={15} /></button>
          </div>
          <div className="row">
            <Btn icon={Play} primary small onClick={() => { putAway(); go("play", { withBot: SENSEI_ID }); }}>{t("home.trainer.play")}</Btn>
            <Btn icon={MessageCircle} small onClick={putAway} disabled={waiting === 0}>{t("home.trainer.away")}</Btn>
          </div>
        </Card>
      )}

      {kata && (
        <button className={`neu-card tile kata-card ${kataDone ? "done" : ""}`} onClick={() => go("tsumego", { problemId: kata.id })}>
          <div className="kata-copy">
            <div className="stat-head"><CalendarCheck size={16} /><span>{t("home.kata.head")}</span></div>
            <strong className="kata-title">{kata.title}</strong>
            <span className="fine">{t("home.kata.meta", { rank: kata.rank, theme: kata.theme })}</span>
          </div>
          {/* The card's own state, where the streak used to be. The flame moved
              to the hero when it stopped being about this one button, and the
              card still needs to say whether today's problem is behind you. */}
          <div className="kata-state">
            {kataDone ? <Check size={15} /> : <Circle size={15} />}
            <span>{kataDone ? t("home.kata.solved") : t("home.kata.open")}</span>
          </div>
        </button>
      )}

      {/* The recall queue, and only once there is one: a dashboard that offers
          five cards to somebody who has finished no lessons is promising work
          that does not exist. */}
      {recall.total > 0 && (
        <button className={`neu-card tile kata-card ${recall.due === 0 ? "done" : ""}`} onClick={() => go("recall")}>
          <div className="kata-copy">
            <div className="stat-head"><BrainCircuit size={16} /><span>{t("home.recall.head")}</span></div>
            <strong className="kata-title">
              {recall.due === 0 ? t("home.recall.nothing") : t("home.recall.review", { count: recall.session })}
            </strong>
            <span className="fine">
              {recall.due === 0
                ? t("home.recall.waiting", { count: recall.total })
                  + (recall.nextIn === null ? "" : " · " + t(recall.nextIn <= 1 ? "home.recall.nextTomorrow" : "home.recall.nextIn", { days: recall.nextIn }))
                : t("home.recall.due", { due: recall.due, total: recall.total })}
            </span>
          </div>
          <div className="kata-streak">
            <span className="stat-num">{recall.known}<em>{t("home.recall.known")}</em></span>
          </div>
        </button>
      )}

      <DuelCard profile={profile} today={today} mode={duel}
        saved={saved && saved.mode.kind === "duel" ? saved : null} onPlay={onResume} />

      <div className="grid3">
        <button className="neu-card tile" onClick={() => go("learn")}>
          <div className="stat-head"><GraduationCap size={17} /><span>{t("home.tiles.lessons")}</span></div>
          <div className="stat-num">{lessonsDone}<em>/{LESSONS.length}</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${lessonPct}%` }} /></div>
        </button>
        {/* The tsumego tile counts the set somebody is in the middle of, not
            the whole pile. Nineteen boards in four sets is a place to be, and
            a flat count out of nineteen is not one: it cannot say what is next
            or whether the thing in front of you is nearly done. */}
        <button className="neu-card tile" onClick={() => go("tsumego")}>
          <div className="stat-head"><Target size={17} /><span>{openSet.name}</span></div>
          <div className="stat-num">{setSoFar.solved}<em>/{setSoFar.total}</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${setPct}%` }} /></div>
        </button>
        <button className="neu-card tile" onClick={() => go("profile")}>
          <div className="stat-head"><Trophy size={17} /><span>{t("home.tiles.rank")}</span></div>
          <div className="stat-num">{preciseRankOf(profile.rating)}<em>{t("home.tiles.won", { wins: profile.wins, games })}</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${games ? (profile.wins / games) * 100 : 0}%` }} /></div>
        </button>
      </div>

      <OpenSgf onOpen={(record) => setOpened(record)} />
    </div>
  );
}
