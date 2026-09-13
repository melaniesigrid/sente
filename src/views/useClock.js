import { useState, useEffect, useRef } from "react";
import { createClock, tick, onMove } from "../engine/index.js";
import { runningSide } from "../content/clockFace.js";

/* ----------------------- CLOCK DRIVER -----------------------
   The engine's clock has no timers in it: it does arithmetic and names events, and
   somebody has to feed it wall time. That somebody is this hook, and it is the only
   part of the clock that knows what a browser is.

   `timed` says whose clock runs: "bw" in a face-to-face game, "b" against a house
   player. A local bot's speed is a fact about the device and the model download, not
   about how well it plays, so timing it would put a number on the screen that Joseki
   cannot stand behind; the bot's face says "no clock" instead.

   Elapsed time is per-session: it is not written into the record, so leaving a table
   and resuming it starts the clock over. That is a known limit, written down in the
   roadmap rather than hidden. */

const TICK_MS = 100;

export function useClock({ preset, rec, timed, onFlag }) {
  const [clock, setClock] = useState(() => (preset ? createClock(preset) : null));
  const last = useRef(0);
  const flagged = useRef(false);
  const onFlagRef = useRef(onFlag);
  useEffect(() => { onFlagRef.current = onFlag; }, [onFlag]);

  const moves = rec.moves.length;
  // Whose clock is running this instant, decided in content/clockFace.js so the rule
  // is unit-tested rather than buried in a hook.
  const active = runningSide(clock, rec, timed);

  // A move that lands takes its Fischer increment or resets its byo-yomi period. This
  // is derived from the log rather than done in an effect: React re-runs the render
  // immediately, so the face never paints one frame of the pre-increment time. An undo
  // shortens the log; the clock is not rewound, because the time was really spent.
  const [seenMoves, setSeenMoves] = useState(moves);
  if (moves !== seenMoves) {
    const grew = moves > seenMoves;
    setSeenMoves(moves);
    const mv = grew ? rec.moves[moves - 1] : null;
    if (mv && mv.color && timed.includes(mv.color)) {
      setClock((c) => (c && !c.expired ? onMove(c, mv.color) : c));
    }
  }

  useEffect(() => {
    if (!active) return undefined;
    last.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const ms = now - last.current;
      last.current = now;
      setClock((c) => (c && !c.expired ? tick(c, active, ms).clock : c));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [active]);

  // The flag is reported once, from an effect rather than from inside an updater, so a
  // double-invoked updater in StrictMode cannot end the game twice.
  useEffect(() => {
    if (clock && clock.expired && !flagged.current) {
      flagged.current = true;
      onFlagRef.current(clock.expired);
    }
  }, [clock]);

  return clock;
}
