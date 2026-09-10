/* ----------------------- ONLINE STATUS (pure) -----------------------
   Text for the online table, free of React so it can be unit-tested. */
import { resultLine } from "./gameStatus.js";

const side = (c) => (c === "b" ? "Black" : "White");

/** The status pill for an online room. `seat` is "b", "w" or null; `conn` is
 *  "connecting" | "open" | "closed". */
export function onlineStatus({ room, seat, conn }) {
  if (!room) return conn === "open" ? "Setting up the table…" : "Connecting…";
  if (conn !== "open") return "Reconnecting…";
  const rec = room.record;
  if (rec.phase === "ended") return resultLine(rec.result);
  const nameOf = (c) => room.seats[c].name;
  if (rec.phase === "scoring") {
    if (room.accepted) {
      if (room.accepted === seat) return `Waiting for ${nameOf(seat === "b" ? "w" : "b")} to accept`;
      return `${nameOf(room.accepted)} accepted the count`;
    }
    return "Mark dead stones, then accept";
  }
  if (room.undo && room.undo.by !== seat) return `${nameOf(room.undo.by)} asks for an undo`;
  if (room.undo && room.undo.by === seat) return "Undo asked…";
  if (!seat) return `${side(rec.toPlay)} to move`;
  return rec.toPlay === seat ? "Your move" : `${nameOf(rec.toPlay)} to move`;
}

/** "+12" / "−9" line for a settled room from `seat`'s side, or null. */
export function settledLine(room, seat) {
  if (!room || !room.settled || !room.settled.rated || !seat) return null;
  const d = room.settled[seat].delta;
  return `${d >= 0 ? "+" : "−"}${Math.abs(d)} rating · now ${room.settled[seat].rating}`;
}

/** Fine print under the capture counts. */
export function onlineCaption(room, watching) {
  const parts = [`${room.size}×${room.size}`, `komi ${room.komi}`, room.rated ? "rated" : "unrated"];
  if (watching > 0) parts.push(`${watching} watching`);
  return parts.join(" · ");
}

/** A one-line description of a table for the lobby list. `me` is my player id. */
export function tableLine(game, me) {
  const mine = game.black.id === me ? "b" : game.white.id === me ? "w" : null;
  const opp = mine === "b" ? game.white : mine === "w" ? game.black : null;
  const who = opp ? `vs ${opp.name}` : `${game.black.name} vs ${game.white.name}`;
  if (game.phase === "ended") {
    const r = game.result;
    const won = r && mine && r.winner === mine;
    const verdict = !r ? "finished" : r.winner === null ? "jigo" : mine ? (won ? "won" : "lost") : `${side(r.winner)} won`;
    return { who, detail: `${verdict}${r && r.method === "resign" ? " by resignation" : r && r.margin ? ` by ${r.margin}` : ""}`, live: false, mine };
  }
  const turn = game.phase === "scoring" ? "counting" : mine ? (game.toPlay === mine ? "your move" : "their move") : `${side(game.toPlay)} to move`;
  return { who, detail: `${game.moves} ${game.moves === 1 ? "move" : "moves"} · ${turn}`, live: true, mine };
}
