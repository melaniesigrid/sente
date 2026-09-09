import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Check, X, Lightbulb, BookOpen, RotateCcw, Play, Search, Clock, Lock,
} from "lucide-react";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill } from "../components/ui.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import {
  TIERS, TRACKS, lessonById, prereqsMissing, nextLessonFor, currentTierFor, searchLibrary,
  lessonsInTier, trackByKey, isDone,
} from "../content/library.js";
import { saveProfile } from "../store/profile.js";
import { initStep, stepReducer, marksFor, boardLocked, VERDICT_LABELS } from "./lessonStep.js";

/* ----------------------- LESSON PLAYER -----------------------
   Thin: all step behaviour lives in lessonStep.js. This component draws the
   state and runs whatever `pending` timer the reducer asks for. */
function LessonPlayer({ lesson, onDone, onExit }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = lesson.steps[stepIdx];
  const [state, setState] = useState(() => initStep(lesson, step));
  const [countDraft, setCountDraft] = useState("");
  const isLast = stepIdx === lesson.steps.length - 1;
  const dispatch = (action) => setState(s => stepReducer(lesson, step, s, action));

  useEffect(() => {
    if (!state.pending) return undefined;
    const { ms, action } = state.pending;
    const t = setTimeout(() => dispatch(action), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pending]);

  const loadStep = (i) => {
    setStepIdx(i);
    setState(initStep(lesson, lesson.steps[i]));
    setCountDraft("");
  };
  const next = () => { if (isLast) onDone(); else loadStep(stepIdx + 1); };
  const solved = state.status === "solved";
  const showHint = (step.type === "quiz" || step.type === "sequence") && !solved && !state.message;

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>Library</Btn>
        <Pill icon={BookOpen}>{lesson.title} · {stepIdx + 1}/{lesson.steps.length}</Pill>
      </div>
      <div className="play-wrap">
        <Board
          board={state.board}
          onPlay={(c, r) => dispatch({ type: "play", c, r })}
          marks={marksFor(step)}
          wrong={state.wrong}
          lastMove={state.lastMove}
          disabled={boardLocked(step, state)}
          flash={state.flash} captured={state.flash} captureKey={stepIdx * 100 + state.moveIdx + (solved ? 50 : 0)}
        />
        <div className="side stack-sm">
          <Card>
            <div className="prob-head">
              <span className="rank-chip">{lesson.rank}</span>
              <span className="theme-chip">{trackByKey(lesson.track)?.name}</span>
            </div>
            <p className="lesson-text">{step.type === "count" ? step.question : step.text}</p>
            {showHint && <p className="fine hint-row"><Lightbulb size={14} /> {step.hint}</p>}
            {step.type === "count" && !solved && (
              <div className="chat-row count-row">
                <input className="chat-input" inputMode="decimal" value={countDraft} placeholder="Your count"
                  aria-label="Your count"
                  onChange={e => setCountDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && dispatch({ type: "answer", value: countDraft })} />
                <button className="chat-send" onClick={() => dispatch({ type: "answer", value: countDraft })} aria-label="Check"><Check size={15} /></button>
              </div>
            )}
            {state.message && state.tone === "success" && (
              <p className="lesson-text success-row"><Check size={16} /> {state.message}</p>
            )}
            {state.message && state.tone === "hint" && (
              <p className="fine wrong-row"><X size={14} /> {state.message}</p>
            )}
            {state.message && state.tone === "verdict" && (
              <p className="fine hint-row"><Lightbulb size={14} /> <strong>{VERDICT_LABELS[state.verdict]}.</strong> {state.message}</p>
            )}
            {state.message && !state.tone && (
              <p className="fine hint-row"><ChevronRight size={14} /> {state.message}</p>
            )}
          </Card>
          <div className="row">
            {state.status === "review" && (
              <Btn icon={RotateCcw} small primary onClick={() => dispatch({ type: "reset" })}>Try again</Btn>
            )}
            {!solved && step.type !== "info"
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

/* ----------------------- LESSON CARD ----------------------- */
function LessonCard({ lesson, done, onOpen }) {
  return (
    <button className="neu-card lesson-card" onClick={() => onOpen(lesson)}>
      <div className="lesson-num">{lesson.rank}</div>
      <div className="lesson-meta">
        <h3>{lesson.title}</h3>
        <p>{lesson.subtitle}</p>
        <p className="lesson-chips"><Clock size={12} /> {lesson.minutes} min · {trackByKey(lesson.track)?.name}</p>
      </div>
      <div className={`lesson-state ${done ? "done" : ""}`}>
        {done ? <Check size={16} /> : <Play size={15} />}
      </div>
    </button>
  );
}

/* ----------------------- LEARN (the library) ----------------------- */
export function LearnView({ profile, setProfile }) {
  const [active, setActive] = useState(null);      // lesson id being played
  const [pending, setPending] = useState(null);    // lesson with missing prereqs awaiting a decision
  const [tier, setTier] = useState(() => currentTierFor(profile));
  const [query, setQuery] = useState("");
  useMokuFacts({ view: "learn", seed: profile.lessonsDone.length });

  const done = (id) => isDone(profile, id);
  const open = (lesson) => {
    const missing = prereqsMissing(lesson, profile);
    if (missing.length) setPending({ lesson, missing });
    else { setPending(null); setActive(lesson.id); }
  };
  const finish = (lesson) => {
    setProfile(p => {
      const np = { ...p, lessonsDone: [...new Set([...p.lessonsDone, lesson.id])] };
      saveProfile(np);
      return np;
    });
    setActive(null);
  };

  const results = useMemo(() => searchLibrary(query), [query]);
  const searching = query.trim().length > 0;
  const tierInfo = TIERS.find(t => t.id === tier);
  const tierLessons = lessonsInTier(tier);
  const continueLesson = nextLessonFor(profile);
  const grouped = useMemo(() => TRACKS
    .map(t => ({ track: t, lessons: (searching ? results : tierLessons).filter(l => l.track === t.key) }))
    .filter(g => g.lessons.length), [searching, results, tierLessons]);

  if (active) {
    const lesson = lessonById(active);
    return <LessonPlayer key={active} lesson={lesson} onExit={() => setActive(null)} onDone={() => finish(lesson)} />;
  }

  return (
    <div className="stack">
      <div className="row spread">
        <h2 className="section-title">Learn</h2>
        <div className="chat-row search-row">
          <Search size={15} className="search-icon" />
          <input className="chat-input" value={query} placeholder="Search lessons or tracks"
            aria-label="Search lessons" onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <p className="lede">A graded library from 30 kyu to dan: six tiers, seven tracks, every position checked by the engine. Start where you are; nothing is locked.</p>

      {pending && (
        <Card inset className="resume-card">
          <div className="resume-copy">
            <div className="stat-head"><Lock size={15} /><span>Before {pending.lesson.title}</span></div>
            <span className="fine">This lesson builds on {pending.missing.map(l => l.title).join(", ")}. You can start there, or open it anyway.</span>
          </div>
          <div className="row">
            <Btn icon={Play} primary small onClick={() => { setPending(null); setActive(pending.missing[0].id); }}>Start with {pending.missing[0].title}</Btn>
            <Btn small onClick={() => { setPending(null); setActive(pending.lesson.id); }}>Open anyway</Btn>
          </div>
        </Card>
      )}

      {!searching && continueLesson && (
        <Card inset className="resume-card">
          <div className="resume-copy">
            <div className="stat-head"><Play size={15} /><span>Continue</span></div>
            <strong>{continueLesson.title}</strong>
            <span className="fine">{continueLesson.rank} · {continueLesson.minutes} min · {trackByKey(continueLesson.track)?.name}</span>
          </div>
          <Btn icon={Play} primary small onClick={() => open(continueLesson)}>Start</Btn>
        </Card>
      )}

      <div className="library">
        {!searching && (
          <nav className="tier-rail" aria-label="Tiers">
            {TIERS.map(t => {
              const ls = lessonsInTier(t.id);
              const n = ls.filter(l => done(l.id)).length;
              return (
                <button key={t.id} className={`tier-btn ${t.id === tier ? "active" : ""}`}
                  onClick={() => setTier(t.id)} aria-current={t.id === tier ? "true" : undefined}>
                  <span className="tier-name">{t.id} · {t.name}</span>
                  <span className="tier-sub">{t.ranks}{ls.length ? ` · ${n}/${ls.length}` : ""}</span>
                </button>
              );
            })}
          </nav>
        )}
        <div className="stack tier-body">
          {!searching && (
            <div className="tier-head">
              <h3 className="prob-title">{tierInfo.name}</h3>
              <p className="fine">"{tierInfo.identity}" · {tierInfo.ranks}{tierInfo.exit ? ` · Exit test: ${tierInfo.exit.label}` : " · Exit: analysis-backed review, later"}</p>
            </div>
          )}
          {grouped.length === 0 && (
            <Card inset><p className="fine">{searching ? "Nothing matches that. Try a title or a track, like capture or life." : "This tier is not authored yet. The syllabus is in the design doc; lessons land tier by tier."}</p></Card>
          )}
          {grouped.map(g => (
            <div key={g.track.key} className="stack-sm">
              <div className="stat-head track-head"><span>{g.track.name}</span><span className="fine track-trains">{g.track.trains}</span></div>
              <div className="grid2">
                {g.lessons.map(l => <LessonCard key={l.id} lesson={l} done={done(l.id)} onOpen={open} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
