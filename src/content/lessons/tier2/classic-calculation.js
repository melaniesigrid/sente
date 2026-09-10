import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 19k · judgement · On Calculation (Classic, ch. 2) -----------------------
   A 9x9 with one boundary still open at the top. Closed solidly, Black has 42
   (10 stones, 32 territory), White 38 (10 stones, 28 territory) plus 7.5 komi,
   and the point between the walls at the top edge is neutral. */
const black = [pt(3, 1), pt(3, 2), pt(3, 3), pt(4, 3), pt(4, 4), pt(4, 5), pt(4, 6), pt(4, 7), pt(4, 8)];
const white = [pt(5, 0), pt(4, 1), pt(4, 2), pt(5, 2), pt(5, 3), pt(5, 4), pt(5, 5), pt(5, 6), pt(5, 7), pt(5, 8)];
const open = { b: black, w: white };
const closed = { b: [...black, pt(3, 0)], w: white };

export default {
  id: "classic-calculation",
  title: "On Calculation",
  subtitle: "Chapter two: know who is winning while the game is still on",
  plain: "Counting is not a chore for the end of the game, it is what tells you how to play the middle of it. If you cannot say who is ahead right now, you cannot know whether to take a risk or settle.",
  tier: 2, rank: "19k", track: "judgement", size: 9, prereqs: ["territory-count", "classic-board"], minutes: 6,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 2,
  steps: [
    {
      type: "info",
      setup: open,
      marks: [pt(3, 0), pt(4, 0)],
      text: "One boundary is still open, at the top. The classic sorts players by one question: can you say who is winning before the game ends? If you can, you have calculated well. If you only find out when the stones are counted, you calculated badly. If you cannot tell even then, you did not calculate at all.",
    },
    {
      type: "quiz",
      setup: open,
      toPlay: "b",
      answers: [pt(3, 0)],
      text: "Black to play. Close the last boundary so nothing is left to read.",
      success: "The solid descent. Every point now belongs to someone, except the one between the walls on the top edge, which belongs to no one.",
      hint: "Extend straight down to the edge from your wall.",
      refutations: [
        {
          move: pt(4, 0), reply: pt(3, 0),
          text: "The hane has one liberty with a white stone already waiting on the edge. White captures it, and the corner shrinks.",
        },
      ],
    },
    {
      type: "count",
      setup: closed,
      question: "Count Black by area: stones plus territory. What is the total?",
      answer: 42, tolerance: 0,
      hint: "Ten black stones. Then count the empty points only Black touches: three full columns on the left and five more beside the wall.",
      success: "Forty-two: ten stones and thirty-two points of territory.",
    },
    {
      type: "count",
      setup: closed,
      question: "Now White, stones plus territory, before komi.",
      answer: 38, tolerance: 0,
      hint: "Ten white stones. The territory is the right side, plus the single point behind the top wall.",
      success: "Thirty-eight, and 7.5 komi makes 45.5. White wins by 3.5.",
    },
    {
      type: "info",
      setup: closed,
      text: "If you could say at the first step that White was ahead, you calculated well. The classic quotes the old military text: those who calculate greatly win, those who calculate a little lose, and what of those who do not calculate at all? Every game deserves a count before it is over.",
    },
  ],
};
