import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Check, X, Lightbulb, BookOpen, RotateCcw, Play, Search, Clock, Lock, Quote, FastForward,
} from "lucide-react";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill } from "../components/ui.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import {
  TIERS, TRACKS, BOOKS, lessonById, prereqsMissing, nextLessonFor, currentTierFor, searchLibrary,
  lessonsInTier, lessonsInBook, lessonsInSeries, lessonAfter, bookProgressFor, trackByKey, isDone,
} from "../content/library.js";
import { CLASSIC, sayingOfTheDay } from "../content/classic.js";
import { dayKey } from "../content/kata.js";
import { saveProfile } from "../store/profile.js";
import { rankOf } from "../content/rank.js";
import { modelReady, kataChooseMoveForRecord, profileForRank } from "../engine/index.js";
import { initStep, stepReducer, marksFor, boardLocked, recordAtStop, coordLabel, VERDICT_LABELS } from "./lessonStep.js";

/* ----------------------- LESSON PLAYER -----------------------
   Thin: all step behaviour lives in lessonStep.js. This component draws the
   state and runs whatever `pending` timer the reducer asks for. */
function LessonPlayer({ lesson, nextLesson, onDone, onExit, rank, onProgress }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = lesson.steps[stepIdx];
  const [state, setState] = useState(() => initStep(lesson, step));
  const [countDraft, setCountDraft] = useState("");
  const [level, setLevel] = useState(null);       // "at your level": the network's move at the scored stop
  const isLast = stepIdx === lesson.steps.length - 1;
  const dispatch = (action) => setState(s => stepReducer(lesson, step, s, action));
  const replay = step.type === "replay";

  // A scored stop is progress worth keeping, and the moment to ask the network
  // (only if it is already loaded: a lesson never starts the download).
  useEffect(() => {
    if (!replay || state.status !== "scored") return;
    onProgress?.(lesson, { stops: state.stopsDone, score: state.score, total: 2 * step.stops.length });
    setLevel(null);
    if (!modelReady() || !rank) return;
    const stopIdx = state.stopIdx - 1;
    let live = true;
    kataChooseMoveForRecord(recordAtStop(lesson, step, stopIdx), { ...profileForRank(rank), temperature: 0 })
      .then((res) => { if (live && res && res.move) setLevel({ stopIdx, move: res.move }); })
      .catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay, state.status, state.stopsDone]);

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
    setLevel(null);
  };
  const next = () => { if (isLast) onDone(); else loadStep(stepIdx + 1); };
  const solved = state.status === "solved";
  const showHint = (step.type === "quiz" || step.type === "sequence") && !solved && !state.message;
  const stop = replay ? step.stops[Math.min(state.stopIdx, step.stops.length - 1)] : null;
  const showStopHint = replay && state.status === "open" && stop?.hint && !state.wrong;
  const levelMark = level && replay && level.stopIdx === state.stopIdx - 1 && state.status === "scored" ? [{ c: level.move[0], r: level.move[1] }] : [];

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>Library</Btn>
        <div className="row">
          {replay && <Pill icon={FastForward}>Stop {Math.min(state.stopIdx + (state.status === "open" ? 1 : 0), step.stops.length)}/{step.stops.length} · {state.score} pts</Pill>}
          <Pill icon={BookOpen}>{lesson.title} · {stepIdx + 1}/{lesson.steps.length}</Pill>
        </div>
      </div>
      <div className="play-wrap">
        <Board
          board={state.board}
          onPlay={(c, r) => dispatch({ type: "play", c, r })}
          marks={[...marksFor(step, state), ...levelMark]}
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
            {step.type === "maxim" && (
              <blockquote className="maxim-line"><Quote size={14} /> {step.line}</blockquote>
            )}
            {step.type === "maxim" && <p className="fine maxim-analogy">{step.analogy}</p>}
            <p className="lesson-text">{step.type === "count" ? step.question : replay && state.status === "open" ? stop.text : step.text}</p>
            {showHint && <p className="fine hint-row"><Lightbulb size={14} /> {step.hint}</p>}
            {showStopHint && <p className="fine hint-row"><Lightbulb size={14} /> {stop.hint}</p>}
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
            {levelMark.length > 0 && (
              <p className="fine hint-row"><Lightbulb size={14} /> At your level ({rank}), a player here tends to play {coordLabel(level.move[0], level.move[1], state.board.size)}.</p>
            )}
          </Card>
          <div className="row">
            {state.status === "review" && (
              <Btn icon={RotateCcw} small primary onClick={() => dispatch({ type: "reset" })}>Try again</Btn>
            )}
            {replay && state.status === "busy" && !state.refutation && (
              <Btn icon={FastForward} small onClick={() => dispatch({ type: "advance" })}>Next move</Btn>
            )}
            {!solved && step.type !== "info" && step.type !== "maxim" && !replay
              && <Btn icon={RotateCcw} small onClick={() => loadStep(stepIdx)}>Reset position</Btn>}
            {(solved || step.type === "info" || step.type === "maxim")
              && <Btn icon={isLast && !nextLesson ? Check : ChevronRight} primary onClick={next}>
                {!isLast ? "Continue" : nextLesson ? `Next: ${nextLesson.title}` : "Complete lesson"}
              </Btn>}
            {solved && isLast && nextLesson && (
              <Btn icon={Check} small onClick={() => onDone({ stay: false })}>Finish and stop</Btn>
            )}
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

