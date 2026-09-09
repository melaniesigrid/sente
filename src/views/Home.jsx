import { useState, useEffect, useRef } from "react";
import { Swords, GraduationCap, Target, Trophy, Route, Sparkles } from "lucide-react";
import { createBoard, tryPlay, aiChooseMove } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn } from "../components/ui.jsx";
import { LESSONS } from "../content/lessons.js";
import { PROBLEMS } from "../content/problems.js";
import { rankOf } from "../content/rank.js";

/* ----------------------- HOME ----------------------- */
export function Home({ profile, go }) {
  const lessonPct = Math.round((profile.lessonsDone.length / LESSONS.length) * 100);
  const probPct = Math.round((profile.problemsDone.length / PROBLEMS.length) * 100);
  const games = profile.wins + profile.losses;
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

      <div className="grid3">
        <button className="neu-card tile" onClick={() => go("learn")}>
          <div className="stat-head"><GraduationCap size={17} /><span>Lessons</span></div>
          <div className="stat-num">{profile.lessonsDone.length}<em>/{LESSONS.length}</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${lessonPct}%` }} /></div>
        </button>
        <button className="neu-card tile" onClick={() => go("tsumego")}>
          <div className="stat-head"><Target size={17} /><span>Tsumego</span></div>
          <div className="stat-num">{profile.problemsDone.length}<em>/{PROBLEMS.length}</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${probPct}%` }} /></div>
        </button>
        <button className="neu-card tile" onClick={() => go("profile")}>
          <div className="stat-head"><Trophy size={17} /><span>Your rank</span></div>
          <div className="stat-num">{rankOf(profile.rating)}<em>· {profile.wins}/{games} won</em></div>
          <div className="meter"><div className="meter-fill" style={{ width: `${games ? (profile.wins / games) * 100 : 0}%` }} /></div>
        </button>
      </div>

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
