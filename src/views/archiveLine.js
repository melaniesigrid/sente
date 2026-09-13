/* ----------------------- A LINE IN THE ARCHIVE (pure) -----------------------
   One finished game, said in one line from the point of view of the person
   reading it. Free of React so the wording can be tested without a page.

   `tableLine` in `onlineStatus.js` does this for the lobby, where a game may
   still be running and the reader may be a spectator. An archived game is
   always finished and always one of yours, so this says the two things that
   list is actually read for: who, and how it went. */

import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);
const side = (c, t) => t(`game.side.${c}`);

/** Everybody on one side of an archived game, named. A pair game has two per
 *  side; a summary from before pair go existed has only the lead seats. */
function team(game, colour) {
  const from = game.teams && game.teams[colour];
  const seats = from && from.length ? from : [colour === "b" ? game.black : game.white];
  return seats.filter(Boolean);
}

const names = (seats, t) => seats.map((p) => p.name).filter(Boolean).join(t("online.table.and"));

/** Which side this player sat on, or null when the game was not theirs. */
export function sideOf(game, me) {
  for (const colour of ["b", "w"]) {
    if (team(game, colour).some((p) => p && p.id === me)) return colour;
  }
  return null;
}

/** How a finished game ended, in the words the result card uses: by how much,
 *  by resignation, by time, or level. `result` is the record's. */
export function verdictOf(result, t = EN) {
  if (!result) return t("archive.unfinished");
  if (result.winner === null) return t("archive.draw");
  if (result.method === "resign") return t("archive.byResignation");
  if (result.method === "timeout") return t("archive.onTime");
  return result.margin ? t("archive.byMargin", { margin: result.margin }) : t("archive.onTheCount");
}

/** The row. `won` is true, false, or null for a draw or a game that was not
 *  this player's, so the mark beside it has three states and not two. */
export function archiveLine(game, me, t = EN) {
  const mine = sideOf(game, me);
  const other = mine === "b" ? "w" : "b";
  const who = mine
    ? names(team(game, other), t) || side(other, t)
    : t("online.table.between", {
      black: names(team(game, "b"), t) || side("b", t),
      white: names(team(game, "w"), t) || side("w", t),
    });

  const r = game.result;
  const drawn = !!r && r.winner === null;
  const won = !mine || drawn || !r ? null : r.winner === mine;

  const verdict = verdictOf(r, t);
  const outcome = !r ? t("archive.unfinished")
    : drawn ? t("archive.draw")
      : mine ? t(won ? "archive.youWon" : "archive.youLost", { verdict })
        : t("archive.sideWon", { side: side(r.winner, t), verdict });

  const parts = [
    t("game.caption.board", { size: game.size }),
    outcome,
    t("archive.moves", { count: game.moves }),
  ];
  if (!game.rated) parts.push(t("game.caption.unrated"));
  if (game.pair) parts.push(t("online.dash.pair"));

  return { who, detail: parts.join(" · "), won, mine };
}
