import { pt } from "../../positions.js";
import { GAME } from "./jowa-intetsu.game.js";

/* ----------------------- 1k · middle · Jowa against Intetsu -----------------------
   Honinbo Jowa (White) against Akaboshi Intetsu, 1835. Record public domain (aeb
   collection); every word here is Joseki's own. Stops are White's moves; `strong` at
   each stop is what KataGo's strong-player-of-1835 profile would play instead. */

const words = {
  21: {
    text: "Move 22. Black has just haned at B3 in the bottom left corner. White to play.",
    hint: "There is one answer that keeps the corner.",
    success: "B2 blocks underneath. Black's hane gains nothing, and the white corner stones keep their eye space. The strong-player profile has no other candidate here either.",
    partial: "A strong player's move, not his.",
  },
  41: {
    text: "Move 42. On the left side Black has pushed at H7 against White's stones. White to play.",
    hint: "Turn ahead of the black stones rather than behind them.",
    success: "G8. White turns at the head of the black stones; Black's push has run into a wall.",
    partial: "G9 is the calmer extension a strong player might choose. Jowa turns one line closer.",
  },
  69: {
    text: "Move 70. Black has played D10 on the left side. White's stones above and below are looking at each other across a black framework. White to play.",
    hint: "A jump, not a contact move.",
    success: "E12. White leaps out between the black stones on the left, keeping his upper and lower groups in touch and taking away the frame Black wanted there.",
    partial: "F14, A15 and R13 are the profile's ideas: safer, further from the fight. Jowa jumps into the middle of it.",
  },
  77: {
    text: "Move 78. On the right side Black has pushed at P9 toward White's stones. White to play.",
    hint: "Give way, or refuse to?",
    success: "Q9 blocks. White refuses to give ground on the right. The strong-player profile ranks this move tenth; it would rather play away at N5, S15 or O16. Jowa stands and fights.",
    partial: "N5, S15 and O16 are what a strong player of the era plays here. Jowa blocks.",
  },
  79: {
    text: "Move 80. Black has extended to P8. White to play.",
    hint: "The head of the black stones is at P10.",
    success: "Q10, the hane at the head of the two black stones. Black is bent around and short of liberties on the side. Together with Q9 this is the sequence tradition remembers this game for.",
    partial: "The profile would block at P10 or turn away to N5 or O6. Jowa hanes.",
  },
  95: {
    text: "Move 96. At the bottom Black has just played O4. Black's stones at M3 and O3 stand a point apart. White to play.",
    hint: "Two black stones, one gap.",
    success: "N3 wedges between M3 and O3. Neither black stone can take the other's side, and the bottom edge turns White's way. The strong-player profile does not list this point at all; from here Intetsu could not recover and resigned.",
    partial: "O5 or R4 is the profile's choice, playing above rather than through. Jowa cuts.",
  },
};

export default {
  id: "jowa-intetsu",
  title: "Jowa Against Intetsu",
  subtitle: "Honinbo Jowa, White, 1835",
  plain: "Sitting behind Jowa's stones shows where a game turns: the few moves where his choice and a strong contemporary's part company. Guess first, then see what he saw.",
  tier: 5, rank: "1k", track: "middle", size: 19, prereqs: [], minutes: 15,
  book: "masters",
  author: "Joseki", sources: ["Game record: public domain (homepages.cwi.nl/~aeb/go/games)"],
  steps: [
    {
      type: "info",
      setup: {},
      text: "Honinbo Jowa takes White against Akaboshi Intetsu of the Inoue house in 1835, a game with a house rivalry behind it. Six stops on White's moves. His move scores two points, a strong player's move of his era scores one.",
    },
    {
      type: "replay",
      setup: {},
      toPlay: GAME.toPlay,
      moves: GAME.moves,
      stops: GAME.stops.map((s) => ({ ...s, ...words[s.at] })),
      text: "The first 100 moves. The board plays itself between stops; you play White.",
      success: "White won by resignation. The stretch from Q9 to Q10 is where the game turned, and where Jowa parted from what a strong player of his day would have chosen.",
    },
    {
      type: "info",
      setup: { w: [pt(15, 10), pt(15, 9)], b: [pt(14, 10), pt(14, 11)] },
      marks: [pt(15, 9)],
      text: "Sit across from him. Jowa plays in the lobby as a house bot: his own openings from his games, then a strong player of 1835.",
    },
  ],
};
