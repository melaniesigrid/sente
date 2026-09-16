import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, Flag, RotateCcw, Trophy, CircleDot, Scale, MessageCircle, Send, Handshake, Check, X,
  Download, Eye, Link as LinkIcon, WifiOff, History, Users,
} from "lucide-react";
import {
  scoreBoard, chainsInAtari, idx, lastMoveIndex, toSgf, colorOfSeat, canSeatPlay, partnerSeat,
  seatToPlay, kataChooseMoveForRecord, profileForRank, loadModel, modelReady, DEFAULT_PARTNER_RANK,
  play, IllegalMoveError,
} from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, Avatar, CountryFlag, RankBadge } from "../components/ui.jsx";
import { avatarUrl } from "../net/avatar.js";
import { useMokuFacts } from "../components/mokuStore.js";
import { playStone, playCapture, playBell, haptic } from "../components/sound.js";
import { beltOf, hintsForBelt } from "../content/rank.js";
import { gameSocket, SERVER_URL } from "../net/api.js";
import { loadAccount } from "../store/account.js";
import { refusalText, resignLabel, confirmMoveLabel, resultCard, RESIGN_CONFIRM_MS } from "./gameStatus.js";
import { tapAction } from "./stagedMove.js";
import { onlineStatus, settledLine, onlineCaption, teamName } from "./onlineStatus.js";
import { talkParts, pointsNamed, etiquette } from "./tableTalk.js";
import { useT, useLocale } from "../components/langStore.js";
import { lineOr } from "../i18n/index.js";
import { Review } from "./Review.jsx";
import { WinCard } from "./WinCard.jsx";

/* `seat` in this view is a seat id ("b1", "w1", "b2", "w2"), which is what the
   server now hands out: at a pair table a colour names two people, and the one
   thing this view must never get wrong is which of them is you. `color` below is
   the colour that seat plays, for everything the rules care about. */
const seatName = (room, id) => (room.seats[id] ? room.seats[id].name : "");
/* What the server keeps, kept here too. Appending without a ceiling let anybody
   who can type grow this browser's log, and its DOM, for as long as the socket
   stayed open; the server has always trimmed to this on the way past. */
const CHAT_KEEP = 200;
/* One chat line, named by who said it, when, and what it said, so a mark
   survives the server handing back a different window of the same conversation.
   The text is in the key because two lines from one person can share a
   millisecond; when they do they are the same sentence, and lighting either of
   them rings the same points. */
