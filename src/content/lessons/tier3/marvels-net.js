import { pt } from "../../positions.js";
import { MARVELS_SOURCE } from "../../marvels.js";

/* ----------------------- 13k · tactics · The Net (Marvels, technique 1) -----------------------
   The sequel to `fundamentals-ladder`. The ladder lesson ends on Kageyama's
   warning — if you cannot read it to the last move, do not start it — and
   leaves the reader with a real problem: a cutting stone they cannot ladder is
   still a cutting stone. The net is the answer, and it is the oldest technique
   in the Gateway's catalogue that a 13 kyu can use the same afternoon.

   Everything below was searched with the engine, not drawn by hand. In this
   shape the net at (4,5) is the *only* black move that holds White: an
   exhaustive scan of every legal black move found one, and it is not a contact
   move. Both ataris were checked and both fail — after either one White has two
   liberties and is no longer catchable. The two escape lines were replayed move
   by move and each leaves White on a single liberty. */

const cut = {
  b: [pt(2, 3), pt(3, 3), pt(4, 3), pt(2, 4), pt(2, 5)],
  w: [pt(3, 4)],
};

const net = {
  b: [pt(2, 3), pt(3, 3), pt(4, 3), pt(2, 4), pt(2, 5), pt(4, 5)],
  w: [pt(3, 4)],
};

const ranRight = {
  b: [pt(2, 3), pt(3, 3), pt(4, 3), pt(2, 4), pt(2, 5), pt(4, 5), pt(5, 4)],
  w: [pt(3, 4), pt(4, 4)],
};

export default {
  id: "marvels-net",
  title: "The Net",
  subtitle: "What to do with a stone you cannot ladder",
  tier: 3, rank: "13k", track: "tactics", size: 9,
  prereqs: ["fundamentals-ladder"], minutes: 7,
  author: "Sente", sources: [MARVELS_SOURCE], series: "marvels", chapter: 1,
  steps: [
    {
      type: "info",
      setup: cut,
      marks: [pt(4, 4), pt(3, 5)],
      text: "One white stone has cut under a black wall. It has two liberties, both marked, and both of them lead out into an empty board. The ladder is no help here: a ladder needs a black stone waiting on the diagonal, and there is none. Play either atari and White simply walks away from it.",
    },
    {
      type: "quiz",
      setup: cut,
      toPlay: "b",
      answers: [pt(4, 5)],
      text: "Black to play, and catch the white stone. The move does not touch it.",
      hint: "Stop trying to take a liberty. Take the two points White would need after it runs, and let it keep both liberties for now.",
      success: "The net. Black stands one point diagonally clear of the cutting stone and covers both escapes at once. White still has two liberties and is already caught.",
      refutations: [
        {
          move: pt(4, 4), reply: pt(3, 5),
          text: "Atari from the right, and White steps down instead. Two liberties again, heading into open board, and now Black has spent a stone helping it get there.",
        },
        {
          move: pt(3, 5), reply: pt(4, 4),
          text: "Atari from below, and White steps right. Same story the other way round: an atari that is answered is a question you have taught your opponent to expect.",
        },
      ],
    },
    {
      type: "sequence",
      setup: net,
      toPlay: "w",
      moves: [pt(4, 4), pt(5, 4)],
      text: "White tries the right-hand liberty. Black to answer.",
      hint: "Stand in front of it again. The net stone behind is already doing the other half of the work.",
      commentary: [
        "White runs right. Two white stones now, and the net stone sits under them rather than against them.",
        "Black blocks in front. The two white stones have one liberty left, and the net stone is what took the rest.",
      ],
    },
    {
      type: "sequence",
      setup: net,
      toPlay: "w",
      moves: [pt(3, 5), pt(3, 6)],
      text: "Back to the net, and this time White tries downwards instead.",
      hint: "The same answer, turned ninety degrees.",
      commentary: [
        "White runs down, between the wall and the net stone.",
        "Black blocks underneath, and again White is on one liberty. Neither escape was ever open — that is what a net is.",
      ],
    },
    {
      type: "info",
      setup: ranRight,
      marks: [pt(4, 5)],
      text: "This is where the first escape ends: White on one liberty, and every black stone in the picture doing a job. Compare it with a ladder, which spends fifteen moves and collapses entirely if one enemy stone stands anywhere along the staircase. A net commits three or four moves and cannot be broken from a distance, because there is no distance in it.",
    },
    {
      type: "info",
      setup: net,
      marks: [pt(4, 5)],
      text: "The Gateway to All Marvels gives its problems names, and the habit is worth stealing. A technique with a name is one you can go looking for: next time a cut will not ladder, the question is no longer whether the stone can be caught but whether the net point is open. Look one point diagonally clear of the cutting stone, on the side it wants to run to.",
    },
  ],
};
