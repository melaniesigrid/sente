import { useState, useEffect, useRef, useCallback } from "react";
import { Radio, X, Play, Eye, LogOut, DoorOpen, Mail, Users, UsersRound } from "lucide-react";
import { Card, Btn, Avatar, RankBadge } from "../components/ui.jsx";
import { api, lobbySocket, serverEnabled, SERVER_URL } from "../net/api.js";
import { loadAccount, saveAccount, clearAccount } from "../store/account.js";
import { provisionalText } from "../content/online.js";
import { DEFAULT_PARTNER_RANK } from "../engine/index.js";
import { tableLine } from "./onlineStatus.js";
import { dashboard, waitingText, waitedMinutes } from "./dashboard.js";
import { AccountGate } from "./AccountGate.jsx";
import { InvitesCard } from "./InvitesCard.jsx";
import { useInvites } from "./useInvites.js";
import { HereNow } from "./HereNow.jsx";
import { useFriends } from "./useFriends.js";
import { avatarUrl } from "../net/avatar.js";
import { errorText, formProblem } from "./accountForm.js";
import { useT } from "../components/langStore.js";

/* ----------------------- ONLINE LOBBY (card) -----------------------
   Get in, then look for an opponent. Getting in is `AccountGate`: an address
   and a password, or a handle kept in this browser alone. The server rates
   games with Glicko-2 and keeps the ladder.
   `onPlay(session)` opens a table: `{ mode: { kind: "online", gameId } }`.
   The board comes from the lobby's table picker, so one control sets the
   size for every kind of game. Online games are even; handicap is a house
   arrangement, and two strangers have no way to agree on one yet. */
export function OnlineCard({ profile, notify, onPlay, size = 9, go = null }) {
  const [account, setAccount] = useState(() => loadAccount());
  if (!serverEnabled()) return null;
  return account
    ? <Lobby account={account} setAccount={setAccount} notify={notify} onPlay={onPlay} size={size} go={go} />
    : <AccountGate profile={profile} notify={notify} onSignedIn={setAccount} />;
}

