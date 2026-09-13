import { pt } from "../../positions.js";

/* ----------------------- 2d · life · Six Points That Die (Tier 6) -----------------------
   The first Dan-tier lesson, and it is a proverb being caught lying. "Six
   points of eye space in the corner live" is true of almost every six-point
   shape and false of the one that looks safest: the three-by-two rectangle in
   the corner dies to a placement on the 2-2 point, with no ko and no outside
   liberty to argue about.

   Every claim here came out of an exhaustive search of the eye space, both
   colours to move, run while the lesson was being written:

     white to play first   lives (with (1,1) or (1,0))
     black to play first   dies, and (1,1) is the ONLY move that kills;
                           (0,0), (1,0), (0,1) and (2,1) all let White live
     after black (1,1)     every white resistance loses; against White (1,0)
                           the kill is (0,1), against White (0,1) it is (1,0)

   White's wall in the diagram is a single chain with four liberties, all of
   them inside the eye space, so there is no outside-liberty caveat: the shape
   is dead as it stands. That is the whole point of putting it at 2 dan: a
   player who trusts the proverb here loses the corner and never finds out why. */

const wall = [pt(3, 0), pt(3, 1), pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2)];
const outside = [pt(4, 0), pt(4, 1), pt(4, 2), pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3)];
const six = { w: wall, b: outside };

export default {
  id: "life-and-death-tesuji",
  title: "Six Points That Die",
  subtitle: "The corner shape the proverb gets wrong",
  plain: "A six-point eye space in the corner is normally alive, and the three-by-two rectangle is the exception: one placement on the 2-2 point kills it outright, with no ko and no outside liberties to appeal to. Every other move there lets it live.",
  tier: 6, rank: "2d", track: "life", size: 9,
  prereqs: ["two-eyes", "classic-corner-shapes"], minutes: 9,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: six,
      marks: [pt(0, 0), pt(1, 0), pt(2, 0), pt(0, 1), pt(1, 1), pt(2, 1)],
      text: "Six points of eye space in the corner, three by two, and White's wall is one chain whose only liberties are the marked points. Six points in the corner live, says the proverb, and most of the time it is right: straight six lives, the bent shapes live, the flowered six lives. This one does not, and the difference is a single move.",
    },
    {
      type: "quiz",
      setup: six,
      toPlay: "b",
      answers: [pt(1, 1)],
      text: "Black to play and kill. There is exactly one move.",
      hint: "Not on the edge. Count how White would divide the space into two threes, and stand in the middle of the division.",
      success: "The 2-2 point. Six points only live if they can be split into two pieces each big enough to be an eye, and this placement makes that impossible: whatever White does now, one of the two halves is too small or is not a half at all. Every other move in the space loses, which is why the shape is worth knowing by sight rather than by reading it out every time.",
      refutations: [
        {
          move: pt(1, 0), reply: pt(1, 1),
          text: "The middle of the top row looks like the same idea a line further out, and White simply takes the point you did not: from there the space divides and White has two eyes.",
        },
        {
          move: pt(0, 1), reply: pt(1, 1),
          text: "The 1-2 point is the vital point of several corner shapes and it is not the vital point of this one. White takes the 2-2 and lives.",
        },
      ],
    },
    {
      type: "sequence",
      setup: six,
      toPlay: "b",
      moves: [pt(1, 1), pt(1, 0), pt(0, 1)],
      text: "Play it out against White's best resistance.",
      hint: "Placement on the 2-2 point, White tries to divide along the top, and Black takes the point that stops the left-hand eye.",
      commentary: [
        "The placement.",
        "White's most natural try: split the top row and hope for an eye at each end.",
        "And Black takes the 1-2 point, which is now the move it was not a moment ago. The left-hand half is one point with a black stone beside it and the right-hand half is not big enough on its own. White has no second eye and nothing to make one out of.",
      ],
    },
    {
      type: "choice",
      setup: six,
      toPlay: "w",
      text: "Now the same corner with White to move first, which is the half of the shape a defender needs. Two of these three save the group and one of them does not.",
      options: [
        { point: pt(1, 1), verdict: "best", text: "The same point Black wanted. Taking the vital point of your own shape before the opponent does is the whole of corner life and death, and here it settles the group in one move." },
        { point: pt(1, 0), verdict: "fine", text: "Also alive. The top row divides and there is enough room either side, and it is second best only because it leaves White a shape that has to be read again rather than one that is finished." },
        { point: pt(0, 0), verdict: "poor", text: "The 1-1 point, which feels like it is making an eye and is filling one. White has spent a move and the space left over is a five-point shape with a vital point of its own, which Black takes next." },
      ],
    },
    {
      type: "info",
      setup: six,
      marks: [pt(1, 1)],
      text: "Two things travel out of this corner. The first is the shape: three by two in the corner is dead, and it goes on the same shelf as the square four, next to the shapes you never read out because you recognise them. The second is worth more. A proverb is a summary of the common case, and the cases it summarises away are exactly the ones your opponent has studied. At dan level, knowing a proverb is worth very little and knowing its exceptions is worth the game.",
    },
  ],
};
