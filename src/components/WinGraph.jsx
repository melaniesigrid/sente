import { useMemo, useRef } from "react";
import { graphSummary } from "../engine/index.js";

/* ----------------------- THE WIN RATE GRAPH -----------------------
   One picture of a whole game: how the network's opinion of who was winning moved,
   move by move. Presentational, like the board. Every number it draws is handed to
   it; it decides nothing about the game.

   It is drawn the way the board is coloured, because that is the one colour pair a
   go player already reads without a legend: the curve is the boundary between
   Black's share of the graph and White's, and a side that is winning owns more of
   the box. A game Black wins ends with the curve at the top. No legend needed, and
   no third colour except the two marks - the turning points, and where you are
   standing.

   The box stretches, so the viewBox is stretched with it and every stroke asks for
   `non-scaling-stroke`. Labels live outside in HTML, where they cannot be squashed.

   Clicking scrubs the game. The slider beside it does the same thing from the
   keyboard, so this stays a picture to screen readers with a summary of its shape,
   rather than a control they can reach but not see. */

const W = 600, H = 150;

export function WinGraph({ points, total, current, onPick, turns = [], className = "" }) {
  const svg = useRef(null);
  const span = Math.max(1, total);
  const x = (move) => (move / span) * W;
  // A vertical rule drawn exactly on an edge is half outside the box and reads as a
  // sliver. The ends of a game are where a reader stands most often, so pull it in.
  const rule = (move) => Math.min(W - 1, Math.max(1, x(move)));

  const { line, area, known } = useMemo(() => {
    const px = (move) => ((move / span) * W).toFixed(2);
    const py = (black) => ((1 - black) * H).toFixed(2);
    const sorted = [...points].sort((a, b) => a.move - b.move);
    if (!sorted.length) return { line: "", area: "", known: 0 };
    const d = sorted.map((p, i) => `${i ? "L" : "M"}${px(p.move)},${py(p.black)}`).join(" ");
    const last = sorted[sorted.length - 1];
    return {
      line: d,
      area: `${d} L${px(last.move)},${H} L${px(sorted[0].move)},${H} Z`,
      known: last.move,
    };
  }, [points, span]);

  /* Where a click landed, in moves. The box is the whole game, so the left edge is
     the opening position and the right edge the last move played. */
  const pick = (e) => {
    if (!onPick || !svg.current) return;
    const box = svg.current.getBoundingClientRect();
    if (!box.width) return;
    const at = Math.round(((e.clientX - box.left) / box.width) * span);
    onPick(Math.max(0, Math.min(span, at)));
  };

  const label = graphSummary(points, total);

  return (
    <div className={`wingraph ${className}`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e); }}
        onPointerMove={(e) => { if (e.buttons === 1) pick(e); }}>
        <rect x="0" y="0" width={W} height={H} className="wingraph-white" />
        {area && <path d={area} className="wingraph-black" />}
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} className="wingraph-even" vectorEffect="non-scaling-stroke" />
        {known < total && (
          <rect x={x(known)} y="0" width={W - x(known)} height={H} className="wingraph-unknown" />
        )}
        {line && <path d={line} className="wingraph-line" vectorEffect="non-scaling-stroke" />}
        {turns.map((t) => (
          <line key={t.move} x1={rule(t.move)} y1="0" x2={rule(t.move)} y2={H}
            className="wingraph-turn" vectorEffect="non-scaling-stroke" />
        ))}
        <line x1={rule(current)} y1="0" x2={rule(current)} y2={H}
          className="wingraph-cursor" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="wingraph-ends" aria-hidden="true">
        <span>Start</span>
        <span>{total} moves</span>
      </div>
    </div>
  );
}
