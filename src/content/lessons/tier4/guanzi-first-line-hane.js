import { pt } from "../../positions.js";
import { GUANZI_SOURCE } from "../../guanzi.js";

/* ----------------------- 9k · endgame · The Hane on the First Line (Guanzi Pu) -----------------------
   One boundary, at the bottom edge, and three ways to treat it. Every line
   here settles completely, so the engine can be asked for all three totals
   rather than the lesson asserting them:

     Black hanes and connects    Black 37, White 44
     Black blocks solidly        Black 36, White 45
     White hanes first           Black 35, White 46

   So the hane is worth a point over the plain block, and having the move at
   this boundary at all is worth four. Those are facts about these positions,
   not a general valuation of first-line hanes. */
const open = {
  b: [0, 1, 2, 3, 4, 5, 6, 7].map(r => pt(3, r)),
  w: [0, 1, 2, 3, 4, 5, 6, 7].map(r => pt(4, r)),
};

const settled = {
  b: [...open.b, pt(4, 8), pt(3, 8)],
  w: [...open.w, pt(5, 8)],
};

export default {
  id: "guanzi-first-line-hane",
  title: "The Hane on the First Line",
  subtitle: "The endgame: the commonest move on the board, and what it is worth",
  plain: "The endgame is arithmetic you can do at the board. The hane on the first line is the commonest move in the game, and knowing it is worth a point more than the plain block is how close games are won.",
  tier: 4, rank: "9k", track: "endgame", size: 9,
  prereqs: ["guanzi-gote-alternates"], minutes: 7,
  author: "Sente", sources: [GUANZI_SOURCE], book: "guanzi",
  steps: [
    {
      type: "info",
      setup: open,
      marks: [pt(3, 8), pt(4, 8)],
      text: "This time the walls run all the way to the top, so the bottom row is the only thing left. Both marked points are legal and both look small. One of them is worth a point more than the other, and the whole of the classical endgame book is the habit of knowing which before you play.",
    },
    {
      type: "quiz",
      setup: open,
      toPlay: "b",
      answers: [pt(4, 8)],
      text: "Black to play the last boundary.",
      success: "The hane. It takes the point under White's wall and keeps your own.",
      hint: "Reach under the foot of White's wall rather than filling on your own side.",
      refutations: [
        {
          move: pt(3, 8), reply: pt(4, 8),
          text: "The plain block is solid and a point smaller. White takes the point you left and the game settles at thirty-six to forty-five instead of thirty-seven to forty-four.",
        },
      ],
    },
    {
      type: "sequence",
      setup: open,
      toPlay: "b",
      moves: [pt(4, 8), pt(5, 8), pt(3, 8)],
      text: "Play it out.",
      hint: "Hane, let White block, then connect behind it.",
      commentary: [
        "The hane, under the foot of the wall.",
        "White blocks. The stone cannot be cut off, so there is nothing better.",
        "Black connects. The board is finished.",
      ],
    },
    {
      type: "count",
      setup: settled,
      question: "Count Black by area: stones plus territory. What is the total?",
      answer: 37, tolerance: 0,
      hint: "Ten black stones. Then the empty points only Black touches: three columns of eight on the left, and three more on the bottom row.",
      success: "Thirty-seven, against White's forty-four.",
    },
    {
      type: "info",
      setup: settled,
      text: "Had White reached the boundary first and haned the other way, the same board would have settled at thirty-five against forty-six. So the move here was worth four points, and choosing the hane over the plain block was worth one of them. The classical book gives a value like that to every shape it prints. Learning the endgame is mostly learning to see a small number over a boundary before your opponent does.",
    },
  ],
};
