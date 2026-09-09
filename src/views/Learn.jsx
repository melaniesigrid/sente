import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, Lightbulb, BookOpen, RotateCcw, Play } from "lucide-react";
import { tryPlay } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill } from "../components/ui.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import { LESSONS } from "../content/lessons.js";
import { setupToBoard } from "../content/positions.js";
import { saveProfile } from "../store/profile.js";

/* ----------------------- LESSON PLAYER ----------------------- */
function LessonPlayer({ lesson, onDone, onExit }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [state, setState] = useState(() => ({ board: setupToBoard(lesson.steps[0].setup), solved: false, wrong: null, flash: [] }));
  const step = lesson.steps[stepIdx];
  const isLast = stepIdx === lesson.steps.length - 1;

  const loadStep = (i) => {
    setStepIdx(i);
    setState({ board: setupToBoard(lesson.steps[i].setup), solved: false, wrong: null, flash: [] });
  };

  const onPlay = (c, r) => {
    if (step.type !== "quiz" || state.solved) return;
    const ok = step.answers.some(p => p.c === c && p.r === r);
    const res = tryPlay(state.board, c, r, step.toPlay);
    if (ok && res.ok) {
      setState({ board: res.board, solved: true, wrong: null, flash: res.captured });
    } else {
      setState(s => ({ ...s, wrong: { c, r } }));
      setTimeout(() => setState(s => ({ ...s, wrong: null })), 900);
    }
  };

  const next = () => { if (isLast) onDone(); else loadStep(stepIdx + 1); };

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>All lessons</Btn>
        <Pill icon={BookOpen}>{lesson.title} · {stepIdx + 1}/{lesson.steps.length}</Pill>
      </div>
      <div className="play-wrap">
        <Board
          board={state.board}
          onPlay={onPlay}
          marks={step.marks || []}
          disabled={step.type !== "quiz" || state.solved}
          flash={state.flash} captured={state.flash} captureKey={stepIdx + (state.solved ? 100 : 0)}
        />
        <div className="side stack-sm">
          <Card>
            <p className="lesson-text">{step.text}</p>
            {step.type === "quiz" && !state.solved && (
              <p className="fine hint-row"><Lightbulb size={14} /> {step.hint}</p>
            )}
            {state.wrong && (
              <p className="fine wrong-row"><X size={14} /> Not there — read the liberties again.</p>
            )}
            {state.solved && (
              <p className="lesson-text success-row"><Check size={16} /> {step.success}</p>
            )}
          </Card>
          <div className="row">
            {step.type === "quiz" && !state.solved
              ? <Btn icon={RotateCcw} small onClick={() => loadStep(stepIdx)}>Reset position</Btn>
              : <Btn icon={isLast ? Check : ChevronRight} primary onClick={next}>
                {isLast ? "Complete lesson" : "Continue"}
              </Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- LEARN ----------------------- */
export function LearnView({ profile, setProfile }) {
  const [active, setActive] = useState(null);
  useMokuFacts({ view: "learn", seed: profile.lessonsDone.length });
  if (active) {
    const lesson = LESSONS.find(l => l.id === active);
    return (
      <LessonPlayer
        lesson={lesson}
        onExit={() => setActive(null)}
        onDone={() => {
          setProfile(p => {
            const np = { ...p, lessonsDone: [...new Set([...p.lessonsDone, lesson.id])] };
            saveProfile(np);
            return np;
          });
          setActive(null);
        }}
      />
    );
  }
  return (
    <div className="stack">
      <h2 className="section-title">Learn</h2>
      <p className="lede">Guided replays with quiz gates — the board pauses and asks. Rules → instincts → life & death → openings, in pedagogical order. Every position is engine-checked.</p>
      <div className="grid2">
        {LESSONS.map((l, i) => {
          const done = profile.lessonsDone.includes(l.id);
          return (
            <button key={l.id} className="neu-card lesson-card" onClick={() => setActive(l.id)}>
              <div className="lesson-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="lesson-meta">
                <h3>{l.title}</h3>
                <p>{l.subtitle}</p>
              </div>
              <div className={`lesson-state ${done ? "done" : ""}`}>
                {done ? <Check size={16} /> : <Play size={15} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
