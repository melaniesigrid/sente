import { useState, useEffect, useMemo } from "react";
import { Check, X, Lightbulb, RotateCcw, ChevronRight, Eye, BrainCircuit, GraduationCap, CalendarClock } from "lucide-react";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, Statement } from "../components/ui.jsx";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { Passage } from "../components/Passage.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { useMokuFacts } from "../components/mokuStore.js";
import { LIBRARY, trackByKey } from "../content/library.js";
import { dayKey } from "../content/kata.js";
import { BOXES, SESSION_SIZE, dueCards, grade, recallSummary } from "../content/recall.js";
import { saveProfile } from "../store/profile.js";
import { initStep, stepReducer, marksFor, boardLocked, canReveal } from "./lessonStep.js";
import { Response } from "./Learn.jsx";
import { useT } from "../components/langStore.js";

/* ----------------------- RECALL -----------------------
   A sitting of up to five questions the learner has already answered once,
   drawn from the schedule in content/recall.js. The step behaviour is the
   library's own reducer, so a question asked here behaves exactly as it did
   in the lesson: the same refutations, the same hint, the same Show me.

   What is different is the grading, and what is left out. A card is recalled
   only when it is answered first try, unaided — a second guess is a card read
   off the board rather than remembered. And the lesson's teaching text stays
   behind: a question you are being asked to remember is not a question you
   are being told the answer to. The step's own prompt is all there is until
   the stone has landed. */

const reducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** A card's name: the lesson it came from, and which of that lesson's
 *  questions it is, since one lesson often sends several. */
const cardName = (card) =>
  (card.lesson.steps.filter(s => s.type === "quiz" || s.type === "choice").length > 1
    ? `${card.lesson.title}, question ${card.ordinal}`
    : card.lesson.title);

/** Plain words for how far away a card has just been pushed. The count is
 *  exact: rounding eight days up to a week would be telling the learner
 *  something the schedule is not going to do. */
const comesBack = (box) => {
  const days = BOXES[Math.min(box, BOXES.length - 1)];
  return days === 1 ? "tomorrow" : `in ${days} days`;
};

