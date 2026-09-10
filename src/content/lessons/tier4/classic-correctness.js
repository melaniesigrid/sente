import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 7k · middle · On Correctness (Classic, ch. 9) ----------------------- */
export default {
  id: "classic-correctness",
  title: "On Correctness",
  subtitle: "Chapter nine: take the point before they think of it",
  plain: "Strength is reading, not theatre. The good move comes from thinking further ahead than the position seems to ask for, never from hoping your opponent slips.",
  tier: 4, rank: "7k", track: "middle", size: 13, prereqs: ["classic-feelings"], minutes: 5,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 9,
  steps: [
    {
      type: "info",
      setup: { b: [pt(3, 3)], w: [pt(9, 3)] },
      marks: [pt(6, 3)],
      text: "Someone objected to Zhang Ni that a game built on change and capture must be a false Way. He answered that it is a small Way, but the same Way as war, and that skill in it is not trickery. The best players think deep, weigh distant consequences, and let their thoughts travel the whole board before placing a stone. They aim at conquest before conquest is visible, and take a point before the opponent has thought of it. The marked point is one such.",
    },
    {
      type: "quiz",
      setup: { b: [pt(3, 3)], w: [pt(9, 3)] },
      toPlay: "b",
      answers: [pt(6, 3)],
      text: "Black to play the point both sides want along the top.",
      success: "Taken by Black it is an extension from the corner. Taken by White it would have been a pincer against it. The same point, two meanings; the side that sees it first gets the good one.",
      hint: "Halfway between the two corner stones, on the same line.",
      wrongText: "Not that one. Which single point serves Black as an extension and White as an attack?",
    },
    {
      type: "info",
      setup: { b: [pt(3, 3), pt(6, 3)], w: [pt(9, 3)] },
      text: "The chapter ends on conduct. Weak players, it says, point at the board, talk, and let their intentions show. Strong players are silent and let the stones speak. Be honest, and do not deceive: the classic holds that the game and the player are judged by the same rule.",
    },
  ],
};
