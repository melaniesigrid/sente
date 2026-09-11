import { useState, useEffect, useMemo, Fragment } from "react";
import {
  ChevronLeft, ChevronRight, Check, X, Lightbulb, BookOpen, RotateCcw, Play, Search, Clock, Lock, Quote, FastForward,
  CornerDownRight, Eye, BrainCircuit,
} from "lucide-react";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, PullQuote, Statement } from "../components/ui.jsx";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import {
  LIBRARY, TIERS, TRACKS, BOOKS, lessonById, prereqsMissing, nextLessonFor, currentTierFor, searchLibrary,
  lessonsInTier, lessonsInBook, lessonsInSeries, lessonAfter, bookProgressFor, trackByKey, isDone,
  tierById, seriesByKey,
} from "../content/library.js";
import { CLASSIC, CHAPTERS, PREFACE, NAMES, lessonIdsForChapter } from "../content/classic.js";
import { saveProfile } from "../store/profile.js";
import { enrol, recallSummary } from "../content/recall.js";
import { dayKey } from "../content/kata.js";
import { rankOf } from "../content/rank.js";
import { modelReady, kataChooseMoveForRecord, profileForRank } from "../engine/index.js";
import { initStep, stepReducer, marksFor, boardLocked, canReveal, recordAtStop, coordLabel, VERDICT_LABELS } from "./lessonStep.js";
import { useT } from "../components/langStore.js";
import { localizeLesson, lessonField } from "../content/translate.js";

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

/** One thing the lesson said. Four tones, one shape. Exported: the recall
 *  sitting draws the same block, because it is the same voice answering. */
