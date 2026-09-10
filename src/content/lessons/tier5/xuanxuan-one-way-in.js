import { pt } from "../../positions.js";
import { XUANXUAN_SOURCE } from "../../xuanxuan.js";

/* ----------------------- 2k · life · One Way In, Three Ways Out (Xuanxuan Qijing) -----------------------
   The same dead shape as xuanxuan-five-points, handed to the other player.
   The solver settles both sides of it and they are not symmetrical:

     Black to play and kill   exactly one move works, (2,1)
     White to play and live   three moves work, (2,1), (3,1) and (2,2)

   That asymmetry is worth a lesson on its own. The common proverb says the
   opponent's key point is your key point, and here that is only a third true:
   the defender has slack the attacker does not. Both lists come out of the
   solver in xuanxuan.test.js rather than out of anyone's memory, which is how
   the missing two were noticed in the first place. */
const OUTSIDE = [pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3), pt(6, 3), pt(6, 0), pt(6, 1), pt(6, 2)];

const bulky = {
  w: [pt(0, 0), pt(1, 0), pt(2, 0), pt(3, 0), pt(4, 0), pt(5, 0), pt(0, 1), pt(5, 1),
      pt(0, 2), pt(1, 2), pt(3, 2), pt(4, 2), pt(5, 2)],
  b: OUTSIDE,
};

export default {
  id: "xuanxuan-one-way-in",
  title: "One Way In, Three Ways Out",
  subtitle: "The attacker must be exact; the defender does not have to be",
  plain: "Killing and living are not mirror images. In this shape Black has exactly one move that kills and White has three that live, so the attacker has to find the point while the defender only has to avoid blundering.",
  tier: 5, rank: "2k", track: "life", size: 9, prereqs: ["xuanxuan-five-points"], minutes: 7,
  author: "Joseki", sources: [XUANXUAN_SOURCE], book: "xuanxuan",
  steps: [
    {
      type: "info",
      setup: bulky,
      marks: [pt(1, 1), pt(2, 1), pt(3, 1), pt(4, 1), pt(2, 2)],
      text: "The shape from the last lesson, and this time it is White to play. Black kills it with one move and one move only. The question worth asking is whether White's saving move is that same point, because a well-known proverb says it should be.",
    },
    {
      type: "quiz",
      setup: bulky,
      toPlay: "w",
      answers: [pt(2, 1), pt(3, 1), pt(2, 2)],
      text: "White to play and live.",
      success: "That lives. So do two others: the solver finds three moves here that save White, and only one that saves Black the trouble of finding them.",
      hint: "Anything that keeps the space from folding into a single eye will do. There is more than one.",
      refutations: [
        {
          move: pt(1, 1), reply: pt(2, 1),
          text: "This end of the row is the wrong end. Black takes the point above the foot and the group is dead exactly as before.",
        },
        {
          move: pt(4, 1), reply: pt(2, 1),
          text: "The far end does not touch the problem. Black plays the one killing point and White has one eye.",
        },
      ],
    },
    {
      type: "info",
      setup: bulky,
      marks: [pt(2, 1), pt(3, 1), pt(2, 2)],
      text: "The three marked points all save White. Only one of the five kills for Black. So the proverb is a third right: the killing point is among the living points, but it is not the only one, and a defender who reaches for any of the three is fine while an attacker who is off by a single line has thrown the group away.",
    },
    {
      type: "info",
      setup: bulky,
      text: "That is the honest shape of most life and death, and it is why a collection of four hundred problems exists at all. Defending is a matter of not blundering. Attacking is a matter of finding the one point, and the one point is rarely where the eye first lands. When you are the one who has to kill, count the shape before you touch it, because you will not get a second attempt.",
    },
  ],
};
