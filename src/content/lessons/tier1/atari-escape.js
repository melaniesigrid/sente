import { pt } from "../../positions.js";

/* ----------------------- 23k · tactics · Escaping Atari ----------------------- */
export default {
  id: "atari-escape",
  title: "Escaping Atari",
  subtitle: "Extending from atari, and when running fails",
  plain: "One liberty left means one move left. Extending toward open space buys air, but when the escape route runs into your opponent's stones the stone is already lost, and the move is worth more somewhere else.",
  tier: 1, rank: "23k", track: "tactics", size: 9, prereqs: ["liberties"], minutes: 5,
  author: "Joseki", sources: [],
  steps: [
    {
      type: "info",
      setup: { b: [pt(4, 2)], w: [pt(3, 2), pt(4, 1), pt(5, 2)] },
      marks: [pt(4, 3)],
      text: "One liberty left. The marked point is the only way out. Extending there makes a two-stone chain with three liberties, and the danger is over for now.",
    },
    {
      type: "quiz",
      setup: { b: [pt(4, 2)], w: [pt(3, 2), pt(4, 1), pt(5, 2)] },
      toPlay: "b",
      answers: [pt(4, 3)],
      text: "Black to play. Extend out of atari.",
      success: "Three liberties. Notice the direction: toward the open centre, away from the edge.",
      hint: "Play on the stone's last liberty.",
    },
    {
      type: "quiz",
      setup: {
        w: [pt(0, 1), pt(1, 0), pt(2, 1), pt(0, 2), pt(2, 2), pt(6, 6)],
        b: [pt(1, 1), pt(5, 6), pt(6, 5), pt(7, 6)],
      },
      toPlay: "b",
      answers: [pt(6, 7)],
      text: "Black to play. The corner stone is in atari, but running only leads into more white stones. Count its liberties after extending before you decide, then look at the rest of the board.",
      success: "Right. The corner stone was already lost; running would have lost two. The white stone in the centre was in atari too, and that one you can take.",
      hint: "If extending leaves you with one liberty again, the stone is not saveable. Is anything else in atari?",
      refutations: [
        {
          move: pt(1, 2), reply: pt(1, 3),
          text: "Running only fed White a second stone. One liberty became one liberty, and White closed it.",
        },
      ],
    },
    {
      type: "sequence",
      setup: { b: [pt(4, 3)], w: [pt(3, 3), pt(4, 2), pt(5, 3)] },
      toPlay: "b",
      moves: [pt(4, 4), pt(4, 5), pt(3, 4)],
      commentary: [
        "Extend: three liberties.",
        "White keeps chasing.",
        "Turn toward open space. Three liberties again, and White is running out of stones to chase with.",
      ],
      text: "A chase. You are Black: keep extending toward the widest space until the chase stops making sense for White.",
      hint: "Each move should leave your chain with more liberties than it had.",
      success: "Escape is not one move; it is a direction. Run toward the space where your liberties grow.",
    },
  ],
};
