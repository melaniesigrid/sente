import { pt } from "../../positions.js";

/* ----------------------- 16k · shape · Connections That Hold -----------------------
   Stones do not have to touch to be joined, but not every gap is a joint. This
   lesson is three shapes and one question asked of each: if White plays in the
   gap, what happens?

   Each answer is a direct reading off the engine rather than a search verdict,
   which matters — the connection solver returns "safe" when it runs out of
   depth, so a shape it cannot cut in six plies is not thereby proved sound.
   These three are proved by what the board actually does:

     tiger's mouth  White in the mouth has exactly one liberty; one black move
                      takes it off
     bamboo joint   White takes either gap, Black takes the other, and the four
                      stones become one chain of five with four liberties -
                      checked both ways round, and with White packed down both
                      sides so there is nowhere else to look
     one-point jump  with White on all four diagonals, White's cut is legal and
                      has two liberties, and it leaves the two black stones as
                      separate chains of one liberty each

   So the jump is a connection in open space and a promise White can break once
   it has stones on both sides. The bamboo joint is not breakable at all. */

const mouth = {
  b: [pt(4, 3), pt(3, 4), pt(5, 4)],
};

const bamboo = {
  b: [pt(3, 3), pt(4, 3), pt(3, 5), pt(4, 5)],
  w: [pt(2, 2), pt(5, 2), pt(2, 3), pt(5, 3), pt(2, 4), pt(5, 4), pt(2, 5), pt(5, 5),
      pt(2, 6), pt(5, 6)],
};

const jump = {
  b: [pt(3, 4), pt(5, 4)],
  w: [pt(3, 3), pt(5, 3), pt(3, 5), pt(5, 5)],
};

const jumpCut = {
  b: [pt(3, 4), pt(5, 4)],
  w: [pt(3, 3), pt(5, 3), pt(3, 5), pt(5, 5), pt(4, 4)],
};

export default {
  id: "tigers-mouth",
  title: "Connections That Hold",
  subtitle: "Three gaps, and what happens if White plays in them",
  tier: 2, rank: "16k", track: "shape", size: 9,
  prereqs: ["connect-cut", "atari-escape"], minutes: 8,
  author: "Sente",
  steps: [
    {
      type: "info",
      setup: mouth,
      marks: [pt(4, 4)],
      text: "Three black stones around an empty point. They are not joined to each other — there are three separate stones on the board — and yet the marked point between them is not a gap White can use. It is called a tiger's mouth, and the reason for the name is what happens to anything that goes into it.",
    },
    {
      type: "sequence",
      setup: mouth,
      toPlay: "w",
      moves: [pt(4, 4), pt(4, 5)],
      text: "Let White try it.",
      hint: "White plays the mouth. Count its liberties before you answer.",
      commentary: [
        "White plays between the three stones. The stone has one liberty, below it, and that is all it will ever have.",
        "Black takes the liberty and the stone is gone. Nothing can live in a tiger's mouth, which is why Black never has to spend a move filling it.",
      ],
    },
    {
      type: "info",
      setup: bamboo,
      marks: [pt(3, 4), pt(4, 4)],
      text: "A different shape: two pairs of black stones with two marked points between them, and White pressing down both sides. This is a bamboo joint. It looks looser than the tiger's mouth — two gaps instead of one — and it is the more reliable of the two.",
    },
    {
      type: "sequence",
      setup: bamboo,
      toPlay: "w",
      moves: [pt(3, 4), pt(4, 4)],
      text: "White tries to cut it.",
      hint: "White can only take one of the two points in a turn. Take the other one.",
      commentary: [
        "White plays one of the two points.",
        "Black plays the other, and the four stones are one chain of five with four liberties. The other order is the same position: two gaps, one move each turn, and Black always has the second one. A bamboo joint cannot be cut at all.",
      ],
    },
    {
      type: "info",
      setup: jump,
      marks: [pt(4, 4)],
      text: "Now the shape most players trust too far. Two black stones one point apart, with White sitting on all four diagonals. In open space this jump is a perfectly good connection — White has nothing to play. Here White has stones on both sides of the gap, and that changes what the gap is.",
    },
    {
      type: "info",
      setup: jumpCut,
      marks: [pt(3, 4), pt(5, 4)],
      text: "White plays the gap, and the move is legal: the cutting stone has two liberties of its own, above and below. The two marked black stones are now two separate chains with one liberty each, both in atari, and Black cannot save them both. The difference between this and the bamboo joint is not how far apart the stones are but how many answers Black has. One gap with an answer is a connection. One gap without one is a cutting point you have not noticed yet.",
    },
  ],
};
