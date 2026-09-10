import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 8k · judgement · On Examining the Heart (Classic, ch. 8) -----------------------
   Black's two stones in the middle have two liberties; the two white stones
   beside them have three. Attack first and White wins the race by a move. */
const race = {
  b: [pt(4, 4), pt(4, 5), pt(5, 3)],
  w: [pt(4, 3), pt(5, 4), pt(5, 5), pt(4, 6)],
};

export default {
  id: "classic-feelings",
  title: "On Examining the Heart",
  subtitle: "Chapter eight: temperament decides more games than technique",
  plain: "How you take a win or a loss decides your next hundred games. Look for your own mistake rather than the excuse, and keep your face still while you look for it.",
  tier: 4, rank: "8k", track: "judgement", size: 9, prereqs: ["classic-observing"], minutes: 5,
  author: "Joseki", sources: [CLASSIC_SOURCE], series: "classic", chapter: 8,
  steps: [
    {
      type: "info",
      setup: race,
      marks: [pt(3, 4), pt(6, 4)],
      text: "This chapter is about the player's state of mind, and it names one habit above the rest: attacking without caring about the attack coming back at you. Two black stones in the middle have two liberties. The two white stones beside them have three. Both marked points are tempting.",
    },
    {
      type: "choice",
      setup: race,
      toPlay: "b",
      text: "Black to play.",
      options: [
        { point: pt(3, 4), verdict: "best", text: "Your own group first. Three liberties and the open left side: your stones are out of danger, and White's two stones are now the ones short of breath." },
        { point: pt(6, 4), verdict: "poor", text: "Attack first, and White fills your liberties faster than you fill theirs. Two against three, with White to move after your first stone: White wins the race by one." },
      ],
    },
    {
      type: "info",
      setup: race,
      text: "The rest of the chapter reads like advice for after the game. Sure of yourself yet modest, you will often win; uncertain and proud, you will often lose. After a defeat, look for the reason in yourself and blame no one else. Whoever flatters themselves on a win is already losing their skill. And one plan in your head, the classic adds, is very little indeed.",
    },
  ],
};
