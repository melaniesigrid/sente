/* ----------------------- FAMOUS GAMES: THE LINES -----------------------
   The sentences the famous-games screen says, with no React in them, so the wording
   can be argued with in a test instead of in a browser.

   The house convention: every helper takes the reader last and defaults to English,
   so a test calls it with no argument and a view passes `useT()`.

   What is and is not translated here follows the journal's rule. The chrome - the
   labels, the counts, the back link, the seat line - is translated. The studies
   themselves are English and say so on the screen: a note about a move is somebody's
   writing rather than a label, and a machine's version of it would be worse than an
   honest English one. */

import { BASE_LOCALE, makeT } from "../i18n/index.js";
import { seatAt, hasSeats, phaseAt, noteAt, notedMoves } from "../content/famous/index.js";

const EN = makeT(BASE_LOCALE);

/** The register under a game's title on the shelf: who, when, how it ended. */
export function shelfLine(game, t = EN) {
  if (!game) return "";
  const parts = [
    game.dateText,
    t("famous.moveCount", { count: game.moves }, `${game.moves} moves`),
    game.result.method === "resign"
      ? t("famous.wonResign", { who: winnerName(game) }, `${winnerName(game)} by resignation`)
      : t("famous.wonMargin", { who: winnerName(game), margin: game.result.margin },
        `${winnerName(game)} by ${game.result.margin}`),
  ];
  return parts.join(" · ");
}

/** The name of whoever won, as the game writes it. */
export const winnerName = (game) =>
  (!game ? "" : game.result.winner === "b" ? game.black : game.white);

/** The two seats, as one line. */
export function seatsLine(game, t = EN) {
  if (!game) return "";
  return t("famous.seats", { black: game.black, white: game.white },
    `${game.black} (black) against ${game.white} (white)`);
}

/** How many of a game's moves carry a note, for the card. */
export function notesLine(game, t = EN) {
  const n = notedMoves(game);
  if (!n) return "";
  return t("famous.notesCount", { count: n }, `${n} moves annotated`);
}

/** A match's register: where, when, and the score. */
export function matchLine(match, t = EN) {
  if (!match) return "";
  return t("famous.matchLine", { where: match.where, when: match.when, score: match.score },
    `${match.where}, ${match.when} · ${match.score}`);
}

/** Whose hand placed this stone, where the record knows. Null everywhere else, and
    null at move 0, which is nobody's move. */
export function seatLine(game, n, t = EN) {
  if (!game || !hasSeats(game.id) || n < 1) return null;
  const who = seatAt(game.id, n);
  if (!who) return null;
  return t("famous.playedBy", { who }, `Placed by ${who}`);
}

/** What the side panel shows at move `n`: the chapter it falls in, the note written
    for this exact move if there is one, and who played it where that is known.
    `note` is null on most moves, which is the honest answer - a note is written where
    there is something to say and nowhere else. */
export function panelAt(game, n, t = EN) {
  if (!game) return null;
  return {
    phase: phaseAt(game, n),
    note: noteAt(game, n),
    seat: seatLine(game, n, t),
    atStart: n === 0,
  };
}

/** The caption over the board: which chapter, out of how many. */
export function chapterLine(game, n, t = EN) {
  const phase = phaseAt(game, n);
  if (!phase) return "";
  const i = game.phases.indexOf(phase) + 1;
  return t("famous.chapter", { n: i, of: game.phases.length, title: phase.title },
    `${phase.title} (${i} of ${game.phases.length})`);
}
