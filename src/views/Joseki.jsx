import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, CornerDownRight, Play, Pause, BookOpen, Bot } from "lucide-react";
import { createBoard, tryPlay, idx } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, Statement } from "../components/ui.jsx";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import {
  CORNERS, BOARD, SOURCE, cornerById, josekiForCorner, colourAt,
  localizeJoseki, localizeCorner, sourceCredit,
} from "../content/joseki.js";
import { useT } from "../components/langStore.js";

/* ----------------------- THE CORNER DICTIONARY -----------------------
   A joseki is a sequence, so the screen is a sequence: one board, a slider of
   moves under it, and the reason for the move you are standing on beside it.
   Stepping is the whole interaction. There is no quiz here and there should
   not be: a dictionary is read, and the library is where you are asked
   questions about what you read.

   The board is the full nineteen lines rather than a cropped corner, because
   a joseki's whole argument is about what the rest of the board looks like,
   and a corner cut out of its board hides the thing the reader most needs to
   keep in mind. */

const REPLAY_MS = 750;
/* The corner every sequence is played in, with air past the furthest stone so
   a reader can see where the edge stops. */
const CROP = { c0: 0, r0: 0, c1: 10, r1: 10 };

/** The position after `n` moves, with the numbers to print on it. */
function replay(moves, n) {
  let board = createBoard(BOARD);
  const numbers = new Map();
  for (let i = 0; i < n; i++) {
    const m = moves[i];
    const res = tryPlay(board, m.c, m.r, colourAt(i));
    if (!res.ok) break;
    board = res.board;
    numbers.set(idx(BOARD, m.c, m.r), String(i + 1));
  }
  return { board, numbers };
}