function Lobby({ account, setAccount, notify, onPlay, size, go }) {
  const t = useT();
  /* The lobby socket outlives a change of language, and reconnecting it to
     translate one toast would drop a player out of the queue they are waiting
     in. Its callbacks read the current reader out of a ref instead. */
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const { token } = account;
  const [player, setPlayer] = useState(account.player);
  const [word, setWord] = useState("");             // a rendezvous word, or "" for anyone
  const [seek, setSeek] = useState(null);           // null | { size, key, pair, rengo }
  /* Which team to join at a rengo table: null means "either". Two people who agree
     on a rendezvous word and pick the same team are partners, and that is the whole
     invite mechanism - no friend list, no accounts, no second protocol. */
  const [team, setTeam] = useState(null);
  const [lobby, setLobby] = useState(null);         // { online, seeking }
  const [conn, setConn] = useState("connecting");
  const [tables, setTables] = useState([]);
  const sock = useRef(null);
  const onPlayRef = useRef(onPlay);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);
  /* Who has asked you for a game. Accepting one opens the board here, which is
     the screen somebody is already on when they take an invitation up. */
  const shelf = useInvites(token, notify, (table) => onPlayRef.current({ mode: { kind: "online", gameId: table.gameId } }));
  const shelfRef = useRef(shelf.refresh);
  useEffect(() => { shelfRef.current = shelf.refresh; }, [shelf.refresh]);
  /* The book, for the strip of friends who are here. One small call, and the
     only reason the lobby needs it: presence has been on this server since it
     shipped and has only ever been drawn on the profile screen, which is not
     where anybody is standing when they want a game. */
  const { book } = useFriends(token, notify);

  const refresh = useCallback(async () => {
    try {
      const [me, games] = await Promise.all([api.me(token), api.games(token)]);
      setPlayer(me);
      saveAccount({ token, player: me });
      setTables(games);
    } catch (e) {
      if (e.status === 401) { clearAccount(); setAccount(null); }
    }
  }, [token, setAccount]);

  useEffect(() => { Promise.resolve().then(refresh); }, [refresh]);

  useEffect(() => {
    sock.current = lobbySocket(token, {
      onStatus: setConn,
      onFrame: (f) => {
        if (f.t === "lobby") setLobby({ online: f.online, seeking: f.seeking });
        else if (f.t === "seek") setSeek(f.status === "waiting" ? { size: f.size, key: f.key, pair: f.pair ?? null, rengo: !!f.rengo, seated: f.seated, of: f.of, blocked: f.blocked ?? null } : null);
        else if (f.t === "invited") {
          /* Somebody asked for a game while this screen was open. The shelf is
             read again rather than patched from the frame: the frame is one
             invitation and the card shows both lists, and a card built out of
             pushes drifts from the server the first time one is missed. */
          shelfRef.current();
          notify({ icon: "medal", text: tRef.current("online.invites.arrived", { name: f.from.name }) });
        }
        else if (f.t === "matched") {
          setSeek(null);
          notify({ icon: "trophy", text: tRef.current("online.lobby.matched", { name: f.opponent.name, side: tRef.current(`game.side.${f.color}`) }) });
          onPlayRef.current({ mode: { kind: "online", gameId: f.gameId } });
        }
      },
    });
    return () => { sock.current.close(); sock.current = null; };
  }, [token, notify]);

  const key = word.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) || null;
  /* A pair seek names the partner rank it wants and only ever meets another pair
     seek: sitting down expecting a partner and getting an ordinary game is not a
     near miss, it is a different game. */
  const findGame = (opts = null) => {
    const frame = { t: "seek", size, key, ...(opts ?? {}) };
    if (sock.current && sock.current.send(frame)) setSeek({ size, key, ...(opts ?? {}) });
  };
  const cancel = () => { if (sock.current) sock.current.send({ t: "cancel" }); setSeek(null); };
  const signOut = async () => {
    try { await api.signOut(token); } catch (e) { if (e.status !== 401) { notify({ icon: "info", text: errorText(e.reason, t) }); return; } }
    clearAccount();
    setAccount(null);
    notify({ icon: "info", text: t("online.lobby.signedOut") });
  };

  const attach = async (email, password) => {
    const me = await api.addAccount(token, email, password);
    setPlayer(me);
    saveAccount({ token, player: me });
    // Not awaited: the handle is already kept, and a slow mail server should
    // not make it look as though it was not. The row below offers the letter
    // again for as long as the address is unconfirmed.
    api.sendConfirmation(token).catch(() => {});
    notify({ icon: "medal", text: t("online.lobby.kept") });
  };

  const leave = async () => {
    if (!window.confirm(t("online.lobby.leaveAsk"))) return;
    try { await api.leave(token); } catch (e) { if (e.status !== 401) { notify({ icon: "info", text: t("online.lobby.noServer") }); return; } }
    clearAccount();
    setAccount(null);
    notify({ icon: "info", text: t("online.lobby.removed") });
  };

  /* Ordered rather than filtered: the tables you are the hold-up on come first,
     so six games going is a list of what to do rather than a pile. The rule for
     whose move it is lives in `dashboard.js` and is asked, never restated: the
     front page and this list must never disagree about the same board. */
  const openPage = (person) => (go ? go("player", { playerId: person.id, from: "play" }) : null);
  const board = dashboard(tables, player.id);
  const live = [...board.yours, ...board.theirs];
  const done = tables.filter(t => t.phase === "ended")
    .sort((a, b) => (b.endedAt || b.updatedAt || 0) - (a.endedAt || a.updatedAt || 0))
    .slice(0, 3);
  const yours = board.waiting;

  return (
    <>
    {/* Its own card, above the lobby rather than inside it: a raised thing
        inside a raised thing is the one shape the house does not draw. It is
        above because it is the shorter way into a game than looking for a
        stranger, and it is absent entirely when the shelf is empty. */}
    <InvitesCard shelf={shelf} onOpen={openPage} />
    <HereNow token={token} book={book} invites={shelf} size={size} onOpen={openPage} />
    <Card className="online-card">
      <div className="persona-top">
        <Avatar name={player.name} tint={player.tint} size={52} src={avatarUrl(SERVER_URL, player.id, player.avatarAt)} />
        <div>
          <h3>{player.name}</h3>
          <p className="persona-tag">
            {t("online.lobby.record", { provisional: provisionalText(player, t), wins: player.wins, losses: player.losses })}
            {player.draws ? t("online.lobby.draws", { draws: player.draws }) : ""}
            {lobby ? t("online.lobby.onlineCount", { count: lobby.online }) : conn === "open" ? "" : t("online.lobby.connecting")}
          </p>
        </div>
        <RankBadge rating={player.rating} />
      </div>
      {seek ? (
        <div className="seek-state" role="status">
          <Radio size={16} className="pulse" />
          <span>
            {seek.rengo
              ? seek.blocked
                ? t("online.lobby.rengoBlocked", { seated: seek.seated, size: seek.size, team: seek.blocked })
                : t(team ? "online.lobby.rengoSeatedTeam" : "online.lobby.rengoSeated",
                    { seated: seek.seated ?? 1, size: seek.size, team })
              : seek.pair
              ? t("online.lobby.pairLooking", { size: seek.size, rank: seek.pair.rank })
              : seek.key
                ? t("online.lobby.waitingWord", { word: seek.key, size: seek.size })
                : lobby && lobby.seeking > 1
                  ? t("online.lobby.lookingOthers", { size: seek.size, count: lobby.seeking - 1 })
                  : t("online.lobby.looking", { size: seek.size })}
          </span>
          <Btn icon={X} small onClick={cancel}>{t("online.lobby.cancel")}</Btn>
        </div>
      ) : (
        <>
          <div className="row">
            <Btn icon={Play} primary small onClick={() => findGame()} disabled={conn !== "open"}>
              {key ? t("online.lobby.meetAt", { word: key, size }) : t("online.lobby.findOn", { size })}
            </Btn>
            <input className="chat-input word-input" value={word} maxLength={32}
              placeholder={t("online.lobby.wordPlaceholder")}
              onChange={e => setWord(e.target.value)} onKeyDown={e => e.key === "Enter" && findGame()}
              aria-label={t("online.lobby.wordLabel")} />
          </div>
          {/* Pair go over the network. The partner runs in each player's own
              browser, which is the one thing about it a player has to be told:
              their half of your team stops when your device does. */}
          <div className="row">
            <Btn icon={Users} small onClick={() => findGame({ pair: { rank: DEFAULT_PARTNER_RANK } })} disabled={conn !== "open"}>
              {t("online.lobby.findPair", { size })}
            </Btn>
            <span className="fine">{t("online.lobby.pairNote", { rank: DEFAULT_PARTNER_RANK })}</span>
          </div>
          {/* Rengo as it is actually played: four people and no house players.
              It waits for three others, so it says how full the table is. */}
          <div className="row">
            <Btn icon={UsersRound} small onClick={() => findGame({ rengo: true, ...(team ? { team } : {}) })} disabled={conn !== "open"}>
              {t("online.lobby.findRengo", { size })}
            </Btn>
            <div className="seg" role="radiogroup" aria-label={t("online.lobby.whichTeam")}>
              {[[null, t("online.lobby.eitherSide")], [1, t("online.lobby.team", { n: 1 })], [2, t("online.lobby.team", { n: 2 })]].map(([v, label]) => (
                <button key={label} type="button" role="radio" aria-checked={team === v}
                  className={`seg-btn ${team === v ? "active" : ""}`} onClick={() => setTeam(v)}>
                  {label}
                </button>
              ))}
            </div>
            <span className="fine">
              {t("online.lobby.rengoNoteA")}<em>{t("online.lobby.rengoNoteEm")}</em>{t("online.lobby.rengoNoteB")}
            </span>
          </div>
          <p className="fine">{t("online.lobby.note")}</p>
        </>
      )}
      {(live.length > 0 || done.length > 0) && (
        <div className="table-list">
          {live.map(g => <TableRow key={g.id} game={g} me={player.id} onOpen={() => onPlay({ mode: { kind: "online", gameId: g.id } })} />)}
          {done.map(g => <TableRow key={g.id} game={g} me={player.id} onOpen={() => onPlay({ mode: { kind: "online", gameId: g.id } })} />)}
          {yours > 0 && (
            <p className="fine">
              {yours === 1
                ? "One table is waiting on you."
                : `${yours} tables are waiting on you, longest first.`}{" "}
              These games have no clock: nothing here runs out and nobody loses by taking a day.
            </p>
          )}
        </div>
      )}
      {!player.email && <AttachRow onAttach={attach} />}
      {player.email && !player.emailVerified && (
        <ConfirmRow email={player.email} token={token} notify={notify} />
      )}
      <div className="row spread">
        <p className="fine">{t("online.lobby.rated")}</p>
        <div className="row">
          {player.email && <Btn icon={DoorOpen} small onClick={signOut}>{t("online.lobby.signOut")}</Btn>}
          <Btn icon={LogOut} small onClick={leave} label={t("online.lobby.leave")} />
        </div>
      </div>
    </Card>
    </>
  );
}

