import { pt } from "../../positions.js";

/* ----------------------- 4d · judgement · Reading the Machine (Tier 6) -----------------------
   The last lesson in the library, and the only one whose subject is the tool
   the reader will spend the rest of their go life with. Every dan player now
   reviews with an engine. Almost nobody is taught how to read one, and the
   failure mode is specific: a number appears beside a move, the number is
   believed, and the player stops thinking at exactly the point where the
   thinking was supposed to start.

   Everything quoted here was measured on Joseki's own shipped human network
   with `tools/joseki/policy.py`, at the profiles named, and can be re-measured:

     position: b:3,3 w:15,15 b:15,3 w:3,15, Black to play move five

     year 2018, rank 9d, whole board
       16,13 p=0.5124   16,16 p=0.1415   2,13 p=0.1153   2,16 p=0.0705
       13,16 p=0.0445   5,16 p=0.0441    9,3  p=0.0222   16,5 p=0.0203

     year 2018, rank 5k, whole board
       16,13 p=0.5627   2,13 p=0.1729    9,3  p=0.0796   16,16 p=0.0742
       2,16  p=0.0375   5,16 p=0.0200    13,16 p=0.0172  16,5 p=0.0087

   Two facts fall out of those two lists and the lesson is built on them. The
   top move is the same at both profiles. The order underneath is not: the
   point a nine-dan profile puts second, a five-kyu profile puts fourth, and
   the point the nine-dan profile puts seventh the five-kyu profile puts third.

   The third measurement is the one about asking the wrong question. Asked as a
   whole-board question one move into the game, every reply inside a single
   corner comes back at p=0.000 to three decimal places, because the network is
   weighing them against taking an empty corner, which is worth more. A number
   near zero there is not a verdict on the move. It is a verdict on the
   question. `--local` exists for exactly this reason and the tool's own
   documentation says so.

   The `net` numbers on the choice step are the 9d/2018 measurement, so the
   verifier in `library.test.js` holds the best option to being the one the
   network actually ranked first. The author does not get to pick. */

const opening = {
  b: [pt(3, 3), pt(15, 3)],
  w: [pt(15, 15), pt(3, 15)],
};

export default {
  id: "studying-with-analysis",
  title: "Reading the Machine",
  subtitle: "What a number beside a move does and does not mean",
  plain: "Every strong player now reviews with an engine, and almost nobody is taught how to read one. A probability is not a verdict, a top move is not the only move, and every number an engine gives you is the answer to a question somebody chose. Learning which question was asked is the whole skill.",
  tier: 6, rank: "4d", track: "judgement", size: 19,
  prereqs: ["ko-as-strategy", "thickness-into-points"], minutes: 10,
  author: "Joseki",
  steps: [
    {
      type: "info",
      setup: opening,
      text: "Four stones, and Black to play the fifth. This is about as open as a position gets, and it is where engine review goes wrong most often, because it is where the numbers are smallest and the temptation to read them as marks out of ten is strongest. Everything quoted in this lesson was measured on the same network the house players here run on, at the profiles named, and none of it is remembered from somewhere else.",
    },
    {
      type: "choice",
      setup: opening,
      toPlay: "b",
      text: "The network, asked what a nine-dan of 2018 plays here, gave these three among its top eight. The weight beside each is how much of its attention that point got.",
      options: [
        { point: pt(16, 13), verdict: "best", net: { rank: 1, p: 0.5124 },
          text: "Half the network's weight on one point, which in an open position is a strong preference and not a proof. What it is saying is that of everything on the board this is the move it most expects from a strong player of that year. Notice what it is not saying: it is not saying the game is won, it has not read a sequence, and it does not know what you were planning." },
        { point: pt(16, 16), verdict: "fine", net: { rank: 2, p: 0.1415 },
          text: "Second, with a seventh of the weight. Here is the thing worth learning: this is not a seventh as good. A policy distribution is how often a move is expected, not what it is worth, and a move played one time in seven by strong players is a perfectly ordinary move. Treating second place as a mistake is the commonest way to misread an engine." },
        { point: pt(9, 3), verdict: "poor", net: { rank: 7, p: 0.0222 },
          text: "Seventh, at two per cent. Low, and still not condemned: two per cent of a professional's choices is not nothing. What makes it the weakest of the three here is that it is the one the network's opinion of moves down the list, and the same point measured at a weaker profile, both move furthest on, which is the subject of the next screen." },
      ],
    },
    {
      type: "info",
      setup: opening,
      marks: [pt(16, 16), pt(9, 3)],
      text: "Now the same position, the same network, the same year, and one thing changed: it is asked what a five kyu plays instead of a nine dan. The top move does not move. Everything under it does. The first marked point falls from second to fourth, 0.14 to 0.07; the second rises from seventh to third, 0.02 to 0.08. Nothing about the board changed. The network was asked about a different player, and it answered about that player, because that is what it was built to do. So the question is never what does the engine say. It is what did somebody ask it.",
    },
    {
      type: "info",
      setup: { b: [pt(3, 3)], w: [] },
      text: "The second way to misread a number, and this one costs people whole joseki. One stone on the board, and White to answer in that corner. Ask the network as a whole-board question and every reply in the corner comes back at zero to three decimal places, the 3-3 point included. The corner moves are not bad. They are being weighed against taking one of the three empty corners, which is worth more, so they are all rounding to nothing together. Ask the same network the same position with the rest of the board excluded from the ranking and the corner sorts itself into a sensible order immediately. A probability is conditional on the question, and a number near zero usually means the question was too big.",
    },
    {
      type: "info",
      setup: opening,
      text: "So: an engine's number is a measurement of something specific, and using it well is knowing what. A policy weight is how often a move is expected of the player you asked about. A winrate is an estimate of a result, not a count of points, and it moves fastest where the game is closest, which is why a graph of it is a map of where to look and not a list of mistakes. Neither one has read your plan. The strongest habit a dan player can build with these tools is to guess first and look second: write down what you would play and why, then ask, and spend your time only on the places where the two disagree. An engine consulted before you have an opinion cannot teach you anything, because there is nothing of yours for it to correct.",
    },
  ],
};
