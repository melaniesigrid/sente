import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, Flag, RotateCcw, Trophy, CircleDot, Scale, MessageCircle, Send, Handshake, Check, X,
  Download, Eye, Link as LinkIcon, WifiOff,
} from "lucide-react";
import { scoreBoard, chainsInAtari, idx, lastMoveIndex, toSgf } from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, Avatar, RankBadge } from "../components/ui.jsx";
import { avatarUrl } from "../net/avatar.js";
import { useMokuFacts } from "../components/mokuStore.js";
import { playStone, playCapture, playBell, haptic } from "../components/sound.js";
import { beltOf, hintsForBelt } from "../content/rank.js";
import { gameSocket, SERVER_URL } from "../net/api.js";
import { loadAccount } from "../store/account.js";
import { refusalText, resignLabel, resultCard, RESIGN_CONFIRM_MS } from "./gameStatus.js";
import { onlineStatus, settledLine, onlineCaption } from "./onlineStatus.js";
import { useT } from "../components/langStore.js";
import { lineOr } from "../i18n/index.js";

const seatName = (room, c) => room.seats[c].name;
/* A seat carries the stamp its owner's picture last changed at, so the table
   can draw a face without asking the server who is sitting there. */
const faceOf = (seat) => avatarUrl(SERVER_URL, seat.id, seat.avatarAt);

/* ----------------------- ONLINE GAME -----------------------
   A thin adapter over a server room. The only state here is the last room the
   server sent plus UI-only bits: connection, chat draft, the two-step resign,
   who is watching. Every action is a frame; the server answers with the new
   room or a refusal, and the board never moves ahead of it. Without an account
   or a seat this is the spectator view of the same table. */
