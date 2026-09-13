/* ----------------------- THE ENDGAME SOLVER -----------------------
   Every other claim in this repo is checked by a search that answers yes or
   no: is this group dead, does this chain come off the board. The endgame does
   not ask yes or no. It asks how much, and by how much the second-best move
   loses, and those are the two questions a dan lesson about counting has to be
   able to answer without the author guessing.

   So this plays the endgame out. Both sides confined to a region, both allowed
   to pass, the game over on two passes, and the result scored by the engine's
   own `scoreBoard`. Minimax over the final score, with a transposition table,
   which makes the answer exact rather than estimated: `solve()` is the result
   both sides playing perfectly reach, and `values()` is what every legal first
   move is worth measured against it.

   Japanese rules by default, because that is the convention the whole
   literature of endgame counting is written in: a dame is worth nothing, and
   filling your own territory costs a point. Under area rules every dame is
   worth a point instead and the values come out different, which is not an
   error in either count but is a trap for anybody quoting a number without
   naming the ruleset. `solve` takes the ruleset, so a lesson can show both and
   say what changed.

   Prisoners are carried through the search rather than counted at the end:
   a capture of k stones is worth k to the capturer under territory scoring, so
   the value of a node is the territory result from there plus the prisoners
   still to be taken. That keeps the transposition table honest, because the
   value of a position then does not depend on how the game reached it.

   One judgement the solver does not make is which stones are dead. It does not
   have to: it plays to two passes, and a stone that could profitably be
   captured gets captured, because under territory rules capturing it is worth
   a prisoner and the territory underneath. A position where that is not true
   is a seki, and a seki is not a counting exercise.

   Keep the region small. Ten empty points finish in a second or two; fifteen
   will not finish. The region is the whole trick, exactly as it is in
   `tools/problems/prove.mjs`.

   Nothing here ships. Run it:

     node tools/lessons/endgame.mjs */
import { tryPlay, idx, opponent, boardFromRows, boardToRows } from "../../src/engine/index.js";
import { scoreBoard } from "../../src/engine/score.js";
import { aiChooseMove } from "../../src/engine/ai.js";

export const P = (c, r) => ({ c, r });
export const fromRows = (rows) => boardFromRows(rows);
export const show = (b) => boardToRows(b).join("\n");
export const fmt = (ps) => ps.map(p => `${p.c},${p.r}`).sort().join(" ");

/** Every empty point of the board, as points. The usual region for a small
 *  board that is nothing but endgame. */
export function emptyPoints(b) {
  const out = [];
  for (let r = 0; r < b.size; r++) for (let c = 0; c < b.size; c++) {
    if (b.cells[idx(b.size, c, r)] === null) out.push(P(c, r));
  }
  return out;
}

const key = (b, toMove, passes, ko) =>
  b.cells.map(v => (v === "b" ? 1 : v === "w" ? 2 : 0)).join("") + toMove + passes + (ko ?? "-");

/** The territory result of a finished board, Black minus White, prisoners
 *  aside: those are added along the way by the search. */
export const settle = (b, komi = 0, rules = "japanese") => {
  const s = scoreBoard(b, { komi, rules });
  return s.totals.b - s.totals.w;
};

/** The full count of a finished board, for printing. */
export const finalScore = (b, komi = 0, rules = "japanese", captures = { b: 0, w: 0 }) =>
  scoreBoard(b, { komi, rules, captures });

/* The search. Black maximises the final difference and White minimises it,
   which is what "both sides play their best" means when the thing being played
   for is a number rather than a life. A pass is always legal and two of them
   end it, so neither side can be forced to fill its own eye to keep the game
   going.

   The value of a node is the result from that node on, so a capture adds its
   stones to the side that made it, and the table can therefore be shared
   between questions about the same region: what a position is worth does not
   depend on how the game reached it. `solver()` hands back the shared table,
   which is the difference between asking what nine moves are worth in a second
   and asking it in a minute. */
