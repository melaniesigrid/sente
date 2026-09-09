import { useState } from "react";
import { Check, X, RotateCcw, SkipForward } from "lucide-react";
import { tryPlay } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn } from "../components/ui.jsx";
import { PROBLEMS } from "../content/problems.js";
import { setupToBoard } from "../content/positions.js";
import { saveProfile } from "../store/profile.js";

/* ----------------------- TSUMEGO ----------------------- */
export function ProblemsView({ profile, setProfile }) {
  const [activeId, setActiveId] = useState(PROBLEMS[0].id);
  const prob = PROBLEMS.find(p => p.id === activeId);
  const [state, setState] = useState(() => ({ board: setupToBoard(PROBLEMS[0].setup), status: "open", flash: [] }));

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
        const np = { ...pr, problemsDone: [...new Set([...pr.problemsDone, prob.id])] };
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
    <div className="stack">
      <h2 className="section-title">Tsumego</h2>
      <p className="lede">
        Classical shapes — the public-domain vocabulary every serious life-and-death
        collection is built on. Daily puzzles and a spaced-repetition queue arrive
        with the growing problem library.
      </p>
      <div className="prob-tabs" role="tablist">
        {PROBLEMS.map((p, i) => {
          const done = profile.problemsDone.includes(p.id);
          return (
            <button key={p.id} role="tab" aria-selected={p.id === activeId}
              className={`prob-tab ${p.id === activeId ? "active" : ""} ${done ? "done" : ""}`}
              onClick={() => load(p.id)}>
              {done ? <Check size={13} /> : <span className="prob-n">{i + 1}</span>}
            </button>
          );
        })}
      </div>
      <div className="play-wrap">
        <Board board={state.board} onPlay={onPlay} disabled={state.status === "solved"} flash={state.flash} />
        <div className="side stack-sm">
          <Card>
            <div className="prob-head">
              <span className="rank-chip">{prob.rank}</span>
              <span className="theme-chip">{prob.theme}</span>
            </div>
            <h3 className="prob-title">{prob.title}</h3>
            <p className="lesson-text">{prob.prompt}</p>
            {state.status === "solved" && (
              <p className="lesson-text success-row"><Check size={16} /> {prob.explain}</p>
            )}
            {state.status === "wrong" && (
              <p className="fine wrong-row"><X size={14} /> The group answers back — resetting.</p>
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
