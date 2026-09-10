import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 14k · judgement · On Joining Battle (Classic, ch. 4) -----------------------
   Two black stones inside White's area have one liberty. Extending gives them
   one liberty again, and White takes three. The lower left is open. */
const doomed = {
  b: [pt(6, 3), pt(6, 4), pt(2, 2)],
  w: [pt(5, 3), pt(5, 4), pt(6, 2), pt(7, 3), pt(7, 4), pt(5, 5), pt(7, 5)],
};

export default {
  id: "classic-conflict",
  title: "On Joining Battle",
  subtitle: "Chapter four: let the lost stones go and keep the initiative",
  plain: "Stones are cheap and the move is not. Let the stones that are already caught go, keep the initiative, and look at the far side of the board before you start a fight on the near one.",
  tier: 3, rank: "14k", track: "judgement", size: 9, prereqs: ["classic-know-yourself"], minutes: 6,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 4,
  steps: [
    {
      type: "info",
      setup: doomed,
      marks: [pt(6, 5), pt(2, 6)],
      text: "Two black stones on the right have one liberty. The classic is blunt about this: rather than keep endangered stones alive, abandon them and take new positions. Losing stones is bearable. Losing the initiative, the right to play the next big move, is not.",
    },
    {
      type: "choice",
      setup: doomed,
      toPlay: "b",
      text: "Black to play.",
      options: [
        { point: pt(2, 6), verdict: "best", text: "Let the two stones go and take the corner. White spends a move capturing, or leaves them and you have lost nothing more." },
        { point: pt(6, 5), verdict: "poor", text: "Extending gives one liberty again. White fills it and takes three stones instead of two, and you have handed over the move." },
        { point: pt(4, 4), verdict: "fine", text: "The centre is big, but the lower left corner is bigger and cheaper to hold." },
      ],
    },
    {
      type: "choice",
      setup: { b: [pt(2, 2), pt(2, 6)], w: [pt(6, 2), pt(6, 6), pt(0, 4)] },
      toPlay: "b",
      text: "White's last stone sits on the edge at the left, touching nothing. The classic says a player who only answers is already walking toward defeat. Black to play.",
      options: [
        { point: pt(4, 4), verdict: "best", text: "The centre, the biggest point left. White's edge stone threatens nothing yet; answering it would be responding for the sake of responding." },
        { point: pt(0, 3), verdict: "poor", text: "A first-line answer to a first-line stone. Two moves spent on the edge, and White takes the centre." },
        { point: pt(4, 2), verdict: "fine", text: "A fair point between the corners, but the centre is larger while it is still empty." },
      ],
    },
    {
      type: "info",
      setup: { b: [pt(2, 2), pt(2, 6), pt(4, 4)], w: [pt(6, 2), pt(6, 6), pt(0, 4)] },
      text: "Before you strike to the left, look to the right. The classic says the best victory is won without fighting and the best position is one that does not provoke a fight; but if you must fight, fight well and you will not lose, and keep your ranks in order and even your losses will be clean. Open by the rules. Win by imagination.",
    },
  ],
};
