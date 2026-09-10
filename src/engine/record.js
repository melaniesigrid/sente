/* ----------------------- GAME RECORD (pure) -----------------------
   A game is a plain, JSON-serialisable object and every operation is a pure function
   that returns a new record. The record is also the replay log: `setup` plus `moves`
   fully determine the derived fields (board, hashes, captures, ...), and `replay`
   rebuilds them. This is what a socket protocol will carry.

   State machine:

                 play / pass (1st)
                ┌───────┐
                │       ▼
        ┌──────────────────┐   pass, pass   ┌─────────────┐  acceptScore  ┌─────────┐
        │     playing      │ ─────────────▶ │   scoring   │ ────────────▶ │  ended  │
        └──────────────────┘                └─────────────┘               └─────────┘
                ▲   │                          │   ▲  │                         ▲
         undo   │   │ resign                   │   │  │ resign                  │
        (>0 mv) └───┼──────────────────────────┼───┼──┴─────────────────────────┘
                    │                    undo  │   │ markDead (toggle)
                    └──────────────────────────┘   └──┘

   Anything not drawn is illegal and throws `IllegalTransitionError`. A play that the
   rules refuse throws `IllegalMoveError` carrying the rules reason. */

import { createBoard, idx, inB, withStone, chainAt, SIZES } from "./board.js";
import { tryPlay, opponent } from "./rules.js";
import { hashBoard } from "./zobrist.js";
import { scoreBoard } from "./score.js";

export const PHASES = ["playing", "scoring", "ended"];

export class GameError extends Error {
  constructor(message) { super(message); this.name = "GameError"; }
}
export class IllegalTransitionError extends GameError {
  constructor(action, phase) {
    super(`cannot ${action} while ${phase}`);
    this.name = "IllegalTransitionError";
    this.action = action;
    this.phase = phase;
  }
}
export class IllegalMoveError extends GameError {
  constructor(reason, detail = {}) {
    super(`illegal move: ${reason}`);
    this.name = "IllegalMoveError";
    this.reason = reason;
    Object.assign(this, detail);
  }
}

/* ----- handicap ----- */

/** Fixed handicap points in the traditional placement order for 2 to 9 stones. */
export function handicapPoints(size, n) {
  if (!SIZES.includes(size)) throw new RangeError(`no fixed handicap for size ${size}`);
  if (!Number.isInteger(n) || n < 2 || n > 9) throw new RangeError(`handicap must be 2..9, got ${n}`);
  const e = size >= 13 ? 3 : 2;
  const f = size - 1 - e;
  const m = (size - 1) / 2;
  const A = [f, e], B = [e, f], C = [f, f], D = [e, e], T = [m, m];
  const L = [e, m], R = [f, m], U = [m, e], Dn = [m, f];
  const table = {
    2: [A, B], 3: [A, B, C], 4: [A, B, C, D], 5: [A, B, C, D, T],
    6: [A, B, C, D, L, R], 7: [A, B, C, D, L, R, T],
    8: [A, B, C, D, L, R, U, Dn], 9: [A, B, C, D, L, R, U, Dn, T],
  };
  return table[n].map(([c, r]) => [c, r]);
}

export const defaultKomi = (handicap) => (handicap >= 2 ? 0.5 : 7.5);

/* ----- construction ----- */

/** @param {object} o
 *  @param {number} [o.size=19]
 *  @param {number} [o.komi]        defaults to 7.5, or 0.5 with a handicap
 *  @param {number} [o.handicap=0]  0 or 2..9; places fixed stones unless `setup` is given
 *  @param {object} [o.clock]       clock preset, stored verbatim (see clock.js)
 *  @param {object} [o.setup]       `{ b: [[c,r]], w: [[c,r]] }` explicit setup stones
 *  @param {string} [o.toPlay]      first player; defaults to white after a handicap
 *  @param {object} [o.players]     free-form `{ b, w }` names, stored verbatim */
export function createGame(o = {}) {
  const size = o.size ?? 19;
  const handicap = o.handicap ?? 0;
  if (handicap !== 0 && (handicap < 2 || handicap > 9)) throw new RangeError(`handicap must be 0 or 2..9`);
  const setup = o.setup
    ? { b: (o.setup.b ?? []).map(([c, r]) => [c, r]), w: (o.setup.w ?? []).map(([c, r]) => [c, r]) }
    : { b: handicap ? handicapPoints(size, handicap) : [], w: [] };
  let board = createBoard(size);
  for (const [c, r] of setup.b) board = withStone(board, c, r, "b");
  for (const [c, r] of setup.w) board = withStone(board, c, r, "w");
  const toPlay = o.toPlay ?? (handicap >= 2 ? "w" : "b");
  return {
    version: 1,
    size,
    komi: o.komi ?? defaultKomi(handicap),
    handicap,
    clock: o.clock ?? null,
    players: o.players ?? null,
    setup,
    firstToPlay: toPlay,
    moves: [],
    phase: "playing",
    toPlay,
    board,
    koPoint: null,
    hashes: [hashBoard(board)],
    captures: { b: 0, w: 0 },
    passes: 0,
    dead: [],
    result: null,
  };
}

const assertPhase = (rec, action, ...phases) => {
  if (!phases.includes(rec.phase)) throw new IllegalTransitionError(action, rec.phase);
};

/* ----- transitions ----- */

