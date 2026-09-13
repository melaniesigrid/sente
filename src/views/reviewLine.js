import { atMove, play, IllegalMoveError, reviewLength, pointAt, pct } from "../engine/index.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/* ----------------------- TRYING A LINE -----------------------
   Exploring from a position in review: "what if he had answered here instead?"

   A line is scratch. It is never written into the record, never saved, and never
   exported: the game that was played is the game that was played, and a reader
   wondering about an alternative must not be able to quietly rewrite history. So
   this holds its own record, built by replaying the real one to the branch point
   and playing on from there, and throws it away when you leave.

   The rules still come from the engine: a move that `play` refuses is refused here,
   with the same named reason, because a variation full of illegal moves would teach
   the wrong thing.

   This is half of the roadmap's "variation tree". The other half (reading the
   branches an imported SGF already contains, and navigating between stored lines)
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
export function lineLabel(line, t = EN) {
  const n = line.moves.length;
  const from = line.base === 0 ? t("review.fromStart") : t("review.fromMove", { n: line.base });
  if (n === 0) return t("review.trying", { from });
  return t("review.tryingMoves", { moves: t("review.lineMoves", { count: n }), from });
}

/** What position review is looking at, in words. The engine has `reviewLabel`
 *  for the same job, but the engine is not the place for a sentence: it has to
 *  be able to run on a server that has no reader, and a side is a clause here
 *  rather than a noun to drop in. Same data, said by the view. */
export function reviewLabelText(rec, n, t = EN) {
  const at = clampMove(rec, n);
  if (at === 0) return t("review.start");
  const mv = playedMoves(rec)[at - 1];
  const side = t(`game.side.${mv.color}`);
  return t(mv.type === "pass" ? "review.labelPass" : "review.label", { n: at, side });
}

/** Whether a position can be explored at all: a line needs somebody to move, and a
 *  game that has ended is over: you branch from a position inside it, not from the
 *  result. `n` past the last move is clamped by `atMove`, so only the phase matters. */
export function canBranch(rec, n) {
  return atMove(rec, n).phase === "playing" && reviewLength(rec) > 0;
}

/** One line under the win rate graph: who the network thinks is ahead at move
 *  `n`, and what the move that made the position did to its own player's
 *  chances. The engine has `winRateLine` for the same arithmetic; this is the
 *  sentence, because the engine has to be able to run where there is no reader.
 *  Null when analysis has not reached the move, which is an ordinary answer:
 *  it arrives one position at a time and a reader can always be ahead of it. */
export function winRateLineText(points, n, t = EN) {
  const p = pointAt(points, n);
  if (!p) return null;
  const lead = p.black >= 0.5
    ? t("review.leadB", { pct: pct(p.black) })
    : t("review.leadW", { pct: pct(1 - p.black) });
  const head = t("review.gives", { lead });
  const prev = pointAt(points, n - 1);
  if (!prev || !p.color) return head;
  const who = t(`game.side.${p.color}`);
  const cost = p.color === "b" ? prev.black - p.black : p.black - prev.black;
  if (Math.abs(cost) < 0.02) return `${head} ${t("review.changedLittle")}`;
  const moved = pct(Math.abs(cost));
  return `${head} ${t(cost > 0 ? "review.moveCost" : "review.moveGained", { who, moved })}`;
}

/** What the graph says, for a reader who cannot see it. The shape of a game is
 *  who led and whether the lead ever changed hands, so that is what this says. */
export function graphSummaryText(points, total, t = EN) {
  if (!points.length) return t("review.graphEmpty");
  const sorted = [...points].sort((a, b) => a.move - b.move);
  const last = sorted[sorted.length - 1];
  let leads = 0;
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i - 1].black >= 0.5) !== (sorted[i].black >= 0.5)) leads++;
  }
  const who = t(last.black >= 0.5 ? "game.side.b" : "game.side.w");
  return t("review.graphSummary", {
    changed: t("review.leadChanged", { count: leads }),
    move: last.move,
    total,
    who,
    pct: pct(Math.max(last.black, 1 - last.black)),
  });
}
