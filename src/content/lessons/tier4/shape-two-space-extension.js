import { pt } from "../../positions.js";
import { shapeByKey } from "../../shapes.js";

/* ----------------------- 7k · shape · The Two-Space Extension (Book of Shapes) -----------------------
   The distance every player uses and few can say why. Two stones with two
   empty points between them on the third line: wide enough for a base, narrow
   enough that the wedge dies.

   Three positions, all measured. Wedge into the bare extension and Black
   blocks on either side: the wedge stone is left on two liberties and Black's
   blocked pair on five, and the mirror image gives the same numbers, which is
   the reason the shape is symmetrical and the reason it is safe. Put one white
   stone on the fourth line behind the gap and run the same three moves: the
   wedge now joins into a chain with six liberties and Black's far stone is
   down to three. Same wedge, same answers, opposite verdict.

   All liberty counts from `chainAt`; `shapes.test.js` re-derives them and also
   checks that both wedge points behave alike, which is the claim the lesson
   leans on when it says the shape does not care which side you are hit from. */

const article = shapeByKey("two-space-extension");

const extension = { b: [pt(3, 2), pt(6, 2)] };
const wedged = { b: [pt(3, 2), pt(6, 2)], w: [pt(4, 2)] };
const backed = { b: [pt(3, 2), pt(6, 2)], w: [pt(5, 4)] };

export default {
  id: "shape-two-space-extension",
  title: "The Two-Space Extension",
  subtitle: "The widest distance that still cannot be split",
  plain: "Two stones with two points between them on the third line hold enough ground for two eyes. The gap can be walked into whenever the opponent likes, but the intruder dies unless something of theirs is already standing behind it.",
  tier: 4, rank: "7k", track: "shape", size: 19, prereqs: ["connect-cut", "territory-count"], minutes: 7,
  author: "Joseki", book: "shapes",
  steps: [
    {
      type: "maxim",
      setup: extension,
      marks: [pt(4, 2), pt(5, 2)],
      line: article.proverb,
      analogy: "A doorway two people wide. Anyone may walk through it, and nobody may stand in it.",
      text: "Two black stones on the third line with two empty points between them. This is the distance a player reaches for without thinking, and the two marked points are the reason it works: they are the only way in, and they belong to Black in a way that takes one move to demonstrate.",
    },
    {
      type: "quiz",
      setup: wedged,
      toPlay: "b",
      answers: [pt(5, 2)],
      text: "White has wedged into the left-hand gap. Black to play.",
      hint: "Do not try to save both stones. Block on the side where more of the board is, and let the wedge deal with the consequences.",
      success: "Block, and count. The wedge stone is on two liberties with black stones either side of it, and the pair Black just made has five. Black has not connected (the far stone is still standing on its own with three) and Black did not need to. The wedge cannot live, so it was never a cut.",
      refutations: [
        {
          move: pt(4, 1), reply: pt(5, 2),
          text: "Hane over the top and White turns instead. Now White is the one with a shape and Black has two stones looking at each other across a white wall. The answer to a wedge is a block, on one side or the other, chosen on purpose.",
        },
      ],
    },
    {
      type: "sequence",
      setup: extension,
      toPlay: "w",
      moves: [pt(5, 2), pt(4, 2)],
      text: "It does not matter which of the two points White takes. Here is the other one.",
      hint: "White wedges on the right this time, Black blocks on the left.",
      commentary: [
        "White wedges into the other gap.",
        "Black blocks on the other side, and the numbers come out identical: two liberties for the wedge, five for Black's pair, three for the far stone. That symmetry is the shape. Black never has to work out which side to defend in advance, because both sides answer the same way.",
      ],
    },
    {
      type: "sequence",
      setup: backed,
      toPlay: "w",
      moves: [pt(5, 2), pt(4, 2), pt(5, 3)],
      text: "Now put one white stone on the fourth line behind the gap, and play exactly the same three moves.",
      hint: "White wedges, Black blocks as before, and this time White walks out to the stone that was already there.",
      commentary: [
        "The same wedge.",
        "The same block, which was correct a moment ago.",
        "And the wedge does not die. It joins the stone behind into a chain with six liberties, and Black's far stone is left on three with a white group beside it. Nothing about the extension changed. What changed was the board behind it, and that is the only thing that ever decides whether a distance is safe.",
      ],
    },
    {
      type: "info",
      setup: backed,
      marks: [pt(5, 4)],
      text: `${article.costs} ${article.breaks}`,
    },
  ],
};
