import { pt } from "../../positions.js";

/* ----------------------- 22k · tactics · The Edge ----------------------- */
export default {
  id: "edge-first-line",
  title: "The Edge Is a Wall",
  subtitle: "Stones on the first line have fewer liberties",
  tier: 1, rank: "22k", track: "tactics", size: 9, prereqs: ["atari-escape"], minutes: 4,
  author: "Sente", sources: [],
  steps: [
    {
      type: "info",
      setup: { b: [pt(4, 4), pt(4, 0), pt(0, 0)] },
      marks: [pt(4, 4), pt(4, 0), pt(0, 0)],
      text: "The same stone, three places. In the centre it has four liberties. On the edge, three. In the corner, two. The board edge is a wall that takes liberties away for free.",
    },
    {
      type: "count",
      setup: { b: [pt(4, 4), pt(4, 0), pt(0, 0)] },
      question: "How many liberties do the three stones have in total?",
      answer: 9, tolerance: 0,
      hint: "Four in the centre, three on the edge, two in the corner.",
      success: "Nine. The corner stone is the weakest thing on the board.",
    },
    {
      type: "quiz",
      setup: { w: [pt(3, 0)], b: [pt(2, 0), pt(3, 1)] },
      toPlay: "b",
      answers: [pt(4, 0)],
      text: "Black to play. The white stone on the edge has one liberty left. Capture it.",
      success: "Captured with only three stones. In the centre this would have taken four.",
      hint: "Which empty point still touches the white stone?",
      wrongText: "The white stone still breathes. Its last liberty is along the edge.",
    },
    {
      type: "quiz",
      setup: { b: [pt(0, 0)], w: [pt(1, 0)] },
      toPlay: "w",
      answers: [pt(0, 1)],
      text: "White to play. The corner stone has two liberties, and White already has one of them.",
      success: "Captured. Two liberties is all a corner stone ever has; approach it once and it is in atari.",
      hint: "There is one empty point left beside the black stone.",
    },
  ],
};
