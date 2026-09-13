import { pt } from "../../positions.js";

/* ----------------------- 2d · endgame · The Last Three Points (Tier 6) -----------------------
   A dan lesson is allowed to be mostly argument. This one is not, and that is
   the point of it: every number here was solved exactly by
   `tools/lessons/endgame.mjs`, which plays the rest of the game out under
   minimax on the final score, both sides allowed to pass, with the engine's own
   `scoreBoard` doing the counting.

   The position is the end of a 9x9 game between two house players, found by
   `selfPlay` and kept because of what the solver said about it. Nobody famous
   played it. The arithmetic is what is being taught, and the arithmetic is
   exact.

   What the solver proved, and the whole lesson is these six numbers:

     the count now                      Black 3, White 3, jigo
     Black's chain                      37 stones, exactly four liberties
     Black plays 8,8 (the dame)         0   under Japanese rules
     Black plays 8,0 or 8,1             -1  own territory, a point gone
     Black plays 8,6                    -41 the group's second eye, and it dies
     Black passes                       0

   And then the same position counted the other way:

     under Chinese rules the count now is 40-40, Black playing the dame is +1,
     and Black passing is -1. The same board, the same move, and the ruleset
     decides whether passing is correct or loses the game.

   Two claims here are the engine's and not the author's: that the black chain
   is one chain of 37 stones with four liberties (`chainAt`), and that the four
   moves are worth 0, -1, -1 and -41 (the solver). The judgement in the lesson
   is only about what a player should carry away from that. */

const board = {
  b: [
    pt(1, 0), pt(2, 0), pt(3, 0), pt(4, 0), pt(5, 0), pt(6, 0),
    pt(7, 0), pt(1, 1), pt(2, 1), pt(3, 1), pt(4, 1), pt(5, 1),
    pt(6, 1), pt(7, 1), pt(3, 2), pt(4, 2), pt(5, 2), pt(6, 2),
    pt(7, 2), pt(8, 2), pt(3, 3), pt(5, 3), pt(6, 3), pt(7, 3),
    pt(8, 3), pt(3, 4), pt(5, 4), pt(6, 4), pt(7, 4), pt(8, 4),
    pt(6, 5), pt(7, 5), pt(8, 5), pt(6, 6), pt(7, 6), pt(7, 7),
    pt(8, 7),
  ],
  w: [
    pt(0, 0), pt(0, 1), pt(0, 2), pt(1, 2), pt(2, 2), pt(0, 3),
    pt(1, 3), pt(2, 3), pt(4, 3), pt(0, 4), pt(1, 4), pt(2, 4),
    pt(4, 4), pt(1, 5), pt(2, 5), pt(3, 5), pt(4, 5), pt(5, 5),
    pt(0, 6), pt(1, 6), pt(2, 6), pt(3, 6), pt(4, 6), pt(5, 6),
    pt(0, 7), pt(1, 7), pt(2, 7), pt(3, 7), pt(4, 7), pt(5, 7),
    pt(6, 7), pt(1, 8), pt(2, 8), pt(3, 8), pt(5, 8), pt(6, 8),
    pt(7, 8),
  ],
};

export default {
  id: "endgame-last-points",
  title: "The Last Three Points",
  subtitle: "Where a won game is given back, and what a ruleset is worth",
  plain: "At the end of a close game there are a few empty points left and most of them are traps. One is free, two cost a point each, and one kills your own group. Knowing which is which, and knowing that the answer changes with the rules you agreed to, is the last thing that separates a strong player from a careful one.",
  tier: 6, rank: "2d", track: "endgame", size: 9,
  prereqs: ["guanzi-first-line-hane", "passing-and-ending"], minutes: 8,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: board,
      marks: [pt(8, 0), pt(8, 1), pt(8, 6), pt(8, 8)],
      text: "The end of a 9x9 game. Both sides have thirty-seven stones on the board, the count is three points each, and with no komi that is a tie. Four empty points are left on Black's side of the board, marked. Black to play. Three of the four lose the game and one of them loses it by forty-one points, and none of that is an opinion: the rest of this board was played out exactly, every move against every reply, and the numbers below are what came back.",
    },
    {
      type: "count",
      setup: board,
      question: "Black's stones are all one chain. How many liberties does it have?",
      answer: 4, tolerance: 0,
      hint: "The four marked points, and nothing else. Walk the outside of the chain: every other point that touches it holds a white stone.",
      success: "Four, and that is the whole story of this position. Two of them are a two-point eye in the corner above, one is an eye on its own, and one is a neutral point shared with White. A group with two eyes is alive. A group with one is not.",
    },
    {
      type: "choice",
      setup: board,
      toPlay: "b",
      text: "Black to play. Each of these is legal. One of them costs nothing.",
      options: [
        { point: pt(8, 8), verdict: "best", text: "The neutral point, the one White also touches. It belongs to nobody, filling it takes nothing from Black, and the game stays a tie. Under Japanese rules it is worth exactly zero, which is also what passing is worth, so this is the move that changes nothing and that is precisely why it is right." },
        { point: pt(8, 1), verdict: "poor", text: "Inside Black's own corner. Under Japanese rules a stone on a point you already owned turns a point of territory into a stone worth nothing, so this hands White the game by one. The eye is still an eye afterwards, so the group lives; Black simply paid a point for the privilege of moving." },
        { point: pt(8, 6), verdict: "poor", text: "The single-point eye, and the game with it. The chain has four liberties and two of them are eyes; this one fills the smaller eye and leaves thirty-eight stones with one eye and no way to make a second. White takes the lot. The solver puts it at forty-one points, which is the three points Black had plus the thirty-eight stones Black no longer has." },
      ],
    },
    {
      type: "info",
      setup: board,
      marks: [pt(8, 8)],
      text: "Now the same board under Chinese rules, and everything moves. Area counting scores stones as well as territory, so the count is not three to three, it is forty to forty; filling your own territory costs nothing, because the point you fill you also keep; and a neutral point is worth a whole point to whoever takes it. The marked point, worth exactly zero a moment ago, now decides the game. Black plays it and wins by one. Black passes and loses by one. The stones did not move. The agreement did.",
    },
    {
      type: "info",
      setup: board,
      marks: [pt(8, 6)],
      text: "Two things to carry away, and they pull in opposite directions, which is why this is the last lesson in the endgame and not the first. The first is that the end of the game is a counting problem and not a tidying-up exercise: there is a right answer, it is usually worth a point, and a point is what most close games are decided by. The second is that the single largest number on this board, the forty-one, has nothing to do with counting at all. It is a player filling their own eye at move two hundred because the board looked finished and the hand moved on its own. Count the liberties of your own big group before the last few moves, every time. Nobody is ever beaten by the endgame arithmetic as badly as they are beaten by not looking.",
    },
  ],
};
