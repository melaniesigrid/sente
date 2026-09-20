/* ----------------------- THE THREE ROOMS -----------------------
   Joseki has three rooms and no more: one for daylight, one for night, and one
   to read a finished game in. They came out of a design pass on the game screen
   (2026-09-15) where four directions were drawn side by side and three were
   kept, so each of these is a room somebody chose by looking at it rather than
   a colour scheme somebody named.

     tatami   the table in daylight. Warm stone paper, eucalyptus mark.
     night    the same table after dark. Charcoal page, the same wood.
     kifu     the printed record. Ivory page, terracotta mark, review mode's own.

   Two of those are rooms you choose. Kifu is the one you are put in, by review
   mode, for as long as you are reading a finished game; the look page does not
   offer it (REVIEW_THEME, below, says why). So the picker holds two rooms, the
   device, and whatever the dojo built.

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
    // stones ink and paper. derive.js reads this; nothing else needs to, and
    // the dojo never carries it: a room built there is a table room, and a
    // stored palette cannot smuggle it in (sanitizePalette keeps tones only).
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

/** The room a finished game is read in. Not a preference, and since 2026-09-16
 *  not offered as one: review mode draws itself in Kifu whichever room the
 *  player plays in, the way a book is a book whatever the light in the room is.
 *
 *  It stayed in the look page's picker for a day longer than it should have,
 *  and choosing it there put the whole place on the printed page: the Play
 *  screen became a diagram, and the stone picker went on offering eight sets
 *  that a printed room cannot draw, because `print` answers with ink and paper
 *  whatever is in the drawer. `roomsFor` leaves it out now, and a stored `kifu`
 *  migrates to the light table room below. Kifu is still a palette, still in
 *  PALETTES, and still every bit of Review.jsx's room; it is simply not
 *  somewhere you can sit down. */
export const REVIEW_THEME = "kifu";

/** The rooms somebody is allowed to sit in: every palette but the review room.
 *
 *  A rule about which palettes a profile may hold, so it lives here with the
 *  palettes rather than in the screen that happens to draw them. Three surfaces
 *  ask it -- the look page's picker, the profile card's plate strip, and the
 *  landing page's count -- and the same filter written out three times is the
 *  one that drifts. A constant, not a function: PALETTES never changes at
 *  runtime, and both of the view callers are on a render path. */
export const CHOOSABLE_ROOMS = PALETTES.filter(p => p.id !== REVIEW_THEME);

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

/** Where a stored theme id that nobody can choose any more goes.
 *
 *  Two kinds of id live here, and the difference matters to anyone editing the
 *  map. Most are RETIRED: rooms Joseki used to ship and no longer has at all. A
 *  stored id is a preference somebody set, so it is carried forward rather than
 *  thrown away with a warning — a player who chose a dark room keeps a dark
 *  room, and the two rooms `system` used to point at go back to `system`, which
 *  is what following the device is called.
 *
 *  `kifu` is the other kind: not retired, UN-OFFERED. The palette still ships,
 *  it is still in PALETTES, and review mode still draws itself in it; it simply
 *  stopped being something a profile may hold (CHOOSABLE_ROOMS, above). Do not
 *  delete this line on the grounds that the room still exists — that is exactly
 *  why it is here. Somebody who picked it picked a light page, so the light
 *  table room is where they land, and they get their stones back, which the
 *  printed room was quietly taking from them. */
const MOVED = {
  // Retired: the room is gone.
  house: SYSTEM_THEME, sumi: SYSTEM_THEME,
  kaya: "tatami", porcelain: "tatami", damson: "tatami", cinnabar: "tatami", gilt: "tatami",
  lacquer: "night", graphite: "night", yohen: "night", prism: "night", foxfire: "night",
  // Un-offered: the room still ships, it is just not a preference any more.
  kifu: "tatami",
};

/** A stored theme id, carried forward. A choosable room, `system` or `dojo`
 *  comes back unchanged; a room that has been retired or un-offered comes back
 *  as the room it moved to; anything else comes back unchanged and the profile
 *  store decides what to do about it.
 *
 *  Own keys only. `RETIRED[id]` walked the prototype chain, so `"constructor"`
 *  came back as a function rather than as itself, and the store's `typeof value
 *  === "string"` check was the only thing between that and a stored theme. */
export function migrateThemeId(id) {
  if (typeof id !== "string") return id;
  return Object.hasOwn(MOVED, id) ? MOVED[id] : id;
}
