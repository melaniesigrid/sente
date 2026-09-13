/* ----------------------- TIER 6 · DAN (1d–4d, 19x19) -----------------------
   The syllabus is in docs/designs/lesson-library.md. Six of the eight are
   authored: aji, amashi, the corner shape the proverb gets wrong, ko as a
   thing you build rather than a thing that happens to you, the last three
   points of a close game, and how to read an engine without being led by it.
   Professional openings and endgame counting in miai values are still open.

   The two newest are the two the tier was waiting on tooling for.
   `endgame-last-points` is solved exactly by `tools/lessons/endgame.mjs`,
   which plays the rest of a game out under minimax on the final score, so a
   dan endgame lesson can quote a number instead of asserting one.
   `studying-with-analysis` is measured on the shipped human network with
   `tools/joseki/policy.py`, and its choice step carries the network's own
   weights, which means the verifier and not the author decides which option
   is best.

   Tier 6 is the one tier where a lesson may be mostly argument. The engine can
   prove a capture and cannot prove a judgement, so these lessons verify what
   can be verified, state the rest as judgement, and say which is which. */
import ajiAndTiming from "./aji-and-timing.js";
import lifeAndDeathTesuji from "./life-and-death-tesuji.js";
import thicknessIntoPoints from "./thickness-into-points.js";
import koAsStrategy from "./ko-as-strategy.js";
import endgameLastPoints from "./endgame-last-points.js";
import studyingWithAnalysis from "./studying-with-analysis.js";

export const TIER6 = [
  ajiAndTiming, lifeAndDeathTesuji, thicknessIntoPoints, koAsStrategy,
  endgameLastPoints, studyingWithAnalysis,
];