export function solver(region, opts = {}) {
  const { komi = 0, rules = "japanese", cap = 60 } = opts;
  const territory = rules === "japanese";
  const memo = new Map();

  const walk = (b, mover, passes, ko, depth) => {
    if (passes >= 2 || depth >= cap) return settle(b, komi, rules);
    const k = key(b, mover, passes, ko);
    const hit = memo.get(k);
    if (hit !== undefined) return hit;

    let best = null;
    const take = (v) => {
      if (best === null) best = v;
      else best = mover === "b" ? Math.max(best, v) : Math.min(best, v);
    };
    for (const m of region) {
      if (b.cells[idx(b.size, m.c, m.r)] !== null) continue;
      const res = tryPlay(b, m.c, m.r, mover, { koPoint: ko });
      if (!res.ok) continue;
      /* A prisoner is a point under territory scoring and nothing extra under
         area scoring, where the emptied point is counted instead. */
      const taken = territory ? res.captured.length * (mover === "b" ? 1 : -1) : 0;
      take(taken + walk(res.board, opponent(mover), 0, res.ko, depth + 1));
    }
    take(walk(b, opponent(mover), passes + 1, null, depth + 1));   // pass
    memo.set(k, best);
    return best;
  };

  /** The result of `board` with `toMove` to play, both sides perfect. */
  const solve = (board, toMove = "b") => walk(board, toMove, 0, null, 0);

  /** What every legal move in the region is worth, best first for the mover.
   *  `pass` is what the mover gets by not playing here at all, which is the
   *  number a move has to beat to be worth making. */
  const values = (board, toMove = "b") => {
    const out = [];
    for (const m of region) {
      if (board.cells[idx(board.size, m.c, m.r)] !== null) continue;
      const res = tryPlay(board, m.c, m.r, toMove, {});
      if (!res.ok) continue;
      const taken = territory ? res.captured.length * (toMove === "b" ? 1 : -1) : 0;
      out.push({ point: m, score: taken + walk(res.board, opponent(toMove), 0, res.ko, 1) });
    }
    out.sort((a, b) => (toMove === "b" ? b.score - a.score : a.score - b.score));
    return { moves: out, pass: walk(board, opponent(toMove), 1, null, 1) };
  };

  /** The line both sides play if both are perfect: the moves, in order, with
   *  the result they arrive at. A lesson that shows a value should be able to
   *  show the play that produces it, or the number is an assertion again. */
  const line = (board, toMove = "b", limit = 30) => {
    const moves = [];
    let b = board, mover = toMove, ko = null, passes = 0;
    while (moves.length < limit && passes < 2) {
      const v = values(b, mover);
      const best = v.moves[0];
      const better = best && (mover === "b" ? best.score > v.pass : best.score < v.pass);
      if (!better) {
        passes++; mover = opponent(mover); ko = null;
        continue;
      }
      const res = tryPlay(b, best.point.c, best.point.r, mover, { koPoint: ko });
      if (!res.ok) break;
      moves.push({ colour: mover, point: best.point, score: best.score });
      b = res.board; ko = res.ko; mover = opponent(mover); passes = 0;
    }
    return { moves, board: b, result: solve(board, toMove) };
  };

  return { solve, values, line, size: () => memo.size };
}

/** One-shot solve, for a caller that only has one question. */
export const solve = (board, region, toMove = "b", opts = {}) =>
  solver(region, opts).solve(board, toMove);

/** One-shot values. */
export const values = (board, region, toMove = "b", opts = {}) =>
  solver(region, opts).values(board, toMove);

/* ----------------------- WHAT A MOVE IS WORTH -----------------------
   The two numbers a counting lesson is about, and the difference between them
   is the whole subject.

   The deiri value is the swing: the difference between the board where Black
   got this boundary and the board where White got it. It is the number most
   players learn first and it is the wrong one to compare with, because two
   boundaries with the same swing are not the same size if one of them takes
   two moves to collect and the other takes one.

   The miai value divides the swing by the number of moves that were spent to
   produce it, which is what makes two boundaries comparable at all. For a
   plain gote exchange that is the swing halved.

   Both are measured here from solved positions rather than reasoned about. */
