import { useCallback, useEffect, useRef, useState } from "react";
import { analyseGame, analysisCacheKey, cachedAnalysis, reviewLength } from "../engine/index.js";

/* ----------------------- ASKING FOR THE GRAPH -----------------------
   The React side of analysis: it holds the points as they arrive, and it holds the
   stop flag. The walk itself is in the engine and knows nothing about any of this.

   Analysis is slow on purpose - a network run per position, and on 19x19 that is
   over a second each even in its own thread - so this never starts by itself. The
   reader asks, watches the graph draw, and can stop it half way and keep what was
   drawn.

   Time remaining is measured, never guessed: it comes from how long this machine
   has actually taken over the positions already done, and is not offered at all
   until there are enough of them to mean something. */

const MEASURE_AFTER = 4;

import { BASE_LOCALE, makeT } from "../i18n/index.js";
import { useT } from "../components/langStore.js";

const EN = makeT(BASE_LOCALE);

export function useAnalysis(record, { auto = false } = {}) {
  const t = useT();
  const [points, setPoints] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [startedAt, setStartedAt] = useState(0);
  // How many points were already in hand when this run started. Resumed points come
  // back in milliseconds, and counting them as work this machine did would put the
  // estimate out by the whole length of the first walk. State, not a ref, because the
  // estimate is read while rendering.
  const [base, setBase] = useState(0);
  const [now, setNow] = useState(0);
  const stop = useRef(false);
  const autoAttempted = useRef("");
  // The same list as `points`, readable without making `start` depend on it: the
  // callback would otherwise be rebuilt once per position of a long walk.
  const got = useRef([]);
  const total = reviewLength(record);

  // A different game is a different graph. Anything in flight is abandoned.
  useEffect(() => {
    stop.current = true;
    autoAttempted.current = null;
    got.current = cachedAnalysis(record) ?? [];
    setPoints(got.current);
    setRunning(false);
    setError(null);
  }, [record]);

  // A clock only while the walk is running, so the estimate moves between points.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    stop.current = false;
    setBase(got.current.length);
    setError(null);
    setRunning(true);
    setStartedAt(Date.now());
    setNow(Date.now());
    analyseGame(record, {
      stopped: () => stop.current,
      have: got.current,
      onPoint: (p) => setPoints((cur) => {
        if (cur.some((q) => q.move === p.move)) return cur;
        const next = [...cur, p];
        got.current = next;
        return next;
      }),
    }).then((res) => {
      setRunning(false);
      if (!res.complete && res.reason === "unavailable") {
        setError(t("review.networkUnreachable"));
      }
    }).catch((e) => {
      setRunning(false);
      setError(e && e.message ? e.message : t("review.graphFailed"));
    });
  }, [record, t]);

  const cancel = useCallback(() => { stop.current = true; }, []);

  // Leaving review stops the walk; nothing should keep running behind a closed screen.
  useEffect(() => () => { stop.current = true; }, []);

  useEffect(() => {
    if (!auto || running || points.length === total + 1) return;
    const key = analysisCacheKey(record);
    if (autoAttempted.current === key) return;
    autoAttempted.current = key;
    start();
  }, [auto, record, running, points.length, total, start]);

  const doneCount = points.length;
  const measured = doneCount - base;              // positions this run actually asked about
  const elapsed = startedAt ? now - startedAt : 0;
  const remaining = running && measured >= MEASURE_AFTER && elapsed > 0
    ? Math.round(((elapsed / measured) * (total + 1 - doneCount)) / 1000)
    : null;

  return {
    points, running, error, total,
    done: doneCount,
    complete: doneCount === total + 1,
    remaining,
    start, cancel,
  };
}

/** "about 2 minutes left", or null while there is nothing measured to say it from. */
export function remainingText(seconds, t = EN) {
  if (seconds == null) return null;
  if (seconds < 45) return t("review.underAMinute");
  return t("review.minutesLeft", { count: Math.round(seconds / 60) });
}
