import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 15k · opening · On Holding Territory (Classic, ch. 3) ----------------------- */
export default {
  id: "classic-territory",
  title: "On Holding Territory",
  subtitle: "Chapter three: corners first, then measured extensions",
  tier: 3, rank: "15k", track: "opening", size: 13, prereqs: ["first-9x9-opening", "classic-board"], minutes: 6,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 3,
  steps: [
    {
      type: "info",
      setup: { b: [], w: [] },
      marks: [pt(3, 3), pt(9, 3), pt(3, 9), pt(9, 9)],
      text: "Holding territory, the classic says, means laying down the general lines while the stones are still being placed. At the start the positions are divided at the four corners. Then come the extensions, and Zhang Ni gives a rule for them: from one stone skip two points, from two stones skip three, from three skip four. Near, but not touching. Far, but not out of reach.",
    },
    {
      type: "choice",
      setup: { b: [pt(3, 3), pt(3, 9)], w: [pt(9, 3), pt(9, 9)] },
      toPlay: "b",
      text: "Black to play along the top from the single stone in the corner. Three candidates are marked.",
      options: [
        { point: pt(6, 3), verdict: "best", text: "Two points skipped from one stone: the classic's measure. Close enough to work with the corner, far enough to claim something." },
        { point: pt(4, 3), verdict: "poor", text: "Touching your own stone. Near is not adjacency; this gains almost nothing." },
        { point: pt(7, 3), verdict: "fine", text: "Three skipped from one stone is wide. Playable, but White can come between and the corner stone is on its own." },
      ],
    },
    {
      type: "choice",
      setup: { b: [pt(3, 3), pt(3, 4)], w: [pt(3, 9), pt(9, 9)] },
      toPlay: "b",
      text: "Now Black has a wall of two. Extend along the top.",
      options: [
        { point: pt(7, 3), verdict: "best", text: "Three skipped from two stones. A taller wall reaches further; this is the extension that uses it." },
        { point: pt(5, 3), verdict: "fine", text: "Two skipped is solid but timid. Two stones deserve more than one." },
        { point: pt(10, 3), verdict: "poor", text: "Seven points away, on the far side of the board. White walks in between, and the wall works for nothing." },
      ],
    },
    {
      type: "choice",
      setup: { b: [pt(3, 3), pt(3, 4), pt(3, 5)], w: [pt(3, 9), pt(9, 9)] },
      toPlay: "b",
      text: "A wall of three. Extend along the top.",
      options: [
        { point: pt(8, 3), verdict: "best", text: "Four skipped from three stones. The rule scales with the wall, and so does the territory in front of it." },
        { point: pt(6, 3), verdict: "fine", text: "Three skipped. Safe, and a little wasteful of a three-stone wall." },
        { point: pt(11, 3), verdict: "poor", text: "Too far, and on the second line from the edge. White cuts it off from the wall and it has nothing to lean on." },
      ],
    },
    {
      type: "info",
      setup: { b: [pt(3, 3), pt(9, 9)], w: [pt(9, 3), pt(3, 9)] },
      text: "The classic says these measures were argued out by the ancients and tested by those who came after, and that whoever discards them without a reason cannot know what will follow. It closes with a line from the Book of Songs: without a good beginning there is no good end.",
    },
  ],
};
