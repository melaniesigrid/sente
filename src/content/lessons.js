/* ----------------------- LESSON CONTENT ------------------------
   Guided replays with quiz gates. Every scripted position below was
   verified against the engine rules (see verification harness). */
import { pt } from "./positions.js";

export const LESSONS = [
  {
    id: "liberties",
    title: "Liberties & Capture",
    subtitle: "The one rule everything grows from",
    steps: [
      {
        type: "info",
        setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
        marks: [pt(4, 5)],
        text: "Every stone lives on its empty adjacent points — its liberties. This white stone started with four; Black has taken three. One liberty left means atari.",
      },
      {
        type: "quiz",
        setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
        toPlay: "b",
        answers: [pt(4, 5)],
        text: "Black to play. Fill White's last liberty and capture the stone.",
        success: "Captured. A stone or chain with zero liberties comes off the board immediately.",
        hint: "Which empty point touches the white stone?",
      },
      {
        type: "quiz",
        setup: { b: [pt(1, 2), pt(1, 3), pt(2, 1), pt(3, 2), pt(3, 3)], w: [pt(2, 2), pt(2, 3)] },
        toPlay: "b",
        answers: [pt(2, 4)],
        text: "Connected stones share liberties and live or die together. This white pair has a single liberty left — capture both.",
        success: "Both stones fall at once. Chains are one organism: count liberties for the group, never the stone.",
        hint: "Trace the white pair's shared border. Only one point is still open.",
      },
      {
        type: "quiz",
        setup: { b: [pt(4, 4)], w: [pt(3, 4), pt(4, 3), pt(5, 4)] },
        toPlay: "b",
        answers: [pt(4, 5)],
        text: "Now defend. Your stone is in atari — extend to its last liberty and breathe.",
        success: "The new two-stone chain has three liberties. Extending out of atari is the first reflex to train until it's automatic.",
        hint: "Run toward the open side.",
      },
    ],
  },
  {
    id: "no-liberty-capture",
    title: "Playing Inside",
    subtitle: "A 'suicide' point that isn't",
    steps: [
      {
        type: "info",
        setup: {
          w: [pt(0, 0), pt(1, 0), pt(0, 1), pt(0, 2), pt(1, 2)],
          b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(0, 3), pt(1, 3)],
        },
        marks: [pt(1, 1)],
        text: "Suicide is illegal — you may not play a stone that ends its own chain with zero liberties. But there is one glorious exception.",
      },
      {
        type: "quiz",
        setup: {
          w: [pt(0, 0), pt(1, 0), pt(0, 1), pt(0, 2), pt(1, 2)],
          b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(0, 3), pt(1, 3)],
        },
        toPlay: "b",
        answers: [pt(1, 1)],
        text: "The marked point is White's last liberty. Black to play — the move looks like suicide, but captures resolve first.",
        success: "Five stones captured. Removal of the opponent happens before your own liberties are counted — the point was never suicide at all.",
        hint: "Count White's liberties before you count your own.",
      },
    ],
  },
  {
    id: "ko",
    title: "The Ko Rule",
    subtitle: "No infinite loops",
    steps: [
      {
        type: "info",
        setup: {
          b: [pt(3, 2), pt(2, 3), pt(3, 4)],
          w: [pt(3, 3), pt(4, 2), pt(5, 3), pt(4, 4)],
        },
        marks: [pt(4, 3)],
        text: "This mirrored shape is a ko. The white stone in the middle has one liberty — but capturing it hands White the identical capture back.",
      },
      {
        type: "quiz",
        setup: {
          b: [pt(3, 2), pt(2, 3), pt(3, 4)],
          w: [pt(3, 3), pt(4, 2), pt(5, 3), pt(4, 4)],
        },
        toPlay: "b",
        answers: [pt(4, 3)],
        text: "Take the ko: capture the white stone.",
        success: "Captured — and now the ko rule bites: White may NOT recapture immediately, because that would repeat the whole-board position. White must play elsewhere first (a ko threat), and only then return.",
        hint: "Fill White's last liberty.",
      },
      {
        type: "info",
        setup: {
          b: [pt(3, 2), pt(2, 3), pt(3, 4), pt(4, 3)],
          w: [pt(4, 2), pt(5, 3), pt(4, 4)],
        },
        marks: [pt(3, 3)],
        text: "The marked point is 'hot' for one turn. Ko fights are where games swing — threats, timing, and knowing when a ko is bigger than the board around it. A full ko-fighting module is on the curriculum roadmap.",
      },
    ],
  },
  {
    id: "opening",
    title: "Where to Begin",
    subtitle: "Corners, sides, center — and the common starts",
    steps: [
      {
        type: "info",
        setup: { b: [], w: [] },
        marks: [pt(2, 2), pt(6, 2), pt(2, 6), pt(6, 6), pt(4, 4)],
        text: "Territory is cheapest where walls already exist. Corners need two directions of defense, sides three, the center four — so openings begin in corners. On 19×19 the classical corner starts are the 4-4 (hoshi, balanced influence), 3-4 (komoku, territory-leaning), and 3-3 (san-san, instant corner). On this 9×9 the star points and tengen play those roles.",
      },
      {
        type: "quiz",
        setup: { b: [], w: [] },
        toPlay: "b",
        answers: [pt(2, 2), pt(6, 2), pt(2, 6), pt(6, 6), pt(4, 4)],
        text: "Empty board, Black to play. Take a big point.",
        success: "Good. Efficiency first: claim the cheap territory before contact fighting starts. The full joseki module — canonical 4-4 and 3-4 sequences with deviations and punishments, engine-verified — is next on the curriculum roadmap.",
        hint: "Corners are worth more than the middle of a side.",
      },
    ],
  },
];
