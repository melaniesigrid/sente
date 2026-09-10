import { pt } from "../../positions.js";
import { CLASSIC_SOURCE } from "../../classic.js";

/* ----------------------- 3k · life · The Named Corner Shapes (Classic, ch. 13) -----------------------
   Chapter thirteen is the oldest life-and-death catalogue we have: it names
   corner shapes and states flatly which of them live and which die. Two of
   them are here, and both of the classic's verdicts hold up against the
   engine.

   Dead: four white stones bent around a two-point corner eyespace. Black
   plays inside, White captures, Black plays inside again and takes all five.
   Alive: six white stones around a straight four on the edge. Whichever
   middle point Black takes, White takes the other, and Black's follow-up on
   the far side is not merely bad but illegal. Both lines are replayed by the
   library verifier in npm test, so the chapter is checked, not trusted. */

const dead = {
  w: [pt(1, 0), pt(1, 1), pt(0, 2), pt(1, 2)],
  b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(1, 3), pt(0, 3)],
};

const alive = {
  w: [pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 1), pt(4, 1), pt(4, 0)],
  b: [pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 2), pt(5, 1), pt(5, 0)],
};

export default {
  id: "classic-corner-shapes",
  title: "The Named Corner Shapes",
  subtitle: "Chapter thirteen: the shapes the classic says are already settled",
  tier: 5, rank: "3k", track: "life", size: 9, prereqs: ["two-eyes", "classic-miscellany"], minutes: 8,
  author: "Sente", sources: [CLASSIC_SOURCE], series: "classic", chapter: 13,
  steps: [
    {
      type: "info",
      setup: dead,
      marks: [pt(0, 0), pt(0, 1)],
      text: "Chapter thirteen stops philosophising and lists shapes. It gives each one a name and then simply says whether it lives or dies. This is the first of them: four white stones bent around two points in the corner. The classic says such a group is certainly dead, and it says it without an argument, the way you would state the size of a coin.",
    },
    {
      type: "sequence",
      setup: dead,
      toPlay: "b",
      moves: [pt(0, 0), pt(0, 1), pt(0, 0)],
      text: "Black to play. Three moves settle it.",
      hint: "Play inside the two-point space and let White capture. Then play there again.",
      commentary: [
        "Black plays inside. White has one liberty left, at the other corner point.",
        "White captures the stone, which is the only move that keeps the group breathing. The eyespace is now a single point.",
        "Black plays there again. This time the stone takes the whole group with it: a two-point eyespace can never be made into two eyes, so the shape was dead before the first move was played.",
      ],
    },
    {
      type: "info",
      setup: alive,
      marks: [pt(1, 0), pt(2, 0)],
      text: "The second shape is six stones holding four points in a straight line, and the classic says this one certainly lives. The difference is two points of eyespace, and it decides everything. The two marked points in the middle are the ones worth trying.",
    },
    {
      type: "sequence",
      setup: alive,
      toPlay: "b",
      moves: [pt(1, 0), pt(2, 0)],
      text: "Black to play, taking the best try.",
      hint: "Black takes one of the two middle points; White answers on the other.",
      commentary: [
        "Black takes a middle point. This is the only attempt worth making: the outside points would leave White a straight three and an easy life.",
        "White takes the other middle point. Black's stone is now cut off with a single liberty, and White captures it whenever it likes, leaving one eye at each end of the row.",
      ],
    },
    {
      type: "info",
      setup: alive,
      marks: [pt(0, 0), pt(3, 0)],
      text: "The two marked points are the two eyes White ends up with. Black cannot even continue: playing on the far side of the row after that exchange is not a bad move but an illegal one, a stone with no liberties. Four points in a straight line live, two points die, and the whole of this chapter's catalogue turns on counting eyespace rather than stones.",
    },
    {
      type: "info",
      setup: alive,
      text: "The chapter names others. The five-point flower, struck at its centre, keeps almost no life, and modern reading agrees. The long two-by-three it calls alive, and that one depends on where it sits: in the open it lives, in the corner the same six points die to a placement. Zhang Ni states his shapes flatly, without the conditions, which is what happens when a catalogue is written nine centuries before anyone can check it by exhaustion. Two of his verdicts are replayed against the engine every time these lessons are tested, and both hold.",
    },
  ],
};
