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
  // Held in a ref so that a caller passing a fresh function every render does
  // not restart the game underneath it. Assigned in its own effect, which runs
  // before the loop's below, rather than during render.
  const sourceRef = useRef(onSource);
  useEffect(() => { sourceRef.current = onSource; });
  useEffect(() => {
    // A board of a different size is a different game, so it starts over
    // rather than stepping the old position under the new size.
    frameRef.current = openingFrame(size);
    setFrame(frameRef.current);
    // Decided once, when the loop starts: a board that changed hands halfway
    // through a game would be telling a visitor two different things about
    // what they are watching, and the caption under it only says one.
    const seats = players && modelReady() ? players : null;
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
      const frame = frameRef.current;
      const seat = frame.rec.toPlay === "b" ? seats.b : seats.w;
      thinking = true;
      kataChooseMoveForRecord(frame.rec, profileForRank(seat.rank, seat.persona.profile?.temperature))
        .then(res => { if (frameRef.current === frame) step(res ? res.move : demoMove(frame)); })
        // The network failing is not a reason for the board to stop: the
        // heuristic finishes the game and the caption already said which
        // engine the visitor was promised, so it stays honest by stopping
        // rather than by lying about the rest of it.
        .catch(() => { if (frameRef.current === frame) step(demoMove(frame)); })
        .finally(() => { thinking = false; });
    };
    const iv = setInterval(tick, reduce ? 2600 : 1100);
    return () => { alive = false; clearInterval(iv); };
  }, [size, players]);
  return (
    <Board board={frame.rec.board} disabled sizePx={sizePx}
      lastMove={frame.last} captured={frame.took} captureKey={demoCount(frame)} />
  );
}
