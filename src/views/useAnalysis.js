import { useCallback, useEffect, useRef, useState } from "react";
import { analyseGame, cachedAnalysis, reviewLength } from "../engine/index.js";

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

export function useAnalysis(record) {
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
  // The same list as `points`, readable without making `start` depend on it: the
  // callback would otherwise be rebuilt once per position of a long walk.
  const got = useRef([]);
  const total = reviewLength(record);

  // A different game is a different graph. Anything in flight is abandoned.
  useEffect(() => {
    stop.current = true;
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
        setError("The network could not be reached, so the graph stops where it does.");
      }
    }).catch((e) => {
      setRunning(false);
      setError(e && e.message ? e.message : "The graph could not be drawn.");
    });
  }, [record]);

  const cancel = useCallback(() => { stop.current = true; }, []);

  // Leaving review stops the walk; nothing should keep running behind a closed screen.
  useEffect(() => () => { stop.current = true; }, []);

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
export function remainingText(seconds) {
  if (seconds == null) return null;
  if (seconds < 45) return "under a minute left";
  const mins = Math.round(seconds / 60);
  return `about ${mins} minute${mins === 1 ? "" : "s"} left`;
}