export function JosekiView() {
  const t = useT();
  const written = CORNERS.filter(c => c.written);
  const [cornerId, setCornerId] = useState(written[0]?.id ?? null);
  const list = useMemo(() => (cornerId ? josekiForCorner(cornerId) : []), [cornerId]);
  const firstOpenId = list[0]?.id ?? null;
  const [openId, setOpenId] = useState(list[0]?.id ?? null);
  const selectedOpenId = list.some(item => item.id === openId) ? openId : firstOpenId;
  const authored = list.find(item => item.id === selectedOpenId) || null;
  const j = authored ? localizeJoseki(authored, t) : null;
  const [at, setAt] = useState(authored?.moves.length ?? 0);
  const [running, setRunning] = useState(false);
  useMokuFacts({ view: "joseki", seed: authored?.moves.length ?? 0 });
  const defaultAt = authored?.moves.length ?? 0;
  const shownAt = selectedOpenId === openId ? Math.min(at, defaultAt) : defaultAt;

  useEffect(() => {
    if (selectedOpenId === openId) return;
    setOpenId(selectedOpenId);
    setAt(defaultAt);
    setRunning(false);
  }, [selectedOpenId, openId, defaultAt]);

  const pick = (id) => {
    const next = cornerId ? josekiForCorner(cornerId).find(x => x.id === id) || list[0] : null;
    setOpenId(next?.id ?? null);
    setAt(next?.moves.length ?? 0);
    setRunning(false);
  };

  const pickCorner = (id) => {
    const first = josekiForCorner(id)[0];
    setCornerId(id);
    if (first) { setOpenId(first.id); setAt(first.moves.length); }
    else { setOpenId(null); setAt(0); }
    setRunning(false);
  };

  /* Play it out: one move a beat until the end, then stop. A reader who wants
     to go faster drags the slider; this is for watching it happen. */
  const total = j?.moves.length ?? 0;
  useEffect(() => {
    if (!j || !running || shownAt >= total) return undefined;
    const id = setTimeout(() => {
      const next = shownAt + 1;
      setAt(next);
      if (next >= total) setRunning(false);
    }, REPLAY_MS);
    return () => clearTimeout(id);
  }, [j, running, shownAt, total]);

  const { board, numbers } = replay(j?.moves || [], shownAt);
  const here = j && shownAt > 0 ? j.moves[shownAt - 1] : null;
  const corner = cornerId ? localizeCorner(cornerById(cornerId), t) : null;
  const replayLabel = shownAt === 0 || !j ? t("joseki.beforeFirst") : t("joseki.moveN", { n: shownAt, total: j.moves.length });

  return (
    <div className="stack arrives">
      <ScreenHeader
        label={t("joseki.label")}
        title={<>{t("joseki.titleBefore")}<em>{t("joseki.titleEm")}</em>{t("joseki.titleAfter")}</>}
        lede={t("joseki.lede")} />
      <Statement lines={statementFor("joseki", t)} figure="joseki">{plainFor("joseki", t)}</Statement>
      <Passage context="joseki" />

      {/* The index sits across the top rather than down one side. The board
          below it wants the whole width: a corner of nineteen lines drawn in a
          column is six stones the size of full stops. */}
      <div className="jos-index stack-sm">
        <div className="jos-tabs" role="tablist" aria-label={t("joseki.cornersLabel")}>
          {CORNERS.map(raw => {
            const c = localizeCorner(raw, t);
            const n = josekiForCorner(c.id).length;
            return (
              <button key={c.id} role="tab" aria-selected={c.id === cornerId}
                className={`jos-tab jos-corner ${c.id === cornerId ? "active" : ""} ${c.written ? "" : "locked"}`}
                disabled={!c.written}
                onClick={() => pickCorner(c.id)}>
                <span className="jos-tab-name">{c.id} &middot; {c.term}</span>
                <span className="fine">
                  {c.written ? t("joseki.cornerCount", { count: n }) : t("joseki.cornerOpen")}
                </span>
              </button>
            );
          })}
        </div>
        {corner && <p className="fine jos-corner-blurb">{corner.blurb}</p>}
        <div className="jos-tabs" role="tablist" aria-label={corner?.name || t("joseki.cornersLabel")}>
          {list.map(raw => {
            const item = localizeJoseki(raw, t);
            return (
              <button key={item.id} role="tab" aria-selected={item.id === selectedOpenId}
                className={`jos-tab ${item.id === selectedOpenId ? "active" : ""}`}
                onClick={() => pick(item.id)}>
                <span className="jos-tab-name">{item.name}</span>
                <span className="fine">{item.rank}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="play-wrap">
        {/* Cropped to the quadrant the sequence is played in. The board is
            still nineteen lines and the edge is still the edge; only the
            window on to it has moved. */}
        <Board board={board} numbers={numbers} disabled sizePx={760} crop={CROP}
          lastMove={here ? { c: here.c, r: here.r } : null} />
        <div className="side stack-sm">
          {j ? (
            <>
              <Card>
                <div className="prob-head">
                  <span className="rank-chip">{j.rank}</span>
                  {j.term && <span className="theme-chip">{j.term}</span>}
                </div>
                <h3 className="prob-title">{j.name}</h3>
                <p className="lesson-text">{j.blurb}</p>
              </Card>

              <Card inset className="jos-move">
                <div className="stat-head">
                  <CornerDownRight size={15} />
                  <span>{replayLabel}</span>
                </div>
                {here ? (
                  <>
                    <p className="lesson-text">{here.text}</p>
                    {/* What the network thought of this move, said plainly.
                        A choice is labelled a choice; a first-choice answer
                        carries the number it was given. */}
                    <p className="fine hint-row">
                      <Bot size={14} />
                      {!here.chosen
                        ? t("joseki.answerNote", { pct: Math.round(here.check.p * 100) })
                        : here.check.rank === 1
                          ? t("joseki.choiceTopNote")
                          : t("joseki.choiceNote", { rank: here.check.rank })}
                    </p>
                  </>
                ) : (
                  <p className="fine">{t("joseki.emptyCorner")}</p>
                )}
              </Card>

              <div className="stack-xs" role="region" aria-label={j.name}>
                <div className="visually-hidden" role="status" aria-live="polite">{replayLabel}</div>
                <div className="row">
                  <Btn icon={ChevronLeft} small onClick={() => { setRunning(false); setAt(n => Math.max(0, n - 1)); }}
                    disabled={shownAt === 0}>{t("joseki.back")}</Btn>
                  <Btn icon={running ? Pause : Play} small aria-pressed={running}
                    onClick={() => { if (at >= j.moves.length) setAt(0); setRunning(r => !r); }}>
                    {running ? t("joseki.pause") : t("joseki.playOut")}
                  </Btn>
                  <Btn icon={ChevronRight} small primary
                    onClick={() => { setRunning(false); setAt(n => Math.min(j.moves.length, n + 1)); }}
                    disabled={shownAt >= j.moves.length}>{t("joseki.forward")}</Btn>
                </div>
              </div>

              {shownAt >= j.moves.length && (
                <Card inset>
                  <div className="stat-head"><BookOpen size={15} /><span>{t("joseki.resultHead")}</span></div>
                  <p className="lesson-text">{j.result}</p>
                </Card>
              )}
            </>
          ) : (
            <Card inset>
              <p className="fine">{t("joseki.cornerOpen")}</p>
            </Card>
          )}
        </div>
      </div>

      {/* The citation. It belongs under the boards rather than in a footnote:
          a reader who is going to trust these sequences is owed what they were
          checked against before they leave the screen. */}
      <Card inset className="jos-source">
        <div className="stat-head"><Bot size={15} /><span>{t("joseki.sourceHead")}</span></div>
        <p className="fine">{sourceCredit(t)}</p>
        <div className="fine jos-pills">
          <Pill>{SOURCE.net}</Pill> <Pill>{SOURCE.profile}</Pill> <Pill>{SOURCE.tool}</Pill>
        </div>
      </Card>
    </div>
  );
}
