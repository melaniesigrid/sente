import { pt } from "../../positions.js";

/* ----------------------- 17k · life · The Shape of the Space -----------------------
   A group's life is decided by the shape of the space inside it, not by how
   many stones are around it. Four spaces here, each one a white ring whose
   only liberties are the empty points inside, so "dead" means capturable and
   nothing is being argued by analogy.

   Every verdict came out of tools/lessons/search.mjs, which built each ring
   from its eye space and then solved it both ways round:

     three in a row   Black first DEAD, White first lives; one killing point,
                        the middle
     four in a row    alive whoever moves first; no killing point at all
     square four      DEAD whoever moves first, and every one of the four
                        points kills - there is nothing White can do
     bent three       Black first DEAD, White first lives; one killing point,
                        the bend

   The refutation in the quiz was played out too: Black on an end, White in the
   middle captures the stone and comes out with two separate eyes. */

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
  b: [pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2), pt(1, 3), pt(6, 3), pt(1, 4), pt(6, 4),
      pt(1, 5), pt(6, 5), pt(1, 6), pt(6, 6), pt(2, 7), pt(3, 7), pt(4, 7), pt(5, 7)],
  w: [pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3), pt(2, 4), pt(5, 4), pt(2, 5), pt(5, 5),
      pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6)],
};

const bent = {
  b: [pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2), pt(1, 3), pt(6, 3), pt(1, 4), pt(6, 4),
      pt(1, 5), pt(6, 5), pt(2, 6), pt(6, 6), pt(3, 7), pt(4, 7), pt(5, 7)],
  w: [pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3), pt(2, 4), pt(5, 4), pt(2, 5), pt(3, 5),
      pt(5, 5), pt(3, 6), pt(4, 6), pt(5, 6)],
};

export default {
  id: "eye-shapes",
  title: "The Shape of the Space",
  subtitle: "Three dies, four lives, and the square dies anyway",
  tier: 2, rank: "17k", track: "life", size: 9,
  prereqs: ["two-eyes", "false-eye"], minutes: 9,
  author: "Sente",
  steps: [
    {
      type: "info",
      setup: three,
      marks: [pt(3, 4), pt(4, 4), pt(5, 4)],
      text: "White is sealed in, and the three marked points are the only liberties the group has left. One space of three in a row. Whether this group lives has nothing to do with how many stones White has around it — it has already stopped being about stones. It is about whether that space can be made into two eyes, and the answer depends on who moves first.",
    },
    {
      type: "quiz",
      setup: three,
      toPlay: "b",
      answers: [pt(4, 4)],
      text: "Black to play, and kill the group.",
      hint: "If Black plays on an end, White plays in the middle and the space splits in two. Take the point White wants.",
      success: "The middle. White cannot split a space of three into two eyes once the middle is gone, and Black's stone cannot be captured because taking it would fill White's own last liberties.",
      refutations: [
        {
          move: pt(3, 4), reply: pt(4, 4),
          text: "Black on the end, and White takes the middle. That move captures the black stone and leaves two separate points, one on each side — two eyes, and White is alive.",
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
      text: "The same shape one point longer, and everything changes. There is no move here that kills — not one of the four points, whoever plays first. Wherever Black plays, White answers on the other side of it and still has room for two eyes. Three in a row dies to a move in the middle; four in a row has no middle to take.",
    },
    {
      type: "info",
      setup: square,
      marks: [pt(3, 4), pt(4, 4), pt(3, 5), pt(4, 5)],
      text: "Four points again, folded into a square, and now White is dead as it stands. White cannot save it even playing first, and Black does not need to find anything: all four points kill. A square of four has no point that divides it, so every move White makes inside only fills it in. Four points are not enough on their own — they have to be the right four.",
    },
    {
      type: "info",
      setup: bent,
      marks: [pt(4, 4)],
      text: "One more space of three, bent around a corner. It behaves exactly like the straight one: dead if Black plays first, alive if White does, and there is a single point that decides it — the marked one, where the shape turns. So the question to ask of a space is not how big it is but where its centre is. Count the space, find the point that would cut it in two, and that is the vital point for both of you: the move that kills, and the move that lives.",
    },
  ],
};
