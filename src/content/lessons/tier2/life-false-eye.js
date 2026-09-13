import { pt } from "../../positions.js";

/* ----------------------- 18k · life · What Counts as an Eye (Tier 2) -----------------------
   Two positions that differ by the colour of one stone, and the stone is not
   next to either eye. It sits on the diagonal, which is the whole point.

   Everything here was solved with tools/lessons/eyes.mjs, and the engine tells
   the story better than the prose can:

     in the live shape both eye points are ILLEGAL for Black. Suicide, both of
       them, which is what two eyes means said exactly
     in the dead shape (0,8) is still suicide and (2,8) is legal, because
       playing there captures the white stone at (3,8), which the change of
       colour on the diagonal cut off from the rest
     after Black (2,8) the white group has one eye and one liberty, and the
       search calls it dead whoever moves next
     the verdict is not ko-sensitive: it is the same with the ko rule switched
       off, so nothing here rests on a ko

   The rule the lesson ends on is the one worth carrying away: an eye on the
   edge needs both of its diagonals, an eye in the middle needs three of its
   four, and a group with one real eye and one of these has one eye. */

const wall = [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(4, 6), pt(4, 7), pt(4, 8)];

const alive = {
  b: wall,
  w: [pt(0, 7), pt(1, 7), pt(2, 7), pt(3, 7), pt(1, 8), pt(3, 8)],
};

const dead = {
  b: [...wall, pt(3, 7)],
  w: [pt(0, 7), pt(1, 7), pt(2, 7), pt(1, 8), pt(3, 8)],
};

const taken = {
  b: [...wall, pt(3, 7), pt(2, 8)],
  w: [pt(0, 7), pt(1, 7), pt(2, 7), pt(1, 8)],
};

export default {
  id: "life-false-eye",
  title: "What Counts as an Eye",
  subtitle: "A hole is not an eye until you check the diagonals",
  plain: "An eye is a point your opponent cannot legally play in, and that only holds while the stones around it are one group that cannot be captured. The diagonals are where that is decided: on the edge you need both of them, in the middle three of the four.",
  tier: 2, rank: "18k", track: "life", size: 9,
  prereqs: ["two-eyes"], minutes: 7,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: alive,
      marks: [pt(0, 8), pt(2, 8)],
      text: "Six white stones in the corner, shut in by Black, with the two marked points empty inside. Each one is surrounded on every side by white stones of the same group, so Black cannot play in either: both moves would be suicide. That is two eyes stated exactly. Not two holes, but two holes your opponent is not allowed to fill.",
    },
    {
      type: "info",
      setup: dead,
      marks: [pt(3, 7)],
      text: "Now one stone has changed colour. The marked point is Black instead of White, and it does not touch either eye. But look at the white stone below it, the one on the edge: it is cut off from the rest of White now, a group of one, and the only liberty it has left is the right-hand hole. That hole is not a gap in White's group any more. It is the last breath of a stone about to die.",
    },
    {
      type: "quiz",
      setup: dead,
      toPlay: "b",
      answers: [pt(2, 8)],
      text: "Black to play, and take the group.",
      hint: "One of the two holes is still suicide for Black. The other is not, and the reason it is not is the white stone sitting alone on the edge.",
      success: "Black plays in the right-hand hole and takes the stone with it. The move is legal precisely because it captures, and that is the test: a point you can legally play in was never an eye.",
    },
    {
      type: "info",
      setup: taken,
      marks: [pt(0, 8)],
      text: "One eye left, marked, and one liberty, which are the same point. White can do nothing about it: filling the marked point is suicide, and there is no outside liberty to run to. The group is dead where it stands and comes off the board at the end of the game without another stone being played.",
    },
    {
      type: "info",
      setup: alive,
      marks: [pt(1, 7), pt(3, 7)],
      text: "Back to the living shape, with the two diagonals of the right-hand eye marked instead of the eye. Both of them are White, and that is why the eye holds. Count diagonals before you count eyes: an eye on the edge needs both of its own, an eye in the middle needs three of its four, and an eye in the corner needs the single one it has. A group with one real eye and one of these has one eye, and one eye dies.",
    },
  ],
};
