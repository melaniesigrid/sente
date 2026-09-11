/* ----------------------- TIER 3 · JOURNEYMAN (15k–10k, 13x13 and 19x19) -----------------------
   The syllabus is in docs/designs/lesson-library.md. The Classic series
   (Zhang Ni's thirteen chapters) is spread across tiers 2 to 5. */
import classicTerritory from "./classic-territory.js";
import classicConflict from "./classic-conflict.js";
import classicEmptiness from "./classic-emptiness.js";
import classicMiscellany from "./classic-miscellany.js";
import fundamentalsLadder from "./fundamentals-ladder.js";
import fundamentalsHaneAtTheHead from "./fundamentals-hane-at-the-head.js";
import marvelsNet from "./marvels-net.js";
import libertyRace from "./liberty-race.js";

export const TIER3 = [
  classicTerritory, classicConflict, classicEmptiness, classicMiscellany,
  fundamentalsLadder, fundamentalsHaneAtTheHead,
  marvelsNet, libertyRace,
];
