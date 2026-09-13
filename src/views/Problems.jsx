import { useState } from "react";
import { Check, X, RotateCcw, SkipForward, CalendarCheck, Flame, Swords, Shapes, Eye, CornerDownLeft } from "lucide-react";
import { tryPlay } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Statement } from "../components/ui.jsx";
import { ScreenHeader } from "../components/ScreenHeader.jsx";
import { plainFor, statementFor } from "../content/plain.js";
import { Passage } from "../components/Passage.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import {
  PROBLEMS, SETS, setById, problemsInSet, setProgress, setsComplete, nextProblem,
  localizeProblem, localizeSet,
} from "../content/problems.js";
import { setupToBoard } from "../content/positions.js";
import { dayKey, dailyProblem, attend, liveStreak } from "../content/kata.js";
import { attendDay } from "../content/chain.js";
import { saveProfile } from "../store/profile.js";
import { useT } from "../components/langStore.js";

/* ----------------------- TSUMEGO -----------------------
   `initialId` opens a specific problem (the Home card's kata of the day).
   Solving today's kata records attendance; the streak lives in the profile.

   The index used to be one strip of numbered circles, which told a reader
   nothing: not where they were, not what the next board was for, not what they
   had finished. It is four sets now, each with its name, what it trains and
   how much of it is done, and the strip under a set is that set's problems in
   the order they are meant to be read. Same circles, same one click to a
   board; the words around them are the change. */

const SET_ICONS = { tactics: Swords, shape: Shapes, eyes: Eye, corner: CornerDownLeft };