export function Response({ entry }) {
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

/* A lesson may lead out of its track, its tier, or its rank. Name the boundary it
   crosses, so the jump reads as the path continuing and not as a wrong turn. The welcome
   demo is not in the library, so it is told nothing about where the path goes. */
function crossingNote(lesson, next, t) {
  if (!next) return lessonById(lesson.id) ? t("learn.crossing.last") : null;
  if (next.series && next.series === lesson.series)
    return t("learn.crossing.chapter", { n: next.chapter, series: seriesByKey(next.series)?.name });
  if (next.tier !== lesson.tier) return t("learn.crossing.tier", { tier: tierById(next.tier)?.name, rank: next.rank });
  if (next.track !== lesson.track) return trackByKey(next.track)?.name || null;
  return t("learn.crossing.next");
}

/* Exported so the welcome flow can run its demo through the same player the library
   uses: same step behaviour, same timings, same board. `exitLabel` is the only thing
   it needs to say differently — a first-time visitor has never seen a library. */

export function LessonPlayer({ lesson: authored, nextLesson, onDone, onExit, onOpenNext, rank, onProgress, exitLabel = null }) {
  const t = useT();
  const exitWord = exitLabel ?? t("learn.library");
  /* The lesson in the reader's language. Memoised on the pair, so a lesson
     nobody has translated costs one identity check and no copying. */
  const lesson = useMemo(() => localizeLesson(authored, t), [authored, t]);
  const saved = SESSIONS.get(lesson.id);
  const [stepIdx, setStepIdx] = useState(saved?.stepIdx ?? 0);
  const [maxIdx, setMaxIdx] = useState(saved?.maxIdx ?? 0);
  const [states, setStates] = useState(() => saved?.states ?? lesson.steps.map(st => initStep(lesson, st)));
  const [countDraft, setCountDraft] = useState("");
  const [hintsOpen, setHintsOpen] = useState(() => new Set()); // per step, once opened it stays
  const [levelNotes, setLevelNotes] = useState([]);            // "at your level" lines, kept once said
  const [level, setLevel] = useState(null);                    // the network's move at the scored stop
  const [finished, setFinished] = useState(false);

  const step = lesson.steps[stepIdx];
  const state = states[stepIdx];
  const replay = step.type === "replay";
  const isLast = stepIdx === lesson.steps.length - 1;
  const solved = state.status === "solved";
  const canGoNext = solved || stepIdx < maxIdx;

  const dispatch = (action) =>
    setStates(all => all.map((s, i) => (i === stepIdx ? stepReducer(lesson, step, s, action) : s)));

  useEffect(() => { SESSIONS.set(lesson.id, { stepIdx, maxIdx, states }); }, [lesson.id, stepIdx, maxIdx, states]);

  // A scored stop is progress worth keeping, and the moment to ask the network
  // (only if it is already loaded: a lesson never starts the download).
  useEffect(() => {
    if (!replay || state.status !== "scored") return undefined;
    onProgress?.(lesson, { stops: state.stopsDone, score: state.score, total: 2 * step.stops.length });
    setLevel(null);
    if (!modelReady() || !rank) return undefined;
    const stopIdx = state.stopIdx - 1;
    let live = true;
    kataChooseMoveForRecord(recordAtStop(lesson, step, stopIdx), { ...profileForRank(rank), temperature: 0 })
      .then((res) => {
        if (!live || !res || !res.move) return;
        setLevel({ stopIdx, move: res.move });
        // Said once, kept for the rest of the step: the replay moves on, the line does not.
        setLevelNotes(ns => ns.some(n => n.stopIdx === stopIdx) ? ns : [...ns, {
          stopIdx,
          text: t("learn.levelNote", { rank, point: coordLabel(res.move[0], res.move[1], state.board.size) }),
        }]);
      })
      .catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay, state.status, state.stopsDone]);

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
    setLevel(null);
    setLevelNotes([]);
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
      <div className="stack lesson-player">
        <div className="row spread">
          <Btn icon={ChevronLeft} small onClick={onExit}>{exitWord}</Btn>
          <Pill icon={Check} tone="win">{t("learn.complete")}</Pill>
        </div>
        <div className="play-wrap">
          <Board board={state.board} sizePx={600} marks={marksFor(step, state)} lastMove={state.lastMove} disabled />
          <div className="side stack-sm">
            <Card className="lesson-card-body">
              <div className="prob-head">
                <span className="rank-chip">{lesson.rank}</span>
                <span className="theme-chip">{trackByKey(lesson.track)?.name}</span>
              </div>
              <h3 className="lesson-head">{lesson.title}</h3>
              {lesson.plain && <PullQuote size="sm">{lesson.plain}</PullQuote>}
              <p className="fine">{t("learn.taught")}</p>
              <ul className="recap">
                {learned.map((l, i) => (
                  <li key={i} className={l.shown ? "shown" : ""}>
                    {l.shown ? <Eye size={14} /> : <Check size={14} />}
                    <span>{l.text}</span>
                  </li>
                ))}
              </ul>
              {crossingNote(lesson, nextLesson, t) && (
                <p className="fine">{crossingNote(lesson, nextLesson, t)}</p>
              )}
              <div className="lesson-foot">
                <Btn icon={BookOpen} small onClick={onExit}>{exitWord}</Btn>
                {nextLesson && (
                  <Btn icon={ChevronRight} small primary onClick={() => onOpenNext(nextLesson)}>
                    {t("learn.nextLesson", { title: lessonField(nextLesson, "title", t) })}
                  </Btn>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const stop = replay ? step.stops[Math.min(state.stopIdx, step.stops.length - 1)] : null;
  const prompt = step.type === "count" ? step.question
    : replay && state.status === "open" ? stop.text
      : step.text;
  const hintText = replay ? (state.status === "open" ? stop?.hint : null) : step.hint;
  const showHint = !!hintText && !solved;
  const levelMark = level && replay && level.stopIdx === state.stopIdx - 1 && state.status === "scored"
    ? [{ c: level.move[0], r: level.move[1] }] : [];
  const resettable = !solved && !replay && step.type !== "info" && step.type !== "maxim";

  return (
    <div className="stack lesson-player">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>{exitWord}</Btn>
        <div className="row">
          {replay && (
            <Pill icon={FastForward}>
              {t("learn.stopPill", {
                at: Math.min(state.stopIdx + (state.status === "open" ? 1 : 0), step.stops.length),
                total: step.stops.length,
                score: state.score,
              })}
            </Pill>
          )}
          <nav className="step-rail" aria-label={t("learn.steps")}>
            {lesson.steps.map((_, i) => (
              <button key={i} type="button"
                className={`step-seg ${states[i].status === "solved" ? "done" : ""} ${i <= maxIdx ? "visited" : ""} ${i === stepIdx ? "current" : ""}`}
                onClick={() => i <= maxIdx && goto(i)}
                disabled={i > maxIdx}
                aria-current={i === stepIdx ? "step" : undefined}
                aria-label={t("learn.step", { n: i + 1, total: lesson.steps.length })} />
            ))}
          </nav>
        </div>
      </div>
      <div className="play-wrap">
        <Board
          board={state.board}
          sizePx={600}
          onPlay={(c, r) => dispatch({ type: "play", c, r })}
          marks={[...marksFor(step, state), ...levelMark]}
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
            <p className="fine step-count">{t("learn.step", { n: stepIdx + 1, total: lesson.steps.length })}</p>
            {step.type === "maxim" && (
              <>
                <blockquote className="maxim-line"><Quote size={14} /> {step.line}</blockquote>
                <p className="fine maxim-analogy">{step.analogy}</p>
              </>
            )}
            <p className="lesson-text">{prompt}</p>

            {showHint && (
              <div className="hint-block">
                <button type="button" className="hint-toggle" onClick={openHint}
                  disabled={hintOpen} aria-expanded={hintOpen}>
                  <Lightbulb size={14} /> <span>{t("learn.hint")}</span>
                </button>
                {hintOpen && <p className="fine hint-text">{hintText}</p>}
              </div>
            )}

            {step.type === "count" && !solved && (
              <div className="chat-row count-row">
                <input className="chat-input" inputMode="decimal" value={countDraft} placeholder={t("learn.countPlaceholder")}
                  aria-label={t("learn.countPlaceholder")}
                  onChange={e => setCountDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && dispatch({ type: "answer", value: countDraft })} />
                <button className="chat-send" onClick={() => dispatch({ type: "answer", value: countDraft })} aria-label={t("learn.check")}><Check size={15} /></button>
              </div>
            )}

            <div className={`log ${step.type === "info" || step.type === "maxim" ? "" : "reserve"}`} aria-live="polite">
              {state.log.map((entry, i) => <Response key={i} entry={entry} />)}
              {levelNotes.map(n => <Response key={`lvl${n.stopIdx}`} entry={{ tone: "commentary", text: n.text }} />)}
              {state.status === "await" && (
                <button type="button" className="log-next" onClick={() => dispatch({ type: "reply" })}>
                  <span>{t("learn.playReply")}</span> <ChevronRight size={14} />
                </button>
              )}
            </div>

            <div className="lesson-foot">
              <Btn icon={ChevronLeft} small onClick={back} disabled={stepIdx === 0}>{t("learn.back")}</Btn>
              <div className="row">
                {replay && state.status === "busy" && !state.refutation && (
                  <Btn icon={FastForward} small onClick={() => dispatch({ type: "advance" })}>{t("learn.nextMove")}</Btn>
                )}
                {state.status === "review" && (
                  <Btn icon={RotateCcw} small onClick={() => dispatch({ type: "reset" })}>{t("learn.tryAgain")}</Btn>
                )}
                {resettable && state.status !== "review" && (
                  <Btn icon={RotateCcw} small onClick={() => dispatch({ type: "reset" })} label={t("learn.resetPosition")} />
                )}
                {canReveal(step, state) && (
                  <Btn icon={Eye} small onClick={() => dispatch({ type: "reveal" })}>{t("learn.showMe")}</Btn>
                )}
                <Btn icon={isLast ? Check : ChevronRight} small primary onClick={next} disabled={!canGoNext}>
                  {t(isLast ? "learn.completeLesson" : "learn.continue")}
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
  const t = useT();
  return (
    <button className="neu-card lesson-card" onClick={() => onOpen(lesson)}>
      <div className="lesson-num">{lesson.rank}</div>
      <div className="lesson-meta">
        <h3>{lessonField(lesson, "title", t)}</h3>
        <p>{lessonField(lesson, "subtitle", t)}</p>
        <p className="lesson-chips"><Clock size={12} /> {t("learn.minutes", { min: lesson.minutes, track: trackByKey(lesson.track)?.name })}</p>
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
  const t = useT();
  const rows = BOOKS.map(b => ({ book: b, lessons: lessonsInBook(b.id), progress: bookProgressFor(profile, b.id) }));
  return (
    <div className="stack-sm shelf">
      <div className="stat-head track-head"><span>{t("learn.shelf.head")}</span><span className="fine track-trains">{t("learn.shelf.note")}</span></div>
      {rows.map(({ book, lessons, progress }) => (
        <Card key={book.id} inset className="shelf-book">
          <div className="resume-copy">
            <div className="stat-head"><BookOpen size={15} /><span>{book.name}</span>
              {progress.total > 0 && <span className="fine">{t("learn.shelf.pts", { score: progress.score, total: progress.total })}</span>}
            </div>
            <span className="fine">{book.blurb}</span>
            {lessons.length === 0 && <span className="fine">{book.note || t("learn.shelf.empty")}</span>}
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
/* Chapter eleven lists thirty-two names and no definitions. We show the list
   as the chapter gives it, and say plainly which ones we cannot match to a
   modern term rather than inventing one. See NAMES in content/classic.js. */
function NamesTable() {
  const t = useT();
  const known = NAMES.filter(n => n.sure).length;
  return (
    <div className="names-block">
      <div className="names-grid">
        {NAMES.map(n => (
          <div key={n.n} className={`name-cell ${n.sure ? "" : "unsure"}`}>
            <span className="name-word">{n.name}</span>
            <span className="name-modern">
              {n.sure ? n.modern : n.modern ? t("learn.names.uncertain", { modern: n.modern }) : t("learn.names.none")}
            </span>
            <span className="fine name-gloss">{n.text}</span>
          </div>
        ))}
      </div>
      <p className="fine">{t("learn.names.note", { known })}</p>
    </div>
  );
}

/* One chapter of the book: the prose, and the lessons that teach it. */
/* A passage with one idea pulled out of it: the paragraphs as the chapter
   gives them, and the plain-words line set large after the first, where a
   magazine would put it. Prose with no gloss is just paragraphs. */
function Prose({ text, plain }) {
  const at = Math.min(1, text.length - 1);
  return text.map((t, i) => (
    <Fragment key={i}>
      <p className="lesson-text">{t}</p>
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
  const t = useT();
  const [openList, setOpenList] = useState(false);
  const lessons = lessonsInSeries(CLASSIC.key);
  const finished = lessons.filter(l => done(l.id)).length;
  return (
    <Card inset className="stack-sm">
      <div className="stat-head"><Quote size={15} /><span>{CLASSIC.title}</span></div>
      <Statement lines={statementFor("learn")}>{plainFor("learn")}</Statement>
      <Passage context="learn" />
      <div className="row spread">
        <span className="fine">{t("learn.classic.read", { done: finished, total: lessons.length })}</span>
        <Btn icon={openList ? ChevronLeft : BookOpen} small onClick={() => setOpenList(o => !o)}>
          {t(openList ? "learn.classic.close" : "learn.classic.open")}
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
    </Card>
  );
}

/* ----------------------- LEARN (the library) ----------------------- */
export function LearnView({ profile, setProfile, go }) {
  const t = useT();
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
  /* Completing records the lesson but leaves the player mounted: it shows its own
     recap and offers the next lesson there, so the learner sees what the lesson
     taught before moving on. The session is dropped so a replay starts at step one. */
  const finish = (lesson) => {
    SESSIONS.delete(lesson.id);
    setProfile(p => {
      const np = {
        ...p,
        lessonsDone: [...new Set([...p.lessonsDone, lesson.id])],
        // Its questions join the recall queue, due tomorrow. A lesson is read
        // once; what it asked you comes back until you know it.
        recall: enrol(p.recall, lesson, dayKey()),
      };
      saveProfile(np);
      return np;
    });
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
  const recall = recallSummary(LIBRARY, profile.recall, dayKey());
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
      /* Every lesson leads to another one, across track, tier and rank; only the very
         last lesson in the library ends. The prerequisite gate still applies to the jump. */
      <LessonPlayer key={active} lesson={lesson} nextLesson={lessonAfter(lesson, profile)}
        rank={rankOf(profile.rating)} onProgress={progress}
        onExit={() => setActive(null)} onDone={() => finish(lesson)}
        onOpenNext={(l) => { setActive(null); open(l); }} />
    );
  }

  return (
    <div className="stack arrives">
      <ScreenHeader className="with-aside"
        label={t("learn.label")}
        title={<>{t("learn.titleBefore")}<em>{t("learn.titleEm")}</em>{t("learn.titleAfter")}</>}
        lede={t("learn.lede")}>
        <div className="chat-row search-row">
          <Search size={15} className="search-icon" />
          <input className="chat-input" value={query} placeholder={t("learn.searchPlaceholder")}
            aria-label={t("learn.searchLabel")} onChange={e => setQuery(e.target.value)} />
        </div>
      </ScreenHeader>
      <p className="lede">{t("learn.sub")}</p>

      {pending && (
        <Card inset className="resume-card">
          <div className="resume-copy">
            <div className="stat-head"><Lock size={15} /><span>{t("learn.gate.head", { title: lessonField(pending.lesson, "title", t) })}</span></div>
            <span className="fine">{t("learn.gate.body", { list: pending.missing.map(l => lessonField(l, "title", t)).join(", ") })}</span>
          </div>
          <div className="row">
            <Btn icon={Play} primary small onClick={() => { setPending(null); setActive(pending.missing[0].id); }}>{t("learn.gate.startWith", { title: lessonField(pending.missing[0], "title", t) })}</Btn>
            <Btn small onClick={() => { setPending(null); setActive(pending.lesson.id); }}>{t("learn.gate.anyway")}</Btn>
          </div>
        </Card>
      )}

      {/* What you have already read, asked back. It comes before Continue: a
          question that is due is worth more than the next lesson, because it is
          the one thing here that is about to be forgotten. */}
      {!searching && recall.due > 0 && go && (
        <Card inset className="resume-card">
          <div className="resume-copy">
            <div className="stat-head"><BrainCircuit size={15} /><span>{t("learn.recall.head")}</span></div>
            <strong>{t("learn.recall.review", { count: recall.session })}</strong>
            <span className="fine">{t("learn.recall.due", { due: recall.due, total: recall.total })}</span>
          </div>
          <Btn icon={BrainCircuit} primary small onClick={() => go("recall")}>{t("learn.recall.start")}</Btn>
        </Card>
      )}

      {!searching && continueLesson && (
        <Card inset className="resume-card">
          <div className="resume-copy">
            <div className="stat-head"><Play size={15} /><span>{t("learn.continueHead")}</span></div>
            <strong>{lessonField(continueLesson, "title", t)}</strong>
            <span className="fine">{t("learn.continueMeta", { rank: continueLesson.rank, min: continueLesson.minutes, track: trackByKey(continueLesson.track)?.name })}</span>
          </div>
          <Btn icon={Play} primary small onClick={() => open(continueLesson)}>{t("learn.recall.start")}</Btn>
        </Card>
      )}

      {!searching && <ClassicCard done={done} onOpen={open} />}

      <div className="library">
        {!searching && (
          <nav className="tier-rail" aria-label={t("learn.tiers")}>
            {TIERS.map(tr => {
              const ls = lessonsInTier(tr.id);
              const n = ls.filter(l => done(l.id)).length;
              return (
                <button key={tr.id} className={`tier-btn ${tr.id === tier ? "active" : ""}`}
                  onClick={() => setTier(tr.id)} aria-current={tr.id === tier ? "true" : undefined}>
                  <span className="tier-name">{t("learn.tierName", { id: tr.id, name: tr.name })}</span>
                  <span className="tier-sub">{ls.length
                    ? t("learn.tierSubDone", { ranks: tr.ranks, done: n, total: ls.length })
                    : t("learn.tierSub", { ranks: tr.ranks })}</span>
                </button>
              );
            })}
          </nav>
        )}
        <div className="stack tier-body">
          {!searching && (
            <div className="tier-head">
              <h3 className="prob-title">{tierInfo.name}</h3>
              <p className="fine">{t("learn.tierIdentity", {
                identity: tierInfo.identity, ranks: tierInfo.ranks,
                exit: tierInfo.exit ? t("learn.tierExit", { label: tierInfo.exit.label }) : t("learn.tierExitLater"),
              })}</p>
            </div>
          )}
          {grouped.length === 0 && (
            <Card inset><p className="fine">{t(searching ? "learn.emptySearch" : "learn.emptyTier")}</p></Card>
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
