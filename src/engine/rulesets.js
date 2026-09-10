/* ----------------------- RULESETS -----------------------
   Go is one game with several sets of books. They agree about every move and
   disagree about the last five minutes: how the board is counted, what White is
   owed for going second, what a handicap stone is worth at the end, and whether
   a player may fill their own last liberty.

   Each ruleset here is data, not code, so a new one is an entry rather than a
   branch. What the entries mean:

     scoring     "area"      stones on the board plus the empty points you alone
                             surround. Filling your own territory costs nothing.
                 "territory" the empty points you alone surround, plus every
                             stone you have captured. Filling your own territory
                             costs a point, which is why the endgame reads
                             differently in a Japanese book.
     komi        what White receives, by board size. The first move is worth
                 less on a small board, so komi is smaller there.
     handicapKomi  komi in a handicap game: the stones have already settled the
                 balance, so all that is left is to prevent a draw.
     handicapComp  what White receives at the end for each handicap stone Black
                 was given, under area scoring, where those stones are points:
                 "none", "n" (Chinese), or "n-1" (AGA, the value that makes an
                 area count agree with a territory count).
     suicide     may a player fill their own last liberty?

   Joseki enforces positional superko under every ruleset. Japanese rules answer
   a long cycle with "no result" and Chinese rules may call it a draw; neither
   is a thing a server can do without a referee, so the repetition is refused at
   the point it would be played and the game goes on. That is a real departure
   and it is stated in the app rather than hidden here. */

export const RULESETS = {
  aga: {
    id: "aga", name: "AGA", scoring: "area",
    komi: { 9: 5.5, 13: 6.5, 19: 7.5 }, handicapKomi: 0.5,
    handicapComp: "n-1", suicide: false,
    tagline: "Area scoring, counted so it agrees with the Japanese answer",
    blurb: "Stones plus the points you surround, and White receives one point per handicap stone after the first — the American convention that makes an area count and a territory count land on the same winner.",
  },
  japanese: {
    id: "japanese", name: "Japanese", scoring: "territory",
    komi: { 9: 5.5, 13: 5.5, 19: 6.5 }, handicapKomi: 0.5,
    handicapComp: "none", suicide: false,
    tagline: "Territory and prisoners, the count the books are written in",
    blurb: "Only the points you surround and the stones you have taken. Your own stones are worth nothing, so filling your own territory costs a point and the endgame is sharper by one move.",
  },
  chinese: {
    id: "chinese", name: "Chinese", scoring: "area",
    komi: { 9: 5.5, 13: 6.5, 19: 7.5 }, handicapKomi: 0.5,
    handicapComp: "n", suicide: false,
    tagline: "Area scoring, the count most of the world's professionals use",
    blurb: "Stones plus the points you surround. A handicap stone is a point of Black's area, so White is given one back for each of them.",
  },
  nz: {
    id: "nz", name: "New Zealand", scoring: "area",
    komi: { 9: 5, 13: 6, 19: 7 }, handicapKomi: 0,
    handicapComp: "none", suicide: true,
    tagline: "Area scoring, whole-number komi, and suicide is a legal move",
    blurb: "The shortest rulebook in the game. Komi is a whole number, so a drawn game is possible, and a player may fill their own last liberty — rarely useful, occasionally the only move that works.",
  },
};

export const RULESET_IDS = Object.keys(RULESETS);

/** The ruleset Joseki plays unless told otherwise. AGA because it is what the
 *  app has always played and what every lesson counts in: area scoring with the
 *  handicap compensation that keeps it honest against a territory count. */
export const DEFAULT_RULES = "aga";

/** A ruleset by id, falling back to the default rather than throwing: an id can
 *  arrive from a stored table or an SGF file, and neither is trusted. */
export const rulesetOf = (id) => RULESETS[id] ?? RULESETS[DEFAULT_RULES];

export const isRulesId = (id) => Object.hasOwn(RULESETS, id);

/** Komi for a table: what the board is owed under these rules, or the half
 *  point that only breaks a tie once a handicap has settled the balance. */
export function defaultKomi(handicap = 0, size = 19, rules = DEFAULT_RULES) {
  const set = rulesetOf(rules);
  if (handicap >= 2) return set.handicapKomi;
  return set.komi[size] ?? set.komi[19];
}

/** What White receives at the end for `handicap` stones under these rules.
 *  Territory scoring needs none: a handicap stone is not a point there. */
export function handicapBonus(handicap = 0, rules = DEFAULT_RULES) {
  const set = rulesetOf(rules);
  if (handicap < 2 || set.scoring === "territory") return 0;
  if (set.handicapComp === "n") return handicap;
  if (set.handicapComp === "n-1") return handicap - 1;
  return 0;
}