/** The offer a handle with no address behind it should keep seeing: this
 *  rating only exists in this browser, and one address fixes that. It is a
 *  disclosure rather than a banner, so it never argues with the board. */
function AttachRow({ onAttach }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(null);
  const go = async () => {
    if (busy) return;
    const problem = formProblem("attach", { email, password, confirm: password });
    if (problem) { setShown(problem); return; }
    setBusy(true);
    setShown(null);
    try { await onAttach(email, password); setOpen(false); }
    catch (e) { setShown(errorText(e.reason, t)); }
    finally { setBusy(false); }
  };
  if (!open) {
    return (
      <button className="attach-row" onClick={() => setOpen(true)}>
        <Mail size={14} />
        <span>{t("online.lobby.attach")}</span>
      </button>
    );
  }
  return (
    <div className="gate-fields">
      <input className="chat-input" type="email" value={email} placeholder={t("online.lobby.emailPlaceholder")} autoComplete="email"
        onChange={e => setEmail(e.target.value)} aria-label={t("online.lobby.emailPlaceholder")} />
      <input className="chat-input" type="password" value={password} placeholder={t("online.lobby.passwordPlaceholder")}
        autoComplete="new-password" onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === "Enter" && go()} aria-label={t("online.lobby.passwordLabel")} />
      {shown && <p className="gate-problem" role="alert">{shown}</p>}
      <div className="row">
        <Btn icon={Mail} primary small onClick={go} disabled={busy}>{t(busy ? "online.lobby.working" : "online.lobby.keepHandle")}</Btn>
        <Btn small onClick={() => setOpen(false)}>{t("online.lobby.notNow")}</Btn>
      </div>
      <p className="fine">{t("online.lobby.attachNote")}</p>
    </div>
  );
}

