import { pt } from "../../positions.js";

/* ----------------------- 2d · judgement · Cash Against Paper (Tier 6) -----------------------
   Amashi: let the opponent build something enormous, take real points while
   they do it, and then take the top off the enormous thing without ever going
   inside it. It is the hardest strategy to play well because it requires
   being behind on the board and knowing you are not behind on the count, and
   it is the strategy every strong player loses to at least once while learning
   what a framework is actually worth.

   No number in this lesson is stated as measured, because none of them can be:
   the engine scores finished boards and this board is not finished. What is
   verified is what the verifier verifies — that the sketch is a legal
   position and that every option offered is a legal move — and the reasoning
   is the author's, set out so a reader can disagree with it.

   The board is deliberately extreme: four corners of cash against one vast
   centre-facing framework. Real games are milder and the judgement is the
   same. */

const board = {
  b: [pt(3, 3), pt(16, 3), pt(3, 16), pt(16, 16), pt(13, 2), pt(2, 13)],
  w: [pt(9, 3), pt(3, 9), pt(9, 9), pt(9, 15), pt(15, 9), pt(6, 6), pt(12, 12)],
};

const reduced = {
  b: [...board.b, pt(9, 6), pt(6, 12)],
  w: [...board.w, pt(9, 7), pt(6, 11)],
};

export default {
  id: "thickness-into-points",
  title: "Cash Against Paper",
  subtitle: "Letting them build it, and then taking the roof off",
  plain: "A framework is not territory until somebody fails to reduce it. Taking secure corners while the opponent builds a huge centre is a winning plan, but only if you reduce from outside at the right moment and accept a smaller, certain result instead of a larger, risky one.",
  tier: 6, rank: "2d", track: "judgement", size: 19,
  prereqs: ["classic-territory", "classic-feelings"], minutes: 10,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: board,
      marks: [pt(9, 9)],
      text: "Black has four corners and they are real: nothing in them can be killed and nothing in them needs another move. White has a framework covering most of the middle of the board, and it is not real at all — not one point of it is territory yet. Most players holding Black here feel behind, because White's position is large and visible and Black's is small and finished. Feeling behind is the mistake this lesson is about.",
    },
    {
      type: "choice",
      setup: board,
      toPlay: "b",
      text: "Black to play. The framework has to be dealt with. How?",
      options: [
        { point: pt(9, 6), verdict: "best", text: "Stand on the boundary and lean in from above. From here Black is never in danger, every exchange takes a row off the top of the framework, and Black keeps the initiative to go and do the same thing on the other side. This is the whole of the strategy: reduce, do not invade, and be satisfied with taking less than you could have if nothing went wrong." },
        { point: pt(9, 12), verdict: "poor", text: "Straight into the middle of it, because the middle looks empty. It is empty and it is also surrounded on four sides. White does not have to kill this stone to win the exchange: White chases it, and every move Black spends running turns another part of the framework into real points. A living invasion here that costs White fifteen moves of wall-building is a loss." },
        { point: pt(6, 11), verdict: "fine", text: "Reduce from the other side instead. Also correct, also safe, and second best only because the upper boundary is where White's framework is widest and least defended today. There is no wrong side here, only an order." },
      ],
    },
    {
      type: "sequence",
      setup: board,
      toPlay: "b",
      moves: [pt(9, 6), pt(9, 7), pt(6, 11), pt(6, 12)],
      text: "Play the plan out: lean on the top, then do the same on the left.",
      hint: "Black stands on the upper boundary, White pushes back underneath, and Black repeats the idea on the other flank.",
      commentary: [
        "Black stands on the top boundary of the framework, out of reach of anything.",
        "White pushes underneath, which is the right answer and is also an admission: White has just spent a move confirming a border rather than building one.",
        "Black does it again on the other side. Note that Black has still not entered anything, has still not made a group that needs to live, and has still not given White a target.",
        "White pushes again. Look at what the four moves did. White's framework is smaller by two rows and is now much closer to being real territory — which is the trade — and Black's corners are exactly as large as they were, because nothing has happened to them. Whether that trade is good is a counting question, and counting it is the skill this lesson is really teaching.",
      ],
    },
    {
      type: "choice",
      setup: reduced,
      toPlay: "b",
      text: "Two more rows have come off. Black is still holding four corners. The framework is smaller and much harder. What now?",
      options: [
        { point: pt(2, 6), verdict: "best", text: "Stop. Take the biggest remaining point on the edge, count the board, and play an ordinary game from here. The reduction did its work and the next move into the middle is the first one that would be an invasion. Knowing when to stop reducing is the part of this strategy that cannot be taught by a diagram, only by losing a few games to it." },
        { point: pt(9, 10), verdict: "poor", text: "One more push, deeper, because the previous two went so well. They went well because they were safe. This one is inside, it is chaseable, and it hands White the thing White has been missing all game: a weak black group to attack while the framework closes around it." },
        { point: pt(12, 15), verdict: "fine", text: "Slide along the lower boundary. Sound, and smaller than the left edge. A reasonable move played in the wrong order, which at dan level is the usual kind of mistake." },
      ],
    },
    {
      type: "info",
      setup: reduced,
      text: "Amashi is not a trick and it is not cowardice, it is an accounting position. You are saying that the opponent's paper will not all become money, and you are undertaking to prove it by reducing from outside rather than by gambling inside. Two things make it fail. The first is greed — one push too many, the invasion that was not necessary. The second is not counting, because the whole strategy is a claim about numbers and a player who never counts is holding an opinion rather than a plan. Count the board before the framework closes, not after.",
    },
  ],
};
