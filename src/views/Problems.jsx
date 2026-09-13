import { useState } from "react";
import {
  Check, X, RotateCcw, SkipForward, CalendarCheck, Flame, Swords, Shapes, Eye,
  CornerDownLeft, BookOpen, Repeat,
} from "lucide-react";
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
import {
  DRILLS, drillQueue, drillBoard, drillAnswers, drillPrompt, drillExplain,
  drillProgress, coverage,
} from "../content/drills.js";
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
   the order they are meant to be read.

   The screen holds two things now, and they are different activities sharing
   one board. The collection is the boards somebody wrote, read in order, each
   with something to say. The drill ground is a queue out of
   `content/drills.js`: searched, proved and measured boards, and the eight it
   hands you are the ones a rank above where you stand. Reading and repetition
   both make a player and neither is the other, so they get a switch rather
   than a merge.

   Everything below the board reads `card` rather than the problem, so the two
   cannot drift into behaving differently.

   The drill ground's words are composed rather than written, so they are asked
   for with an English fallback in hand: a language that has not been given
   these lines yet shows them in English, the way an untranslated lesson does,
   rather than showing a key. */

const SET_ICONS = { tactics: Swords, shape: Shapes, eyes: Eye, corner: CornerDownLeft };
const QUEUE = 8;

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
  const [mode, setMode] = useState("sets");
  const [activeId, setActiveId] = useState(startId);

  const drillsDone = profile.drillsDone || [];
  const queue = drillQueue(profile.rating, drillsDone, QUEUE);
  const [drillId, setDrillId] = useState(() => (queue[0] ? queue[0].id : null));
  const drill = mode === "drills"
    ? (queue.find(d => d.id === drillId) || queue[0] || null)
    : null;

  const authored = PROBLEMS.find(p => p.id === activeId);
  const prob = localizeProblem(authored, t);
  const set = localizeSet(setById(authored.set), t);

  const card = drill
    ? {
      rank: drill.rank,
      chip: drill.kind === "capture"
        ? t("drill.chip.capture", {}, "Capture")
        : t("drill.chip.life", {}, "Life and death"),
      /* The prompt already names the shape, so the heading says what the
         board is asking for instead of saying the same thing twice. */
      title: drill.kind === "capture"
        ? t("drill.title.capture", {}, "Take it off the board")
        : drill.goal === "kill"
          ? t("drill.title.kill", {}, "Take the second eye")
          : t("drill.title.live", {}, "Make the second eye"),
      prompt: drillPrompt(drill, t),
      explain: drillExplain(drill, t),
      board: () => drillBoard(drill),
      answers: drillAnswers(drill),
      koAnswers: [],
    }
    : {
      rank: prob.rank, chip: set.name, title: prob.title,
      prompt: prob.prompt, explain: prob.explain,
      board: () => setupToBoard(authored.setup),
      answers: authored.answers,
      koAnswers: authored.koAnswers || [],
    };

  const [state, setState] = useState(() => ({ board: card.board(), status: "open", flash: [] }));
  const streak = liveStreak(profile, today);
  const isKata = !drill && kata && prob.id === kata.id;
  const solvedIds = state.status === "solved" && !drill && !profile.problemsDone.includes(prob.id)
    ? [...profile.problemsDone, prob.id]
    : profile.problemsDone;
  const done = setsComplete(solvedIds);
  /* Whether the board just solved was the last one open in its set. Read from
     the profile after the solve, so it is a fact about the collection rather
     than a flag the solve handler had to remember to set. */
  const justFinished = !drill && state.status === "solved"
    && setProgress(authored.set, solvedIds).complete;
  useMokuFacts({ view: "tsumego", seed: profile.problemsDone.length });

  const open = (make) => setState({ board: make(), status: "open", flash: [] });

  const load = (id) => {
    const p = PROBLEMS.find(x => x.id === id);
    setMode("sets");
    setActiveId(id);
    open(() => setupToBoard(p.setup));
  };

  const loadDrill = (d) => {
    setMode("drills");
    setDrillId(d.id);
    open(() => drillBoard(d));
  };

  const switchTo = (next) => {
    if (next === mode) return;
    setMode(next);
    if (next === "drills" && queue[0]) {
      setDrillId(queue[0].id);
      open(() => drillBoard(queue[0]));
    } else if (next === "sets") {
      open(() => setupToBoard(authored.setup));
    }
  };

  const onPlay = (c, r) => {
    if (state.status === "solved") return;
    const ok = card.answers.some(p => p.c === c && p.r === r);
    /* A move that kills only because the defender may not retake a ko is a
       right answer with a footnote, not a wrong one. The board accepts it and
       then says what it cost. */
    const byKo = !ok && card.koAnswers.some(p => p.c === c && p.r === r);
    const res = tryPlay(state.board, c, r, "b");
    if ((ok || byKo) && res.ok) {
      setState({ board: res.board, status: "solved", flash: res.captured, byKo });
      setProfile(pr => {
        const np = drill
          ? {
            ...pr,
            drillsDone: [...new Set([...(pr.drillsDone || []), drill.id])],
            ...attendDay(pr, today),
          }
          : {
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
      setTimeout(() => open(card.board), 1100);
    }
  };

  /* The next board is the next one in this set, and after the last one it is
     the first of the next set, because the sets are ordered too. In the drill
     ground it is the next one in the queue, and the queue refills itself. */
  const curIdx = PROBLEMS.findIndex(p => p.id === activeId);
  const next = PROBLEMS[curIdx + 1] || null;
  const nextDrill = drill
    ? (queue[queue.findIndex(d => d.id === drill.id) + 1] || null)
    : null;
  const band = drillProgress(profile.rating, drillsDone);
  const covers = coverage();

  return (
    <div className="stack arrives">
      <ScreenHeader
        label={t("tsumego.label")}
        title={<>{t("tsumego.titleBefore")}<em>{t("tsumego.titleEm")}</em>{t("tsumego.titleAfter")}</>}
        lede={t("tsumego.lede")} />
      <Statement lines={statementFor("tsumego", t)} figure="tsumego">{plainFor("tsumego", t)}</Statement>
      <Passage context="tsumego" />

      <div className="prob-modes" role="tablist" aria-label={t("drill.modes", {}, "What to work on")}>
        <button type="button" role="tab" aria-selected={mode === "sets"}
          className={`prob-mode ${mode === "sets" ? "active" : ""}`}
          onClick={() => switchTo("sets")}>
          <span className="prob-mode-name"><BookOpen size={15} /> {t("drill.mode.sets", {}, "The collection")}</span>
          <span className="fine">
            {t("drill.mode.setsCount", { n: PROBLEMS.length }, "{n} boards, written one at a time")}
          </span>
        </button>
        <button type="button" role="tab" aria-selected={mode === "drills"}
          className={`prob-mode ${mode === "drills" ? "active" : ""}`}
          onClick={() => switchTo("drills")}>
          <span className="prob-mode-name"><Repeat size={15} /> {t("drill.mode.drills", {}, "The drill ground")}</span>
          <span className="fine">
            {t("drill.mode.drillsCount", { n: covers.total, from: covers.from, to: covers.to },
              "{n} boards, searched and graded, {from} to {to}")}
          </span>
        </button>
      </div>

      {mode === "sets" ? (
        <>
          <div className="prob-sets">
            {SETS.map(raw => {
              const s = localizeSet(raw, t);
              const mine = problemsInSet(s.id);
              const { solved, total, complete } = setProgress(s.id, solvedIds);
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
                      const isDone = solvedIds.includes(p.id);
                      const here = p.id === activeId;
                      return (
                        <button key={p.id} role="tab" aria-selected={here}
                          className={`prob-tab ${here ? "active" : ""} ${isDone ? "done" : ""} ${kata && p.id === kata.id ? "kata" : ""}`}
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
              {t("tsumego.setsDone", { count: done.length, done: done.length, total: SETS.length })}
            </p>
          )}
        </>
      ) : (
        <section className="prob-set here">
          <div className="stat-head prob-set-head">
            <Repeat size={16} />
            <span>{t("drill.queue", {}, "Your queue")}</span>
            <span className="prob-set-count">
              {t("drill.bandProgress", { done: band.solved, total: band.total },
                "{done} of {total} at your level")}
            </span>
          </div>
          <p className="fine prob-set-blurb">
            {t("drill.blurb", {},
              "Eight boards a rank above where you stand, because a problem you can "
              + "already do teaches nothing except that you can do it. Every one was found "
              + "by a search and proved before it was shown to you, and its rank was "
              + "measured rather than assigned.")}
          </p>
          <div className="prob-tabs" role="tablist" aria-label={t("drill.queue", {}, "Your queue")}>
            {queue.map((d, i) => (
              <button key={d.id} role="tab" aria-selected={Boolean(drill) && d.id === drill.id}
                className={`prob-tab ${drill && d.id === drill.id ? "active" : ""}`}
                onClick={() => loadDrill(d)}
                aria-label={t("drill.open", { n: i + 1, rank: d.rank }, "Drill {n}, {rank}")}>
                <span className="prob-n">{i + 1}</span>
              </button>
            ))}
          </div>
          {queue.length === 0 && (
            <p className="fine prob-set-blurb">
              {t("drill.empty", { total: DRILLS.length },
                "Every one of the {total} drills is solved. The collection above is the "
                + "one that is still being written.")}
            </p>
          )}
        </section>
      )}

      <div className="play-wrap">
        <Board board={state.board} onPlay={onPlay} disabled={state.status === "solved"} flash={state.flash} captured={state.flash} captureKey={state.status} />
        <div className="side stack-sm">
          <Card>
            <div className="prob-head">
              <span className="rank-chip">{card.rank}</span>
              <span className="theme-chip">{card.chip}</span>
              {isKata && <span className="theme-chip kata-chip"><CalendarCheck size={11} /> {t("tsumego.kataChip")}</span>}
            </div>
            <h3 className="prob-title">{card.title}</h3>
            <p className="lesson-text">{card.prompt}</p>
            {state.status === "solved" && (
              <p className="lesson-text success-row"><Check size={16} /> {card.explain}</p>
            )}
            {state.status === "solved" && state.byKo && !drill && prob.koNote && (
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
            <Btn icon={RotateCcw} small onClick={() => open(card.board)}>{t("tsumego.reset")}</Btn>
            {state.status === "solved" && !drill && next && (
              <Btn icon={SkipForward} small primary onClick={() => load(next.id)}>
                {next.set === authored.set ? t("tsumego.next") : t("tsumego.nextSet")}
              </Btn>
            )}
            {state.status === "solved" && drill && nextDrill && (
              <Btn icon={SkipForward} small primary onClick={() => loadDrill(nextDrill)}>
                {t("tsumego.next")}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
