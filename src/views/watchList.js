/* ----------------------- THE LIST OF GAMES TO WATCH (pure) -----------------------
   The words on one row of the lobby's "games to watch" list, and how often the
   list is asked for again. The rule for which games are on it lives on the
   server (`server/watch.js`): a game is offered only when every player at that
   board lets the viewer see they are here. This file never decides that; it
   only says what a row it was handed reads like.

   The row is the two names, then the board and where the game has got to. It
   is a spectator's line, so it never says "your move": nobody reading it has
   a move. */

/** How often the list is refreshed while the lobby is open. Moves change it
 *  and moves are not pushed to the lobby, so it is polled, gently: this is a
 *  screen somebody is glancing at, not a board they are playing on. */
export const WATCH_POLL_MS = 20_000;

/** `{ who, detail }` for one row. `t` is the catalogue reader. */
export function watchLine(game, t) {
  const who = t("online.table.between", { black: game.black ? game.black.name : "?", white: game.white ? game.white.name : "?" });
  const moves = t("online.table.moves", { count: game.moves || 0 });
  const turn = game.phase === "scoring"
    ? t("online.table.counting")
    : t("online.table.toMove", { side: t(game.toPlay === "w" ? "game.side.w" : "game.side.b") });
  const detail = `${t("game.caption.board", { size: game.size })} · ${moves} · ${turn}`;
  return { who, detail };
}
