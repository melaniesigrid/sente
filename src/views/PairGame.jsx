import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ChevronLeft, Flag, RotateCcw, RefreshCw, Trophy, Timer, CircleDot, Scale,
  Handshake, Check, Download, Undo2, Users, MessageCircle, Bot,
} from "lucide-react";
import {
  createGame, play, pass, resign, undo, markDead, acceptScore, scoreBoard, chainsInAtari, idx,
  lastMoveIndex, aiChooseMoveForRecord, kataChooseMoveForRecord, profileForRank,
  loadModel, onModelProgress, modelReady, toSgf, IllegalMoveError,
  seatToPlay, canSeatPlay, rotationOf, rosterPlayers, colorOfSeat,
} from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, Avatar, RankBadge } from "../components/ui.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import { playStone, playCapture, playBell, haptic } from "../components/sound.js";
import { hintsFor } from "../content/rank.js";
import {
  pairRoster, seatAsk, seatWeights, seatPersona, seatRating, pairCaption, pairStatus, PARTNER_RANK,
} from "../content/rengo.js";
import { refusalText, resultLine, resultCard, resignLabel, loadingText, RESIGN_CONFIRM_MS } from "./gameStatus.js";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const MOMENT_MS = 2600;
const BOARD_PX = { 9: 460, 13: 560, 19: 680 };

/* ----------------------- PAIR GAME -----------------------
   Four seats at one board: you and a 7 dan house player against a house player
   and its own 7 dan. The four of you rotate b1, w1, b2, w2 and nobody plays
   twice running.

   This is a view of its own rather than a fourth branch inside `Game.jsx`,
   which already carries a duel, a master and a coach. The two views share the
   engine, the board, the result card and the status text; what differs is the
   one question a pair table asks that an ordinary table does not (*which of
   the four is to move*) and that question is answered by `seatToPlay`, a pure
   function of how many moves have been played. There is no seat state here to
   fall out of step with the record, which is why undo can take four moves back
   without anybody having to remember where the rotation was.

   Your partner is silent. It greets you at the start and thanks you at the end,
   and between those two lines it says nothing: no hints, no candidate points,
   no explanations. What it teaches, it teaches by playing its half of a
   position you made. `docs/designs/pair-go.md` argues the case.

   The table is unrated and says so before the first stone. A win in which a
   7 dan played half your moves is evidence about the pair, not about you.

   No clock, in this first version. Timing a *team* is a real question (one
   clock for two players, or two, and what byo-yomi means when your partner
   burned it) and guessing at it would be worse than leaving it off and
   saying so. */
