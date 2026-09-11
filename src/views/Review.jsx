import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronsLeft, ChevronsRight, ChevronRight, SkipBack, SkipForward, Hash, Download, Swords,
  GitBranch, Undo2, CornerUpLeft,
} from "lucide-react";
import { Btn, Pill } from "../components/ui.jsx";
import { startLine, playInLine, backInLine, lineLabel, canBranch, reviewLabelText } from "./reviewLine.js";
import { refusalText, resultSentence } from "./gameStatus.js";
import { useT } from "../components/langStore.js";
import { Board } from "../components/Board.jsx";
import {
  atMove, moveNumbers, captureMoves, nextCapture, prevCapture,
  reviewLength, clampMove, markerAt, toSgf, lastMoveIndex,
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

export function Review({ record, onExit, onRematch, profile = {} }) {
  const t = useT();
  const total = reviewLength(record);
  const [n, setN] = useState(total);
  const [showNumbers, setShowNumbers] = useState(false);
  // A line being tried from the position on screen. Scratch: never written to the
  // record, never exported. Null means you are looking at the game itself.
  const [line, setLine] = useState(null);
  const [refused, setRefused] = useState(null);

  const at = useMemo(() => atMove(record, n), [record, n]);
  const numbers = useMemo(() => (showNumbers ? moveNumbers(record, n) : null), [showNumbers, record, n]);
  const caps = useMemo(() => captureMoves(record), [record]);
  const marker = useMemo(() => markerAt(record, n), [record, n]);

  /* Moving to another position leaves the line behind. A line belongs to the position
     it started from, and carrying it along would show stones from a variation on top
     of a real position, which is exactly the confusion review exists to avoid. */
  const go = useCallback((to) => {
    setLine(null);
    setRefused(null);
    setN((cur) => clampMove(record, typeof to === "function" ? to(cur) : to));
  }, [record]);

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

  const branchable = useMemo(() => canBranch(record, n), [record, n]);
  const onTry = (c, r) => {
    const from = line ?? startLine(record, n);
    const res = playInLine(from, c, r);
    if (res.error) { setRefused(refusalText(res.error, t) ?? t("review.illegal")); return; }
    setRefused(null);
    setLine(res.line);
  };
  const undoTry = () => { setRefused(null); setLine(backInLine(record, line)); };

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
        <Btn icon={ChevronLeft} small onClick={onExit}>{t("review.back")}</Btn>
        <span className="review-result">{resultSentence(record.result, t) ?? t("review.unfinished")}</span>
      </div>
      <div className="play-wrap">
        <div className="board-col stack-sm">
          <Pill icon={line ? GitBranch : Hash} tone={line ? "win" : ""}>
            {line ? lineLabel(line, t) : reviewLabelText(record, n, t) + (capHere ? ` · ${t("review.captured", { count: capHere.stones })}` : "")}
          </Pill>
          <Board board={(line ? line.record : at).board}
            lastMove={line ? lastMoveIndex(line.record) : marker}
            onPlay={branchable ? onTry : undefined}
            disabled={!branchable}
            sizePx={BOARD_PX[record.size] ?? 680}
            numbers={line ? null : numbers} captured={[]}
            coordinates={profile.coordinates} mark={profile.lastMoveMark ?? "dot"} />
          {refused && <p className="review-refused" role="alert">{refused}</p>}
          {line ? (
            <div className="row review-controls">
              <Btn icon={Undo2} small onClick={undoTry}>{t("review.takeBack")}</Btn>
              <Btn icon={CornerUpLeft} small primary onClick={() => { setLine(null); setRefused(null); }}>
                {t("review.backToGame")}
              </Btn>
            </div>
          ) : null}
          <input className="review-scrub" type="range" min={0} max={total} value={n}
            aria-label={t("review.move")} onChange={(e) => go(Number(e.target.value))} />
          <div className="row review-controls">
            <Btn icon={ChevronsLeft} small label={t("review.start")} onClick={() => go(0)} disabled={n === 0} />
            <Btn icon={SkipBack} small label={t("review.prevCapture")} onClick={() => go(back.move)} disabled={!back} />
            <Btn icon={ChevronLeft} small label={t("review.backOne")} onClick={() => go((c) => c - 1)} disabled={n === 0} />
            <span className="review-count" aria-live="polite">{n} / {total}</span>
            <Btn icon={ChevronRight} small label={t("review.forwardOne")} onClick={() => go((c) => c + 1)} disabled={n === total} />
            <Btn icon={SkipForward} small label={t("review.nextCapture")} onClick={() => go(fwd.move)} disabled={!fwd} />
            <Btn icon={ChevronsRight} small label={t("review.end")} onClick={() => go(total)} disabled={n === total} />
          </div>
          <div className="row review-controls">
            <Btn icon={Hash} small onClick={() => setShowNumbers((s) => !s)}>
              {t(showNumbers ? "review.hideNumbers" : "review.moveNumbers")}
            </Btn>
            <Btn icon={Download} small onClick={downloadSgf}>{t("review.sgf")}</Btn>
            {onRematch && <Btn icon={Swords} small onClick={onRematch}>{t("review.playAgain")}</Btn>}
          </div>
          <p className="fine">
            {branchable ? t("review.tryLine") : ""}
            {t("review.keys")}{" "}
            {caps.length === 0 ? t("review.noCaptures") : t("review.captures", { count: caps.length })}
          </p>
        </div>
      </div>
    </div>
  );
}
