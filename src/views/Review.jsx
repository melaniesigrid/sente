import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronsLeft, ChevronsRight, ChevronRight, SkipBack, SkipForward, Hash, Download, Swords,
  GitBranch, Undo2, CornerUpLeft, LineChart, Square, Lightbulb, TriangleAlert,
} from "lucide-react";
import { Btn, Pill } from "../components/ui.jsx";
import { themeVars, REVIEW_THEME } from "../theme/index.js";
import { startLine, playInLine, backInLine, lineLabel, canBranch, reviewLabelText, winRateLineText } from "./reviewLine.js";
import { refusalText, resultSentence } from "./gameStatus.js";
import { useT } from "../components/langStore.js";
import { Board } from "../components/Board.jsx";
import { legiblePx } from "../components/boardGeometry.js";
import { WinGraph } from "../components/WinGraph.jsx";
import { useAnalysis, remainingText } from "./useAnalysis.js";
import { KE_JIE, reviewLines } from "../content/sensei.js";
import { useTrainerAccess } from "./useTrainer.js";
import { loadAccount } from "../store/account.js";
import { serverEnabled } from "../net/api.js";
import {
  atMove, moveNumbers, captureMoves, nextCapture, prevCapture,
  reviewLength, clampMove, markerAt, toSgf, lastMoveIndex,
  turningPoints, pointAt, pct, steadiness, nextTurn, prevTurn, ANALYSIS_RANK, trainerReport,
} from "../engine/index.js";

/* ----------------------- REVIEW -----------------------
   Walking back through a game that has been played. Every position here is the record
   replayed to that move by the engine, never a separate reconstruction, so what you
   see in review is what was really on the board.

   The board is dead here: review reads, it does not play. Branching off into a
   variation needs the record to hold more than one line, which it does not yet, so
   the variation tree is deliberately not faked; see TODO.md.

   The win rate graph is asked for, never assumed. It is a network run per position,
   which is seconds on 9x9 and minutes on 19x19, and a screen that spent four minutes
   of somebody's battery without being asked would be taking a liberty. Once it is
   drawn it is the fastest way through the game there is: the shape says where the
   game turned, and the turning points below it are buttons straight to those moves.

   Keyboard, because scrubbing with a mouse is miserable: left and right walk a move,
   up and down jump ten, Home and End go to the ends, and N toggles the numbers. The
   handler is on the document, and only while review is open. */

const BOARD_PX = { 9: 460, 13: 560, 19: 730 };

/* A move number is 16px in the board's own units, so what it measures on
   screen depends on how wide the board was actually drawn: 19 lines at 680px
   prints 12.6px type, the same board on a phone prints six. The window is not
   the answer, because the board is not the window: a max-width, the sheet's
   padding, the well's padding and the side column all take their cut, and the
   guesses add up to more than the margin they are guessing about.

   So measure the board that got drawn. `legiblePx(size)` is the width below
   which the type floor is broken, and the observer re-answers on a rotation or
   a drag without anyone having to predict either. */
function useLegibleNumbers(size) {
  const ref = useRef(null);
  const [legible, setLegible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    // No ResizeObserver (jsdom, an old browser) means no measurement to go on,
    // and a printed record's numbers are the thing being defended: leave them.
    if (!el || typeof ResizeObserver === "undefined") return;
    const floor = legiblePx(size);
    const read = () => {
      const svg = el.querySelector(".goban");
      if (svg) setLegible(svg.getBoundingClientRect().width >= floor);
    };
    const obs = new ResizeObserver(read);
    obs.observe(el);
    read();
    return () => obs.disconnect();
  }, [size]);
  return [ref, legible];
}

