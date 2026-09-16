import { useState, useMemo } from "react";
import { idx, starPoints, colLabel, rowLabel, pointLabel } from "../engine/index.js";
import { CELL, MARGIN, boardSpan } from "./boardGeometry.js";

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
     wrong      one {c, r} to cross out briefly after a wrong lesson move
     pointed    [{c, r}] the points a chat line named, ringed outside the stone
                and drawn after it. `marks` cannot do this job: it is painted
                before the stones and an SVG has no z-index, so a mark on an
                occupied point is hidden under the stone that is sitting on it.
                Lessons ring empty points and never noticed; a sentence at a
                table is usually about a stone that is already there.
     pending    one {c, r, color}: a stone the player has staged but not yet
                played, drawn faint under a dashed ring. The board only shows
                it; whether a move needs confirming, and what confirms it, is
                the caller's business. */
export function Board({
  board, onPlay, lastMove, marks = [], disabled, sizePx = 460, flash = [],
  atari = [], captured = [], captureKey = 0, territory = null, dead = [], wrong = null,
  numbers = null, coordinates = false, mark = "dot", pending = null, pointed = [],
  crop = null,
}) {
  const N = board.size;
  const cell = CELL, m = MARGIN;
  const S = boardSpan(N);
  const [hover, setHover] = useState(null);
  const flashSet = useMemo(() => new Set(flash.map(p => idx(N, p[0] ?? p.c, p[1] ?? p.r))), [flash, N]);
  const atariSet = useMemo(() => new Set(atari), [atari]);
  const deadSet = useMemo(() => new Set(dead), [dead]);
  const scoring = !!territory;
  const x = (c) => m + c * cell, y = (r) => m + r * cell;
  /* `crop` shows part of a board without changing the board. Only the viewBox
     moves: the lines are the real lines, the edge is the real edge, and a
     stone on the third line is still on the third line. It is for a corner
     sequence on nineteen lines, where the whole board drawn at page width
     leaves six stones the size of full stops. */
  const view = crop
    ? `${x(crop.c0) - m} ${y(crop.r0) - m} ${(crop.c1 - crop.c0) * cell + m * 2} ${(crop.r1 - crop.r0) * cell + m * 2}`
    : `0 0 ${S} ${S}`;
  return (
    <div className="board-well" style={{ maxWidth: sizePx }}>
      <svg
        viewBox={view}
        className={`goban ${scoring ? "scoring" : ""}`}
        onMouseLeave={() => setHover(null)}
        role="grid"
        aria-label={`Go board, ${N} by ${N}`}
      >
        <defs>
          <radialGradient id="stB" cx="0.36" cy="0.34" r="0.85">
            <stop offset="0%" stopColor="var(--stone-b-1)" />
            <stop offset="55%" stopColor="var(--stone-b-2)" />
            <stop offset="100%" stopColor="var(--stone-b-3)" />
          </radialGradient>
          <radialGradient id="stW" cx="0.36" cy="0.34" r="0.85">
            <stop offset="0%" stopColor="var(--stone-w-1)" />
            <stop offset="60%" stopColor="var(--stone-w-2)" />
            <stop offset="100%" stopColor="var(--stone-w-3)" />
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
        {coordinates && Array.from({ length: N }).map((_, i) => (
          <g key={"co" + i} className="coord" aria-hidden="true">
            <text x={x(i)} y={m - 16} textAnchor="middle">{colLabel(i)}</text>
            <text x={x(i)} y={y(N - 1) + 24} textAnchor="middle">{colLabel(i)}</text>
            <text x={m - 18} y={y(i)} textAnchor="middle" dominantBaseline="central">{rowLabel(N, i)}</text>
            <text x={x(N - 1) + 18} y={y(i)} textAnchor="middle" dominantBaseline="central">{rowLabel(N, i)}</text>
          </g>
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
        {hover && !disabled && !scoring && board.cells[idx(N, hover.c, hover.r)] === null
          && !(pending && pending.c === hover.c && pending.r === hover.r) && (
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
                isLast && !isDead && mark !== "none" && (
                  mark === "ring"
                    ? <circle cx={x(c)} cy={y(r)} r={13} className="last-ring" />
                    : <circle cx={x(c)} cy={y(r)} r={7} className="last-dot" />
                )
              )}
            </g>
          );
        })}
        {pending && (
          <g className="stone-staged">
            <circle cx={x(pending.c)} cy={y(pending.r)} r={18.5}
              fill={pending.color === "b" ? "url(#stB)" : "url(#stW)"}
              className={pending.color === "b" ? "stone-b" : "stone-w"} />
            <circle cx={x(pending.c)} cy={y(pending.r)} r={21.5} className="staged-ring" />
          </g>
        )}
        {pointed.map((p, i) => (
          <circle key={"pt" + i} cx={x(p.c)} cy={y(p.r)} r={21} className="point-ring" />
        ))}
        {Array.from({ length: N * N }).map((_, i) => {
          const c = i % N, r = Math.floor(i / N);
          const stone = board.cells[i];
          const staged = pending && pending.c === c && pending.r === r;
          const label = `${pointLabel(N, c, r)}${stone ? (stone === "b" ? ", black stone" : ", white stone") : ""}${deadSet.has(i) ? ", marked dead" : ""}${staged ? ", move waiting to be confirmed" : ""}`;
          return (
            <rect key={"h" + i}
              x={x(c) - cell / 2} y={y(r) - cell / 2}
              width={cell} height={cell} fill="transparent"
              style={{ cursor: disabled ? "default" : "pointer" }}
              role="gridcell"
              aria-label={label}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled) { e.preventDefault(); onPlay?.(c, r); } }}
              onMouseEnter={disabled ? undefined : () => setHover({ c, r })}
              onClick={() => !disabled && onPlay?.(c, r)}
            />
          );
        })}
      </svg>
    </div>
  );
}
