import { useState, useMemo } from "react";
import { idx, starPoints } from "../engine/index.js";

/* ----------------------- BOARD (SVG) -----------------------
   Renders any board size; reads it from the board object. Presentational
   only: every rule decision happens in the engine before onPlay is called.

   Overlays, all optional and all facts handed in by the caller:
     marks      dashed rings (lessons)
     flash      stones that just landed and should pop (lessons)
     atari      indices of stones to ring softly: a group with one liberty
     captured   [c, r] pairs lifted on the last move; drawn as fading ghosts.
                `captureKey` must change per move so the animation replays.
     territory  owner map from the engine ("b" | "w" | "neutral") while scoring
     dead       indices of stones marked dead while scoring
     wrong      one {c, r} to cross out briefly after a wrong lesson move */
export function Board({
  board, onPlay, lastMove, marks = [], disabled, sizePx = 460, flash = [],
  atari = [], captured = [], captureKey = 0, territory = null, dead = [], wrong = null,
  numbers = null,
}) {
  const N = board.size;
  const cell = 44, m = 34;
  const S = (N - 1) * cell + m * 2;
  const [hover, setHover] = useState(null);
  const flashSet = useMemo(() => new Set(flash.map(p => idx(N, p[0] ?? p.c, p[1] ?? p.r))), [flash, N]);
  const atariSet = useMemo(() => new Set(atari), [atari]);
  const deadSet = useMemo(() => new Set(dead), [dead]);
  const scoring = !!territory;
  const x = (c) => m + c * cell, y = (r) => m + r * cell;
  return (
    <div className="board-well" style={{ maxWidth: sizePx }}>
      <svg
        viewBox={`0 0 ${S} ${S}`}
        className={`goban ${scoring ? "scoring" : ""}`}
        onMouseLeave={() => setHover(null)}
        role="grid"
        aria-label={`Go board, ${N} by ${N}`}
      >
        <defs>
          <radialGradient id="stB" cx="0.36" cy="0.34" r="0.85">
            <stop offset="0%" stopColor="#6b655a" />
            <stop offset="55%" stopColor="#4b463c" />
            <stop offset="100%" stopColor="#3a362e" />
          </radialGradient>
          <radialGradient id="stW" cx="0.36" cy="0.34" r="0.85">
            <stop offset="0%" stopColor="#fdfaf4" />
            <stop offset="60%" stopColor="#f2ede3" />
            <stop offset="100%" stopColor="#ddd5c6" />
          </radialGradient>
        </defs>
        {Array.from({ length: N }).map((_, i) => (
          <g key={i}>
            <line x1={m} y1={y(i)} x2={x(N - 1)} y2={y(i)} className="grid-line" />
            <line x1={x(i)} y1={m} x2={x(i)} y2={y(N - 1)} className="grid-line" />
          </g>
        ))}
        {starPoints(N).map((p, i) => (
          <circle key={i} cx={x(p.c)} cy={y(p.r)} r={4} className="star-pt" />
        ))}
        {scoring && territory.map((owner, i) => {
          if (owner === "neutral" || board.cells[i] !== null) return null;
          const c = i % N, r = Math.floor(i / N);
          return <rect key={"t" + i} x={x(c) - 5} y={y(r) - 5} width={10} height={10} rx={2}
            className={`terr terr-${owner}`} />;
        })}
        {marks.map((p, i) => (
          <circle key={"mk" + i} cx={x(p.c)} cy={y(p.r)} r={13} className="mark-ring" />
        ))}
        {wrong && (
          <g className="wrong-x" aria-hidden="true">
            <line x1={x(wrong.c) - 9} y1={y(wrong.r) - 9} x2={x(wrong.c) + 9} y2={y(wrong.r) + 9} />
            <line x1={x(wrong.c) + 9} y1={y(wrong.r) - 9} x2={x(wrong.c) - 9} y2={y(wrong.r) + 9} />
          </g>
        )}
        {hover && !disabled && !scoring && board.cells[idx(N, hover.c, hover.r)] === null && (
          <circle cx={x(hover.c)} cy={y(hover.r)} r={17} className="ghost" />
        )}
        <g key={"cap" + captureKey}>
          {captured.map((p, i) => {
            const c = p[0] ?? p.c, r = p[1] ?? p.r;
            return <circle key={"c" + i} cx={x(c)} cy={y(r)} r={18.5} className="stone-out"
              style={{ animationDelay: `${i * 40}ms` }} />;
          })}
        </g>
        {board.cells.map((v, i) => {
          if (v === null) return null;
          const c = i % N, r = Math.floor(i / N);
          const isLast = lastMove === i;
          const isDead = deadSet.has(i);
          return (
            <g key={i} className={`${flashSet.has(i) ? "stone-pop" : "stone-in"} ${isDead ? "stone-dead" : ""}`}>
              <circle cx={x(c)} cy={y(r)} r={18.5}
                fill={v === "b" ? "url(#stB)" : "url(#stW)"}
                className={v === "b" ? "stone-b" : "stone-w"} />
              {isDead && (
                <path className={`dead-x ${v === "b" ? "on-b" : "on-w"}`}
                  d={`M${x(c) - 7} ${y(r) - 7} L${x(c) + 7} ${y(r) + 7} M${x(c) + 7} ${y(r) - 7} L${x(c) - 7} ${y(r) + 7}`} />
              )}
              {atariSet.has(i) && !isDead && <circle cx={x(c)} cy={y(r)} r={21} className="atari-ring" />}
              {numbers && numbers.has(i) ? (
                <text x={x(c)} y={y(r)} className={`stone-num ${v === "b" ? "on-b" : "on-w"}`}
                  textAnchor="middle" dominantBaseline="central">{numbers.get(i)}</text>
              ) : (
                isLast && !isDead && <circle cx={x(c)} cy={y(r)} r={7} className="last-dot" />
              )}
            </g>
          );
        })}
        {Array.from({ length: N * N }).map((_, i) => {
          const c = i % N, r = Math.floor(i / N);
          const stone = board.cells[i];
          const label = `${String.fromCharCode(65 + c)}${N - r}${stone ? (stone === "b" ? ", black stone" : ", white stone") : ""}${deadSet.has(i) ? ", marked dead" : ""}`;
          return (
            <rect key={"h" + i}
              x={x(c) - cell / 2} y={y(r) - cell / 2}
              width={cell} height={cell} fill="transparent"
              style={{ cursor: disabled ? "default" : "pointer" }}
              role="gridcell"
              aria-label={label}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled) { e.preventDefault(); onPlay?.(c, r); } }}
              onMouseEnter={() => setHover({ c, r })}
              onClick={() => !disabled && onPlay?.(c, r)}
            />
          );
        })}
      </svg>
    </div>
  );
}
