// en · voice
/* The house's own voices: the plain-words gloss on each screen, the statement
   over it, Moku's lines, and the small helpers that put a clock, a ruleset or a
   duel result into words.

   The personas' lines are NOT here. A persona is a character with a name, and
   what it says lives in src/content/personas.js beside its playing weights,
   overlaid by id like a lesson. */
export const voice = {
  plainLabel: "In plain words",
  clock: {
    none: "No clock",
    main: "{mins} min",
    byoyomi: "{main} + {periods} x {seconds} s",
    fischer: "{main} + {seconds} s / move",
  },
  duel: {
    won: "Won",
    lost: "Lost",
    byResignation: "{verb} by resignation",
    byMargin: "{verb} by {margin}",
    jigo: "Jigo",
  },
  moku: {
    promotedBelt: "{belt}. Tie it tight.",
    atariMany: {
      one: "{count} group of yours is in atari.",
      other: "{count} groups of yours are in atari.",
    },
  },
};
