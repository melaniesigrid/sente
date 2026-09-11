import { createBoard } from "../engine/board.js";
import { tryPlay } from "../engine/rules.js";

/* ----------------------- THE FIGURES -----------------------
   Eight shapes out of the game, kept here so that a screen can set one at the
   size of a section. They are the ground the statements stand on: a statement
   is the house speaking in six words, and a figure is the same argument made
   in stones, which is the argument this place is actually about.

   A figure is a sequence and not a picture. Each one is the order a teacher
   puts the stones down in, replayed through `tryPlay` — the same function a
   real game goes through — so the captures in them are captures the engine
   performed and not dots somebody remembered to leave out of a diagram. The
   ponnuki really does take a stone off. The ladder really does end in atari on
   the last line: it was not drawn, it was found, by letting Black atari and
   White run until the board ran out.

   That matters for one reason. The front door says the rules live in one
   engine and the screens only draw it, and a hand-drawn shape behind those
   words would be the single lie on the page. Every claim in a `note` below is
   a claim `figures.test.js` puts to the engine — that White cannot play into
   the tiger's mouth, that the bamboo joint answers a cut on either side, that
   the empty triangle is one liberty worse than the same three stones in a
   line. If a note and the engine ever disagree, the build stops.

   Colours are explicit rather than alternating, because a shape being taught
   is not a game being played: nobody puts down a tiger's mouth by playing
   three black stones with three white answers in between. Every move is still
   legal at the moment it is played, which the test also checks. */

/** Rows are read `[column, row, colour]`, from the top left, and played in
 *  order. `size` is the small board the shape is framed on — these are not
 *  positions on a 19, they are shapes at the size the shape needs. */
export const FIGURES = [
  {
    id: "ponnuki",
    name: "Ponnuki",
    note: "Four stones and the hole a captured stone left. The old saying puts it at thirty points; what is actually worth thirty is the thickness, and this is what thickness looks like.",
    size: 5,
    moves: [
      [2, 2, "w"],
      [2, 1, "b"], [1, 2, "b"], [3, 2, "b"], [2, 3, "b"],
    ],
  },
  {
    id: "tigers-mouth",
    name: "The tiger's mouth",
    note: "Three stones bent around an empty point. White may play into it, and it is in atari the moment it lands: one more stone and the mouth closes.",
    size: 5,
    moves: [[2, 1, "b"], [1, 2, "b"], [3, 2, "b"]],
  },
  {
    id: "bamboo",
    name: "The bamboo joint",
    note: "Two stones, a gap, two stones. Cut at either of the two points and the answer is the other one: four stones that cannot be separated without being captured first.",
    size: 5,
    moves: [[1, 1, "b"], [2, 1, "b"], [1, 3, "b"], [2, 3, "b"]],
  },
  {
    id: "ladder",
    name: "The ladder",
    note: "Black ataris, White runs, and the staircase walks to the corner and stops. Twenty-two moves, played out by the engine rather than drawn: the last White stone is in atari on the last line.",
    size: 9,
    moves: [
      [2, 2, "w"], [2, 1, "b"], [1, 2, "b"], [2, 3, "b"], [3, 2, "w"], [3, 1, "b"],
      [4, 2, "b"], [3, 3, "w"], [3, 4, "b"], [4, 3, "w"], [5, 3, "b"], [4, 4, "w"],
      [4, 5, "b"], [5, 4, "w"], [6, 4, "b"], [5, 5, "w"], [5, 6, "b"], [6, 5, "w"],
      [7, 5, "b"], [6, 6, "w"], [6, 7, "b"], [7, 6, "w"], [8, 6, "b"], [7, 7, "w"],
      [8, 7, "b"], [7, 8, "w"], [8, 8, "b"], [6, 8, "w"],
    ],
  },
  {
    id: "ko",
    name: "The ko",
    note: "Black takes, and White may not take it straight back — the one rule that stops the board repeating for ever. White has to ask a question somewhere else first.",
    size: 5,
    moves: [
      [1, 0, "b"], [0, 1, "b"], [1, 2, "b"],
      [2, 0, "w"], [1, 1, "w"], [3, 1, "w"], [2, 2, "w"],
      [2, 1, "b"],
    ],
  },
  {
    id: "two-eyes",
    name: "Two eyes",
    note: "The whole of life in six stones. Neither eye can be filled while the other is open, so neither can ever be filled: this group is finished, and no sequence takes it off the board.",
    size: 7,
    moves: [
      [0, 1, "b"], [1, 1, "b"], [2, 1, "b"], [3, 1, "b"],
      [1, 0, "b"], [3, 0, "b"],
    ],
  },
  {
    id: "empty-triangle",
    name: "The empty triangle",
    note: "The first shape every player is told not to make. Three stones bent around an empty point have seven liberties; the same three in a line have eight. One stone's worth of work, thrown away.",
    size: 5,
    moves: [[1, 1, "b"], [2, 1, "b"], [1, 2, "b"]],
  },
  {
    id: "net",
    name: "The net",
    note: "Not a capture — a promise of one. The stone is loose in the middle of four, and every direction it runs is a direction already covered.",
    size: 6,
    moves: [
      [2, 2, "w"],
      [1, 1, "b"], [3, 1, "b"], [1, 3, "b"], [3, 3, "b"],
    ],
  },
];