/* ----------------------- THE SHELF -----------------------
   Books are a grouping over lessons that carry `book`; a book with no lessons yet
   says so and takes no space beyond its line. Guess-the-move points come from
   `bookProgress`, the best run per study. */
function Shelf({ profile, onOpen }) {
  const rows = BOOKS.map(b => ({ book: b, lessons: lessonsInBook(b.id), progress: bookProgressFor(profile, b.id) }));
  return (
    <div className="stack-sm shelf">
      <div className="stat-head track-head"><span>The shelf</span><span className="fine track-trains">Books as kata: forms drilled until they can be broken on purpose</span></div>
      {rows.map(({ book, lessons, progress }) => (
        <Card key={book.id} inset className="shelf-book">
          <div className="resume-copy">
            <div className="stat-head"><BookOpen size={15} /><span>{book.name}</span>
              {progress.total > 0 && <span className="fine">{progress.score}/{progress.total} pts</span>}
            </div>
            <span className="fine">{book.blurb}</span>
            {lessons.length === 0 && <span className="fine">Not on the shelf yet.</span>}
          </div>
          {lessons.length > 0 && (
            <div className="grid2">
              {lessons.map(l => <LessonCard key={l.id} lesson={l} done={isDone(profile, l.id)} onOpen={onOpen} />)}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ----------------------- THE CLASSIC (series card) -----------------------
   One saying a day from Zhang Ni's thirteen chapters, and the thirteen
   lessons that teach them, in the book's order, whatever tier they sit in. */
function ClassicCard({ done, onOpen }) {
  const [openList, setOpenList] = useState(false);
  const saying = sayingOfTheDay(dayKey());
  const lessons = lessonsInSeries(CLASSIC.key);
  const finished = lessons.filter(l => done(l.id)).length;
  return (
    <Card inset className="stack-sm">
      <div className="stat-head"><Quote size={15} /><span>{CLASSIC.title}</span></div>
      <p className="lesson-text">{saying.text}</p>
      <p className="fine">Chapter {saying.chapter}, {saying.title}. {CLASSIC.author}, {CLASSIC.era}.</p>
      <div className="row spread">
        <span className="fine">{finished}/{lessons.length} chapters read</span>
        <Btn icon={openList ? ChevronLeft : BookOpen} small onClick={() => setOpenList(o => !o)}>
          {openList ? "Hide the chapters" : "Read the thirteen chapters"}
        </Btn>
      </div>
      {openList && (
        <div className="stack-sm">
          <p className="fine">{CLASSIC.blurb} {CLASSIC.credit}</p>
          <div className="grid2">
            {lessons.map(l => <LessonCard key={l.id} lesson={l} done={done(l.id)} onOpen={onOpen} />)}
          </div>
        </div>
      )}
    </Card>
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
  // Finishing records the lesson and, unless asked to stop, opens the next one.
  const finish = (lesson, { stay = true } = {}) => {
    setProfile(p => {
      const np = { ...p, lessonsDone: [...new Set([...p.lessonsDone, lesson.id])] };
      saveProfile(np);
      return np;
    });
    const after = stay ? lessonAfter(lesson) : null;
    setActive(after ? after.id : null);
  };
  /** A scored replay stop: keep the best run of this lesson so far. */
  const progress = (lesson, { stops, score, total }) => {
    setProfile(p => {
      const prev = (p.bookProgress || {})[lesson.id];
      if (prev && prev.score >= score && prev.stops >= stops) return p;
      const np = { ...p, bookProgress: { ...(p.bookProgress || {}), [lesson.id]: { stops, score, total } } };
      saveProfile(np);
      return np;
    });
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
    return (
      <LessonPlayer key={active} lesson={lesson} nextLesson={lessonAfter(lesson)}
        rank={rankOf(profile.rating)} onProgress={progress}
        onExit={() => setActive(null)} onDone={(opts) => finish(lesson, opts)} />
    );
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

      {!searching && <ClassicCard done={done} onOpen={open} />}

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
          {!searching && <Shelf profile={profile} onOpen={open} />}
        </div>
      </div>
    </div>
  );
}
