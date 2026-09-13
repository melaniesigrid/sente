/* ----------------------- ONLINE STATUS (pure) -----------------------
   Text for the online table, free of React so it can be unit-tested.

   `seat` here is a seat id ("b1", "w1", "b2", "w2") and not a colour, because
   at a pair table a colour names two people and the pill has to name one. A
   two-seat room is the same code with only the lead seats filled. */
import { resultLine } from "./gameStatus.js";
import { colorOfSeat, seatToPlay, canSeatPlay, teamSeats } from "../engine/index.js";
import { sideOf } from "./dashboard.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);
const side = (c, t) => t(`game.side.${c}`);

/** A team, named: one person at an ordinary table, two at a pair table. The
 *  join is a word rather than an ampersand in every language that wants one. */
export const teamName = (room, color, t = EN) =>
  teamSeats(room.seats, color)
    .map((id) => room.seats[id])
    .filter(Boolean)
    .map((seat) => seat.name)
    .join(t("online.table.and")) || side(color, t);

/** The status pill for an online room. `seat` is a seat id or null; `conn` is
 *  "connecting" | "open" | "closed". */
export function onlineStatus({ room, seat, conn }, t = EN) {
  if (!room) return t(conn === "open" ? "online.status.settingUp" : "online.status.connecting");
  if (conn !== "open") return t("online.status.reconnecting");
  const rec = room.record;
  if (rec.phase === "ended") return resultLine(rec.result, t);
  const mine = seat ? colorOfSeat(seat) : null;
  if (rec.phase === "scoring") {
    if (room.accepted) {
      // Accepting binds a team, so the waiting and the waited-for are both teams.
      if (room.accepted === mine) return t("online.status.waitingAccept", { name: teamName(room, mine === "b" ? "w" : "b", t) });
      return t("online.status.accepted", { name: teamName(room, room.accepted, t) });
    }
    return t("game.status.scoring");
  }
  // An undo is asked by one person and answered by the other team, so the ask is
  // named after the person and seen by everyone who is not on their side.
  if (room.undo) {
    const asker = room.seats[room.undo.by];
    if (seat && colorOfSeat(room.undo.by) === mine) return t("online.status.undoPending");
    return t("online.status.undoAsked", { name: asker ? asker.name : side(colorOfSeat(room.undo.by), t) });
  }
  const up = seatToPlay(room.seats, rec);
  const next = up ? room.seats[up] : null;
  const theirMove = next
    ? t("online.status.theirMove", { name: next.name })
    : t(rec.toPlay === "b" ? "game.status.toPlayB" : "game.status.toPlayW");
  if (!seat) return theirMove;
  return canSeatPlay(room.seats, rec, seat) ? t("game.status.yourMove") : theirMove;
}

/** "+12" / "-9" line for a settled room from `seat`'s side, or null. A pair
 *  table is never rated, so this is null there and nothing has to say so twice. */
export function settledLine(room, seat, t = EN) {
  if (!room || !room.settled || !room.settled.rated || !seat) return null;
  const mine = room.settled[colorOfSeat(seat)];
  if (!mine) return null;
  return t("online.settledLine", {
    sign: mine.delta >= 0 ? "+" : "−", delta: Math.abs(mine.delta), rating: mine.rating,
  });
}

/** Fine print under the capture counts. */
export function onlineCaption(room, watching, t = EN) {
  const parts = [
    t("game.caption.board", { size: room.size }),
    t("online.caption.komi", { komi: room.komi }),
  ];
  if (room.pair) parts.push(t("online.caption.pair"));
  parts.push(t(room.rated ? "game.caption.rated" : "game.caption.unrated"));
  if (watching > 0) parts.push(t("online.caption.watching", { count: watching }));
  return parts.join(" · ");
}

/* Which side a player is sitting on, and who is on a side. `dashboard.js` owns
   the question of whose move it is; this is only the naming, which that file
   has no reason to carry. It is total on purpose: one lobby row that arrived
   without a side is a row drawn badly, never an exception that empties the
   whole list on the way past. */
const teamOf = (game, c) => {
  const named = game.teams && game.teams[c];
  const team = named && named.length ? named : [c === "b" ? game.black : game.white];
  return team.filter((p) => p && typeof p === "object");
};

/** A one-line description of a table for the lobby list. `me` is my player id. */
export function tableLine(game, me, t = EN) {
  const nameOfTeam = (c) => teamOf(game, c).map((p) => p.name).filter(Boolean).join(t("online.table.and"));
  const mine = sideOf(game, me);
  const who = mine
    ? t("online.table.vs", { name: nameOfTeam(mine === "b" ? "w" : "b") })
    : t("online.table.between", { black: nameOfTeam("b"), white: nameOfTeam("w") });
  if (game.phase === "ended") {
    const r = game.result;
    const won = r && mine && r.winner === mine;
    const verdict = !r ? t("online.table.finished")
      : r.winner === null ? t("online.table.jigo")
        : mine ? t(won ? "online.table.won" : "online.table.lost")
          : t("online.table.sideWon", { side: side(r.winner, t) });
    const how = r && r.method === "resign" ? t("online.table.byResignation")
      : r && r.margin ? t("online.table.byMargin", { margin: r.margin })
        : "";
    return { who, detail: `${verdict}${how}`, live: false, mine };
  }
  const turn = game.phase === "scoring" ? t("online.table.counting")
    : mine ? t(game.toPlay === mine ? "online.table.yourMove" : "online.table.theirMove")
      : t("online.table.toMove", { side: side(game.toPlay, t) });
  return {
    who,
    detail: t("online.table.detail", { moves: t("online.table.moves", { count: game.moves }), turn }),
    live: true, mine,
  };
}
