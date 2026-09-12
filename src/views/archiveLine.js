/* ----------------------- A LINE IN THE ARCHIVE (pure) -----------------------
   One finished game, said in one line from the point of view of the person
   reading it. Free of React so the wording can be tested without a page.

   `tableLine` in `onlineStatus.js` does this for the lobby, where a game may
   still be running and the reader may be a spectator. An archived game is
   always finished and always one of yours, so this says the two things that
   list is actually read for: who, and how it went. */

const side = (c) => (c === "b" ? "Black" : "White");

/** Everybody on one side of an archived game, named. A pair game has two per
 *  side; a summary from before pair go existed has only the lead seats. */
function team(game, colour) {
  const from = game.teams && game.teams[colour];
  const seats = from && from.length ? from : [colour === "b" ? game.black : game.white];
  return seats.filter(Boolean);
}

const names = (seats) => seats.map((p) => p.name).filter(Boolean).join(" & ");

/** Which side this player sat on, or null when the game was not theirs. */
export function sideOf(game, me) {
  for (const colour of ["b", "w"]) {
    if (team(game, colour).some((p) => p && p.id === me)) return colour;
  }
  return null;
}

/** How a finished game ended, in the words the result card uses: by how much,
 *  by resignation, by time, or level. `result` is the record's. */
export function verdictOf(result) {
  if (!result) return "unfinished";
  if (result.winner === null) return "a draw";
  if (result.method === "resign") return "by resignation";
  if (result.method === "timeout") return "on time";
  return result.margin ? `by ${result.margin}` : "on the count";
}

/** The row. `won` is true, false, or null for a draw or a game that was not
 *  this player's, so the mark beside it has three states and not two. */
export function archiveLine(game, me) {
  const mine = sideOf(game, me);
  const other = mine === "b" ? "w" : "b";
  const who = mine
    ? names(team(game, other)) || side(other)
    : `${names(team(game, "b")) || "Black"} vs ${names(team(game, "w")) || "White"}`;

  const r = game.result;
  const drawn = !!r && r.winner === null;
  const won = !mine || drawn || !r ? null : r.winner === mine;

  const outcome = !r ? "unfinished"
    : drawn ? "a draw"
      : mine ? `${won ? "won" : "lost"} ${verdictOf(r)}`
        : `${side(r.winner)} won ${verdictOf(r)}`;

  const parts = [`${game.size}×${game.size}`, outcome, `${game.moves} moves`];
  if (!game.rated) parts.push("unrated");
  if (game.pair) parts.push("pair go");

  return { who, detail: parts.join(" · "), won, mine };
}
