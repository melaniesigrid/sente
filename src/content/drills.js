/* ----------------------- THE DRILLS -----------------------
   The four sets in `problems.js` are a collection: nineteen boards, written
   one at a time, read in order, each with something to say. This is the other
   thing a player needs, and it is not the same thing. A collection teaches.
   A drill is repetition at the right weight, and repetition needs volume.

   So these boards were not written. They were searched for, proved, graded and
   sorted by machine, and they say so. Three censuses under `tools/problems/`
   enumerated every position of three kinds and solved each one exhaustively:

     capture   a white chain in trouble, and exactly one black move that takes
               it off the board. Everything from 23 kyu to 18 kyu.

     life      a sealed eye space with exactly one point that settles it, from
               either side. The middle of the range.

     tesuji    a fight where the move that wins is not the move that takes
               something now: counted in stones over the whole sequence rather
               than chased one chain at a time. This is the half that reaches
               above 5 kyu, which the other two could not.

   Three things about this file are worth knowing before trusting it.

   The rank is measured, not assigned. `tools/problems/grade.mjs` counts five
   things about a solved board and a fitted line turns them into a rank; the
   fit and its residuals are in that file, and the residual is about a rank and
   a half, which is roughly how much two human graders disagree anyway.

   The prose is composed, not written. Every sentence here is assembled from
   facts the prover established, and it says only those: which shape this is,
   how many liberties the chain had, that every other point was tried and
   failed. Nothing in a drill is an opinion, because nothing generated has any
   business holding one. The writing is in `problems.js`, where a person did it.

   And the life-and-death half is deliberately small. The census walled in
   every sealed space of three to six points, solved it from both sides, and
   after the mirror images were folded together the whole subject came to
   fifty-eight distinct questions. Shipping the same question five times with
   different walls around it would make a longer list and not a better one, so
   each question appears once, in its plainest drawing. What is missing from
   the hard end is missing because the search cannot reach it yet, not because
   nobody has typed it in; `TODO.md` says which families those are.

   Pure data and pure functions. Nothing here touches React. */
import { boardFromRows } from "../engine/index.js";
import { rankToNumber } from "./library.js";
import { rankValue, gradeOf, MIN_RATING } from "./rank.js";
import { DRILL_DATA } from "./drills.data.js";

export const DRILLS = DRILL_DATA;

const INDEX = new Map(DRILLS.map(d => [d.id, d]));
export const drillById = (id) => INDEX.get(id) || null;

/** The board a drill starts from. The rows are the engine's own spelling, so
 *  the engine does the reading. */
export const drillBoard = (drill) => boardFromRows(drill.rows);

/** The answers as points, the shape the rest of the app passes around. */
export const drillAnswers = (drill) => drill.answers.map(([c, r]) => ({ c, r }));

/* ----------------------- WHAT A DRILL SAYS -----------------------
   Composed from the drill's own facts, through `t` so a language that has
   these lines uses them and one that does not falls back to the English here.
   There are a dozen fragments rather than a line per board, which is what
   makes two hundred boards translatable at all. */

const WHERE = {
  corner: ["drill.where.corner", "in the corner"],
  edge: ["drill.where.edge", "on the edge"],
  open: ["drill.where.open", "in the open"],
};

const SHAPES = {
  "straight-three": "the straight three", "bent-three": "the bent three",
  "straight-four": "the straight four", "bent-four": "the bent four",
  "square-four": "the square four", "pyramid-four": "the pyramid four",
  "straight-five": "the straight five", "bent-five": "the bent five",
  "bulky-five": "the bulky five", "crossed-five": "the crossed five",
  "straight-six": "the straight six", "rabbitty-six": "the rabbitty six",
  "six-point-rectangle": "the six-point rectangle",
  /* Shapes with no traditional name are described rather than handed one
     somebody made up. The census finds more of these than of the named ones,
     which is a fact about the names and not about the shapes. */
  "four-points-bent": "four points, bent",
  "five-points-bent": "five points, bent",
  "six-points-bent": "six points, bent",
  "seven-points-bent": "seven points, bent",
};

/** A shape's name in the language in force, or a plain description of its size
 *  when the shape has no traditional name. */
export function shapeName(drill, t) {
  const key = drill.shape;
  if (!key) return "";
  const english = SHAPES[key];
  if (english) return t(`drill.shape.${key}`, {}, english);
  const plain = key.replace(/-/g, " ");
  return t(`drill.shape.${key}`, {}, plain);
}

const whereName = (drill, t) => {
  const [key, english] = WHERE[drill.where] || WHERE.open;
  return t(key, {}, english);
};

/** The question, in the language in force. */
export function drillPrompt(drill, t) {
  const where = whereName(drill, t);
  if (drill.kind === "tesuji") {
    return t("drill.prompt.tesuji", { where, n: drill.net },
      "Black to play {where}. One move settles this fight and is worth {n} stones "
      + "against White's best defence. Every other point in it is worth less.");
  }
  if (drill.kind === "capture") {
    return drill.libs === 1
      ? t("drill.prompt.atari", { where },
        "Black to play. The white chain is in atari {where}: one point takes it off the board.")
      : t("drill.prompt.catch", { where },
        "Black to play. The white chain has two liberties {where}. One of them is the one that matters.");
  }
  const shape = shapeName(drill, t);
  return drill.goal === "kill"
    ? t("drill.prompt.kill", { shape, where },
      "White's eye space is {shape}, {where}. Black to play and kill.")
    : t("drill.prompt.live", { shape, where },
      "Black's eye space is {shape}, {where}. Black to play and live.");
}

