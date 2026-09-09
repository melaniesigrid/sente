import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, Flag, RotateCcw, RefreshCw, Trophy, Timer, CircleDot,
  MessageCircle, Bot, Send, User, Handshake,
} from "lucide-react";
import {
  createGame, play, pass, resign, undo, acceptScore, lastMoveIndex, aiChooseMoveForRecord, IllegalMoveError,
} from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, Avatar, RankBadge } from "../components/ui.jsx";
import { rankOf, eloDelta } from "../content/rank.js";
import { saveProfile } from "../store/profile.js";
import { saveGame, clearGame } from "../store/gameStore.js";
import { statusText, refusalText, captionText, resignLabel, RESIGN_CONFIRM_MS } from "./gameStatus.js";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const BOARD_SIZE = 9;

/* ----------------------- GAME -----------------------
   A thin adapter over the engine's GameRecord. The only state here is the
   record itself plus UI-only bits (thinking, chat, draft). Rules, captures,
   pass counting and scoring all come from the record. */
export function Game({ mode, onExit, profile, setProfile, notify, initial }) {
  const persona = mode.kind === "bot" ? mode.persona : null;
  const [rec, setRec] = useState(() => initial || createGame({ size: BOARD_SIZE }));
  const [thinking, setThinking] = useState(false);
  const [chat, setChat] = useState(() =>
    persona ? [{ who: "bot", text: pick(persona.chat.greet) }] : []);
  const [draft, setDraft] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const chatEndRef = useRef(null);
  const thinkTimer = useRef(null);
  const resignTimer = useRef(null);
  const over = rec.phase === "ended" ? rec.result : null;
  const turn = rec.toPlay;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [chat]);
  useEffect(() => () => { clearTimeout(thinkTimer.current); clearTimeout(resignTimer.current); }, []);

  // Persist the table on every change; an ended or empty game clears the slot.
  useEffect(() => {
    if (rec.phase === "ended" || rec.moves.length === 0) clearGame();
    else saveGame({ record: rec, mode: { kind: mode.kind, personaId: persona ? persona.id : null } });
  }, [rec, mode.kind, persona]);

  const say = useCallback((text) => setChat(c => [...c, { who: "bot", text }]), []);

  /* Two passes put the record in `scoring`. Until the end-game ceremony lands
     (Phase 3) we accept the score straight away with no dead stones. A rated game
     settles exactly once: only on the transition into `ended`, and the new profile
     is computed from the current prop so a double-invoked updater (StrictMode)
     cannot save or toast twice. */
  const conclude = useCallback((next, prev) => {
    if (next.phase === "scoring") next = acceptScore(next);
    if (next.phase === "ended" && prev.phase !== "ended" && persona) {
      const won = next.result.winner === "b";
      say(pick(won ? persona.chat.loss : persona.chat.win));
      const oldRank = rankOf(profile.rating);
      const delta = eloDelta(profile.rating, persona.rating, won ? 1 : 0);
      const rating = Math.max(400, profile.rating + delta);
      const streak = won ? profile.streak + 1 : 0;
      const np = {
        ...profile, rating,
        wins: profile.wins + (won ? 1 : 0), losses: profile.losses + (won ? 0 : 1),
        streak, bestStreak: Math.max(profile.bestStreak, streak),
      };
      setProfile(np);
      saveProfile(np);
      const newRank = rankOf(rating);
      if (won && newRank !== oldRank) notify({ icon: "medal", text: `Promoted to ${newRank}` });
      else notify({ icon: won ? "trophy" : "flag", text: `${won ? "Victory" : "Defeat"} · ${delta >= 0 ? "+" : ""}${delta} rating` });
    }
    return next;
  }, [persona, profile, say, setProfile, notify]);

  const botTurn = useCallback((r) => {
    setThinking(true);
    thinkTimer.current = setTimeout(() => {
      setThinking(false);
      const mv = aiChooseMoveForRecord(r, persona.weights);
      let next;
      if (mv) {
        try { next = play(r, mv[0], mv[1]); } catch { next = pass(r); }
        const caps = next.lastCaptured.length;
        if (caps >= 2 || (caps === 1 && Math.random() < 0.4)) say(pick(persona.chat.botCapture));
      } else {
        next = pass(r);
      }
      setRec(conclude(next, r));
    }, 380 + Math.random() * 500);
  }, [persona, say, conclude]);

  // A resumed game may be waiting on the house player.
  useEffect(() => {
    if (persona && rec.phase === "playing" && rec.toPlay === "w" && !thinking) botTurn(rec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPlay = (c, r) => {
    if (over || thinking) return;
    if (persona && turn !== "b") return;
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
    if (persona) {
      if (next.lastCaptured.length >= 2) say(pick(persona.chat.userCapture));
      botTurn(next);
    }
  };

  const onPass = () => {
    if (over || thinking) return;
    if (persona && turn !== "b") return;
    const next = conclude(pass(rec), rec);
    setRec(next);
    if (persona && next.phase === "playing") botTurn(next);
  };

  /* Two clicks to resign, no modal: the button reads "Confirm resign?" for a few
     seconds and then quietly goes back. Against a house player only Black resigns;
     in pass-and-play whoever is to move does. */
  const canResign = !over && !thinking && (!persona || turn === "b");
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
    setRec(conclude(resign(rec, turn), rec));
  };

  const undoDepth = persona ? 2 : 1;
  const canUndo = !over && !thinking && rec.moves.length >= undoDepth;
  const onUndo = () => {
    if (!canUndo) return;
    let r = rec;
    for (let i = 0; i < undoDepth; i++) r = undo(r);
    setRec(r);
  };

  const reset = () => {
    clearTimeout(thinkTimer.current);
    clearTimeout(resignTimer.current);
    setThinking(false);
    setConfirmResign(false);
    setRec(createGame({ size: BOARD_SIZE }));
    if (persona) setChat([{ who: "bot", text: pick(persona.chat.greet) }]);
  };

  const sendChat = () => {
    const t = draft.trim();
    if (!t || !persona) return;
    setChat(c => [...c, { who: "you", text: t }]);
    setDraft("");
    setTimeout(() => say(pick(persona.chat.reply)), 700 + Math.random() * 900);
  };

  const status = statusText({ result: over, thinking, personaName: persona ? persona.name : null, turn });

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>Lobby</Btn>
        <div className="vs-strip">
          <div className="vs-side">
            <Avatar name={profile.name} tint={profile.tint} size={34} />
            <div className="vs-meta"><strong>{persona ? profile.name : "Black"}</strong>{persona && <RankBadge rating={profile.rating} size="sm" />}</div>
          </div>
          <span className="vs-x">vs</span>
          <div className="vs-side">
            {persona
              ? <><div className="vs-meta right"><strong>{persona.name}</strong><RankBadge rating={persona.rating} size="sm" /></div><Avatar name={persona.name} tint={persona.tint} size={34} bot /></>
              : <><div className="vs-meta right"><strong>White</strong></div><div className="avatar duo sm"><User size={15} /></div></>}
          </div>
        </div>
      </div>
      <div className="play-wrap">
        <div className="board-col stack-sm">
          <Pill icon={over ? Trophy : thinking ? Timer : CircleDot}
            tone={over ? (persona ? (over.winner === "b" ? "win" : "loss") : "") : ""}>
            {status}
          </Pill>
          <Board board={rec.board} onPlay={onPlay} lastMove={lastMoveIndex(rec)}
            disabled={!!over || (persona && turn !== "b") || thinking} />
          <div className="row">
            <Btn icon={Flag} small onClick={onPass} disabled={!!over}>Pass</Btn>
            <Btn icon={RotateCcw} small onClick={onUndo} disabled={!canUndo}>Undo</Btn>
            <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign)}</Btn>
            <Btn icon={RefreshCw} small onClick={reset}>New game</Btn>
          </div>
        </div>
        <div className="side stack-sm">
          <Card inset className="caps">
            <div><span className="dot dot-b" /> Black captures: {rec.captures.b}</div>
            <div><span className="dot dot-w" /> White captures: {rec.captures.w}</div>
            <div className="fine">{captionText({ komi: rec.komi, rated: !!persona })}</div>
          </Card>
          {persona ? (
            <Card className="chat-card">
              <div className="chat-head"><MessageCircle size={15} /><span>Table talk</span><span className="bot-chip"><Bot size={11} /> house player</span></div>
              <div className="chat-log" aria-live="polite">
                {chat.map((m, i) => (
                  <div key={i} className={`bubble ${m.who === "you" ? "mine" : ""}`}>{m.text}</div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-row">
                <input
                  className="chat-input" value={draft} placeholder="Say something…"
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  aria-label="Chat message"
                />
                <button className="chat-send" onClick={sendChat} aria-label="Send"><Send size={15} /></button>
              </div>
            </Card>
          ) : (
            <Card inset>
              <p className="fine">Face-to-face games are unrated. Pass the device after each move — and settle disputes the traditional way: another game.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
