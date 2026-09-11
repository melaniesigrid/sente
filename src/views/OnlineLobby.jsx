import { useState, useEffect, useRef, useCallback } from "react";
import { Radio, X, Play, Eye, LogOut, DoorOpen, Mail, Users, UsersRound } from "lucide-react";
import { Card, Btn, Avatar, RankBadge } from "../components/ui.jsx";
import { api, lobbySocket, serverEnabled, SERVER_URL } from "../net/api.js";
import { loadAccount, saveAccount, clearAccount } from "../store/account.js";
import { provisionalText } from "../content/online.js";
import { DEFAULT_PARTNER_RANK } from "../engine/index.js";
import { tableLine } from "./onlineStatus.js";
import { AccountGate } from "./AccountGate.jsx";
import { avatarUrl } from "../net/avatar.js";
import { errorText, formProblem } from "./accountForm.js";

/* ----------------------- ONLINE LOBBY (card) -----------------------
   Get in, then look for an opponent. Getting in is `AccountGate`: an address
   and a password, or a handle kept in this browser alone. The server rates
   games with Glicko-2 and keeps the ladder.
   `onPlay(session)` opens a table: `{ mode: { kind: "online", gameId } }`.
   The board comes from the lobby's table picker, so one control sets the
   size for every kind of game. Online games are even; handicap is a house
   arrangement, and two strangers have no way to agree on one yet. */
export function OnlineCard({ profile, notify, onPlay, size = 9 }) {
  const [account, setAccount] = useState(() => loadAccount());
  if (!serverEnabled()) return null;
  return account
    ? <Lobby account={account} setAccount={setAccount} notify={notify} onPlay={onPlay} size={size} />
    : <AccountGate profile={profile} notify={notify} onSignedIn={setAccount} />;
}

function Lobby({ account, setAccount, notify, onPlay, size }) {
  const { token } = account;
  const [player, setPlayer] = useState(account.player);
  const [word, setWord] = useState("");             // a rendezvous word, or "" for anyone
  const [seek, setSeek] = useState(null);           // null | { size, key, pair }
  const [lobby, setLobby] = useState(null);         // { online, seeking }
  const [conn, setConn] = useState("connecting");
  const [tables, setTables] = useState([]);
  const sock = useRef(null);
  const onPlayRef = useRef(onPlay);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);

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
        else if (f.t === "seek") setSeek(f.status === "waiting" ? { size: f.size, key: f.key, pair: f.pair ?? null, rengo: !!f.rengo, seated: f.seated, of: f.of } : null);
        else if (f.t === "matched") {
          setSeek(null);
          notify({ icon: "trophy", text: `Matched with ${f.opponent.name} · you play ${f.color === "b" ? "Black" : "White"}` });
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
    try { await api.signOut(token); } catch (e) { if (e.status !== 401) { notify({ icon: "info", text: errorText(e.reason) }); return; } }
    clearAccount();
    setAccount(null);
    notify({ icon: "info", text: "Signed out. Your rating is waiting for you." });
  };

  const attach = async (email, password) => {
    const me = await api.addAccount(token, email, password);
    setPlayer(me);
    saveAccount({ token, player: me });
    // Not awaited: the handle is already kept, and a slow mail server should
    // not make it look as though it was not. The row below offers the letter
    // again for as long as the address is unconfirmed.
    api.sendConfirmation(token).catch(() => {});
    notify({ icon: "medal", text: "That handle is yours on any device now. Look for a letter confirming the address." });
  };

  const leave = async () => {
    if (!window.confirm("Leave the ladder? This handle, its key and its rating are removed for good. Finished games stay.")) return;
    try { await api.leave(token); } catch (e) { if (e.status !== 401) { notify({ icon: "info", text: "Could not reach the server; try again" }); return; } }
    clearAccount();
    setAccount(null);
    notify({ icon: "info", text: "Handle removed" });
  };

  const live = tables.filter(t => t.phase !== "ended");
  const done = tables.filter(t => t.phase === "ended").slice(0, 3);

  return (
    <Card className="online-card">
      <div className="persona-top">
        <Avatar name={player.name} tint={player.tint} size={52} src={avatarUrl(SERVER_URL, player.id, player.avatarAt)} />
        <div>
          <h3>{player.name}</h3>
          <p className="persona-tag">
            {provisionalText(player)} · {player.wins}–{player.losses}{player.draws ? `–${player.draws}` : ""}
            {lobby ? ` · ${lobby.online} online` : conn === "open" ? "" : " · connecting"}
          </p>
        </div>
        <RankBadge rating={player.rating} />
      </div>
      {seek ? (
        <div className="seek-state" role="status">
          <Radio size={16} className="pulse" />
          <span>
            {seek.rengo
              ? `${seek.seated ?? 1} of 4 seated on ${seek.size}×${seek.size}. Four people, no house players: the first two to arrive lead the teams and the next two partner them.`
              : seek.pair
              ? `Looking for another pair player on ${seek.size}×${seek.size}. You will each get a ${seek.pair.rank} partner, and the four of you take turns.`
              : seek.key
                ? `Waiting at “${seek.key}” on ${seek.size}×${seek.size}. Whoever types the same word sits down opposite you.`
                : `Looking for a ${seek.size}×${seek.size} opponent${lobby && lobby.seeking > 1 ? ` · ${lobby.seeking - 1} others waiting` : ""}…`}
          </span>
          <Btn icon={X} small onClick={cancel}>Cancel</Btn>
        </div>
      ) : (
        <>
          <div className="row">
            <Btn icon={Play} primary small onClick={() => findGame()} disabled={conn !== "open"}>
              {key ? `Meet at “${key}” on ${size}×${size}` : `Find an opponent on ${size}×${size}`}
            </Btn>
            <input className="chat-input word-input" value={word} maxLength={32} placeholder="or a word you both know"
              onChange={e => setWord(e.target.value)} onKeyDown={e => e.key === "Enter" && findGame()}
              aria-label="Rendezvous word for playing a friend" />
          </div>
          {/* Pair go over the network. The partner runs in each player's own
              browser, which is the one thing about it a player has to be told:
              their half of your team stops when your device does. */}
          <div className="row">
            <Btn icon={Users} small onClick={() => findGame({ pair: { rank: DEFAULT_PARTNER_RANK } })} disabled={conn !== "open"}>
              Find a pair game on {size}×{size}
            </Btn>
            <span className="fine">
              You and a {DEFAULT_PARTNER_RANK} partner against another player and theirs, taking turns.
              Unrated. Each partner runs in the browser of the player it partners, so it plays
              for as long as that player is at the table.
            </span>
          </div>
          {/* Rengo as it is actually played: four people and no house players.
              It waits for three others, so it says how full the table is. */}
          <div className="row">
            <Btn icon={UsersRound} small onClick={() => findGame({ rengo: true })} disabled={conn !== "open"}>
              Find four for rengo on {size}×{size}
            </Btn>
            <span className="fine">
              Four people, two to a team, taking turns in one rotation. Unrated: a team
              result is a different number from a player's rank, and Joseki will not put
              one on the screen it cannot stand behind. Partners may not consult, so there
              is no line to your partner and there is not meant to be.
            </span>
          </div>
          <p className="fine">
            The table below sets the board. Online games are even and untimed, whatever handicap
            and clock you set for the house. Agree on a word with a friend and you will find each
            other, however busy it is.
          </p>
        </>
      )}
      {(live.length > 0 || done.length > 0) && (
        <div className="table-list">
          {live.map(g => <TableRow key={g.id} game={g} me={player.id} onOpen={() => onPlay({ mode: { kind: "online", gameId: g.id } })} />)}
          {done.map(g => <TableRow key={g.id} game={g} me={player.id} onOpen={() => onPlay({ mode: { kind: "online", gameId: g.id } })} />)}
        </div>
      )}
      {!player.email && <AttachRow onAttach={attach} />}
      {player.email && !player.emailVerified && (
        <ConfirmRow email={player.email} token={token} notify={notify} />
      )}
      <div className="row spread">
        <p className="fine">Rated with Glicko-2 on the server. Every move is checked there with the same rules.</p>
        <div className="row">
          {player.email && <Btn icon={DoorOpen} small onClick={signOut}>Sign out</Btn>}
          <Btn icon={LogOut} small onClick={leave} label="Leave the ladder and remove this handle" />
        </div>
      </div>
    </Card>
  );
}

