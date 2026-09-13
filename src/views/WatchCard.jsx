import { useState, useEffect, useCallback } from "react";
import { Eye } from "lucide-react";
import { Card } from "../components/ui.jsx";
import { api } from "../net/api.js";
import { watchLine, WATCH_POLL_MS } from "./watchList.js";
import { useT } from "../components/langStore.js";

/* ----------------------- GAMES TO WATCH (card) -----------------------
   The main room: every game being played right now that this person may be
   shown, freshest first, each row a door into the room as a spectator.

   Its own card under the lobby, like the invitations above it, because a
   raised thing inside a raised thing is the one shape the house does not
   draw. It is drawn even when empty, with a quiet line, because a list that
   appears only when it has something on it is a feature nobody finds.

   The empty line never says why a game is missing. The server leaves a game
   out when it is over, when it has gone quiet, or when somebody at the board
   chose not to be seen, and those three are meant to look alike.

   Polled rather than pushed: moves are not sent to the lobby, and this is a
   screen somebody glances at between games rather than a board they are
   playing on. `token` may be null: a visitor with no handle sees the games
   open to anybody. */
export function WatchCard({ token, onWatch }) {
  const t = useT();
  const [games, setGames] = useState([]);
  const [asked, setAsked] = useState(false);

  const refresh = useCallback(async () => {
    try { setGames((await api.live(token)).games || []); }
    catch { /* the lobby is not the place to complain about a list */ }
    finally { setAsked(true); }
  }, [token]);

  useEffect(() => {
    let alive = true;
    const tick = () => { if (alive && document.visibilityState !== "hidden") refresh(); };
    Promise.resolve().then(tick);
    const id = setInterval(tick, WATCH_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { alive = false; clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [refresh]);

  return (
    <Card className="watch-card">
      <div className="stat-head"><Eye size={15} /><span>{t("online.watch.head")}</span></div>
      {games.length > 0 ? (
        <div className="table-list">
          {games.map((g) => <WatchRow key={g.id} game={g} onOpen={() => onWatch(g.id)} />)}
        </div>
      ) : (
        <p className="fine">{asked ? t("online.watch.none") : t("online.lobby.connecting")}</p>
      )}
      <p className="fine">{t("online.watch.note")}</p>
    </Card>
  );
}

function WatchRow({ game, onOpen }) {
  const t = useT();
  const line = watchLine(game, t);
  return (
    <button className="table-row live" onClick={onOpen} aria-label={t("online.watch.open", { who: line.who })}>
      <span className="dot dot-live" aria-hidden="true" />
      <span className="table-who">{line.who}</span>
      <span className="fine">{line.detail}</span>
      <Eye size={13} />
    </button>
  );
}
