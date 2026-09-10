import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 9k · judgement · On Reading the Game (Classic, ch. 7) -----------------------
   Closed, Black has 47 by area and White 33 plus 7.5 komi: Black leads by
   6.5 with one neutral point at the top edge. */
const black = [pt(3, 1), pt(3, 2), pt(3, 3), pt(4, 3), pt(4, 4), pt(5, 4), pt(5, 5), pt(5, 6), pt(5, 7), pt(5, 8)];
const white = [pt(5, 0), pt(4, 1), pt(4, 2), pt(5, 2), pt(5, 3), pt(6, 3), pt(6, 4), pt(6, 5), pt(6, 6), pt(6, 7), pt(6, 8)];
const open = { b: black, w: white };
const closed = { b: [...black, pt(3, 0)], w: white };
// Two dead black stones on the right; the lower left is open.
const dead = {
  b: [pt(6, 3), pt(6, 4), pt(2, 2)],
  w: [pt(5, 3), pt(5, 4), pt(6, 2), pt(7, 3), pt(7, 4), pt(5, 5), pt(7, 5), pt(6, 7)],
};

export default {
  id: "classic-observing",
  title: "On Reading the Game",
  subtitle: "Chapter seven: ahead, keep your shape; behind, go in",
  plain: "Play to the score. Ahead, keep everything simple and connected. Behind, go into the biggest ground still open, because a tidy loss is still a loss.",
  tier: 4, rank: "9k", track: "judgement", size: 9, prereqs: ["classic-calculation", "classic-conflict"], minutes: 7,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 7,
  steps: [
    {
      type: "count",
      setup: closed,
      question: "The classic says to examine even the smallest details to know who is stronger. Count this finished board by area. With 7.5 komi, by how much is Black ahead?",
      answer: 6.5, tolerance: 1,
      hint: "Black: eleven stones and the whole left side. White: eleven stones, the two right-hand columns, and a few points behind the top wall. Then add komi to White.",
      success: "Black 47, White 33 and 7.5, so Black by 6.5. Now you know which of the classic's two rules applies.",
    },
    {
      type: "choice",
      setup: open,
      toPlay: "b",
      text: "The same game a move earlier, with the top boundary open. Black is ahead. The classic: if you see you are winning, take care to keep your shape; if you see you are losing, go into the larger territories. Black to play.",
      options: [
        { point: pt(3, 0), verdict: "best", text: "Close the last gap. You are ahead; the only way to lose now is to give White something to read." },
        { point: pt(4, 0), verdict: "poor", text: "The hane is self-atari against the white stone on the edge. Reaching for one more point when ahead is exactly the mistake the chapter warns about." },
        { point: pt(7, 1), verdict: "poor", text: "An invasion of White's small area. It cannot live, and while you try, White pushes into your corner at the top. Invade when behind, not when ahead." },
      ],
    },
    {
      type: "quiz",
      setup: dead,
      toPlay: "b",
      answers: [pt(2, 6), pt(3, 6), pt(2, 5), pt(3, 5)],
      text: "Two black stones on the right are dead. The classic says stones added to a group that cannot live are placed without being placed: they are not moves at all. Black to play a real move.",
      success: "The open lower left. The two stones stay on the board as a reminder of what a desperate struggle would have cost.",
      hint: "Not near the dead stones. Where is the biggest empty area?",
      wrongText: "Not there. The two stones are gone; find the biggest empty area.",
      refutations: [
        {
          move: pt(6, 5), reply: pt(6, 6),
          text: "One liberty again, and White fills it. Three stones lost instead of two, and the move on the left is still White's.",
        },
      ],
    },
    {
      type: "info",
      setup: dead,
      text: "There are many ways to lose by yourself, the classic says, and only one road to victory: seeing the board as it is. Whoever cannot see the way ahead must change. Only by changing do the connections come, and only then does a group live long.",
    },
  ],
};
