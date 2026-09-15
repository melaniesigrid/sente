import { useMemo } from "react";
import { LineChart, Square, History } from "lucide-react";
import { Card, Btn, Pill } from "../components/ui.jsx";
import { WinGraph } from "../components/WinGraph.jsx";
import { useAnalysis, remainingText } from "./useAnalysis.js";
import { turningPoints, reviewLength } from "../engine/index.js";
import { graphSummaryText } from "./reviewLine.js";
import { useT } from "../components/langStore.js";

/* ----------------------- WHO WAS WINNING (card) -----------------------
   The win rate graph at the table, once the game is over, the way the other
   servers show it beside the result. Before this it lived only inside Review,
   and a table that had no way into Review had no graph at all.

   Same hook, same picture, same cache as Review: `useAnalysis` keeps the
   points by record, so a graph drawn here is already drawn when Review opens,
   and one drawn there is already here. Nothing is analysed until somebody
   asks, for the reason Review gives: a network run per position is minutes
   of a battery on 19x19, and taking that without asking is a liberty.

   The picture here is not a scrubber. The board beside it is the live table,
   showing the last position, and a graph that moved the board would be a
   review pretending to be a game. Clicking hands over to Review instead,
   where the graph scrubs and the turning points are buttons. */
export function WinCard({ record, onReview }) {
  const t = useT();
  const analysis = useAnalysis(record, { auto: record.phase === "ended" });
  const total = reviewLength(record);
  const turns = useMemo(() => turningPoints(analysis.points), [analysis.points]);
  const drawn = analysis.points.length > 0;

  return (
    <Card inset className="win-card">
      <div className="stat-head"><LineChart size={15} /><span>{t("review.card.head")}</span></div>
      {drawn && (
        <div className="stack-sm">
          <WinGraph points={analysis.points} total={total} current={total} turns={turns}
            onPick={onReview ? () => onReview() : null} />
          {/* The shape of the whole game in a sentence, not the last move's
              cost: the last move of a finished game is usually a pass. */}
          <p className="fine" aria-live="polite">{graphSummaryText(analysis.points, total, t)}</p>
        </div>
      )}
      {!drawn && !analysis.running && <p className="fine">{t("review.graphNote")}</p>}
      <div className="row">
        {analysis.running ? (
          <>
            <Pill icon={LineChart}>
              {t("review.positions", { done: analysis.done, total: total + 1 })}
              {remainingText(analysis.remaining, t) ? ` · ${remainingText(analysis.remaining, t)}` : ""}
            </Pill>
            <Btn icon={Square} small onClick={analysis.cancel}>{t("review.stop")}</Btn>
          </>
        ) : !analysis.complete && total > 0 ? (
          <Btn icon={LineChart} small primary onClick={analysis.start}>
            {drawn ? t("review.keepAnalysing") : t("review.winGraph")}
          </Btn>
        ) : null}
        {/* Only once there is a graph to scrub: the result card already offers
            review, and two identical buttons a hand apart is a guess. */}
        {onReview && drawn && <Btn icon={History} small onClick={onReview}>{t("game.review")}</Btn>}
      </div>
      {analysis.error && <p className="review-refused" role="alert">{analysis.error}</p>}
    </Card>
  );
}
