/* ----------------------- THE BLOG -----------------------
   The long form. A blog post is the piece that would have broken the thing it
   came out of: the Record is a broadsheet and its columns are 150 words, and
   a column that stops to count to 2.08 x 10^170 is a column nobody finishes.
   So the arithmetic moved here and the front door kept the story.

   A post is not a note. The notes in `journal.js` are about this repository
   and name the modules they describe in `about`, which the suite checks still
   exist. A post is about the world, so it carries `sources` instead, cited out
   of the same list the Record cites from -- and `blog.test.js` holds it to the
   same rule the Record lives under. A post that cannot point at something does
   not ship, and that is the whole of the policy for both.

   Both may set `about` as well, and a post about the world that ends up making
   a claim about our software has to name the file that honours it.

   Pure data. Nothing here touches React. */

import { sourceFor } from "./press.js";

export const POSTS = [
  {
    id: "why-nineteen-years",
    date: "2026-09-11",
    kicker: "Computation",
    title: "Why go took nineteen years longer than chess",
    dek: "Chess fell to a search. Go has more legal positions than a search can enumerate, and the answer, when it came, was to look at fewer moves rather than more.",
    sources: ["tromp", "deepblue", "alphago", "silver", "goattack"],
    about: ["src/engine/kata/net.js"],
    body: [
      { p: "The front door says go fell nineteen years after chess and then moves on, because the reason is arithmetic and a broadsheet column is not the place to do arithmetic. This is the place." },

      { h: "The number" },
      { p: "John Tromp finished the exact count of legal positions on a 19x19 board in 2016. It is 2.08 x 10^170: a number 171 digits long, and one that took a distributed computation years to pin down rather than estimate. Nothing is gained by trying to picture it. The useful thing about it is what it rules out." },
      { p: "It rules out enumeration. There is no machine, and there will not be one, that visits those positions and writes down what it found. Every program that plays this game well is a program that looks at a vanishingly small part of the board's future and is right about it anyway." },

      { h: "Chess had two things go does not" },
      { p: "A chess position offers a few dozen legal moves. An empty go board offers 361, and almost every point stays legal for a long time, so the tree gets wide immediately and stays wide. Depth is not the problem. Width is." },
      { p: "The second thing matters more. Chess programs prune with an evaluation function: count the material, weigh the structure, and you have a number for a position without playing it out. Go has no cheap equivalent, because the value of a stone depends on whether the group it belongs to will be alive in forty moves, and that is a question about the whole board. A wall facing the wrong way is worth nothing. The same wall facing a weak group decides the game. You cannot read that off the position with a tally." },
      { p: "So the two halves of the chess recipe both fail at once. The search cannot go wide enough, and there is nothing reliable to say about the leaves when it stops." },

      { h: "What actually changed" },
      { p: "The first real progress was to stop evaluating positions and start sampling them. Monte Carlo tree search plays the position out to the end, many times, with cheap random-ish moves, and takes the win rate as the evaluation. It is a strange idea and it worked: a program that cannot say why a position is good can still notice that it keeps winning." },
      { p: "AlphaGo added the two things that were missing from the sampling. A policy network, trained first on human games and then on its own, to say which moves are even worth considering, so the search spends its budget on a handful of branches instead of hundreds. And a value network to judge a position directly, so the playout no longer had to run to the end to be worth anything. The search got narrower and shallower, and it got far stronger. That is the sentence to take away: the machine did not out-search the game. It learned what to ignore." },

      { p: "Nineteen years is how long it took to find that out, and the gap is not a story about hardware. Deep Blue was a searching machine and it was enough for chess. Go needed a different kind of program." },

      { h: "The number is still there" },
      { p: "It is worth remembering that none of this solved the game. In 2023 researchers trained an adversary against KataGo and beat it in the great majority of games at superhuman settings, by luring it into a shape it misreads. A program that has seen an unimaginably small fraction of 2.08 x 10^170 positions has holes in it, and the holes are findable." },
      { p: "The network that plays you here is a descendant of that line of work, running in your browser rather than on somebody's cluster. It is very strong and it is not an oracle, and the front door says so in the column next to the one that made this post necessary." },
    ],
  },
];

/** One post by id, or null. */
export function postById(id) {
  return POSTS.find(p => p.id === id) || null;
}

/** The sources a post cites, resolved and in the order the post named them.
 *  An id with nothing behind it drops rather than printing an empty line; the
 *  suite is what makes sure that never happens in the first place. */
export function sourcesOf(post) {
  return (post.sources || []).map(sourceFor).filter(Boolean);
}
