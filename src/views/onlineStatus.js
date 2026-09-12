/* ----------------------- ONLINE STATUS (pure) -----------------------
   Text for the online table, free of React so it can be unit-tested.

   `seat` here is a seat id ("b1", "w1", "b2", "w2") and not a colour, because
   at a pair table a colour names two people and the pill has to name one. A
   two-seat room is the same code with only the lead seats filled. */
import { resultLine } from "./gameStatus.js";
import { colorOfSeat, seatToPlay, canSeatPlay, teamSeats } from "../engine/index.js";

const side = (c) => (c === "b" ? "Black" : "White");

/** A team, named: one person at an ordinary table, two at a pair table. */
export const teamName = (room, color) =>
  teamSeats(room.seats, color)
    .map((id) => room.seats[id])
    .filter(Boolean)
    .map((seat) => seat.name)
    .join(" & ") || side(color);

/** The status pill for an online room. `seat` is "b", "w" or null; `conn` is
 *  "connecting" | "open" | "closed". */
export function onlineStatus({ room, seat, conn }) {
  if (!room) return conn === "open" ? "Setting up the table…" : "Connecting…";
  if (conn !== "open") return "Reconnecting…";
  const rec = room.record;
  if (rec.phase === "ended") return resultLine(rec.result);
  const mine = seat ? colorOfSeat(seat) : null;
  if (rec.phase === "scoring") {
    if (room.accepted) {
      // Accepting binds a team, so the waiting and the waited-for are both teams.
      if (room.accepted === mine) return `Waiting for ${teamName(room, mine === "b" ? "w" : "b")} to accept`;
      return `${teamName(room, room.accepted)} accepted the count`;
    }
    return "Mark dead stones, then accept";
  }
  // An undo is asked by one person and answered by the other team, so the ask is
  // named after the person and seen by everyone who is not on their side.
  if (room.undo) {
    const asker = room.seats[room.undo.by];
    if (seat && colorOfSeat(room.undo.by) === mine) return "Undo asked…";
    return `${asker ? asker.name : side(colorOfSeat(room.undo.by))} asks for an undo`;
  }
  const up = seatToPlay(room.seats, rec);
  const next = up ? room.seats[up] : null;
  if (!seat) return next ? `${next.name} to move` : `${side(rec.toPlay)} to move`;
  return canSeatPlay(room.seats, rec, seat) ? "Your move" : next ? `${next.name} to move` : `${side(rec.toPlay)} to move`;
}

/** "+12" / "−9" line for a settled room from `seat`'s side, or null. A pair
 *  table is never rated, so this is null there and nothing has to say so twice. */
export function settledLine(room, seat) {
  if (!room || !room.settled || !room.settled.rated || !seat) return null;
  const mine = room.settled[colorOfSeat(seat)];
  if (!mine) return null;
  return `${mine.delta >= 0 ? "+" : "−"}${Math.abs(mine.delta)} rating · now ${mine.rating}`;
}

/** Fine print under the capture counts. */
export function onlineCaption(room, watching) {
  const parts = [`${room.size}×${room.size}`, `komi ${room.komi}`];
  if (room.pair) parts.push("pair go, four seats");
  parts.push(room.rated ? "rated" : "unrated");
  if (watching > 0) parts.push(`${watching} watching`);
  return parts.join(" · ");
}

/* ----- whose turn it is, and how long the board has been sitting there -----

   A player with six games going does not want a list; they want to know where
   they are the hold-up. So the tables you are waiting on go to the bottom and
   the ones waiting on you go to the top, longest-waiting first, because the
   one you have left the longest is the one somebody is most tired of.

   The elapsed time is not a clock and must never be mistaken for one. Nothing
   here runs out, nobody loses a game by going to bed, and the lobby says so in
   words rather than hoping the absence of a countdown is noticed. */

const MINUTE = 60000, HOUR = 60 * MINUTE, DAY = 24 * HOUR;

/** How long this board has been sitting, in words, or "" when it has just
  * moved and saying so would be noise. */
