/* ----------------------- LESSON STEP (pure) -----------------------
   The whole behaviour of one lesson step as a reducer over plain state, so
   the React player only schedules timers and draws. Actions:

     { type: "play", c, r }     learner clicked a point (quiz, sequence, choice, replay)
     { type: "answer", value }  learner submitted a number (count)
     { type: "reply" }          the scripted side answers (sequence): a timer on
                                short steps, the learner's own click on long ones
     { type: "refute" }         timer: the scripted punishment lands
     { type: "reset" }          button: back to the setup, keeping what was said
     { type: "clearWrong" }     timer: drop the wrong-move marker
     { type: "advance" }        timer or button: the next scripted move (replay)
     { type: "reveal" }         button: play the answer out after two misses

   A state may carry `pending: { ms, action }`; the player runs that action
   after `ms`.

   Everything the lesson says goes into `log`, an ordered list of
   { tone, text, verdict? } that only grows within a step. Timers move stones;
   they never take words away. The log is cleared by leaving the step, not by
   a clock and not by Reset position — a learner retrying a refuted move keeps
   the refutation in front of them while they try again.

   A `replay` step is a game study: the board plays through `moves` on its
   own ("busy", advancing every TIMINGS.advance ms) and stops where `stops`
   says. At a stop the learner places a stone: the master's move (`answers`)
   scores 2, a strong player's move (`strong`, precomputed data) scores 1 with
   the master's move then shown, a listed refutation is played out and ends in
   "review" (Try again returns to the stop), anything else is wrong. The
   scored stop is status "scored" until the replay resumes, so a stop can
   never be scored twice: `moveIdx` and `stopIdx` only move forward. The stop's
   own question stays in the step text; only what came of the learner's move
   goes in the log. A `maxim` step is an info step carrying a line and its
   plain-words analogy.

   Nothing here touches React or timers. */
import { tryPlay, idx, opponent, createGame, play as playRec } from "../engine/index.js";
import { setupToBoard } from "../content/positions.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/* reply: long enough to read the line that prompted it. wrongHold: how long the
   red cross stays on the board — the correction itself stays in the log. */
export const TIMINGS = { reply: 600, wrongHold: 900, advance: 250, afterScore: 1100 };
export const SCORE = { master: 2, strong: 1 };
export const DEFAULT_PARTIAL = "A strong player's move, not his.";

/* A sequence this long or longer waits for the learner instead of a timer. */
export const GATE_FROM = 4;

/* Misses on one step before "Show me" appears. Nobody gets stuck. */
export const REVEAL_AFTER = 2;

export const VERDICT_LABELS = { best: "Best", fine: "Playable", poor: "Not this" };

/** The verdict chip beside a choice, in the reader's language. The keys are
 *  the verdicts the lessons already write, so a catalogue that has not reached
 *  this screen shows the English above rather than a blank chip. */
export const verdictLabel = (verdict, t = EN) =>
  t(`learn.verdict.${verdict}`, null, VERDICT_LABELS[verdict] || "");

/** Step types that are read, not solved. */
const TOLD = (type) => type === "info" || type === "maxim";

const same = (p, c, r) => p.c === c && p.r === r;

export const DEFAULT_WRONG = "Not there. Look again.";
/* What to say after a wrong move. A step that wrote its own line gets it; every
   other one gets the neutral line and the player opens the hint instead, so the
   learner is never told the same sentence twice in two places. */
export const wrongTextFor = (step) => step.wrongText || DEFAULT_WRONG;

/** The lesson as the player should hand it to the reducer: the author's words
 *  wherever they wrote any, and the house's two fallback lines in the reader's
 *  language wherever they did not. Filling them here rather than inside the
 *  reducer is what lets the reducer stay a pure function of its step: it never
 *  reaches for a language, because by the time it sees a step every word it
 *  might say is already on it. */
