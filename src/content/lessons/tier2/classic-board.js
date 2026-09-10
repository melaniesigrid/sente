import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 20k · opening · The Board and the Stones (Classic, ch. 1) ----------------------- */
export default {
  id: "classic-board",
  title: "The Board and the Stones",
  subtitle: "Chapter one: why no game repeats",
  plain: "Three hundred and sixty-one points, and no memory. No game has ever repeated itself, so nothing on this board can be learned by heart; every position has to be read out again from the beginning.",
  tier: 2, rank: "20k", track: "opening", size: 9, prereqs: ["first-9x9-opening"], minutes: 4,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 1,
  steps: [
    {
      type: "info",
      setup: { size: 19, b: [], w: [] },
      marks: [pt(3, 3), pt(15, 3), pt(3, 15), pt(15, 15), pt(9, 9)],
      text: "Zhang Ni opens with the board itself. Three hundred and sixty points, he says, for the days of the year, and one more at the centre that all the others come from. Four corners for the four seasons, ninety points each. The board is square and still; the stones are round and move.",
    },
    {
      type: "count",
      setup: { b: [], w: [] },
      question: "This is the small board. How many intersections does it have?",
      answer: 81, tolerance: 0,
      hint: "Count one row, then multiply by the number of rows.",
      success: "Eighty-one. The full board has 361: the 360 the classic names, and the one at the centre.",
    },
    {
      type: "quiz",
      setup: { b: [], w: [] },
      toPlay: "b",
      answers: [pt(4, 4)],
      text: "The classic says the One sits at the pole and the four directions grow out of it. Play the point every other point on this board is measured from.",
      success: "Tengen, the origin of heaven. On a small board it is also the strongest first move, because it reaches every corner.",
      hint: "The exact centre.",
      wrongText: "Not the centre. Count from both edges.",
    },
    {
      type: "info",
      setup: { b: [pt(4, 4), pt(6, 6)], w: [pt(2, 2), pt(6, 2)] },
      text: "Four stones in, and already this position has probably never appeared before. Since ancient times, the classic says, no player has placed the stones exactly as in an earlier game. That is why reading has to go deep: you cannot memorise a game that has never happened. Every day is new.",
    },
  ],
};