export function waitingNote(updatedAt, now = Date.now()) {
  if (!Number.isFinite(updatedAt)) return "";
  const ms = now - updatedAt;
  if (!(ms >= 10 * MINUTE)) return "";
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  if (ms < HOUR) return plural(Math.floor(ms / MINUTE), "minute");
  if (ms < DAY) return plural(Math.floor(ms / HOUR), "hour");
  return plural(Math.floor(ms / DAY), "day");
}

/* Your move, then a count waiting on somebody, then their move. A game you
   are only watching sorts with "their move": it is not waiting on you either. */
const URGENCY = { yours: 0, counting: 1, theirs: 2 };

/* Who is sitting on one side of a lobby summary. A pair game lists four people,
   so a side is a list and not a person; a summary from a server that has not
   sent `teams` falls back to the lead seat. It is total on purpose: one row
   that arrived without a side is a row the lobby draws badly, never an
   exception that empties the whole list on the way past. */
const teamOf = (game, c) => {
  const named = game.teams && game.teams[c];
  /* An empty list is not an answer. A summary whose teams arrived empty would
     otherwise beat the lead seat that is sitting right there, and the player
     would be told their own game was somebody else's. */
  const side = named && named.length ? named : [c === "b" ? game.black : game.white];
  return side.filter((p) => p && typeof p === "object");
};
const sideHeld = (game, me) =>
  (teamOf(game, "b").some((p) => p && p.id === me) ? "b"
    : teamOf(game, "w").some((p) => p && p.id === me) ? "w"
    : null);

/** Which of the three a live game is, for a given player. */
export function waitingOn(game, me) {
  if (game.phase === "scoring") return "counting";
  const mine = sideHeld(game, me);
  return mine && game.toPlay === mine ? "yours" : "theirs";
}

/** The lobby's tables, ordered so the ones you are the hold-up on come first.
  *
  * Returns `{ live, done }`: live games by urgency and then longest-waiting
  * first, and finished games most recently finished first. Sorting is stable
  * on the id, so a list that has not changed does not shuffle between polls. */
export function orderTables(games, me) {
  const all = Array.isArray(games) ? games : [];
  const at = (g) => (Number.isFinite(g.updatedAt) ? g.updatedAt : 0);
  const live = all.filter((g) => g.phase !== "ended").sort((a, b) => {
    const d = URGENCY[waitingOn(a, me)] - URGENCY[waitingOn(b, me)];
    if (d !== 0) return d;
    if (at(a) !== at(b)) return at(a) - at(b);
    return String(a.id).localeCompare(String(b.id));
  });
  const done = all.filter((g) => g.phase === "ended").sort((a, b) => {
    const ea = Number.isFinite(a.endedAt) ? a.endedAt : at(a);
    const eb = Number.isFinite(b.endedAt) ? b.endedAt : at(b);
    if (ea !== eb) return eb - ea;
    return String(a.id).localeCompare(String(b.id));
  });
  return { live, done };
}

/** A one-line description of a table for the lobby list. `me` is my player id. */
export function tableLine(game, me) {
  const nameOfTeam = (c) => teamOf(game, c).map((p) => p.name).filter(Boolean).join(" & ");
  const mine = sideHeld(game, me);
  const who = mine
    ? `vs ${nameOfTeam(mine === "b" ? "w" : "b")}`
    : `${nameOfTeam("b")} vs ${nameOfTeam("w")}`;
  if (game.phase === "ended") {
    const r = game.result;
    const won = r && mine && r.winner === mine;
    const verdict = !r ? "finished" : r.winner === null ? "jigo" : mine ? (won ? "won" : "lost") : `${side(r.winner)} won`;
    return { who, detail: `${verdict}${r && r.method === "resign" ? " by resignation" : r && r.margin ? ` by ${r.margin}` : ""}`, live: false, mine };
  }
  const turn = game.phase === "scoring" ? "counting" : mine ? (game.toPlay === mine ? "your move" : "their move") : `${side(game.toPlay)} to move`;
  return { who, detail: `${game.moves} ${game.moves === 1 ? "move" : "moves"} · ${turn}`, live: true, mine };
}
