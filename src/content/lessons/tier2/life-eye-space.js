import { pt } from "../../positions.js";

/* ----------------------- 16k · life · How Big the Space Is (Tier 2) -----------------------
   Three walled-in spaces, each one a white ring whose only liberties are the
   empty points inside it, so "dead" here means capturable and nothing is being
   argued by analogy. The rings were built and solved by tools/lessons/eyes.mjs
   (`node tools/lessons/eyes.mjs --lessons` re-proves all three):

     three in a row   wall 12 stones, 3 liberties. Black first DEAD, White
                        first alive. One killing point, (4,4), the middle
     four in a row    wall 14 stones, 4 liberties. Alive whoever moves first,
                        and not one of the four points kills
     the square four  wall 12 stones, 4 liberties. DEAD whoever moves first,
                        and all four points kill: there is nothing White can do

   No verdict here is ko-sensitive. The refutation in the quiz was played out
   too: Black on an end, White in the middle captures the stone and comes out
   with two separate eyes.

   The census behind the general claim is in tools/lessons/eyes.mjs: of the two
   shapes of three points both die, and of the five shapes of four points only
   two do. Tier 4 takes the census further. */

const three = {
  b: [pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2), pt(6, 2), pt(1, 3), pt(7, 3), pt(1, 4),
      pt(7, 4), pt(1, 5), pt(7, 5), pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6), pt(6, 6)],
  w: [pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3), pt(6, 3), pt(2, 4), pt(6, 4), pt(2, 5),
      pt(3, 5), pt(4, 5), pt(5, 5), pt(6, 5)],
};

const four = {
  b: [pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2), pt(6, 2), pt(7, 2), pt(1, 3), pt(8, 3),
      pt(1, 4), pt(8, 4), pt(1, 5), pt(8, 5), pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6),
      pt(6, 6), pt(7, 6)],
  w: [pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3), pt(6, 3), pt(7, 3), pt(2, 4), pt(7, 4),
      pt(2, 5), pt(3, 5), pt(4, 5), pt(5, 5), pt(6, 5), pt(7, 5)],
};

const square = {
  b: [pt(2, 1), pt(3, 1), pt(4, 1), pt(5, 1), pt(1, 2), pt(6, 2), pt(1, 3), pt(6, 3),
      pt(1, 4), pt(6, 4), pt(1, 5), pt(6, 5), pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6)],
  w: [pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2), pt(2, 3), pt(5, 3), pt(2, 4), pt(5, 4),
      pt(2, 5), pt(3, 5), pt(4, 5), pt(5, 5)],
};

export default {
  id: "life-eye-space",
  title: "How Big the Space Is",
  subtitle: "Three dies, four lives, and the square dies anyway",
  plain: "A surrounded group lives or dies on the shape of the space inside it rather than on the number of stones around it. Three points in a row die to a move in the middle, four in a row cannot be killed at all, and four points folded into a square are dead before anybody plays.",
  tier: 2, rank: "16k", track: "life", size: 9,
  prereqs: ["two-eyes", "life-false-eye"], minutes: 9,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: three,
      marks: [pt(3, 4), pt(4, 4), pt(5, 4)],
      text: "White is sealed in, and the three marked points are the only liberties the group has left: one space, three points, in a row. Whether this group lives has nothing to do with how many stones White has around it. It stopped being about stones some moves ago. It is about whether that space can be made into two eyes, and that depends on who plays there first.",
    },
    {
      type: "quiz",
      setup: three,
      toPlay: "b",
      answers: [pt(4, 4)],
      text: "Black to play, and kill the group.",
      hint: "If Black plays on an end, White plays in the middle and the space splits in two. Take the point White wants.",
      success: "The middle. A space of three cannot be split into two eyes once the middle is gone, and Black's stone cannot be captured, because taking it would mean filling White's own last liberties.",
      refutations: [
        {
          move: pt(3, 4), reply: pt(4, 4),
          text: "Black on the end, and White takes the middle. That move captures the black stone and leaves two separate points, one on each side: two eyes, and White is alive.",
        },
        {
          move: pt(5, 4), reply: pt(4, 4),
          text: "The other end, and the same answer. Either end hands White the middle, and the middle is the only point that matters.",
        },
      ],
    },
    {
      type: "info",
      setup: four,
      marks: [pt(3, 4), pt(4, 4), pt(5, 4), pt(6, 4)],
      text: "The same shape one point longer, and everything changes. No move here kills, not one of the four, whoever plays first. Wherever Black plays, White answers on the other side of it and still has room for two eyes. Three in a row dies to a move in the middle; four in a row has no middle to take.",
    },
    {
      type: "info",
      setup: square,
      marks: [pt(3, 3), pt(4, 3), pt(3, 4), pt(4, 4)],
      text: "Four points again, folded into a square, and now White is dead as it stands. White cannot save it even playing first, and Black does not have to find anything: all four points kill. A square of four has no point that divides it, so every move White makes inside only fills it in. Four points are not enough on their own. They have to be the right four.",
    },
    {
      type: "info",
      setup: three,
      marks: [pt(4, 4)],
      text: "So the question to ask of a surrounded space is not how big it is but where its middle is. Find the point that would cut the space into two pieces, each one big enough to be an eye, and you have found the move that kills and the move that lives at the same time. It is one point, and whoever plays it owns the group.",
    },
  ],
};
