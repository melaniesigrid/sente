import { useState, useEffect, useMemo, Fragment } from "react";
import {
  ChevronLeft, ChevronRight, Check, X, Lightbulb, BookOpen, RotateCcw, Play, Search, Clock, Lock,
  CornerDownRight, Eye,
} from "lucide-react";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, PullQuote } from "../components/ui.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import {
  TIERS, TRACKS, lessonById, prereqsMissing, nextLessonFor, currentTierFor, searchLibrary,
  lessonsInTier, trackByKey, isDone, lessonsInSeries,
} from "../content/library.js";
import { CLASSIC, CHAPTERS, PREFACE, NAMES, sayingOfTheDay, lessonIdsForChapter } from "../content/classic.js";
import { SayingCard } from "../components/Saying.jsx";
import { dayKey } from "../content/kata.js";
import { saveProfile } from "../store/profile.js";
import { initStep, stepReducer, marksFor, boardLocked, canReveal, VERDICT_LABELS } from "./lessonStep.js";

/* ----------------------- LESSON PLAYER -----------------------
   Thin: all step behaviour lives in lessonStep.js. This component draws the
   state and runs whatever `pending` timer the reducer asks for.

   Two rules shape it. Timers move stones, never words: everything the lesson
   says accumulates in `state.log` and is only cleared by leaving the step.
   And the learner moves in both directions: every step keeps its own state in
   `states`, so going back to a solved step finds it solved, transcript and all. */

/* Where each lesson was left, so a trip to the library does not throw the work
   away. Session memory only — a reload starts the lesson over. */
const SESSIONS = new Map();

const reducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const TONE_ICON = { success: Check, correction: X, verdict: Lightbulb, commentary: CornerDownRight };

/** One thing the lesson said. Three tones, one shape. */
function Response({ entry }) {
  const Icon = TONE_ICON[entry.tone] || CornerDownRight;
  return (
    <div className={`response tone-${entry.tone}`}>
      <Icon size={14} strokeWidth={2.2} />
      <p className="lesson-text">
        {entry.verdict && <span className="verdict-label">{VERDICT_LABELS[entry.verdict]}</span>}
        {entry.text}
      </p>
    </div>
  );
}