export function withHouseWords(lesson, t = EN) {
  const wrong = t("learn.wrongText", null, DEFAULT_WRONG);
  const partial = t("learn.partial", null, DEFAULT_PARTIAL);
  if (wrong === DEFAULT_WRONG && partial === DEFAULT_PARTIAL) return lesson;
  return {
    ...lesson,
    steps: lesson.steps.map(step => ({
      ...step,
      wrongText: step.wrongText || wrong,
      ...(step.stops
        ? { stops: step.stops.map(stop => ({ ...stop, partial: stop.partial || partial })) }
        : null),
    })),
  };
}

export function initStep(lesson, step) {
  const base = {
    board: setupToBoard(step.setup, lesson.size),
    status: TOLD(step.type) ? "solved" : "open", // open | wrong | busy | await | review | scored | solved
    flash: [], lastMove: null, wrong: null,
    log: [],                                     // { tone, text, verdict? }, oldest first
    moveIdx: 0, verdict: null, pending: null,
    attempts: 0, attemptsAt: null, revealed: false, refutation: null,
  };
  if (step.type !== "replay") return base;
  return settle(step, { ...base, stopIdx: 0, score: 0, stopsDone: 0, guess: null, done: false });
}

/** Reset position: the stones go back, the transcript stays. */
export function resetStep(lesson, step, state) {
  return {
    ...initStep(lesson, step),
    log: state.log, attempts: state.attempts, attemptsAt: state.attemptsAt, revealed: state.revealed,
  };
}

/* Misses are counted per step, but a replay is many puzzles in one step, so there
   they are counted per stop: arriving at a new stop starts the count over, and
   Try again at the same stop carries it on. `at` is the stop, or null elsewhere. */
const counted = (state, at) => (state.attemptsAt === at ? state.attempts + 1 : 1);

/** Append a line, ignoring an immediate repeat of the same line. */
function say(state, tone, text, verdict) {
  if (!text) return state;
  const last = state.log[state.log.length - 1];
  if (last && last.tone === tone && last.text === text) return state;
  return { ...state, log: [...state.log, verdict ? { tone, text, verdict } : { tone, text }] };
}

/** The colour of replay move `i`: alternating from the step's `toPlay`. */
export const replayColor = (step, i) => (i % 2 === 0 ? step.toPlay : opponent(step.toPlay));

/** Where a replay stands after a move has been played: at a stop (open), at the end
 *  (solved), or between (busy, advancing on a timer). */
function settle(step, state) {
  const stop = step.stops[state.stopIdx];
  if (state.moveIdx >= step.moves.length) {
    return say({ ...state, status: "solved", done: true, pending: null }, "success", step.success);
  }
  if (stop && stop.at === state.moveIdx) {
    // The stop's question is the step text, not a log line: it is asked, not said.
    return { ...state, status: "open", pending: null, guess: null };
  }
  return { ...state, status: "busy", pending: { ms: TIMINGS.advance, action: { type: "advance" } } };
}

/** Back to the current stop of a replay, keeping the score and the transcript. */
function resetToStop(lesson, step, state) {
  const stop = step.stops[state.stopIdx];
  let s = {
    ...initStep(lesson, step),
    stopIdx: state.stopIdx, score: state.score, stopsDone: state.stopsDone,
    log: state.log, attempts: state.attempts, attemptsAt: state.attemptsAt, revealed: state.revealed,
    status: "busy", pending: null,
  };
  s.board = setupToBoard(step.setup, lesson.size);
  s.moveIdx = 0;
  const upTo = stop ? stop.at : step.moves.length;
  for (let i = 0; i < upTo; i++) {
    const m = step.moves[i];
    const res = tryPlay(s.board, m.c, m.r, replayColor(step, i));
    if (!res.ok) break;                              // the verifier guarantees legality
    s = placed(s, res, m.c, m.r, { moveIdx: i + 1 });
  }
  return settle(step, { ...s, flash: [] });
}

/** The GameRecord at a replay stop, for asking the network what a player of the
 *  learner's rank tends to play there. */
