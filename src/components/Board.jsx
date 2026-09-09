import { useState, useMemo } from "react";
import { idx, starPoints } from "../engine/index.js";

/* ----------------------- BOARD (SVG) -----------------------
   Renders any board size; reads it from the board object. Presentational
   only: every rule decision happens in the engine before onPlay is called. */
export function Board({ board, onPlay, lastMove, marks = [], disabled, sizePx = 460, flash = [] }) {
  const N = board.size;
  const cell = 44, m = 34;
  const S = (N - 1) * cell + m * 2;
  const [hover, setHover] = useState(null);
  const flashSet = useMemo(() => new Set(flash.map(p => idx(N, p[0] ?? p.c, p[1] ?? p.r))), [flash, N]);
  return (
    <div className="board-well" style={{ maxWidth: sizePx }}>
      <svg
        viewBox={`0 0 ${S} ${S}`}
        className="goban"
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
            <line x1={m} y1={m + i * cell} x2={m + (N - 1) * cell} y2={m + i * cell} className="grid-line" />
            <line x1={m + i * cell} y1={m} x2={m + i * cell} y2={m + (N - 1) * cell} className="grid-line" />
          </g>
        ))}
        {starPoints(N).map((p, i) => (
          <circle key={i} cx={m + p.c * cell} cy={m + p.r * cell} r={4} className="star-pt" />
        ))}
        {marks.map((p, i) => (
          <circle key={"mk" + i} cx={m + p.c * cell} cy={m + p.r * cell} r={13} className="mark-ring" />
        ))}
        {hover && !disabled && board.cells[idx(N, hover.c, hover.r)] === null && (
          <circle cx={m + hover.c * cell} cy={m + hover.r * cell} r={17} className="ghost" />
        )}
        {board.cells.map((v, i) => {
          if (v === null) return null;
          const c = i % N, r = Math.floor(i / N);
          const isLast = lastMove === i;
          return (
            <g key={i} className={flashSet.has(i) ? "stone-pop" : "stone-in"}>
              <circle cx={m + c * cell} cy={m + r * cell} r={18.5}
                fill={v === "b" ? "url(#stB)" : "url(#stW)"}
                className={v === "b" ? "stone-b" : "stone-w"} />
              {isLast && <circle cx={m + c * cell} cy={m + r * cell} r={7} className="last-dot" />}
            </g>
          );
        })}
        {Array.from({ length: N * N }).map((_, i) => {
          const c = i % N, r = Math.floor(i / N);
          return (
            <rect key={"h" + i}
              x={m + c * cell - cell / 2} y={m + r * cell - cell / 2}
              width={cell} height={cell} fill="transparent"
              style={{ cursor: disabled ? "default" : "pointer" }}
              role="gridcell"
              aria-label={`${String.fromCharCode(65 + c)}${N - r}${board.cells[i] ? (board.cells[i] === "b" ? ", black stone" : ", white stone") : ""}`}
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
