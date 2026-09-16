/* ----------------------- THE TOKEN CONTRACT -----------------------
   One place says what a theme is. The stylesheet reads these names, the shell
   writes them, the dojo edits them, and the tests check them against this list
   rather than against a copy of it, so a token cannot be added in one place
   and forgotten in another.

   A palette is authored as TONES: seven colours, of which four are always
   written by hand and three have a sane derivation (derive.js) that an author
   may override. Everything else in TOKENS is computed; nobody types it. */

/** The colours a palette is authored from, in the order the dojo shows them. */
export const TONES = [
  {
    key: "ground", label: "Ground", css: "--ground", required: true,
    role: "The paper everything sits on. Every other tone is measured from it.",
  },
  {
    key: "ink", label: "Ink", css: "--ink", required: true,
    role: "Text, the grid, and the black stone's family. Must clear 4.5:1 on the ground.",
  },
  {
    key: "accent", label: "Mark", css: null, required: true,
    role: "The one colour that means here. A mark, never body text, so it is held to 3:1, not 4.5:1.",
  },
  {
    key: "cream", label: "Shell", css: "--cream", required: true,
    role: "The white stone, the territory mark, the dot on a played move.",
  },
  {
    key: "light", label: "Highlight", css: "--light", derivable: true,
    role: "The lit face of every raised thing, top left. Stays close to the ground: far from it, a highlight stops being light and becomes a border.",
  },
  {
    key: "dark", label: "Shadow", css: "--dark", derivable: true,
    role: "The cast shadow, bottom right. Close to the ground for the same reason.",
  },
  {
    key: "danger", label: "Warning", css: "--danger", derivable: true,
    role: "A loss, a resignation, a wrong answer. Warm, and never used for anything neutral.",
  },
];

/** The wood, and there is only one of it.
 *
 *  A goban is an object, not a surface of the page: it is the same slab of kaya
 *  in the morning, at midnight, and in the book the game is printed in. Rooms
 *  used to each derive their own board out of their own ground, which gave the
 *  dark rooms a plank nobody had chosen and moved the board every time the page
 *  moved. Now the page is themed and the board is not: it is this colour in
 *  every room that has a board, and both stones are cut to read on it. (The
 *  printed room, Kifu, has no board: a diagram is drawn on the page, and
 *  derive.js answers with the page there.)
 *
 *  Measured, not asserted: BOARD_RULES in tokens.js holds each stone against
 *  this wood, over every room and every set in the drawer. */
export const BOARD = "#d9b77a";

export const TONE_KEYS = TONES.map(t => t.key);
export const REQUIRED_TONES = TONES.filter(t => t.required).map(t => t.key);

/** Every custom property `.sente-root` receives from a theme. The stylesheet
 *  may name no colour outside its house-default block, so this list is also
 *  the list of things the stylesheet is allowed to ask for. */
export const TOKEN_NAMES = [
  "--ground", "--board", "--light", "--dark", "--ink", "--ink-2", "--ink-3", "--cream",
  "--accent-rgb", "--accent-soft", "--accent-ring", "--accent-ink", "--danger", "--danger-ink",
  "--sh-ink", "--sh-lite",
  "--wash-a", "--wash-b", "--scrim",
  "--grid", "--grid-alpha", "--hairline",
  "--stone-b-1", "--stone-b-2", "--stone-b-3",
  "--stone-w-1", "--stone-w-2", "--stone-w-3",
  "--belt-edge",
  "--raise", "--raise-sm", "--press", "--sink", "--sink-sm",
];

/** The checks the dojo runs on a palette, and the tests run on every named room. Each
 *  returns a ratio and the floor it has to clear; `grade` in color.js turns a
 *  ratio into words. Keeping them here means the warnings a designer sees in
 *  the dojo are the same rules CI enforces. */
/** The floor for anything set at reading size. WCAG AA for body text, and the
 *  reason `--accent-ink` exists: a marked word is text, whatever else it is. */
export const READING = 4.5;

/** The floor for text set large: 24px and up, or 19px bold. WCAG AA grants it
 *  3:1, which is the same floor a mark is held to, and it is the whole licence
 *  `--ink-3` runs on. Nothing small is allowed to spend it. */
export const LARGE = 3;

export const RULES = [
  { id: "ink", label: "Ink on ground", a: "ink", b: "ground", min: READING,
    why: "Body text. Below 4.5:1 it fails WCAG AA at reading size." },
  { id: "mark", label: "Mark on ground", a: "accent", b: "ground", min: 2.9,
    why: "The accent is a mark, not text. The house eucalyptus sits at 2.99:1 and sets the floor." },
  { id: "warn", label: "Warning on ground", a: "danger", b: "ground", min: 2.9,
    why: "A loss should read at a glance without being read." },
];

/** The two stones against each other. Not a tone-against-tone rule, because a
 *  stone is not a tone: the set is data of its own (stones.js). What must never
 *  collapse is the difference between the two stones. */
export const STONE_RULE = {
  id: "stones", label: "The two stones", min: 4.5,
  why: "Black and white have to be unmistakable at a glance, across a board, at speed.",
};

/** Each stone against the wood it is lying on, which is a different question
 *  from the two stones against each other and the one this design system got
 *  wrong for a year. Every dark room passed the rule above at 10:1 or better
 *  and still played badly, because both stones were measured against each other
 *  and neither was measured against the board.
 *
 *  There is one board now (BOARD, above), so this is one question asked of a
 *  set rather than of a room-and-set pair, and it is one-sided the way a real
 *  board is. The black stone has to be findable on the wood. The white one is
 *  separated from kaya by its rim, not by its fill: shell on wood measures
 *  about 1.6:1 on a real board and looking for a floor there would only
 *  produce a board nobody has ever played on. The printed room asks the same
 *  question of ink on its page (boardFor, derive.js).
 */
export const BOARD_RULES = [
  { id: "board-b", label: "Slate on the board", stone: "b", min: 2.5,
    why: "A black stone has to be findable on the wood it is played on, not only against the white one." },
];

/** The two shadow tones are the illusion, and they fail in the other
 *  direction: too much contrast and they stop being light. */
export const CLOSENESS = { max: 2.4, why: "A highlight or shadow further than 2.4:1 from its ground reads as a border, not as light." };
