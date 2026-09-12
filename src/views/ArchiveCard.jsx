import { useState, useEffect, useCallback, useRef } from "react";
import { Download, Loader, ChevronDown, Swords, Star, StarOff } from "lucide-react";
import { Card, Btn } from "../components/ui.jsx";
import { api, serverEnabled } from "../net/api.js";
import { saveAccount } from "../store/account.js";
import { monthYear } from "./playerCard.js";
import { archiveLine } from "./archiveLine.js";
import { MAX_FEATURED, NOTE_MAX } from "../../server/featured.js";

/* ----------------------- THE ARCHIVE -----------------------
   Every finished game you have played here, newest first, a page at a time.

   The lobby's "your tables" answers what you are in the middle of and is
   capped; this is the other question and is kept for good. It is paged rather
   than fetched whole because it has no ceiling: a club player with a thousand
   games should cost the same to open as one with ten.

   Each row carries its SGF as a plain link rather than a button that fetches.
   The server names the file, the browser saves it, and nothing has to hold a
   game in memory to hand it over. */
export function ArchiveCard({ account, setAccount, notify, go }) {
  const [games, setGames] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const { token } = account;

  const more = useCallback(async (from) => {
    if (!serverEnabled()) return;
    setBusy(true);
    try {
      const r = await api.archive(token, from);
      if (!alive.current) return;
      setGames((had) => [...(from ? had || [] : []), ...r.games]);
      setCursor(r.cursor);
    } catch {
      if (alive.current) setGames((had) => had || []);
    } finally {
      if (alive.current) setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    let live = true;
    if (!serverEnabled()) return undefined;
    api.archive(token, null)
      .then((r) => { if (live) { setGames(r.games); setCursor(r.cursor); } })
      .catch(() => { if (live) setGames([]); });
    return () => { live = false; };
  }, [token]);

  return (
    <Card className="archive-card">
      <div className="op-head">
        <div className="op-id">
          <h3>Your games</h3>
          <p className="fine">
            Every game you have finished against a person here, newest first. Games against
            the house players are played in your browser and never reach the server, so they
            are not in this list.
          </p>
        </div>
      </div>

      {games === null ? (
        <p className="fine">Fetching your games…</p>
      ) : games.length === 0 ? (
        <p className="fine">
          No finished games against a person yet. The online card in Play is where that starts.
        </p>
      ) : (
        <>
          <div className="friend-rows">
            {games.map((game) => (
              <ArchiveRow key={game.id} game={game} me={account.player.id} go={go}
                account={account} setAccount={setAccount} notify={notify} />
            ))}
          </div>
          {cursor && (
            <div className="row">
              <Btn icon={busy ? Loader : ChevronDown} small disabled={busy}
                onClick={() => more(cursor)}>{busy ? "Fetching…" : "Older games"}</Btn>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function ArchiveRow({ game, me, go, account, setAccount, notify }) {
  const line = archiveLine(game, me);
  const pins = account.player.featured || [];
  const pinned = pins.some((e) => e.id === game.id);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(() => (pins.find((e) => e.id === game.id) || {}).note || "");
  const [busy, setBusy] = useState(false);

  const save = async (next) => {
    setBusy(true);
    try {
      const player = next === null
        ? await api.unpinGame(account.token, game.id)
        : await api.pinGame(account.token, game.id, next);
      setAccount({ token: account.token, player });
      saveAccount({ token: account.token, player });
      notify({ icon: "info", text: next === null ? "Taken off your page" : "Shown on your page" });
      setEditing(false);
    } catch (e) {
      notify({ icon: "info", text: pinError(e.reason) });
    } finally { setBusy(false); }
  };

  return (
    <>
    <div className="archive-row">
      <button type="button" className="friend-who"
        onClick={() => go("play", { gameId: game.id })}
        aria-label={`Open the game against ${line.who}`}>
        <span className={`archive-mark ${line.won === true ? "won" : line.won === false ? "lost" : ""}`}
          aria-hidden="true"><Swords size={15} /></span>
        <span className="ladder-name">
          <strong>{line.who}</strong>
          <span className="fine">{line.detail}</span>
        </span>
      </button>
      <span className="fine archive-when">{monthYear(game.endedAt)}</span>
      <Btn icon={pinned ? StarOff : Star} small disabled={busy}
        onClick={() => (pinned ? save(null) : setEditing((v) => !v))}
        label={pinned ? `Take the game against ${line.who} off your page`
          : `Show the game against ${line.who} on your page`} />
      {/* A plain link, so the browser saves the file the server names rather
          than the page holding a game in memory to hand it over. */}
      <a className="btn btn-sm" href={api.sgfUrl(game.id)} download
        aria-label={`Save the record of the game against ${line.who}`}>
        <Download size={14} strokeWidth={2.2} /><span>SGF</span>
      </a>
    </div>
    {editing && !pinned && (
      <div className="pin-note">
        <label className="op-label" htmlFor={`pin-${game.id}`}>A line about this game, if you like</label>
        <input id={`pin-${game.id}`} className="chat-input" value={note} maxLength={NOTE_MAX}
          placeholder="The one where I finally killed a dragon"
          onChange={(e) => setNote(e.target.value)} />
        <div className="row">
          <Btn icon={busy ? Loader : Star} small primary disabled={busy}
            onClick={() => save(note)}>{busy ? "Saving…" : "Show it"}</Btn>
          <Btn small onClick={() => setEditing(false)}>Cancel</Btn>
          <span className="fine">At most {MAX_FEATURED} games. Everybody who opens your page sees this.</span>
        </div>
      </div>
    )}
    </>
  );
}

/** The two ways pinning is refused, in the house voice. */
const pinError = (reason) => ({
  "too-many-featured": `You are already showing ${MAX_FEATURED} games. Take one off first.`,
  "not-your-game": "You can only show a game you played",
  offline: "The server is out of reach right now",
}[reason] ?? `Something went wrong (${reason})`);
