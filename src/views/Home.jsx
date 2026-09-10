import { useState, useEffect, useRef } from "react";
import { Swords, GraduationCap, Target, Trophy, Route, Sparkles, Play, Trash2, CalendarCheck, Flame, BookOpen } from "lucide-react";
import { createBoard, tryPlay, aiChooseMove } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn } from "../components/ui.jsx";
import { LESSONS } from "../content/lessons.js";
import { lessonById } from "../content/library.js";
import { PROBLEMS } from "../content/problems.js";
import { preciseRankOf } from "../content/rank.js";
import { PERSONAS } from "../content/personas.js";
import { duelMode } from "../content/duel.js";
import { clearGame } from "../store/gameStore.js";
import { useMokuFacts } from "../components/mokuStore.js";
import { DuelCard } from "../components/DuelCard.jsx";
import { SayingCard } from "../components/Saying.jsx";
import { dayKey, dailyProblem, liveStreak } from "../content/kata.js";
import { sayingOfTheDay } from "../content/classic.js";
import { loadSession } from "./session.js";

/* ----------------------- HOME ----------------------- */
export function Home({ profile, go, onResume }) {
  // Count only ids that still exist in the library, so a renamed lesson does not inflate progress.
  const lessonsDone = profile.lessonsDone.filter(id => lessonById(id)).length;
  const lessonPct = Math.round((lessonsDone / LESSONS.length) * 100);
  const probPct = Math.round((profile.problemsDone.length / PROBLEMS.length) * 100);
  const games = profile.wins + profile.losses;
  const today = dayKey();
  const [saved, setSaved] = useState(() => loadSession(undefined, today));
  const discard = () => { clearGame(); setSaved(null); };
  const duel = duelMode(PERSONAS, today);
  const kata = dailyProblem(PROBLEMS, today);
  const kataDone = profile.kataDate === today;
  const streak = liveStreak(profile, today);
  useMokuFacts({ view: "home", seed: games });
  return (
    <div className="stack">
      <Card className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A home for the oldest game</p>
          <h1 className="display">Play go,<br />beautifully.</h1>
          <p className="lede">
            Learn the game from its first breath, sharpen your reading on classical
            shapes, and take your rank onto the ladder — one calm board at a time.
          </p>
          <div className="row">
            <Btn icon={Swords} primary onClick={() => go("play")}>Find a game</Btn>
            <Btn icon={GraduationCap} onClick={() => go("learn")}>Start learning</Btn>
          </div>
        </div>
        <div className="hero-board" aria-hidden="true">
          <MiniSelfPlay />
        </div>
      </Card>

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

      <SayingCard saying={sayingOfTheDay(today)}>
        <div className="row">
          <Btn icon={BookOpen} small onClick={() => go("learn")}>Read the thirteen chapters</Btn>
        </div>
      </SayingCard>

      <Card inset className="roadmap">
        <div className="stat-head"><Route size={17} /><span>Where this is going</span></div>
        <ul>
          <li><Sparkles size={14} /> Real-time matches over the network — same game loop, moves over a socket</li>
          <li><Sparkles size={14} /> Global Glicko-2 ladder with confidence-aware seeding</li>
          <li><Sparkles size={14} /> Friends, rooms, and spectating with live chat</li>
          <li><Sparkles size={14} /> 13×13 and 19×19 boards, joseki trees, engine review</li>
          <li><Sparkles size={14} /> Daily puzzle & spaced-repetition tsumego queue</li>
        </ul>
      </Card>
    </div>
  );
}

/* Self-playing mini board for the hero — the demo is the real engine. */
function MiniSelfPlay() {
  const [board, setBoard] = useState(() => createBoard(9));
  const stateRef = useRef({ board: createBoard(9), ko: null, turn: "b", n: 0, passes: 0 });
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      const s = stateRef.current;
      if (s.passes >= 2 || s.n > 60) {
        stateRef.current = { board: createBoard(9), ko: null, turn: "b", n: 0, passes: 0 };
        setBoard(stateRef.current.board);
        return;
      }
      const mv = aiChooseMove(s.board, s.turn, s.ko, s.n);
      if (!mv) { s.passes++; s.turn = s.turn === "b" ? "w" : "b"; return; }
      const res = tryPlay(s.board, mv[0], mv[1], s.turn, { koPoint: s.ko });
      if (!res.ok) { s.passes++; return; }
      stateRef.current = { board: res.board, ko: res.ko, turn: s.turn === "b" ? "w" : "b", n: s.n + 1, passes: 0 };
      setBoard(res.board);
    };
    const iv = setInterval(tick, reduce ? 2600 : 1100);
    return () => clearInterval(iv);
  }, []);
  return <Board board={board} disabled sizePx={300} />;
}
