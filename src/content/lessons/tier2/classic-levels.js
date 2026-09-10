import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 16k · judgement · On the Nine Levels (Classic, ch. 12) -----------------------
   Three problems, each one move deeper than the last: a plain capture, a
   snapback, then a ladder to the corner. */
export default {
  id: "classic-levels",
  title: "On the Nine Levels",
  subtitle: "Chapter twelve: reading one move deeper",
  plain: "The nine levels measure how far ahead you see, not how many games you have played. You move up a step when the reading you used to grind out slowly becomes the thing you notice at once.",
  tier: 2, rank: "16k", track: "judgement", size: 9, prereqs: ["atari-escape", "two-eyes"], minutes: 6,
  author: "Joseki", sources: [CLASSIC_SOURCE], series: "classic", chapter: 12,
  steps: [
    {
      type: "info",
      setup: { b: [], w: [] },
      text: "The classic ranks players on nine levels, from being in the spirit at the top, through enlightenment, concreteness, understanding change, wisdom, ability and strength, down to being quite inept and truly lost. The difference between the levels is mostly one thing: how far you read before you play. Three problems follow, each one move deeper.",
    },
    {
      type: "quiz",
      setup: { b: [pt(3, 4), pt(5, 4), pt(4, 3)], w: [pt(4, 4)] },
      toPlay: "b",
      answers: [pt(4, 5)],
      text: "One move deep. Black to play and capture.",
      success: "One liberty, one move. This is the level the classic calls strength.",
      hint: "Fill the white stone's last liberty.",
    },
    {
      type: "quiz",
      setup: { b: [pt(1, 0), pt(1, 1), pt(2, 2), pt(4, 1), pt(3, 2)], w: [pt(2, 0), pt(2, 1), pt(4, 0)] },
      toPlay: "b",
      answers: [pt(3, 0)],
      text: "Two moves deep. Black to play and capture the two white stones on the edge.",
      success: "The throw-in. White can capture it, but then White's three stones have one liberty, on the point you just left, and you take them back. A snapback.",
      hint: "The move that looks like self-atari is the one to read.",
      refutations: [
        {
          move: pt(3, 1), reply: pt(3, 0),
          text: "Atari from the outside, and White connects along the edge to the stone on the right. Nothing captured.",
        },
      ],
    },
    {
      type: "sequence",
      setup: { b: [pt(5, 2), pt(6, 3), pt(7, 3)], w: [pt(6, 2)] },
      toPlay: "b",
      moves: [pt(6, 1), pt(7, 2), pt(8, 2), pt(7, 1), pt(7, 0), pt(8, 1), pt(8, 0)],
      commentary: [
        "Atari from above. White has one way out.",
        "White runs.",
        "Atari again, from the side. Each time White extends, the chain keeps two liberties and then loses one.",
        "White runs again, toward the corner.",
        "Atari from above.",
        "White's last extension. One liberty left, in the corner.",
        "Captured. Zheng, the ladder: seven moves read before the first stone was placed.",
      ],
      text: "Seven moves deep. You are Black. Chase the white stone into the corner with a ladder; the scripted White runs each time.",
      hint: "Atari from the side that leaves White only a diagonal step toward the corner.",
      success: "A ladder is decided before it starts. Read it to the end, then play the first atari with a clear conscience.",
    },
    {
      type: "info",
      setup: { b: [pt(5, 2), pt(6, 3), pt(7, 3), pt(6, 1), pt(8, 2), pt(7, 0), pt(8, 0)], w: [] },
      text: "The classic closes the chapter with a line from the old commentaries: the superior person knows from birth, the next learns by study, and the inferior studies only after running into difficulty. Read before you play, and the difficulty never arrives.",
    },
  ],
};
