/* ----------------------- TIER 1 · FOUNDATIONS (30k–20k, 9x9) ----------------------- */
import liberties from "./liberties.js";
import noLibertyCapture from "./no-liberty-capture.js";
import ko from "./ko.js";
import twoEyes from "./two-eyes.js";
import connectCut from "./connect-cut.js";
import atariEscape from "./atari-escape.js";
import edgeFirstLine from "./edge-first-line.js";
import territoryCount from "./territory-count.js";
import passingAndEnding from "./passing-and-ending.js";
import first9x9Opening from "./first-9x9-opening.js";

export const TIER1 = [
  liberties, noLibertyCapture, ko, twoEyes, connectCut, atariEscape,
  edgeFirstLine, territoryCount, passingAndEnding, first9x9Opening,
];
