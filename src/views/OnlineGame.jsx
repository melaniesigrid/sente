import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, Flag, RotateCcw, Trophy, CircleDot, Scale, MessageCircle, Send, Handshake, Check, X,
  Download, Eye, Link as LinkIcon, WifiOff,
} from "lucide-react";
import {
  scoreBoard, chainsInAtari, idx, lastMoveIndex, toSgf, colorOfSeat, canSeatPlay, partnerSeat,
  seatToPlay, kataChooseMoveForRecord, profileForRank, loadModel, modelReady, DEFAULT_PARTNER_RANK,
} from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, Avatar, RankBadge } from "../components/ui.jsx";
import { avatarUrl } from "../net/avatar.js";
import { useMokuFacts } from "../components/mokuStore.js";
import { playStone, playCapture, playBell, haptic } from "../components/sound.js";
import { beltOf, hintsForBelt } from "../content/rank.js";
import { gameSocket, SERVER_URL } from "../net/api.js";
import { loadAccount } from "../store/account.js";
import { refusalText, resignLabel, resultCard, RESIGN_CONFIRM_MS } from "./gameStatus.js";
import { onlineStatus, settledLine, onlineCaption, teamName } from "./onlineStatus.js";

/* `seat` in this view is a seat id ("b1", "w1", "b2", "w2"), which is what the
   server now hands out: at a pair table a colour names two people, and the one
   thing this view must never get wrong is which of them is you. `color` below is
   the colour that seat plays, for everything the rules care about. */
