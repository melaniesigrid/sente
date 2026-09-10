import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronsLeft, ChevronsRight, ChevronRight, SkipBack, SkipForward, Hash, Download, Swords,
} from "lucide-react";
import { Btn, Pill } from "../components/ui.jsx";
import { Board } from "../components/Board.jsx";
import {
  atMove, moveNumbers, captureMoves, nextCapture, prevCapture,
  reviewLength, clampMove, markerAt, reviewLabel, resultText, toSgf,
} from "../engine/index.js";

/* ----------------------- REVIEW -----------------------
   Walking back through a game that has been played. Every position here is the record
   replayed to that move by the engine, never a separate reconstruction, so what you
   see in review is what was really on the board.

   The board is dead here: review reads, it does not play. Branching off into a
   variation needs the record to hold more than one line, which it does not yet, so
   the variation tree is deliberately not faked — see TODO.md.

   Keyboard, because scrubbing with a mouse is miserable: left and right walk a move,
   up and down jump ten, Home and End go to the ends, and N toggles the numbers. The
   handler is on the document, and only while review is open. */

const BOARD_PX = { 9: 460, 13: 560, 19: 680 };

export function Review({ record, onExit, onRematch }) {
  const total = reviewLength(record);
  const [n, setN] = useState(total);
  const [showNumbers, setShowNumbers] = useState(false);

  const at = useMemo(() => atMove(record, n), [record, n]);
  const numbers = useMemo(() => (showNumbers ? moveNumbers(record, n) : null), [showNumbers, record, n]);
  const caps = useMemo(() => captureMoves(record), [record]);
  const marker = useMemo(() => markerAt(record, n), [record, n]);

  const go = useCallback((to) => setN((cur) => clampMove(record, typeof to === "function" ? to(cur) : to)), [record]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const keys = {
        ArrowLeft: () => go((c) => c - 1),
        ArrowRight: () => go((c) => c + 1),
        ArrowDown: () => go((c) => c - 10),
        ArrowUp: () => go((c) => c + 10),
        Home: () => go(0),
        End: () => go(total),
      };
      const act = keys[e.key] || (e.key.toLowerCase() === "n" ? () => setShowNumbers((s) => !s) : null);
      if (!act) return;
      e.preventDefault();
      act();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, total]);

  const back = prevCapture(caps, n);
  const fwd = nextCapture(caps, n);
  const capHere = caps.find((c) => c.move === n);

  const downloadSgf = () => {
    const blob = new Blob([toSgf(record)], { type: "application/x-go-sgf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sente-game.sgf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>Back</Btn>
        <span className="review-result">{resultText(record) ?? "Unfinished game"}</span>
      </div>
      <div className="play-wrap">
        <div className="board-col stack-sm">
          <Pill icon={Hash}>{reviewLabel(record, n)}{capHere ? ` · ${capHere.stones} captured` : ""}</Pill>
          <Board board={at.board} lastMove={marker} disabled sizePx={BOARD_PX[record.size] ?? 680}
            numbers={numbers} captured={[]} />
          <input className="review-scrub" type="range" min={0} max={total} value={n}
            aria-label="Move" onChange={(e) => go(Number(e.target.value))} />
          <div className="row review-controls">
            <Btn icon={ChevronsLeft} small label="Start" onClick={() => go(0)} disabled={n === 0} />
            <Btn icon={SkipBack} small label="Previous capture" onClick={() => go(back.move)} disabled={!back} />
            <Btn icon={ChevronLeft} small label="Back one move" onClick={() => go((c) => c - 1)} disabled={n === 0} />
            <span className="review-count" aria-live="polite">{n} / {total}</span>
            <Btn icon={ChevronRight} small label="Forward one move" onClick={() => go((c) => c + 1)} disabled={n === total} />
            <Btn icon={SkipForward} small label="Next capture" onClick={() => go(fwd.move)} disabled={!fwd} />
            <Btn icon={ChevronsRight} small label="End" onClick={() => go(total)} disabled={n === total} />
          </div>
          <div className="row review-controls">
            <Btn icon={Hash} small onClick={() => setShowNumbers((s) => !s)}>
              {showNumbers ? "Hide numbers" : "Move numbers"}
            </Btn>
            <Btn icon={Download} small onClick={downloadSgf}>SGF</Btn>
            {onRematch && <Btn icon={Swords} small onClick={onRematch}>Play again</Btn>}
          </div>
          <p className="fine">
            Arrows walk a move, up and down jump ten, Home and End go to the ends, N toggles
            numbers. {caps.length === 0 ? "Nothing was captured in this game." : `${caps.length} capture${caps.length === 1 ? "" : "s"} in this game.`}
          </p>
        </div>
      </div>
    </div>
  );
}
