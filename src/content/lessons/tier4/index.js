/* ----------------------- TIER 4 · CRAFTSMAN (10k–5k, 19x19) -----------------------
   The syllabus is in docs/designs/lesson-library.md. The Classic series
   (Zhang Ni's thirteen chapters) is spread across tiers 2 to 5. The endgame
   book (Guanzi Pu) starts here, because the endgame is where a craftsman
   starts losing games by points rather than by capture. */
import guanziGoteAlternates from "./guanzi-gote-alternates.js";
import guanziFirstLineHane from "./guanzi-first-line-hane.js";
import classicObserving from "./classic-observing.js";
import classicFeelings from "./classic-feelings.js";
import classicCorrectness from "./classic-correctness.js";

export const TIER4 = [guanziGoteAlternates, guanziFirstLineHane, classicObserving, classicFeelings, classicCorrectness];
