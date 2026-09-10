/* ----------------------- TIER 2 · APPRENTICE (20k–15k, 9x9 and 13x13) -----------------------
   The syllabus is in docs/designs/lesson-library.md. The Classic series
   (Zhang Ni's thirteen chapters) is spread across tiers 2 to 5. The Proverbs
   start here too: folk wisdom is for the player who has just learned the rules
   and needs a form to drill. */
import proverbLadder from "./proverb-ladder.js";
import proverbBambooJoint from "./proverb-bamboo-joint.js";
import classicBoard from "./classic-board.js";
import classicCalculation from "./classic-calculation.js";
import classicTerms from "./classic-terms.js";
import classicKnowYourself from "./classic-know-yourself.js";
import classicLevels from "./classic-levels.js";

export const TIER2 = [proverbLadder, proverbBambooJoint, classicBoard, classicCalculation, classicTerms, classicKnowYourself, classicLevels];
