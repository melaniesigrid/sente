import { useState, useMemo } from "react";
import { serverEnabled } from "../net/api.js";
import { loadAccount } from "../store/account.js";
import { DashboardCard } from "./DashboardCard.jsx";
import { Swords, GraduationCap, Target, Trophy, Play, Trash2, CalendarCheck, BrainCircuit, Check, Circle } from "lucide-react";
import { MiniSelfPlay } from "../components/MiniSelfPlay.jsx";
import { Card, Btn, RankBadge, Statement } from "../components/ui.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { LESSONS } from "../content/lessons.js";
import { lessonById } from "../content/library.js";
import { PROBLEMS, localizeProblem, localizeSet, currentSet, setProgress } from "../content/problems.js";
import { preciseRankOf } from "../content/rank.js";
import { PERSONAS } from "../content/personas.js";
import { duelMode } from "../content/duel.js";
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
import { useT } from "../components/langStore.js";

/* ----------------------- HOME ----------------------- */
export function Home({ profile, go, onResume }) {
  const t = useT();
  const account = useMemo(() => (serverEnabled() ? loadAccount() : null), []);
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
  const authoredKata = dailyProblem(PROBLEMS, today);
  const kata = authoredKata && localizeProblem(authoredKata, t);
  const kataDone = profile.kataDate === today;
  const recall = recallSummary(LIBRARY, profile.recall, today);
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
        <div className="hero-board" aria-hidden="true">
          <MiniSelfPlay sizePx={300} />
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