function LessonPlayer({ lesson, nextLesson, onDone, onExit, onOpenNext }) {
  const saved = SESSIONS.get(lesson.id);
  const [stepIdx, setStepIdx] = useState(saved?.stepIdx ?? 0);
  const [maxIdx, setMaxIdx] = useState(saved?.maxIdx ?? 0);
  const [states, setStates] = useState(() => saved?.states ?? lesson.steps.map(st => initStep(lesson, st)));
  const [countDraft, setCountDraft] = useState("");
  const [hintsOpen, setHintsOpen] = useState(() => new Set()); // per step, once opened it stays
  const [finished, setFinished] = useState(false);

  const step = lesson.steps[stepIdx];
  const state = states[stepIdx];
  const isLast = stepIdx === lesson.steps.length - 1;
  const solved = state.status === "solved";
  const canGoNext = solved || stepIdx < maxIdx;

  const dispatch = (action) =>
    setStates(all => all.map((s, i) => (i === stepIdx ? stepReducer(lesson, step, s, action) : s)));

  useEffect(() => { SESSIONS.set(lesson.id, { stepIdx, maxIdx, states }); }, [lesson.id, stepIdx, maxIdx, states]);

  useEffect(() => {
    if (!state.pending) return undefined;
    const { ms, action } = state.pending;
    const t = setTimeout(() => dispatch(action), reducedMotion() ? 0 : ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pending]);

  /* A miss opens this step's hint rather than repeating it as a correction.
     Stickiness is per step: a hint the learner opened on step two is not
     handed to them unasked on step three. */
  const hintOpen = hintsOpen.has(stepIdx);
  const openHint = () => setHintsOpen(h => new Set(h).add(stepIdx));
  useEffect(() => {
    if (state.attempts > 0) setHintsOpen(h => (h.has(stepIdx) ? h : new Set(h).add(stepIdx)));
  }, [state.attempts, stepIdx]);

  const goto = (i) => {
    setStepIdx(i);
    setMaxIdx(m => Math.max(m, i));
    setCountDraft("");
  };
  const back = () => { if (stepIdx > 0) goto(stepIdx - 1); };
  const next = () => { if (isLast) { setFinished(true); onDone(); } else goto(stepIdx + 1); };

  /* Arrows walk the lesson; Enter fires the primary when nothing else is focused,
     so it never steals the board's own Enter-to-play or the count field. */
  useEffect(() => {
    const onKey = (e) => {
      if (finished || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" && stepIdx > 0) { e.preventDefault(); back(); }
      else if (e.key === "ArrowRight" && canGoNext) { e.preventDefault(); next(); }
      else if (e.key === "Enter" && canGoNext && e.target === document.body) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished) {
    const learned = lesson.steps
      .map((st, i) => ({ text: st.success, shown: states[i].revealed }))
      .filter(l => l.text);
    return (
      <div className="stack">
        <div className="row spread">
          <Btn icon={ChevronLeft} small onClick={onExit}>Library</Btn>
          <Pill icon={Check} tone="win">Lesson complete</Pill>
        </div>
        <div className="play-wrap">
          <Board board={state.board} marks={marksFor(step)} lastMove={state.lastMove} disabled />
          <div className="side stack-sm">
            <Card className="lesson-card-body">
              <div className="prob-head">
                <span className="rank-chip">{lesson.rank}</span>
                <span className="theme-chip">{trackByKey(lesson.track)?.name}</span>
              </div>
              <h3 className="lesson-head">{lesson.title}</h3>
              <p className="fine">What this taught you</p>
              <ul className="recap">
                {learned.map((l, i) => (
                  <li key={i} className={l.shown ? "shown" : ""}>
                    {l.shown ? <Eye size={14} /> : <Check size={14} />}
                    <span>{l.text}</span>
                  </li>
                ))}
              </ul>
              <div className="lesson-foot">
                <Btn icon={BookOpen} small onClick={onExit}>Library</Btn>
                {nextLesson && (
                  <Btn icon={ChevronRight} small primary onClick={() => onOpenNext(nextLesson)}>
                    Next: {nextLesson.title}
                  </Btn>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const showHint = !!step.hint && !solved;
  const reveals = canReveal(step, state);

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>Library</Btn>
        <nav className="step-rail" aria-label="Lesson steps">
          {lesson.steps.map((_, i) => (
            <button key={i} type="button"
              className={`step-seg ${states[i].status === "solved" ? "done" : ""} ${i <= maxIdx ? "visited" : ""} ${i === stepIdx ? "current" : ""}`}
              onClick={() => i <= maxIdx && goto(i)}
              disabled={i > maxIdx}
              aria-current={i === stepIdx ? "step" : undefined}
              aria-label={`Step ${i + 1} of ${lesson.steps.length}`} />
          ))}
        </nav>
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
          <Card className="lesson-card-body">
            <div className="prob-head">
              <span className="rank-chip">{lesson.rank}</span>
              <span className="theme-chip">{trackByKey(lesson.track)?.name}</span>
            </div>
            <h3 className="lesson-head">{lesson.title}</h3>
            <p className="fine step-count">Step {stepIdx + 1} of {lesson.steps.length}</p>
            <p className="lesson-text">{step.type === "count" ? step.question : step.text}</p>

            {showHint && (
              <div className="hint-block">
                <button type="button" className="hint-toggle" onClick={openHint}
                  disabled={hintOpen} aria-expanded={hintOpen}>
                  <Lightbulb size={14} /> <span>Hint</span>
                </button>
                {hintOpen && <p className="fine hint-text">{step.hint}</p>}
              </div>
            )}

            {step.type === "count" && !solved && (
              <div className="chat-row count-row">
                <input className="chat-input" inputMode="decimal" value={countDraft} placeholder="Your count"
                  aria-label="Your count"
                  onChange={e => setCountDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && dispatch({ type: "answer", value: countDraft })} />
                <button className="chat-send" onClick={() => dispatch({ type: "answer", value: countDraft })} aria-label="Check"><Check size={15} /></button>
              </div>
            )}

            <div className={`log ${step.type === "info" ? "" : "reserve"}`} aria-live="polite">
              {state.log.map((entry, i) => <Response key={i} entry={entry} />)}
              {state.status === "await" && (
                <button type="button" className="log-next" onClick={() => dispatch({ type: "reply" })}>
                  <span>Play the reply</span> <ChevronRight size={14} />
                </button>
              )}
            </div>

            <div className="lesson-foot">
              <Btn icon={ChevronLeft} small onClick={back} disabled={stepIdx === 0}>Back</Btn>
              <div className="row">
                {!solved && step.type !== "info" && (
                  <Btn icon={RotateCcw} small onClick={() => dispatch({ type: "reset" })} label="Reset position" />
                )}
                {reveals && <Btn icon={Eye} small onClick={() => dispatch({ type: "reveal" })}>Show me</Btn>}
                <Btn icon={isLast ? Check : ChevronRight} small primary onClick={next} disabled={!canGoNext}>
                  {isLast ? "Complete lesson" : "Continue"}
                </Btn>
              </div>
            </div>
          </Card>
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

/* ----------------------- THE CLASSIC (series card) -----------------------
   The saying of the day, then the book itself: thirteen chapters, each one
   readable straight through in Sente's own rendering, with the lesson that
   teaches it underneath. The prose and the sayings both come from
   content/classic.js; nothing about the text lives in this view. */
/* Chapter eleven lists thirty-two names and no definitions. We show the list
   as the chapter gives it, and say plainly which ones we cannot match to a
   modern term rather than inventing one. See NAMES in content/classic.js. */
function NamesTable() {
  const known = NAMES.filter(n => n.sure).length;
  return (
    <div className="names-block">
      <div className="names-grid">
        {NAMES.map(n => (
          <div key={n.n} className={`name-cell ${n.sure ? "" : "unsure"}`}>
            <span className="name-word">{n.name}</span>
            <span className="name-modern">
              {n.sure ? n.modern : n.modern ? `${n.modern} · uncertain` : "not identified"}
            </span>
            <span className="fine name-gloss">{n.text}</span>
          </div>
        ))}
      </div>
      <p className="fine">
        {known} of the thirty-two match a term the game still uses. The rest are
        listed as the chapter lists them. The names arrive without their characters
        and without tone marks, so some readings are uncertain, and a chapter that
        argues names must be set right is the wrong place to guess.
      </p>
    </div>
  );
}

/* A passage with one idea pulled out of it: the paragraphs as the chapter
   gives them, and the plain-words line set large after the first, where a
   magazine would put it. Prose with no gloss is just paragraphs. */
function Prose({ text, plain }) {
  const at = Math.min(1, text.length - 1);
  return text.map((p, i) => (
    <Fragment key={i}>
      <p className="lesson-text">{p}</p>
      {plain && i === at && <PullQuote>{plain}</PullQuote>}
    </Fragment>
  ));
}

function ChapterRow({ chapter, lessons, done, onOpen }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="chapter-row">
      <button className="chapter-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="chapter-n">{chapter.n}</span>
        <span className="chapter-title">
          <strong>{chapter.title}</strong>
          <span className="fine">{chapter.theme}</span>
        </span>
        <ChevronRight size={15} className={`chapter-caret ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="chapter-body">
          <Prose text={chapter.text} plain={chapter.plain} />
          {chapter.n === 11 && <NamesTable />}
          {lessons.map(l => <LessonCard key={l.id} lesson={l} done={done(l.id)} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

function ClassicCard({ done, onOpen }) {
  const [openList, setOpenList] = useState(false);
  const lessons = lessonsInSeries(CLASSIC.key);
  const finished = lessons.filter(l => done(l.id)).length;
  return (
    <SayingCard saying={sayingOfTheDay(dayKey())}>
      <div className="row spread">
        <span className="fine">{finished}/{lessons.length} chapters read</span>
        <Btn icon={openList ? ChevronLeft : BookOpen} small onClick={() => setOpenList(o => !o)}>
          {openList ? "Close the book" : "Read the thirteen chapters"}
        </Btn>
      </div>
      {openList && (
        <div className="stack-sm">
          <p className="fine">{CLASSIC.blurb} {CLASSIC.credit}</p>
          <div className="chapter-list">
            <div className="chapter-row">
              <div className="chapter-body preface">
                <strong className="chapter-title">{PREFACE.title}</strong>
                <Prose text={PREFACE.text} plain={PREFACE.plain} />
              </div>
            </div>
            {CHAPTERS.map(ch => (
              <ChapterRow key={ch.n} chapter={ch}
                lessons={lessonIdsForChapter(ch).map(lessonById).filter(Boolean)}
                done={done} onOpen={onOpen} />
            ))}
          </div>
        </div>
      )}
    </SayingCard>
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
  /* Completing marks the profile but leaves the player mounted: it shows its own
     recap and offers the next lesson, so the learner never has to re-enter the
     grid to keep going. The session is dropped so a replay starts at step one. */
  const finish = (lesson) => {
    SESSIONS.delete(lesson.id);
    setProfile(p => {
      const np = { ...p, lessonsDone: [...new Set([...p.lessonsDone, lesson.id])] };
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
    const after = continueLesson && continueLesson.id !== active ? continueLesson : null;
    return <LessonPlayer key={active} lesson={lesson} nextLesson={after}
      onExit={() => setActive(null)} onDone={() => finish(lesson)}
      onOpenNext={(l) => { setPending(null); setActive(l.id); }} />;
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
        </div>
      </div>
    </div>
  );
}