export function OnlineGame({ gameId, onExit, profile, notify }) {
  const t = useT();
  /* The socket's callbacks live as long as the connection does, and the
     language can change under them. They read the current reader out of a ref
     rather than closing over one, so switching language mid-game does not drop
     the table and reconnect it. */
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const account = useMemo(() => loadAccount(), []);
  const [room, setRoom] = useState(null);
  const [seat, setSeat] = useState(null);
  const [conn, setConn] = useState("connecting");
  const [watching, setWatching] = useState(0);
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const [gone, setGone] = useState(false);
  const sock = useRef(null);
  const resignTimer = useRef(null);
  const chatEndRef = useRef(null);
  const lastMoves = useRef(-1);
  const sound = !!profile.sound;

  useEffect(() => {
    sock.current = gameSocket(gameId, account ? account.token : null, {
      onStatus: setConn,
      onFrame: (f) => {
        if (f.t === "state") {
          setRoom(f.room);
          setChat(f.room.chat);
        } else if (f.t === "seat") { setSeat(f.seat); setWatching(f.watching); }
        else if (f.t === "chat") setChat(c => [...c, f.msg]);
        else if (f.t === "undo") { if (f.status === "declined") notify({ icon: "info", text: tRef.current("online.game.undoDeclined") }); }
        else if (f.t === "error") {
          if (f.reason === "no-room") setGone(true);
          const text = refusalText(f.reason, tRef.current) ?? refusalWords(f.reason, tRef.current);
          if (text) notify({ icon: "info", text });
        }
      },
    });
    return () => { sock.current.close(); clearTimeout(resignTimer.current); };
  }, [gameId, account, notify]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [chat]);

  // Sound and haptics on every move the server confirms, whoever played it.
  useEffect(() => {
    if (!room) return;
    const n = room.record.moves.length;
    if (lastMoves.current >= 0 && n > lastMoves.current) {
      const caps = room.record.lastCaptured ? room.record.lastCaptured.length : 0;
      if (sound) { playStone(); if (caps) playCapture(caps); }
      haptic(caps ? [10, 30, 14] : 8);
    }
    if (lastMoves.current >= 0 && room.record.phase === "ended" && sound && n >= lastMoves.current) playBell();
    lastMoves.current = n;
  }, [room, sound]);

  const rec = room ? room.record : null;
  const over = rec && rec.phase === "ended" ? rec.result : null;
  const scoring = rec && rec.phase === "scoring";
  const myTurn = !!(rec && seat && rec.phase === "playing" && rec.toPlay === seat);
  const belt = beltOf(profile.rating);
  const hints = hintsForBelt(belt) && !!seat;
  const myAtari = useMemo(() => (rec && rec.phase === "playing" && seat ? chainsInAtari(rec.board, seat) : []), [rec, seat]);
  const atariIdx = useMemo(() => (hints ? myAtari.flatMap(ch => ch.stones.map(([c, r]) => idx(rec.size, c, r))) : []), [hints, myAtari, rec]);
  const preview = useMemo(
    () => (scoring ? scoreBoard(rec.board, { dead: rec.dead, komi: rec.komi, handicap: rec.handicap }) : null),
    [scoring, rec],
  );
  const resultKind = over && seat ? (over.winner === null ? "jigo" : over.winner === seat ? "win" : "loss") : null;
  useMokuFacts({ view: "game", phase: rec ? rec.phase : "playing", thinking: false, myAtari: myAtari.length, oppAtari: 0, ko: !!(rec && rec.koPoint !== null), moment: null, result: resultKind, promoted: null, seed: rec ? rec.moves.length : 0 });

  const send = (frame) => { if (!sock.current || !sock.current.send(frame)) notify({ icon: "info", text: t("online.game.notConnected") }); };

  const onPlay = (c, r) => {
    if (!seat || over) return;
    if (scoring) { send({ t: "markDead", c, r }); return; }
    if (!myTurn) return;
    send({ t: "play", c, r });
  };
  const onPass = () => { if (myTurn) send({ t: "pass" }); };
  const canResign = !!seat && !over && conn === "open";
  const onResign = () => {
    if (!canResign) return;
    if (!confirmResign) {
      setConfirmResign(true);
      clearTimeout(resignTimer.current);
      resignTimer.current = setTimeout(() => setConfirmResign(false), RESIGN_CONFIRM_MS);
      return;
    }
    clearTimeout(resignTimer.current);
    setConfirmResign(false);
    send({ t: "resign" });
  };
  const undoAsk = !!(room && room.undo && room.undo.by !== seat && seat);
  const canAskUndo = !!(seat && rec && rec.phase === "playing" && !room.undo && rec.toPlay !== seat && rec.moves.length > 0);

  const sendChat = () => {
    const t = draft.trim();
    if (!t) return;
    send({ t: "chat", text: t });
    setDraft("");
  };

  const downloadSgf = () => {
    const blob = new Blob([toSgf(rec)], { type: "application/x-go-sgf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sente-${gameId}.sgf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const shareTable = async () => {
    const url = new URL(window.location.href);
    url.search = `?game=${gameId}`;
    try { await navigator.clipboard.writeText(url.toString()); notify({ icon: "info", text: t("online.game.linkCopied") }); }
    catch { notify({ icon: "info", text: url.toString() }); }
  };

  const status = onlineStatus({ room, seat, conn }, t);
  const card = over ? resultCard(over, t) : null;
  const tone = over && seat ? (over.winner === seat ? "win" : over.winner === null ? "" : "loss") : "";
  const boardDisabled = !room || !seat || !!over || conn !== "open" || (!scoring && !myTurn);
  const mine = seat ? room.seats[seat] : null;
  const theirs = seat ? room.seats[seat === "b" ? "w" : "b"] : null;
  const settled = settledLine(room, seat, t);

  if (gone) {
    return (
      <div className="stack">
        <Btn icon={ChevronLeft} small onClick={onExit}>{t("online.game.lobby")}</Btn>
        <Card inset><p className="fine">{t("online.game.gone")}</p></Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>{t("online.game.lobby")}</Btn>
        {room && (
          <div className="vs-strip">
            <div className="vs-side">
              <Avatar name={room.seats.b.name} tint={room.seats.b.tint} size={34} src={faceOf(room.seats.b)} />
              <div className="vs-meta"><strong>{room.seats.b.name}</strong><RankBadge rating={room.seats.b.rating} size="sm" /></div>
            </div>
            <span className="vs-x">vs</span>
            <div className="vs-side">
              <div className="vs-meta right"><strong>{room.seats.w.name}</strong><RankBadge rating={room.seats.w.rating} size="sm" /></div>
              <Avatar name={room.seats.w.name} tint={room.seats.w.tint} size={34} src={faceOf(room.seats.w)} />
            </div>
          </div>
        )}
      </div>
      <div className="play-wrap">
        <div className="board-col stack-sm">
          <Pill icon={conn !== "open" ? WifiOff : over ? Trophy : scoring ? Scale : myTurn ? CircleDot : seat ? CircleDot : Eye} tone={tone}>
            {status}
          </Pill>
          {room ? (
            <Board board={rec.board} onPlay={onPlay} lastMove={lastMoveIndex(rec)} disabled={boardDisabled}
              atari={atariIdx} captured={rec.lastCaptured || []} captureKey={rec.moves.length}
              territory={preview ? preview.territory : null} dead={rec.dead}
            coordinates={profile.coordinates} mark={profile.lastMoveMark} />
          ) : (
            <div className="board-well board-placeholder" aria-hidden="true" />
          )}
          {seat && !over && (scoring ? (
            <div className="row">
              <Btn icon={Check} small primary onClick={() => send({ t: "accept" })} disabled={room.accepted === seat}>
                {t(room.accepted === seat ? "online.game.accepted" : "online.game.acceptScore")}
              </Btn>
              <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign, t)}</Btn>
            </div>
          ) : undoAsk ? (
            <div className="row">
              <span className="fine">{t("online.game.undoAsk", { name: seatName(room, room.undo.by) })}</span>
              <Btn icon={Check} small primary onClick={() => send({ t: "undoAccept" })}>{t("online.game.allow")}</Btn>
              <Btn icon={X} small onClick={() => send({ t: "undoDecline" })}>{t("online.game.decline")}</Btn>
            </div>
          ) : (
            <div className="row">
              <Btn icon={Flag} small onClick={onPass} disabled={!myTurn}>{t("game.pass")}</Btn>
              <Btn icon={RotateCcw} small onClick={() => send({ t: "undoRequest" })} disabled={!canAskUndo}>{t("online.game.askUndo")}</Btn>
              <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign, t)}</Btn>
            </div>
          ))}
        </div>
        <div className="side stack-sm">
          {card && (
            <Card className={`result-card ${tone}`}>
              <div className="bow-row" aria-hidden="true">
                <Avatar name={room.seats.b.name} tint={room.seats.b.tint} size={44} className="bow" src={faceOf(room.seats.b)} />
                <span className="bow-word">rei</span>
                <Avatar name={room.seats.w.name} tint={room.seats.w.tint} size={44} className="bow bow-late" src={faceOf(room.seats.w)} />
              </div>
              <div className="result-head">
                <h3 className="result-headline">{card.headline}</h3>
                <span className="result-sub">{card.sub}</span>
              </div>
              {card.rows.length > 0 && (
                <div className="result-rows">
                  {card.rows.map(r => (
                    <div key={r.color} className={`result-row ${r.winner ? "winner" : ""}`}>
                      <span className={`dot dot-${r.color}`} />
                      <span className="result-side">{r.side}</span>
                      <span className="result-detail">{r.detail}</span>
                      <span className="result-total">{r.total}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="fine">
                {settled ?? t(room.settled
                  ? (room.rated ? "online.game.ratedMoved" : "online.game.unrated")
                  : room.rated ? "online.game.ratedSettling" : "online.game.unrated")}
                {over.method === "score" && rec.dead.length > 0 && t("game.deadRemoved", { count: rec.dead.length })}
              </p>
              <div className="row">
                <Btn icon={Download} small onClick={downloadSgf}>{t("game.sgf")}</Btn>
                <Btn icon={ChevronLeft} small onClick={onExit}>{t("online.game.lobby")}</Btn>
              </div>
            </Card>
          )}
          {scoring && preview && (
            <Card inset className="caps">
              <div className="stat-head"><Scale size={15} /><span>{t("game.counting.head")}</span></div>
              <div><span className="dot dot-b" /> {t("game.counting.line", { side: t("game.side.b"), total: preview.totals.b })} <span className="fine-inline">{t("game.counting.bParts", { stones: preview.black.stones, territory: preview.black.territory })}</span></div>
              <div><span className="dot dot-w" /> {t("game.counting.line", { side: t("game.side.w"), total: preview.totals.w })} <span className="fine-inline">{t("game.counting.wParts", {
                stones: preview.white.stones, territory: preview.white.territory, komi: preview.white.komi,
                handicap: preview.white.handicapBonus ? ` + ${preview.white.handicapBonus}` : "",
              })}</span></div>
              <p className="fine">{t("online.game.countingNote")}</p>
            </Card>
          )}
          {room && !over && !scoring && (
            <Card inset className="caps">
              <div><span className="dot dot-b" /> {t("game.captures.b", { n: rec.captures.b })}</div>
              <div><span className="dot dot-w" /> {t("game.captures.w", { n: rec.captures.w })}</div>
              <div className="fine">{onlineCaption(room, watching, t)}{hints ? t("game.hintsOn") : ""}{seat ? "" : t("online.game.watchingNote")}</div>
            </Card>
          )}
          <Card className="chat-card">
            <div className="chat-head"><MessageCircle size={15} /><span>{t("game.chat.head")}</span>
              <button className="chip-btn" onClick={shareTable} aria-label={t("online.game.shareLabel")}><LinkIcon size={11} /> {t("online.game.share")}</button>
            </div>
            <div className="chat-log" aria-live="polite">
              {chat.map((m, i) => (
                <div key={i} className={`bubble ${account && m.from === account.player.id ? "mine" : ""}`}>
                  {(!account || m.from !== account.player.id) && <span className="bubble-who">{m.name}{m.seat ? "" : t("online.game.watchingWho")} · </span>}{m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {account ? (
              <div className="chat-row">
                <input className="chat-input" value={draft} placeholder={t("game.chat.placeholder")} maxLength={240}
                  onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} aria-label={t("game.chat.label")} />
                <button className="chat-send" onClick={sendChat} aria-label={t("game.chat.send")}><Send size={15} /></button>
              </div>
            ) : <p className="fine">{t("online.game.claimToChat")}</p>}
          </Card>
          {mine && theirs && !over && (
            <Card inset>
              <p className="fine">{t("online.game.seatNote", { side: t(`game.side.${seat}`), name: theirs.name })}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* The server's refusals, by the name it gives them. Unknown reasons fall
   through to the reason itself rather than to a shrug. */
const refusalWords = (reason, t) => lineOr(t, `online.error.${reason}`, reason);
