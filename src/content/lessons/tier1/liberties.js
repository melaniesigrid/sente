import { pt } from "../../positions.js";

/* ----------------------- 30k · tactics · Liberties & Capture ----------------------- */
export default {
  id: "liberties",
  title: "Liberties & Capture",
  subtitle: "The one rule everything grows from",
  plain: "A stone breathes through the empty points beside it. Take the last one and the stone comes off the board, and connected stones breathe together, so count the group and never the single stone.",
  tier: 1, rank: "30k", track: "tactics", size: 9, prereqs: [], minutes: 4,
  author: "Sente", sources: [],
  steps: [
    {
      type: "info",
      setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
      marks: [pt(4, 5)],
      text: "Every stone lives on its empty adjacent points — its liberties. This white stone started with four; Black has taken three. One liberty left means atari.",
    },
    {
      type: "quiz",
      setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
      toPlay: "b",
      answers: [pt(4, 5)],
      text: "Black to play. Fill White's last liberty and capture the stone.",
      success: "Captured. A stone or chain with zero liberties comes off the board immediately.",
      hint: "Which empty point touches the white stone?",
    },
    {
      type: "quiz",
      setup: { b: [pt(1, 2), pt(1, 3), pt(2, 1), pt(3, 2), pt(3, 3)], w: [pt(2, 2), pt(2, 3)] },
      toPlay: "b",
      answers: [pt(2, 4)],
      text: "Connected stones share liberties and live or die together. This white pair has a single liberty left — capture both.",
      success: "Both stones fall at once. Chains are one organism: count liberties for the group, never the stone.",
      hint: "Trace the white pair's shared border. Only one point is still open.",
    },
    {
      type: "count",
      setup: { b: [pt(4, 4), pt(5, 4)], w: [pt(4, 3)] },
      question: "How many liberties does the black chain have?",
      answer: 5, tolerance: 0,
      hint: "Walk around the two stones and count every empty point that touches them.",
      success: "Five: three below and beside, plus the two ends. White's stone took the sixth.",
    },
    {
      type: "quiz",
      setup: { b: [pt(4, 4)], w: [pt(3, 4), pt(4, 3), pt(5, 4)] },
      toPlay: "b",
      answers: [pt(4, 5)],
      text: "Now defend. Your stone is in atari — extend to its last liberty and breathe.",
      success: "The new two-stone chain has three liberties. Extending out of atari is the first reflex to train until it is automatic.",
      hint: "Run toward the open side.",
    },
  ],
};
