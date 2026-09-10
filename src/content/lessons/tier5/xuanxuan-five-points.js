import { pt } from "../../positions.js";
import { XUANXUAN_SOURCE } from "../../xuanxuan.js";

/* ----------------------- 3k · life · Five Points and Five Points (Xuanxuan Qijing) -----------------------
   Two white groups in the corner, each with exactly five points of eyespace,
   and opposite verdicts. The solver in xuanxuan.test.js settles both:

     five in a row      no black move kills it
     four with a foot   exactly one black move kills it, at (2,1)

   Same number of points, same single white chain of thirteen stones, and the
   only difference is the arrangement. That is the whole content of the
   lesson, and it is why an eyespace is counted by its shape and not its size. */

/* The white wall is rows 0 to 2 minus the eyespace; Black seals the outside. */
const OUTSIDE = [pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3), pt(6, 3), pt(6, 0), pt(6, 1), pt(6, 2)];

const straight = {
  w: [pt(0, 0), pt(1, 0), pt(2, 0), pt(3, 0), pt(4, 0), pt(5, 0), pt(5, 1),
      pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 2)],
  b: OUTSIDE,
};

const bulky = {
  w: [pt(0, 0), pt(1, 0), pt(2, 0), pt(3, 0), pt(4, 0), pt(5, 0), pt(0, 1), pt(5, 1),
      pt(0, 2), pt(1, 2), pt(3, 2), pt(4, 2), pt(5, 2)],
  b: OUTSIDE,
};

export default {
  id: "xuanxuan-five-points",
  title: "Five Points and Five Points",
  subtitle: "Two eyespaces of the same size, one alive and one dead",
  plain: "An eyespace is judged by its shape, not by how many points it holds. Five points in a straight line cannot be killed, and the same five rearranged as four with a foot die to a single placement.",
  tier: 5, rank: "3k", track: "life", size: 9, prereqs: ["two-eyes", "classic-corner-shapes"], minutes: 8,
  author: "Sente", sources: [XUANXUAN_SOURCE], book: "xuanxuan",
  steps: [
    {
      type: "info",
      setup: straight,
      marks: [pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 1), pt(4, 1)],
      text: "White has five points of eyespace, marked, in a straight line. This group is alive and there is nothing to be done about it. Every one of the five has been tried against a solver and not one of them kills: whatever Black plays, White answers and finishes with two eyes.",
    },
    {
      type: "info",
      setup: bulky,
      marks: [pt(1, 1), pt(2, 1), pt(3, 1), pt(4, 1), pt(2, 2)],
      text: "Now the same five points, rearranged: four in a row with one below. White is the same single chain of thirteen stones, sealed in the same way, with the same amount of room. This group is dead, and exactly one of the five points kills it.",
    },
    {
      type: "quiz",
      setup: bulky,
      toPlay: "b",
      answers: [pt(2, 1)],
      text: "Black to play and kill.",
      success: "The point above the foot. Whatever White does now, the space breaks into one eye and a gap that cannot become a second.",
      hint: "The shape has a centre of gravity. Find the point that the two arms of it both depend on.",
      refutations: [
        {
          move: pt(1, 1), reply: pt(2, 1),
          text: "Off by one. White takes the point you left and lives; the solver confirms every one of the other four first moves lets White survive.",
        },
        {
          move: pt(4, 1), reply: pt(2, 1),
          text: "The far end takes a point away and no more. White takes the middle and has room for two eyes.",
        },
      ],
    },
    {
      type: "info",
      setup: bulky,
      text: "Five points live and five points die, and the only difference between them is arrangement. This is why strong players look at an eyespace and name its shape rather than count its size. The collection this lesson comes from is nearly four hundred problems long and almost all of it is this one question asked in harder and harder ways: where is the point the shape stands on.",
    },
  ],
};
