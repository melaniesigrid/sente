import { pt } from "../../positions.js";

/* ----------------------- 9k · life · The Short List (Tier 4) -----------------------
   The census lesson. `node tools/lessons/eyes.mjs` enumerates every distinct
   eye space of three to six points, walls each one in so the surrounded chain
   has no liberty outside it, and solves it exhaustively from both sides. Of
   the 54 shapes, 7 die:

     3 points   2 shapes, both die, each to one killing point
     4 points   5 shapes, 2 die: the pyramid four to one point, the square
                  four dead as it stands with all four points killing
     5 points   12 shapes, 2 die: the bulky five and the cross five
     6 points   35 shapes, 1 dies: the flower six

   No verdict in the census is ko-sensitive at these sizes, so none of this
   rests on a ko. The three positions in this lesson are the cross five (killing
   point (4,4), the centre), the flower six (killing point (3,4), the point that
   touches four others) and the rectangular six, which lives in the open board
   with no killing point at all.

   That last one is on purpose. In the corner the same rectangle dies to a
   placement on the 2-2 point, which is what `life-and-death-tesuji` teaches at
   2 dan. A shape is only as alive as the place it is standing in. */

const crossFive = {
  b: [pt(2, 1), pt(3, 1), pt(4, 1), pt(5, 1), pt(6, 1), pt(1, 2), pt(7, 2), pt(1, 3),
      pt(7, 3), pt(1, 4), pt(7, 4), pt(1, 5), pt(7, 5), pt(1, 6), pt(7, 6), pt(2, 7),
      pt(3, 7), pt(4, 7), pt(5, 7), pt(6, 7)],
  w: [pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2), pt(6, 2), pt(2, 3), pt(3, 3), pt(5, 3),
      pt(6, 3), pt(2, 4), pt(6, 4), pt(2, 5), pt(3, 5), pt(5, 5), pt(6, 5), pt(2, 6),
      pt(3, 6), pt(4, 6), pt(5, 6), pt(6, 6)],
};

const flowerSix = {
  b: [pt(1, 1), pt(2, 1), pt(3, 1), pt(4, 1), pt(5, 1), pt(0, 2), pt(6, 2), pt(0, 3),
      pt(6, 3), pt(0, 4), pt(6, 4), pt(0, 5), pt(6, 5), pt(0, 6), pt(6, 6), pt(1, 7),
      pt(2, 7), pt(3, 7), pt(4, 7), pt(5, 7)],
  w: [pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2), pt(1, 3), pt(4, 3), pt(5, 3),
      pt(1, 4), pt(5, 4), pt(1, 5), pt(2, 5), pt(4, 5), pt(5, 5), pt(1, 6), pt(2, 6),
      pt(3, 6), pt(4, 6), pt(5, 6)],
};

const rectangularSix = {
  b: [pt(2, 1), pt(3, 1), pt(4, 1), pt(5, 1), pt(6, 1), pt(1, 2), pt(7, 2), pt(1, 3),
      pt(7, 3), pt(1, 4), pt(7, 4), pt(1, 5), pt(7, 5), pt(2, 6), pt(3, 6), pt(4, 6),
      pt(5, 6), pt(6, 6)],
  w: [pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2), pt(6, 2), pt(2, 3), pt(6, 3), pt(2, 4),
      pt(6, 4), pt(2, 5), pt(3, 5), pt(4, 5), pt(5, 5), pt(6, 5)],
};

export default {
  id: "life-dead-shapes",
  title: "The Short List",
  subtitle: "Seven shapes die and forty-seven live",
  plain: "Every eye space of three to six points has been solved: of the fifty-four distinct shapes, seven die and the rest live. That is a list short enough to know by sight, which is the difference between reading a corner out every time and glancing at it.",
  tier: 4, rank: "9k", track: "life", size: 9,
  prereqs: ["life-big-eye"], minutes: 9,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: crossFive,
      marks: [pt(4, 3), pt(3, 4), pt(4, 4), pt(5, 4), pt(4, 5)],
      text: "Five points again, this time in a cross, and the white wall's only liberties are the five marked points. You have met the bulky five; this is the other five-point shape that dies, and they are the only two out of twelve. What both have is a point that touches three or four of the others, which is the same thing as saying the space cannot be cut into two eyes once that point is gone.",
    },
    {
      type: "quiz",
      setup: crossFive,
      toPlay: "b",
      answers: [pt(4, 4)],
      text: "Black to play, and kill.",
      hint: "Four of the five points are arms. Stand where they meet.",
      success: "The centre of the cross. From there nothing White adds can produce two separate eyes, and the four arms are one eye that happens to have a shape.",
    },
    {
      type: "info",
      setup: flowerSix,
      marks: [pt(2, 3), pt(3, 3), pt(2, 4), pt(3, 4), pt(4, 4), pt(3, 5)],
      text: "Six points now, and this is the only shape of six that dies: thirty-four others live. It is called the flower six, and you can see why it belongs on the list rather than in it: the marked point in the middle touches four of the other five, which is the family likeness the whole list shares.",
    },
    {
      type: "quiz",
      setup: flowerSix,
      toPlay: "b",
      answers: [pt(3, 4)],
      text: "Black to play. One of the six points kills and the other five do not.",
      hint: "Count how many of the other points each one touches, and take the greediest.",
      success: "The middle of the flower. Six points of space and it was one eye all along, which is the thing worth taking away from this lesson: a space is not a number of points, it is a shape with a middle or without one.",
    },
    {
      type: "info",
      setup: rectangularSix,
      marks: [pt(3, 3), pt(4, 3), pt(5, 3), pt(3, 4), pt(4, 4), pt(5, 4)],
      text: "Six points in a rectangle, standing in the open, and it is alive. There is no killing point at all: wherever Black plays inside, White answers and takes two eyes out of what is left. Learn this one too, because it is the shape that catches good players out. In the corner, with the edges taking away White's answers, the same rectangle dies to a placement on the 2-2 point, which is the lesson waiting at 2 dan.",
    },
    {
      type: "info",
      setup: crossFive,
      marks: [pt(4, 4)],
      text: "The whole list, and it is short. Both shapes of three. Two shapes of four: the pyramid and the square. Two of five: the bulky five and the cross. One of six: the flower. Seven shapes out of fifty-four, every one of them with a point that touches most of the others, and every one of them proved rather than remembered. Recognise the shape, play the middle, stop reading.",
    },
  ],
};