export function PairGame({ mode, onExit, profile, notify }) {
  const partnerRank = mode.partnerRank ?? PARTNER_RANK;
  const roster = useMemo(
    () => pairRoster({ profile, persona: mode.persona, rank: mode.rank, partnerRank }),
    [profile, mode.persona, mode.rank, partnerRank],
  );
  const table = {
    size: mode.size, rules: mode.rules, komi: mode.komi,
    // Even games only: whether a handicap between two *teams* means anything is
    // an open question, and the seat model answers it either way when it is settled.
    handicap: 0, clock: null,
  };
  const [rec, setRec] = useState(() => createGame(table));
  const [thinking, setThinking] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [moment, setMoment] = useState(null);
  const [loading, setLoading] = useState(null);
  const [chat, setChat] = useState(() => []);
  const alive = useRef(true);
  const thinkTimer = useRef(null);
  const resignTimer = useRef(null);
  const momentTimer = useRef(null);
  const opened = useRef(false);
  const chatEndRef = useRef(null);

  /* Table talk. A line is attributed to a seat, because "White said" names two
     people at this table. Your partner's only two lines are the greeting and the
     thanks; everything in between is the opponent's, which is exactly as much as
     a partner is allowed to say. */
  const say = useCallback((id, text) => setChat(c => [...c, { id, text }]), []);
  const greet = useCallback(() => {
    for (const id of ["w1", "b2", "w2"]) {
      const p = seatPersona(roster, id);
      if (p) say(id, pick(p.chat.greet));
    }
  }, [roster, say]);

  const over = rec.phase === "ended" ? rec.result : null;
  const scoring = rec.phase === "scoring";
  const seatId = seatToPlay(roster, rec);
  const myTurn = canSeatPlay(roster, rec, "b1");
  const sound = !!profile.sound;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [chat]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(thinkTimer.current); clearTimeout(resignTimer.current); clearTimeout(momentTimer.current);
    };
  }, []);

  // Three of the four seats are house players, so the network is wanted immediately.
  useEffect(() => {
    const off = onModelProgress((e) => {
      if (!alive.current) return;
      setLoading(e.phase === "download" || e.phase === "compile" ? loadingText(e) : null);
    });
    if (!modelReady()) loadModel().catch(() => {});
    return off;
  }, []);

  /* ----- board facts (read-only, from the engine) ----- */
  const myAtari = useMemo(() => rec.phase === "playing" ? chainsInAtari(rec.board, "b") : [], [rec.board, rec.phase]);
  const oppAtari = useMemo(() => rec.phase === "playing" ? chainsInAtari(rec.board, "w") : [], [rec.board, rec.phase]);
  const hints = hintsFor(profile.rating, profile.rd);
  const atariIdx = useMemo(
    () => (hints ? myAtari.flatMap(ch => ch.stones.map(([c, r]) => idx(rec.size, c, r))) : []),
    [hints, myAtari, rec.size],
  );
  const preview = useMemo(
    () => (scoring ? scoreBoard(rec.board, { dead: rec.dead, komi: rec.komi, handicap: rec.handicap }) : null),
    [scoring, rec.board, rec.dead, rec.komi, rec.handicap],
  );

  useMokuFacts({
    view: "game", phase: rec.phase, thinking,
    myAtari: myAtari.length, oppAtari: oppAtari.length, ko: rec.koPoint !== null,
    moment, result: over ? (over.winner === null ? "jigo" : over.winner === "b" ? "win" : "loss") : null,
    seed: rec.moves.length,
  });

  /* A move landed. A capture by either of your team's seats is a capture you
     share, which is the point of a team: your partner's tesuji is your tesuji. */
  const afterMove = useCallback((next, mover) => {
    const caps = next.lastCaptured ? next.lastCaptured.length : 0;
    if (sound) { playStone(); if (caps) playCapture(caps); }
    haptic(caps ? [10, 30, 14] : 8);
    if (caps) {
      setMoment(mover === "b" ? "capture" : "captured");
      clearTimeout(momentTimer.current);
      momentTimer.current = setTimeout(() => setMoment(null), MOMENT_MS);
    }
  }, [sound]);

  /* The game ends. Nothing is rated and nothing is written to the profile: the
     only thing that happens is that the bell rings and the card appears. */
  const conclude = useCallback((next, prev) => {
    if (next.phase === "ended" && prev.phase !== "ended") {
      if (sound) playBell();
      const won = next.result.winner === "b";
      // Your partner's second and last line, and the opponents' answer to it.
      for (const id of ["b2", "w1", "w2"]) {
        const p = seatPersona(roster, id);
        if (!p) continue;
        const mine = id[0] === "b";
        say(id, pick(won === mine ? p.chat.win : p.chat.loss));
      }
      notify({
        icon: next.result.winner === "b" ? "trophy" : "flag",
        text: `${next.result.winner === "b" ? "Your pair wins" : next.result.winner === null ? "Jigo" : "Their pair wins"} · unrated`,
      });
    }
    return next;
  }, [sound, notify, roster, say]);

  /* One house player's turn, whichever of the three it is. The seat says what
     rank to ask the network for and who it is answering; if the network cannot
     load, that seat's persona answers with the heuristic player instead, so a
     pair game never stalls on a download. */
  const botTurn = useCallback((r) => {
    const seat = seatToPlay(roster, r);
    if (!seat || roster[seat].kind !== "bot") return;
    setThinking(true);
    const started = Date.now();
    const settle = (mv) => {
      const wait = Math.max(0, 380 + Math.random() * 500 - (Date.now() - started));
      thinkTimer.current = setTimeout(() => {
        if (!alive.current) return;
        setThinking(false);
        let next;
        if (mv) {
          try { next = play(r, mv[0], mv[1]); } catch { next = pass(r); }
          afterMove(next, colorOfSeat(seat));
          /* Only the opponent crows about a capture. Your partner taking stones
             off is your team taking stones off, and a partner who narrated it
             would be explaining its move, which is the one thing it does not do. */
          const caps = next.lastCaptured.length;
          if (seat === "w1" && (caps >= 2 || (caps === 1 && Math.random() < 0.4))) {
            say(seat, pick(seatPersona(roster, seat).chat.botCapture));
          }
        } else {
          next = pass(r);
        }
        const settled = conclude(next, r);
        setRec(settled);
        // Three seats in a row are bots, so a turn can hand straight on to another.
        if (settled.phase === "playing" && !canSeatPlay(roster, settled, "b1")) botTurn(settled);
      }, wait);
    };
    const ask = seatAsk(roster, seat, r.firstToPlay);
    const fallback = () => aiChooseMoveForRecord(r, seatWeights(roster, seat));
    kataChooseMoveForRecord(r, { ...profileForRank(ask.rank, ask.temperature), oppRank: ask.oppRank })
      .then((res) => settle(res ? res.move : fallback()))
      .catch(() => settle(fallback()));
  }, [roster, afterMove, conclude, say]);

  // Black opens, and Black is you, so nothing moves until you do. The greeting is
  // the one thing that happens first.
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    greet();
    if (rec.phase === "playing" && !canSeatPlay(roster, rec, "b1")) botTurn(rec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPlay = (c, r) => {
    if (over || thinking) return;
    if (scoring) {
      try { setRec(markDead(rec, c, r)); } catch (e) { if (!(e instanceof IllegalMoveError)) throw e; }
      return;
    }
    if (!myTurn) return;
    let next;
    try {
      next = play(rec, c, r);
    } catch (e) {
      if (e instanceof IllegalMoveError) {
        const text = refusalText(e.reason);
        if (text) notify({ icon: "info", text });
        return;
      }
      throw e;
    }
    setRec(next);
    afterMove(next, "b");
    botTurn(next);
  };

  const onPass = () => {
    if (over || thinking || scoring || !myTurn) return;
    const next = conclude(pass(rec), rec);
    setRec(next);
    if (next.phase === "playing") botTurn(next);
  };

  /* Resigning is yours alone. Your partner will not resign for you and will not
     accept a score for you: ending a game is the human's decision in every seat
     a human sits in. */
  const canResign = !over && !thinking && (myTurn || scoring);
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
    setRec(conclude(resign(rec, "b"), rec));
  };

  /* One turn of the rotation: taking your move back takes the whole circuit back,
     because anything less would return the board to somebody else's chair. */
  const undoDepth = rotationOf(roster, rec.firstToPlay).length;
  const canUndo = !over && !thinking && !scoring && rec.moves.length >= undoDepth;
  const onUndo = () => {
    if (!canUndo) return;
    let r = rec;
    for (let i = 0; i < undoDepth; i++) r = undo(r);
    setRec(r);
  };

  const onAccept = () => { if (scoring) setRec(conclude(acceptScore(rec), rec)); };
  const onResumePlay = () => {
    if (!scoring) return;
    let r = rec;
    for (let i = 0; i < 2 && r.moves.length; i++) r = undo(r);
    setRec(r);
    if (r.phase === "playing" && !canSeatPlay(roster, r, "b1")) botTurn(r);
  };

  const reset = () => {
    clearTimeout(thinkTimer.current);
    clearTimeout(resignTimer.current);
    setThinking(false);
    setConfirmResign(false);
    setMoment(null);
    setChat([]);
    setRec(createGame(table));
    greet();
  };

  const downloadSgf = () => {
    const blob = new Blob([toSgf({ ...rec, players: rosterPlayers(roster) })], { type: "application/x-go-sgf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `joseki-pair-${new Date().toISOString().slice(0, 10)}.sgf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const status = pairStatus({
    result: over, resultLine: resultLine(over), thinking, roster, seatId, phase: rec.phase, loading,
  });
  const card = over ? resultCard(over) : null;
  const boardDisabled = !!over || thinking || (!scoring && !myTurn);

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>Lobby</Btn>
        <div className="vs-strip pair-strip">
          <TeamSide roster={roster} color="b" profile={profile} seatId={seatId} />
          <span className="vs-x">vs</span>
          <TeamSide roster={roster} color="w" profile={profile} seatId={seatId} align="right" />
        </div>
      </div>
      <div className="play-wrap">
        <div className="board-col stack-sm">
          <Pill icon={over ? Trophy : scoring ? Scale : thinking ? Timer : CircleDot}
            tone={over ? (over.winner === "b" ? "win" : "loss") : ""}>
            {status}
          </Pill>
          <Board board={rec.board} onPlay={onPlay} lastMove={lastMoveIndex(rec)}
            sizePx={BOARD_PX[rec.size]}
            disabled={boardDisabled}
            atari={atariIdx}
            captured={rec.lastCaptured || []} captureKey={rec.moves.length}
            territory={preview ? preview.territory : null} dead={rec.dead} />
          {scoring ? (
            <div className="row">
              <Btn icon={Check} small primary onClick={onAccept}>Accept score</Btn>
              <Btn icon={Undo2} small onClick={onResumePlay}>Keep playing</Btn>
              <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign)}</Btn>
            </div>
          ) : (
            <div className="row">
              <Btn icon={Flag} small onClick={onPass} disabled={!!over || !myTurn}>Pass</Btn>
              <Btn icon={RotateCcw} small onClick={onUndo} disabled={!canUndo}>Undo the round</Btn>
              <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign)}</Btn>
              <Btn icon={RefreshCw} small onClick={reset}>New game</Btn>
            </div>
          )}
        </div>
        <div className="side stack-sm">
          {card && (
            <Card className={`result-card ${over.winner === "b" ? "win" : over.winner === "w" ? "loss" : ""}`}>
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
                Unrated, as every pair game is: half of your team's moves were played
                at {partnerRank}, so the result is evidence about the pair and not about you.
              </p>
              <div className="row">
                <Btn icon={RefreshCw} small primary onClick={reset}>Play again</Btn>
                <Btn icon={Download} small onClick={downloadSgf}>SGF</Btn>
              </div>
            </Card>
          )}
          {scoring && preview && (
            <Card inset className="caps">
              <div className="stat-head"><Scale size={15} /><span>Counting</span></div>
              <div><span className="dot dot-b" /> Black {preview.totals.b}</div>
              <div><span className="dot dot-w" /> White {preview.totals.w}</div>
              <p className="fine">Tap a stone to mark its whole group dead; tap again to revive it. All three house players are bots with no opinion on life and death, so your marking stands.</p>
            </Card>
          )}
          {!over && !scoring && (
            <Card inset className="caps">
              <div><span className="dot dot-b" /> Black captures: {rec.captures.b}</div>
              <div><span className="dot dot-w" /> White captures: {rec.captures.w}</div>
              <div className="fine">{pairCaption({ size: rec.size, komi: rec.komi, partnerRank })}{hints ? " · atari hints on" : ""}</div>
            </Card>
          )}
          <Card className="chat-card">
            <div className="chat-head">
              <MessageCircle size={15} /><span>Table talk</span>
              <span className="bot-chip"><Bot size={11} /> three house players</span>
            </div>
            <div className="chat-log" aria-live="polite">
              {chat.map((m, i) => (
                <div key={i} className={`bubble ${colorOfSeat(m.id) === "b" ? "mine" : ""}`}>
                  <span className="bubble-who">{roster[m.id].name} · </span>{m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* No input box, and the reason is a rule and not an omission. */}
            <p className="fine">
              There is nothing to type here. Partners may not consult in pair go (that is
              the rule the game is built on) so {roster.b2.name} will not take a question
              and you would not be allowed to ask one.
            </p>
          </Card>
          <Card inset>
            <div className="stat-head"><Users size={15} /><span>How a pair table works</span></div>
            <p className="fine">
              The four of you take turns in one rotation and nobody plays twice running, so
              every move you make is answered by an opponent and then built on by your
              partner. {roster.b2.name} plays your team's other half at {partnerRank} and
              will not tell you what to play: what it has to teach, it teaches by playing it.
            </p>
            <p className="fine">No clock at a pair table yet: timing a team is its own question, and guessing at it would be worse than leaving it off.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* One team in the header: both seats, the one to move lit. A pair table has four
   names on it and the only thing a player needs at a glance is which one is
   thinking, so that is the only thing marked. */
function TeamSide({ roster, color, profile, seatId, align }) {
  const seats = ["1", "2"].map((n) => color + n);
  return (
    <div className={`vs-side pair-side ${align === "right" ? "right" : ""}`}>
      {seats.map((id) => {
        const seat = roster[id];
        const rating = seatRating(seat);
        return (
          <div key={id} className={`pair-seat ${seatId === id ? "to-move" : ""}`}>
            <Avatar name={seat.name} tint={seat.tint ?? profile.tint} size={30} bot={seat.kind === "bot"} />
            <div className="vs-meta">
              <strong>{seat.name}</strong>
              {rating !== null && <RankBadge rating={rating} size="sm" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
