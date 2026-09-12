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
    id: "handicap-stones",
    date: "2026-09-12",
    kicker: "The record",
    title: "How badly the computers lost, in stones",
    dek: "The front door says a human could still beat the best program for nineteen years after chess fell. This is the measurement behind that: the gap between people and machines at go had a unit, and the unit was handicap stones.",
    sources: ["deepblue", "computergo", "alphago"],
    body: [
      { p: "Most tellings of this story have two dates in them and nothing in between. Chess in 1997, go in 2016. That makes it sound like go was simply waiting its turn." },
      { p: "It was not waiting. It was being lost, badly, every year, in public, by the best programs anybody could write. And go has something chess does not: a way to say exactly how badly. You give the weaker player free stones before the game starts. The number of stones is the size of the gap." },

      { h: "Nine stones was a prize nobody could win" },
      { p: "Between 1985 and 2000 the Ing Prize was offered every year at the World Computer Go Congress. The money went up as the conditions got harder. Forty million New Taiwan dollars sat at the top of it for any program that could beat a 1-dan professional on an even board." },
      { p: "That top prize was never a serious target. The one below it was: four hundred thousand NT dollars for winning a nine-stone handicap match. Nine stones is the standard maximum. It is what you give a beginner. No program claimed it, and the prize expired unclaimed in 2000." },
      { p: "The last Ing Prize that was collected went to a program called Handtalk in 1997, the same year Deep Blue beat Kasparov. Handtalk won two hundred and fifty thousand NT dollars for beating three amateur players aged eleven to thirteen. It was given eleven stones to do it." },

      { h: "What eleven stones means" },
      { p: "One rank in go is about one stone of handicap. Eleven stones against a strong amateur teenager puts the best go program of 1997 somewhere in the range of a person who has been playing for a few months." },
      { p: "Hold that next to the other half of the same year. In chess, the machine was the world champion's equal. In go, the machine was a child who had just learned the rules, and it had to be handed the corners before it could compete with actual children." },

      { h: "The gap closes in the last four years" },
      { p: "Then it moves quickly. In 2012 the program Zen beat Takemiya Masaki, a nine-dan professional, by eleven points at five stones, and then by twenty points at four. In 2013 Crazy Stone beat Yoshio Ishida, another nine-dan professional, at four stones on a full board." },
      { p: "Four stones is still four stones. Nobody would call that parity, and at the time the honest reading was that a professional gave up four free moves and still had to work. Three years later AlphaGo beat Lee Sedol four games to one with no handicap at all." },

      { h: "Why the unit matters" },
      { p: "The point of measuring in stones rather than in wins is that it gives the nineteen years a shape. This was not a long flat wait broken by a sudden result. It was a program eleven stones behind a child, then five, then four, and then, in about thirty months, nothing." },
      { p: "It is also the reason the front door states its claim the way it does. Go was not the last game to fall, and saying so is just wrong. What is true, and better, is that for nineteen years after chess this was the one board game left where a person of ordinary skill could sit down against the best program in the world and expect to win. That stopped being true in 2016, and there is no unit of handicap left to measure the gap with now, because it runs the other way." },
    ],
  },
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
