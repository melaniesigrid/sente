/* ----------------------- LESSON STEP (pure) -----------------------
   The whole behaviour of one lesson step as a reducer over plain state, so
   the React player only schedules timers and draws. Actions:

     { type: "play", c, r }     learner clicked a point (quiz, sequence, choice)
     { type: "answer", value }  learner submitted a number (count)
     { type: "reply" }          timer: the scripted side answers (sequence)
     { type: "refute" }         timer: the scripted reply to a wrong move (quiz)
     { type: "reset" }          timer or button: back to the setup
     { type: "clearWrong" }     timer: drop the wrong-move marker
     { type: "advance" }        timer or button: the next scripted move (replay)

   A state may carry `pending: { ms, action }`; the player runs that action
   after `ms`. A refutation or a non-best verdict ends in status "review":
   the text stays until the learner clicks the board or Try again, which
   resets the step. Nothing here touches React or timers.

   A `replay` step is a game study: the board plays through `moves` on its
   own ("busy", advancing every TIMINGS.advance ms) and stops where `stops`
   says. At a stop the learner places a stone: the master's move (`answers`)
   scores 2, a strong player's move (`strong`, precomputed data) scores 1 with
   the master's move then shown, a listed refutation is played out and ends in
   "review" (Try again returns to the stop), anything else is wrong. The
   scored stop is status "scored" until the replay resumes, so a stop can
   never be scored twice: `moveIdx` and `stopIdx` only move forward. A `maxim`
   step is an info step carrying a line and its plain-words analogy. */
import { tryPlay, idx, opponent, createGame, play as playRec } from "../engine/index.js";
import { setupToBoard } from "../content/positions.js";

export const TIMINGS = { reply: 400, wrongHold: 900, advance: 250, afterScore: 1100 };
export const SCORE = { master: 2, strong: 1 };
export const DEFAULT_PARTIAL = "A strong player's move, not his.";

export const VERDICT_LABELS = { best: "Best", fine: "Playable", poor: "Not this" };

const same = (p, c, r) => p.c === c && p.r === r;

export const DEFAULT_WRONG = "Not there. Look again.";
/** What to say after a wrong move: the step's own line, else its hint, else neutral. */
export const wrongTextFor = (step) => step.wrongText || step.hint || DEFAULT_WRONG;

const lessonOf = (state) => ({ size: state.board.size });

export function initStep(lesson, step) {
  const base = {
    board: setupToBoard(step.setup, lesson.size),
    status: step.type === "info" || step.type === "maxim" ? "solved" : "open", // open | wrong | busy | review | scored | solved
    flash: [], lastMove: null, wrong: null,
    message: null, tone: null,                        // tone: "success" | "hint" | "verdict"
    moveIdx: 0, verdict: null, pending: null,
  };
  if (step.type !== "replay") return base;
  return settle(step, { ...base, stopIdx: 0, score: 0, stopsDone: 0, guess: null, done: false, refutation: null });
}

/** The colour of replay move `i`: alternating from the step's `toPlay`. */
export const replayColor = (step, i) => (i % 2 === 0 ? step.toPlay : opponent(step.toPlay));

/** Where a replay stands after a move has been played: at a stop (open), at the end
 *  (solved), or between (busy, advancing on a timer). */
function settle(step, state) {
  const stop = step.stops[state.stopIdx];
  if (state.moveIdx >= step.moves.length) {
    return { ...state, status: "solved", done: true, message: step.success, tone: "success", pending: null };
  }
  if (stop && stop.at === state.moveIdx) {
    return { ...state, status: "open", message: stop.text, tone: null, pending: null, guess: null };
  }
  return { ...state, status: "busy", pending: { ms: TIMINGS.advance, action: { type: "advance" } } };
}