export function Review({ record, onExit, onRematch, profile = {} }) {
  const t = useT();
  const total = reviewLength(record);
  const [n, setN] = useState(total);
  /* A kifu is printed with its move numbers on, so review opens with them on
     wherever they can be read, and drops them where they would be drawn under
     the type floor. Null means nobody has said: the board decides, and keeps
     deciding as the window turns. The first press takes it over for good,
     which is why the toggle reads the answer rather than the choice. */
  const [boardRef, numbersLegible] = useLegibleNumbers(record.size);
  const [numbersChoice, setNumbersChoice] = useState(null);
  const showNumbers = numbersChoice ?? numbersLegible;
  const toggleNumbers = useCallback(() => setNumbersChoice(!showNumbers), [showNumbers]);
  // A line being tried from the position on screen. Scratch: never written to the
  // record, never exported. Null means you are looking at the game itself.
  const [line, setLine] = useState(null);
  const [refused, setRefused] = useState(null);
  // The graph, and whether the board is showing what the network would have done.
  const analysis = useAnalysis(record, { auto: record.phase === "ended" });
  const [showBest, setShowBest] = useState(false);
  /* The trainer, when he is at the table: once the graph is drawn he will say
     what it means, in his words, for any game at all, opened or played here. */
  const trainerOn = useTrainerAccess(profile, serverEnabled() ? loadAccount() : null);
  const [asked, setAsked] = useState(false);
  const askHim = () => setAsked(true);
  const hisWords = asked && analysis.complete
    ? reviewLines(trainerReport(analysis.points, [], "b"), { won: record.result ? record.result.winner === "b" : null, size: record.size, points: analysis.points })
    : null;

  const at = useMemo(() => atMove(record, n), [record, n]);
  const numbers = useMemo(() => (showNumbers ? moveNumbers(record, n) : null), [showNumbers, record, n]);
  const caps = useMemo(() => captureMoves(record), [record]);
  const marker = useMemo(() => markerAt(record, n), [record, n]);
  const note = at.moves.length ? (at.moves[at.moves.length - 1].comment ?? null) : (at.comment ?? null);

  /* Moving to another position leaves the line behind. A line belongs to the position
     it started from, and carrying it along would show stones from a variation on top
     of a real position, which is exactly the confusion review exists to avoid. */
  const go = useCallback((to) => {
    setLine(null);
    setRefused(null);
    setN((cur) => clampMove(record, typeof to === "function" ? to(cur) : to));
  }, [record]);

  const turns = useMemo(() => turningPoints(analysis.points), [analysis.points]);
  const steady = useMemo(() => steadiness(analysis.points), [analysis.points]);

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
        "[": () => { const t = prevTurn(turns, n); if (t) go(t.move); },
        "]": () => { const t = nextTurn(turns, n); if (t) go(t.move); },
      };
      const act = keys[e.key] || (e.key.toLowerCase() === "n" ? toggleNumbers : null);
      if (!act) return;
      e.preventDefault();
      act();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, total, n, turns, toggleNumbers]);

  /* The move the network would have made. Standing after move n, the question a
     reader is asking is about the position move n was played into, which is the
     one before it; at the start there is no "instead", only an opening. */
  const advisedFrom = pointAt(analysis.points, n === 0 ? 0 : n - 1);
  const here = pointAt(analysis.points, n);
  // Only compare against the played move once this position has actually been walked;
  // during a partial walk `here` is missing, and calling it "instead" would be a
  // sentence about a move the network has not seen yet.
  const knowsThisMove = n === 0 || !!here;
  const advice = showBest && advisedFrom && !line ? advisedFrom.best : null;
  const played = here ? here.played : null;
  const sameAsPlayed = !!(advice && played && advice[0] === played.c && advice[1] === played.r);
  const marks = advice ? [{ c: advice[0], r: advice[1] }] : [];
  // The network's pick is a pass often enough at the end of a game, and a pass has no
  // point to ring. Saying so beats a toggle that looks broken.
  const advisePass = showBest && !line && advisedFrom && advisedFrom.best === null;

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

  /* Review brings its own room. A finished game is a document rather than a
     table, so it is read on the printed page (Kifu) whichever room the player
     plays in, and it is drawn as a sheet laid on that table rather than as a
     repaint of the whole app: the chrome around it stays where the player left
     it. The custom properties inherit, so setting them here is the whole of it.
     The stones follow, because a set of stones is the player's, not a room's. */
  return (
    <div className="stack review-room" style={themeVars(REVIEW_THEME, null, profile.stones)}>
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>{t("review.back")}</Btn>
        <span className="review-result">{resultSentence(record.result, t) ?? t("review.unfinished")}</span>
      </div>
      <div className="play-wrap">
        <div className="board-col stack-sm" ref={boardRef}>
          <Pill icon={line ? GitBranch : Hash} tone={line ? "win" : ""}>
            {line ? lineLabel(line, t) : reviewLabelText(record, n, t) + (capHere ? ` · ${t("review.captured", { count: capHere.stones })}` : "")}
          </Pill>
          <Board board={(line ? line.record : at).board}
            lastMove={line ? lastMoveIndex(line.record) : marker}
            onPlay={branchable ? onTry : undefined}
            disabled={!branchable}
            sizePx={BOARD_PX[record.size] ?? Math.max(680, legiblePx(record.size))}
            numbers={line ? null : numbers} captured={[]} marks={marks}
            coordinates={profile.coordinates} mark={profile.lastMoveMark ?? "dot"} />
          {refused && <p className="review-refused" role="alert">{refused}</p>}
          {/* A comment on the move, when the record carries one: a trainer's note, or
              whatever the SGF that was opened had to say. The game's own line, never a
              variation's, because a variation is scratch and has no comments to show. */}
          {!line && note && <p className="review-note">{note}</p>}
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
          {(advice || advisePass) && (
            <p className="review-advice">
              {advisePass
                ? t("review.advice.pass")
                : sameAsPlayed
                  ? t("review.advice.same")
                  : n === 0
                    ? t("review.advice.open")
                    : knowsThisMove
                      ? t("review.advice.instead")
                      : t("review.advice.from")}
            </p>
          )}
          {analysis.points.length > 0 && (
            <div className="review-analysis stack-sm">
              <WinGraph points={analysis.points} total={total} current={n} turns={turns} onPick={go} />
              <p className="review-winline" aria-live="polite">
                {winRateLineText(analysis.points, n, t) ?? t("review.notYet")}
              </p>
              {turns.length > 0 && (
                <div className="row review-controls">
                  {turns.map((turn) => (
                    <button key={turn.move} type="button" className={`turn-chip${n === turn.move ? " on" : ""}`}
                      onClick={() => go(turn.move)}
                      aria-label={t("review.turnAria", {
                        move: turn.move,
                        side: turn.color === "b" ? t("review.black") : t("review.white"),
                        cost: pct(turn.cost),
                      })}>
                      <TriangleAlert size={13} aria-hidden="true" />
                      <span>{t("review.turnMove", { move: turn.move })}</span>
                      <span className="turn-cost">{turn.color === "b" ? t("review.blackShort") : t("review.whiteShort")} &minus;{pct(turn.cost)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="row review-controls">
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
                {analysis.points.length ? t("review.keepAnalysing") : t("review.winGraph")}
              </Btn>
            ) : null}
            {analysis.points.length > 0 && (
              <Btn icon={Lightbulb} small onClick={() => setShowBest((v) => !v)}>
                {showBest ? t("review.hideBest") : t("review.showBest")}
              </Btn>
            )}
            {trainerOn && analysis.complete && !asked && (
              <Btn small primary onClick={askHim}>{t("review.trainer.ask", { name: KE_JIE.name })}</Btn>
            )}
          </div>
          {analysis.error && <p className="review-refused" role="alert">{analysis.error}</p>}
          {hisWords && (
            <div className="trainer-review stack-sm">
              {hisWords.map((para, i) => <p key={i} className="lesson-text">{para}</p>)}
            </div>
          )}
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
            <Btn icon={Hash} small onClick={toggleNumbers}>
              {t(showNumbers ? "review.hideNumbers" : "review.moveNumbers")}
            </Btn>
            <Btn icon={Download} small onClick={downloadSgf}>{t("review.sgf")}</Btn>
            {onRematch && <Btn icon={Swords} small onClick={onRematch}>{t("review.playAgain")}</Btn>}
          </div>
          {analysis.complete && steady.b && steady.w && (
            <p className="fine">
              Over the whole game Black gave away {pct(steady.b.mean)} of the win rate on an
              average move and White {pct(steady.w.mean)}. That is a count of one network's
              second thoughts about one game, not a measure of how strong either player is.
            </p>
          )}
          {analysis.points.length > 0 && (
            <p className="fine">
              The graph is KataGo's human-style network asked at {ANALYSIS_RANK}, one look per
              position and no reading past it. It is an opinion about who stood better, not a
              count of the board, and it runs on your own machine: nothing about this game is
              sent anywhere.
            </p>
          )}
          <p className="fine">
            {total > 0 && analysis.points.length === 0 ? t("review.graphNote") : ""}
            {branchable ? t("review.tryLine") : ""}
            {t("review.keys")}{turns.length > 0 ? t("review.turnKeys") : ""}{" "}
            {caps.length === 0 ? t("review.noCaptures") : t("review.captures", { count: caps.length })}
          </p>
        </div>
      </div>
    </div>
  );
}
