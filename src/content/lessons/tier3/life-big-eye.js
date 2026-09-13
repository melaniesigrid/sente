import { pt } from "../../positions.js";

/* ----------------------- 13k · life · One Big Eye Is Still One Eye (Tier 3) -----------------------
   Five points of space, which is more than the four in a row that Tier 2 proved
   cannot be killed, and this one dies. The shape is the bulky five: a square of
   four with one point hanging off it.

   Built and solved by tools/lessons/eyes.mjs. The white wall is 15 stones and
   one chain, and its only five liberties are the space:

     black first  DEAD. White first, alive
     killing point  (3,4), and it is the only one. The other four all fail
     not ko-sensitive: the verdict holds with the ko rule switched off
     the line, played out by the solver and replayed by the verifier on every
       npm test:  b (3,4)  w (3,3)  b (4,4)  w (3,5)  b (4,5), and that last
       move takes 17 stones off the board

   Black's final move fills the last liberty of his own three stones. It is
   legal because it captures, which is the same rule the Tier 1 lesson on
   playing inside turns on, met again five moves deep. */

const wall = [
  pt(2, 1), pt(3, 1), pt(4, 1), pt(5, 1), pt(1, 2), pt(6, 2), pt(1, 3), pt(6, 3),
  pt(1, 4), pt(6, 4), pt(1, 5), pt(6, 5), pt(1, 6), pt(6, 6), pt(2, 7), pt(3, 7),
  pt(4, 7), pt(5, 7),
];

const bulky = {
  b: wall,
  w: [pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2), pt(2, 3), pt(4, 3), pt(5, 3), pt(2, 4),
      pt(5, 4), pt(2, 5), pt(5, 5), pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6)],
};

const gone = {
  b: [...wall, pt(3, 4), pt(4, 4), pt(4, 5)],
  w: [],
};

export default {
  id: "life-big-eye",
  title: "One Big Eye Is Still One Eye",
  subtitle: "Five points of room, and not one of them an eye",
  plain: "A big space is not the same as two eyes. Some five- and six-point shapes are a single large eye, and a stone placed at the middle of one keeps it that way: White can fill the space in but never divide it, and the whole group comes off the board.",
  tier: 3, rank: "13k", track: "life", size: 9,
  prereqs: ["life-eye-space"], minutes: 8,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: bulky,
      marks: [pt(3, 3), pt(3, 4), pt(4, 4), pt(3, 5), pt(4, 5)],
      text: "Five marked points of space, and they are the white group's only liberties. Five is more room than the four in a row you could not kill, so this ought to be comfortable. It is not. A space only becomes two eyes if it can be divided, and what matters is not how many points there are but whether they can be cut into two pieces, each big enough to be an eye of its own.",
    },
    {
      type: "quiz",
      setup: bulky,
      toPlay: "b",
      answers: [pt(3, 4)],
      text: "Black to play, and kill the group. There is exactly one move.",
      hint: "The shape is a square of four with one point hanging off it. Stand on the point where the hanging piece joins the square, the one point that touches three others.",
      success: "The placement. That point touches three of the other four, so from there the space can never be cut in two: whatever White adds, one side of the cut is too small to be an eye. Every other move in the space lets White live, which is what makes this a shape to recognise rather than a position to read out.",
      refutations: [
        {
          move: pt(3, 3), reply: pt(3, 4),
          text: "Black on the hanging point, and White takes the junction instead. Now the space divides: White has one eye above and room for a second below, and the group is alive.",
        },
        {
          move: pt(4, 5), reply: pt(3, 4),
          text: "Black in the corner of the square, and again White plays the junction and splits the space. Coming in at the edge of a shape is what a shape is for.",
        },
      ],
    },
    {
      type: "sequence",
      setup: bulky,
      toPlay: "b",
      moves: [pt(3, 4), pt(3, 3), pt(4, 4), pt(3, 5), pt(4, 5)],
      text: "Play it out. Black places, and every white answer is a point of the space being spent.",
      hint: "Keep taking away the points White would divide the space with. White's stones inside are not defending anything; they are filling in the space they need.",
      commentary: [
        "The placement, on the point that touches three others.",
        "White fills above the stone. It looks like an attack on it and it is really the last of the space being spent.",
        "Black extends. Two stones now, sitting across the middle of the shape, and there is nothing left that could become a second eye.",
        "White fills below. One liberty left for the black stones, and White is playing on with nothing to gain because the alternative is to watch.",
        "Black plays the last point. This move fills his own final liberty and it is legal because it captures, and what it captures is all of White: seventeen stones.",
      ],
      success: "Seventeen stones for three. The group was already dead when the first stone landed; the rest was only counting.",
    },
    {
      type: "info",
      setup: gone,
      text: "The corner as it stands afterwards. It is worth being clear about what actually happened: White was never in trouble for want of liberties, and had five points of territory in hand. The space just could not be divided, and a space that cannot be divided is one eye however large it is.",
    },
    {
      type: "info",
      setup: bulky,
      marks: [pt(3, 4)],
      text: "The shapes this happens to are a short list, and they all have a point like the marked one: a middle that touches everything. Three in a row, four in the shape of a pyramid, this bulky five, the five in a cross, and one six-point flower. Learn the list and you stop reading these out. Everything else of five or six points lives, which Tier 4 proves by solving all forty-seven of them.",
    },
  ],
};
