import { pt } from "../../positions.js";

/* ----------------------- 11k · life · Where the Sixth Stone Goes (Tier 3) -----------------------
   The defender's half of the same argument. Five white stones in the corner,
   three points of space, and White to play: one of the three moves lives and
   the other two lose the group. Solved with tools/lessons/eyes.mjs, which
   answered the question from both sides at once:

     as it stands   Black first DEAD (the only killing point is (3,8)),
                      White first alive. Not ko-sensitive
     white (3,8)    ALIVE. Two eyes at (0,8) and (2,8), and the search
                      confirms both are illegal for Black: suicide, both
     white (2,8)    still dead. The space divides into (0,8), which is an eye,
                      and (3,8), which touches the black wall and is not
     white (0,8)    still dead. Filling the corner spends the one point that
                      was already an eye and leaves two points in a row

   Both sides want the same point, which is the lesson. The move that kills a
   shape and the move that saves it are usually one move, and whoever plays
   there first owns the corner. */

const wall = [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(4, 6), pt(4, 7), pt(4, 8)];
const white = [pt(0, 7), pt(1, 7), pt(2, 7), pt(3, 7), pt(1, 8)];

const five = { b: wall, w: white };
const alive = { b: wall, w: [...white, pt(3, 8)] };

export default {
  id: "life-corner-live",
  title: "Where the Sixth Stone Goes",
  subtitle: "Three points of space and only one way to divide them",
  plain: "A group with three points of space lives only if it can split them into two eyes, and usually there is a single point that does it. That point is the same one the attacker wants, so the move that saves a corner and the move that kills it are one move, and it is settled by whoever plays first.",
  tier: 3, rank: "11k", track: "life", size: 9,
  prereqs: ["life-false-eye", "life-eye-space"], minutes: 7,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: five,
      marks: [pt(0, 8), pt(2, 8), pt(3, 8)],
      text: "Five white stones shut into the corner, with three marked points of space along the edge. Three points is the size that dies to a move in the middle, so White cannot simply wait. But White is the one to play here, and a space of three that you fill in yourself, in the right place, is not three points any more: it is two eyes with a stone between them.",
    },
    {
      type: "choice",
      setup: five,
      toPlay: "w",
      text: "White to play and live. Three points, three moves, and only one of them is a living group.",
      options: [
        {
          point: pt(3, 8), verdict: "best",
          text: "The far point, next to the black wall. It is the one point of the three that could never have become an eye, because the wall is already touching it, and spending it leaves two separate holes behind: the corner and the point beside it. Two eyes, and Black may not play in either.",
        },
        {
          point: pt(2, 8), verdict: "poor",
          text: "The middle. It does divide the space, but it divides it into an eye in the corner and one point that touches the black wall, and a point touching the enemy is not an eye. One eye, and the group dies.",
        },
        {
          point: pt(0, 8), verdict: "poor",
          text: "The corner. This is the point that was already an eye, and filling it in leaves two points in a row, which is not enough to divide again. White has spent a move to go from three points to two and is still dead.",
        },
      ],
    },
    {
      type: "info",
      setup: alive,
      marks: [pt(0, 8), pt(2, 8)],
      text: "The living shape, with its two eyes marked. Test them the way the false-eye lesson taught: each is surrounded by white stones of one group, so Black playing in either would be suicide, and the diagonals belong to White. Six stones in the corner, two of them on the edge, with a gap between: that is the shape to remember, and the reason it is worth remembering is that it costs one move to reach from the shape before it.",
    },
    {
      type: "quiz",
      setup: five,
      toPlay: "b",
      answers: [pt(3, 8)],
      text: "The same corner, and now Black plays first. Kill it.",
      hint: "Play the move White wanted. If you cannot see which that is, ask which of the three points White would have been happy to spend.",
      success: "The same point, from the other side. Black takes the point that would have divided the space, and what is left cannot be cut into two eyes by anything White plays. One move decided the corner and both players were looking at it.",
    },
    {
      type: "info",
      setup: five,
      marks: [pt(3, 8)],
      text: "This is why life and death is worth studying from both chairs. You are not learning a list of dead groups; you are learning to find the point a shape turns on, and then it does not matter much which colour you are holding. Find the point first, and decide afterwards whether you are taking it or defending it.",
    },
  ],
};
