import { pt } from "../../positions.js";

/* ----------------------- 24k · life · Two Eyes ----------------------- */
// A black group along the top edge, sealed by white, with room for eyes at
// (0,0), (1,0), (2,0). With the middle point taken it has two eyes and lives.
const wall = [pt(4, 0), pt(4, 1), pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 2)];
const alive = { b: [pt(1, 0), pt(3, 0), pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 1)], w: wall };
const open = { b: [pt(3, 0), pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 1)], w: wall };

export default {
  id: "two-eyes",
  title: "Two Eyes",
  subtitle: "Two eyes live, one eye dies",
  tier: 1, rank: "24k", track: "life", size: 9, prereqs: ["no-liberty-capture"], minutes: 5,
  author: "Sente", sources: [],
  steps: [
    {
      type: "info",
      setup: alive,
      marks: [pt(0, 0), pt(2, 0)],
      text: "This black group is surrounded, yet it can never be captured. Its two marked liberties are eyes: White cannot play either one, because each would be suicide. Two eyes is life.",
    },
    {
      type: "count",
      setup: alive,
      question: "How many separate eyes does the black group have?",
      answer: 2, tolerance: 0,
      hint: "An eye is an empty point White is never allowed to play.",
      success: "Two. White may fill outside liberties forever; the group is alive.",
    },
    {
      type: "quiz",
      setup: open,
      toPlay: "b",
      answers: [pt(1, 0)],
      text: "Black to play. The eye space is three points in a row. One move makes two eyes.",
      success: "The middle point splits the space into two separate eyes. Alive, permanently.",
      hint: "Which single point leaves an empty point on each side of it?",
      refutations: [
        {
          move: pt(0, 0), reply: pt(1, 0),
          text: "White takes the middle. Now whatever Black does, only one eye remains: the group is dead.",
        },
      ],
    },
    {
      type: "quiz",
      setup: open,
      toPlay: "w",
      answers: [pt(1, 0)],
      text: "Now the other seat. White to play and kill: the same point matters to both sides.",
      success: "One stone in the middle and the black group can only ever make one eye. The vital point of a shape is the same for attacker and defender.",
      hint: "Where would Black play to live? Play there first.",
    },
  ],
};
