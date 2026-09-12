/* ----------------------- THE DASHBOARD (pure) -----------------------
   Every game you are in the middle of, ordered by who is waiting on whom.
   Free of React so the ordering and the wording can be tested without a page.

   A NOTE ON TIME, BECAUSE THIS FILE LOOKS LIKE IT BREAKS THE RULE
   Everything public in Joseki is coarse to the day on purpose: a page anybody
   can open must not be a way to work out when somebody is at their desk
   (`playerCard.js`, `server/presence.js`). This file says "two minutes ago",
   and that is not a hole in the rule.

   What it describes is a BOARD, not a person, and only boards this player is
   sitting at. How long a game has been waiting is the game's own state: both
   players are at it, either can read the last move's time in the room itself,
   and a game where you cannot tell whether your opponent has just moved is not
   a game. The rule governs what strangers learn about somebody through the
   product; it has never governed what an opponent knows about the game the two
   of them are playing.

   So: this is only ever called with games the reader is in, and the wording
   names the board ("waiting two minutes"), not the person. */

/** Games still being played, as opposed to the ones the list also carries that
 *  have already finished. Scoring counts: somebody is waiting on you. */
export const isLive = (game) => !!game && (game.phase === "playing" || game.phase === "scoring");

/** Which colour this player sits on, or null. Pair teams count.
  *
  * An empty team list is not an answer, so it falls through to the lead seat
  * rather than beating it: a summary whose `teams` arrived empty would
  * otherwise report that nobody is sitting where somebody plainly is, and the
  * player would be told their own game was somebody else's. */
export function sideOf(game, me) {
  for (const colour of ["b", "w"]) {
    const named = game.teams && game.teams[colour];
    const seats = named && named.length ? named : [colour === "b" ? game.black : game.white];
    if ((seats || []).some((p) => p && p.id === me)) return colour;
  }
  return null;
}

/** Is this player the one being waited on? Scoring waits on everybody who has
 *  not accepted, so a game in scoring is yours to answer whatever `toPlay` says. */
export function isYourMove(game, me) {
  const mine = sideOf(game, me);
  if (!mine) return false;
  return game.phase === "scoring" || game.toPlay === mine;
}

/** How long the board has been waiting, in the widest unit that is still
 *  useful. Minutes matter at a live board in a way they never matter on a
 *  public page, which is the whole difference between this and `seenText`. */
export function waitingText(since, now = Date.now()) {
  if (!since) return null;
  const ms = Math.max(0, now - since);
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 minute";
  if (mins < 60) return `${mins} minutes`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour";
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
}

/** Whose move it is, said from this player's seat. */
export function turnText(game, me) {
  if (game.phase === "scoring") return "Counting";
  const mine = sideOf(game, me);
  if (!mine) return game.toPlay === "b" ? "Black to move" : "White to move";
  return isYourMove(game, me) ? "Your move" : "Their move";
}

/** The one line under the opponent's name: whose move, how long the board has
 *  been waiting, and what board it is. */
export function dashLine(game, me, now = Date.now()) {
  const waited = waitingText(game.updatedAt, now);
  const parts = [turnText(game, me)];
  if (waited) parts.push(waited === "just now" ? "moved just now" : `waiting ${waited}`);
  parts.push(`${game.size}×${game.size}`);
  if (game.pair) parts.push("pair go");
  if (!game.rated) parts.push("unrated");
  return parts.join(" · ");
}

/** Who is across the board, named. */
export function opponentName(game, me) {
  const mine = sideOf(game, me);
  const other = mine === "b" ? "w" : "b";
  const named = game.teams && game.teams[other];
  const seats = named && named.length ? named : [other === "b" ? game.black : game.white];
  const names = (seats || []).filter(Boolean).map((p) => p.name).filter(Boolean);
  if (names.length) return names.join(" & ");
  return other === "b" ? "Black" : "White";
}

/** The board, ordered the way somebody actually reads it: the games waiting on
 *  you first, longest-waiting at the top of each group, because the person who
 *  has been kept waiting longest is the one to answer first. A game nobody is
 *  waiting on you for is still listed, below, so the screen is a full account
 *  of what you have going and not only a list of chores. */
export function dashboard(games, me, now = Date.now()) {
  const live = (games || []).filter(isLive);
  const yours = [];
  const theirs = [];
  for (const g of live) (isYourMove(g, me) ? yours : theirs).push(g);
  const oldestFirst = (a, b) => (a.updatedAt || 0) - (b.updatedAt || 0);
  yours.sort(oldestFirst);
  theirs.sort(oldestFirst);
  return { yours, theirs, waiting: yours.length, total: live.length, now };
}
