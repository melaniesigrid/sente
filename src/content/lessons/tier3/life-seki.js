import { pt } from "../../positions.js";

/* ----------------------- 12k · life · The Standoff (Tier 3) -----------------------
   Alive without eyes, which the two-eyes lesson did not leave room for. Two
   groups, four stones and six, locked together with two liberties each and no
   eye anywhere, and neither side can do anything about it.

   Checked with tools/lessons/eyes.mjs and the engine directly:

     white   6 stones, liberties (1,7) and (2,7)
     black   4 stones inside, liberties (1,7) and (2,7): the same two
     black cannot kill White inside that region, and White cannot kill Black
     every move either player makes on a shared liberty loses their own group:
       Black (1,7) leaves five black stones with one liberty, and White (2,7)
       takes all five. The mirror is exactly as bad for White

   And the count: territoryMap calls both shared points `neutral`, which is the
   engine agreeing with the rule. Nobody owns the inside of a seki. */

const wall = [pt(0, 5), pt(1, 5), pt(2, 5), pt(3, 5), pt(4, 5), pt(4, 6), pt(4, 7), pt(4, 8)];

const seki = {
  b: [...wall, pt(0, 7), pt(0, 8), pt(1, 8), pt(2, 8)],
  w: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(3, 7), pt(3, 8)],
};

const punished = {
  b: wall,
  w: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(2, 7), pt(3, 7), pt(3, 8)],
};

export default {
  id: "life-seki",
  title: "The Standoff",
  subtitle: "Two groups alive without a single eye between them",
  plain: "A group can live without eyes if filling its last liberties would cost the attacker more than it gains. Both groups share the same two points, neither can play there, and the position stands to the end of the game with the shared points belonging to nobody.",
  tier: 3, rank: "12k", track: "life", size: 9,
  prereqs: ["life-eye-space"], minutes: 7,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: seki,
      marks: [pt(1, 7), pt(2, 7)],
      text: "Six white stones and four black ones, locked together in the corner, and not one eye anywhere. Both groups are down to two liberties, and the two marked points are those liberties: for both of them, the same two points. Everything you have learned so far says one of these groups is about to die. Neither of them is.",
    },
    {
      type: "count",
      setup: seki,
      question: "How many liberties does the white group have?",
      answer: 2, tolerance: 0,
      hint: "Follow all six white stones round the outside. Everything touching them is black or the wall, except for the marked points.",
      success: "Two, and Black has the same two. Neither group can be reduced without reducing the other by exactly as much, and that is the whole of it.",
    },
    {
      type: "sequence",
      setup: seki,
      toPlay: "b",
      moves: [pt(1, 7), pt(2, 7)],
      text: "Black tries anyway. Play the shared point and see what it costs.",
      hint: "Count Black's liberties after the move before you decide whether it was a good idea.",
      commentary: [
        "Black fills one of the two shared points. The stone joins the four already inside, and the new chain of five has one liberty left.",
        "White plays the other shared point and takes all five. Black attacked a group that had exactly as much air as he did, and ran out first by one move: his own.",
      ],
      success: "Five stones for nothing. The same thing happens to White in mirror image, which is why neither player touches these points for the rest of the game.",
    },
    {
      type: "info",
      setup: punished,
      text: "What it looks like afterwards, and it is worth seeing once so you do not have to find out in a real game. White has a large space and all the time in the world, and Black has spent five stones proving that a capturing race with no outside liberties is not a race.",
    },
    {
      type: "info",
      setup: seki,
      marks: [pt(1, 7), pt(2, 7)],
      text: "This is seki, and the rule is simple: leave it alone. Both groups are alive at the end of the game and neither comes off the board. The two marked points belong to nobody, which is not a figure of speech: ask the engine who owns them and it answers neutral, because they touch both colours. A seki is a small permanent truce in the middle of a board where nothing else is permanent.",
    },
  ],
};
