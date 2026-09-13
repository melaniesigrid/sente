import { pt } from "../../positions.js";
import { SHAPEUP_SOURCE } from "../../shapeup.js";

/* ----------------------- 12k · shape · The Liberty Problem (Shape Up, ch. 2) -----------------------
   Matthews puts the whole of close-range fighting on three things: liberties,
   eye shape, and connections, and says the quickest way to lose a local fight
   is to take your own liberties by clumsy play. This lesson is the first of
   those three, on the simplest position that makes the point.

   Every number here is the engine's count of the position on screen, re-run by
   `tools/lessons/shapeup.mjs`. The pair starts on three liberties. Extending
   along the line takes it to five; either descent takes it to four and makes an
   empty triangle doing it. White playing the extension point instead leaves the
   pair on two - and so does either descent point, which is why the choice of
   attacking move is about the room and not only about the count.

   This is also the drill the Book of Shapes' empty-triangle article has been
   waiting for: that article argues the shape costs a liberty, and here is the
   position where the liberty is the whole game. */

const pressed = {
  b: [pt(5, 10), pt(6, 10)],
  w: [pt(5, 9), pt(6, 9), pt(4, 10)],
};

const extended = {
  b: [pt(5, 10), pt(6, 10), pt(7, 10)],
  w: [pt(5, 9), pt(6, 9), pt(4, 10)],
};

export default {
  id: "shape-liberty-problem",
  title: "The Liberty Problem",
  subtitle: "Chapter two: the cheapest way to lose a fight",
  plain: "A pair of stones pressed down to three liberties has to add one, and where it adds it decides the fight. Extending along the line buys two liberties and somewhere to go; dropping to the second line buys one and an empty triangle. The rule worth carrying is negative: never fill your own liberties without a reason you can say aloud.",
  tier: 3, rank: "12k", track: "shape", size: 13,
  prereqs: ["shape-table", "liberties"], minutes: 6,
  author: "Joseki", sources: [SHAPEUP_SOURCE], book: "shapeup", series: "shapeup", chapter: 2,
  steps: [
    {
      type: "info",
      setup: pressed,
      marks: [pt(5, 10), pt(6, 10)],
      text: "Two black stones on the third line, capped by two white stones above and blocked by a third on the left. Nothing is captured and nothing is settled, but the pair is down to three liberties, and three is the number at which a group stops being able to argue. Black has to add a stone. Where the stone goes decides whether this is a group or a target.",
    },
    {
      type: "choice",
      setup: pressed,
      toPlay: "b",
      text: "Black to play, for liberties. Three ways to add a stone to the pair.",
      options: [
        { point: pt(7, 10), verdict: "best", text: "Extend along the third line. The chain goes from three liberties to five, and it goes somewhere: the stone faces open board on the right instead of the edge below. Two extra liberties is the most any single stone can add, and this one adds them while moving in the direction Black wants to go anyway." },
        { point: pt(6, 11), verdict: "poor", text: "Descending under the right-hand stone. It adds a liberty, not two: three becomes four. It also makes an empty triangle, which is the shape that tells you a stone has been spent without buying its full share of liberties, and it heads for the second line, where there is nothing to win." },
        { point: pt(5, 11), verdict: "poor", text: "The same mistake one point to the left. Four liberties again, an empty triangle again, and the pair still has nowhere to go. When two moves are both wrong for the same reason, the reason is the thing to remember, not the moves." },
      ],
    },
    {
      type: "count",
      setup: extended,
      question: "Black has extended. How many liberties does the three-stone chain have?",
      answer: 5, tolerance: 0,
      hint: "Walk around the three stones. White holds the two points above the pair and the point on the left.",
      success: "Five. The pair had three, and one stone bought two more - which is the most a stone ever buys, and only because it was played where the room was.",
    },
    {
      type: "info",
      setup: pressed,
      marks: [pt(7, 10)],
      text: "The marked point is the same point for White. Playing it leaves Black on two liberties and takes the room away at the same time, which is what makes it the attacking move rather than one of the descents that also leave two. This is the shape of most close fighting: both sides want the same point, and whoever takes it is adding liberties to one group while removing the other's room to breathe. The rule to carry out of here is the negative one, because it is the one that costs games. Do not fill your own liberties without a reason you can say out loud.",
    },
  ],
};
