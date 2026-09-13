/* ----------------------- TSUMEGO PROBLEMS ------------------------
   Classical public-domain shapes, in four sets. Every position is
   engine-verified: `problems.test.js` searches the enclosed region
   exhaustively and holds the stated answers to being exactly the
   moves that work. The data shape is SGF-import ready for classical
   collections (Guanzi Pu, Xuanxuan Qijing). */
import { pt } from "./positions.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";
import { localize } from "./translate.js";

const EN = makeT(BASE_LOCALE);

/** A tsumego in the language in force: its theme, its title, the prompt and
 *  the explanation. The position is data and is never touched. */
export const localizeProblem = (p, t = EN) => localize(p, `problem.${p.id}`, t);

/** A set in the language in force: its name and what it trains. */
export const localizeSet = (s, t = EN) => localize(s, `problemSet.${s.id}`, t);

/* ----------------------- THE SETS -----------------------
   A flat run of a dozen boards is a list, not a collection: nothing tells the
   reader where they are, what the next board is for, or what they have
   finished. The problems are grouped the way the library is grouped, by the
   track they train, and a set is read in order, because each board answers
   the one before it.

   `track` is the library's own track key, so a set and a tier's lessons on
   the same subject name the same thing. */
export const SETS = [
  {
    id: "tactics", track: "tactics", name: "Capture and escape",
    blurb: "Liberties, counted before the stone goes down. Every other set is this one applied to a smaller space.",
  },
  {
    id: "shape", track: "shape", name: "Shape",
    blurb: "The move that is right because of the stones already standing there, and wrong two points away.",
  },
  {
    id: "eyes", track: "life", name: "Eye shapes",
    blurb: "The spaces every classical collection opens with. Each one holds a point both players want, for opposite reasons.",
  },
  {
    id: "corner", track: "life", name: "The corner",
    blurb: "The same shapes wrapped around the 1-1 point, where the edge does half the killing and the count comes out differently.",
  },
];

export const setById = (id) => SETS.find(s => s.id === id) || null;

/** The problems of one set, in the order they are meant to be read. */
export const problemsInSet = (id) => PROBLEMS.filter(p => p.set === id);

/* ----------------------- WHERE A READER IS -----------------------
   A count of nineteen boards is not a place. These say which set somebody is
   in the middle of and how far through it they are, which is what a dashboard
   tile and a screen heading both want, and they are pure: the list of solved
   ids goes in, nothing is stored. */

/** How much of one set is done. */
export function setProgress(setId, done = []) {
  const mine = problemsInSet(setId);
  const solved = mine.filter(p => done.includes(p.id)).length;
  return { total: mine.length, solved, complete: mine.length > 0 && solved === mine.length };
}

/** The set a reader is working through: the first one they have not finished,
 *  and the last one when every board is solved. A reader who has finished
 *  everything is not sent back to the beginning. */
export function currentSet(done = []) {
  const open = SETS.find(s => !setProgress(s.id, done).complete);
  return open || SETS[SETS.length - 1];
}

/** Every set that is finished, in declaration order. */
export const setsComplete = (done = []) => SETS.filter(s => setProgress(s.id, done).complete);

/** The board to open on: the first one not yet solved in the set the reader is
 *  working through, and the last board of the collection once they have solved
 *  everything. Opening on board one for somebody who solved board one last
 *  week is asking them to find their own place in a list. */
export function nextProblem(done = []) {
  const set = currentSet(done);
  const open = problemsInSet(set.id).find(p => !done.includes(p.id));
  return open || PROBLEMS[PROBLEMS.length - 1];
}

