import { pt } from "../../positions.js";
import { GUANZI_SOURCE } from "../../guanzi.js";

/* ----------------------- 10k · endgame · What Gote Costs (Guanzi Pu) -----------------------
   Two walls stop one line short of each edge, so the top row and the bottom
   row are the only things left to settle, and the two boundaries are the same
   size. Whoever takes one hands the other over: every order of the six moves
   settles at Black 36, White 45, and the engine is asked for that in the
   library verifier rather than trusted here. That equality is the point of
   the lesson. Its sequel, guanzi-first-line-hane, shows what one boundary is
   worth when there is only one. */
const open = {
  b: [1, 2, 3, 4, 5, 6, 7].map(r => pt(3, r)),
  w: [1, 2, 3, 4, 5, 6, 7].map(r => pt(4, r)),
};

/* After Black takes the bottom: hane, block, connect. */
const afterBottom = {
  b: [...open.b, pt(4, 8), pt(3, 8)],
  w: [...open.w, pt(5, 8)],
};

/* And after White answers by taking the top the same way. */
const settled = {
  b: [...afterBottom.b, pt(2, 0)],
  w: [...afterBottom.w, pt(3, 0), pt(4, 0)],
};

export default {
  id: "guanzi-gote-alternates",
  title: "What Gote Costs",
  subtitle: "The endgame: a move that buys one boundary hands over the next",
  plain: "A move that ends with your opponent to play buys one boundary and hands them the next. Counting that trade, rather than the size of the move on its own, is what the classical endgame book is teaching.",
  tier: 4, rank: "10k", track: "endgame", size: 9,
  prereqs: ["territory-count", "passing-and-ending"], minutes: 6,
  author: "Joseki", sources: [GUANZI_SOURCE], book: "guanzi",
  steps: [
    {
      type: "info",
      setup: open,
      marks: [pt(3, 0), pt(4, 0), pt(3, 8), pt(4, 8)],
      text: "The two walls stop one line short of each edge, so everything is settled except the top row and the bottom row. Guanzi means the closing moves, and the classical book of them is almost nothing else. Here the two boundaries are the same size, which makes them the clearest possible place to see what a gote move actually buys.",
    },
    {
      type: "sequence",
      setup: open,
      toPlay: "b",
      moves: [pt(4, 8), pt(5, 8), pt(3, 8)],
      text: "Black takes the bottom boundary.",
      hint: "Reach under the head of White's wall, let White block, then connect.",
      commentary: [
        "Black reaches under the foot of White's wall.",
        "White blocks. Leaving it would let Black walk further along the edge.",
        "Black connects, and the bottom is finished. Notice whose turn it is now: Black spent three moves to White's one, and the move has passed to White.",
      ],
    },
    {
      type: "sequence",
      setup: afterBottom,
      toPlay: "w",
      moves: [pt(3, 0), pt(2, 0), pt(4, 0)],
      text: "So White takes the top, in exactly the same way.",
      hint: "White plays the mirror of what Black just played.",
      commentary: [
        "White reaches under Black's wall at the top.",
        "Black blocks, for the same reason White did.",
        "White connects. Both boundaries are closed and the game is over.",
      ],
    },
    {
      type: "count",
      setup: settled,
      question: "Count Black by area: stones plus territory. What is the total?",
      answer: 36, tolerance: 0,
      hint: "Ten black stones. Then the empty points only Black touches: three columns of seven on the left, two more on the top row and three on the bottom.",
      success: "Thirty-six, against White's forty-five.",
    },
    {
      type: "info",
      setup: settled,
      text: "Now play those six moves in any order you like. Black first or White first, top before bottom or bottom before top: the board settles at thirty-six against forty-five every time. That is what gote means. A gote move buys you one boundary and hands the next one to your opponent, so the two of you simply take turns and the order changes nothing. The whole difficulty of the endgame is that real boundaries are not the same size, and the book is a thousand pages of deciding which one to buy first.",
    },
  ],
};
