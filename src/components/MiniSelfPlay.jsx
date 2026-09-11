import { useState, useEffect, useRef } from "react";
import { Board } from "./Board.jsx";
import { openingFrame, nextFrame } from "./selfPlay.js";

/* ----------------------- A SELF-PLAYING BOARD -----------------------
   The demo is the real engine: the same createBoard, the same tryPlay, the
   same move chooser the house players use. Nothing here is a recording, which
   is the point: the first thing a visitor sees is the thing itself, playing.

   It also says what it just did, because a board that only pops stones into
   place is a board you cannot follow: the stone it played carries the
   last-move mark, and the stones that move took fade off as ghosts. Both are
   the same facts a real game hands the Board, drawn by the same code, so
   watching the front door teaches the board you will sit at.

   The loop itself is in selfPlay.js, pure and tested. All that is left here is
   the clock: a reader who has asked for less motion gets a much slower game
   rather than a still one. */
export function MiniSelfPlay({ sizePx = 300, size = 9 }) {
  const [frame, setFrame] = useState(() => openingFrame(size));
  const frameRef = useRef(frame);
  useEffect(() => {
    // A board of a different size is a different game, so it starts over
    // rather than stepping the old position under the new size.
    frameRef.current = openingFrame(size);
    setFrame(frameRef.current);
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      frameRef.current = nextFrame(frameRef.current, size);
      setFrame(frameRef.current);
    };
    const iv = setInterval(tick, reduce ? 2600 : 1100);
    return () => clearInterval(iv);
  }, [size]);
  return (
    <Board board={frame.board} disabled sizePx={sizePx}
      lastMove={frame.last} captured={frame.took} captureKey={frame.n} />
  );
}
