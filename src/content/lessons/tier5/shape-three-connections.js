import { pt } from "../../positions.js";
import { shapeByKey } from "../../shapes.js";

/* ----------------------- 4k · shape · The Three Connections (Book of Shapes) -----------------------
   One cutting point, three legal answers, three different prices. The lesson
   exists because most players have a favourite connection and play it without
   noticing that they chose.

   The base is three black stones — (3,3), (4,3), (3,5) — from which all three
   connections are a single legal move: solid at (3,4), the bamboo joint at
   (4,5), the tiger's mouth at (2,4). Every number below came from `chainAt`
   and `shapes.test.js` takes them again:

     solid   one chain of four, nine liberties, nothing left to cut
     bamboo  two chains of two, six liberties each, ten between them,
             and a white stone at either gap has two liberties and dies
     tiger   three separate chains, of six, four and four liberties, and a
             white stone in the mouth has one liberty and dies

   Ten beats nine, which is the part players get wrong: liberties spread over
   two chains do not win a capturing race, because a race captures chains. */

const article = shapeByKey("connections");

const base = { b: [pt(3, 3), pt(4, 3), pt(3, 5)] };
const solid = { b: [...base.b, pt(3, 4)] };
const bamboo = { b: [...base.b, pt(4, 5)] };

export default {
  id: "shape-three-connections",
  title: "The Three Connections",
  subtitle: "Solid, bamboo, tiger: one cutting point and three different bills",
  plain: "A cutting point can be answered solidly, with a bamboo joint or with a tiger's mouth. They buy liberties, shape and an eye respectively, and they cost a slow move, two points of board and a free forcing move. The error is not picking wrong, it is not noticing there was a pick.",
  tier: 5, rank: "4k", track: "shape", size: 9,
  prereqs: ["shape-tigers-mouth", "proverb-bamboo-joint"], minutes: 8,
  author: "Joseki", book: "shapes",
  steps: [
    {
      type: "maxim",
      setup: base,
      marks: [pt(3, 4), pt(4, 5), pt(2, 4)],
      line: article.proverb,
      analogy: "Three doors out of the same room. Players who have stopped improving are usually the ones who take the same door every time without looking at the other two.",
      text: "Three black stones with one place White would like to play. Each of the three marked points joins them up, all three are legal right now, and they are not variations of one move: they are three different purchases.",
    },
    {
      type: "count",
      setup: solid,
      question: "Black has connected solidly. How many liberties does the chain have?",
      answer: 9, tolerance: 0,
      hint: "Four stones, one chain, and no liberty counted twice.",
      success: "Nine, in one chain, and there is nothing left on the board to cut. That is what solid buys: liberties that all belong to the same group, and the end of the conversation. What it costs is a move that did nothing except be safe — no eye, no reach, no ground.",
      wrongText: "Walk the outside of the four stones and count the empty points touching them, taking each point once.",
    },
    {
      type: "count",
      setup: bamboo,
      question: "Rewind, and let Black play the bamboo joint instead. How many liberties do the two chains have between them, counting each empty point once?",
      answer: 10, tolerance: 0,
      hint: "Six for the top pair and six for the bottom, and two of the points belong to both.",
      success: "Ten, which is more than the solid connection got, and it is worth less. A capturing race captures chains, not groups, and this is two chains of six rather than one chain of nine. What the bamboo joint does buy is a shape with no cutting point in it at all — White at either gap has two liberties and dies — and a foot pointing in two directions at once.",
      wrongText: "Count each pair's liberties, then take away the ones you counted twice: the two points in the middle touch both pairs.",
    },
    {
      type: "choice",
      setup: base,
      toPlay: "b",
      text: "Now the context, which is the only thing that decides it. Suppose Black expects a capturing race here within the next few moves and has no eye trouble. Which of the three?",
      options: [
        { point: pt(3, 4), verdict: "best", text: "Solid. In a race, one chain of nine beats two of six and beats three chains of six, four and four. It is the slow move and a race is exactly the situation that pays for slow." },
        { point: pt(4, 5), verdict: "fine", text: "The bamboo joint, and in almost any other situation it would be the shapely answer: ten liberties, no cutting point, and it faces two ways. In a race it is second best because the ten liberties are split across two chains, and White only has to kill one of them." },
        { point: pt(2, 4), verdict: "poor", text: "The tiger's mouth. It leaves three separate chains, the biggest with six liberties, and it hands White a throw-in to bank as a ko threat. It is the right move when you need an eye. You said you did not." },
      ],
    },
    {
      type: "info",
      setup: base,
      marks: [pt(3, 4), pt(4, 5), pt(2, 4)],
      text: `${article.costs} ${article.breaks}`,
    },
  ],
};
