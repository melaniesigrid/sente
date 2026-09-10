import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 4k · middle · On Watching the Details (Classic, ch. 10) ----------------------- */
const lean = {
  b: [pt(6, 3), pt(6, 10), pt(10, 4)],
  w: [pt(3, 6), pt(3, 7), pt(3, 8), pt(8, 5), pt(8, 6)],
};

export default {
  id: "classic-details",
  title: "On Watching the Details",
  subtitle: "Chapter ten: to hold the east, strike the west",
  plain: "The middle game is a hundred small judgements rather than one plan. Settle the inside before you lean on the outside, break up a line before it makes eyes, and only start a ko you could afford to lose.",
  tier: 5, rank: "4k", track: "middle", size: 13, prereqs: ["classic-correctness", "classic-emptiness"], minutes: 7,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 10,
  steps: [
    {
      type: "info",
      setup: lean,
      marks: [pt(4, 6), pt(8, 8)],
      text: "The middle game, the classic says, is full of things that look like advantages and are not. Its sharpest line is a whole strategy in eight words: to strengthen the outside, first settle the inside; to hold the east, strike the west. Here White has a strong group on the left and two weak stones on the right. The attack on the weak stones begins on the left.",
    },
    {
      type: "sequence",
      setup: lean,
      toPlay: "b",
      moves: [pt(4, 6), pt(4, 5), pt(5, 6), pt(4, 7), pt(5, 7), pt(4, 8), pt(8, 8)],
      commentary: [
        "Lean on the strong group. It cannot be hurt, so it will answer and you will gain shape.",
        "White pushes back, as a strong group should.",
        "Extend. Your stones are facing the weak white stones now.",
        "White hanes underneath to keep the side.",
        "Extend again. A wall is forming, and it faces east.",
        "White connects. The left is settled, on White's terms, and that is fine.",
        "Now the attack. The two weak stones are capped, and the wall you built on the west is behind them.",
      ],
      text: "A leaning attack. You are Black; the scripted White answers on the left. Strike the west to hold the east.",
      hint: "Attach to the strong group first, extend twice, then cap the weak stones from below.",
      success: "The stones you played on the left were never meant to capture anything there. They were the wall for the fight on the right.",
    },
    {
      type: "quiz",
      setup: { b: [pt(6, 4), pt(6, 8)], w: [pt(5, 6), pt(7, 6), pt(9, 6)] },
      toPlay: "b",
      answers: [pt(6, 6)],
      text: "The classic says stones laid in a line that have not yet made eyes must be broken as soon as possible. Black to play and split the white line.",
      success: "Split while they still have no eyes, and with your own stones above and below to back it up. Two weak groups where there was one.",
      hint: "Where do the white stones fail to touch, and where do your own stones already support a cut?",
      wrongText: "Not there. Cut where your own stones above and below will support the cutting stone.",
    },
    {
      type: "choice",
      setup: { b: [pt(3, 3), pt(3, 6), pt(3, 9)], w: [pt(9, 3), pt(9, 6), pt(9, 9)] },
      toPlay: "b",
      text: "Invade a territory only after choosing it carefully, the classic says, and once you are sure there is nothing in the way, go in. White's right side is framed by three stones. Black to invade.",
      options: [
        { point: pt(10, 2), verdict: "best", text: "The three-three point under the corner stone. It lives, and the corner is the one place in White's frame where life is certain." },
        { point: pt(7, 6), verdict: "poor", text: "The middle of the frame, with white stones on three sides and no edge to make eyes against. This is the invasion that only hurts the invader." },
        { point: pt(11, 6), verdict: "poor", text: "The second line, between two white stones. Too low to make two eyes, too far from the corner to reach one." },
      ],
    },
    {
      type: "info",
      setup: { b: [pt(3, 3), pt(3, 6), pt(3, 9), pt(10, 2)], w: [pt(9, 3), pt(9, 6), pt(9, 9)] },
      text: "Two more lines from the chapter to carry into your games. When you connect, remember what came before; when you sacrifice, think of what comes after. And fight a ko only when it costs your other groups nothing.",
    },
  ],
};
