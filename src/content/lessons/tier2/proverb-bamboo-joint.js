import { pt } from "../../positions.js";

/* ----------------------- 17k · shape · Do Not Peep at a Bamboo Joint (proverb) -----------------------
   Two black walls with exactly two points between them: the bamboo joint. It
   is the connection that needs no move, because whichever of the two points
   White takes, Black answers on the other and the walls become one chain.

   The engine settles both branches in proverbs.test.js. Either peep leaves
   Black one chain of nine stones with six liberties, and the peep at (4,4)
   leaves White's own stone with a single liberty, which is the part of the
   proverb worth remembering: the move is not merely small, it is a loss. */
const joint = {
  b: [pt(3, 3), pt(4, 3), pt(5, 3), pt(6, 3), pt(3, 5), pt(4, 5), pt(5, 5), pt(6, 5)],
  w: [pt(2, 3), pt(2, 5), pt(3, 2), pt(4, 2), pt(5, 2), pt(3, 6), pt(4, 6), pt(5, 6), pt(2, 4)],
};

const peeped = { b: joint.b, w: [...joint.w, pt(4, 4)] };

export default {
  id: "proverb-bamboo-joint",
  title: "Do Not Peep at a Bamboo Joint",
  subtitle: "A connection that needs no move, and a move that costs the player who makes it",
  plain: "Some shapes are connected already, so poking at them gains nothing and quietly spends something: the ko threat that position would have been later. A forcing move you did not need is a move thrown away.",
  tier: 2, rank: "17k", track: "shape", size: 9, prereqs: ["connect-cut"], minutes: 5,
  author: "Joseki", book: "proverbs",
  steps: [
    {
      type: "maxim",
      setup: joint,
      marks: [pt(3, 4), pt(4, 4)],
      line: "Do not peep at a bamboo joint.",
      analogy: "Knocking at a door that is already bolted. The house does not open, and now everyone inside knows exactly where you are standing.",
      text: "Two black walls with two points between them. The shape is named for the joint in a stalk of bamboo, and it is a connection Black never has to spend a move on: take either of the marked points and Black simply takes the other.",
    },
    {
      type: "quiz",
      setup: peeped,
      toPlay: "b",
      answers: [pt(3, 4)],
      text: "White has peeped anyway. Black to play.",
      success: "Connected. Nine stones in one chain with six liberties, and the stone White just spent is sitting there with one.",
      hint: "Take the other of the two points.",
      refutations: [
        {
          move: pt(7, 4), reply: pt(3, 4),
          text: "Answer somewhere else and the peep turns out to have been a cut after all. White takes the second point and the two walls are separate groups, each having to live on its own.",
        },
      ],
    },
    {
      type: "sequence",
      setup: joint,
      toPlay: "w",
      moves: [pt(4, 4), pt(3, 4)],
      text: "The whole exchange, from the beginning.",
      hint: "White peeps at one point, Black connects at the other.",
      commentary: [
        "White peeps, threatening to cut.",
        "Black connects, and the threat is over before it started. Count what changed: Black spent one stone and is now a single chain, and White spent one stone that has a single liberty and can never do anything again.",
      ],
    },
    {
      type: "info",
      setup: joint,
      text: "The proverb is not really about the shape, which any player learns to see in a week. It is about the habit of playing a move because it looks forcing. A peep here gains nothing on the board and spends something that is not on the board: the position could have been used as a ko threat later, and now it cannot. Strong players call that losing a threat, and they count it.",
    },
  ],
};
