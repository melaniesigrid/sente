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
  teamSeats(room.seats, color).map((id) => room.seats[id].name).join(" & ");

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
  if (!seat) return up ? `${room.seats[up].name} to move` : `${side(rec.toPlay)} to move`;
  return canSeatPlay(room.seats, rec, seat) ? "Your move" : up ? `${room.seats[up].name} to move` : `${side(rec.toPlay)} to move`;
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

/** A one-line description of a table for the lobby list. `me` is my player id. */
export function tableLine(game, me) {
  /* A pair game lists four people, so "mine" is found by looking through both
     teams rather than at the two lead seats. A lobby summary from a server that
     has not sent `teams` still works: the leads stand in for them. */
  const team = (c) => (game.teams ? game.teams[c] : [c === "b" ? game.black : game.white]);
  const nameOfTeam = (c) => team(c).map((p) => p.name).join(" & ");
  const holds = (c) => team(c).some((p) => p.id === me);
  const mine = holds("b") ? "b" : holds("w") ? "w" : null;
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
