/* ----------------------- LONDON, GAME ONE -----------------------
   Fan Hui (black) against AlphaGo (white), 5 October 2015. White by 2.5 points after
   271 moves. The first game of the first match a program ever won against a
   professional on an even 19x19 board.

   Joseki's words. The SGF these moves came from carries no commentary and none has
   been invented: where this file makes a judgement it says so. */

export const FAN_HUI_1 = {
  id: "fan-hui-1",
  match: "fan-hui",
  no: 1,
  title: "Two and a half points",
  subtitle: "The first game, counted out to the end",
  date: "2015-10-05",
  dateText: "5 October 2015",
  where: "DeepMind, London",
  black: "Fan Hui",
  white: "AlphaGo",
  moves: 271,
  result: { winner: "w", method: "score", margin: 2.5 },
  clock: "1 hour each, then three 30-second periods",
  komi: 7.5,
  rulesText: "Chinese",

  lede: "The only game of the London match that went to a count. It is also the closest: two and a half points after two hundred and seventy-one moves.",

  story: [
    "Fan Hui was the European champion, a Chinese professional who had settled in France, and he came to DeepMind's office in London expecting to play a computer program. What he had been told about it was that it was strong. What nobody had told him, because nobody yet knew, was how strong.",
    "This first game is the least alarming of the five and the most informative. It is close all the way through. Fan Hui plays a normal, solid professional game and is never in serious trouble; the machine plays a normal, solid game back and is a fraction better at the boundaries. At the end White is ahead by two and a half points, which is the sort of margin that comes from one or two decisions rather than a superiority.",
    "Watched today, knowing what came next, the interesting thing is how ordinary it is. This is the version DeepMind would later estimate at around 3,144 Elo - strong professional, not more. Eighteen months later, the machine at Wuzhen was rated roughly seventeen hundred points above it.",
    "Afterwards Fan Hui said the thing that got quoted in the Nature paper's coverage: that it was very strong and stable, like a wall, and that if nobody had told him he might have thought his opponent was a slightly strange but very strong human being.",
  ],

  quotes: [
    { who: "Fan Hui", when: "on the match, published January 2016",
      text: "It is very strong and stable, it seems like a wall. I know AlphaGo is a computer, but if no one told me, maybe I would think the player was a little strange, but a very strong player, a real person." },
  ],

  opening: "The first of the five London games, and the only one that was counted rather than resigned. Fan Hui has black.",

  phases: [
    { from: 1, title: "A quiet opening",
      text: "Both players take corners and make ordinary extensions. Nothing in the first thirty moves would identify either player as unusual." },
    { from: 31, title: "The right side",
      text: "Black builds on the right and White comes in underneath. The first real exchange of the game." },
    { from: 43, title: "The bottom",
      text: "A sequence along the bottom edge, played out to a settled result. Even here the game is close." },
    { from: 60, title: "The long middlegame",
      text: "A hundred moves in which the board is divided without a fight. Both players are counting." },
    { from: 160, title: "Endgame",
      text: "A hundred moves of boundary play. White takes a point here and a point there and finishes two and a half ahead." },
    { from: 248, title: "The last exchanges",
      text: "The final captures and the last of the dame. The game is counted out rather than resigned, which is the only time that happens in this match." },
  ],

  notes: {
    1: "Q16. Fan Hui opens on the 4-4 point.",
    5: "C5. The third corner.",
    7: "D6. Black answers the approach from above.",
    10: "K3. White takes the bottom edge. A large, ordinary point.",
    11: "C14. Black takes the left side.",
    12: "C12. White comes in underneath it immediately.",
    17: "D17. Black takes the upper-left corner.",
    20: "H17. White extends along the top. The board is divided almost evenly and the count is within a point.",
    22: "O17. White takes the top-right area too.",
    23: "R14. Black takes the right side.",
    26: "B15. White lives in the corner on the left edge. Small, and it is one of the two or three places the two and a half points came from.",
    31: "R6. Black extends down the right.",
    32: "C7. White takes the left side boundary.",
    36: "R7. White comes into Black's right-side position.",
    40: "Q8. White jumps out. Nothing here is dangerous for either player; it is a division of territory conducted with stones.",
    42: "R11. White settles on the right edge, inside what Black was building. This is the largest single gain in the game.",
    43: "H3. Black plays into the bottom.",
    48: "J4. White blocks above. The bottom is settled in White's favour and Black gets sente.",
    52: "S13. White takes the right-edge endgame at move 52, which is very early for it - a move that is worth more than it looks and that a human would usually leave until later.",
    58: "M6. White takes the centre.",
    60: "S12. And the right edge again. From here the shape of the game is fixed and the rest is arithmetic.",
    100: "The middlegame passes without a fight. This is the part of the game that convinced the people in the room: not that the program could calculate, but that it could decline to fight when it was ahead.",
    120: "White captures a stone. The first capture in the game comes on move 120, which tells you what kind of game this was.",
    125: "Black takes one back.",
    160: "The endgame begins in earnest. From here it is boundary play, and White plays it very slightly better.",
    204: "White captures two. The margin is now roughly what it will be at the end.",
    224: "White captures again. Fan Hui is playing on because the game is within a few points and a counted game is not over until it is counted.",
    248: "White captures three. That is effectively the end of it.",
    271: "The last move. Counted: White by two and a half points. It is the closest game of the London match and the only one that reached a count. Fan Hui said afterwards that it had been like playing a wall - very strong, very stable - and that if nobody had told him, he might have taken his opponent for a strange but very strong human being.",
  },

  sources: [
    "The record is the game as played and published; a game record carries no rights.",
    "The result, the clock and the move count are the match's own; the match was published in Nature on 27 January 2016.",
    "The quotation is Fan Hui's, from the coverage of that publication.",
  ],
};
