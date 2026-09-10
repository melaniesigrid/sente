import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 13k · middle · On Emptiness and Fullness (Classic, ch. 5) ----------------------- */
const wall = { b: [pt(3, 3), pt(3, 9)], w: [pt(8, 3), pt(8, 4), pt(8, 5), pt(8, 6), pt(8, 7)] };
const walls = {
  b: [pt(3, 3), pt(3, 4), pt(3, 5), pt(2, 6), pt(6, 3)],
  w: [pt(9, 3), pt(9, 4), pt(9, 5), pt(10, 6), pt(6, 9), pt(7, 10)],
};

export default {
  id: "classic-emptiness",
  title: "On Emptiness and Fullness",
  subtitle: "Chapter five: avoid what is full, flow into the void",
  plain: "Do not lean on your opponent's strong stones: contact makes them stronger and leaves you no thicker. Play where they are thin, and change the plan the moment the board changes.",
  tier: 3, rank: "13k", track: "middle", size: 13, prereqs: ["classic-territory"], minutes: 5,
  author: "Joseki", sources: [CLASSIC_SOURCE], series: "classic", chapter: 5,
  steps: [
    {
      type: "info",
      setup: wall,
      marks: [pt(7, 5), pt(5, 6)],
      text: "A white wall stands on the right. The classic warns against playing too close to your opponent's stones: you make them full and yourself empty. What is full is hard to break; what is empty is easy to enter. Like water, it says, avoid the high ground and flow into the void.",
    },
    {
      type: "choice",
      setup: wall,
      toPlay: "b",
      text: "Black to play.",
      options: [
        { point: pt(5, 6), verdict: "best", text: "The void: halfway between your two stones, well away from the wall. The left side becomes yours in outline." },
        { point: pt(7, 5), verdict: "poor", text: "Touching strength. White answers from a wall of five, and your stone is the thin one." },
        { point: pt(3, 6), verdict: "fine", text: "Solid, but slow. The left side is already leaning your way; this adds less than a stone in the open middle." },
      ],
    },
    {
      type: "quiz",
      setup: walls,
      toPlay: "b",
      answers: [pt(3, 9), pt(4, 9), pt(3, 8), pt(4, 8)],
      text: "Black to play. Both sides have walls now. Find the empty region and play into it.",
      success: "The lower left, far from every wall. This is where the next territory is decided, because nobody has spoken for it yet.",
      hint: "Look for the widest area with no stones of either colour nearby.",
      wrongText: "Not there. Find the widest empty area, away from both walls.",
    },
    {
      type: "info",
      setup: { ...walls, b: [...walls.b, pt(3, 9)] },
      text: "The chapter ends on flexibility. Follow too many plans and your stones fragment; follow only one and you cannot adapt. Do not hold to a single plan, the classic says: change it with the moment. If you see you can advance, advance. If you meet difficulty, retreat.",
    },
  ],
};
