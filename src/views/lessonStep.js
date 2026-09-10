/* ----------------------- LESSON STEP (pure) -----------------------
   The whole behaviour of one lesson step as a reducer over plain state, so
   the React player only schedules timers and draws. Actions:

     { type: "play", c, r }     learner clicked a point (quiz, sequence, choice)
     { type: "answer", value }  learner submitted a number (count)
     { type: "reply" }          the scripted side answers (sequence): a timer on
                                short steps, the learner's own click on long ones
     { type: "refute" }         timer: the scripted punishment lands (quiz)
     { type: "reset" }          button: back to the setup, keeping what was said
     { type: "clearWrong" }     timer: drop the wrong-move marker
     { type: "reveal" }         button: play the answer out after two misses

   A state may carry `pending: { ms, action }`; the player runs that action
   after `ms`.

   Everything the lesson says goes into `log`, an ordered list of
   { tone, text, verdict? } that only grows within a step. Timers move stones;
   they never take words away. The log is cleared by leaving the step, not by
   a clock and not by Reset position — a learner retrying a refuted move keeps
   the refutation in front of them while they try again.

   Nothing here touches React or timers. */
import { tryPlay, idx, opponent } from "../engine/index.js";
import { setupToBoard } from "../content/positions.js";

/* reply: long enough to read the line that prompted it. wrongHold: how long the
   red cross stays on the board — the correction itself stays in the log. */
export const TIMINGS = { reply: 600, wrongHold: 900 };

/* A sequence this long or longer waits for the learner instead of a timer. */
export const GATE_FROM = 4;

/* Misses on one step before "Show me" appears. Nobody gets stuck. */
export const REVEAL_AFTER = 2;

export const VERDICT_LABELS = { best: "Best", fine: "Playable", poor: "Not this" };

const same = (p, c, r) => p.c === c && p.r === r;

export const DEFAULT_WRONG = "Not there. Look again.";
/* What to say after a wrong move. A step that wrote its own line gets it; every
   other step gets the neutral one and the player opens the hint instead, so the
   learner is never told the same sentence twice in two places. */
export const wrongTextFor = (step) => step.wrongText || DEFAULT_WRONG;

export function initStep(lesson, step) {
  return {
    board: setupToBoard(step.setup, lesson.size),
    status: step.type === "info" ? "solved" : "open", // open | wrong | busy | await | review | solved
    flash: [], lastMove: null, wrong: null,
    log: [],                                          // { tone, text, verdict? }, oldest first
    moveIdx: 0, verdict: null, pending: null,
    attempts: 0, revealed: false, refutation: null,
  };
}

/** Reset position: the stones go back, the transcript stays. */
export function resetStep(lesson, step, state) {
  return { ...initStep(lesson, step), log: state.log, attempts: state.attempts, revealed: state.revealed };
}

/** Append a line, ignoring an immediate repeat of the same line. */
function say(state, tone, text, verdict) {
  if (!text) return state;
  const last = state.log[state.log.length - 1];
  if (last && last.tone === tone && last.text === text) return state;
  return { ...state, log: [...state.log, verdict ? { tone, text, verdict } : { tone, text }] };
}

/** Which colour the learner plays in this step (sequence alternates from toPlay). */
export const sideToMove = (step, state) =>
  step.type === "sequence" && state.moveIdx % 2 === 1 ? opponent(step.toPlay) : step.toPlay;

/** Marks the board should show for this step. */
export function marksFor(step) {
  if (step.type === "choice") return step.options.map(o => o.point);
  return step.marks || [];
}

export const boardLocked = (step, state) =>
  (state.status !== "open" && state.status !== "review") || step.type === "info" || step.type === "count";

/** A sequence long enough that the scripted answer waits for a click. */
export const isGated = (step) => step.type === "sequence" && step.moves.length >= GATE_FROM;

/** After two misses on a step, the learner may have the answer played out. */
export const canReveal = (step, state) =>
  step.type !== "info" && state.status !== "solved" && state.attempts >= REVEAL_AFTER;