const lineKey = (m) => `${m.from}:${m.at}:${m.text}`;
const chatKey = (m) => m.chatKey ?? lineKey(m);
const sameLine = (a, b) => lineKey(a) === lineKey(b);
const reconcileChat = (prev, next, seq) => {
  const out = new Array(next.length);
  let i = prev.length - 1;
  for (let j = next.length - 1; j >= 0; j -= 1) {
    if (i >= 0 && sameLine(prev[i], next[j])) {
      out[j] = { ...next[j], chatKey: prev[i].chatKey };
      i -= 1;
    } else {
      out[j] = { ...next[j], chatKey: `${lineKey(next[j])}:${seq.current++}` };
    }
  }
  return out;
};
/* One array, so a board with no marks is handed the same empty prop every time. */
const EMPTY = [];
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
export function OnlineGame({ gameId, onExit, profile, notify, go = null }) {
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
  /* The chat line whose points are currently lit on the board, named by who
     said it and when. One at a time: two lines pointing at once would be a
     board with rings on it and no way to tell which sentence meant which.

     Not an index. The server keeps the last 200 lines and hands the whole
     window back on every state frame, so in a long room an index quietly
     slides onto somebody else's sentence and rings a point nobody pointed at. */
  const [lit, setLit] = useState(null);
  /* What this browser has already said, counted the moment it is sent rather
     than when the server echoes it back. Waiting for the round trip would leave
     an etiquette button live for as long as the network takes, and two taps in
     that window send the greeting twice, which is the exact thing the row not
     repeating itself is for. */
  const [sent, setSent] = useState([]);
  const [confirmResign, setConfirmResign] = useState(false);
  const [gone, setGone] = useState(false);
  // Walking back through the finished game. Review takes the whole view, as it
  // does for a local game: two boards on one screen invite a click on the wrong one.
  const [reviewing, setReviewing] = useState(false);
  const [pending, setPending] = useState(null);
  const sock = useRef(null);
  const resignTimer = useRef(null);
  const chatEndRef = useRef(null);
  const nextChatKey = useRef(0);
  const lastMoves = useRef(-1);
  const sound = !!profile.sound;

  useEffect(() => {
    sock.current = gameSocket(gameId, account ? account.token : null, {
      onStatus: setConn,
      onFrame: (f) => {
        if (f.t === "state") {
          setRoom(f.room);
          setChat((c) => reconcileChat(c, f.room.chat, nextChatKey));
        } else if (f.t === "seat") { setSeat(f.seat); setRuns(f.runs ?? []); setWatching(f.watching); }
        else if (f.t === "chat") setChat((c) => reconcileChat(c, [...c, f.msg].slice(-CHAT_KEEP), nextChatKey));
        else if (f.t === "undo") { if (f.status === "declined") notify({ icon: "info", text: tRef.current("online.game.undoDeclined") }); }
        /* The other side asked to read the game back together, or said no to
           being asked. The invitation itself is in the room, so this is only the
           nudge: a player who has looked away should not have to notice a button
           appear. */
        else if (f.t === "review") {
          notify({ icon: "info", text: tRef.current(f.status === "asked" ? "online.game.reviewAsked" : "online.game.reviewDeclined") });
        }
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
  /* Both of these belong to the position, not to the room: the server sends a
     fresh room for things that change no stone at all - somebody arriving to
     watch, a seat being filled - and neither a staged stone nor a ring should
     be thrown away by those. */
  const moveCount = rec ? rec.moves.length : 0;
  const recPhase = rec ? rec.phase : null;
  /* A staged move belongs to the position it was staged in, so the opponent
     playing, an undo being agreed, or the table going to scoring all drop it
     rather than leave a stone hovering over a board that has moved on. */
  useEffect(() => { setPending(null); }, [moveCount, recPhase]);
  /* A ring points at a board, so it stops meaning anything the moment the board
     changes. The stones move, the marks go. */
  useEffect(() => { setLit(null); }, [moveCount, recPhase]);
  /* Every line in the log, already split into words and points. Parsing inside
     the render map re-scanned all 200 lines on every keystroke in the draft box,
     because the draft is state on this same component. */
  const parsed = useMemo(
    () => (rec ? chat.map(m => talkParts(m.text, rec.size)) : []),
    [chat, rec],
  );
  const litLine = lit === null ? null : chat.find(m => chatKey(m) === lit);
  const litText = litLine ? litLine.text : null;
  const litPoints = useMemo(
    () => (litText && rec ? pointsNamed(litText, rec.size) : EMPTY),
    [litText, rec],
  );
  /* The etiquette on offer, minus whatever this player has already said here.
     A spectator is offered none of it: the greeting is between the players. */
  const said = useMemo(
    () => [...sent, ...(account ? chat.filter(m => m.from === account.player.id).map(m => m.text) : [])],
    [chat, account, sent],
  );
  const openers = useMemo(
    () => (rec ? etiquette({ phase: rec.phase, moves: rec.moves.length, seated: !!seat, said }, t) : []),
    [rec, seat, said, t],
  );
  /* Reading the game back together. It lives in the room rather than on this
     screen, so both people are on the same move and a reconnect comes back into
     the review instead of to a table whose game is over. */
  const review = room ? room.review ?? null : null;
  const inReview = !!(review && seat && review.in.includes(seat));
  const askedOfMe = !!(review && review.asked && seat && !inReview && colorOfSeat(review.asked) !== color);
  const askedByMe = !!(review && review.asked && review.asked === seat);
  const resultKind = over && color ? (over.winner === null ? "jigo" : over.winner === color ? "win" : "loss") : null;
  useMokuFacts({ view: "game", phase: rec ? rec.phase : "playing", thinking: false, myAtari: myAtari.length, oppAtari: 0, ko: !!(rec && rec.koPoint !== null), moment: null, result: resultKind, promoted: null, seed: rec ? rec.moves.length : 0 });
  const blackLead = room ? lead(room, "b") : null;
  const whiteLead = room ? lead(room, "w") : null;

  /* Says whether the frame actually went, so a caller can tell a thing it said
     from a thing it only tried to say. */
  const send = (frame) => {
    const gone = !!(sock.current && sock.current.send(frame));
    if (!gone) notify({ icon: "info", text: t("online.game.notConnected") });
    return gone;
  };

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
        if (alive) notify({ icon: "info", text: t("online.game.partnerOffline", { name: room.seats[up].name }) });
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
    /* Staging runs the point through the engine first. The server refuses exactly
       the moves this would - `server/room.js` reduces over the same module - so a
       refusal can be shown on the tap that stages rather than saved up for the tap
       that commits. The server stays the authority: this only moves its answer
       earlier, and nothing is sent until the second tap. */
    try {
      play(rec, c, r);
    } catch (e) {
      if (e instanceof IllegalMoveError) {
        const text = refusalText(e.reason);
        if (text) notify({ icon: "info", text });
        return;   // a refused point changes nothing, including anything already staged
      }
      throw e;
    }
    if (tapAction(pending, c, r) === "stage") {
      setPending({ c, r });
      return;
    }
    setPending(null);
    send({ t: "play", c, r });
  };
  const onConfirmMove = () => {
    if (!pending || !myTurn) return;
    const { c, r } = pending;
    setPending(null);
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

  const say = (text) => {
    const t = (text ?? "").trim();
    if (!t) return false;
    /* Only count it as said if the socket actually took it. A tap during a
       reconnect used to take the line off the row for good and leave the
       player no way to be polite. */
    if (!send({ t: "chat", text: t })) return false;
    setSent(prev => (prev.includes(t) ? prev : [...prev, t]));
    return true;
  };
  // A message the socket refused stays in the box, where its author can see it.
  const sendChat = () => { if (say(draft)) setDraft(""); };

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

  const status = partnerThinking && room
    ? t("game.status.thinking", { name: room.seats[up].name })
    : onlineStatus({ room, seat, conn }, t);
  const card = over ? resultCard(over, t) : null;
  const tone = over && color ? (over.winner === color ? "win" : over.winner === null ? "" : "loss") : "";
  const boardDisabled = !room || !seat || !!over || conn !== "open" || (!scoring && !myTurn);
  const mine = seat ? room.seats[seat] : null;
  const theirs = color ? (color === "b" ? whiteLead : blackLead) : null;
  const partner = room && seat && room.pair ? seatName(room, partnerSeat(seat)) : "";
  const settled = settledLine(room, seat, t);

  /* The conversation, lifted out of the table because it goes where the players
     go. Two people who have just finished a game and gone into review together
     are exactly the two people with something to say, and leaving the log at the
     table would have shut them up at the moment they had the most to talk about. */
  const talkCard = (
      <Card className="chat-card">

        <div className="chat-head"><MessageCircle size={15} /><span>{t("game.chat.head")}</span>

          <button className="chip-btn" onClick={shareTable} aria-label={t("online.game.shareLabel")}><LinkIcon size={11} /> {t("online.game.share")}</button>

        </div>

        <div className="chat-log" aria-live="polite">

          {chat.map((m, i) => (

            <div key={m.chatKey} className={`bubble ${account && m.from === account.player.id ? "mine" : ""}`}>

              {(!account || m.from !== account.player.id) && <span className="bubble-who">{m.name}{m.seat ? "" : t("online.game.watchingWho")} · </span>}

              {parsed[i] ? parsed[i].map((part, j) => (

                part.t === "point" ? (

                  <button key={j} type="button"

                    className={`talk-coord ${lit === chatKey(m) ? "on" : ""}`}

                    onClick={() => setLit(lit === chatKey(m) ? null : chatKey(m))}

                    aria-pressed={lit === chatKey(m)}

                  >{part.s}</button>

                ) : <span key={j}>{part.s}</span>

              )) : m.text}

            </div>

          ))}

          <div ref={chatEndRef} />

        </div>

        {account && openers.length > 0 && (

          <div className="talk-offer">

            {openers.map(line => (

              <button key={line.id} type="button" className="talk-line" onClick={() => say(line.text)}>

                <span>{line.text}</span>

                {line.note && <span className="talk-note">{line.note}</span>}

              </button>

            ))}

          </div>

        )}

        {account ? (

          <div className="chat-row">

            <input className="chat-input" value={draft} placeholder={t("game.chat.placeholder")} maxLength={240}

              onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} aria-label={t("game.chat.label")} />

            <button className="chat-send" onClick={sendChat} aria-label={t("game.chat.send")}><Send size={15} /></button>

          </div>

        ) : <p className="fine">{t("online.game.claimToChat")}</p>}

      </Card>
  );

  /* The review both of them are in. Same screen as reading a game alone, with
     the cursor, the variation and the lit points coming off the socket instead
     of out of local state - and the conversation carried along. Leaving is a
     frame rather than a screen change: the other person has to be told. */
  if (inReview && rec && over) {
    const leave = () => send({ t: "reviewLeave" });
    return (
      <Review record={rec} profile={profile} onExit={leave}
        seat={color ? { side: color, opponent: teamName(room, color === "b" ? "w" : "b", t), trainer: false } : null}
        shared={{
          move: review.move, base: review.base, line: review.line, marks: review.marks,
          can: true,
          with: teamName(room, color === "b" ? "w" : "b", t),
          onMove: (n) => send({ t: "reviewMove", n }),
          onTry: (c, r) => send({ t: "reviewTry", c, r }),
          onBack: () => send({ t: "reviewBack" }),
          onMark: (c, r) => send({ t: "reviewMark", c, r }),
          onLeave: leave,
          talk: talkCard,
        }} />
    );
  }

  if (reviewing && rec && over) {
    return (
      <Review record={rec} profile={profile} onExit={() => setReviewing(false)}
        seat={color ? { side: color, opponent: teamName(room, color === "b" ? "w" : "b", t), trainer: false } : null} />
    );
  }

  if (gone) {
    return (
      <div className="stack">
        <Btn icon={ChevronLeft} small onward onClick={onExit}>{t("online.game.lobby")}</Btn>
        <Card inset><p className="fine">{t("online.game.gone")}</p></Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onward onClick={onExit}>{t("online.game.lobby")}</Btn>
        {room && (
          <div className={`vs-strip ${room.pair ? "pair-strip" : ""}`}>
            {room.pair ? <OnlineTeam room={room} color="b" up={up} /> : (
              <Seat seat={blackLead} name={teamName(room, "b")} gameId={gameId} go={go} />
            )}
            <span className="vs-x">vs</span>
            {room.pair ? <OnlineTeam room={room} color="w" up={up} align="right" /> : (
              <Seat seat={whiteLead} name={teamName(room, "w")} gameId={gameId} go={go} align="right" />
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
              territory={preview ? preview.territory : null} dead={rec.dead} pointed={litPoints}
            coordinates={profile.coordinates} mark={profile.lastMoveMark}
            pending={pending ? { c: pending.c, r: pending.r, color } : null} />
          ) : (
            <div className="board-well board-placeholder" aria-hidden="true" />
          )}
          {seat && !over && (scoring ? (
            <div className="row">
              <Btn icon={Check} small primary onClick={() => send({ t: "accept" })} disabled={room.accepted === color}>
                {t(room.accepted === color ? "online.game.accepted" : "online.game.acceptScore")}
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
              <Btn icon={Check} small primary onClick={onConfirmMove} disabled={!pending}>
                {confirmMoveLabel(!!pending, t)}
              </Btn>
              {pending && <Btn icon={X} small onClick={() => setPending(null)}>{t("game.cancel")}</Btn>}
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
                {blackLead && <Avatar name={blackLead.name} tint={blackLead.tint} size={72} className="bow" src={faceOf(blackLead)} />}
                <span className="bow-word">rei</span>
                {whiteLead && <Avatar name={whiteLead.name} tint={whiteLead.tint} size={72} className="bow bow-late" src={faceOf(whiteLead)} />}
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
              {/* Reading it back together is offered before reading it alone: the
                  person who just played this game is the one worth reading it with,
                  and they are still here. */}
              <div className="row">
                {seat && (askedOfMe ? (
                  <>
                    <Btn icon={Users} small primary onClick={() => send({ t: "reviewJoin" })}>
                      {t("online.game.reviewJoin", { name: teamName(room, color === "b" ? "w" : "b", t) })}
                    </Btn>
                    <Btn icon={X} small onClick={() => send({ t: "reviewDecline" })}>{t("online.game.decline")}</Btn>
                  </>
                ) : (
                  <Btn icon={Users} small primary={!askedByMe} disabled={askedByMe}
                    onClick={() => send({ t: "reviewAsk" })}>
                    {t(askedByMe ? "online.game.reviewWaiting" : "online.game.reviewTogether")}
                  </Btn>
                ))}
                <Btn icon={History} small onClick={() => setReviewing(true)}>{t("game.review")}</Btn>
                <Btn icon={Download} small onClick={downloadSgf}>{t("game.sgf")}</Btn>
                <Btn icon={ChevronLeft} small onward onClick={onExit}>{t("online.game.lobby")}</Btn>
              </div>
            </Card>
          )}
          {/* Who was winning, drawn at the table once it is over, for players
              and spectators alike: the record is public to whoever is in the room. */}
          {card && <WinCard record={rec} onReview={() => setReviewing(true)} />}
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
          {talkCard}
          {mine && theirs && !over && (
            <Card inset>
              <p className="fine">
                {t("online.game.seatNote", {
                  side: t(`game.side.${color}`),
                  withPartner: partner ? t("online.game.withPartner", { name: partner }) : "",
                  name: teamName(room, color === "b" ? "w" : "b", t),
                })}
                {room.pair ? t("online.game.noConsulting") : ""}
                {" "}{t("online.game.noClock")}
              </p>
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

/* One team in an online pair header. The same shape the offline table uses: the
   seat to move is raised out of its team, and no name is dimmed to say it is not
   this player's turn. A bot partner is marked a bot, here as everywhere. */
/* A seat at the table, and the way to the person sitting in it.
 *
 *  These links waited for the dashboard. `linkedGame()` spends the `?game=` in
 *  the address on first read, so until there was a screen listing the games you
 *  are in, opening somebody's page from a live table left you in the lobby with
 *  no way back to your own board. The way back is now on the front page, and
 *  the link carries where it came from so Back returns to this table.
 *
 *  A seat with no id is a house player, which has no page and never gets one. */
function Seat({ seat, name, gameId, go, align }) {
  const t = useT();
  const { tag } = useLocale();
  const face = seat ? <Avatar name={seat.name} tint={seat.tint} size={64} src={faceOf(seat)} /> : null;
  const meta = (
    <div className={`vs-meta ${align === "right" ? "right" : ""}`}>
      <strong>{name}{seat && <CountryFlag code={seat.country} tag={tag} size={13} />}</strong>
      {seat && <RankBadge rating={seat.rating} size="sm" />}
    </div>
  );
  const body = align === "right" ? <>{meta}{face}</> : <>{face}{meta}</>;
  if (!go || !seat || !seat.id) return <div className="vs-side">{body}</div>;
  return (
    <button type="button" className="vs-side vs-open"
      onClick={() => go("player", { playerId: seat.id, from: "play", fromParams: { gameId } })}
      aria-label={t("online.game.openPage", { name: seat.name })}>
      {body}
    </button>
  );
}

function OnlineTeam({ room, color, up, align }) {
  const { tag } = useLocale();
  return (
    <div className={`vs-side pair-side ${align === "right" ? "right" : ""}`}>
      {["1", "2"].map((n) => color + n).filter((id) => room.seats[id]).map((id) => {
        const s = room.seats[id];
        return (
          <div key={id} className={`pair-seat ${up === id ? "to-move" : ""}`}>
            <Avatar name={s.name} tint={s.tint} size={48} bot={s.kind === "bot"} src={s.kind === "bot" ? undefined : faceOf(s)} />
            <div className="vs-meta">
              <strong>{s.name}<CountryFlag code={s.country} tag={tag} size={13} /></strong>
              {s.rating != null ? <RankBadge rating={s.rating} size="sm" /> : <span className="fine">{s.rank}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
