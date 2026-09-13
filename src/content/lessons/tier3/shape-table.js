import { pt } from "../../positions.js";
import { SHAPEUP_SOURCE } from "../../shapeup.js";

/* ----------------------- 13k · shape · Table and Bamboo (Shape Up, ch. 1) -----------------------
   Matthews opens on a family of strong shapes and then, one section later,
   admits the flaw in the best-looking member of it. The table shape reaches
   further than the bamboo joint and costs the same four stones; the bamboo
   joint is the one that cannot be cut. One stone stands between them.

   The engine did the arguing, and `tools/lessons/shapeup.mjs` re-runs all of
   it. On the bamboo joint, whichever of the two gap points White takes, Black
   answers on the other, the four stones become one chain and White's stone is
   left with a single liberty. On the table shape, after White wedges between
   the two bottom stones, there is no way for Black to make the four stones one
   chain in two moves - and that search let Black play both moves in a row with
   White never answering. It takes three. The other two cutting points, the
   jump and the waist, both come back together in two. The wedge is the one
   that does not.

   The Book of Shapes already has the bamboo joint as an article; this is the
   shape next to it, and the reason a player would ever choose the other one. */

const both = {
  b: [pt(3, 4), pt(4, 4), pt(3, 6), pt(5, 6), pt(8, 4), pt(9, 4), pt(8, 6), pt(9, 6)],
};

const table = { b: [pt(3, 4), pt(4, 4), pt(3, 6), pt(5, 6)] };

const unfinished = { b: [pt(3, 4), pt(4, 4), pt(3, 6)] };

export default {
  id: "shape-table",
  title: "Table and Bamboo",
  subtitle: "Chapter one: two shapes, one stone apart",
  plain: "The table shape and the bamboo joint cost the same four stones and the table reaches one point further, but the table can be wedged apart and the bamboo joint cannot. Which one you want is a reading of the position: look for a white stone near enough to wedge before you buy the extra reach.",
  tier: 3, rank: "13k", track: "shape", size: 13,
  prereqs: ["shape-tigers-mouth", "connect-cut"], minutes: 7,
  author: "Joseki", sources: [SHAPEUP_SOURCE], book: "shapeup", series: "shapeup", chapter: 1,
  steps: [
    {
      type: "info",
      setup: both,
      marks: [pt(5, 6), pt(9, 6)],
      text: "Two shapes, four stones each. On the left the table: a solid pair above, and below it two stones a jump away with a gap between them. On the right the bamboo joint you already know. The only difference is the marked stone, one point further out on the left. That one point is the table's whole argument: it covers more ground, it reaches towards the side, and the four stones still stand together.",
    },
    {
      type: "sequence",
      setup: table,
      toPlay: "w",
      moves: [pt(4, 6), pt(4, 5), pt(4, 7)],
      text: "You are White. The table is standing in front of you. Find the point that takes it apart.",
      hint: "The gap between the two bottom stones is a gap, not a connection. Sit down in it.",
      commentary: [
        "The wedge. White plays between the two bottom stones and Black now has three separate pieces where there was one shape.",
        "Black ataris from above and joins that stone to the wall. It is the right answer and it does not solve anything.",
        "White extends down and lives in the middle of Black's shape with three liberties. Black's two bottom stones are still adrift: joining all four of them back up takes three more moves, and that is counting as though White never played again.",
      ],
    },
    {
      type: "choice",
      setup: unfinished,
      toPlay: "b",
      text: "Three black stones, and one more to place. Now that you have seen the wedge, choose.",
      options: [
        { point: pt(4, 6), verdict: "best", text: "The bamboo joint. Whichever gap point White takes, Black answers on the other, the four stones become one chain, and White's stone is left in atari. There is no cut here and there never will be. It gives up the extra point of reach the table had, and buys certainty with it." },
        { point: pt(5, 6), verdict: "fine", text: "The table. It is the shape from the first screen, and it is a genuinely strong shape: further out, facing the side, worth its four stones. It is also the one with the wedge in it. Play it when nobody is close enough to wedge, or when you can afford the fight if they do." },
        { point: pt(4, 5), verdict: "poor", text: "This makes an empty triangle with the two stones above: three stones filling the space two would hold, and the point at the corner of the triangle is a liberty Black has spent on nothing. It connects, but it is the most expensive connection on the board." },
      ],
    },
    {
      type: "info",
      setup: both,
      text: "Neither shape is the right one. The table is the more efficient of the two and the bamboo joint is the one that holds, and knowing which you want is a reading of the position rather than a rule. The question to ask is whether there is a white stone near enough to wedge. If there is, the point of reach the table buys is a point you are going to pay back with interest. If there is not, take the reach.",
    },
  ],
};