export const PROBLEMS = [
  /* ----------------------- CAPTURE AND ESCAPE ----------------------- */
  {
    id: "p1", set: "tactics", rank: "25k", theme: "Capture",
    title: "One breath left",
    setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
    toPlay: "b", answers: [pt(4, 5)],
    prompt: "Black to play. Capture the white stone.",
    explain: "The stone's last liberty is below it. Zero liberties = off the board.",
  },
  {
    id: "p2", set: "tactics", rank: "22k", theme: "Capture",
    title: "Two for one",
    setup: { b: [pt(1, 2), pt(1, 3), pt(2, 1), pt(3, 2), pt(3, 3)], w: [pt(2, 2), pt(2, 3)] },
    toPlay: "b", answers: [pt(2, 4)],
    prompt: "Black to play. The white chain shares its liberties. Take them both.",
    explain: "Connected stones are counted as one chain. Their single shared liberty was underneath.",
  },
  {
    id: "p3", set: "tactics", rank: "20k", theme: "Escape",
    title: "Breathe out",
    setup: { b: [pt(4, 4)], w: [pt(3, 4), pt(4, 3), pt(5, 4)] },
    toPlay: "b", answers: [pt(4, 5)],
    prompt: "Black is in atari. Save the stone.",
    explain: "Extending to the open side makes a two-stone chain with three liberties. Never pass a group in atari without reading it.",
  },
  {
    id: "p4", set: "tactics", rank: "18k", theme: "Capture",
    title: "The false suicide",
    setup: {
      w: [pt(0, 0), pt(1, 0), pt(0, 1), pt(0, 2), pt(1, 2)],
      b: [pt(2, 0), pt(2, 1), pt(2, 2), pt(0, 3), pt(1, 3)],
    },
    toPlay: "b", answers: [pt(1, 1)],
    prompt: "Black to play. The only move looks illegal. Is it?",
    explain: "Captures resolve before your own liberties are counted. Playing White's last liberty removes five stones, so your stone lands in open space.",
  },

  /* ----------------------- SHAPE, FROM THE BOOK OF SHAPES ----------------------- */
  {
    id: "p10", set: "shape", rank: "13k", theme: "Shape",
    title: "The mouth that will not close",
    setup: { b: [pt(3, 3), pt(5, 3)], w: [pt(4, 2)] },
    toPlay: "b", answers: [pt(4, 3)],
    prompt: "Black has to join these two stones up. There is a tempting way and a correct way.",
    explain: "Solid, and nothing else. The tiger's mouth at the point below would normally connect, and it does not here: White cuts into the gap and joins the stone above into a chain with three liberties instead of dying with one. A tiger's mouth is a connection only while the intruder is alone.",
  },
  {
    id: "p12", set: "shape", rank: "11k", theme: "Shape",
    title: "Wedged",
    setup: { b: [pt(3, 2), pt(6, 2)], w: [pt(4, 2)] },
    toPlay: "b", answers: [pt(5, 2)],
    prompt: "White has wedged into a two-space extension. Black to play.",
    explain: "Block on the wider side. Black is not trying to keep both stones and does not need to: the wedge is left with two liberties between two black stones and cannot live, so it was never a cut. Choosing which side to block is the whole decision; hesitating and playing on top of the wedge hands White the better shape.",
  },
  {
    id: "p11", set: "shape", rank: "9k", theme: "Shape",
    title: "The waist",
    setup: { w: [pt(4, 3), pt(5, 5)], b: [pt(3, 4), pt(6, 4)] },
    toPlay: "b", answers: [pt(4, 4)],
    prompt: "White's two stones are a knight's move apart, and Black has a stone on either side of the gap. Black to play.",
    explain: "Strike at the waist. With support on both sides the cutting stone is not alone: it joins into a chain with five liberties while White's two stones are left on three and four, separated, with nothing to attack. Without the two supporting stones this same move is an invitation to a fight rather than a cut.",
  },

  /* ----------------------- EYE SHAPES ----------------------- */
  {
    id: "p5", set: "eyes", rank: "15k", theme: "Life & Death",
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
    id: "p6", set: "eyes", rank: "15k", theme: "Life & Death",
    title: "Straight three: live",
    setup: {
      b: [pt(0, 1), pt(1, 1), pt(2, 1), pt(3, 0), pt(3, 1)],
      w: [pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 0), pt(4, 1)],
    },
    toPlay: "b", answers: [pt(1, 0)],
    prompt: "Now it's your group. Black to play and live.",
    explain: "Same vital point, opposite urgency: the center move splits the space into two real eyes. Whoever reaches the vital point first decides the group's fate: sente in miniature.",
  },
  /* Three points along the edge with a fourth hanging under the middle. Four
     points of eye space are normally alive, and this is the shape that is not.
     It and its mirror below were found by enumerating every connected space of
     four, five and six points in a corner, on an edge and out in the open,
     walling each one in and asking the prover which points kill and which
     live. It is the only four-point space on the edge with exactly one of each. */
  /* The bend, and the fact that it changes nothing. Found by the same
     enumeration as the rest: every connected space of three points on an edge,
     walled in and solved. Straight three and bent three come back with the
     same answer, which is why a learner who has met one has met both. */
  {
    id: "p17", set: "eyes", rank: "14k", theme: "Life & Death",
    title: "The bend in the three",
    setup: {
      w: [pt(1, 0), pt(3, 0), pt(4, 0), pt(1, 1), pt(4, 1), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 2)],
      b: [pt(0, 0), pt(5, 0), pt(0, 1), pt(5, 1), pt(0, 2), pt(5, 2),
        pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3)],
    },
    toPlay: "b", answers: [pt(2, 1)],
    prompt: "Three points of eye space again, and this time they are bent. Black to play and kill.",
    explain: "The middle of the three, exactly as before. A bend is not a different shape, it is the same three points with a corner in them, and the point that belongs to both halves is still the middle one. The search says so as plainly as it can: this space has one killing point and one living point, and they are the same square, which is the definition of a vital point.",
  },
  {
    id: "p13", set: "eyes", rank: "13k", theme: "Life & Death",
    title: "Three and a tail",
    setup: {
      w: [pt(1, 0), pt(1, 1), pt(2, 1), pt(4, 1), pt(5, 0), pt(5, 1), pt(2, 2), pt(3, 2), pt(4, 2)],
      b: [pt(0, 0), pt(0, 1), pt(0, 2), pt(1, 2), pt(5, 2), pt(6, 0), pt(6, 1), pt(6, 2),
        pt(1, 3), pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3)],
    },
    toPlay: "b", answers: [pt(3, 0)],
    prompt: "Four points of eye space: three along the edge, with one hanging under the middle. Black to play and kill.",
    explain: "The point where the tail joins. Four points usually live, and this is the shape the books print beside the straight four to show that the count is not the whole story: the hanging point makes one square belong to both halves of the space, and there is only ever one of those. Take it and the space cannot divide.",
  },
  {
    id: "p14", set: "eyes", rank: "13k", theme: "Life & Death",
    title: "Three and a tail: live",
    setup: {
      b: [pt(1, 0), pt(1, 1), pt(2, 1), pt(4, 1), pt(5, 0), pt(5, 1), pt(2, 2), pt(3, 2), pt(4, 2)],
      w: [pt(0, 0), pt(0, 1), pt(0, 2), pt(1, 2), pt(5, 2), pt(6, 0), pt(6, 1), pt(6, 2),
        pt(1, 3), pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3)],
    },
    toPlay: "b", answers: [pt(3, 0)],
    prompt: "The same four points, and now the group is yours. Black to play and live.",
    explain: "The same square, and it is the only one. Fill the tail or either end and White takes the joining point, and the whole space collapses into a single eye. A vital point is not a killing move or a living move: it is one square that settles the question, and whoever reaches it first decides which way it settles.",
  },
  {
    id: "p7", set: "eyes", rank: "10k", theme: "Life & Death",
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
    id: "p18", set: "eyes", rank: "9k", theme: "Life & Death",
    title: "One chance, three answers",
    setup: {
      w: [pt(1, 0), pt(5, 0), pt(1, 1), pt(4, 1), pt(5, 1), pt(1, 2), pt(2, 2), pt(3, 2), pt(4, 2)],
      b: [pt(0, 0), pt(6, 0), pt(0, 1), pt(6, 1), pt(0, 2), pt(5, 2), pt(6, 2),
        pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3), pt(4, 3), pt(5, 3)],
    },
    toPlay: "b", answers: [pt(3, 0)],
    prompt: "Five points of eye space on the edge. Black to play and kill.",
    explain: "One point kills and three points live. That asymmetry is the whole reason life and death is hard from the attacking side: White has three ways to answer this shape correctly and Black has one, so a mistake by White is survivable and a mistake by Black hands the group away. Count the defender's options before you decide a group is dead.",
  },
  {
    id: "p8", set: "eyes", rank: "8k", theme: "Life & Death",
    title: "The flowered five",
    setup: {
      w: [pt(2, 0), pt(0, 0), pt(0, 2), pt(2, 2), pt(3, 1), pt(3, 2), pt(3, 0), pt(1, 3), pt(2, 3), pt(0, 3)],
      b: [pt(4, 1), pt(4, 2), pt(3, 3), pt(4, 0), pt(1, 4), pt(2, 4), pt(0, 4)],
    },
    toPlay: "b", answers: [pt(1, 1)],
    prompt: "The five points make a cross. Black to play and kill.",
    explain: "The middle of the cross, and it is the only move: it is the point every arm of the shape runs through. The same point is the only move that saves the group when White gets there first, which is what a vital point means: one square that both players want for opposite reasons.",
  },

  /* ----------------------- THE CORNER -----------------------
     Everything above holds in the middle of the board too. Down here the edge
     is two of the four walls, a space needs fewer stones to enclose, and the
     count comes out differently: a bend that lives on the edge dies at the 1-1
     point, and six points that are normally alive are not. */
  {
    id: "p19", set: "corner", rank: "7k", theme: "Life & Death",
    title: "The shape the corner leaves alone",
    setup: {
      w: [pt(0, 1), pt(2, 1), pt(3, 0), pt(3, 1), pt(0, 2), pt(1, 2), pt(2, 2)],
      b: [pt(4, 0), pt(4, 1), pt(3, 2), pt(4, 2), pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3)],
    },
    toPlay: "b", answers: [pt(1, 0)],
    prompt: "Three along the edge with one under the middle, wrapped into the corner this time. Black to play and kill.",
    explain: "The same point as out on the edge, and that is the answer to the question this set keeps asking. The corner changes a shape when the shape wraps round the 1-1 point and needs it, which is what happens to the bend at the end of this set. It changes nothing for a shape whose vital point was never near the 1-1 point in the first place. The corner is not a rule, it is a wall that is sometimes in the way.",
  },
  {
    id: "p16", set: "corner", rank: "6k", theme: "Life & Death",
    title: "The flower in the corner",
    setup: {
      w: [pt(2, 0), pt(3, 0), pt(3, 1), pt(0, 2), pt(2, 2), pt(3, 2), pt(0, 3), pt(1, 3), pt(2, 3)],
      b: [pt(4, 0), pt(4, 1), pt(4, 2), pt(4, 3), pt(3, 3), pt(0, 4), pt(1, 4), pt(2, 4), pt(3, 4)],
    },
    toPlay: "b", answers: [pt(1, 1)],
    prompt: "Six points of eye space in the corner, shaped like a flower. Black to play and kill.",
    explain: "The centre of the flower. Six points are usually more than enough, and the flower is the six that is not: every arm of it runs through the middle square, so taking that square leaves petals that are one point each and can never be two eyes. White reaching it first lives, which is what makes it worth a move.",
  },
  {
    id: "p9", set: "corner", rank: "4k", theme: "Life & Death",
    title: "Six points in the corner",
    setup: {
      w: [pt(3, 0), pt(3, 1), pt(0, 2), pt(1, 2), pt(2, 2), pt(3, 2)],
      b: [pt(4, 0), pt(4, 1), pt(4, 2), pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3)],
    },
    toPlay: "b", answers: [pt(1, 1)], koAnswers: [pt(1, 0)],
    prompt: "Six points of eye space in the corner, three by two. The proverb says six points in the corner live. Black to play and kill.",
    explain: "The 2-2 point. Six points normally do live, and this rectangle is the famous exception: the placement stops the space dividing into two halves that are each big enough, and White has no outside liberty to appeal to.",
    koNote: "That kills as well, and only because White may not retake the ko it runs into. The 2-2 point kills outright, with nothing to win first, and that is the move the books print.",
  },
  {
    id: "p15", set: "corner", rank: "2k", theme: "Life & Death",
    title: "The bend the corner kills",
    setup: {
      w: [pt(1, 1), pt(2, 1), pt(3, 0), pt(3, 1), pt(0, 2), pt(1, 2)],
      b: [pt(2, 2), pt(3, 2), pt(4, 0), pt(4, 1), pt(4, 2), pt(0, 3), pt(1, 3), pt(2, 3)],
    },
    toPlay: "b", answers: [pt(1, 0)], koVerdict: true,
    prompt: "Four points of eye space, bent around the 1-1 point. The same bend out on the edge is alive. Black to play and kill.",
    explain: "The 2-1 point, and the bend is the shape the corner changes its mind about. On the edge this space has two living points and no killing one, which the prover checks alongside this board; in the corner it has exactly one of each, because the 1-1 point is a square White can be made to fill. This is bent four in the corner, and the reason the classical books argue over it is that the killing line runs through a ko White is never allowed to retake. Under the rules this server plays, the group is dead.",
  },
];