export const FIGURE_IDS = FIGURES.map(f => f.id);

/** The figure with this id, or the first one. Never throws: it is called with
 *  a screen's name as often as with a figure's. */
export function figureOf(id) {
  return FIGURES.find(f => f.id === id) || FIGURES[0];
}

/** The board after the first `n` moves of a figure — `n` omitted means all of
 *  them. Every move goes through `tryPlay`, so a move that is not legal at the
 *  moment it is played throws rather than quietly landing. */
export function playFigure(fig, n = fig.moves.length) {
  let board = createBoard(fig.size);
  let ko = null;
  fig.moves.slice(0, n).forEach(([c, r, colour], i) => {
    const res = tryPlay(board, c, r, colour, { koPoint: ko });
    if (!res.ok) throw new Error(`${fig.id}: move ${i + 1} at ${c},${r} is ${res.reason}`);
    board = res.board;
    ko = res.ko;
  });
  return board;
}

/** Every board the figure passes through, one per move, for anything that
 *  wants to watch it being played rather than look at the end of it. */
export function figureFrames(fig) {
  return fig.moves.map((_, i) => playFigure(fig, i + 1));
}

/** Every stone the figure ever holds, with the move it lands on and the move it
 *  is taken off at — `gone` is null for a stone that survives to the end.
 *
 *  A figure that is only its last frame is a diagram, and a diagram cannot show
 *  the one thing these shapes are about: the ponnuki's hole is a stone that was
 *  there, and the ko is a stone taken. So the drawing wants the lives, not the
 *  board, and this is where the lives are worked out — from the frames the
 *  engine produced, never from a list somebody kept by hand. */
export function figureLives(fig) {
  const frames = figureFrames(fig);
  const size = fig.size;
  return fig.moves.map(([c, r, colour], i) => {
    const cell = r * size + c;
    let gone = null;
    for (let k = i + 1; k < frames.length; k++) {
      if (frames[k].cells[cell] !== colour) { gone = k; break; }
    }
    return { c, r, colour, laid: i, gone };
  });
}

/* Which figure stands behind which screen. A screen keeps its figure so that
   coming back to it is coming back to the same room, and the pairing is an
   argument rather than a shuffle: the ladder behind the lessons because it is
   the first thing reading means, two eyes behind the tsumego because every
   life-and-death problem is that question, the ko behind the ladder of ranks
   because a rating is a thing you take back and forth. */
const BY_SCREEN = {
  home: "ponnuki",
  learn: "ladder",
  play: "tigers-mouth",
  tsumego: "two-eyes",
  profile: "bamboo",
  ladder: "ko",
  recall: "net",
  rules: "tigers-mouth",
  fell: "net",
  honest: "empty-triangle",
  begin: "ponnuki",
};

/** The figure a screen or a landing band is set on. */
export function figureFor(screen) {
  return figureOf(BY_SCREEN[screen] || FIGURE_IDS[0]);
}
