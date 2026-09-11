import { pt } from "../../positions.js";
import { shapeByKey } from "../../shapes.js";

/* ----------------------- 12k · shape · The Ponnuki (Book of Shapes) -----------------------
   The proverb everybody can quote and almost nobody can finish. Thirty points
   is what a ponnuki is worth facing open board; the same four stones in the
   corner are worth about six, and the lesson makes the learner count the
   difference rather than take it on trust.

   Both numbers in the lesson are liberty counts from `chainAt`, taken over the
   four stones and with the shared centre point removed, and `shapes.test.js`
   takes them again on every run: eight liberties in the middle of the board,
   six on the edge. The centre point is a real eye in both, which the engine
   states by refusing a stone there as suicide.

   The thirty is not measured and is not presented as though it were. It is a
   proverb, and the lesson says so. */

const article = shapeByKey("ponnuki");

const atari = { b: [pt(4, 3), pt(3, 4), pt(5, 4)], w: [pt(4, 4)] };
const made = { b: [pt(4, 3), pt(3, 4), pt(5, 4), pt(4, 5)] };
const cornered = { b: [pt(1, 0), pt(0, 1), pt(2, 1), pt(1, 2)] };

export default {
  id: "shape-ponnuki",
  title: "The Ponnuki",
  subtitle: "Thirty points, six points, and the half of the proverb nobody quotes",
  plain: "Four stones around a captured one make the cheapest strong shape in the game: a finished eye, eight liberties and no cutting point. What they do not make is territory, and against a group that is already alive they are worth almost nothing.",
  tier: 3, rank: "12k", track: "shape", size: 9, prereqs: ["two-eyes", "no-liberty-capture"], minutes: 6,
  author: "Joseki", book: "shapes",
  steps: [
    {
      type: "maxim",
      setup: atari,
      marks: [pt(4, 5)],
      line: article.proverb,
      analogy: "Clearing a room rather than furnishing one. Nothing has been put in it yet and everyone can already see whose room it is.",
      text: "A white stone with one liberty and three black stones around it. The shape that follows has a name, a proverb, and a price, and the proverb is the part people remember.",
    },
    {
      type: "quiz",
      setup: atari,
      toPlay: "b",
      answers: [pt(4, 5)],
      text: "Black to play. Take it.",
      hint: "Fill the white stone's last liberty from below.",
      success: "That is a ponnuki: four stones around a hole. There is no cutting point anywhere in it, the hole is an eye — White playing there now is refused as suicide — and the four stones push outward in four directions at once.",
    },
    {
      type: "count",
      setup: made,
      question: "How many liberties do the four stones have between them, not counting the eye in the middle?",
      answer: 8, tolerance: 0,
      hint: "Three liberties each on the outside, four stones, and none of them shared.",
      success: "Eight, and the eye makes nine. That is what the proverb is pricing: a group that cannot be cut, cannot be put in atari in one move, and already has half its life. The thirty is a proverb, not a measurement — nobody has ever scored a ponnuki — and what it means in practice is that you should be pleased to give up a stone to build one.",
      wrongText: "Count the outside of the shape rather than the shape. Each of the four stones has three empty points of its own, and the middle belongs to all of them.",
    },
    {
      type: "count",
      setup: cornered,
      question: "The same four stones, this time in the corner. How many liberties now, again not counting the eye?",
      answer: 6, tolerance: 0,
      hint: "Two of the stones have lost a liberty to the edge.",
      success: "Six, and it is worse than the two liberties suggest. A ponnuki is paid for by the empty board it faces, and in the corner it faces two edges and a small piece of nothing. The proverb has a second half people leave off: on the edge it is worth about six points, and next to a group that is already alive it is worth less than that.",
      wrongText: "Two of the four stones are on the first line and the edge has taken a liberty from each of them.",
    },
    {
      type: "info",
      setup: made,
      marks: [pt(4, 4)],
      text: `${article.costs} ${article.breaks}`,
    },
  ],
};
