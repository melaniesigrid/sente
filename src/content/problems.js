/* ----------------------- TSUMEGO PROBLEMS ------------------------
   Classical public-domain shapes. Each position liberty-checked by
   hand and engine-verified; the data shape is SGF-import ready for
   classical collections (Guanzi Pu, Xuanxuan Qijing). */
import { pt } from "./positions.js";

export const PROBLEMS = [
  {
    id: "p1", rank: "25k", theme: "Capture",
    title: "One breath left",
    setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
    toPlay: "b", answers: [pt(4, 5)],
    prompt: "Black to play. Capture the white stone.",
    explain: "The stone's last liberty is below it. Zero liberties = off the board.",
  },
  {
    id: "p2", rank: "22k", theme: "Capture",
    title: "Two for one",
    setup: { b: [pt(1, 2), pt(1, 3), pt(2, 1), pt(3, 2), pt(3, 3)], w: [pt(2, 2), pt(2, 3)] },
    toPlay: "b", answers: [pt(2, 4)],
    prompt: "Black to play. The white chain shares its liberties — take them both.",
    explain: "Connected stones are counted as one chain. Their single shared liberty was underneath.",
  },
  {
    id: "p3", rank: "20k", theme: "Escape",
    title: "Breathe out",
    setup: { b: [pt(4, 4)], w: [pt(3, 4), pt(4, 3), pt(5, 4)] },
    toPlay: "b", answers: [pt(4, 5)],
    prompt: "Black is in atari. Save the stone.",
    explain: "Extending to the open side makes a two-stone chain with three liberties. Never pass a group in atari without reading it.",
  },
  {
    id: "p4", rank: "18k", theme: "Capture",
    title: "The false suicide",
    setup: {
      w: [pt(0, 0), pt(1, 0), pt(0, 1), pt(0, 2), pt(1, 2)],
      b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(0, 3), pt(1, 3)],
    },
    toPlay: "b", answers: [pt(1, 1)],
    prompt: "Black to play. The only move looks illegal — is it?",
    explain: "Captures resolve before your own liberties are counted. Playing White's last liberty removes five stones, so your stone lands in open space.",
  },
  {
    id: "p5", rank: "15k", theme: "Life & Death",
    title: "Straight three — kill",
    setup: {
      w: [pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 0), pt(3, 1)],
      b: [pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 0), pt(4, 1)],
    },
    toPlay: "b", answers: [pt(1, 0)],
    prompt: "White's eye space is three points in a row. Black to play and kill.",
    explain: "The center of a straight three is the vital point. On either end instead, White plays the center herself and splits the space into two eyes. This shape is the first entry in every classical life-and-death collection.",
  },
  {
    id: "p6", rank: "15k", theme: "Life & Death",
    title: "Straight three — live",
    setup: {
      b: [pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 0), pt(3, 1)],
      w: [pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 0), pt(4, 1)],
    },
    toPlay: "b", answers: [pt(1, 0)],
    prompt: "Now it's your group. Black to play and live.",
    explain: "Same vital point, opposite urgency: the center move splits the space into two real eyes. Whoever reaches the vital point first decides the group's fate — sente in miniature.",
  },
];
