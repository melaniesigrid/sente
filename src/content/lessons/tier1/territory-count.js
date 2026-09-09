import { pt } from "../../positions.js";

/* ----------------------- 22k · judgement · Counting Territory ----------------------- */
// A finished 9x9: a black wall on column 2, a white wall on column 5, and
// two dame columns between them that belong to nobody.
const col = (c) => Array.from({ length: 9 }, (_, r) => pt(c, r));
const finished = { b: col(2), w: col(5) };

export default {
  id: "territory-count",
  title: "Counting Territory",
  subtitle: "What a point is, and counting a finished board",
  tier: 1, rank: "22k", track: "judgement", size: 9, prereqs: ["two-eyes"], minutes: 5,
  author: "Sente", sources: [],
  steps: [
    {
      type: "info",
      setup: finished,
      marks: [pt(0, 4), pt(7, 4)],
      text: "A finished game. Territory is empty points that only one colour can reach. Everything left of the black wall is Black's; everything right of the white wall is White's. Under area scoring, your stones count too.",
    },
    {
      type: "count",
      setup: finished,
      question: "How many points of empty territory does Black have?",
      answer: 18, tolerance: 0,
      hint: "Two columns of nine, left of the wall.",
      success: "Eighteen. Two full columns of empty points.",
    },
    {
      type: "count",
      setup: finished,
      question: "And White's empty territory?",
      answer: 27, tolerance: 0,
      hint: "Three columns of nine, right of the wall.",
      success: "Twenty-seven. White's wall stands one line further from the edge, so White claims one more column.",
    },
    {
      type: "info",
      setup: finished,
      marks: [pt(3, 4), pt(4, 4)],
      text: "The two middle columns touch both walls, so they are dame: neutral points, worth nothing to anyone. At the end of a game the players usually fill them just to be tidy.",
    },
    {
      type: "count",
      setup: finished,
      question: "Area scoring: stones plus territory. White also receives 7.5 komi. By how much does White win?",
      answer: 16.5, tolerance: 0,
      hint: "Black: 9 stones + 18. White: 9 stones + 27 + 7.5. Subtract.",
      success: "White wins by 16.5. Komi is compensation for Black moving first; the half point means a game can never be tied.",
    },
  ],
};
