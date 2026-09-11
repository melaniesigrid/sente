import { pt } from "../../positions.js";

/* The oldest surviving go manual: a sixth-century scroll from the Library Cave
   at Dunhuang, taken to London by Aurel Stein in 1907 and now British Library
   Or.8210/S.5574. Its seventh and last section sorts go diagrams into four
   kinds, and ko and seki are one of the four. Public domain by any measure. */
const DUNHUANG_SOURCE =
  "The Classic of Go (Dunhuang manuscript, sixth century; British Library Or.8210/S.5574)";

/* ----------------------- 13k · life · The Standoff -----------------------
   The sequel to `liberty-race`, and its exception. There the rule was to fill
   your opponent's outside liberties and leave the shared ones alone; here
   there are no outside liberties at all, only shared ones, and the rule runs
   out. Neither side can play. Both groups live without eyes.

   Found, not drawn. The same corner enumeration that produced `liberty-race`
   was filtered the other way: positions where the race solver returns a draw
   from both sides, and where every legal move inside loses for whoever makes
   it. Five positions survived; this is the most symmetrical of them.

     white  6 stones, liberties (1,7) and (2,7)
     black  4 stones, liberties (1,7) and (2,7) - the same two
     race from either side: a draw
     any of the four possible moves inside: the player who moves loses

   Black playing (1,7) makes a five-stone chain with one liberty, and White
   takes all five. The mirror is exactly as bad for White. */

const seki = {
  b: [pt(0, 5), pt(1, 5), pt(2, 5), pt(3, 5), pt(4, 6), pt(4, 7), pt(4, 8),
      pt(0, 7), pt(0, 8), pt(1, 8), pt(2, 8)],
  w: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(3, 7), pt(3, 8)],
};

const punished = {
  b: [pt(0, 5), pt(1, 5), pt(2, 5), pt(3, 5), pt(4, 6), pt(4, 7), pt(4, 8)],
  w: [pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(2, 7), pt(3, 7), pt(3, 8)],
};

export default {
  id: "seki",
  title: "The Standoff",
  subtitle: "Two groups alive without a single eye between them",
  tier: 3, rank: "13k", track: "life", size: 9,
  prereqs: ["liberty-race", "two-eyes"], minutes: 7,
  author: "Sente", sources: [DUNHUANG_SOURCE],
  steps: [
    {
      type: "info",
      setup: seki,
      marks: [pt(1, 7), pt(2, 7)],
      text: "Six white stones and four black ones, locked together, and not one eye anywhere. Both groups are down to two liberties, and the two marked points are those liberties — for both of them, the same two points. In the capturing race you learned to fill your opponent's outside liberties first. Here nobody has an outside liberty. There is nothing to fill but the points you share.",
    },
    {
      type: "count",
      setup: seki,
      question: "How many liberties does the white group have?",
      answer: 2, tolerance: 0,
      hint: "Follow all six white stones around. Everything else touching them is black or the wall.",
      success: "Two, and Black has the same two. Neither group can be reduced without reducing the other by exactly as much.",
    },
    {
      type: "sequence",
      setup: seki,
      toPlay: "b",
      moves: [pt(1, 7), pt(2, 7)],
      text: "Suppose Black loses patience and fills one of them anyway.",
      hint: "Play one of the two shared points and watch what it costs.",
      commentary: [
        "Black fills a shared liberty. White is down to one — but so is Black, and the black stone has joined the group it was trying to save.",
        "White plays the other point and takes five stones. Black attacked and Black died, without White ever having to do anything clever.",
      ],
    },
    {
      type: "info",
      setup: punished,
      text: "That is the whole cost of moving first, and it is the same for White: play either point and the other side captures. So neither of them plays. The two groups sit there for the rest of the game, both alive, neither with an eye, and when the game is counted the points between them belong to nobody. This is seki, and a group in seki is alive by the same right as a group with two eyes: not because it cannot be attacked, but because attacking it does not work.",
    },
    {
      type: "info",
      setup: seki,
      marks: [pt(1, 7), pt(2, 7)],
      text: "It is worth knowing how old this idea is. The oldest surviving book about go, a manuscript from the sixth century found walled up in a cave at Dunhuang, ends by sorting go problems into four kinds — famous games, cunning techniques, life-and-death shapes, and ko and seki. Fourteen centuries later the standoff is still one of the four things worth having a name for, and it still means the same thing: leave it alone.",
    },
  ],
};
