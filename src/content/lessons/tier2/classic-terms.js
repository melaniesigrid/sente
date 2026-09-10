import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 18k · shape · On Names (Classic, ch. 11) ----------------------- */
export default {
  id: "classic-terms",
  title: "On Names",
  subtitle: "Chapter eleven: thirty-two names for the shapes",
  plain: "Naming a shape is how you stop reading it from scratch. Once a cut, a hane or a net has a name you know it at a glance, and your reading goes to the part of the board that is actually new.",
  tier: 2, rank: "18k", track: "shape", size: 9, prereqs: ["connect-cut"], minutes: 6,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 11,
  steps: [
    {
      type: "info",
      setup: { b: [pt(2, 2)], w: [] },
      marks: [pt(2, 4), pt(3, 3), pt(4, 3)],
      text: "The classic lists thirty-two names for the ways stones relate, and says players must still think of ten thousand variations. Three of them from one stone are marked: straight down with one empty point between is guan, the one-point jump; the next point at an angle is jian, the diagonal; one further along is fei, the knight's move.",
    },
    {
      type: "quiz",
      setup: { b: [pt(4, 2)], w: [pt(4, 6)] },
      toPlay: "b",
      answers: [pt(4, 4)],
      text: "Black to play guan, the one-point jump, from the black stone toward the centre.",
      success: "Guan. Fast, and hard to cut when the stones around it are yours.",
      hint: "Straight toward the centre, leaving exactly one empty point between.",
      wrongText: "Not a one-point jump. One empty point between, in a straight line.",
    },
    {
      type: "quiz",
      setup: { b: [pt(2, 2)], w: [] },
      toPlay: "b",
      answers: [pt(4, 3), pt(3, 4)],
      text: "Now fei, the knight's move, from the black stone toward the centre. There are two.",
      success: "Fei. Two along and one across, the shape of a knight in chess.",
      hint: "Two points one way, one point the other.",
      wrongText: "Not a knight's move. Two along, one across.",
    },
    {
      type: "quiz",
      setup: { b: [pt(3, 3), pt(4, 4)], w: [pt(4, 3)] },
      toPlay: "w",
      answers: [pt(3, 4)],
      text: "White to play duan, the cut. The two black stones touch only at the corners.",
      success: "Duan. Two black stones that were one shape are now two, and each must look after itself.",
      hint: "The other point where the two black stones meet diagonally.",
      wrongText: "That does not separate them. Find the second diagonal point.",
    },
    {
      type: "quiz",
      setup: { b: [pt(3, 3), pt(4, 4)], w: [pt(4, 3)] },
      toPlay: "b",
      answers: [pt(3, 4)],
      text: "The other seat. Black to play zhan, the connection, before White can cut.",
      success: "Zhan. The classic names the humble connection alongside the ladder and the ko; every player needs it.",
      hint: "Fill the point White would cut on.",
      wrongText: "White can still cut. Fill the cutting point itself.",
    },
    {
      type: "info",
      setup: { b: [pt(3, 3), pt(4, 4), pt(3, 4)], w: [pt(4, 3)] },
      text: "Some of the other names you already know by their Japanese forms: da is atari, jie is ko, zheng is the ladder, li the descent to the edge, dian the placement inside an eye. The classic ends the chapter with an older line: the names must be set right. Then the shapes can be seen.",
    },
  ],
};
