import { pt } from "../../positions.js";

/* ----------------------- 28k · tactics · Playing Inside ----------------------- */
const shape = {
  w: [pt(0, 0), pt(1, 0), pt(0, 1), pt(0, 2), pt(1, 2)],
  b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(0, 3), pt(1, 3)],
};

export default {
  id: "no-liberty-capture",
  title: "Playing Inside",
  subtitle: "A 'suicide' point that isn't",
  plain: "You may not play a stone that leaves itself with no liberties, but captures are settled first. If your move takes your opponent's last liberty, their stones come off and yours breathes through the space they leave behind.",
  tier: 1, rank: "28k", track: "tactics", size: 9, prereqs: ["liberties"], minutes: 3,
  author: "Sente", sources: [],
  steps: [
    {
      type: "info",
      setup: shape,
      marks: [pt(1, 1)],
      text: "Suicide is illegal — you may not play a stone that ends its own chain with zero liberties. But there is one glorious exception.",
    },
    {
      type: "quiz",
      setup: shape,
      toPlay: "b",
      answers: [pt(1, 1)],
      text: "The marked point is White's last liberty. Black to play — the move looks like suicide, but captures resolve first.",
      success: "Five stones captured. Removal of the opponent happens before your own liberties are counted — the point was never suicide at all.",
      hint: "Count White's liberties before you count your own.",
    },
    {
      type: "quiz",
      setup: {
        w: [pt(0, 0), pt(1, 0), pt(0, 1), pt(0, 2), pt(1, 2)],
        b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(0, 3)],
      },
      toPlay: "b",
      answers: [pt(1, 3)],
      text: "Same shape, one difference: White has an outside liberty now. Playing inside would be real suicide, so take the outside liberty first.",
      success: "Now White has exactly one liberty, the inside point, and it is Black's move next time. Outside liberties before inside ones.",
      hint: "The inside point is refused by the rules. Where is White's other liberty?",
      wrongText: "The rules refuse the inside point while White has another liberty. Take that one.",
    },
  ],
};
