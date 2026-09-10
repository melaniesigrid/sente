import { pt } from "../../positions.js";

/* ----------------------- 19k · tactics · If You Do Not Know Ladders (proverb) -----------------------
   The library promised ladders in the tactics track and had no lesson for
   them. This is it, and the whole thing is machine-checked: proverbs.test.js
   runs a ladder solver over these positions. Black ataris, White extends to
   its only liberty, and the solver reports whether the chase ends in a
   capture.

   From this position the ladder captures in eleven moves. Put a white stone
   anywhere on the diagonal it travels — (7,7), (6,7), (7,6) — and the solver
   says the chase fails; put one off the path at (8,8) and it still works.
   That is the proverb, stated as something the engine can check. */
const start = {
  b: [pt(4, 5), pt(5, 4), pt(4, 6)],
  w: [pt(5, 5)],
};

/* The same position with a white stone waiting where the ladder must pass. */
const broken = { b: start.b, w: [...start.w, pt(7, 7)] };

export default {
  id: "proverb-ladder",
  title: "If You Do Not Know Ladders",
  subtitle: "The staircase capture, and the one stone that makes it a disaster",
  tier: 2, rank: "19k", track: "tactics", size: 9, prereqs: ["atari-escape"], minutes: 7,
  author: "Sente", book: "proverbs",
  steps: [
    {
      type: "maxim",
      setup: start,
      marks: [pt(6, 5), pt(5, 6)],
      line: "If you do not know ladders, do not play go.",
      analogy: "Reading a ladder is reading twenty moves ahead in a straight line. It is the cheapest twenty moves you will ever read, and the game gives them away free.",
      text: "One white stone with two liberties, both marked. Black can put it in atari from either side, and only one of them starts a staircase that never lets go.",
    },
    {
      type: "quiz",
      setup: start,
      toPlay: "b",
      answers: [pt(6, 5)],
      text: "Black to play. Start the ladder.",
      success: "The atari from the outside. White has one liberty and must run, and every step it runs Black is waiting.",
      hint: "Atari from the side that pushes White toward the edge, not toward the open board.",
      refutations: [
        {
          move: pt(5, 6), reply: pt(6, 5),
          text: "This ataris too, and White steps out with three liberties into the widest part of the board. Nothing is chasing it now.",
        },
      ],
    },
    {
      type: "sequence",
      setup: start,
      toPlay: "b",
      moves: [pt(6, 5), pt(5, 6), pt(5, 7), pt(6, 6), pt(7, 6), pt(6, 7)],
      text: "Play the staircase.",
      hint: "Atari, let White extend, then atari again from the same side.",
      commentary: [
        "Atari. White has one liberty left.",
        "White extends, and has two again.",
        "Atari from the same side. This is the whole method: never let it have three.",
        "White extends.",
        "Atari.",
        "White extends, and the staircase keeps going down and to the right. Five more moves like this and the edge of the board arrives, where there is no next liberty. The engine plays it out and counts the capture at move eleven.",
      ],
    },
    {
      type: "info",
      setup: broken,
      marks: [pt(7, 7)],
      text: "Now the same position with one white stone added, far away, on the diagonal the staircase has to travel. Play the identical sequence and White reaches its own stone, joins it, and comes out with liberties to spare. The ladder does not just fail, it fails after Black has spent five stones pushing White through Black's own area. A ladder that does not work is one of the worst things in the game.",
    },
    {
      type: "info",
      setup: broken,
      text: "So the proverb, which is blunt for a reason. Before you start a ladder, look all the way along it to the edge of the board and check that nothing of your opponent's is standing in the way. A stone off the path changes nothing; a stone on the path changes everything. That is the whole reading, and it is a straight line, so there is no excuse for not doing it.",
    },
  ],
};
