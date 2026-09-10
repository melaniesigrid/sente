import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 17k · tactics · On Knowing Oneself (Classic, ch. 6) -----------------------
   Black's two stones at the top have a cutting point at (4,3). A white stone
   on the right is in atari and looks free. Take it, and White cuts: the two
   stones are left with one liberty on the edge. */
const base = {
  b: [pt(4, 1), pt(4, 2), pt(4, 4), pt(5, 4), pt(6, 4), pt(7, 3), pt(8, 4)],
  w: [pt(3, 1), pt(3, 2), pt(3, 3), pt(5, 1), pt(5, 2), pt(7, 4)],
};
const afterCapture = {
  b: [...base.b, pt(7, 5)],
  w: base.w.filter(p => !(p.c === 7 && p.r === 4)),
};
const connected = { b: [...base.b, pt(4, 3)], w: base.w };

export default {
  id: "classic-know-yourself",
  title: "On Knowing Oneself",
  subtitle: "Chapter six: your weak point is where they will come",
  tier: 2, rank: "17k", track: "tactics", size: 9, prereqs: ["connect-cut", "atari-escape"], minutes: 5,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 6,
  steps: [
    {
      type: "info",
      setup: base,
      marks: [pt(4, 3), pt(7, 5)],
      text: "The wise player, the classic says, sees what is not yet visible; the foolish one misses what is in front of them. Two points are marked. One is a white stone in atari. The other is the gap between your own stones. Know your own weak point and you know where your opponent is coming.",
    },
    {
      type: "choice",
      setup: base,
      toPlay: "b",
      text: "Black to play. Where?",
      options: [
        { point: pt(4, 3), verdict: "best", text: "Connect. Your own weak point first. The white stone on the right is not going anywhere in a hurry." },
        { point: pt(7, 5), verdict: "poor", text: "One stone captured, in gote. White cuts at the gap, and the two stones at the top have one liberty on the edge: two stones and the top side gone for one." },
        { point: pt(2, 3), verdict: "poor", text: "Attacking White's stones from outside leaves the cut in place. White cuts anyway." },
      ],
    },
    {
      type: "quiz",
      setup: afterCapture,
      toPlay: "w",
      answers: [pt(4, 3)],
      text: "The other seat. Black took the stone. White to play: find the weak point.",
      success: "Cut. The two black stones have one liberty, on the edge, and nowhere to run.",
      hint: "Where do the black stones fail to touch?",
      wrongText: "Not the weak point. Look at the gap between the two black stones at the top.",
    },
    {
      type: "quiz",
      setup: connected,
      toPlay: "b",
      answers: [pt(7, 5)],
      text: "Now Black has connected and there is nothing to defend. Fight.",
      success: "First secure, then attack. The classic says you win by knowing when to fight and when to decline; a fight with no weakness behind you is the one to take.",
      hint: "The white stone on the right still has one liberty.",
      wrongText: "Not there. Which white stone is in atari?",
    },
  ],
};
