/* ----------------------- PLAYING IT OUT -----------------------
   A calibration run needs a score it can trust, and two passes do not give it
   one. Nobody is sitting here to tap the dead stones off, and scoring the
   position with everything on the board alive counts a dead group as both
   stones and territory — which is how a first run of this harness produced a
   73.5 point margin on a board with 81 points on it.

   So the game is played out instead of adjudicated. After both sides pass, the
   position is finished mechanically: each side, in turn, plays any legal move
   that is not filling one of its own eyes, until neither has one left. Dead
   stones come off the board because they can be captured, and at that point
   area scoring with everything alive is not an assumption any more — it is
   exactly right. This is what engine self-play has always done, and it is why
   area rules are the natural ones to measure under.

   THE EYE RULE is the whole of it, and it is deliberately the simple one: a
   point is an eye for a colour when every neighbour is that colour, and enough
   of its diagonals are too — both of them on an edge or in a corner, three of
   four in the middle. That rule is conservative. It will occasionally refuse to
   fill something that is not really an eye, which ends the cleanup a move early
   and costs a point; it will not fill a real eye and kill a living group, which
   would cost a game. When the two errors are that lopsided, take the cheap one.

   Nothing here is a rule of go, so nothing here belongs in the engine: it is a
   convention for finishing an unattended game. The engine is asked whether each
   move is legal, and answers as it would for a person. */
import { idx, inB, NBRS, tryPlay, legalMoves, play, pass, undo } from "../../src/engine/index.js";

const DIAGS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Is (c, r) an eye belonging to `colour`? See the note above on why this errs
 *  toward saying no. */
export function isEye(board, c, r, colour) {
  const { size, cells } = board;
  if (cells[idx(size, c, r)] !== null) return false;
  for (const [dx, dy] of NBRS) {
    const x = c + dx, y = r + dy;
    if (!inB(size, x, y)) continue;            // off the board counts as friendly
    if (cells[idx(size, x, y)] !== colour) return false;
  }
  // Diagonals decide whether the eye is real or a false one waiting to be cut.
  let offBoard = 0, friendly = 0;
  for (const [dx, dy] of DIAGS) {
    const x = c + dx, y = r + dy;
    if (!inB(size, x, y)) { offBoard += 1; continue; }
    if (cells[idx(size, x, y)] === colour) friendly += 1;
  }
  return offBoard > 0 ? friendly + offBoard === 4 : friendly >= 3;
}

/** Every legal move for `colour` that is not filling one of its own eyes. */
export function cleanupMoves(rec, colour) {
  const opts = { koPoint: rec.koPoint, history: rec.hashes, hash: rec.hashes[rec.hashes.length - 1] };
  return legalMoves(rec.board, colour, opts).filter(([c, r]) => !isEye(rec.board, c, r, colour));
}

/** Finish an unattended game so that area scoring is exact. Returns the record
 *  with the dead stones actually captured, plus how many moves it took. A cap
 *  is kept because a cleanup that will not terminate is a bug worth seeing
 *  rather than a process worth hanging on. */
export function playItOut(rec, { rng = Math.random, cap = 400 } = {}) {
  let moves = 0;
  let passes = 0;
  /* Two passes have already put the record in the scoring phase. Taking them
     back is exactly what the app's "Keep playing" does, and it is the only way
     back to a board that accepts stones. The passes are not wanted in the
     record afterwards either: what is being scored is the finished position. */
  while (rec.phase === "scoring") {
    const back = undo(rec);
    if (back === rec) break;
    rec = back;
  }
  while (rec.phase === "playing" && moves < cap && passes < 2) {
    const options = cleanupMoves(rec, rec.toPlay);
    if (!options.length) { rec = pass(rec); passes += 1; moves += 1; continue; }
    passes = 0;
    /* Any legal non-eye move will do: the result of a played-out position does
       not depend on the order the last dame are filled. Choosing at random
       rather than always first keeps a pathological ordering from repeating. */
    const [c, r] = options[Math.floor(rng() * options.length)];
    const next = play(rec, c, r);
    if (next === rec) {
      // Refused despite being listed; do not spin.
      const res = tryPlay(rec.board, c, r, rec.toPlay);
      if (!res.ok) { rec = pass(rec); passes += 1; }
    } else {
      rec = next;
    }
    moves += 1;
  }
  return { rec, moves, stalled: moves >= cap };
}
