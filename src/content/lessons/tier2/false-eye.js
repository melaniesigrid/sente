import { pt } from "../../positions.js";

/* ----------------------- 18k · life · An Eye That Is Not an Eye -----------------------
   Two positions that differ by one stone, and one of them is alive and the
   other is dead. The stone is not next to either eye: it sits on the diagonal,
   which is the whole point.

   Everything here was checked with tools/lessons/search.mjs and the engine's
   own legality rules, and the engine turned out to tell the story better than
   any prose could:

     in the live shape, both eye points are *illegal* for Black — suicide, both
       of them, which is what two eyes means
     in the dead shape, (3,8) is still suicide but (1,8) is legal, because
       playing there captures the cut-off white stone at (0,8)
     after Black (1,8), White has no move at all: the retake at (0,8) is
       forbidden by the ko rule, and its own eye at (3,8) is suicide
     Black then plays (3,8) and takes six stones

   That White cannot retake is not a detail we arranged; it is the ko rule from
   Tier 1 doing the work. `killable` says the group is dead whichever side moves
   first, and it says the live shape is alive whichever side moves first. */

const alive = {
  b: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6), pt(5, 7), pt(5, 8)],
  w: [pt(0, 7), pt(1, 7), pt(2, 7), pt(3, 7), pt(4, 7), pt(0, 8), pt(2, 8), pt(4, 8)],
};

const dead = {
  b: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6), pt(0, 7), pt(5, 7), pt(5, 8)],
  w: [pt(1, 7), pt(2, 7), pt(3, 7), pt(4, 7), pt(0, 8), pt(2, 8), pt(4, 8)],
};

const taken = {
  b: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6), pt(0, 7), pt(5, 7),
      pt(1, 8), pt(5, 8)],
  w: [pt(1, 7), pt(2, 7), pt(3, 7), pt(4, 7), pt(2, 8), pt(4, 8)],
};

const gone = {
  b: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6), pt(0, 7), pt(5, 7),
      pt(1, 8), pt(3, 8), pt(5, 8)],
  w: [],
};

export default {
  id: "false-eye",
  title: "An Eye That Is Not an Eye",
  subtitle: "One stone on the diagonal, and the group is dead",
  tier: 2, rank: "18k", track: "life", size: 9,
  prereqs: ["two-eyes", "ko"], minutes: 7,
  author: "Sente",
  steps: [
    {
      type: "info",
      setup: alive,
      marks: [pt(1, 8), pt(3, 8)],
      text: "White is shut in along the bottom with two empty points inside, both marked. Each is surrounded on every side by white stones of the same group, so Black cannot play in either one: both moves would be suicide. That is what two eyes means, stated exactly — not two holes, but two holes your opponent is not allowed to fill. This group is alive and nothing Black does can change it.",
    },
    {
      type: "info",
      setup: dead,
      marks: [pt(0, 7)],
      text: "Now one stone has changed colour. The marked point on the left edge is Black instead of White, and it does not touch either eye. But look at the white stone in the corner below it: it is cut off from the rest of White now, a group of one, and the only liberty it has left is the left-hand eye. The eye is not a hole in White's group any more. It is the last breath of a stone about to die.",
    },
    {
      type: "quiz",
      setup: dead,
      toPlay: "b",
      answers: [pt(1, 8)],
      text: "Black to play, and kill the whole thing.",
      hint: "One of the two eyes is still suicide to play in. The other one is not, and the reason it is not is the stone sitting in the corner.",
      success: "Black plays in the left eye and takes the corner stone with it. The move is legal precisely because it captures, which is the test: a point you can legally play in was never an eye.",
    },
    {
      type: "info",
      setup: taken,
      marks: [pt(3, 8)],
      text: "White is in atari with one eye left, and has no move anywhere. Taking the black stone straight back is the one thing the ko rule forbids, and filling its own eye at the marked point is suicide. There is nothing to play. Black takes the marked point next and six stones come off the board.",
    },
    {
      type: "info",
      setup: gone,
      text: "Count the difference again: one stone, on a diagonal, touching neither eye. An eye is only an eye while every stone around it belongs to one group that cannot be captured. Before you count two eyes and relax, look at the diagonals — in the middle of the board you need three of the four, and on the edge you need both. A shape that has one real eye and one of these has one eye, and one eye dies.",
    },
  ],
};