/** Back to the current stop of a replay, keeping the score so far. */
function resetToStop(lesson, step, state) {
  const stop = step.stops[state.stopIdx];
  let s = { ...initStep(lesson, step), stopIdx: state.stopIdx, score: state.score, stopsDone: state.stopsDone, status: "busy", pending: null, message: null };
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
  (state.status !== "open" && state.status !== "review") || step.type === "info" || step.type === "maxim" || step.type === "count";

const placed = (state, res, c, r, extra = {}) => ({
  ...state, board: res.board, flash: res.captured, lastMove: idx(res.board.size, c, r), wrong: null, ...extra,
});

const wrong = (step, state, c, r) => ({
  ...state, status: "wrong", wrong: { c, r }, message: wrongTextFor(step), tone: "hint",
  pending: { ms: TIMINGS.wrongHold, action: { type: "clearWrong" } },
});

export function stepReducer(lesson, step, state, action) {
  switch (action.type) {
    case "reset": return step.type === "replay" ? resetToStop(lesson, step, state) : initStep(lesson, step);
    case "advance": return advance(step, state);
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
  if (state.status === "review") return step.type === "replay" ? resetToStop(lessonOf(state), step, state) : initStep(lessonOf(state), step);
  if (state.status !== "open") return state;
  if (step.type === "replay") return guess(step, state, c, r);
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
      status: best ? "solved" : "review", verdict: opt.verdict, message: opt.text, tone: best ? "success" : "verdict",
      pending: null,
    });
  }
  return state;
}

/** Replay: the learner's stone at a stop. */
function guess(step, state, c, r) {
  const stop = step.stops[state.stopIdx];
  const color = replayColor(step, state.moveIdx);
  const res = tryPlay(state.board, c, r, color);
  if (!res.ok) return wrong(stop, state, c, r);
  const after = { stopIdx: state.stopIdx + 1, stopsDone: state.stopsDone + 1, status: "scored", pending: { ms: TIMINGS.afterScore, action: { type: "advance" } } };
  if (stop.answers.some(a => same(a, c, r))) {
    // His move: the stone stays and the replay continues from it.
    return placed(state, res, c, r, { ...after, moveIdx: state.moveIdx + 1, score: state.score + SCORE.master, message: stop.success, tone: "success", guess: null });
  }
  if ((stop.strong || []).some(a => same(a, c, r))) {
    // A strong player's move: marked, not placed; his own move follows on the timer.
    return { ...state, ...after, score: state.score + SCORE.strong, message: stop.partial || DEFAULT_PARTIAL, tone: "verdict", verdict: "fine", guess: { c, r }, wrong: null };
  }
  const rf = (stop.refutations || []).find(x => same(x.move, c, r));
  if (rf) {
    return placed(state, res, c, r, { status: "busy", refutation: rf, message: null, pending: { ms: TIMINGS.reply, action: { type: "refute" } } });
  }
  return wrong(stop, state, c, r);
}

/** Replay: the next scripted move, when the board is playing itself. */
function advance(step, state) {
  if (step.type !== "replay" || (state.status !== "busy" && state.status !== "scored")) return state;
  const m = step.moves[state.moveIdx];
  if (!m) return settle(step, state);
  const res = tryPlay(state.board, m.c, m.r, replayColor(step, state.moveIdx));
  if (!res.ok) return { ...state, status: "solved", done: true, pending: null };   // verifier guarantees legality
  return settle(step, placed(state, res, m.c, m.r, { moveIdx: state.moveIdx + 1, guess: null, message: state.status === "scored" ? null : state.message, tone: state.status === "scored" ? null : state.tone }));
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
  const replier = step.type === "replay" ? opponent(replayColor(step, state.moveIdx)) : opponent(step.toPlay);
  const res = rf.reply ? tryPlay(state.board, rf.reply.c, rf.reply.r, replier) : { ok: false };
  const next = res.ok ? placed(state, res, rf.reply.c, rf.reply.r) : state;
  return { ...next, status: "review", message: rf.text, tone: "hint", pending: null };
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
