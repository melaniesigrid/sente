import { useState } from "react";
import { Swords, GraduationCap, Target, Trophy, Play, Trash2, CalendarCheck, Flame, BrainCircuit } from "lucide-react";
import { MiniSelfPlay } from "../components/MiniSelfPlay.jsx";
import { Card, Btn, RankBadge, Statement } from "../components/ui.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { LESSONS } from "../content/lessons.js";
import { lessonById } from "../content/library.js";
import { PROBLEMS } from "../content/problems.js";
import { preciseRankOf } from "../content/rank.js";
import { PERSONAS } from "../content/personas.js";
import { duelMode } from "../content/duel.js";
import { clearGame } from "../store/gameStore.js";
import { useMokuFacts } from "../components/mokuStore.js";
import { DuelCard } from "../components/DuelCard.jsx";
import { dayKey, dailyProblem, liveStreak } from "../content/kata.js";
import { recallSummary } from "../content/recall.js";
import { LIBRARY } from "../content/library.js";
import { OpenSgf } from "../components/OpenSgf.jsx";
import { Review } from "./Review.jsx";
import { loadSession } from "./session.js";

/* ----------------------- HOME ----------------------- */
export function Home({ profile, go, onResume }) {
  // A game opened from a file. Review takes the whole view while it is open, the
  // same way it does from a finished game.
  const [opened, setOpened] = useState(null);
  // Count only ids that still exist in the library, so a renamed lesson does not inflate progress.
  const lessonsDone = profile.lessonsDone.filter(id => lessonById(id)).length;
  const lessonPct = Math.round((lessonsDone / LESSONS.length) * 100);
  const probPct = Math.round((profile.problemsDone.length / PROBLEMS.length) * 100);
  const games = profile.wins + profile.losses;
  const today = dayKey();
  const [saved, setSaved] = useState(() => loadSession({ today, profile }));
  const discard = () => { clearGame(); setSaved(null); };
  const duel = duelMode(PERSONAS, today);
  const kata = dailyProblem(PROBLEMS, today);
  const kataDone = profile.kataDate === today;
  const streak = liveStreak(profile, today);
  const recall = recallSummary(LIBRARY, profile.recall, today);
  useMokuFacts({ view: "home", seed: games });
  const greeting = games ? "Welcome back" : "Welcome to the board";
  // One line naming the next honest thing to do, so the dashboard opens on a
  // suggestion rather than on a wall of numbers.
  const nudge = !games
    ? "Nothing played yet. A house player is waiting whenever you are \u2014 nine lines is plenty for a first game."
    : lessonsDone < LESSONS.length
      ? `${LESSONS.length - lessonsDone} ${LESSONS.length - lessonsDone === 1 ? "lesson" : "lessons"} still ahead of you, and the ladder is open all day.`
      : "Every lesson read. What is left is games \u2014 and the reading that comes with them.";
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
            <span className="fine">{games ? `${profile.wins} of ${games} won` : "no games played yet"}</span>
          </div>
          <p className="lede">{nudge}</p>
          <div className="row">
            <Btn icon={Swords} primary onClick={() => go("play")}>Find a game</Btn>
            <Btn icon={GraduationCap} onClick={() => go("learn")}>Keep learning</Btn>
          </div>
        </div>
        <div className="hero-board" aria-hidden="true">
          <MiniSelfPlay sizePx={300} />
        </div>
      </Card>

      <Statement lines={statementFor("home")} figure="home">{plainFor("home")}</Statement>
      <Card className="passage-card"><Passage context="home" size="lg" /></Card>

      {saved && (
        <Card inset className="resume-card">
          <div className="resume-copy">
            <div className="stat-head"><Play size={16} /><span>Resume last game</span></div>
            <strong>vs {saved.opponent}</strong>
            <span className="fine">{saved.record.size}×{saved.record.size} · {saved.record.moves.length} {saved.record.moves.length === 1 ? "move" : "moves"} played · {saved.record.toPlay === "b" ? "Black" : "White"} to move</span>
          </div>
          <div className="row">
            <Btn icon={Play} primary small onClick={() => onResume({ mode: saved.mode, record: saved.record })}>Resume</Btn>
            <Btn icon={Trash2} small onClick={discard}>Discard</Btn>
          </div>
        </Card>
      )}

      {kata && (
        <button className={`neu-card tile kata-card ${kataDone ? "done" : ""}`} onClick={() => go("tsumego", { problemId: kata.id })}>
          <div className="kata-copy">
            <div className="stat-head"><CalendarCheck size={16} /><span>Kata of the day</span></div>
            <strong className="kata-title">{kata.title}</strong>
            <span className="fine">{kata.rank} · {kata.theme} · {kataDone ? "attended today" : "one problem, every day"}</span>
          </div>
          <div className="kata-streak">
            <Flame size={16} />
            <span className="stat-num">{streak}<em>{streak === 1 ? "day" : "days"}</em></span>
          </div>
        </button>
      )}

      {/* The recall queue, and only once there is one: a dashboard that offers
          five cards to somebody who has finished no lessons is promising work
          that does not exist. */}
      {recall.total > 0 && (
        <button className={`neu-card tile kata-card ${recall.due === 0 ? "done" : ""}`} onClick={() => go("recall")}>
          <div className="kata-copy">
            <div className="stat-head"><BrainCircuit size={16} /><span>Recall</span></div>
            <strong className="kata-title">
              {recall.due === 0 ? "Nothing due today" : `Review ${recall.session}`}
            </strong>
            <span className="fine">
              {recall.due === 0
                ? `${recall.total} ${recall.total === 1 ? "card" : "cards"} waiting their turn${recall.nextIn === null ? "" : ` · next ${recall.nextIn <= 1 ? "tomorrow" : `in ${recall.nextIn} days`}`}`
                : `${recall.due} of ${recall.total} due · questions you have answered before`}
            </span>
          </div>
          <div className="kata-streak">
            <span className="stat-num">{recall.known}<em>known</em></span>
          </div>
        </button>
      )}

      <DuelCard profile={profile} today={today} mode={duel}
        saved={saved && saved.mode.kind === "duel" ? saved : null} onPlay={onResume} />

      <div className="grid3">
        <button className="neu-card tile" onClick={() => go("learn")}>
          <div className="stat-head"><GraduationCap size={17} /><span>Lessons</span></div>
          <div className="stat-num">{lessonsDone}<em>/{LESSONS.length}</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${lessonPct}%` }} /></div>
        </button>
        <button className="neu-card tile" onClick={() => go("tsumego")}>
          <div className="stat-head"><Target size={17} /><span>Tsumego</span></div>
          <div className="stat-num">{profile.problemsDone.length}<em>/{PROBLEMS.length}</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${probPct}%` }} /></div>
        </button>
        <button className="neu-card tile" onClick={() => go("profile")}>
          <div className="stat-head"><Trophy size={17} /><span>Your rank</span></div>
          <div className="stat-num">{preciseRankOf(profile.rating)}<em>· {profile.wins}/{games} won</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${games ? (profile.wins / games) * 100 : 0}%` }} /></div>
        </button>
      </div>

      <OpenSgf onOpen={(record) => setOpened(record)} />
    </div>
  );
}
