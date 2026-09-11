import { useState } from "react";
import { Check, X, RotateCcw, SkipForward, CalendarCheck, Flame } from "lucide-react";
import { tryPlay } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Statement } from "../components/ui.jsx";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import { PROBLEMS } from "../content/problems.js";
import { setupToBoard } from "../content/positions.js";
import { dayKey, dailyProblem, attend, liveStreak } from "../content/kata.js";
import { saveProfile } from "../store/profile.js";

/* ----------------------- TSUMEGO -----------------------
   `initialId` opens a specific problem (the Home card's kata of the day).
   Solving today's kata records attendance; the streak lives in the profile. */
export function ProblemsView({ profile, setProfile, initialId }) {
  const today = dayKey();
  const kata = dailyProblem(PROBLEMS, today);
  const startId = initialId && PROBLEMS.some(p => p.id === initialId) ? initialId : PROBLEMS[0].id;
  const [activeId, setActiveId] = useState(startId);
  const prob = PROBLEMS.find(p => p.id === activeId);
  const [state, setState] = useState(() => ({ board: setupToBoard(prob.setup), status: "open", flash: [] }));
  const streak = liveStreak(profile, today);
  const isKata = kata && prob.id === kata.id;
  useMokuFacts({ view: "tsumego", seed: profile.problemsDone.length });

  const load = (id) => {
    const p = PROBLEMS.find(x => x.id === id);
    setActiveId(id);
    setState({ board: setupToBoard(p.setup), status: "open", flash: [] });
  };

  const onPlay = (c, r) => {
    if (state.status === "solved") return;
    const ok = prob.answers.some(p => p.c === c && p.r === r);
    const res = tryPlay(state.board, c, r, prob.toPlay);
    if (ok && res.ok) {
      setState({ board: res.board, status: "solved", flash: res.captured });
      setProfile(pr => {
        const np = {
          ...pr,
          problemsDone: [...new Set([...pr.problemsDone, prob.id])],
          ...(isKata ? attend(pr, today) : {}),
        };
        saveProfile(np);
        return np;
      });
    } else if (res.ok) {
      setState({ board: res.board, status: "wrong", flash: res.captured });
      setTimeout(() => load(prob.id), 1100);
    }
  };

  const curIdx = PROBLEMS.findIndex(p => p.id === activeId);

  return (
    <div className="stack arrives">
      <ScreenHeader
        label="Life and death"
        title={<>Read it <em>out</em>.</>}
        lede="Classical shapes: the public-domain vocabulary every serious life-and-death
              collection is built on. One of them is today's kata; solve it daily and your
              attendance grows." />
      <Statement lines={statementFor("tsumego")} figure="tsumego">{plainFor("tsumego")}</Statement>
      <Passage context="tsumego" />
      <div className="prob-tabs" role="tablist">
        {PROBLEMS.map((p, i) => {
          const done = profile.problemsDone.includes(p.id);
          return (
            <button key={p.id} role="tab" aria-selected={p.id === activeId}
              className={`prob-tab ${p.id === activeId ? "active" : ""} ${done ? "done" : ""} ${kata && p.id === kata.id ? "kata" : ""}`}
              onClick={() => load(p.id)} title={kata && p.id === kata.id ? "Kata of the day" : undefined}>
              {done ? <Check size={13} /> : <span className="prob-n">{i + 1}</span>}
            </button>
          );
        })}
      </div>
      <div className="play-wrap">
        <Board board={state.board} onPlay={onPlay} disabled={state.status === "solved"} flash={state.flash} captured={state.flash} captureKey={state.status} />
        <div className="side stack-sm">
          <Card>
            <div className="prob-head">
              <span className="rank-chip">{prob.rank}</span>
              <span className="theme-chip">{prob.theme}</span>
              {isKata && <span className="theme-chip kata-chip"><CalendarCheck size={11} /> kata of the day</span>}
            </div>
            <h3 className="prob-title">{prob.title}</h3>
            <p className="lesson-text">{prob.prompt}</p>
            {state.status === "solved" && (
              <p className="lesson-text success-row"><Check size={16} /> {prob.explain}</p>
            )}
            {state.status === "solved" && isKata && profile.kataDate === today && (
              <p className="fine hint-row"><Flame size={14} /> Attendance: {streak} {streak === 1 ? "day" : "days"} in a row.</p>
            )}
            {state.status === "wrong" && (
              <p className="fine wrong-row"><X size={14} /> The group answers back. Resetting.</p>
            )}
          </Card>
          <div className="row">
            <Btn icon={RotateCcw} small onClick={() => load(prob.id)}>Reset</Btn>
            {state.status === "solved" && curIdx < PROBLEMS.length - 1 && (
              <Btn icon={SkipForward} small primary onClick={() => load(PROBLEMS[curIdx + 1].id)}>Next problem</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
