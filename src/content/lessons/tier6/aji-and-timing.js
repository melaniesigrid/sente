import { pt } from "../../positions.js";

/* ----------------------- 1d · middle · Aji and Timing (Tier 6) -----------------------
   The first thing that separates a strong kyu player from a dan player is not
   reading depth, it is restraint about forcing moves. A kyu player plays every
   exchange that gets an answer, because getting an answer feels like profit. A
   dan player counts what the exchange spent, and the thing it spends is aji:
   the unresolved possibilities a stone still carries.

   Nothing in this lesson is a counted claim, and it deliberately states none.
   The engine can prove a capture and it cannot prove that a stone "still has
   possibilities", so what is verified here is only what can be: every position
   is legal, every scripted line replays, and the judgements are the author's,
   argued rather than asserted. That is the same footing the problem of the week
   stands on.

   The board is a sketch, a dozen stones, in the house style for whole-board
   lessons: enough to make the question real and not so much that the reader is
   reading a game record instead of an idea. */

const board = {
  b: [pt(3, 3), pt(3, 9), pt(3, 15), pt(9, 16), pt(15, 16), pt(16, 14)],
  w: [pt(9, 3), pt(12, 3), pt(15, 3), pt(16, 6), pt(15, 9), pt(16, 11), pt(13, 13)],
};

/* The same board a dozen moves later, with Black having built on the lower
   side. Nothing was spent on the right, and the stone there now has two
   different jobs it could do. */
const later = {
  b: [...board.b, pt(6, 16), pt(12, 16), pt(13, 14)],
  w: [...board.w, pt(12, 9)],
};

export default {
  id: "aji-and-timing",
  title: "Aji and Timing",
  subtitle: "What a forcing move costs the player who makes it",
  plain: "A stone left alone inside the opponent's position keeps every future it has. Play a forcing exchange there and you trade all of those futures for one answer, usually at the moment the answer is worth least. Dan play is mostly the discipline of not cashing in early.",
  tier: 6, rank: "1d", track: "middle", size: 19,
  prereqs: ["classic-emptiness", "classic-observing"], minutes: 9,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: board,
      marks: [pt(16, 14)],
      text: "White has the top and most of the right side. The marked black stone is the interesting thing on the board: it is not alive, it is not dead, and it is not doing anything yet. It is the sort of stone a player checks on every few moves and feels an urge to help. That urge is the subject of the lesson.",
    },
    {
      type: "choice",
      setup: board,
      toPlay: "b",
      text: "Black to play. Three reasonable-looking moves.",
      options: [
        { point: pt(6, 16), verdict: "best", text: "Leave the stone completely alone and take the biggest open area on the board. The stone on the right has not gone anywhere and, crucially, White does not know yet which way it will be used. Every move Black does not play there keeps that ambiguity, and the ambiguity is worth more than any single exchange Black could force today." },
        { point: pt(16, 12), verdict: "poor", text: "Attach underneath, because White has to answer. White does answer, and then the exchange is over: White's side is solid where it was loose, the black stone has exactly one future instead of four, and Black has gained a move's worth of nothing. This is the move that stops players at 2 kyu, and it is almost always played for the feeling of being answered." },
        { point: pt(13, 9), verdict: "fine", text: "A reduction on the boundary, and a perfectly sound move. It is second best because it is smaller than the lower side right now, not because it is wrong. Notice what makes it acceptable: it also leaves the stone on the right alone." },
      ],
    },
    {
      type: "sequence",
      setup: board,
      toPlay: "b",
      moves: [pt(16, 12), pt(15, 12)],
      text: "Play the attachment out, so the cost is visible rather than asserted.",
      hint: "Black attaches under White's stone, White answers on the outside.",
      commentary: [
        "Black attaches. White must respond, and being forced to respond feels like Black is in charge.",
        "White answers, and look at what the two moves did. White's right side is a line more solid than it was. The black stone below can no longer slide under, because the ground it would have slid along has a white stone standing on it. Black gained a forcing move it will never use again, and paid for it with every other thing that stone might have done. Nobody will point to this exchange afterwards as the losing move, which is exactly why it keeps getting played.",
      ],
    },
    {
      type: "info",
      setup: later,
      marks: [pt(16, 14)],
      text: "Here is the same stone a dozen moves later in the patient version, with Black having built along the bottom. It has not moved and Black has never spent a stone on it. Now it has two jobs available: it can slide underneath and live small, or it can lean on White's group from below while Black takes profit on the outside. White has to keep both in mind every time they consider leaving the area, and that cost — the cost of being unable to settle — is being paid by White, every move, for free.",
    },
    {
      type: "info",
      setup: board,
      marks: [pt(16, 14)],
      text: "The rule is short and it is difficult. Before playing any forcing move, ask what it will look like if the answer is the one you expect, and then ask whether you would still want the exchange in the game you will be playing twenty moves from now. If you do not know yet, you have your answer: you do not know yet, so do not fix it yet. Strong players are not the ones who see more forcing moves. They are the ones who see the same forcing moves and keep them in their pocket.",
    },
  ],
};
