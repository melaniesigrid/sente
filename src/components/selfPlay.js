import { createGame, play, pass, aiChooseMoveForRecord, lastMoveIndex } from "../engine/index.js";

/* ----------------------- THE DEMO, ONE TICK AT A TIME -----------------------
   The self-playing board on the front door and the dashboard. The engine plays
   both sides; this is only the loop around it, kept out of the component so it
   can be tested without a browser.

   A frame is the game being played and the two facts the Board needs that the
   game itself does not carry: `last`, the point just played, and `took`, the
   stones that move lifted. The game is a real GameRecord, which is what makes
   the second player possible: a record carries its own move history and its
   own hashes, so the human network can be asked what it would play here
   (MiniSelfPlay does the asking) and superko is honoured while it answers.
   The move count doubles as the Board's capture key, so a capture on move 13
   replays rather than sitting on screen from move 12.

   The chooser is the caller's. `demoMove` is the heuristic house player and is
   what the front door uses; the dashboard hands in the network's move instead
   when the model is already in memory. Either way the stepping is the same,
   which is the point of doing it here.

   Pure, and it never mutates the frame it is given. */

const opening = (size) => ({ rec: createGame({ size }), last: null, took: [] });

/** A fresh game: empty board, black to play, nothing said yet. */
export function openingFrame(size) {
  return opening(size);
}

/** How long a demo game runs before it starts over. Long enough to build a
 *  shape worth looking at, short enough that nobody watches a seki. */
export const DEMO_MOVES = 60;

/** Has this game run its course? Both sides passed, or it has gone long. */
export const demoSpent = (frame) =>
  frame.rec.passes >= 2 || frame.rec.moves.length > DEMO_MOVES || frame.rec.phase !== "playing";

/** The move the heuristic house player would make here, or null to pass. */
export const demoMove = (frame) => aiChooseMoveForRecord(frame.rec);

/** How many moves are on the board: the Board's capture key. */
export const demoCount = (frame) => frame.rec.moves.length;

/** The next frame, playing `move` ([c, r], or null to pass). Starts over when
 *  the game is spent, so the board never sits on a finished position. A move
 *  the rules refuse is treated as a pass and leaves the position alone: two of
 *  those in a row and the game is over, which is how a demo ends by agreement
 *  rather than by running out of moves. */
export function nextFrameWith(frame, move, size = frame.rec.size) {
  if (demoSpent(frame)) return opening(size);
  if (!move) return { rec: pass(frame.rec), last: frame.last, took: [] };
  let rec;
  try {
    rec = play(frame.rec, move[0], move[1]);
  } catch {
    return { rec: pass(frame.rec), last: frame.last, took: [] };
  }
  return { rec, last: lastMoveIndex(rec), took: rec.lastCaptured ?? [] };
}

/** The next frame with the heuristic playing: the front door's whole loop. */
export function nextFrame(frame, size = frame.rec.size) {
  if (demoSpent(frame)) return opening(size);
  return nextFrameWith(frame, demoMove(frame), size);
}
