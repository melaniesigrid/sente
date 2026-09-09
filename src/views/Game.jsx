import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ChevronLeft, Flag, RotateCcw, RefreshCw, Trophy, Timer, CircleDot, Scale,
  MessageCircle, Bot, Send, User, Handshake, Check, Download, Undo2, Award,
} from "lucide-react";
import {
  createGame, play, pass, resign, undo, markDead, acceptScore, scoreBoard, chainsInAtari, idx,
  lastMoveIndex, aiChooseMoveForRecord, kataChooseMoveForRecord, profileForRank, loadModel, onModelProgress, modelReady,
  toSgf, IllegalMoveError,
} from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { Card, Btn, Pill, Avatar, RankBadge, BeltRibbon } from "../components/ui.jsx";
import { MokuMark } from "../components/Moku.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import { playStone, playCapture, playBell, haptic } from "../components/sound.js";
import { rankOf, ratingOfRank, eloDelta, beltOf, hintsForBelt } from "../content/rank.js";
import { saveProfile } from "../store/profile.js";
import { saveGame, clearGame } from "../store/gameStore.js";
import {
  statusText, refusalText, captionText, resignLabel, resultCard, ratingLine, RESIGN_CONFIRM_MS,
} from "./gameStatus.js";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const BOARD_SIZE = 9;
const MOMENT_MS = 2600;

/* ----------------------- GAME -----------------------
   A thin adapter over the engine's GameRecord. The only state here is the
   record itself plus UI-only bits (thinking, chat, draft, the current "moment"
   Moku reacts to, and the promotion ceremony). Rules, captures, pass counting,
   dead-stone marking and scoring all come from the record.

   The end of a game is a ceremony, not a toast: two passes open scoring, dead
   stones are tapped off, the count is shown term by term, and both players
   bow. House players have no opinion on life and death and the card says so. */