export function recordAtStop(lesson, step, stopIdx) {
  const toPair = (ps) => (ps || []).map((p) => [p.c, p.r]);
  let rec = createGame({ size: step.setup.size || lesson.size, setup: { b: toPair(step.setup.b), w: toPair(step.setup.w) }, toPlay: step.toPlay });
  const stop = step.stops[stopIdx];
  const upTo = stop ? stop.at : step.moves.length;
  for (let i = 0; i < upTo; i++) rec = playRec(rec, step.moves[i].c, step.moves[i].r, replayColor(step, i));
  return rec;
}

const LETTERS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
/** "D4"-style label for a point: letters skip I, rows count from the bottom. */
export const coordLabel = (c, r, N) => `${LETTERS[c]}${N - r}`;

/** Which colour the learner plays in this step (sequence alternates from toPlay). */
export const sideToMove = (step, state) =>
  step.type === "sequence" && state.moveIdx % 2 === 1 ? opponent(step.toPlay) : step.toPlay;

/** Marks the board should show for this step. */
export function marksFor(step, state = null) {
  if (step.type === "choice") return step.options.map(o => o.point);
  if (step.type === "replay") return state && state.guess ? [state.guess] : [];
  return step.marks || [];
}

export const boardLocked = (step, state) =>
  (state.status !== "open" && state.status !== "review") || TOLD(step.type) || step.type === "count";

/** A sequence long enough that the scripted answer waits for a click. */
export const isGated = (step) => step.type === "sequence" && step.moves.length >= GATE_FROM;

/** After two misses, the learner may have the answer played out. A replay reveals
 *  one stop at a time, so it must be standing at one. */
export const canReveal = (step, state) => {
  if (TOLD(step.type) || state.status === "solved") return false;
  if (step.type === "replay") {
    return state.status === "open" && state.attemptsAt === state.stopIdx && state.attempts >= REVEAL_AFTER;
  }
  return state.attempts >= REVEAL_AFTER;
};

const placed = (state, res, c, r, extra = {}) => ({
  ...state, board: res.board, flash: res.captured, lastMove: idx(res.board.size, c, r), wrong: null, ...extra,
});

const missed = (step, state, c, r, at = null) => say({
  ...state, status: "wrong", wrong: { c, r }, attempts: counted(state, at), attemptsAt: at,
  pending: { ms: TIMINGS.wrongHold, action: { type: "clearWrong" } },
}, "correction", wrongTextFor(step));

export function stepReducer(lesson, step, state, action) {
  switch (action.type) {
    case "reset": return step.type === "replay" ? resetToStop(lesson, step, state) : resetStep(lesson, step, state);
    case "advance": return advance(step, state);
    case "clearWrong":
      // The cross comes off the board; what it was told stays in the log.
      return state.status === "wrong"
        ? { ...state, status: "open", wrong: null, pending: null }
        : state;
    case "play": return play(lesson, step, state, action.c, action.r);
    case "answer": return answer(step, state, action.value);
    case "reply": return reply(step, state);
    case "refute": return refute(step, state);
    case "reveal": return reveal(lesson, step, state);
    default: return state;
  }
}

