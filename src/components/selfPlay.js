import { createBoard, tryPlay, aiChooseMove, idx } from "../engine/index.js";

/* ----------------------- THE DEMO, ONE TICK AT A TIME -----------------------
   The self-playing board on the front door and the dashboard. The engine plays
   both sides; this is only the loop around it, kept out of the component so it
   can be tested without a browser.

   A frame is the whole of it: the game being played (board, ko, whose turn,
   move number, passes in a row) and the three facts the Board is handed to
   draw it — `last`, the point just played; `took`, the stones that move lifted;
   and `n`, which doubles as the capture key, so a capture on move 13 replays
   rather than sitting on screen from move 12.

   Pure, and it never mutates the frame it is given. */

const other = (color) => (color === "b" ? "w" : "b");

/** A fresh game: empty board, black to play, nothing said yet. */
export function openingFrame(size) {
  return { board: createBoard(size), ko: null, turn: "b", n: 0, passes: 0, last: null, took: [] };
}

/** How long a demo game runs before it starts over. Long enough to build a
 *  shape worth looking at, short enough that nobody watches a seki. */
export const DEMO_MOVES = 60;

/** The next frame. Starts over when both sides pass or the game runs long, so
 *  the board never sits on a finished position. A move the chooser declines or
 *  the rules refuse counts as a pass and leaves the position alone: two of
 *  those in a row and the game is over, which is how a demo ends by agreement
 *  rather than by running out of moves. */
export function nextFrame(frame, size) {
  if (frame.passes >= 2 || frame.n > DEMO_MOVES) return openingFrame(size);

  const mv = aiChooseMove(frame.board, frame.turn, frame.ko, frame.n);
  if (!mv) return { ...frame, passes: frame.passes + 1, turn: other(frame.turn) };

  const res = tryPlay(frame.board, mv[0], mv[1], frame.turn, { koPoint: frame.ko });
  if (!res.ok) return { ...frame, passes: frame.passes + 1 };

  return {
    board: res.board, ko: res.ko, turn: other(frame.turn),
    n: frame.n + 1, passes: 0,
    last: idx(size, mv[0], mv[1]), took: res.captured,
  };
}
