import { pt } from "../../positions.js";
import { shapeByKey } from "../../shapes.js";

/* ----------------------- 14k · shape · The Tiger's Mouth (Book of Shapes) -----------------------
   Three stones around an empty point, and the empty point does two jobs at once:
   it is a connection nobody paid for and it is half an eye.

   Everything the lesson states was measured in the engine first, and
   `shapes.test.js` keeps measuring it: a white stone played at the mouth has
   exactly one liberty; after Black captures it, all four neighbours of the
   mouth are black and White's move there is refused as suicide, which is the
   engine's way of saying the point is a finished eye.

   The last step is the part of the shape nobody is taught. With a white stone
   already standing above the gap, the mouth is not a connection at all: White
   cuts at the gap and the cutting chain has three liberties, not one. The
   solid connection in the same position makes one black chain of seven
   liberties. Both numbers are from `chainAt`. */

const article = shapeByKey("tigers-mouth");

const mouth = { b: [pt(3, 3), pt(5, 3), pt(4, 4)] };
const inside = { b: mouth.b, w: [pt(4, 3)] };
const propped = { b: [pt(3, 3), pt(5, 3)], w: [pt(4, 2)] };

export default {
  id: "shape-tigers-mouth",
  title: "The Tiger's Mouth",
  subtitle: "A connection you did not pay for, and an eye you only half own",
  plain: "Three stones round an empty point act as one group without spending a move, because anything played in the gap dies at once. It is a connection and half an eye together, and the price is a free forcing move for the other player.",
  tier: 3, rank: "14k", track: "shape", size: 9, prereqs: ["connect-cut"], minutes: 6,
  author: "Joseki", book: "shapes",
  steps: [
    {
      type: "maxim",
      setup: mouth,
      marks: [pt(4, 3)],
      line: article.proverb,
      analogy: "A gate left open on a narrow bridge. You do not need to shut it, because there is only room for one person to come through and nowhere for them to stand once they have.",
      text: "Two black stones with a gap between them and a third below the gap. The two are not touching and do not need to be: the marked point is a mouth, and the engine will show you why in one move.",
    },
    {
      type: "quiz",
      setup: inside,
      toPlay: "b",
      answers: [pt(4, 2)],
      text: "White has stepped into the mouth anyway. Black to play.",
      hint: "The white stone has one liberty. Take it.",
      success: "Gone. Look at what is left: the point White died on has black stones on all four sides, which makes it an eye, and a second white stone played there now is refused outright as suicide. The mouth was half an eye before. Eating something turned it into a whole one.",
      refutations: [
        {
          move: pt(7, 4), reply: pt(4, 2),
          text: "Leave it and the throw-in turns out to have been a cut. White joins up, that chain has three liberties of its own, and the two black stones are now two separate stones with three liberties each, neither of them connected to anything.",
        },
      ],
    },
    {
      type: "sequence",
      setup: mouth,
      toPlay: "w",
      moves: [pt(4, 3), pt(4, 2)],
      text: "The same exchange from the start, so you can see what each side spent.",
      hint: "White plays into the mouth, Black takes it off.",
      commentary: [
        "White throws in. It cannot live there and White knows it, which is the point: the move is not an attack, it is a purchase.",
        "Black eats it and now owns a real eye. Count the bill, though. Black spent a stone answering, and White spent a stone to buy a ko threat that did not exist a moment ago. That is what the mouth costs, and against a solid connection there would have been nothing to throw in to.",
      ],
    },
    {
      type: "choice",
      setup: propped,
      toPlay: "b",
      text: "The same two black stones, and now White has a stone directly above the gap. Black has to join up. There are two ways, and only one of them is still a connection.",
      options: [
        { point: pt(4, 3), verdict: "best", text: "Solid. One black chain of three stones with seven liberties and nothing left to argue about. It is the slow move and here it is the only move, because the fast one has stopped working." },
        { point: pt(4, 4), verdict: "poor", text: "The mouth, out of habit. White cuts at the gap and the cutting stone is not alone any more: it joins the stone above into a chain with three liberties, and it does not die. A tiger's mouth is a connection because the intruder has one liberty. Give the intruder a friend and it is just a gap." },
      ],
    },
    {
      type: "info",
      setup: propped,
      marks: [pt(4, 3)],
      text: `${article.costs} ${article.breaks}`,
    },
  ],
};