/** What the search established, once the drill is solved. Every one of these
 *  is a fact the prover proved, stated and not dressed up. */
export function drillExplain(drill, t) {
  /* Both of these say only what the census established: the net over best play,
     and whether the stone Black played could be taken straight back. */
  if (drill.kind === "tesuji") {
    return drill.sacrifice
      ? t("drill.explain.sacrifice", { n: drill.net },
        "Black gives a stone away. White may take it at once and taking it is the "
        + "mistake, because the capture leaves the chain a single liberty and Black "
        + "takes it back with everything attached. Counted to the end of the fight "
        + "the move is worth {n} stones, and nothing else in the fight comes close.")
      : t("drill.explain.tesuji", { n: drill.net, d: drill.depth },
        "Every other point in the fight was played out and answered, and this is the "
        + "only one that comes out ahead: {n} stones. The search had to look {d} moves "
        + "deep before it was the best move on the board, which is why it does not "
        + "look like one.");
  }
  if (drill.kind === "capture") {
    return t("drill.explain.capture", {},
      "That was the only point that catches it. The search played every other point "
      + "in the fight, and from each of them the chain got out.");
  }
  if (drill.goal === "kill") {
    const ko = drill.ko
      ? t("drill.explain.ko", {},
        " The kill is a ko: White may not take back at once, and that is what settles it.")
      : "";
    return t("drill.explain.kill", {},
      "The vital point. The search played every other point in the space, "
      + "and from each of them White made two eyes.") + ko;
  }
  return t("drill.explain.live", {},
    "The vital point, from the other side. The search played every other point "
    + "in the space, and from each of them the group could be killed.");
}

/* ----------------------- SLIGHTLY ABOVE -----------------------
   A drill at your own rank is practice and a drill four ranks above it is a
   wall. The queue is aimed a little over the reader's head, which is where
   people learn: `AIM` ranks stronger than they are, and never weaker, because
   a problem you can already do teaches nothing except that you can do it.

   The window is a band rather than a point, so that a queue has variety, and
   it slides down when a reader has solved everything in it rather than
   handing them an empty screen. Solved drills leave the queue and come back
   only when nothing else is left. */

/** How far above the reader the queue aims, in ranks. */
export const AIM = 1;

/** How wide the band is, above and below the aim. */
export const BAND = 2;

/** The rank number the reader is at: their own rank read off their rating. A
 *  profile with no rating yet is treated as standing at the bottom of the
 *  ladder, which is where a new player is, rather than as an error. */
export function readerRank(rating) {
  const { n, unit } = gradeOf(Number.isFinite(rating) ? rating : MIN_RATING);
  return unit === "d" ? n : -n;
}

/** Every drill in the band around `centre`, weakest first, and never weaker
 *  than `floor`. The floor is the reader's own rank: a band centred above
 *  somebody still reaches below them at its bottom edge, and a queue that
 *  opens on a board a rank easier than the reader is not aiming above their
 *  head, whatever its centre says. */
export function drillsAround(centre, { band = BAND, floor = centre - band } = {}) {
  const bottom = Math.max(centre - band, floor);
  return DRILLS.filter(d => {
    const r = rankToNumber(d.rank);
    return r >= bottom && r <= centre + band;
  });
}

/** The next drills for a reader: unsolved ones from the band aimed a little
 *  above them, weakest first, widening and then sliding down if the band is
 *  empty, so the queue is never blank while a drill anywhere is unsolved. */
export function drillQueue(rating, done = [], n = 8) {
  const floor = readerRank(rating);
  const centre = floor + AIM;
  const unsolved = (list) => list.filter(d => !done.includes(d.id));
  /* The floor is fixed, so widening only ever raises the ceiling: the queue
     reaches further above the reader and never back under them. */
  let found = [];
  for (let band = BAND; band <= 40; band += 2) {
    found = unsolved(drillsAround(centre, { band, floor }));
    if (found.length >= n) return found.slice(0, n);
  }
  if (found.length) return found;
  /* Nothing above them at all: the reader has climbed past the collection
     rather than run out of boards in it. They get the hardest that are left,
     which is the honest thing to hand somebody the ladder has stopped short
     of, and the screen says so. */
  return unsolved(DRILLS)
    .slice()
    .sort((a, b) => rankToNumber(b.rank) - rankToNumber(a.rank))
    .slice(0, n);
}

/** What the collection covers, for a screen that would rather say so than
 *  pretend the ladder goes all the way up. Computed, so it cannot go stale. */
export function coverage(drills = DRILLS) {
  const ranks = drills.map(d => rankToNumber(d.rank));
  const weakest = Math.min(...ranks), strongest = Math.max(...ranks);
  const label = (v) => (v < 0 ? `${-v}k` : `${v}d`);
  return { total: drills.length, from: label(weakest), to: label(strongest) };
}

/** How many drills a reader has solved in the band they are working in. */
export function drillProgress(rating, done = []) {
  const floor = readerRank(rating);
  const mine = drillsAround(floor + AIM, { floor });
  return { total: mine.length, solved: mine.filter(d => done.includes(d.id)).length };
}

export { rankValue };