export function play(rec, c, r, color = rec.toPlay) {
  assertPhase(rec, "play", "playing");
  if (color !== rec.toPlay) throw new IllegalMoveError("wrong-turn", { expected: rec.toPlay });
  const res = tryPlay(rec.board, c, r, color, {
    koPoint: rec.koPoint, history: rec.hashes, hash: rec.hashes[rec.hashes.length - 1],
  });
  if (!res.ok) throw new IllegalMoveError(res.reason, { c, r, color });
  return {
    ...rec,
    moves: [...rec.moves, { type: "play", color, c, r }],
    toPlay: opponent(color),
    board: res.board,
    koPoint: res.ko,
    hashes: [...rec.hashes, res.hash],
    captures: { ...rec.captures, [color]: rec.captures[color] + res.captured.length },
    passes: 0,
    lastCaptured: res.captured,
  };
}

export function pass(rec, color = rec.toPlay) {
  assertPhase(rec, "pass", "playing");
  if (color !== rec.toPlay) throw new IllegalMoveError("wrong-turn", { expected: rec.toPlay });
  const passes = rec.passes + 1;
  return {
    ...rec,
    moves: [...rec.moves, { type: "pass", color }],
    toPlay: opponent(color),
    koPoint: null,
    passes,
    phase: passes >= 2 ? "scoring" : "playing",
    lastCaptured: [],
  };
}

export function resign(rec, color = rec.toPlay) {
  assertPhase(rec, "resign", "playing", "scoring");
  if (color !== "b" && color !== "w") throw new IllegalMoveError("bad-color", { color });
  return {
    ...rec,
    moves: [...rec.moves, { type: "resign", color }],
    phase: "ended",
    result: { winner: opponent(color), method: "resign", margin: null, score: null },
  };
}

/** `color` ran out of time. Losing on time is a rule, so it lives here and not in a
 *  view: the flag ends the game and the opponent wins. Legal from `playing` and from
 *  `scoring`, like a resignation, and equally final. */
export function timeout(rec, color = rec.toPlay) {
  assertPhase(rec, "timeout", "playing", "scoring");
  if (color !== "b" && color !== "w") throw new IllegalMoveError("bad-color", { color });
  return {
    ...rec,
    moves: [...rec.moves, { type: "timeout", color }],
    phase: "ended",
    result: { winner: opponent(color), method: "time", margin: null, score: null },
  };
}

/** Toggle the dead flag on the whole chain at (c, r). Only meaningful while scoring. */
export function markDead(rec, c, r) {
  assertPhase(rec, "markDead", "scoring");
  if (!inB(rec.size, c, r)) throw new IllegalMoveError("offboard", { c, r });
  const i = idx(rec.size, c, r);
  if (rec.board.cells[i] === null) throw new IllegalMoveError("empty", { c, r });
  const chain = chainAt(rec.board, c, r).stones.map(([x, y]) => idx(rec.size, x, y));
  const set = new Set(rec.dead);
  const currentlyDead = set.has(i);
  for (const j of chain) { if (currentlyDead) set.delete(j); else set.add(j); }
  return { ...rec, dead: [...set].sort((a, b) => a - b) };
}

export function acceptScore(rec) {
  assertPhase(rec, "acceptScore", "scoring");
  const score = scoreBoard(rec.board, { dead: rec.dead, komi: rec.komi, handicap: rec.handicap });
  return {
    ...rec,
    phase: "ended",
    result: { winner: score.winner, method: "score", margin: score.margin, score },
  };
}

/** Take back the last move. From scoring this returns to playing and clears dead marks. */
export function undo(rec) {
  assertPhase(rec, "undo", "playing", "scoring");
  if (rec.moves.length === 0) throw new IllegalMoveError("nothing-to-undo");
  return replay(rec, rec.moves.slice(0, -1));
}

/* ----- replay ----- */

/** Rebuild every derived field from `setup` and `moves` (defaults to the record's own).
 *  Throws the same errors as the live transitions, so a tampered log is rejected. */
export function replay(rec, moves = rec.moves) {
  let out = createGame({
    size: rec.size, komi: rec.komi, handicap: rec.handicap, clock: rec.clock,
    players: rec.players, setup: rec.setup, toPlay: rec.firstToPlay,
  });
  if (rec.comment) out = { ...out, comment: rec.comment };
  for (const mv of moves) {
    if (mv.type === "play") out = play(out, mv.c, mv.r, mv.color);
    else if (mv.type === "pass") out = pass(out, mv.color);
    else if (mv.type === "resign") out = resign(out, mv.color);
    else if (mv.type === "timeout") out = timeout(out, mv.color);
    else throw new IllegalMoveError("unknown-move", { move: mv });
    if (mv.comment) out = withMoveComment(out, mv.comment);
  }
  return out;
}

/** Attach a comment (SGF `C`) to the most recent move. */
export function withMoveComment(rec, comment) {
  if (!rec.moves.length) return { ...rec, comment };
  const moves = rec.moves.slice();
  moves[moves.length - 1] = { ...moves[moves.length - 1], comment };
  return { ...rec, moves };
}

/** Board index of the last stone played, or null (pass, resign, no moves). */
export function lastMoveIndex(rec) {
  const mv = rec.moves[rec.moves.length - 1];
  return mv && mv.type === "play" ? idx(rec.size, mv.c, mv.r) : null;
}

/** Honest one-line result, e.g. "White wins by 6.5" or "Black wins by resignation". */
export function resultText(rec) {
  const res = rec.result;
  if (!res) return null;
  if (res.method === "resign") return `${res.winner === "b" ? "Black" : "White"} wins by resignation`;
  if (res.method === "time") return `${res.winner === "b" ? "Black" : "White"} wins on time`;
  if (res.winner === null) return "Jigo";
  return `${res.winner === "b" ? "Black" : "White"} wins by ${res.margin}`;
}