/** The nudge an account whose address has never answered should keep seeing.
 *
 *  What confirming buys is worth being straight about: it does not unlock
 *  anything and it is not a gate: a forgotten password can be posted to an
 *  unconfirmed address exactly as it can to a confirmed one. What it proves is
 *  that the address was typed correctly and can be reached, which is the thing
 *  you want to have found out before it is the only way back to your handle. */
function ConfirmRow({ email, token, notify }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.sendConfirmation(token);
      setSent(true);
    } catch (e) {
      notify({ icon: "info", text: errorText(e.reason) });
    } finally { setBusy(false); }
  };

  if (sent) {
    return (
      <p className="fine" role="status">{t("online.lobby.confirmSent", { email })}</p>
    );
  }
  return (
    <button className="attach-row" onClick={send} disabled={busy}>
      <Mail size={14} />
      <span>
        {busy ? t("online.lobby.sending") : t("online.lobby.confirmNudge", { email })}
      </span>
    </button>
  );
}

function TableRow({ game, me, onOpen }) {
  const t = useT();
  const line = tableLine(game, me, t);
  /* How long it has sat there, on a live table only: a finished game has not
     been waiting for anything. "just now" is the one answer worth no words. */
  /* How long it has sat there, on a live table only: a finished game has not
     been waiting for anything. Under a minute is worth no words. */
  const waited = line.live && waitedMinutes(game.updatedAt) ? waitingText(game.updatedAt, t) : "";
  return (
    <button className={`table-row ${line.live ? "live" : ""}`} onClick={onOpen}>
      <span className={`dot ${line.live ? "dot-live" : "dot-done"}`} aria-hidden="true" />
      <span className="table-who">{line.who}</span>
      <span className="fine">{t("game.caption.board", { size: game.size })} · {line.detail}{waited ? t("online.lobby.waitingFor", { waited }) : ""}</span>
      {line.live ? <Play size={13} /> : <Eye size={13} />}
    </button>
  );
}
