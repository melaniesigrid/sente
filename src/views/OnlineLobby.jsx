import { useState, useEffect, useRef, useCallback } from "react";
import { Globe, Radio, X, Play, Eye, LogOut, KeyRound } from "lucide-react";
import { Card, Btn, Avatar, RankBadge } from "../components/ui.jsx";
import { api, lobbySocket, serverEnabled } from "../net/api.js";
import { loadAccount, saveAccount, clearAccount } from "../store/account.js";
import { provisionalText } from "../content/online.js";
import { tableLine } from "./onlineStatus.js";

/* ----------------------- ONLINE LOBBY (card) -----------------------
   Claim a handle, then look for an opponent. The handle is a token kept on
   this device; the server rates games with Glicko-2 and keeps the ladder.
   `onPlay(session)` opens a table: `{ mode: { kind: "online", gameId } }`.
   The board comes from the lobby's table picker, so one control sets the
   size for every kind of game. Online games are even; handicap is a house
   arrangement, and two strangers have no way to agree on one yet. */
export function OnlineCard({ profile, notify, onPlay, size = 9 }) {
  const [account, setAccount] = useState(() => loadAccount());
  if (!serverEnabled()) return null;
  return account
    ? <Lobby account={account} setAccount={setAccount} notify={notify} onPlay={onPlay} size={size} />
    : <Claim profile={profile} notify={notify} onClaimed={setAccount} />;
}

function Claim({ profile, notify, onClaimed }) {
  const [name, setName] = useState(profile.name === "Player" ? "" : profile.name);
  const [busy, setBusy] = useState(false);
  const claim = async () => {
    const v = name.trim();
    if (v.length < 2 || busy) return;
    setBusy(true);
    try {
      const { token, player } = await api.register(v, profile.tint);
      saveAccount({ token, player });
      onClaimed({ token, player });
      notify({ icon: "medal", text: `Welcome to the ladder, ${player.name}` });
    } catch (e) {
      notify({ icon: "info", text: e.reason === "offline" ? "The server is out of reach right now" : `Could not claim that handle (${e.reason})` });
    } finally { setBusy(false); }
  };
  return (
    <Card className="online-card">
      <div className="persona-top">
        <div className="avatar duo"><Globe size={22} strokeWidth={2} /></div>
        <div>
          <h3>Play people</h3>
          <p className="persona-tag">Live games over the network</p>
        </div>
      </div>
      <p className="persona-bio">
        Claim a handle and sit down against another person. Games are rated with Glicko-2
        on the server, which checks every move with the same rules you play by here.
      </p>
      <div className="row">
        <input className="chat-input name-input" value={name} maxLength={18} placeholder="Your handle"
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && claim()} aria-label="Handle" />
        <Btn icon={KeyRound} primary small onClick={claim} disabled={busy || name.trim().length < 2}>Claim handle</Btn>
      </div>
      <p className="fine">Your handle is a key kept on this device; there is no password. Clearing site data lets it go.</p>
    </Card>
  );
}

function Lobby({ account, setAccount, notify, onPlay, size }) {
  const { token } = account;
  const [player, setPlayer] = useState(account.player);
  const [word, setWord] = useState("");             // a rendezvous word, or "" for anyone
  const [seek, setSeek] = useState(null);           // null | { size, key }
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
        else if (f.t === "seek") setSeek(f.status === "waiting" ? { size: f.size, key: f.key } : null);
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
  const findGame = () => { if (sock.current && sock.current.send({ t: "seek", size, key })) setSeek({ size, key }); };
  const cancel = () => { if (sock.current) sock.current.send({ t: "cancel" }); setSeek(null); };
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
        <Avatar name={player.name} tint={player.tint} size={52} />
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
            {seek.key
              ? `Waiting at “${seek.key}” on ${seek.size}×${seek.size}. Whoever types the same word sits down opposite you.`
              : `Looking for a ${seek.size}×${seek.size} opponent${lobby && lobby.seeking > 1 ? ` · ${lobby.seeking - 1} others waiting` : ""}…`}
          </span>
          <Btn icon={X} small onClick={cancel}>Cancel</Btn>
        </div>
      ) : (
        <>
          <div className="row">
            <Btn icon={Play} primary small onClick={findGame} disabled={conn !== "open"}>
              {key ? `Meet at “${key}” on ${size}×${size}` : `Find an opponent on ${size}×${size}`}
            </Btn>
            <input className="chat-input word-input" value={word} maxLength={32} placeholder="or a word you both know"
              onChange={e => setWord(e.target.value)} onKeyDown={e => e.key === "Enter" && findGame()}
              aria-label="Rendezvous word for playing a friend" />
          </div>
          <p className="fine">
            The table below sets the board. Online games are even, whatever handicap you set for
            the house. Agree on a word with a friend and you will find each other, however busy it is.
          </p>
        </>
      )}
      {(live.length > 0 || done.length > 0) && (
        <div className="table-list">
          {live.map(g => <TableRow key={g.id} game={g} me={player.id} onOpen={() => onPlay({ mode: { kind: "online", gameId: g.id } })} />)}
          {done.map(g => <TableRow key={g.id} game={g} me={player.id} onOpen={() => onPlay({ mode: { kind: "online", gameId: g.id } })} />)}
        </div>
      )}
      <div className="row spread">
        <p className="fine">Rated with Glicko-2 on the server. Every move is checked there with the same rules.</p>
        <Btn icon={LogOut} small onClick={leave} label="Leave the ladder and remove this handle" />
      </div>
    </Card>
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