export function ProblemsView({ profile, setProfile, initialId }) {
  const t = useT();
  const today = dayKey();
  const kata = dailyProblem(PROBLEMS, today);
  /* Where the screen opens. The kata card asks for a specific board and always
     wins; otherwise it is the first board still open in the set the reader is
     working through, because opening on board one for somebody who solved board
     one last week is asking them to find their own place in a list. */
  const startId = initialId && PROBLEMS.some(p => p.id === initialId)
    ? initialId
    : nextProblem(profile.problemsDone).id;
  const [activeId, setActiveId] = useState(startId);
  const authored = PROBLEMS.find(p => p.id === activeId);
  const prob = localizeProblem(authored, t);
  const [state, setState] = useState(() => ({ board: setupToBoard(prob.setup), status: "open", flash: [] }));
  const streak = liveStreak(profile, today);
  const isKata = kata && prob.id === kata.id;
  const set = localizeSet(setById(authored.set), t);
  const solvedIds = state.status === "solved" && !profile.problemsDone.includes(prob.id)
    ? [...profile.problemsDone, prob.id]
    : profile.problemsDone;
  const done = setsComplete(solvedIds);
  /* Whether the board just solved was the last one open in its set. Read from
     the profile after the solve, so it is a fact about the collection rather
     than a flag the solve handler had to remember to set. */
  const justFinished = state.status === "solved" && setProgress(authored.set, solvedIds).complete;
  useMokuFacts({ view: "tsumego", seed: profile.problemsDone.length });

  const load = (id) => {
    const p = PROBLEMS.find(x => x.id === id);
    setActiveId(id);
    setState({ board: setupToBoard(p.setup), status: "open", flash: [] });
  };

  const onPlay = (c, r) => {
    if (state.status === "solved") return;
    const ok = authored.answers.some(p => p.c === c && p.r === r);
    /* A move that kills only because the defender may not retake a ko is a
       right answer with a footnote, not a wrong one. The board accepts it and
       then says what it cost. */
    const byKo = !ok && (authored.koAnswers || []).some(p => p.c === c && p.r === r);
    const res = tryPlay(state.board, c, r, prob.toPlay);
    if ((ok || byKo) && res.ok) {
      setState({ board: res.board, status: "solved", flash: res.captured, byKo });
      setProfile(pr => {
        const np = {
          ...pr,
          problemsDone: [...new Set([...pr.problemsDone, prob.id])],
          ...(isKata ? attend(pr, today) : {}),
          ...attendDay(pr, today),
        };
        saveProfile(np);
        return np;
      });
    } else if (res.ok) {
      setState({ board: res.board, status: "wrong", flash: res.captured });
      setTimeout(() => load(prob.id), 1100);
    }
  };

  /* The next board is the next one in this set, and after the last one it is
     the first of the next set, because the sets are ordered too. */
  const curIdx = PROBLEMS.findIndex(p => p.id === activeId);
  const next = PROBLEMS[curIdx + 1] || null;

  return (
    <div className="stack arrives">
      <ScreenHeader
        label={t("tsumego.label")}
        title={<>{t("tsumego.titleBefore")}<em>{t("tsumego.titleEm")}</em>{t("tsumego.titleAfter")}</>}
        lede={t("tsumego.lede")} />
      <Statement lines={statementFor("tsumego", t)} figure="tsumego">{plainFor("tsumego", t)}</Statement>
      <Passage context="tsumego" />

      <div className="prob-sets">
        {SETS.map(raw => {
          const s = localizeSet(raw, t);
          const mine = problemsInSet(s.id);
          const { solved, total, complete } = setProgress(s.id, profile.problemsDone);
          const Icon = SET_ICONS[s.id] || Eye;
          return (
            <section key={s.id} className={`prob-set ${s.id === set.id ? "here" : ""} ${complete ? "complete" : ""}`}>
              <div className="stat-head prob-set-head">
                <Icon size={16} />
                <span>{s.name}</span>
                {/* A finished set says so instead of saying 4 of 4. A count is
                    what you read while you are still counting. */}
                <span className="prob-set-count">
                  {complete
                    ? <><Check size={13} /> {t("tsumego.setDone")}</>
                    : t("tsumego.setProgress", { done: solved, total })}
                </span>
              </div>
              <p className="fine prob-set-blurb">{s.blurb}</p>
              <div className="prob-tabs" role="tablist" aria-label={s.name}>
                {mine.map((p, i) => {
                  const isDone = profile.problemsDone.includes(p.id);
                  return (
                    <button key={p.id} role="tab" aria-selected={p.id === activeId}
                      className={`prob-tab ${p.id === activeId ? "active" : ""} ${isDone ? "done" : ""} ${kata && p.id === kata.id ? "kata" : ""}`}
                      onClick={() => load(p.id)}
                      aria-label={t("tsumego.openProblem", { set: s.name, n: i + 1, rank: p.rank })}
                      title={kata && p.id === kata.id ? t("tsumego.kataTitle") : undefined}>
                      {isDone ? <Check size={13} /> : <span className="prob-n">{i + 1}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {done.length > 0 && (
        <p className="fine prob-sets-done">
          {t("tsumego.setsDone", { done: done.length, total: SETS.length })}
        </p>
      )}

      <div className="play-wrap">
        <Board board={state.board} onPlay={onPlay} disabled={state.status === "solved"} flash={state.flash} captured={state.flash} captureKey={state.status} />
        <div className="side stack-sm">
          <Card>
            <div className="prob-head">
              <span className="rank-chip">{prob.rank}</span>
              <span className="theme-chip">{set.name}</span>
              {isKata && <span className="theme-chip kata-chip"><CalendarCheck size={11} /> {t("tsumego.kataChip")}</span>}
            </div>
            <h3 className="prob-title">{prob.title}</h3>
            <p className="lesson-text">{prob.prompt}</p>
            {state.status === "solved" && (
              <p className="lesson-text success-row"><Check size={16} /> {prob.explain}</p>
            )}
            {state.status === "solved" && state.byKo && prob.koNote && (
              <p className="fine hint-row">{prob.koNote}</p>
            )}
            {justFinished && (
              <p className="fine hint-row"><Check size={14} /> {t("tsumego.setFinished", { set: set.name })}</p>
            )}
            {state.status === "solved" && isKata && profile.kataDate === today && (
              <p className="fine hint-row"><Flame size={14} /> {t("tsumego.attendance", { count: streak })}</p>
            )}
            {state.status === "wrong" && (
              <p className="fine wrong-row"><X size={14} /> {t("tsumego.wrong")}</p>
            )}
          </Card>
          <div className="row">
            <Btn icon={RotateCcw} small onClick={() => load(prob.id)}>{t("tsumego.reset")}</Btn>
            {state.status === "solved" && next && (
              <Btn icon={SkipForward} small primary onClick={() => load(next.id)}>
                {next.set === authored.set ? t("tsumego.next") : t("tsumego.nextSet")}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
