/* ----------------------- LESSON STEP (pure) -----------------------
   The whole behaviour of one lesson step as a reducer over plain state, so
   the React player only schedules timers and draws. Actions:

     { type: "play", c, r }     learner clicked a point (quiz, sequence, choice)
     { type: "answer", value }  learner submitted a number (count)
     { type: "reply" }          timer: the scripted side answers (sequence)
     { type: "refute" }         timer: the scripted reply to a wrong move (quiz)
     { type: "reset" }          timer or button: back to the setup
     { type: "clearWrong" }     timer: drop the wrong-move marker

   A state may carry `pending: { ms, action }`; the player runs that action
   after `ms`. Nothing here touches React or timers. */
import { tryPlay, idx, opponent } from "../engine/index.js";
import { setupToBoard } from "../content/positions.js";

export const TIMINGS = { reply: 400, refuteHold: 1400, wrongHold: 900, verdictHold: 1600 };

export const VERDICT_LABELS = { best: "Best", fine: "Playable", poor: "Not this" };

const same = (p, c, r) => p.c === c && p.r === r;

export const DEFAULT_WRONG = "Not there. Look again.";
/** What to say after a wrong move: the step's own line, else its hint, else neutral. */
export const wrongTextFor = (step) => step.wrongText || step.hint || DEFAULT_WRONG;

export function initStep(lesson, step) {
  return {
    board: setupToBoard(step.setup, lesson.size),
    status: step.type === "info" ? "solved" : "open", // open | wrong | busy | solved
    flash: [], lastMove: null, wrong: null,
    message: null, tone: null,                        // tone: "success" | "hint" | "verdict"
    moveIdx: 0, verdict: null, pending: null,
  };
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
  state.status !== "open" || step.type === "info" || step.type === "count";

const placed = (state, res, c, r, extra = {}) => ({
  ...state, board: res.board, flash: res.captured, lastMove: idx(res.board.size, c, r), wrong: null, ...extra,
});

const wrong = (step, state, c, r) => ({
  ...state, status: "wrong", wrong: { c, r }, message: wrongTextFor(step), tone: "hint",
  pending: { ms: TIMINGS.wrongHold, action: { type: "clearWrong" } },
});

export function stepReducer(lesson, step, state, action) {
  switch (action.type) {
    case "reset": return initStep(lesson, step);
    case "clearWrong":
      return state.status === "wrong" ? { ...state, status: "open", wrong: null, message: null, tone: null, pending: null } : state;
    case "play": return play(step, state, action.c, action.r);
    case "answer": return answer(step, state, action.value);
    case "reply": return reply(step, state);
    case "refute": return refute(step, state);
    default: return state;
  }
}

function play(step, state, c, r) {
  if (state.status !== "open") return state;
  if (step.type === "quiz") {
    const res = tryPlay(state.board, c, r, step.toPlay);
    if (step.answers.some(a => same(a, c, r)) && res.ok) {
      return placed(state, res, c, r, { status: "solved", message: step.success, tone: "success", pending: null });
    }
    const rf = (step.refutations || []).find(x => same(x.move, c, r));
    if (rf && res.ok) {
      return placed(state, res, c, r, {
        status: "busy", refutation: rf, message: null,
        pending: { ms: TIMINGS.reply, action: { type: "refute" } },
      });
    }
    return wrong(step, state, c, r);
  }
  if (step.type === "sequence") {
    const expected = step.moves[state.moveIdx];
    const res = expected && same(expected, c, r) ? tryPlay(state.board, c, r, sideToMove(step, state)) : { ok: false };
    if (!res.ok) return wrong(step, state, c, r);
    const moveIdx = state.moveIdx + 1;
    const done = moveIdx >= step.moves.length;
    return placed(state, res, c, r, {
      moveIdx, message: done ? step.success : step.commentary[state.moveIdx], tone: done ? "success" : null,
      status: done ? "solved" : "busy",
      pending: done ? null : { ms: TIMINGS.reply, action: { type: "reply" } },
    });
  }
  if (step.type === "choice") {
    const opt = step.options.find(o => same(o.point, c, r));
    if (!opt) return state;
    const res = tryPlay(state.board, c, r, step.toPlay);
    if (!res.ok) return state;
    const best = opt.verdict === "best";
    return placed(state, res, c, r, {
      status: best ? "solved" : "busy", verdict: opt.verdict, message: opt.text, tone: best ? "success" : "verdict",
      pending: best ? null : { ms: TIMINGS.verdictHold, action: { type: "reset" } },
    });
  }
  return state;
}

function reply(step, state) {
  if (step.type !== "sequence" || state.status !== "busy") return state;
  const m = step.moves[state.moveIdx];
  if (!m) return { ...state, status: "solved", pending: null };
  const res = tryPlay(state.board, m.c, m.r, sideToMove(step, state));
  if (!res.ok) return { ...state, status: "solved", pending: null }; // verifier guarantees legality
  const moveIdx = state.moveIdx + 1;
  const done = moveIdx >= step.moves.length;
  return placed(state, res, m.c, m.r, {
    moveIdx, message: done ? step.success : step.commentary[state.moveIdx], tone: done ? "success" : null,
    status: done ? "solved" : "open", pending: null,
  });
}

function refute(step, state) {
  const rf = state.refutation;
  if (!rf || state.status !== "busy") return state;
  const res = tryPlay(state.board, rf.reply.c, rf.reply.r, opponent(step.toPlay));
  const next = res.ok ? placed(state, res, rf.reply.c, rf.reply.r) : state;
  return { ...next, message: rf.text, tone: "hint", pending: { ms: TIMINGS.refuteHold, action: { type: "reset" } } };
}

function answer(step, state, value) {
  if (step.type !== "count" || state.status === "solved") return state;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  const tol = step.tolerance ?? 0;
  if (Number.isFinite(n) && Math.abs(n - step.answer) <= tol) {
    return { ...state, status: "solved", message: step.success, tone: "success", wrong: null, pending: null };
  }
  return { ...state, status: "wrong", message: wrongTextFor(step), tone: "hint", wrong: null,
    pending: { ms: TIMINGS.wrongHold, action: { type: "clearWrong" } } };
}