export function Game({ mode, onExit, profile, setProfile, notify, initial }) {
  const persona = mode.kind === "bot" ? mode.persona : null;
  // The rank this game is played at; house players adapt to it. Defaults to the player's own.
  const botRank = persona ? (mode.rank ?? rankOf(profile.rating)) : null;
  const botRating = persona ? ratingOfRank(botRank) : null;
  const [rec, setRec] = useState(() => initial || createGame({ size: BOARD_SIZE }));
  const [thinking, setThinking] = useState(false);
  const [chat, setChat] = useState(() =>
    persona ? [{ who: "bot", text: pick(persona.chat.greet) }] : []);
  const [draft, setDraft] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const [moment, setMoment] = useState(null);      // "capture" | "captured", expires
  const [delta, setDelta] = useState(null);        // rating change of the finished game
  const [ceremony, setCeremony] = useState(null);  // belt just earned, until dismissed
  const [loading, setLoading] = useState(null);    // {loaded, total} while the network downloads
  const alive = useRef(true);
  const chatEndRef = useRef(null);
  const thinkTimer = useRef(null);
  const resignTimer = useRef(null);
  const momentTimer = useRef(null);
  const over = rec.phase === "ended" ? rec.result : null;
  const scoring = rec.phase === "scoring";
  const turn = rec.toPlay;
  const mySide = persona ? "b" : turn;
  const sound = !!profile.sound;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [chat]);
  useEffect(() => {
    alive.current = true;   // StrictMode mounts twice; the cleanup below must not stick
    return () => {
      alive.current = false;
      clearTimeout(thinkTimer.current); clearTimeout(resignTimer.current); clearTimeout(momentTimer.current);
    };
  }, []);

  /* The house player's brain (KataGo's human-style network) downloads once per
     visit. Start it as soon as a bot game opens so the first move is not the one
     that waits; the pill reports progress while it arrives. */
  useEffect(() => {
    if (!persona) return undefined;
    const off = onModelProgress((e) => {
      if (!alive.current) return;
      setLoading(e.phase === "download" || e.phase === "compile" ? { loaded: e.loaded, total: e.total } : null);
    });
    if (!modelReady()) loadModel().catch(() => {});
    return off;
  }, [persona]);

  // Persist the table on every change; an ended or empty game clears the slot.
  useEffect(() => {
    if (rec.phase === "ended" || rec.moves.length === 0) clearGame();
    else saveGame({ record: rec, mode: { kind: mode.kind, personaId: persona ? persona.id : null, rank: botRank } });
  }, [rec, mode.kind, persona, botRank]);

  const say = useCallback((text) => setChat(c => [...c, { who: "bot", text }]), []);

  /* ----- board facts (read-only, from the engine) ----- */
  const myAtari = useMemo(() => rec.phase === "playing" ? chainsInAtari(rec.board, mySide) : [], [rec.board, rec.phase, mySide]);
  const oppAtari = useMemo(() => rec.phase === "playing" ? chainsInAtari(rec.board, mySide === "b" ? "w" : "b") : [], [rec.board, rec.phase, mySide]);
  const belt = beltOf(profile.rating);
  const hints = hintsForBelt(belt);
  const atariIdx = useMemo(
    () => (hints ? myAtari.flatMap(ch => ch.stones.map(([c, r]) => idx(rec.size, c, r))) : []),
    [hints, myAtari, rec.size],
  );
  const preview = useMemo(
    () => (scoring ? scoreBoard(rec.board, { dead: rec.dead, komi: rec.komi, handicap: rec.handicap }) : null),
    [scoring, rec.board, rec.dead, rec.komi, rec.handicap],
  );
  const resultKind = over ? (over.winner === null ? "jigo" : persona ? (over.winner === "b" ? "win" : "loss") : "win") : null;

  useMokuFacts({
    view: "game", phase: rec.phase, thinking,
    myAtari: myAtari.length, oppAtari: oppAtari.length, ko: rec.koPoint !== null,
    moment, result: resultKind, promoted: ceremony ? ceremony.label : null, seed: rec.moves.length,
  });

  /* A move landed: sound, haptic, and the moment Moku reacts to. `mover` is the
     colour that played; in pass-and-play every capture is "yours". */
  const afterMove = useCallback((next, mover) => {
    const caps = next.lastCaptured ? next.lastCaptured.length : 0;
    if (sound) { playStone(); if (caps) playCapture(caps); }
    haptic(caps ? [10, 30, 14] : 8);
    if (caps) {
      setMoment(persona && mover !== "b" ? "captured" : "capture");
      clearTimeout(momentTimer.current);
      momentTimer.current = setTimeout(() => setMoment(null), MOMENT_MS);
    }
  }, [sound, persona]);

  /* A rated game settles exactly once: only on the transition into `ended`, and
     the new profile is computed from the current prop so a double-invoked updater
     (StrictMode) cannot save or toast twice. A belt change is a ceremony; a rank
     change inside the same belt is a toast. */
  const conclude = useCallback((next, prev) => {
    if (next.phase === "ended" && prev.phase !== "ended") {
      if (sound) playBell();
      if (persona) {
        const won = next.result.winner === "b";
        say(pick(won ? persona.chat.loss : persona.chat.win));
        const oldRank = rankOf(profile.rating), oldBelt = beltOf(profile.rating);
        const d = eloDelta(profile.rating, botRating, won ? 1 : 0);
        const rating = Math.max(400, profile.rating + d);
        const streak = won ? profile.streak + 1 : 0;
        const np = {
          ...profile, rating,
          wins: profile.wins + (won ? 1 : 0), losses: profile.losses + (won ? 0 : 1),
          streak, bestStreak: Math.max(profile.bestStreak, streak),
        };
        setProfile(np);
        saveProfile(np);
        setDelta(d);
        const newRank = rankOf(rating), newBelt = beltOf(rating);
        if (won && newBelt !== oldBelt) setCeremony(newBelt);
        else if (won && newRank !== oldRank) notify({ icon: "medal", text: `Promoted to ${newRank}` });
        else notify({ icon: won ? "trophy" : "flag", text: `${won ? "Victory" : "Defeat"} · ${d >= 0 ? "+" : ""}${d} rating` });
      }
    }
    return next;
  }, [persona, botRating, profile, say, setProfile, notify, sound]);

  /* Ask the human network what a player of the persona's rank would do; if it is
     unavailable (offline, old browser) the heuristic house player answers instead.
     A short minimum delay keeps the reply from feeling instant. */
  const botTurn = useCallback((r) => {
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
          const caps = next.lastCaptured.length;
          if (caps >= 2 || (caps === 1 && Math.random() < 0.4)) say(pick(persona.chat.botCapture));
          afterMove(next, "w");
        } else {
          next = pass(r);
        }
        setRec(conclude(next, r));
      }, wait);
    };
    const fallback = () => aiChooseMoveForRecord(r, persona.weights);
    kataChooseMoveForRecord(r, { ...profileForRank(botRank, persona.profile.temperature), oppRank: rankOf(profile.rating) })
      .then((res) => settle(res ? res.move : fallback()))
      .catch(() => settle(fallback()));
  }, [persona, botRank, profile.rating, say, conclude, afterMove]);

  // A resumed game may be waiting on the house player.
  useEffect(() => {
    if (persona && rec.phase === "playing" && rec.toPlay === "w" && !thinking) botTurn(rec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPlay = (c, r) => {
    if (over || thinking) return;
    if (scoring) {
      try { setRec(markDead(rec, c, r)); } catch (e) { if (!(e instanceof IllegalMoveError)) throw e; }
      return;
    }
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
    afterMove(next, turn);
    if (persona) {
      if (next.lastCaptured.length >= 2) say(pick(persona.chat.userCapture));
      botTurn(next);
    }
  };

  const onPass = () => {
    if (over || thinking || scoring) return;
    if (persona && turn !== "b") return;
    const next = conclude(pass(rec), rec);
    setRec(next);
    if (persona && next.phase === "playing") botTurn(next);
  };

  /* Two clicks to resign, no modal: the button reads "Confirm resign?" for a few
     seconds and then quietly goes back. Against a house player only Black resigns;
     in pass-and-play whoever is to move does. Allowed while scoring too. */
  const canResign = !over && !thinking && (!persona || turn === "b" || scoring);
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
    setRec(conclude(resign(rec, mySide), rec));
  };

  const undoDepth = persona ? 2 : 1;
  const canUndo = !over && !thinking && !scoring && rec.moves.length >= undoDepth;
  const onUndo = () => {
    if (!canUndo) return;
    let r = rec;
    for (let i = 0; i < undoDepth; i++) r = undo(r);
    setRec(r);
  };

  /* ----- the ceremony ----- */
  const onAccept = () => { if (scoring) setRec(conclude(acceptScore(rec), rec)); };
  /* Take back both passes and keep playing. If that leaves the house player to
     move (it passed first), it moves again. */
  const onResumePlay = () => {
    if (!scoring) return;
    let r = rec;
    for (let i = 0; i < undoDepth && r.moves.length; i++) r = undo(r);
    setRec(r);
    if (persona && r.phase === "playing" && r.toPlay === "w") botTurn(r);
  };

  const reset = () => {
    clearTimeout(thinkTimer.current);
    clearTimeout(resignTimer.current);
    setThinking(false);
    setConfirmResign(false);
    setDelta(null);
    setMoment(null);
    setRec(createGame({ size: BOARD_SIZE }));
    if (persona) setChat([{ who: "bot", text: pick(persona.chat.greet) }]);
  };

  const downloadSgf = () => {
    const players = persona
      ? { b: profile.name, w: `${persona.name} (house bot)` }
      : { b: "Black", w: "White" };
    const blob = new Blob([toSgf({ ...rec, players })], { type: "application/x-go-sgf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sente-${new Date().toISOString().slice(0, 10)}.sgf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const sendChat = () => {
    const t = draft.trim();
    if (!t || !persona) return;
    setChat(c => [...c, { who: "you", text: t }]);
    setDraft("");
    setTimeout(() => say(pick(persona.chat.reply)), 700 + Math.random() * 900);
  };

  const status = statusText({ result: over, thinking, personaName: persona ? persona.name : null, turn, phase: rec.phase, loading });
  const card = over ? resultCard(over) : null;
  const boardDisabled = !!over || thinking || (!scoring && persona && turn !== "b");

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
              ? <><div className="vs-meta right"><strong>{persona.name}</strong><RankBadge rating={botRating} size="sm" /></div><Avatar name={persona.name} tint={persona.tint} size={34} bot /></>
              : <><div className="vs-meta right"><strong>White</strong></div><div className="avatar duo sm"><User size={15} /></div></>}
          </div>
        </div>
      </div>
      <div className="play-wrap">
        <div className="board-col stack-sm">
          <Pill icon={over ? Trophy : scoring ? Scale : thinking ? Timer : CircleDot}
            tone={over ? (persona ? (over.winner === "b" ? "win" : "loss") : "") : ""}>
            {status}
          </Pill>
          <Board board={rec.board} onPlay={onPlay} lastMove={lastMoveIndex(rec)}
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
              <Btn icon={Flag} small onClick={onPass} disabled={!!over}>Pass</Btn>
              <Btn icon={RotateCcw} small onClick={onUndo} disabled={!canUndo}>Undo</Btn>
              <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign)}</Btn>
              <Btn icon={RefreshCw} small onClick={reset}>New game</Btn>
            </div>
          )}
        </div>
        <div className="side stack-sm">
          {card && (
            <Card className={`result-card ${persona ? (over.winner === "b" ? "win" : over.winner === "w" ? "loss" : "") : ""}`}>
              <div className="bow-row" aria-hidden="true">
                <Avatar name={persona ? profile.name : "B"} tint={profile.tint} size={44} className="bow" />
                <span className="bow-word">rei</span>
                {persona
                  ? <Avatar name={persona.name} tint={persona.tint} size={44} bot className="bow bow-late" />
                  : <div className="avatar duo sm bow bow-late"><User size={15} /></div>}
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
                {persona ? ratingLine(delta) ?? "Rated against a house player." : "Unrated. Thank you both for the game."}
                {over.method === "score" && rec.dead.length > 0 && ` · ${rec.dead.length} dead ${rec.dead.length === 1 ? "stone" : "stones"} removed`}
              </p>
              <div className="row">
                <Btn icon={RefreshCw} small primary onClick={reset}>Rematch</Btn>
                <Btn icon={Download} small onClick={downloadSgf}>SGF</Btn>
              </div>
            </Card>
          )}
          {scoring && preview && (
            <Card inset className="caps">
              <div className="stat-head"><Scale size={15} /><span>Counting</span></div>
              <div><span className="dot dot-b" /> Black {preview.totals.b} <span className="fine-inline">({preview.black.stones} stones + {preview.black.territory} territory)</span></div>
              <div><span className="dot dot-w" /> White {preview.totals.w} <span className="fine-inline">({preview.white.stones} + {preview.white.territory} + {preview.white.komi} komi{preview.white.handicapBonus ? ` + ${preview.white.handicapBonus}` : ""})</span></div>
              <p className="fine">Tap a stone to mark its whole group dead; tap again to revive it. {persona ? `${persona.name} is a bot with no opinion on life and death, so your marking stands.` : "Agree across the table before accepting."}</p>
            </Card>
          )}
          {!over && !scoring && (
            <Card inset className="caps">
              <div><span className="dot dot-b" /> Black captures: {rec.captures.b}</div>
              <div><span className="dot dot-w" /> White captures: {rec.captures.w}</div>
              <div className="fine">{captionText({ komi: rec.komi, rated: !!persona })}{hints ? " · atari hints on" : ""}</div>
            </Card>
          )}
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

      {ceremony && (
        <div className="ceremony" role="dialog" aria-modal="true" aria-label={`Promoted to ${ceremony.label}`}>
          <Card className="ceremony-card">
            <MokuMark state="promoted" sash={ceremony.color} size={96} />
            <p className="eyebrow"><Award size={13} /> Promotion</p>
            <h3 className="result-headline">{ceremony.label}</h3>
            <BeltRibbon belt={ceremony} className="ceremony-belt" />
            <p className="lesson-text">Now {rankOf(profile.rating)}. {hintsForBelt(ceremony) ? "Atari hints stay on for one more belt." : "Atari hints come off from here: you read your own liberties now."}</p>
            <Btn primary onClick={() => setCeremony(null)}>Tie it tight</Btn>
          </Card>
        </div>
      )}
    </div>
  );
}
