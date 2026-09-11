import { useState, useEffect, useRef } from "react";
import { createBoard, tryPlay, aiChooseMove } from "../engine/index.js";
import { Board } from "./Board.jsx";

/* ----------------------- A SELF-PLAYING BOARD -----------------------
   The demo is the real engine: the same createBoard, the same tryPlay, the
   same move chooser the house players use. Nothing here is a recording, which
   is the point: the first thing a visitor sees is the thing itself, playing.

   It resets when both sides pass or the game runs long, so it never sits on a
   finished position, and a reader who has asked for less motion gets a much
   slower game rather than a still one. */
export function MiniSelfPlay({ sizePx = 300, size = 9 }) {
  const [board, setBoard] = useState(() => createBoard(size));
  const stateRef = useRef({ board: createBoard(size), ko: null, turn: "b", n: 0, passes: 0 });
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      const s = stateRef.current;
      if (s.passes >= 2 || s.n > 60) {
        stateRef.current = { board: createBoard(size), ko: null, turn: "b", n: 0, passes: 0 };
        setBoard(stateRef.current.board);
        return;
      }
      const mv = aiChooseMove(s.board, s.turn, s.ko, s.n);
      if (!mv) { s.passes++; s.turn = s.turn === "b" ? "w" : "b"; return; }
      const res = tryPlay(s.board, mv[0], mv[1], s.turn, { koPoint: s.ko });
      if (!res.ok) { s.passes++; return; }
      stateRef.current = { board: res.board, ko: res.ko, turn: s.turn === "b" ? "w" : "b", n: s.n + 1, passes: 0 };
      setBoard(res.board);
    };
    const iv = setInterval(tick, reduce ? 2600 : 1100);
    return () => clearInterval(iv);
  }, [size]);
  return <Board board={board} disabled sizePx={sizePx} />;
}
