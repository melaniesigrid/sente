import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 12k · life · Miscellany (Classic, ch. 13) -----------------------
   The classic's corner shapes: four stones in an L holding two points die;
   six stones holding a straight four live; and in a race the bigger eye wins. */
const lGroup = {
  b: [pt(2, 0), pt(0, 1), pt(1, 1), pt(2, 1)],
  w: [pt(3, 0), pt(3, 1), pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2)],
};
const straightFour = {
  b: [pt(4, 0), pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 1), pt(4, 1)],
  w: [pt(1, 0), pt(5, 0), pt(5, 1), pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2)],
};
// Black's inner group has a three-point eye and no outside liberties. White's
// group around it has a one-point eye and one outside liberty at (4,3).
const race = {
  b: [pt(3, 0), pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 1),
      pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3), pt(5, 2), pt(6, 2), pt(7, 0), pt(7, 1), pt(7, 2)],
  w: [pt(4, 0), pt(4, 1), pt(4, 2), pt(3, 2), pt(2, 2), pt(1, 2), pt(0, 2), pt(5, 1), pt(6, 0), pt(6, 1)],
};

export default {
  id: "classic-miscellany",
  title: "Miscellany",
  subtitle: "Chapter thirteen: corner shapes, eye sizes, and how to sit",
  plain: "The last chapter is the practical one: shapes that are settled before anyone plays, and habits at the board. Do not play tired, do not gloat, and do not treat a calm position as a finished one.",
  tier: 3, rank: "12k", track: "life", size: 9, prereqs: ["two-eyes", "classic-terms"], minutes: 7,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 13,
  steps: [
    {
      type: "info",
      setup: lGroup,
      marks: [pt(0, 0), pt(1, 0)],
      text: "The last chapter is a drawer of sayings, and several are about corners. Four stones in an L shape holding two points in the corner, it says, will certainly be dead at the end of the game. Two points of eye space is one eye: White plays inside, Black captures, and the single point that remains is filled.",
    },
    {
      type: "quiz",
      setup: straightFour,
      toPlay: "b",
      answers: [pt(2, 0)],
      text: "Six stones holding four points in a row, the classic says, will certainly live. White has just placed a stone inside. Black to play and live.",
      success: "The middle. White's stone is in atari and both halves are eyes. A straight four lives even after a placement, if you answer in the middle.",
      hint: "Split what remains of the eye space into two.",
      refutations: [
        {
          move: pt(3, 0), reply: pt(2, 0),
          text: "White extends. After you capture the two stones you are left with two empty points in a row, and two in a row is one eye.",
        },
        {
          move: pt(0, 0), reply: pt(2, 0),
          text: "White extends the other way. Again you capture two stones and are left with a two-point space: one eye, dead.",
        },
      ],
    },
    {
      type: "quiz",
      setup: race,
      toPlay: "b",
      answers: [pt(4, 3)],
      text: "A big eye beats a small eye. The black group in the corner has a three-point eye and no outside liberties. The white group around it has a one-point eye and one outside liberty. Black to play and win the race.",
      success: "White is in atari and cannot fill three inside liberties in time. The bigger eye wins the race; the classic knew it nine centuries ago.",
      hint: "Count. Black has three liberties inside. White has one eye and one outside liberty. Fill the outside one.",
      wrongText: "Not there. Where is White's one liberty outside its eye?",
    },
    {
      type: "info",
      setup: { b: [pt(4, 4)], w: [pt(2, 2)] },
      text: "The rest of the chapter is about the player, not the stones. Do not boast of a win or complain of a loss. Do not play many games in a row; tired players play badly. Sit calmly and breathe evenly, and the battle is half won. And the last line, borrowed from the Book of Changes: the wise are at peace but do not forget the danger.",
    },
  ],
};
