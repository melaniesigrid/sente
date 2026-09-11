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
    prompt: "Black to play. The white chain shares its liberties. Take them both.",
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
    prompt: "Black to play. The only move looks illegal. Is it?",
    explain: "Captures resolve before your own liberties are counted. Playing White's last liberty removes five stones, so your stone lands in open space.",
  },
  {
    id: "p5", rank: "15k", theme: "Life & Death",
    title: "Straight three: kill",
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
    title: "Straight three: live",
    setup: {
      b: [pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 0), pt(3, 1)],
      w: [pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 0), pt(4, 1)],
    },
    toPlay: "b", answers: [pt(1, 0)],
    prompt: "Now it's your group. Black to play and live.",
    explain: "Same vital point, opposite urgency: the center move splits the space into two real eyes. Whoever reaches the vital point first decides the group's fate: sente in miniature.",
  },
  /* ----------------------- THE CLASSICAL SHAPES -----------------------
     From here the problems are the eye shapes every collection opens with, and
     each one was solved exhaustively before it was written down: the killing
     move below is the ONLY move in the eye space that kills, and the search
     that says so is in problems.test.js, run on every build. */
  {
    id: "p7", rank: "10k", theme: "Life & Death",
    title: "Bulky five",
    setup: {
      w: [pt(2, 1), pt(3, 0), pt(3, 1), pt(0, 2), pt(1, 2), pt(2, 2)],
      b: [pt(4, 0), pt(4, 1), pt(3, 2), pt(0, 3), pt(1, 3), pt(2, 3)],
    },
    toPlay: "b", answers: [pt(1, 0)],
    prompt: "Five points of eye space, bunched. Black to play and kill.",
    explain: "The centre of the bulky five. A five-point space lives by dividing into two eyes, and this is the one point that belongs to both halves: take it and there is nothing left to divide. Play anywhere else in the space and White takes it instead and lives.",
  },
  {
    id: "p8", rank: "8k", theme: "Life & Death",
    title: "The flowered five",
    setup: {
      w: [pt(2, 0), pt(0, 0), pt(0, 2), pt(2, 2), pt(3, 1), pt(3, 2), pt(3, 0), pt(1, 3), pt(2, 3), pt(0, 3)],
      b: [pt(4, 1), pt(4, 2), pt(3, 3), pt(4, 0), pt(1, 4), pt(2, 4), pt(0, 4)],
    },
    toPlay: "b", answers: [pt(1, 1)],
    prompt: "The five points make a cross. Black to play and kill.",
    explain: "The middle of the cross, and it is the only move: it is the point every arm of the shape runs through. The same point is the only move that saves the group when White gets there first, which is what a vital point means: one square that both players want for opposite reasons.",
  },
  {
    id: "p9", rank: "3k", theme: "Life & Death",
    title: "Six points in the corner",
    setup: {
      w: [pt(3, 0), pt(3, 1), pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2)],
      b: [pt(4, 0), pt(4, 1), pt(4, 2), pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3)],
    },
    toPlay: "b", answers: [pt(1, 1)],
    prompt: "Six points of eye space in the corner, three by two. The proverb says six points in the corner live. Black to play and kill.",
    explain: "The 2-2 point. Six points normally do live, and this rectangle is the famous exception: the placement stops the space dividing into two halves that are each big enough, and there is no ko and no outside liberty to appeal to. Every other move in the space lets White live.",
  },
  /* ----------------------- SHAPE, FROM THE BOOK OF SHAPES ----------------------- */
  {
    id: "p10", rank: "13k", theme: "Shape",
    title: "The mouth that will not close",
    setup: { b: [pt(3, 3), pt(5, 3)], w: [pt(4, 2)] },
    toPlay: "b", answers: [pt(4, 3)],
    prompt: "Black has to join these two stones up. There is a tempting way and a correct way.",
    explain: "Solid, and nothing else. The tiger's mouth at the point below would normally connect, and it does not here: White cuts into the gap and joins the stone above into a chain with three liberties instead of dying with one. A tiger's mouth is a connection only while the intruder is alone.",
  },
  {
    id: "p11", rank: "9k", theme: "Shape",
    title: "The waist",
    setup: { w: [pt(4, 3), pt(5, 5)], b: [pt(3, 4), pt(6, 4)] },
    toPlay: "b", answers: [pt(4, 4)],
    prompt: "White's two stones are a knight's move apart, and Black has a stone on either side of the gap. Black to play.",
    explain: "Strike at the waist. With support on both sides the cutting stone is not alone: it joins into a chain with five liberties while White's two stones are left on three and four, separated, with nothing to attack. Without the two supporting stones this same move is an invitation to a fight rather than a cut.",
  },
  {
    id: "p12", rank: "11k", theme: "Shape",
    title: "Wedged",
    setup: { b: [pt(3, 2), pt(6, 2)], w: [pt(4, 2)] },
    toPlay: "b", answers: [pt(5, 2)],
    prompt: "White has wedged into a two-space extension. Black to play.",
    explain: "Block on the wider side. Black is not trying to keep both stones and does not need to: the wedge is left with two liberties between two black stones and cannot live, so it was never a cut. Choosing which side to block is the whole decision; hesitating and playing on top of the wedge hands White the better shape.",
  },
];
