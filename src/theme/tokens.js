/* ----------------------- THE TOKEN CONTRACT -----------------------
   One place says what a theme is. The stylesheet reads these names, the shell
   writes them, the dojo edits them, and the tests check them against this list
   rather than against a copy of it — so a token cannot be added in one place
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
    role: "The one colour that means here. A mark, never body text — so it is held to 3:1, not 4.5:1.",
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

export const TONE_KEYS = TONES.map(t => t.key);
export const REQUIRED_TONES = TONES.filter(t => t.required).map(t => t.key);

/** Every custom property `.sente-root` receives from a theme. The stylesheet
 *  may name no colour outside its house-default block, so this list is also
 *  the list of things the stylesheet is allowed to ask for. */
export const TOKEN_NAMES = [
  "--ground", "--light", "--dark", "--ink", "--cream",
  "--accent-rgb", "--accent-soft", "--accent-ring", "--danger",
  "--sh-ink", "--sh-lite",
  "--wash-a", "--wash-b", "--scrim",
  "--grid", "--hairline",
  "--stone-b-1", "--stone-b-2", "--stone-b-3",
  "--stone-w-1", "--stone-w-2", "--stone-w-3",
  "--belt-edge",
  "--raise", "--raise-sm", "--sink", "--sink-sm",
];

/** The checks the dojo runs on a palette, and the tests run on every named room. Each
 *  returns a ratio and the floor it has to clear; `grade` in color.js turns a
 *  ratio into words. Keeping them here means the warnings a designer sees in
 *  the dojo are the same rules CI enforces. */
export const RULES = [
  { id: "ink", label: "Ink on ground", a: "ink", b: "ground", min: 4.5,
    why: "Body text. Below 4.5:1 it fails WCAG AA at reading size." },
  { id: "mark", label: "Mark on ground", a: "accent", b: "ground", min: 2.9,
    why: "The accent is a mark, not text. The house eucalyptus sits at 2.99:1 and sets the floor." },
  { id: "warn", label: "Warning on ground", a: "danger", b: "ground", min: 2.9,
    why: "A loss should read at a glance without being read." },
];

/** Shell against slate. Not a tone-against-tone rule, because the black stone
 *  is derived from the ground rather than authored — on a dark board the ink is
 *  the light text and the stone is seated toward the wood. What must never
 *  collapse is the difference between the two stones. (A white stone barely
 *  differs from paper and never has: what separates it there is its rim and its
 *  drop shadow, not its fill.) */
export const STONE_RULE = {
  id: "stones", label: "Shell against slate", min: 4.5,
  why: "Black and white have to be unmistakable at a glance, across a board, at speed.",
};

/** The two shadow tones are the illusion, and they fail in the other
 *  direction: too much contrast and they stop being light. */
export const CLOSENESS = { max: 2.4, why: "A highlight or shadow further than 2.4:1 from its ground reads as a border, not as light." };
