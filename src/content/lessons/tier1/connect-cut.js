import { pt } from "../../positions.js";

/* ----------------------- 24k · shape · Connect and Cut ----------------------- */
export default {
  id: "connect-cut",
  title: "Connect and Cut",
  subtitle: "Two stones, one gap, and who fills it",
  plain: "A diagonal is a gap, and whoever fills it decides the fight there. Connect and your stones are one strong chain; cut and your opponent has two weak ones to keep alive at the same time.",
  tier: 1, rank: "24k", track: "shape", size: 9, prereqs: ["liberties"], minutes: 5,
  author: "Sente", sources: [],
  steps: [
    {
      type: "info",
      setup: { b: [pt(3, 3), pt(4, 4)], w: [pt(4, 3)] },
      marks: [pt(3, 4)],
      text: "Diagonal stones are not connected yet. White has taken one of the two points between them; the marked point is the cutting point. Whoever plays there decides whether Black is one group or two.",
    },
    {
      type: "quiz",
      setup: { b: [pt(3, 3), pt(4, 4)], w: [pt(4, 3)] },
      toPlay: "b",
      answers: [pt(3, 4)],
      text: "Black to play. Connect.",
      success: "Solid. Three stones, one chain, and White's stone is the one that now looks lonely.",
      hint: "There is exactly one empty point touching both black stones.",
    },
    {
      type: "quiz",
      setup: { b: [pt(3, 3), pt(4, 4)], w: [pt(4, 3), pt(2, 4)] },
      toPlay: "w",
      answers: [pt(3, 4)],
      text: "White to play. Cut the two black stones apart.",
      success: "Cut. Each black stone must now live on its own, and White has a stone on either side of the fight.",
      hint: "The same point that connects Black is the point that cuts Black.",
      wrongText: "That leaves the two black stones touching through the gap. Play into the gap itself.",
    },
    {
      type: "sequence",
      setup: { w: [pt(3, 2), pt(4, 3)], b: [pt(4, 2), pt(2, 2), pt(5, 3)] },
      toPlay: "b",
      moves: [pt(3, 3), pt(4, 4), pt(3, 1)],
      commentary: [
        "Black cuts. Both white stones are now in atari at once.",
        "White can only save one. This stone runs.",
        "Black captures the other. A cut that makes two ataris is worth remembering.",
      ],
      text: "Now cut for profit. You are Black: play the cutting point, then take what White leaves behind.",
      hint: "Look for the empty point that separates the two white stones.",
      success: "One capture and a strong black shape. Cutting is how you turn a gap into a gain.",
    },
  ],
};
