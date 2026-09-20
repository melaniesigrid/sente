/* ----------------------- SEOUL, GAME ONE -----------------------
   Lee Sedol (black) against AlphaGo (white), 9 March 2016. AlphaGo by resignation
   after 186 moves.

   The words here are Joseki's. The record is the one played that afternoon; the two
   quotations are things Lee Sedol said in public, in the room, on the day. */

export const LEE_SEDOL_1 = {
  id: "lee-sedol-1",
  match: "lee-sedol",
  no: 1,
  title: "The first one",
  subtitle: "Lee Sedol finds out he is not playing a computer program",
  date: "2016-03-09",
  dateText: "9 March 2016",
  where: "Four Seasons Hotel, Seoul",
  black: "Lee Sedol",
  white: "AlphaGo",
  moves: 186,
  result: { winner: "w", method: "resign", margin: null },
  clock: "2 hours each, then three 60-second periods",
  komi: 7.5,
  rulesText: "Chinese",

  lede: "Lee Sedol came in expecting to win five-nil and played an opening designed to take a machine out of its books. It answered every move of it.",

  story: [
    "Almost everybody asked before this match said Lee Sedol would win it. He said so himself. The reasoning was sound and it was the same reasoning everywhere: a program had beaten Fan Hui, a 2 dan professional, five months earlier, and the gap between a 2 dan professional and Lee Sedol is enormous - far larger than the gap between a 2 dan professional and a strong amateur.",
    "What nobody outside the building had is the thing that mattered: five months of further training. The machine that sat down in Seoul was not the machine that had played in London.",
    "Lee opened the way a strong player opens against something he does not understand. He probed. He built positions that ask a question rather than claim a point, on the theory that a program would be following patterns it had learned and could be pushed off the edge of them. It was a good theory and the whole first hour is built on it.",
    "It did not work, and the way it did not work is the story of the game. AlphaGo answered the probes calmly, gave up what it did not need, and took a steady lead in a long running fight through the top and the centre that never quite became the catastrophe Lee needed it to be. Michael Redmond, commentating in English, said the machine was playing more aggressively than it had against Fan Hui. That was the first public sign that this was a different opponent.",
    "Lee resigned on move 186. Afterwards he said he had made a critical error early and had been surprised, which are two separate admissions and the second is the larger one.",
  ],

  quotes: [
    { who: "Lee Sedol", when: "after game one, 9 March 2016",
      text: "I was very surprised, because I did not think I would lose." },
    { who: "Lee Sedol", when: "after game one, 9 March 2016",
      text: "I made a critical error at the beginning." },
    { who: "Michael Redmond, 9 dan, commentating", when: "9 March 2016",
      text: "It is more aggressive than it was against Fan Hui." },
  ],

  opening: "An empty board, 19x19, Chinese rules, 7.5 komi. Two hours each. Lee Sedol has black and the first move; AlphaGo has white and the komi. Step forward with the right arrow, back with the left, and ten at a time with up and down.",

  phases: [
    { from: 1, title: "Four corners, quickly",
      text: "Both players take corners without arguing about them. Nothing here is unusual, and that is worth noticing: a program that had learned from human games opens like the humans it learned from." },
    { from: 13, title: "The probe",
      text: "Lee starts asking questions in the upper right rather than settling anything. The plan is to build a position whose answer is a matter of judgement rather than pattern, and see whether the machine has any." },
    { from: 23, title: "The running fight",
      text: "Black's group in the middle of the top edge has no base and neither does White's. Two weak groups running in the same direction is the most double-edged shape in go, and it stays double-edged for forty moves." },
    { from: 63, title: "Out into the centre",
      text: "The fight resolves into a chase towards the middle. Neither group dies. What changes hands is the initiative: after this, White is the one choosing where the game is played." },
    { from: 77, title: "Lee takes the bottom",
      text: "With the top settled, Lee turns to the largest empty area and tries to build enough to make the count work. White follows him in." },
    { from: 102, title: "White settles the right",
      text: "AlphaGo comes back to the right side and plays a sequence that looks casual and costs Black his last real chance. This is the part of the game the professionals watching found most convincing." },
    { from: 141, title: "The endgame that was already over",
      text: "Forty-five moves of correct endgame with no way back in it. Lee plays them out because a professional does, and resigns when the last of them is gone." },
  ],

  /* A note on a move is what that move is for and what it costs, in Joseki's words.
     Where a verdict belongs to somebody, the note says whose it is. */
  notes: {
    1: "R16, the 3-4 point. Lee Sedol's usual first move, and a small statement: the 4-4 point offers the corner in exchange for speed, the 3-4 point holds onto it. He is playing his own game, not a game designed for the opponent.",
    2: "AlphaGo takes the far corner. Through the whole of this match the machine is almost boringly orthodox in the opening and almost never orthodox afterwards.",
    5: "F17. An approach to the upper left that also works with the stone at the top right. Black is making the top edge his.",
    7: "R8, an extension down the right side from the 3-4 stone. Black has a framework on two edges after seven moves. It looks commanding; it is also thin, and the rest of the game is about which of those two words is the true one.",
    8: "P16. White will not let the top be settled. Coming in here, under Black's strongest area, is the first uncomfortable move of the game.",
    11: "S17 takes the corner territory. Small in points, large in safety: Black is buying a base so that the coming fight is one he can afford to lose.",
    13: "S15. The probe. Lee is not defending here so much as asking what White will do, and watching the answer.",
    14: "P14. White declines to answer locally and jumps out instead. A program with no sense of the question would have replied to it.",
    15: "Black attaches underneath. Now both sides have a group in the open with no eyes and nowhere obvious to make them.",
    18: "J16. White plays away from the fight to take a large point on the top edge. This is the kind of move that decides games and never gets remembered, because nothing visible happens.",
    19: "M14. Black jumps out and the two weak groups start running together. From here to move 60 neither player can safely stop.",
    23: "L12. Lee is trying to build a wall facing the centre while chasing. If it works, the whole middle of the board becomes his and the game is won here.",
    26: "M13. The cut. White refuses to be pushed and starts a fight inside Black's own building site.",
    29: "O15. Black connects underneath and takes profit at the top. A solid choice; a fighter's choice would have been to cut back, and Lee does not take it.",
    31: "K17. Now Black attacks the white stones at the top of the board. There are three groups in the air at once and the game is genuinely unclear.",
    37: "J14. Black's stones reach out towards the centre. The shape is thin - there are cutting points everywhere - but thin shape is the price of speed, and Lee needs speed.",
    40: "N11. White cuts through the middle of it. The two black groups on the right are now separated from the running group in the centre.",
    45: "L11. Black defends the weaker half. He has kept everything alive and has gained almost nothing while doing it, which in a fight you started is a loss.",
    48: "J18. Reducing Black's top-edge territory in sente. Small-looking, and by the end of the game it is worth more than several of the moves either player spent an hour on.",
    50: "N8. White surrounds from a distance rather than touching. Touching a weak group makes it stronger; this is the move a strong player would praise without being able to say exactly why it is better.",
    56: "N7. White's stones on the right side are now a wall facing the bottom, and the bottom is the only large empty area left. Black's chase has built his opponent's position.",
    61: "K10. Black reaches the centre point. He is out and safe. The question is what he has to show for it, and the answer is: the top edge, which White reduced on move 48.",
    64: "H11. White caps. The chase changes direction and now it is Black being pushed.",
    70: "N6. White takes the boundary between his wall and the open bottom. Every move from here is worth real points to somebody.",
    77: "J7. Black finally turns to the bottom. It is a big point and it is a move late.",
    78: "R5. White does not follow him. Taking the corner instead is worth more, and it makes Black's bottom-right smaller before it is built.",
    81: "C6. Lee invades the lower left. He needs a fight; there is no count in which he is ahead.",
    88: "C5. White takes the corner and lets Black have the outside. The count says White can afford this trade and the count is right.",
    93: "D8. Black lives and connects. He has a position across the left side and it is not enough, which he knows.",
    96: "S18. The endgame starts while the middle is still unresolved. White is playing as though the game is decided.",
    102: "R10. The move the watching professionals kept coming back to. White reduces the right side from the outside and Black cannot cut it off - every answer leaves White connected somewhere.",
    107: "P9. Black tries to seal the centre. The wall he built on move 45 is finally doing something, sixty moves late.",
    116: "C17. White takes the last big corner point. Everything after this is arithmetic.",
    122: "N2. The bottom edge, in sente. White has now taken every large endgame point on the board in order of size.",
    139: "Q1. The first capture of the game, on move 139, and it is worth one stone. This is a quiet game by the standards of what follows in this match.",
    146: "A6. White captures two on the left edge and Black's invasion is finally settled at a loss.",
    161: "C4. Black takes one back. Both players are now playing an endgame that neither is in doubt about.",
    170: "S16. The upper right, closed out. Lee is playing on because a professional plays on.",
    178: "P17. White fills the last of the top edge. There are no more points anywhere that would change the count.",
    186: "F12. Lee Sedol resigns. He said afterwards that he had been very surprised, because he had not thought he would lose - and that he had made a critical error early. Four days later he would find the move that beat it.",
  },

  sources: [
    "The record is the game as played and published; a game record carries no rights.",
    "Move counts, dates, the clock and the result are the match's own; the quotations are from the post-game press conference on 9 March 2016.",
  ],
};
