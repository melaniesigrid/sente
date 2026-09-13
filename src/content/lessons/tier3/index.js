/* ----------------------- TIER 3 · JOURNEYMAN (15k–10k, 13x13 and 19x19) -----------------------
   The syllabus is in docs/designs/lesson-library.md. The Classic series
   (Zhang Ni's thirteen chapters) is spread across tiers 2 to 5. */
import classicTerritory from "./classic-territory.js";
import classicConflict from "./classic-conflict.js";
import classicEmptiness from "./classic-emptiness.js";
import classicMiscellany from "./classic-miscellany.js";
import shapeTigersMouth from "./shape-tigers-mouth.js";
import shapePonnuki from "./shape-ponnuki.js";
import openingBigPoints from "./opening-big-points.js";
import lifeBigEye from "./life-big-eye.js";
import lifeCornerLive from "./life-corner-live.js";

export const TIER3 = [
  classicTerritory, classicConflict, classicEmptiness, classicMiscellany,
  shapeTigersMouth, shapePonnuki,
  openingBigPoints,
  lifeBigEye, lifeCornerLive,
];