const placed = (state, res, c, r, extra = {}) => ({
  ...state, board: res.board, flash: res.captured, lastMove: idx(res.board.size, c, r), wrong: null, ...extra,
});

const missed = (step, state, c, r) => say({
  ...state, status: "wrong", wrong: { c, r }, attempts: state.attempts + 1,
  pending: { ms: TIMINGS.wrongHold, action: { type: "clearWrong" } },
}, "correction", wrongTextFor(step));

export function stepReducer(lesson, step, state, action) {
  switch (action.type) {
    case "reset": return resetStep(lesson, step, state);
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
  if (state.status === "review") return resetStep(lesson, step, state);
  if (state.status !== "open") return state;
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
        status: "busy", refutation: rf, attempts: state.attempts + 1,
        pending: { ms: TIMINGS.reply, action: { type: "refute" } },
      }), "correction", rf.text);
    }
    return missed(step, state, c, r);
  }
  if (step.type === "sequence") {
    const expected = step.moves[state.moveIdx];
    const res = expected && same(expected, c, r) ? tryPlay(state.board, c, r, sideToMove(step, state)) : { ok: false };
    if (!res.ok) return missed(step, state, c, r);
    return advance(step, placed(state, res, c, r), true);
  }
  if (step.type === "choice") {
    const opt = step.options.find(o => same(o.point, c, r));
    if (!opt) return state;
    const res = tryPlay(state.board, c, r, step.toPlay);
    if (!res.ok) return state;
    const best = opt.verdict === "best";
    return say(placed(state, res, c, r, {
      status: best ? "solved" : "review", verdict: opt.verdict, pending: null,
      attempts: best ? state.attempts : state.attempts + 1,
    }), best ? "success" : "verdict", opt.text, best ? undefined : opt.verdict);
  }
  return state;
}

/* One move of a sequence has just landed. Say its line, then either hand the
   board back, wait for the learner, or let the scripted reply come. */
function advance(step, state, byLearner) {
  const moveIdx = state.moveIdx + 1;
  const done = moveIdx >= step.moves.length;
  const withLine = say({ ...state, moveIdx }, "commentary", step.commentary?.[state.moveIdx]);
  if (done) return say({ ...withLine, status: "solved", pending: null }, "success", step.success);
  if (!byLearner) return { ...withLine, status: "open", pending: null };
  if (isGated(step)) return { ...withLine, status: "await", pending: null };
  return { ...withLine, status: "busy", pending: { ms: TIMINGS.reply, action: { type: "reply" } } };
}

function reply(step, state) {
  if (step.type !== "sequence" || (state.status !== "busy" && state.status !== "await")) return state;
  const m = step.moves[state.moveIdx];
  if (!m) return { ...state, status: "solved", pending: null };
  const res = tryPlay(state.board, m.c, m.r, sideToMove(step, state));
  if (!res.ok) return { ...state, status: "solved", pending: null }; // verifier guarantees legality
  return advance(step, placed(state, res, m.c, m.r), false);
}

function refute(step, state) {
  const rf = state.refutation;
  if (!rf || state.status !== "busy") return state;
  const res = tryPlay(state.board, rf.reply.c, rf.reply.r, opponent(step.toPlay));
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
    ...state, status: "wrong", wrong: null, attempts: state.attempts + 1,
    pending: { ms: TIMINGS.wrongHold, action: { type: "clearWrong" } },
  }, "correction", wrongTextFor(step));
}

/* Show me: play the answer out from the setup, saying every line on the way.
   The step ends solved so the lesson can continue, but `revealed` stays true
   so the recap can be honest about it. */
function reveal(lesson, step, state) {
  const base = { ...initStep(lesson, step), log: state.log, attempts: state.attempts, revealed: true };
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
      s = advance(step, placed(s, res, m.c, m.r), false);
    }
    return { ...s, status: "solved", pending: null };
  }
  if (step.type === "count") {
    const said = say(base, "commentary", `The count is ${step.answer}.`);
    return say({ ...said, status: "solved", pending: null }, "success", step.success);
  }
  return base;
}
