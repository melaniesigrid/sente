import { pt } from "../../positions.js";

/* ----------------------- 26k · life · The Ko Rule ----------------------- */
const koShape = {
  b: [pt(3, 2), pt(2, 3), pt(3, 4)],
  w: [pt(3, 3), pt(4, 2), pt(5, 3), pt(4, 4)],
};

export default {
  id: "ko",
  title: "The Ko Rule",
  subtitle: "No infinite loops",
  plain: "Some shapes let each side capture straight back forever, so the rules forbid recreating the position you just left. You have to threaten something else first, which turns a loop into a bargain.",
  tier: 1, rank: "26k", track: "life", size: 9, prereqs: ["liberties"], minutes: 5,
  author: "Joseki", sources: [],
  steps: [
    {
      type: "info",
      setup: koShape,
      marks: [pt(4, 3)],
      text: "This mirrored shape is a ko. The white stone in the middle has one liberty, but capturing it hands White the identical capture back.",
    },
    {
      type: "quiz",
      setup: koShape,
      toPlay: "b",
      answers: [pt(4, 3)],
      text: "Take the ko: capture the white stone.",
      success: "Captured, and now the ko rule bites: White may not recapture immediately, because that would repeat the whole-board position. White must play elsewhere first (a ko threat), and only then return.",
      hint: "Fill White's last liberty.",
    },
    {
      type: "sequence",
      setup: koShape,
      toPlay: "b",
      moves: [pt(4, 3), pt(7, 7), pt(7, 6), pt(3, 3)],
      commentary: [
        "Black takes the ko.",
        "White cannot retake, so White plays elsewhere: a ko threat. Pretend this one matters.",
        "Black answers the threat.",
        "The position has changed, so White may retake. Now it is Black who needs a threat.",
      ],
      text: "Play through a ko exchange. You are Black: take the ko, then answer White's threat.",
      hint: "Follow the line: first the capture, then reply to the threat.",
      success: "That is the whole rhythm of a ko: take, threat, answer, retake.",
    },
    {
      type: "info",
      setup: {
        b: [pt(3, 2), pt(2, 3), pt(3, 4), pt(4, 3)],
        w: [pt(4, 2), pt(5, 3), pt(4, 4)],
      },
      marks: [pt(3, 3)],
      text: "The marked point is 'hot' for one turn. Ko fights are where games swing: threats, timing, and knowing when a ko is bigger than the board around it. A full ko-fighting module is on the curriculum roadmap.",
    },
  ],
};