/** The offer a handle with no address behind it should keep seeing: this
 *  rating only exists in this browser, and one address fixes that. It is a
 *  disclosure rather than a banner, so it never argues with the board. */
function AttachRow({ onAttach }) {
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
    catch (e) { setShown(errorText(e.reason)); }
    finally { setBusy(false); }
  };
  if (!open) {
    return (
      <button className="attach-row" onClick={() => setOpen(true)}>
        <Mail size={14} />
        <span>This handle lives in this browser only. Add an address to keep it.</span>
      </button>
    );
  }
  return (
    <div className="gate-fields">
      <input className="chat-input" type="email" value={email} placeholder="Email address" autoComplete="email"
        onChange={e => setEmail(e.target.value)} aria-label="Email address" />
      <input className="chat-input" type="password" value={password} placeholder="A password, ten characters or more"
        autoComplete="new-password" onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === "Enter" && go()} aria-label="Password" />
      {shown && <p className="gate-problem" role="alert">{shown}</p>}
      <div className="row">
        <Btn icon={Mail} primary small onClick={go} disabled={busy}>{busy ? "Working…" : "Keep this handle"}</Btn>
        <Btn small onClick={() => setOpen(false)}>Not now</Btn>
      </div>
      <p className="fine">Your rating, your games and your handle stay exactly as they are.</p>
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
      <p className="fine" role="status">
        A letter is on its way to {email}. The link in it lasts a week and works once. If it
        does not arrive, look in the spam folder before asking for another.
      </p>
    );
  }
  return (
    <button className="attach-row" onClick={send} disabled={busy}>
      <Mail size={14} />
      <span>
        {busy
          ? "Sending…"
          : `Joseki has never heard back from ${email}. Confirm it and you will know a letter can reach you.`}
      </span>
    </button>
  );
}

function TableRow({ game, me, onOpen }) {
  const line = tableLine(game, me);
  return (
    <button className={`table-row ${line.live ? "live" : ""}`} onClick={onOpen}>
      <span className={`dot ${line.live ? "dot-live" : "dot-done"}`} aria-hidden="true" />
      <span className="table-who">{line.who}</span>
      <span className="fine">{game.size}×{game.size} · {line.detail}</span>
      {line.live ? <Play size={13} /> : <Eye size={13} />}
    </button>
  );
}