/** One card, played through the library's own step reducer. */
function CardPlayer({ card, n, of, onGraded }) {
  const { lesson, step } = card;
  const [state, setState] = useState(() => initStep(lesson, step));
  const [hintOpen, setHintOpen] = useState(false);
  const [graded, setGraded] = useState(null);

  const dispatch = (action) => setState(s => stepReducer(lesson, step, s, action));

  useEffect(() => {
    if (!state.pending) return undefined;
    const { ms, action } = state.pending;
    const t = setTimeout(() => dispatch(action), reducedMotion() ? 0 : ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pending]);

  // A miss opens the hint, the way it does in a lesson: nobody is left stuck.
  useEffect(() => { if (state.attempts > 0) setHintOpen(true); }, [state.attempts]);

  /* Solved is the moment the card is graded, and it is graded once. First try
     and unaided is a recall; anything else starts the card over. */
  useEffect(() => {
    if (state.status !== "solved" || graded !== null) return;
    const recalled = state.attempts === 0 && !state.revealed;
    setGraded(recalled);
    onGraded(card, recalled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const solved = state.status === "solved";
  return (
    <div className="play-wrap">
      <Board
        board={state.board}
        sizePx={600}
        onPlay={(c, r) => dispatch({ type: "play", c, r })}
        marks={marksFor(step, state)}
        wrong={state.wrong}
        lastMove={state.lastMove}
        disabled={boardLocked(step, state)}
        flash={state.flash} captured={state.flash} captureKey={state.moveIdx + (solved ? 50 : 0)}
      />
      <div className="side stack-sm">
        <Card className="lesson-card-body">
          <div className="prob-head">
            <span className="rank-chip">{lesson.rank}</span>
            <span className="theme-chip">{trackByKey(lesson.track)?.name}</span>
            <span className="theme-chip"><BrainCircuit size={11} /> card {n} of {of}</span>
          </div>
          {/* The lesson is named, never quoted: which lesson this came from is
              worth knowing, and its teaching text would be the answer. */}
          <h3 className="lesson-head">{lesson.title}</h3>
          <p className="lesson-text">{step.text}</p>

          {step.hint && !solved && (
            <div className="hint-block">
              <button type="button" className="hint-toggle" onClick={() => setHintOpen(true)}
                disabled={hintOpen} aria-expanded={hintOpen}>
                <Lightbulb size={14} /> <span>Hint</span>
              </button>
              {hintOpen && <p className="fine hint-text">{step.hint}</p>}
            </div>
          )}

          <div className="log reserve" aria-live="polite">
            {state.log.map((entry, i) => <Response key={i} entry={entry} />)}
          </div>

          <div className="lesson-foot">
            {graded === null ? <span /> : (
              <span className={`fine ${graded ? "success-row" : "wrong-row"}`}>
                {graded ? <Check size={14} /> : <X size={14} />}
                {graded ? `Recalled. Back ${comesBack(card.box + 1)}.` : `Back ${comesBack(0)}, from the first box.`}
              </span>
            )}
            <div className="row">
              {state.status === "review" && (
                <Btn icon={RotateCcw} small onClick={() => dispatch({ type: "reset" })}>Try again</Btn>
              )}
              {canReveal(step, state) && (
                <Btn icon={Eye} small onClick={() => dispatch({ type: "reveal" })}>Show me</Btn>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ----------------------- THE SITTING ----------------------- */
export function RecallView({ profile, setProfile, go }) {
  const t = useT();
  const today = dayKey();
  /* The five are chosen once, as the sitting opens. Grading rewrites the
     schedule underneath, and a queue that re-sorted itself after every answer
     would move the card the learner is looking at. */
  const [cards] = useState(() => dueCards(LIBRARY, profile.recall, today, SESSION_SIZE));
  const [i, setI] = useState(0);
  const [results, setResults] = useState([]);
  const summary = useMemo(() => recallSummary(LIBRARY, profile.recall, today), [profile.recall, today]);
  useMokuFacts({ view: "recall", seed: cards.length });

  const onGraded = (card, recalled) => {
    setResults(rs => (rs.some(r => r.key === card.key) ? rs : [...rs, { key: card.key, recalled, card }]));
    setProfile(p => {
      const np = { ...p, recall: grade(p.recall, card.key, recalled, today) };
      saveProfile(np);
      return np;
    });
  };

  const header = (
    <ScreenHeader
      label="Recall"
      title={<>Remember it <em>cold</em>.</>}
      lede="Questions you have answered before, asked again at widening intervals. A lesson
            is read once; a question is answered until it is known." />
  );

  if (!cards.length) {
    return (
      <div className="stack arrives">
        {header}
        <Statement lines={statementFor("recall", t)}>{plainFor("recall", t)}</Statement>
        <Card inset className="resume-card">
          <div className="resume-copy">
            <div className="stat-head"><CalendarClock size={15} /><span>Nothing due today</span></div>
            <span className="fine">
              {summary.total === 0
                ? "Finish a lesson and its questions join the queue. Nothing is asked back on the day it was answered."
                : `${summary.total} ${summary.total === 1 ? "card is" : "cards are"} waiting their turn${summary.nextIn === null ? "" : `; the next comes back ${summary.nextIn <= 1 ? "tomorrow" : `in ${summary.nextIn} days`}`}.`}
            </span>
          </div>
          <Btn icon={GraduationCap} primary small onClick={() => go("learn")}>The library</Btn>
        </Card>
        <Passage context="learn" />
      </div>
    );
  }

  if (i >= cards.length) {
    const kept = results.filter(r => r.recalled).length;
    return (
      <div className="stack arrives">
        {header}
        <Card className="lesson-card-body">
          <div className="row spread">
            <h3 className="lesson-head">{kept} of {results.length} recalled</h3>
            <Pill icon={Check} tone={kept === results.length ? "win" : undefined}>Sitting done</Pill>
          </div>
          <p className="lesson-text">
            {kept === results.length
              ? "Every one, first try. They all move a box further out."
              : "The ones you worked out start again at a day. That is what they are for: a question you had to reason through is a question that has not settled yet."}
          </p>
          <ul className="recap">
            {results.map(r => (
              <li key={r.key} className={r.recalled ? "" : "shown"}>
                {r.recalled ? <Check size={14} /> : <RotateCcw size={14} />}
                <span>{cardName(r.card)} — back {r.recalled ? comesBack(r.card.box + 1) : comesBack(0)}</span>
              </li>
            ))}
          </ul>
          <div className="lesson-foot">
            <Btn icon={GraduationCap} small onClick={() => go("learn")}>The library</Btn>
            <Btn icon={ChevronRight} small primary onClick={() => go("home")}>Done</Btn>
          </div>
        </Card>
      </div>
    );
  }

  const card = cards[i];
  return (
    <div className="stack arrives">
      {header}
      <CardPlayer key={card.key} card={card} n={i + 1} of={cards.length} onGraded={onGraded} />
      <div className="row spread">
        <span className="fine">{summary.due} due today · {summary.known} known cold · {summary.total} in the queue</span>
        <Btn icon={ChevronRight} small primary
          disabled={!results.some(r => r.key === card.key)}
          onClick={() => setI(n => n + 1)}>
          {i === cards.length - 1 ? "Finish" : "Next card"}
        </Btn>
      </div>
    </div>
  );
}
