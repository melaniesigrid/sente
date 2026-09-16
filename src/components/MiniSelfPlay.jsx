import { useState, useEffect, useRef } from "react";
import { modelReady, kataChooseMoveForRecord, profileForRank } from "../engine/index.js";
import { Board } from "./Board.jsx";
import { openingFrame, nextFrameWith, demoMove, demoCount } from "./selfPlay.js";

/* ----------------------- A SELF-PLAYING BOARD -----------------------
   The demo is the real engine: the same createGame, the same play, the same
   move chooser the house players use. Nothing here is a recording, which is
   the point: the first thing a visitor sees is the thing itself, playing.

   Which engine, on which side, is a question the page has to answer rather
   than leave to a guess, and there are two answers.

   Left alone it is the heuristic picker (engine/ai.js) on default weights
   playing both colours -- not the KataGo human-style network the house players
   sit behind. That is the front door, where 54MB of weights and 14MB of
   runtime have no business being fetched before a visitor has clicked
   anything.

   Given `players` it is two house players at their own ranks, through the same
   network they play a real game with -- but only if that network is already in
   memory. It never starts the download itself. A dashboard is reached by
   people who have played, so the model is usually already there, and when it
   is not the board quietly stays the heuristic rather than costing somebody a
   download for a decoration.

   Either way it says which, through `onSource`: "kata" or "heuristic", once
   the loop has settled. Every place this board is shown prints that, so put a
   line under it if you mount it somewhere new.

   It also says what it just did, because a board that only pops stones into
   place is a board you cannot follow: the stone it played carries the
   last-move mark, and the stones that move took fade off as ghosts. Both are
   the same facts a real game hands the Board, drawn by the same code, so
   watching the front door teaches the board you will sit at.

   The loop itself is in selfPlay.js, pure and tested. What is left here is the
   clock -- a reader who has asked for less motion gets a much slower game
   rather than a still one -- and the waiting: a network move takes long enough
   that a tick can arrive while the last one is still being thought about, and
   a second question asked from the same position would be answered twice and
   played twice. */
export function MiniSelfPlay({ sizePx = 300, size = 9, players = null, onSource }) {
  const [frame, setFrame] = useState(() => openingFrame(size));
  const frameRef = useRef(frame);
  // Who is playing, as a string. The effect below starts a new game whenever it
  // re-runs, so it may not depend on the identity of the `players` object: a
  // caller writing players={{...}} inline would deal a fresh board on every
  // render of its parent and the game would never reach move two.
  const seatKey = players ? `${players.b.persona.id}@${players.b.rank}/${players.w.persona.id}@${players.w.rank}` : "";
  const playersRef = useRef(players);
  const host = useRef(null);
  // Held in a ref so that a caller passing a fresh function every render does
  // not restart the game underneath it. Assigned in its own effect, which runs
  // before the loop's below, rather than during render.
  const sourceRef = useRef(onSource);
  useEffect(() => { sourceRef.current = onSource; playersRef.current = players; });
  useEffect(() => {
    // A board of a different size is a different game, so it starts over
    // rather than stepping the old position under the new size.
    frameRef.current = openingFrame(size);
    setFrame(frameRef.current);
    // Decided once, when the loop starts: a board that changed hands halfway
    // through a game would be telling a visitor two different things about
    // what they are watching, and the caption under it only says one.
    const seats = playersRef.current && modelReady() ? playersRef.current : null;
    if (sourceRef.current) sourceRef.current(seats ? "kata" : "heuristic");

    let alive = true;
    let thinking = false;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (move) => {
      if (!alive) return;
      frameRef.current = nextFrameWith(frameRef.current, move, size);
      setFrame(frameRef.current);
    };
    const tick = () => {
      if (!seats) { step(demoMove(frameRef.current)); return; }
      if (thinking) return;
      // Named for what it is, and deliberately not the state `frame`: the loop
      // reads the ref so the interval never closes over a stale render, and an
      // answer is only played if the position it was asked about is still up.
      //
      // That check and the `alive` flag are deliberately redundant -- either
      // one alone retires a question whose board has been dealt away, which is
      // why removing just one breaks no test. Removing both does: the suite's
      // "does not play an answer about a position the board has moved past".
      const asked = frameRef.current;
      const seat = asked.rec.toPlay === "b" ? seats.b : seats.w;
      thinking = true;
      kataChooseMoveForRecord(asked.rec, profileForRank(seat.rank, seat.persona.profile?.temperature))
        .then(res => { if (frameRef.current === asked) step(res ? res.move : demoMove(asked)); })
        // The network failing is not a reason for the board to stop: the
        // heuristic finishes the game and the caption already said which
        // engine the visitor was promised, so it stays honest by stopping
        // rather than by lying about the rest of it.
        .catch(() => { if (frameRef.current === asked) step(demoMove(asked)); })
        .finally(() => { thinking = false; });
    };
    /* The clock runs only while somebody could be looking. It always cost a
       heuristic search a second; with the network playing it costs a third of
       a second of wasm in the same worker a real game is using, and a
       dashboard left open in a background tab would ask for that forever.
       StoneField gates its own beat exactly this way, and the failure is the
       same shape: a browser with no IntersectionObserver keeps playing, which
       is the right way to fail. */
    let timer = null;
    let onScreen = true, awake = !document.hidden;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { if (!timer && onScreen && awake && alive) timer = setInterval(tick, reduce ? 2600 : 1100); };

    const onVisibility = () => { awake = !document.hidden; if (awake) start(); else stop(); };
    document.addEventListener("visibilitychange", onVisibility);

    let io = null;
    if (typeof IntersectionObserver === "function" && host.current) {
      io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start(); else stop();
      }, { rootMargin: "120px" });
      io.observe(host.current);
    }
    start();

    return () => {
      alive = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      if (io) io.disconnect();
    };
  }, [size, seatKey]); // eslint-disable-line react-hooks/exhaustive-deps -- players is read through the key below
  return (
    <div ref={host}>
      <Board board={frame.rec.board} disabled sizePx={sizePx}
        lastMove={frame.last} captured={frame.took} captureKey={demoCount(frame)} />
    </div>
  );
}
