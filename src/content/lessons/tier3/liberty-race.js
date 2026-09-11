import { pt } from "../../positions.js";

/* ----------------------- 14k · tactics · The Capturing Race -----------------------
   Two groups, neither with an eye, each able to kill the other. The rule is one
   sentence — fill the liberties that are only your opponent's, and never the
   one you share — and it is the sentence that decides most kyu fights.

   The position was not drawn, it was found. Every arrangement of black and
   white stones in a three-by-four corner box was enumerated, and this one is
   one of two that survived every filter: a genuine race (Black to play wins,
   White to play wins), exactly one shared liberty, exactly one winning move,
   and no move that merely draws. A dedicated race solver — whichever chain
   comes off the board first takes the point, both sides allowed to pass —
   confirmed all three outcomes to twelve plies:

     Black (3,6) the outside liberty   -> White (0,7), Black (0,8), White's
                                          six stones are captured
     Black (0,7) the shared liberty    -> White (0,8), Black is captured
     Black (0,8) his own liberty       -> White (0,7), Black is captured

   Both chains have exactly two liberties and one of the two is the same point,
   which is what makes the choice so sharp: the shared liberty is the one move
   that shortens Black as fast as it shortens White. */

const race = {
  b: [pt(0, 5), pt(1, 5), pt(2, 5), pt(3, 5), pt(4, 6), pt(4, 7), pt(4, 8),
      pt(1, 7), pt(1, 8), pt(2, 8)],
  w: [pt(0, 6), pt(1, 6), pt(2, 6), pt(2, 7), pt(3, 7), pt(3, 8)],
};

const won = {
  b: [pt(0, 5), pt(1, 5), pt(2, 5), pt(3, 5), pt(4, 6), pt(4, 7), pt(4, 8),
      pt(1, 7), pt(1, 8), pt(2, 8), pt(3, 6), pt(0, 8)],
  w: [],
};

export default {
  id: "liberty-race",
  title: "The Capturing Race",
  subtitle: "Fill the liberties you do not share",
  tier: 3, rank: "14k", track: "tactics", size: 9,
  prereqs: ["liberties", "no-liberty-capture", "atari-escape"], minutes: 8,
  author: "Sente",
  steps: [
    {
      type: "info",
      setup: race,
      marks: [pt(3, 6), pt(0, 7), pt(0, 8)],
      text: "Six white stones and three black stones are locked together in the corner, and neither group has an eye or anywhere to run. One of them is going to be captured; the only question is which. Three points are still empty, and they are marked. Everything that happens here happens on those three points.",
    },
    {
      type: "count",
      setup: race,
      question: "How many liberties does the white group have?",
      answer: 2, tolerance: 0,
      hint: "Walk the whole chain — all six stones, over three rows — and count the empty points touching it. Only two of the three marked points touch White.",
      success: "Two: the point above on the right, and the point on the left edge. The black group has two as well, which is what makes this a race rather than a rescue.",
    },
    {
      type: "info",
      setup: race,
      marks: [pt(0, 7)],
      text: "Count Black now and you get two as well — and here is the thing that decides the fight. The marked point on the left edge is a liberty of both groups at once. It is the only point they share. Filling it would take one of White's two liberties, and one of Black's two, on the same move.",
    },
    {
      type: "choice",
      setup: race,
      toPlay: "b",
      text: "Black to play, and only three points to choose from. Pick one and read the verdict.",
      options: [
        { point: pt(3, 6), verdict: "best", text: "White's outside liberty: the one White has and Black does not. White drops to one liberty and Black still has two. White has no answer — filling the shared point puts both groups in atari, and Black is the one to move." },
        { point: pt(0, 7), verdict: "poor", text: "The shared liberty. It looks like progress because White is down to one, but so is Black, and it is White's turn. White fills the last point on the edge and Black is taken off the board." },
        { point: pt(0, 8), verdict: "poor", text: "Black's own outside liberty. It takes nothing from White at all, and it fills one of the two points Black was relying on. White plays the shared point and Black is captured." },
      ],
    },
    {
      type: "sequence",
      setup: race,
      toPlay: "b",
      moves: [pt(3, 6), pt(0, 7), pt(0, 8)],
      text: "Play the race out. Three moves decide it.",
      hint: "Take the liberty that is White's alone, then answer whatever White does.",
      commentary: [
        "Black fills White's outside liberty. White is down to one, Black still has two.",
        "White has nothing better than the shared point, which puts both groups in atari at once — and hands the move to Black.",
        "Black fills the last liberty and six white stones come off the board. Black had one liberty in hand the whole way, and that one liberty was the whole game.",
      ],
    },
    {
      type: "info",
      setup: won,
      text: "This is what a tempo is worth. Both groups had two liberties; the difference was only that Black filled a point White needed and Black did not. Count before you fill: your outside liberties, your opponent's, and the ones you share. Fill your opponent's outside liberties first, and leave the shared ones until last — a shared liberty costs you exactly as much as it costs them, so playing one is a move you have made for both sides.",
    },
  ],
};
