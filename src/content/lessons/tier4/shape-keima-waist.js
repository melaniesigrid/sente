import { pt } from "../../positions.js";
import { shapeByKey } from "../../shapes.js";

/* ----------------------- 9k · tactics · Strike at the Waist (Book of Shapes) -----------------------
   The proverb tells you where to hit a knight's move and stops there, which is
   why it gets played into walls. The lesson gives it the missing half: the cut
   at the waist is not a capture, it is an offer of a fight, and whether the
   offer is good depends entirely on what is standing nearby.

   Two positions, both replayed by the verifier. In the open, White cuts and
   the cutting stone ends on three liberties while Black's blocking wall ends
   on six: the fight is Black's and the knight's move held. Add two white
   stones either side of the waist and the same cut leaves White on five
   liberties with Black split into three and four: the same move, the opposite
   verdict, and nothing changed but the neighbours. Every number is `chainAt`.

   No claim is made here about whose position is better in points. The engine
   can count liberties and it cannot count territory in the middle of a fight,
   so the lesson counts liberties. */

const article = shapeByKey("keima");

const keima = { b: [pt(4, 3), pt(5, 5)] };
const supported = { b: [pt(4, 3), pt(5, 5)], w: [pt(3, 4), pt(6, 4)] };

export default {
  id: "shape-keima-waist",
  title: "Strike at the Waist",
  subtitle: "Where to cut a knight's move, and when not to bother",
  plain: "A knight's move covers ground fast because its two stones are not joined — they are held together by a reading. Cutting between them is an offer of a fight, and the offer is only good when you have something standing nearby to fight with.",
  tier: 4, rank: "9k", track: "tactics", size: 19, prereqs: ["proverb-ladder", "connect-cut"], minutes: 7,
  author: "Joseki", book: "shapes",
  steps: [
    {
      type: "maxim",
      setup: keima,
      marks: [pt(4, 4), pt(5, 4)],
      line: article.proverb,
      analogy: "A rope bridge with two planks missing. You can step where the planks are gone, and whether that is clever depends on how far down it is.",
      text: "Two black stones a knight's move apart. They cover more board than a one-point jump would and they are not connected to each other in any way the rules recognise. The two marked points are the waist, and the proverb says that is where to hit.",
    },
    {
      type: "sequence",
      setup: keima,
      toPlay: "w",
      moves: [pt(5, 4), pt(4, 4), pt(5, 3), pt(4, 2)],
      text: "So hit it, with nothing else on the board, and watch what the proverb actually buys.",
      hint: "White cuts at the waist, Black blocks on the side of the stone above, and the two of them push up the board together.",
      commentary: [
        "White cuts. The two black stones are now definitely separate, which is exactly what the proverb promised.",
        "Black blocks. Note which side: Black is not trying to save the connection, Black is choosing a direction and letting the other stone look after itself.",
        "White pushes up, because standing still is worse.",
        "Black blocks again. Count the result: Black's wall has six liberties, White's cutting stones have three, and the lone black stone at the bottom still has three of its own. The cut was legal, it was where the proverb said, and it left the cutter with the weakest group on the board.",
      ],
    },
    {
      type: "info",
      setup: keima,
      marks: [pt(4, 4), pt(5, 4)],
      text: "That is the proverb's missing half. Cutting a knight's move never captures anything — it makes three weak groups where there were two, and then the fight decides. A knight's move in the open is safe not because it is connected but because whoever steps into the waist is the one with no friends there.",
    },
    {
      type: "sequence",
      setup: supported,
      toPlay: "w",
      moves: [pt(4, 4)],
      text: "Now the same knight's move with two white stones already standing either side of the waist. White cuts again.",
      hint: "Straight into the gap, joining the stone on the left.",
      commentary: [
        "The same point, the same move, and a different game. White's cutting stone is not alone: it joins the stone beside it into a chain with five liberties, and the two black stones are split into one with three and one with four. The proverb did not change. The neighbours did.",
      ],
    },
    {
      type: "info",
      setup: supported,
      marks: [pt(4, 4)],
      text: `${article.buys} ${article.breaks}`,
    },
  ],
};
