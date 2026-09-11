/* ----------------------- ONLINE STATUS (pure) -----------------------
   Text for the online table, free of React so it can be unit-tested. */
import { resultLine } from "./gameStatus.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);
const side = (c, t) => t(`game.side.${c}`);

/** The status pill for an online room. `seat` is "b", "w" or null; `conn` is
 *  "connecting" | "open" | "closed". */
export function onlineStatus({ room, seat, conn }, t = EN) {
  if (!room) return t(conn === "open" ? "online.status.settingUp" : "online.status.connecting");
  if (conn !== "open") return t("online.status.reconnecting");
  const rec = room.record;
  if (rec.phase === "ended") return resultLine(rec.result, t);
  const nameOf = (c) => room.seats[c].name;
  if (rec.phase === "scoring") {
    if (room.accepted) {
      if (room.accepted === seat) return t("online.status.waitingAccept", { name: nameOf(seat === "b" ? "w" : "b") });
      return t("online.status.accepted", { name: nameOf(room.accepted) });
    }
    return t("game.status.scoring");
  }
  if (room.undo && room.undo.by !== seat) return t("online.status.undoAsked", { name: nameOf(room.undo.by) });
  if (room.undo && room.undo.by === seat) return t("online.status.undoPending");
  if (!seat) return t(rec.toPlay === "b" ? "game.status.toPlayB" : "game.status.toPlayW");
  return rec.toPlay === seat ? t("game.status.yourMove") : t("online.status.theirMove", { name: nameOf(rec.toPlay) });
}

/** "+12" / "−9" line for a settled room from `seat`'s side, or null. */
export function settledLine(room, seat, t = EN) {
  if (!room || !room.settled || !room.settled.rated || !seat) return null;
  const d = room.settled[seat].delta;
  return t("online.settledLine", {
    sign: d >= 0 ? "+" : "−", delta: Math.abs(d), rating: room.settled[seat].rating,
  });
}

/** Fine print under the capture counts. */
export function onlineCaption(room, watching, t = EN) {
  const parts = [
    t("game.caption.board", { size: room.size }),
    t("online.caption.komi", { komi: room.komi }),
    t(room.rated ? "game.caption.rated" : "game.caption.unrated"),
  ];
  if (watching > 0) parts.push(t("online.caption.watching", { count: watching }));
  return parts.join(" · ");
}

/** A one-line description of a table for the lobby list. `me` is my player id. */
export function tableLine(game, me, t = EN) {
  const mine = game.black.id === me ? "b" : game.white.id === me ? "w" : null;
  const opp = mine === "b" ? game.white : mine === "w" ? game.black : null;
  const who = opp
    ? t("online.table.vs", { name: opp.name })
    : t("online.table.between", { black: game.black.name, white: game.white.name });
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
