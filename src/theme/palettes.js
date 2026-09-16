/* ----------------------- THE THREE ROOMS -----------------------
   Joseki has three rooms and no more: one for daylight, one for night, and one
   to read a finished game in. They came out of a design pass on the game screen
   (2026-09-15) where four directions were drawn side by side and three were
   kept, so each of these is a room somebody chose by looking at it rather than
   a colour scheme somebody named.

     tatami   the table in daylight. Warm stone paper, eucalyptus mark.
     night    the same table after dark. Charcoal page, the same wood.
     kifu     the printed record. Ivory page, terracotta mark, review mode's own.

   A palette is still data, and it is still authored as four colours
   (ground, ink, mark, shell) with the rest derived (derive.js) unless a
   hand-mixed tone beat the computed one, which is what the `light`/`dark`
   overrides below are.

   Every room also names the set it is played with (`stones`, from
   src/theme/stones.js). The set is a default, not a lock: a player who prefers
   one pair everywhere says so on the look page and it follows them from room to
   room. Both table rooms are played with ink and ivory, because that is the
   pair the design pass was drawn with: a black stone that is black, a white one
   with a rim, and nothing grey-brown lying between them.

   What no table room decides any more is the board: there is one wood, BOARD
   in tokens.js, and every room with a board plays on it. The one room without
   a board is Kifu. A kifu is a diagram printed on the page (`print`), so its
   board is its paper, its grid is a hairline in ink, and its stones are ink and
   paper whatever set the player carries: a printed stone is not a rock. */

export const PALETTES = [
  {
    id: "tatami",
    stones: "ebony",
    name: "Tatami",
    mood: "Light",
    note: "Warm stone paper and a eucalyptus mark, with the board in the middle of it and nothing else asking for anything. The room the design system is drawn in.",
    ground: "#ede6d8", ink: "#2a2620", accent: "#6a8a75", cream: "#faf6ee",
    light: "#fbf7ee", dark: "#cdc2ae", danger: "#a8603e",
  },
  {
    id: "night",
    stones: "ebony",
    name: "Night",
    mood: "Dark",
    note: "The same table with the lamp low: a charcoal page, the same wood, and the clock the brightest thing on it until somebody is short of time.",
    ground: "#23262b", ink: "#e8e6e0", accent: "#7fa88f", cream: "#efe9dd",
    light: "#2e3238", dark: "#141619", danger: "#d48a6a",
  },
  {
    id: "kifu",
    // The set names what the look page's plate is drawn from; on the page
    // itself the stones are printed, see `print`.
    stones: "ebony",
    // A diagram, not a table: the board is the paper, the grid a hairline, the
    // stones ink and paper. derive.js reads this; nothing else needs to.
    print: true,
    name: "Kifu",
    mood: "Review",
    note: "The game as a printed record: ivory paper, near-black ink, and terracotta for the move you are standing on. Review mode brings this room with it.",
    ground: "#f5f0e4", ink: "#1e1b17", accent: "#b5573a", cream: "#fbf7ec",
    light: "#fffcf4", dark: "#d7cfbe",
    // Terracotta is the mark here, so a loss cannot also be terracotta or the
    // page says one colour twice and means two things by it. Plum: still warm,
    // still not a neutral, and impossible to mistake for the mark.
    danger: "#7a2f52",
  },
];

/** The room the design system is drawn in, and what anything unrecognised falls
 *  back to. */
export const HOUSE_THEME = "tatami";

/** The room a finished game is read in. Not a preference: review mode draws
 *  itself in Kifu whichever room the player plays in, the way a book is a book
 *  whatever the light in the room is. */
export const REVIEW_THEME = "kifu";

/** The id a palette built in the dojo answers to. It is not in PALETTES: it
 *  lives in the profile, one per device, and only exists once someone has made
 *  one. */
export const DOJO_THEME = "dojo";

/** Follow the device. This is what a profile ships set to, because somebody
 *  opening Joseki at night on a dark machine should not be handed
 *  full-brightness cream and left to go find the setting.
 *
 *  It is not a palette and never appears in PALETTES: it is a pointer at two of
 *  them, resolved at render time by resolveTheme(). */
export const SYSTEM_THEME = "system";
export const SYSTEM_PAIR = { light: HOUSE_THEME, dark: "night" };

/** The rooms Joseki used to ship, and where each one goes now.
 *
 *  A stored theme id is a preference somebody set, so it is carried forward
 *  rather than thrown away with a warning: a player who chose a dark room keeps
 *  a dark room. The two rooms `system` used to point at go back to `system`,
 *  which is what following the device is called. */
const RETIRED = {
  house: SYSTEM_THEME, sumi: SYSTEM_THEME,
  kaya: "tatami", porcelain: "tatami", damson: "tatami", cinnabar: "tatami", gilt: "tatami",
  lacquer: "night", graphite: "night", yohen: "night", prism: "night", foxfire: "night",
};

/** A stored theme id, carried forward. Anything current, `system` or `dojo`
 *  comes back unchanged; a retired room comes back as the room that replaced
 *  it; anything else comes back unchanged and the profile store decides what to
 *  do about it. */
export function migrateThemeId(id) {
  if (typeof id !== "string") return id;
  return RETIRED[id] ?? id;
}
