import { pt } from "./positions.js";

/* ----------------------- THE WELCOME DEMO -----------------------
   Four beats that make go playable: where a stone goes, how it breathes, how it is
   taken, and what anybody is actually trying to do.

   This is shaped exactly like a library lesson and is played by the same
   `LessonPlayer`, so the step behaviour, the timings and the board are the ones used
   everywhere else. It is deliberately NOT in the library index: tier 1 ships the ten
   lessons the design doc names, and that list is pinned by a test. Its positions are
   verified against the engine by `welcome.test.js` instead, to the same standard.

   The house voice applies here more than anywhere: this is the first thing a person
   reads. No exclamation marks, nothing breathless, no promises about how deep the
   game is. Show them a capture and let the game make its own case. */

export const WELCOME_LESSON = {
  id: "welcome",
  title: "Your first stones",
  subtitle: "Everything you need to start a game",
  tier: 1, rank: "30k", track: "basics", size: 9, prereqs: [], minutes: 3,
  author: "Joseki", sources: [],
  steps: [
    {
      type: "info",
      setup: { b: [pt(2, 6), pt(4, 4)], w: [pt(6, 2), pt(4, 5)] },
      text: "Stones sit on the crossings, not in the squares. Black plays first, then White, one stone at a time. A stone that has been played never moves again: the board only ever gains stones, or loses them all at once when they are captured.",
    },
    {
      type: "info",
      setup: { b: [pt(4, 4)] },
      marks: [pt(3, 4), pt(5, 4), pt(4, 3), pt(4, 5)],
      text: "A stone breathes through the empty points beside it, along the lines. This one has four. On the edge it would have three, in the corner two. Take away the last one and the stone comes off the board. That is the only rule you need to hold on to.",
    },
    {
      type: "quiz",
      setup: { b: [pt(3, 4), pt(5, 4), pt(4, 3)], w: [pt(4, 4)] },
      toPlay: "b",
      answers: [pt(4, 5)],
      text: "The white stone has one breath left. You are Black. Take it.",
      hint: "Find the one empty point still touching the white stone, and play there.",
      success: "That is a capture. The white stone comes off the board and is worth a point to you at the end. Everything else in go is built on this.",
      wrongText: "Not there. Look for the empty point still touching the white stone.",
    },
    {
      type: "info",
      setup: {
        b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(1, 3), pt(0, 3)],
        w: [pt(6, 8), pt(6, 7), pt(7, 6), pt(8, 6)],
      },
      text: "Captures are how you argue. Territory is how you win. At the end, each side counts the empty points it has walled off (Black in the top left here, White in the bottom right) and the larger share takes the game. You now know enough to play one.",
    },
  ],
};

/** The steps, for a caller that wants to show progress through the demo. */
export const WELCOME_STEPS = WELCOME_LESSON.steps.length;
