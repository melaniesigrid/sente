import { atMove, play, IllegalMoveError, reviewLength } from "../engine/index.js";

/* ----------------------- TRYING A LINE -----------------------
   Exploring from a position in review: "what if he had answered here instead?"

   A line is scratch. It is never written into the record, never saved, and never
   exported — the game that was played is the game that was played, and a reader
   wondering about an alternative must not be able to quietly rewrite history. So
   this holds its own record, built by replaying the real one to the branch point
   and playing on from there, and throws it away when you leave.

   The rules still come from the engine: a move that `play` refuses is refused here,
   with the same named reason, because a variation full of illegal moves would teach
   the wrong thing.

   This is half of the roadmap's "variation tree". The other half — reading the
   branches an imported SGF already contains, and navigating between stored lines —
   needs the record to carry more than one line and is still open. */

/** Begin exploring from move `n` of `rec`. */
export function startLine(rec, n) {
  return { base: n, record: atMove(rec, n), moves: [] };
}

/** Play one move into the line. Returns `{ line }` or `{ error }` with the engine's
 *  own reason, never a thrown exception, because a misclick is not exceptional. */
export function playInLine(line, c, r) {
  try {
    const record = play(line.record, c, r);
    return { line: { ...line, record, moves: [...line.moves, { c, r, color: line.record.toPlay }] } };
  } catch (e) {
    if (e instanceof IllegalMoveError) return { error: e.reason };
    throw e;
  }
}

/** Take back the last move of the line. At the branch point this returns null, which
 *  the caller reads as "the line is over, go back to the game". */
export function backInLine(rec, line) {
  if (line.moves.length === 0) return null;
  const moves = line.moves.slice(0, -1);
  let record = atMove(rec, line.base);
  for (const m of moves) record = play(record, m.c, m.r);
  return { ...line, record, moves };
}

/** How deep the line is, and where it left the game. */
export function lineLabel(line) {
  const n = line.moves.length;
  const from = line.base === 0 ? "the start" : `move ${line.base}`;
  if (n === 0) return `Trying a line from ${from}`;
  return `Trying a line · ${n} move${n === 1 ? "" : "s"} from ${from}`;
}

/** Whether a position can be explored at all: a line needs somebody to move, and a
 *  game that has ended is over — you branch from a position inside it, not from the
 *  result. `n` past the last move is clamped by `atMove`, so only the phase matters. */
export function canBranch(rec, n) {
  return atMove(rec, n).phase === "playing" && reviewLength(rec) > 0;
}