function play(lesson, step, state, c, r) {
  if (state.status === "review") {
    return step.type === "replay" ? resetToStop(lesson, step, state) : resetStep(lesson, step, state);
  }
  if (state.status !== "open") return state;
  if (step.type === "replay") return guess(step, state, c, r);
  if (step.type === "quiz") {
    const res = tryPlay(state.board, c, r, step.toPlay);
    if (step.answers.some(a => same(a, c, r)) && res.ok) {
      return say(placed(state, res, c, r, { status: "solved", pending: null }), "success", step.success);
    }
    const rf = (step.refutations || []).find(x => same(x.move, c, r));
    if (rf && res.ok) {
      // Say why it fails as the stone lands, then let the punishment arrive
      // underneath the words rather than after a silent gap.
      return say(placed(state, res, c, r, {
        status: "busy", refutation: rf, attempts: counted(state, null), attemptsAt: null,
        pending: { ms: TIMINGS.reply, action: { type: "refute" } },
      }), "correction", rf.text);
    }
    return missed(step, state, c, r);
  }
  if (step.type === "sequence") {
    const expected = step.moves[state.moveIdx];
    const res = expected && same(expected, c, r) ? tryPlay(state.board, c, r, sideToMove(step, state)) : { ok: false };
    if (!res.ok) return missed(step, state, c, r);
    return stepOn(step, placed(state, res, c, r), true);
  }
  if (step.type === "choice") {
    const opt = step.options.find(o => same(o.point, c, r));
    if (!opt) return state;
    const res = tryPlay(state.board, c, r, step.toPlay);
    if (!res.ok) return state;
    const best = opt.verdict === "best";
    return say(placed(state, res, c, r, {
      status: best ? "solved" : "review", verdict: opt.verdict, pending: null,
      attempts: best ? state.attempts : counted(state, null), attemptsAt: null,
    }), best ? "success" : "verdict", opt.text, best ? undefined : opt.verdict);
  }
  return state;
}

/* One move of a sequence has just landed. Say its line, then either hand the
   board back, wait for the learner, or let the scripted reply come. */
function stepOn(step, state, byLearner) {
  const moveIdx = state.moveIdx + 1;
  const done = moveIdx >= step.moves.length;
  const withLine = say({ ...state, moveIdx }, "commentary", step.commentary?.[state.moveIdx]);
  if (done) return say({ ...withLine, status: "solved", pending: null }, "success", step.success);
  if (!byLearner) return { ...withLine, status: "open", pending: null };
  if (isGated(step)) return { ...withLine, status: "await", pending: null };
  return { ...withLine, status: "busy", pending: { ms: TIMINGS.reply, action: { type: "reply" } } };
}

/** Replay: the learner's stone at a stop. */
function guess(step, state, c, r) {
  const stop = step.stops[state.stopIdx];
  const color = replayColor(step, state.moveIdx);
  const res = tryPlay(state.board, c, r, color);
  if (!res.ok) return missed(stop, state, c, r, state.stopIdx);
  const after = { stopIdx: state.stopIdx + 1, stopsDone: state.stopsDone + 1, status: "scored", pending: { ms: TIMINGS.afterScore, action: { type: "advance" } } };
  if (stop.answers.some(a => same(a, c, r))) {
    // His move: the stone stays and the replay continues from it.
    return say(placed(state, res, c, r, { ...after, moveIdx: state.moveIdx + 1, score: state.score + SCORE.master, guess: null }),
      "success", stop.success);
  }
  if ((stop.strong || []).some(a => same(a, c, r))) {
    // A strong player's move: marked, not placed; his own move follows on the timer.
    return say({ ...state, ...after, score: state.score + SCORE.strong, verdict: "fine", guess: { c, r }, wrong: null },
      "verdict", stop.partial || DEFAULT_PARTIAL, "fine");
  }
  const rf = (stop.refutations || []).find(x => same(x.move, c, r));
  if (rf) {
    return say(placed(state, res, c, r, {
      status: "busy", refutation: rf, attempts: counted(state, state.stopIdx), attemptsAt: state.stopIdx,
      pending: { ms: TIMINGS.reply, action: { type: "refute" } },
    }), "correction", rf.text);
  }
  return missed(stop, state, c, r, state.stopIdx);
}

/** Replay: the next scripted move, when the board is playing itself. */
function advance(step, state) {
  if (step.type !== "replay" || (state.status !== "busy" && state.status !== "scored")) return state;
  const m = step.moves[state.moveIdx];
  if (!m) return settle(step, state);
  const res = tryPlay(state.board, m.c, m.r, replayColor(step, state.moveIdx));
  if (!res.ok) return { ...state, status: "solved", done: true, pending: null };   // verifier guarantees legality
  return settle(step, placed(state, res, m.c, m.r, { moveIdx: state.moveIdx + 1, guess: null }));
}

