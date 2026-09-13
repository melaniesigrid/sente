import { pt } from "../../positions.js";

/* ----------------------- 12k · opening · The Big Points -----------------------
   The first opening lesson on nineteen lines, and the first lesson in the
   library whose verdicts were measured rather than decided.

   "Corners, then sides, then the centre" is a proverb, and a proverb is
   somebody's opinion until it is checked. Every `choice` step below carries
   `net` on each option: the weight and the rank the human network this server
   ships gave that point, in that exact position, at a professional profile.
   The best option is the one the network ranked highest, and `library.test.js`
   fails the build if an author ever marks a different one best.

   Measured with `tools/joseki/policy.py` (humanv0, professional profile, 2015).
   The numbers in the prose are those numbers and nothing else. */
export default {
  id: "opening-big-points",
  title: "The Big Points",
  subtitle: "Corners, then sides, then the centre, with the numbers",
  plain: "Ground is cheapest in a corner, because two of the four walls are already built, and dearest in the middle, where none of them are. That is why an opening starts in the corners and works outwards, and it is why the centre of an empty board is almost never anybody's first move.",
  tier: 3, rank: "12k", track: "opening", size: 19, prereqs: ["first-9x9-opening"], minutes: 7,
  author: "Joseki", sources: [],
  steps: [
    {
      type: "info",
      setup: { b: [], w: [] },
      marks: [
        pt(3, 3), pt(9, 3), pt(15, 3),
        pt(3, 9), pt(9, 9), pt(15, 9),
        pt(3, 15), pt(9, 15), pt(15, 15),
      ],
      text: "Nineteen lines, and nine dots the board prints for you. To hold territory you have to wall it, and the board builds part of every wall in a corner: two sides for nothing. On a side it builds one, and in the centre it builds none. The same number of stones is worth the most where the walls are cheapest, so an opening begins in the corners.",
    },
    {
      type: "choice",
      setup: { b: [], w: [] },
      toPlay: "b",
      text: "An empty board, Black to play. Three candidates. The verdicts here are not opinions: they are what the network this server ships would play in this position.",
      options: [
        { point: pt(3, 3), verdict: "best", net: { p: 0.166, rank: 3 },
          text: "The 4-4 point, on the dot. The network gives this a sixth of all its weight, and gives the other three star points the same, which is what an opening move looking at four identical corners is supposed to look like." },
        { point: pt(2, 3), verdict: "fine", net: { p: 0.039, rank: 11 },
          text: "The 3-4 point, one line lower and one across. Real, and played every day: a quarter of the weight of the 4-4, and eleventh out of three hundred and sixty-one. It takes more of the corner and less of the outside." },
        { point: pt(9, 9), verdict: "poor", net: { p: 0.000, rank: 20 },
          text: "Tengen, the centre. Four hundred times less weight than the 4-4 point. It is not an illegal move or a stupid one, it is a move whose walls all have to be built by hand." },
      ],
    },
    {
      type: "choice",
      setup: { b: [pt(3, 3)], w: [pt(15, 15)] },
      toPlay: "b",
      text: "One corner each. Two are still empty. Black to play.",
      options: [
        { point: pt(2, 15), verdict: "best", net: { p: 0.242, rank: 2 },
          text: "The third corner. While a corner is empty it is the cheapest thing on the board, and it stays the cheapest thing on the board until somebody takes it." },
        { point: pt(3, 9), verdict: "poor", net: { p: 0.000, rank: 80 },
          text: "The middle of the left side, between your own corner and an empty one. Eightieth. The side is a big point later; it is not a big point while two corners are lying open." },
        { point: pt(9, 9), verdict: "poor", net: { p: 0.000, rank: 21 },
          text: "The centre, again. Twenty-first, and it will keep being about twenty-first until the corners and the sides have gone." },
      ],
    },
    {
      type: "choice",
      setup: {
        b: [pt(3, 3), pt(15, 3)],
        w: [pt(15, 15), pt(3, 15)],
      },
      toPlay: "b",
      text: "Now all four corners are taken, two each. Black to play, and the answer changes.",
      options: [
        { point: pt(9, 3), verdict: "best", net: { p: 0.230, rank: 2 },
          text: "The middle of the top side, between your own two corners. Second, at almost a quarter of the weight: with the corners gone this is the biggest thing left, and it was eightieth two moves ago. Nothing about the point changed. What changed is what is left." },
        { point: pt(9, 9), verdict: "poor", net: { p: 0.001, rank: 12 },
          text: "The centre has climbed from twenty-first to twelfth, which is real, and it is still two hundred times less likely than the side point." },
        { point: pt(0, 9), verdict: "poor", net: { p: 0.000, rank: 319 },
          text: "The first line, halfway down the left edge. Three hundred and nineteenth out of three hundred and sixty-one. The edge is the one place where the board's free wall costs you more than it gives." },
      ],
    },
    {
      type: "sequence",
      setup: { b: [], w: [] },
      toPlay: "b",
      moves: [pt(3, 3), pt(15, 15), pt(2, 15), pt(15, 3)],
      commentary: [
        "Black takes a corner.",
        "White takes the one diagonally opposite.",
        "Black takes a third, on the 3-4 point this time.",
        "And White takes the last one. Four stones, four corners, and nobody has touched anybody.",
      ],
      text: "Play the first four moves. You are Black, and White answers.",
      hint: "A corner, and then whichever corner is still empty.",
      success: "That is an opening. Four moves in, the cheapest ground on the board has been divided and not one stone is in danger. What happens next is the sides.",
      wrongText: "Corners first, while they are still empty.",
    },
    {
      type: "quiz",
      setup: { b: [], w: [] },
      toPlay: "b",
      answers: [
        pt(3, 3), pt(15, 3), pt(3, 15), pt(15, 15),
        pt(2, 3), pt(3, 2), pt(16, 3), pt(15, 2),
        pt(2, 15), pt(3, 16), pt(16, 15), pt(15, 16),
      ],
      text: "Empty board, Black to play. Take a big point.",
      hint: "A corner. Either the dot itself or one line off it.",
      success: "Any of those twelve, and they are the twelve the network puts in its top dozen out of three hundred and sixty-one. Corners first, and the argument about which corner is a different lesson.",
      wrongText: "Not a big point yet. Four corners are open and each of them is worth more than anything in the middle.",
    },
  ],
};