const seatName = (room, id) => (room.seats[id] ? room.seats[id].name : "");
const lead = (room, c) => room.seats[c + "1"];
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
  const account = useMemo(() => loadAccount(), []);
  const [room, setRoom] = useState(null);
  const [seat, setSeat] = useState(null);
  /* The seats this browser answers for besides its own chair: at a pair table,
     the partner on this player's team. Joseki runs no KataGo on the server, so
     an online partner is played here and submitted over this socket like any
     other move - which is why a team's partner needs that team's device. */
  const [runs, setRuns] = useState([]);
  const [partnerThinking, setPartnerThinking] = useState(false);
  const answering = useRef(null);
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
        } else if (f.t === "seat") { setSeat(f.seat); setRuns(f.runs ?? []); setWatching(f.watching); }
        else if (f.t === "chat") setChat(c => [...c, f.msg]);
        else if (f.t === "undo") { if (f.status === "declined") notify({ icon: "info", text: "Undo declined" }); }
        else if (f.t === "error") {
          if (f.reason === "no-room") setGone(true);
          const text = refusalText(f.reason) ?? ERRORS[f.reason];
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
  // The seat to play, and whether it is the partner this browser is running.
  const up = rec && rec.phase === "playing" ? seatToPlay(room.seats, rec) : null;
  const partnerUp = !!(up && runs.includes(up));
  const scoring = rec && rec.phase === "scoring";
  const color = seat ? colorOfSeat(seat) : null;
  const myTurn = !!(rec && seat && rec.phase === "playing" && canSeatPlay(room.seats, rec, seat));
  const belt = beltOf(profile.rating);
  const hints = hintsForBelt(belt) && !!seat;
  const myAtari = useMemo(() => (rec && rec.phase === "playing" && color ? chainsInAtari(rec.board, color) : []), [rec, color]);
  const atariIdx = useMemo(() => (hints ? myAtari.flatMap(ch => ch.stones.map(([c, r]) => idx(rec.size, c, r))) : []), [hints, myAtari, rec]);
  const preview = useMemo(
    () => (scoring ? scoreBoard(rec.board, { dead: rec.dead, komi: rec.komi, handicap: rec.handicap }) : null),
    [scoring, rec],
  );
  const resultKind = over && color ? (over.winner === null ? "jigo" : over.winner === color ? "win" : "loss") : null;
  useMokuFacts({ view: "game", phase: rec ? rec.phase : "playing", thinking: false, myAtari: myAtari.length, oppAtari: 0, ko: !!(rec && rec.koPoint !== null), moment: null, result: resultKind, promoted: null, seed: rec ? rec.moves.length : 0 });
  const blackLead = room ? lead(room, "b") : null;
  const whiteLead = room ? lead(room, "w") : null;

  const send = (frame) => { if (!sock.current || !sock.current.send(frame)) notify({ icon: "info", text: "Not connected" }); };

  /* The partner's turn. Asked of the same human-style network the offline table
     uses, at the rank the seat says, and answered over this socket. The guard is
     the move count rather than a boolean: a reconnect or a second `state` frame
     for the same position must not produce two answers, and the server would
     refuse the second anyway - but a refusal the player has to read is a bug,
     not a defence. */
  useEffect(() => {
    if (!partnerUp || conn !== "open" || !room) return undefined;
    const at = rec.moves.length;
    if (answering.current === at) return undefined;
    answering.current = at;
    let alive = true;
    setPartnerThinking(true);
    const ask = { ...profileForRank(room.seats[up].rank ?? DEFAULT_PARTNER_RANK, 0.5), oppRank: room.seats[up].rank ?? DEFAULT_PARTNER_RANK };
    kataChooseMoveForRecord(rec, ask)
      .then((res) => {
        if (!alive) return;
        const mv = res ? res.move : null;
        send(mv ? { t: "play", c: mv[0], r: mv[1] } : { t: "pass" });
      })
      .catch(() => {
        /* The network could not answer. The table says so rather than passing on
           your behalf: a pass is a move, and no partner of yours chose it. */
        if (alive) notify({ icon: "info", text: `${room.seats[up].name} cannot reach the network` });
        answering.current = null;
      })
      .finally(() => { if (alive) setPartnerThinking(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerUp, conn, rec && rec.moves.length]);

  // A pair table needs the network in this browser, so it starts downloading on arrival.
  useEffect(() => {
    if (!room || !room.pair || modelReady()) return undefined;
    loadModel().catch(() => {});
    return undefined;
  }, [room]);

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
  // The other team asked; your own partner asking is not a question for you.
  const undoAsk = !!(room && room.undo && seat && colorOfSeat(room.undo.by) !== color);
  /* At an ordinary table you ask while the opponent is to play; at a pair table
     the ask takes back the whole rotation, so you ask while it is your own turn.
     Both rules live on the server; this only keeps the button honest. */
  const canAskUndo = !!(seat && rec && rec.phase === "playing" && !room.undo
    && (room.pair ? myTurn : !myTurn) && rec.moves.length >= (room.pair ? 4 : 1));

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
    try { await navigator.clipboard.writeText(url.toString()); notify({ icon: "info", text: "Table link copied" }); }
    catch { notify({ icon: "info", text: url.toString() }); }
  };

  const status = partnerThinking && room
    ? `${room.seats[up].name} is thinking…`
    : onlineStatus({ room, seat, conn });
  const card = over ? resultCard(over) : null;
  const tone = over && color ? (over.winner === color ? "win" : over.winner === null ? "" : "loss") : "";
  const boardDisabled = !room || !seat || !!over || conn !== "open" || (!scoring && !myTurn);
  const mine = seat ? room.seats[seat] : null;
  const theirs = color ? (color === "b" ? whiteLead : blackLead) : null;
  const partner = room && seat && room.pair ? seatName(room, partnerSeat(seat)) : "";
  const settled = settledLine(room, seat);

  if (gone) {
    return (
      <div className="stack">
        <Btn icon={ChevronLeft} small onClick={onExit}>Lobby</Btn>
        <Card inset><p className="fine">That table does not exist, or it is gone.</p></Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>Lobby</Btn>
        {room && (
          <div className={`vs-strip ${room.pair ? "pair-strip" : ""}`}>
            {room.pair ? <OnlineTeam room={room} color="b" up={up} /> : (
              <div className="vs-side">
                {blackLead && <Avatar name={blackLead.name} tint={blackLead.tint} size={34} src={faceOf(blackLead)} />}
                <div className="vs-meta"><strong>{teamName(room, "b")}</strong>{blackLead && <RankBadge rating={blackLead.rating} size="sm" />}</div>
              </div>
            )}
            <span className="vs-x">vs</span>
            {room.pair ? <OnlineTeam room={room} color="w" up={up} align="right" /> : (
              <div className="vs-side">
                <div className="vs-meta right"><strong>{teamName(room, "w")}</strong>{whiteLead && <RankBadge rating={whiteLead.rating} size="sm" />}</div>
                {whiteLead && <Avatar name={whiteLead.name} tint={whiteLead.tint} size={34} src={faceOf(whiteLead)} />}
              </div>
            )}
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
              <Btn icon={Check} small primary onClick={() => send({ t: "accept" })} disabled={room.accepted === color}>
                {room.accepted === color ? "Accepted" : "Accept score"}
              </Btn>
              <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign)}</Btn>
            </div>
          ) : undoAsk ? (
            <div className="row">
              <span className="fine">{seatName(room, room.undo.by)} asks to take back a move.</span>
              <Btn icon={Check} small primary onClick={() => send({ t: "undoAccept" })}>Allow</Btn>
              <Btn icon={X} small onClick={() => send({ t: "undoDecline" })}>Decline</Btn>
            </div>
          ) : (
            <div className="row">
              <Btn icon={Flag} small onClick={onPass} disabled={!myTurn}>Pass</Btn>
              <Btn icon={RotateCcw} small onClick={() => send({ t: "undoRequest" })} disabled={!canAskUndo}>Ask undo</Btn>
              <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign)}</Btn>
            </div>
          ))}
        </div>
        <div className="side stack-sm">
          {card && (
            <Card className={`result-card ${tone}`}>
              <div className="bow-row" aria-hidden="true">
                {blackLead && <Avatar name={blackLead.name} tint={blackLead.tint} size={44} className="bow" src={faceOf(blackLead)} />}
                <span className="bow-word">rei</span>
                {whiteLead && <Avatar name={whiteLead.name} tint={whiteLead.tint} size={44} className="bow bow-late" src={faceOf(whiteLead)} />}
              </div>
              <div className="result-head">
                <h3 className="result-headline">{card.headline}</h3>
                <span className="result-sub">{card.sub}</span>
              </div>
              {card.rows.length > 0 && (
                <div className="result-rows">
                  {card.rows.map(r => (
                    <div key={r.side} className={`result-row ${r.winner ? "winner" : ""}`}>
                      <span className={`dot ${r.side === "Black" ? "dot-b" : "dot-w"}`} />
                      <span className="result-side">{r.side}</span>
                      <span className="result-detail">{r.detail}</span>
                      <span className="result-total">{r.total}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="fine">
                {settled ?? (room.settled ? (room.rated ? "Rated; the ladder has moved." : "Unrated.") : room.rated ? "Rated; settling on the ladder…" : "Unrated.")}
                {over.method === "score" && rec.dead.length > 0 && ` · ${rec.dead.length} dead ${rec.dead.length === 1 ? "stone" : "stones"} removed`}
              </p>
              <div className="row">
                <Btn icon={Download} small onClick={downloadSgf}>SGF</Btn>
                <Btn icon={ChevronLeft} small onClick={onExit}>Lobby</Btn>
              </div>
            </Card>
          )}
          {scoring && preview && (
            <Card inset className="caps">
              <div className="stat-head"><Scale size={15} /><span>Counting</span></div>
              <div><span className="dot dot-b" /> Black {preview.totals.b} <span className="fine-inline">({preview.black.stones} stones + {preview.black.territory} territory)</span></div>
              <div><span className="dot dot-w" /> White {preview.totals.w} <span className="fine-inline">({preview.white.stones} + {preview.white.territory} + {preview.white.komi} komi{preview.white.handicapBonus ? ` + ${preview.white.handicapBonus}` : ""})</span></div>
              <p className="fine">Tap a stone to mark its whole group dead; tap again to revive it. The game ends when both of you accept the same marking.</p>
            </Card>
          )}
          {room && !over && !scoring && (
            <Card inset className="caps">
              <div><span className="dot dot-b" /> Black captures: {rec.captures.b}</div>
              <div><span className="dot dot-w" /> White captures: {rec.captures.w}</div>
              <div className="fine">{onlineCaption(room, watching)}{hints ? " · atari hints on" : ""}{seat ? "" : " · you are watching"}</div>
            </Card>
          )}
          <Card className="chat-card">
            <div className="chat-head"><MessageCircle size={15} /><span>Table talk</span>
              <button className="chip-btn" onClick={shareTable} aria-label="Copy a link to this table"><LinkIcon size={11} /> share</button>
            </div>
            <div className="chat-log" aria-live="polite">
              {chat.map((m, i) => (
                <div key={i} className={`bubble ${account && m.from === account.player.id ? "mine" : ""}`}>
                  {(!account || m.from !== account.player.id) && <span className="bubble-who">{m.name}{m.seat ? "" : " (watching)"} · </span>}{m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {account ? (
              <div className="chat-row">
                <input className="chat-input" value={draft} placeholder="Say something…" maxLength={240}
                  onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} aria-label="Chat message" />
                <button className="chat-send" onClick={sendChat} aria-label="Send"><Send size={15} /></button>
              </div>
            ) : <p className="fine">Claim a handle in the lobby to join the talk.</p>}
          </Card>
          {mine && theirs && !over && (
            <Card inset>
              <p className="fine">
                You are {color === "b" ? "Black" : "White"}
                {partner ? ` with ${partner}` : ""} against {teamName(room, color === "b" ? "w" : "b")}.
                {room.pair ? " Partners may not consult, so there is no line to your partner and there is not meant to be." : ""}
                {" "}There is no clock yet; leave the table and come back from the lobby whenever you like.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const ERRORS = {
  "wrong-turn": "Not your turn",
  "game-over": "The game is over",
  spectator: "You are watching this one",
  "sign-in-to-chat": "Claim a handle to chat",
  "undo-pending": "An undo is already asked",
  "not-your-move": "You can only ask while they think",
  "wrong-phase": "Not now",
};

/* One team in an online pair header. The same shape the offline table uses: the
   seat to move is raised out of its team, and no name is dimmed to say it is not
   this player's turn. A bot partner is marked a bot, here as everywhere. */
function OnlineTeam({ room, color, up, align }) {
  return (
    <div className={`vs-side pair-side ${align === "right" ? "right" : ""}`}>
      {["1", "2"].map((n) => color + n).filter((id) => room.seats[id]).map((id) => {
        const s = room.seats[id];
        return (
          <div key={id} className={`pair-seat ${up === id ? "to-move" : ""}`}>
            <Avatar name={s.name} tint={s.tint} size={30} bot={s.kind === "bot"} src={s.kind === "bot" ? undefined : faceOf(s)} />
            <div className="vs-meta">
              <strong>{s.name}</strong>
              {s.rating != null ? <RankBadge rating={s.rating} size="sm" /> : <span className="fine">{s.rank}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
