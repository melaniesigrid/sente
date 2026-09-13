import { pt } from "../../positions.js";

/* ----------------------- 8k · opening · The Third Line and the Fourth -----------------------
   The sequel to The Big Points, and the same method: the verdicts are the
   network's ranking of the offered points in that exact position, measured
   with `tools/joseki/policy.py` (humanv0, professional profile, 2015) and
   recorded on each option as `net`.

   The position is the clean one for the question. Black holds both left-hand
   corners on the 4-4 point, White both right-hand ones, and the biggest thing
   left on Black's side of the board is the middle of the left side. The only
   question is which line it goes on, and the network is unusually clear:
   the fourth line at 0.235, the third at 0.050, the second at nothing. */
export default {
  id: "opening-third-and-fourth",
  title: "The Third Line and the Fourth",
  subtitle: "Which line a side point goes on, and why it depends on the stones already there",
  plain: "A stone on the third line is close enough to the edge to hold the ground under it; a stone on the fourth is far enough out to face the middle. Neither is better on its own. The right line is the one that works with the stones already standing, and between two corners on the fourth line, the side point goes on the fourth line too.",
  tier: 4, rank: "8k", track: "opening", size: 19, prereqs: ["opening-big-points"], minutes: 6,
  author: "Joseki", sources: [],
  steps: [
    {
      type: "info",
      setup: { b: [], w: [] },
      marks: [
        pt(2, 3), pt(2, 6), pt(2, 9), pt(2, 12), pt(2, 15),
        pt(3, 3), pt(3, 6), pt(3, 9), pt(3, 12), pt(3, 15),
      ],
      text: "Two columns, marked. The inner one is the third line and the outer one is the fourth. A stone on the third line is one step from the edge, so the ground beneath it is nearly walled already and nearly certain. A stone on the fourth is one step further out, so it holds less underneath and faces more of the board. The old phrase is that the third line is for territory and the fourth for influence, and the useful part of it is that neither one is simply better.",
    },
    {
      type: "choice",
      setup: {
        b: [pt(3, 3), pt(3, 15)],
        w: [pt(15, 3), pt(15, 15)],
      },
      toPlay: "b",
      text: "Black holds both left-hand corners on the 4-4 point, White both on the right. The biggest thing left on this side of the board is the middle of the left side. Which line does it go on?",
      options: [
        { point: pt(3, 9), verdict: "best", net: { p: 0.235, rank: 2 },
          text: "The fourth line, level with both of your corner stones. The three stones stand on one line and face the middle together, and the network puts this second on the whole board. A stone that works with the stones you already have is worth more than the same stone anywhere else." },
        { point: pt(2, 9), verdict: "fine", net: { p: 0.050, rank: 4 },
          text: "The third line. Fourth on the board, and a fifth of the weight: solid, smaller, and a real choice if what you want is the points rather than the shape. It does leave your three stones on two different lines, which is the whole reason it is smaller here." },
        { point: pt(1, 9), verdict: "poor", net: { p: 0.000, rank: 112 },
          text: "The second line. A hundred and twelfth. The second line holds so little that it has a nickname: the line of defeat. It is an endgame move that has arrived about two hundred moves early." },
      ],
    },
    {
      type: "sequence",
      setup: { b: [], w: [] },
      toPlay: "b",
      moves: [pt(3, 3), pt(15, 15), pt(3, 15), pt(15, 3), pt(3, 9)],
      commentary: [
        "A corner.",
        "White takes the far one.",
        "Black takes the second corner on the same side of the board, so both black stones look down the same edge.",
        "White does the same on the right.",
        "And the side point, on the fourth line, level with the two stones it joins. Three stones on one line, facing the middle.",
      ],
      text: "Play it out from the beginning. You are Black.",
      hint: "Both corners on the left, and then the middle of the left side on the same line as them.",
      success: "That shape has a name in every language, and what it is worth is not the ground under it. It is that anything White builds on the left side now has to be built underneath three stones that are all looking at it.",
      wrongText: "Not that one. Take the left-hand corners first, on the star points.",
    },
    {
      type: "quiz",
      setup: {
        b: [pt(3, 3), pt(3, 15)],
        w: [pt(15, 3), pt(15, 15)],
      },
      toPlay: "b",
      answers: [pt(3, 9)],
      refutations: [
        { move: pt(2, 9), reply: pt(15, 9),
          text: "The third line, which is playable and which the network ranks fourth. It is not what this lesson is asking for: your two corner stones are on the fourth line, and the point that works with them is on the fourth line too. White answers on her own side and the boards are no longer symmetrical." },
        { move: pt(1, 9), reply: pt(3, 9),
          text: "The second line, and White simply takes the point you were offered. The line of defeat is called that for a reason." },
      ],
      text: "Same board. Take the big point on the left side, on the line this lesson is about.",
      hint: "Level with the two stones it is joining.",
      success: "The fourth line, level with both corners. Three stones, one line, and a side that is difficult to invade without living small and low.",
      wrongText: "Close, but not the line. Look at which line your two corner stones are standing on.",
    },
  ],
};
