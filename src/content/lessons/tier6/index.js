/* ----------------------- TIER 6 · DAN (1d–4d, 19x19) -----------------------
   The syllabus is in docs/designs/lesson-library.md. Four of the eight are
   authored: aji, amashi, the corner shape the proverb gets wrong, and ko as a
   thing you build rather than a thing that happens to you. The rest (
   professional openings, endgame counting in miai values, whole-board
   thinking, and reading an engine honestly) are still open, and the last of
   them waits on Phase 4 analysis.

   Tier 6 is the one tier where a lesson may be mostly argument. The engine can
   prove a capture and cannot prove a judgement, so these lessons verify what
   can be verified, state the rest as judgement, and say which is which. */
import ajiAndTiming from "./aji-and-timing.js";
import lifeAndDeathTesuji from "./life-and-death-tesuji.js";
import thicknessIntoPoints from "./thickness-into-points.js";
import koAsStrategy from "./ko-as-strategy.js";

export const TIER6 = [ajiAndTiming, lifeAndDeathTesuji, thicknessIntoPoints, koAsStrategy];