function reply(step, state) {
  if (step.type !== "sequence" || (state.status !== "busy" && state.status !== "await")) return state;
  const m = step.moves[state.moveIdx];
  if (!m) return { ...state, status: "solved", pending: null };
  const res = tryPlay(state.board, m.c, m.r, sideToMove(step, state));
  if (!res.ok) return { ...state, status: "solved", pending: null }; // verifier guarantees legality
  return stepOn(step, placed(state, res, m.c, m.r), false);
}

function refute(step, state) {
  const rf = state.refutation;
  if (!rf || state.status !== "busy") return state;
  const replier = step.type === "replay" ? opponent(replayColor(step, state.moveIdx)) : opponent(step.toPlay);
  const res = rf.reply ? tryPlay(state.board, rf.reply.c, rf.reply.r, replier) : { ok: false };
  const next = res.ok ? placed(state, res, rf.reply.c, rf.reply.r) : state;
  return { ...next, status: "review", pending: null };
}

function answer(step, state, value) {
  if (step.type !== "count" || state.status === "solved") return state;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  const tol = step.tolerance ?? 0;
  if (Number.isFinite(n) && Math.abs(n - step.answer) <= tol) {
    return say({ ...state, status: "solved", wrong: null, pending: null }, "success", step.success);
  }
  return say({
    ...state, status: "wrong", wrong: null, attempts: counted(state, null), attemptsAt: null,
    pending: { ms: TIMINGS.wrongHold, action: { type: "clearWrong" } },
  }, "correction", wrongTextFor(step));
}

/* Show me: play the answer out, saying every line on the way. The step ends
   solved so the lesson can continue, but `revealed` stays true so the recap
   can be honest about it. A replay reveals only the stop it is standing at,
   and scores nothing for it. */
function reveal(lesson, step, state) {
  if (step.type === "replay") {
    const stop = step.stops[state.stopIdx];
    const a = stop?.answers?.[0];
    if (!a) return state;
    const res = tryPlay(state.board, a.c, a.r, replayColor(step, state.moveIdx));
    if (!res.ok) return state;
    return say(placed(state, res, a.c, a.r, {
      stopIdx: state.stopIdx + 1, stopsDone: state.stopsDone + 1, moveIdx: state.moveIdx + 1,
      status: "scored", revealed: true, guess: null,
      pending: { ms: TIMINGS.afterScore, action: { type: "advance" } },
    }), "success", stop.success);
  }
  const base = {
    ...initStep(lesson, step),
    log: state.log, attempts: state.attempts, attemptsAt: state.attemptsAt, revealed: true,
  };
  if (step.type === "quiz") {
    const a = step.answers[0];
    const res = tryPlay(base.board, a.c, a.r, step.toPlay);
    const next = res.ok ? placed(base, res, a.c, a.r) : base;
    return say({ ...next, status: "solved", pending: null }, "success", step.success);
  }
  if (step.type === "choice") {
    const opt = step.options.find(o => o.verdict === "best") || step.options[0];
    const res = tryPlay(base.board, opt.point.c, opt.point.r, step.toPlay);
    const next = res.ok ? placed(base, res, opt.point.c, opt.point.r) : base;
    return say({ ...next, status: "solved", verdict: opt.verdict, pending: null }, "success", opt.text);
  }
  if (step.type === "sequence") {
    let s = { ...base, status: "busy" };
    for (let i = 0; i < step.moves.length; i++) {
      const m = step.moves[i];
      const res = tryPlay(s.board, m.c, m.r, sideToMove(step, s));
      if (!res.ok) break;
      s = stepOn(step, placed(s, res, m.c, m.r), false);
    }
    return { ...s, status: "solved", pending: null };
  }
  if (step.type === "count") {
    const said = say(base, "commentary", `The count is ${step.answer}.`);
    return say({ ...said, status: "solved", pending: null }, "success", step.success);
  }
  return base;
}
