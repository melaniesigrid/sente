import { pt } from "../../positions.js";

/* ----------------------- 6k · life · The Stone You Give Away (Tier 4) -----------------------
   A throw-in: a killing move that is in atari the moment it lands, offered so
   that the capture ruins the shape that made it.

   The position was not drawn. It came out of an exhaustive search over corner
   positions with stones of both colours inside, filtered for exactly one
   killing move whose chain has exactly one liberty, and then solved:

     white   6 stones, liberties (3,7) and (2,8), no eye yet
     black   two stones inside, (1,7) and (0,8), both in atari, both lost by
               any ordinary reckoning
     black first kills, white first lives, and the verdict is not ko-sensitive
     of the four points Black can play, (1,8) is the only one that kills:
               (3,7), (2,8) and (3,8) all let White live
     after the throw-in, every white reply loses. The capture at (2,8) takes
               three black stones and White is still dead
     and then (1,8) again: the same point, now the middle of a bent three,
               and the placement that was a sacrifice is the placement that kills

   The lesson's sequence is the whole line, replayed by the verifier on every
   npm test. */

const wall = [pt(0, 5), pt(1, 5), pt(2, 5), pt(3, 5), pt(4, 5), pt(4, 6), pt(4, 7), pt(4, 8)];

const start = {
  b: [...wall, pt(1, 7), pt(0, 8)],
  w: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(0, 7), pt(2, 7)],
};

const after = {
  b: [...wall, pt(1, 8)],
  w: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(0, 7), pt(2, 7), pt(2, 8)],
};

export default {
  id: "life-throw-in",
  title: "The Stone You Give Away",
  subtitle: "A sacrifice, a capture, and the same point played twice",
  plain: "A throw-in is a stone played where it can be captured at once, so that capturing it fills the space the defender needed. Here two black stones that look lost are the answer: give them up, let White take three, and then play the same point again to kill.",
  tier: 4, rank: "6k", track: "life", size: 9,
  prereqs: ["life-eye-space", "life-big-eye"], minutes: 9,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: start,
      marks: [pt(1, 7), pt(0, 8)],
      text: "A corner in the middle of a fight. White is not settled: six stones, two liberties, no eye yet. Black has two stones inside, both marked, and both are in atari, which normally means they are somebody else's stones already. Read the position as it stands and White looks fine. The two lost stones are the reason she is not.",
    },
    {
      type: "quiz",
      setup: start,
      toPlay: "b",
      answers: [pt(1, 8)],
      text: "Black to play and kill. Four points are open and one of them works.",
      hint: "Do not save the stones inside. Add to them, on the point where the new stone has no liberties of its own to speak of.",
      success: "The throw-in. It joins the two stones into a chain of three with a single liberty, offered to White with both hands, and the offer is the move: White has nothing better to do than accept, and accepting is what kills her.",
    },
    {
      type: "sequence",
      setup: start,
      toPlay: "b",
      moves: [pt(1, 8), pt(2, 8), pt(1, 8)],
      text: "Play it out: the throw-in, the capture, and the move after the capture.",
      hint: "When White takes the three stones, look at the space she is left with rather than at the stones she gained.",
      commentary: [
        "The throw-in. Three black stones now, one liberty, and White to play.",
        "White takes them. Three stones for nothing, a capture any player would make, and it is the losing move. Her stone at the capture point has filled the one place that could have divided the corner.",
        "Black plays the same point again. What is left of White's space is three points bent round a corner, and this is the bend: the shape from Tier 2 that dies to a move in the middle. Nothing White plays now makes two eyes.",
      ],
      success: "Three stones given away and the corner taken. Count the trade at the end rather than in the middle: the three stones are worth three points and the corner is worth the group.",
    },
    {
      type: "info",
      setup: after,
      text: "The corner afterwards. White has more stones than she started with, more liberties than she started with, and no way to make a second eye. This is what a sacrifice is for: not to save the stones, and not even to gain stones, but to take away the one point the opponent needed while she is busy being pleased about a capture.",
    },
    {
      type: "info",
      setup: start,
      marks: [pt(1, 8)],
      text: "One point, played twice, and it worked for two different reasons: the first time because it could be captured, the second time because it was the middle of a three. That is the habit to build from here. When a placement does not quite work, ask what the position would look like if your opponent captured something, and then ask whether you would like the shape she is left with.",
    },
  ],
};
