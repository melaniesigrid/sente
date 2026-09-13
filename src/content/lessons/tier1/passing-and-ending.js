import { pt } from "../../positions.js";

/* ----------------------- 21k · judgement · Passing and Ending ----------------------- */
const col = (c) => Array.from({ length: 9 }, (_, r) => pt(c, r));
// Black wall on column 3, white wall on column 5; a lone white stone is
// stranded inside Black's side with one liberty.
const board = { b: [...col(3), pt(0, 1), pt(1, 0), pt(2, 1)], w: [...col(5), pt(1, 1)] };
const settled = { b: [...col(3), pt(0, 1), pt(1, 0), pt(2, 1), pt(1, 2)], w: col(5) };

export default {
  id: "passing-and-ending",
  title: "Passing and Ending",
  subtitle: "When the game is over, and what happens to dead stones",
  plain: "The game ends when neither side can gain by playing, so both pass. Stones that could never escape come off as dead, and when the two of you disagree about which those are, the honest way to settle it is to play it out.",
  tier: 1, rank: "21k", track: "judgement", size: 9, prereqs: ["territory-count"], minutes: 4,
  author: "Joseki", sources: [],
  steps: [
    {
      type: "info",
      setup: board,
      marks: [pt(1, 1)],
      text: "When neither player can gain anything by moving, they pass. Two passes in a row end the game. Before counting, stones that could never escape capture are removed as dead. The marked white stone is one.",
    },
    {
      type: "quiz",
      setup: board,
      toPlay: "b",
      answers: [pt(1, 2)],
      text: "You do not have to capture a dead stone; it comes off at the end anyway. But if you are unsure whether it is dead, capturing costs you nothing inside your own territory. Black to play: capture it.",
      success: "Gone. Inside your own area the capture costs nothing, because under area scoring the point you filled is still yours.",
      hint: "The stone has exactly one liberty.",
      wrongText: "Not a capture. The dead stone has one liberty; fill that one.",
    },
    {
      type: "count",
      setup: settled,
      question: "Area scoring. Count Black's area: stones plus the empty points only Black can reach.",
      answer: 36, tolerance: 0,
      hint: "Thirteen black stones, and every empty point left of the wall.",
      success: "Thirty-six: 13 stones and 23 empty points. The middle column is dame and counts for nobody.",
    },
    {
      type: "info",
      setup: settled,
      marks: [pt(4, 4)],
      text: "After the second pass Joseki shows a result card: each side's area, komi, and the margin. If you and your opponent disagree about which stones are dead, the honest answer is to play it out.",
    },
  ],
};