export function deiri(board, region, opts = {}) {
  const s = solver(region, opts);
  const black = s.solve(board, "b");
  const white = s.solve(board, "w");
  return { black, white, swing: black - white, miai: (black - white) / 2 };
}

/** The region of a boundary: the empty points within `radius` of any of
 *  `seeds`. A solver is only as honest as its region, and stating it as a
 *  neighbourhood of the boundary rather than "the empty board" is what keeps
 *  the search finishing. */
export function near(board, seeds, radius = 2) {
  return emptyPoints(board).filter(p =>
    seeds.some(s => Math.abs(s.c - p.c) + Math.abs(s.r - p.r) <= radius));
}

/* ----------------------- DEMONSTRATION -----------------------
   The position the lesson is built on, re-solved from scratch, so the numbers
   in the lesson can be checked by running this file. */
function demo() {
  /* The commonest boundary in go: two walls running down to the last line,
     with the bottom row still open. Everything above the last row is settled,
     so the region is the nine points of that row and nothing else. */
  const board = fromRows([
    "...XO....",
    "...XO....",
    "...XO....",
    "...XO....",
    "...XO....",
    "...XO....",
    "...XO....",
    "...XO....",
    ".........",
  ]);
  const region = emptyPoints(board).filter(p => p.r === 8);
  console.log(show(board));
  console.log(`
region: ${region.length} points, the last row`);

  for (const rules of ["japanese", "chinese"]) {
    const d = deiri(board, region, { rules });
    console.log(`
${rules}: black first ${d.black}, white first ${d.white},`
      + ` swing ${d.swing}, miai ${d.miai}`);
    const v = values(board, region, "b", { rules });
    console.log("  black's moves, best first:",
      v.moves.map(m => `${m.point.c},${m.point.r}=${m.score}`).join("  "));
  }
}

const RUN = process.argv[1] && process.argv[1].split(String.fromCharCode(92)).join("/");
if (RUN && import.meta.url.endsWith(RUN)) demo();

/* ----------------------- FINDING A REAL ENDGAME -----------------------
   A boundary drawn by hand is usually either dame, where nothing is at stake,
   or a life-and-death problem wearing an endgame's clothes. Both were tried.
   So the positions are taken from played games instead: the house AI plays
   itself out on 9x9, and every position it passes through with few enough
   empty points is solved exactly.

   A position is worth a lesson when the best move is unique and the next best
   loses a point or more. That is the whole claim an endgame lesson makes, and
   here it is a measured one. */
export function selfPlay(seed, { size = 9, stopAt = 9 } = {}) {
  const b0 = { size, cells: Array(size * size).fill(null) };
  let b = b0, colour = "b", ko = null, passes = 0, n = 0;
  const seen = [];
  while (n < size * size * 2 && passes < 2) {
    const move = aiChooseMove(b, colour, ko, n, {}, { seed: seed + n });
    if (!move) { passes++; colour = opponent(colour); n++; continue; }
    const res = tryPlay(b, move[0], move[1], colour, { koPoint: ko });
    if (!res.ok) { passes++; colour = opponent(colour); n++; continue; }
    passes = 0;
    b = res.board; ko = res.ko; colour = opponent(colour); n++;
    const empty = emptyPoints(b);
    if (empty.length <= stopAt && empty.length >= 4) seen.push({ board: b, toMove: colour, empty });
  }
  return seen;
}

/** Solve one candidate. Returns null unless it asks a real question: a unique
 *  best move for the player to move, and a second best that costs something. */
export function question(cand, opts = {}) {
  const { board, toMove, empty } = cand;
  const S = solver(empty, opts);
  const v = S.values(board, toMove);
  if (v.moves.length < 2) return null;
  const best = v.moves[0].score, second = v.moves[1].score;
  const loss = toMove === "b" ? best - second : second - best;
  if (loss < 1) return null;
  const ties = v.moves.filter(m => m.score === best);
  if (ties.length !== 1) return null;
  return { ...cand, best: v.moves[0], second: v.moves[1], loss, pass: v.pass, all: v.moves };
}
