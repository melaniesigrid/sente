import { useState, useEffect, useCallback, useRef } from "react";
import { Download, Loader, ChevronDown, Swords, Star, StarOff } from "lucide-react";
import { Card, Btn } from "../components/ui.jsx";
import { api, serverEnabled } from "../net/api.js";
import { saveAccount } from "../store/account.js";
import { monthYear } from "./playerCard.js";
import { useT } from "../components/langStore.js";
import { lineOr } from "../i18n/index.js";
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

  const t = useT();

  return (
    <Card className="archive-card">
      <div className="op-head">
        <div className="op-id">
          <h3>{t("archive.head")}</h3>
          <p className="fine">{t("archive.note")}</p>
        </div>
      </div>

      {games === null ? (
        <p className="fine">{t("archive.fetching")}</p>
      ) : games.length === 0 ? (
        <p className="fine">{t("archive.empty")}</p>
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
                onClick={() => more(cursor)}>{t(busy ? "archive.fetchingMore" : "archive.older")}</Btn>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function ArchiveRow({ game, me, go, account, setAccount, notify }) {
  const t = useT();
  const line = archiveLine(game, me, t);
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
      notify({ icon: "info", text: t(next === null ? "archive.takenOff" : "archive.shown") });
      setEditing(false);
    } catch (e) {
      notify({ icon: "info", text: pinError(e.reason, t) });
    } finally { setBusy(false); }
  };

  return (
    <>
    <div className="archive-row">
      <button type="button" className="friend-who"
        onClick={() => go("play", { gameId: game.id })}
        aria-label={t("player.openGame", { name: line.who })}>
        <span className={`archive-mark ${line.won === true ? "won" : line.won === false ? "lost" : ""}`}
          aria-hidden="true"><Swords size={15} /></span>
        <span className="ladder-name">
          <strong>{line.who}</strong>
          <span className="fine">{line.detail}</span>
        </span>
      </button>
      <span className="fine archive-when">{monthYear(game.endedAt, t)}</span>
      <Btn icon={pinned ? StarOff : Star} small disabled={busy}
        onClick={() => (pinned ? save(null) : setEditing((v) => !v))}
        label={t(pinned ? "archive.unpinLabel" : "archive.pinLabel", { name: line.who })} />
      {/* A plain link, so the browser saves the file the server names rather
          than the page holding a game in memory to hand it over. */}
      <a className="btn btn-sm" href={api.sgfUrl(game.id)} download
        aria-label={t("archive.saveSgf", { name: line.who })}>
        <Download size={14} strokeWidth={2.2} /><span>SGF</span>
      </a>
    </div>
    {editing && !pinned && (
      <div className="pin-note">
        <label className="op-label" htmlFor={`pin-${game.id}`}>{t("archive.noteLabel")}</label>
        <input id={`pin-${game.id}`} className="chat-input" value={note} maxLength={NOTE_MAX}
          placeholder={t("archive.notePlaceholder")}
          onChange={(e) => setNote(e.target.value)} />
        <div className="row">
          <Btn icon={busy ? Loader : Star} small primary disabled={busy}
            onClick={() => save(note)}>{t(busy ? "archive.saving" : "archive.showIt")}</Btn>
          <Btn small onClick={() => setEditing(false)}>{t("game.cancel")}</Btn>
          <span className="fine">{t("archive.pinNote", { max: MAX_FEATURED })}</span>
        </div>
      </div>
    )}
    </>
  );
}

/** The three ways pinning is refused, in the house voice. */
const pinError = (reason, t) =>
  lineOr(t, `archive.error.${reason}`, t("online.friends.error.unknown", { reason }), { max: MAX_FEATURED });
