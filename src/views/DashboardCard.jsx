import { useState, useEffect } from "react";
import { CircleDot, Hourglass, Scale } from "lucide-react";
import { Card, Avatar } from "../components/ui.jsx";
import { api, serverEnabled, SERVER_URL } from "../net/api.js";
import { avatarUrl } from "../net/avatar.js";
import { dashboard, dashLine, opponentName, sideOf } from "./dashboard.js";

/** How often the board refreshes itself. A game where somebody has moved and
 *  the list has not noticed for a minute is a list nobody trusts; a game where
 *  it notices in a second is a poll nobody needs. */
export const DASH_EVERY_MS = 20_000;

/* ----------------------- EVERY GAME YOU ARE IN -----------------------
   The answer to "whose move is it, in all of my games, right now".

   Ordered by who is waiting on whom: the games waiting on you first, and the
   longest wait at the top of each group, because the person kept waiting
   longest is the one to answer first.

   IT IS NOT A CLOCK, AND IT SAYS SO. Clocks on a networked table are an open
   Phase 4 item: the lobby's time control does not reach an online game and
   nothing counts down. What this shows is how long the board has been waiting,
   which is a different fact and an honest one. When the room gets its alarm
   this card gains the clock and loses the sentence. */
export function DashboardCard({ account, go }) {
  const [games, setGames] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const { token } = account;

  useEffect(() => {
    if (!serverEnabled()) return undefined;
    let live = true;
    const ask = () => api.games(token)
      .then((rows) => { if (live) { setGames(rows); setNow(Date.now()); } })
      .catch(() => { if (live) setGames((had) => had || []); });
    ask();
    const timer = setInterval(ask, DASH_EVERY_MS);
    return () => { live = false; clearInterval(timer); };
  }, [token]);

  if (games === null || games.length === 0) return null;
  const board = dashboard(games, account.player.id, now);
  if (board.total === 0) return null;

  return (
    <Card className="dash-card">
      <div className="dash-head">
        <h3>Your tables</h3>
        <span className="fine">
          {board.waiting > 0
            ? `${board.waiting} waiting on you, ${board.total} in all`
            : `${board.total} going, none waiting on you`}
        </span>
      </div>

      <div className="friend-rows">
        {board.yours.map((game) => (
          <DashRow key={game.id} game={game} me={account.player.id} now={now} go={go} yours />
        ))}
        {board.theirs.map((game) => (
          <DashRow key={game.id} game={game} me={account.player.id} now={now} go={go} />
        ))}
      </div>

      <p className="fine">
        How long the board has been waiting, not a clock. Games online are not timed yet.
      </p>
    </Card>
  );
}

function DashRow({ game, me, now, go, yours }) {
  const who = opponentName(game, me);
  const mine = sideOf(game, me);
  const other = mine === "b" ? "w" : "b";
  const seats = (game.teams && game.teams[other]) || [other === "b" ? game.black : game.white];
  const lead = (seats || []).filter(Boolean)[0] || {};
  const Icon = game.phase === "scoring" ? Scale : yours ? CircleDot : Hourglass;

  return (
    <button type="button" className={`friend-who dash-row ${yours ? "waiting" : ""}`}
      onClick={() => go("play", { gameId: game.id })}
      aria-label={`Back to the game against ${who}`}>
      <span className="dash-mark" aria-hidden="true"><Icon size={15} /></span>
      <Avatar name={lead.name || who} tint={lead.tint} size={34}
        src={lead.id ? avatarUrl(SERVER_URL, lead.id, lead.avatarAt) : undefined} />
      <span className="ladder-name">
        <strong>{who}</strong>
        <span className="fine">{dashLine(game, me, now)}</span>
      </span>
    </button>
  );
}
