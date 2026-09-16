import { pointAt, pct, clampMove, playedMoves } from "../engine/index.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/* ----------------------- TRYING A LINE -----------------------
   The rules of a variation moved into the engine, where the server can reach
   them: two people reading a game together try one line between them, and the
   server keeping them in step has to refuse a move exactly the way the board
   does. They are re-exported here because this is where the view has always
   found them, and what is left in this file is the sentences.
*/
export { startLine, playInLine, backInLine, lineFrom, canBranch } from "../engine/index.js";

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
