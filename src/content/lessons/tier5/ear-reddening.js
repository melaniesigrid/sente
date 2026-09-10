import { pt } from "../../positions.js";
import { GAME } from "./ear-reddening.game.js";

/* ----------------------- 1k · judgement · The Ear-Reddening Game -----------------------
   Shusaku (Black) against Gennan Inseki, 1846. Record public domain (aeb collection);
   every word here is Joseki's own. Stops are Black's moves; `strong` at each stop is
   what KataGo's strong-player-of-1846 profile would play instead, precomputed. */

const words = {
  8: {
    text: "Move 9. White has approached both right-hand corners: P17 at the top, R5 at the bottom. Where does Black answer?",
    hint: "One of these two approaches can wait. Shusaku's answer to the other is the move that carries his name.",
    success: "The Shusaku kosumi at Q15. He leaves the bottom approach alone and plays the diagonal from R16, a move he said would never be bad as long as go is played. It defends the corner and looks down the whole right side at once.",
    partial: "A strong player answers the bottom approach at P4, or takes the top with K17 or L17. Shusaku plays the diagonal in the other corner first.",
  },
  24: {
    text: "Move 25. The bottom right has become a fight. White has just pressed at N4 against Black's wall. Black to play.",
    hint: "Keep the corner stones connected along the edge.",
    success: "The hane underneath at N3. Black's corner group stays in one piece and White's N4 stone is the one short of liberties.",
    partial: "A strong player might drop to M2 or slide to P2 or R2 first. Shusaku hanes straight away.",
  },
  50: {
    text: "Move 51. White has just played R7, and the black group in the bottom right corner has a white stone at Q2 lodged inside it. Black to play.",
    hint: "Count the liberties of the white stone at Q2.",
    success: "P2 captures Q2 and joins the corner into one living group. Shusaku takes the sure thing before anything else.",
    partial: "The profile looks to the centre with M6 or R11. Shusaku settles the corner first.",
  },
  80: {
    text: "Move 81. White has pushed at Q12, aiming at the black stones on the right side. Black to play.",
    hint: "Which black stones are cut off if White gets one more move here?",
    success: "R13 links the right-side stones to the top right corner. Nothing to attack, so White's push gained little.",
    partial: "A strong player cuts through at P11. Shusaku connects first and fights later.",
  },
  126: {
    text: "Move 127. White has just played J5. This is the position the game is named for. Where does Black play?",
    hint: "Not a fight. Look for the one point that does several jobs at once.",
    success: "K11, the ear-reddening move. It grows the black centre, reduces the white framework on the left, and stands in the way of any white attack on the black stones below. Gennan Inseki's ears are said to have flushed when he saw it. The strong-player profile of 1846 does not even list this point among its candidates.",
    partial: "A strong player wants J4, N12 or J6, each doing one job well. Shusaku's move does three.",
  },
  150: {
    text: "Move 151. The centre has turned into a cutting fight; White has just played J11. Black to play.",
    hint: "Black wants to stay connected while White's cutting stones stay apart.",
    success: "J9. Black's stones join up through the middle and the white cutting stones are left in two pieces. From here Shusaku's lead holds to the end: Black wins by two.",
    partial: "K12, H7 and K8 are the profile's choices, each reasonable. Shusaku's J9 keeps the tempo.",
  },
};

export default {
  id: "ear-reddening",
  title: "The Ear-Reddening Game",
  subtitle: "Shusaku against Gennan Inseki, 1846",
  plain: "Replaying a famous game move by move is the cheapest lesson a strong player ever gives. You guess, the record answers, and the gap between your move and Shusaku's is exactly what you have left to learn.",
  tier: 5, rank: "1k", track: "judgement", size: 19, prereqs: [], minutes: 15,
  book: "masters",
  author: "Joseki", sources: ["Game record: public domain (homepages.cwi.nl/~aeb/go/games)"],
  steps: [
    {
      type: "info",
      setup: {},
      text: "Kuwahara Shusaku, seventeen years old, plays Black against Gennan Inseki, the strongest player of the day, in the summer of 1846. Six stops. At each, place the stone you would play; his move scores two points, a strong player's move of his era scores one.",
    },
    {
      type: "replay",
      setup: {},
      toPlay: GAME.toPlay,
      moves: GAME.moves,
      stops: GAME.stops.map((s) => ({ ...s, ...words[s.at] })),
      text: "The first 160 moves. The board plays itself between stops.",
      success: "Black won by two points. Shusaku was seventeen; Gennan was the strongest player alive. The move at K11 is still the first thing most players learn about him.",
    },
    {
      type: "info",
      setup: { b: [pt(9, 8)] },
      marks: [pt(9, 8)],
      text: "Sit across from him. Shusaku plays in the lobby as a house bot: his own openings from his games, then a strong player of 1846.",
    },
  ],
};
