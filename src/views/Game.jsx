import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ChevronLeft, Flag, RotateCcw, RefreshCw, Trophy, Timer, CircleDot, Scale, History,
  MessageCircle, Bot, Send, User, Handshake, Check, Download, Undo2, Award, GraduationCap,
} from "lucide-react";
import {
  createGame, play, pass, resign, timeout, undo, markDead, acceptScore, scoreBoard, chainsInAtari, idx,
  lastMoveIndex, aiChooseMoveForRecord, kataChooseMoveForRecord, profileForRank, loadModel, onModelProgress, modelReady,
  toSgf, IllegalMoveError, GLICKO, rateAgainst, detectShapes,
} from "../engine/index.js";
import { Board } from "../components/Board.jsx";
import { ClockFace } from "../components/Clock.jsx";
import { Card, Btn, Pill, Avatar, RankBadge, BeltRibbon } from "../components/ui.jsx";
import { Passage } from "../components/Passage.jsx";
import { Review } from "./Review.jsx";
import { MokuMark } from "../components/Moku.jsx";
import { useMokuFacts } from "../components/mokuStore.js";
import { playStone, playCapture, playBell, haptic } from "../components/sound.js";
import {
  rankOf, preciseRankOf, ratingOfRank, rankWithHandicap, beltOf, beltLabel, hintsFor, hintsForBelt,
  MIN_RATING, MAX_RATING,
} from "../content/rank.js";
import { startDuel, duelOutcome, recordDuel, duelResultText, duelShareText, duelShareUrl } from "../content/duel.js";
import { ShareDuelButton } from "../components/DuelCard.jsx";
import { saveProfile } from "../store/profile.js";
import { saveGame, clearGame } from "../store/gameStore.js";
import { chooseRemark, noteSpoken, PACING } from "../content/commentary.js";
import {
  statusText, refusalText, captionText, resignLabel, resultCard, ratingLine, RESIGN_CONFIRM_MS,
} from "./gameStatus.js";
import { useT } from "../components/langStore.js";
import { useClock } from "./useClock.js";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const MOMENT_MS = 2600;
/** Rendered board width per size: bigger boards get more room; the stone scale never changes. */
const BOARD_PX = { 9: 460, 13: 560, 19: 680 };

/* ----------------------- GAME -----------------------
   A thin adapter over the engine's GameRecord. The only state here is the
   record itself plus UI-only bits (thinking, chat, draft, the current "moment"
   Moku reacts to, and the promotion ceremony). Rules, captures, pass counting,
   dead-stone marking and scoring all come from the record.

   The end of a game is a ceremony, not a toast: two passes open scoring, dead
   stones are tapped off, the count is shown term by term, and both players
   bow. House players have no opinion on life and death and the card says so.

   A daily duel (`mode.kind === "duel"`) is a bot game whose replies are seeded
   by the day: no undo, no rematch, unrated, and starting it spends the day's
   one attempt.

   Rating is Glicko-2 (`src/engine/glicko.js`, the same module the server runs).
   A house player has a deviation at the floor because it is exactly as strong as
   the rank it was asked to play, so all the uncertainty in an update belongs to
   the human - which is what makes a newcomer move fast and a settled player
   move a tenth of a rank at a time. */
const HOUSE_RD = GLICKO.minRd;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function Game({ mode, onExit, profile, setProfile, notify, initial }) {
  const t = useT();
  const duel = mode.kind === "duel" ? mode : null;
  const persona = mode.kind === "bot" || duel ? mode.persona : null;
  /* A master is a house player with a corpus behind it: the loaded masters JSON
     rides on the mode and goes straight to the engine's bot seam. It has no rank
     and no rating, because agreement with a year profile is not a strength and
     Joseki does not put a number on the screen it cannot stand behind. Master games
     are therefore unrated, and the table says so. */
  const master = mode.master ?? null;
  // The rank this game is played at; house players adapt to it. A duel fixes it by the
  // day so everyone meets the same opponent; otherwise it defaults to the player's own.
  const botRank = persona && !master ? (duel ? duel.rank : (mode.rank ?? rankOf(profile.rating))) : null;
  const botRating = botRank !== null ? ratingOfRank(botRank) : null;
  // A new game is set up from the lobby's table: the rules, the board, the handicap,
  // the komi and the clock. A resumed game carries its own, so a rematch is played on
  // the board in front of you even though the saved session only remembers the
  // opponent. Komi falls back to what the board is owed under the chosen rules.
  const [rec, setRec] = useState(() => initial || createGame({
    size: mode.size, handicap: mode.handicap, rules: mode.rules,
    komi: mode.komi, clock: mode.clock ?? null,
  }));
  const table = { size: rec.size, handicap: rec.handicap, rules: rec.rules, komi: rec.komi, clock: rec.clock };
  const [thinking, setThinking] = useState(false);
  const [chat, setChat] = useState(() =>
    persona ? [{ who: "bot", text: pick(persona.chat.greet) }] : []);
  const [draft, setDraft] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const [moment, setMoment] = useState(null);      // "capture" | "captured", expires
  const [delta, setDelta] = useState(null);        // rating change of the finished game
  const [ceremony, setCeremony] = useState(null);  // belt just earned, until dismissed
  const [loading, setLoading] = useState(null);    // {loaded, total} while the network downloads
  const [hostLost, setHostLost] = useState(false); // duel only: the network could not answer
  const [reviewing, setReviewing] = useState(false); // walking back through the finished game
  /* Coaching. The house player names the shapes you make as you make them. It is off
     until you ask for it, and asking is a one-way door: a game the coach has spoken in
     is unrated for the rest of its life, and the switch disables itself so nobody can
     take advice for fifty moves and then turn it off to collect the rating. Duels and
     master games are excluded outright. `spoken` is what the coach has already said,
     so it neither repeats itself nor chatters. */
  const [coaching, setCoaching] = useState(() => !!mode.coaching);
  const [confirmCoach, setConfirmCoach] = useState(false);   // two clicks, like resigning
  const [spoken, setSpoken] = useState(() => mode.spoken ?? {});
  const lastChatterMove = useRef(-99);              // the coach yields to table talk
  const resumed = useRef(false);                   // the resume effect runs once, StrictMode or not
  const alive = useRef(true);
  const chatEndRef = useRef(null);
  const thinkTimer = useRef(null);
  const resignTimer = useRef(null);
  const coachTimer = useRef(null);
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
      clearTimeout(coachTimer.current);
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
    // A master game is not saved: the saved mode remembers an id and a rank, and
    // rebuilding it cannot carry the loaded corpus, so a resume would sit you down
    // opposite a different opponent than the one you left.
    if (rec.phase === "ended" || rec.moves.length === 0 || master) clearGame();
    else saveGame({
      record: rec,
      mode: { kind: mode.kind, personaId: persona ? persona.id : null, rank: botRank, key: duel ? duel.key : null, coaching },
      spoken,
    });
  }, [rec, mode.kind, persona, botRank, duel, master, coaching, spoken]);

  /* The first stone is the attempt: the day is written to the profile as Black's
     first move lands, so a misclick on the card or a reload while the network
     downloads costs nothing, while leaving the table afterwards is not a reroll. */
  const spendAttempt = useCallback(() => {
    if (!duel) return;
    const patch = startDuel(profile, duel.key);
    if (Object.keys(patch).length === 0) return;
    const np = { ...profile, ...patch };
    setProfile(np);
    saveProfile(np);
  }, [duel, profile, setProfile]);

  const say = useCallback((text) => setChat(c => [...c, { who: "bot", text }]), []);

  /* ----- board facts (read-only, from the engine) ----- */
  const myAtari = useMemo(() => rec.phase === "playing" ? chainsInAtari(rec.board, mySide) : [], [rec.board, rec.phase, mySide]);
  const oppAtari = useMemo(() => rec.phase === "playing" ? chainsInAtari(rec.board, mySide === "b" ? "w" : "b") : [], [rec.board, rec.phase, mySide]);
  const hints = hintsFor(profile.rating, profile.rd);
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
      if (duel) {
        const outcome = duelOutcome(next);
        say(pick(outcome.won === null ? persona.chat.reply : outcome.won ? persona.chat.loss : persona.chat.win));
        const np = { ...profile, ...recordDuel(profile, duel.key, outcome) };
        setProfile(np);
        saveProfile(np);
        notify({ icon: outcome.won ? "trophy" : "flag", text: t("game.toast.duel", { result: duelResultText(outcome.code) }) });
      } else if (master) {
        const won = next.result.winner === "b";
        say(pick(won ? persona.chat.loss : persona.chat.win));
        notify({ icon: won ? "trophy" : "flag", text: t("game.toast.unrated", { outcome: t(won ? "game.toast.victory" : "game.toast.defeat") }) });
      } else if (persona && coaching) {
        // The coach spoke in this game, so the game moves no rating. Said plainly,
        // the way a duel and a master game say it.
        const won = next.result.winner === "b";
        say(pick(won ? persona.chat.loss : persona.chat.win));
        notify({ icon: won ? "trophy" : "flag", text: t("game.toast.coached", { outcome: t(won ? "game.toast.victory" : "game.toast.defeat") }) });
      } else if (persona) {
        const won = next.result.winner === "b";
        say(pick(won ? persona.chat.loss : persona.chat.win));
        const oldRank = rankOf(profile.rating), oldBelt = beltOf(profile.rating);
        // One rank per handicap stone: the opponent is rated as the weaker player it gave stones to be.
        const oppRating = ratingOfRank(rankWithHandicap(botRank, next.handicap));
        const rated = rateAgainst(
          { rating: profile.rating, rd: profile.rd, vol: profile.vol },
          { rating: oppRating, rd: HOUSE_RD },
          won ? 1 : 0,
        );
        const rating = clamp(rated.rating, MIN_RATING, MAX_RATING);
        const streak = won ? profile.streak + 1 : 0;
        const np = {
          ...profile, rating, rd: rated.rd, vol: rated.vol,
          wins: profile.wins + (won ? 1 : 0), losses: profile.losses + (won ? 0 : 1),
          streak, bestStreak: Math.max(profile.bestStreak, streak),
        };
        setProfile(np);
        saveProfile(np);
        setDelta({ from: profile.rating, to: rating });
        const newRank = rankOf(rating), newBelt = beltOf(rating);
        if (won && newBelt !== oldBelt) setCeremony(newBelt);
        else if (won && newRank !== oldRank) notify({ icon: "medal", text: t("game.toast.promoted", { rank: newRank }) });
        else notify({ icon: won ? "trophy" : "flag", text: t("game.toast.now", { outcome: t(won ? "game.toast.victory" : "game.toast.defeat"), rank: preciseRankOf(rating) }) });
      }
    }
    return next;
  }, [persona, duel, master, botRank, profile, say, setProfile, notify, sound, coaching, t]);

  /* The clock. Running out of time is a rule, so the flag goes through the engine's
     `timeout` and settles through the same `conclude` a resignation does: a loss on
     time is rated exactly like a loss by resignation. Against a house player only
     the human is timed — see `useClock` for why. */
  const onFlag = useCallback((color) => {
    if (rec.phase === "ended") return;
    setRec(conclude(timeout(rec, color), rec));
  }, [rec, conclude]);
  const clock = useClock({
    preset: rec.clock, rec, timed: persona ? "b" : "bw", onFlag,
  });

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
        /* This `conclude` is the one the bot closed over when it started thinking, so
           it can hold a stale `coaching`. Harmless only because `settle` can end at
           `play` or `pass` and neither reaches "ended" - a second pass opens scoring.
           If the house player ever learns to resign or to lose on time from here, this
           closure has to be refreshed or a coached game could be rated. */
        setRec(conclude(next, r));
      }, wait);
    };
    /* A daily duel must give everyone the same reply: the network is asked at the
       day's fixed rank, told the opponent is that same rank (the human model
       conditions on both), and sampled with a generator seeded by (day, position).
       It never falls back to the heuristic player, because that would be a
       different game under the same result code; if the network cannot answer,
       the table says so and waits. */
    const fallback = () => aiChooseMoveForRecord(r, persona.weights);
    const ask = master
      ? { master, temperature: persona.profile.temperature }
      : duel
        ? { ...profileForRank(duel.rank, persona.profile.temperature), oppRank: duel.rank, seed: duel.seed }
        : { ...profileForRank(botRank, persona.profile.temperature), oppRank: rankOf(profile.rating) };
    const unreachable = () => { if (!alive.current) return; setThinking(false); setHostLost(true); };
    /* A master never falls back to the heuristic player: that player has no book and
       no year, so it would be a different opponent under the same name. If the
       network cannot answer, the table says so and waits, as a duel does. */
    kataChooseMoveForRecord(r, ask)
      .then((res) => { if (res) settle(res.move); else if (duel || master) unreachable(); else settle(fallback()); })
      .catch(() => { if (duel || master) unreachable(); else settle(fallback()); });
  }, [persona, duel, master, botRank, profile.rating, say, conclude, afterMove]);

  // A resumed game, or a fresh handicap game, may be waiting on the house player.
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    if (persona && rec.phase === "playing" && rec.toPlay === "w" && !thinking) botTurn(rec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The coach. Reads the shape the stone just made and, if there is something worth
     saying and the pacing allows it, says it in this house player's own words.

     It speaks into the chat and never into the record. `botTurn(next)` closes over the
     record it is handed and settles from that closure a beat later, so a `setRec` issued
     after it is silently dropped - writing the remark into the game as an SGF comment has
     to wait for the archive, where it can be folded in before the hand-off.

     Only your stones, never the bot's: the coach talks about the shape you made. It also
     yields - to a capture, which is louder, and to table talk, which is a conversation. */
  const coach = useCallback((next, c, r) => {
    if (!coaching || !persona || next.phase !== "playing") return;
    const moveNumber = next.moves.length;
    if (moveNumber - lastChatterMove.current < PACING.minGap) return;
    if (next.lastCaptured.length > 0) return;
    const findings = detectShapes(next.board, { c, r }, { color: "b", captured: next.lastCaptured });
    /* `spoken` is read from the closure and written functionally below. Safe because
       onPlay is a discrete event and the house player waits at least 380ms before its
       reply, so a render always lands between two coached moves. If that ever stopped
       holding, a stale map would repeat the same sentence rather than fall silent. */
    const remark = chooseRemark(findings, { spoken, moveNumber, personaId: persona.id });
    if (!remark) return;
    say(remark.line);
    setSpoken(sp => noteSpoken(sp, remark.shapeId, moveNumber));
  }, [coaching, persona, spoken, say]);

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
        const text = refusalText(e.reason, t);
        if (text) notify({ icon: "info", text });
        return;
      }
      throw e;
    }
    if (rec.moves.length === 0) spendAttempt();
    setRec(next);
    afterMove(next, turn);
    if (persona) {
      if (next.lastCaptured.length >= 2) say(pick(persona.chat.userCapture));
      else coach(next, c, r);
      botTurn(next);
    }
  };

  const onPass = () => {
    if (over || thinking || scoring) return;
    if (persona && turn !== "b") return;
    if (rec.moves.length === 0) spendAttempt();
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

  /* Arming the coach costs the game its rating and cannot be taken back, so it asks
     twice, exactly as resigning does. One click is never enough for a one-way door.
     Refused once the game has stopped being playable: after the last stone there is
     nothing left to coach, and a stray click would only throw away a rating. */
  const canCoach = persona && !duel && !master && !coaching && !over && !scoring;
  const askCoaching = () => {
    if (!canCoach) return;
    if (!confirmCoach) {
      setConfirmCoach(true);
      clearTimeout(coachTimer.current);
      coachTimer.current = setTimeout(() => setConfirmCoach(false), RESIGN_CONFIRM_MS);
      return;
    }
    clearTimeout(coachTimer.current);
    setConfirmCoach(false);
    setCoaching(true);
  };

  const undoDepth = persona ? 2 : 1;
  const canUndo = !over && !thinking && !scoring && !duel && rec.moves.length >= undoDepth;
  const onUndo = () => {
    if (!canUndo) return;
    let r = rec;
    for (let i = 0; i < undoDepth; i++) r = undo(r);
    setRec(r);
  };

  /* P passes, U takes back. Both go through the same handlers the buttons use, so
     every guard on them holds for the keyboard too — a duel still refuses an undo,
     and neither fires while a house player is thinking. Typing in the chat box is
     typing, not a shortcut. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key !== "p" && key !== "u") return;
      e.preventDefault();
      if (key === "p") onPass();
      else onUndo();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

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
    const fresh = createGame(table);
    setRec(fresh);
    if (persona) setChat([{ who: "bot", text: pick(persona.chat.greet) }]);
    // A new game is a new decision: the coach is off again and the table is rated
    // again, so a rematch after a coached game is not silently coached too.
    setCoaching(false);
    setConfirmCoach(false);
    setSpoken({});
    lastChatterMove.current = -99;
    // With a handicap White opens, and White is the house player.
    if (persona && fresh.toPlay === "w") botTurn(fresh);
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
    const line = draft.trim();
    if (!line || !persona) return;
    setChat(c => [...c, { who: "you", text: line }]);
    setDraft("");
    lastChatterMove.current = rec.moves.length;   // the coach waits out a conversation
    setTimeout(() => say(pick(persona.chat.reply)), 700 + Math.random() * 900);
  };

  const status = statusText({ result: over, thinking, personaName: persona ? persona.name : null, turn, phase: rec.phase, loading }, t);
  const card = over ? resultCard(over, t) : null;
  const boardDisabled = !!over || thinking || (!scoring && persona && turn !== "b");

  /* Review takes over the whole view rather than sitting beside the table: the board
     in review is a different board, showing a position that is no longer live, and
     two boards on one screen would invite a click on the wrong one. */
  if (reviewing) {
    return (
      <Review record={rec} profile={profile} onExit={() => setReviewing(false)}
        onRematch={duel ? null : () => { setReviewing(false); reset(); }} />
    );
  }

  return (
    <div className="stack">
      <div className="row spread">
        <Btn icon={ChevronLeft} small onClick={onExit}>{t("game.lobby")}</Btn>
        <div className="vs-strip">
          <div className="vs-side">
            <Avatar name={profile.name} tint={profile.tint} size={34} />
            <div className="vs-meta"><strong>{persona ? profile.name : t("game.side.b")}</strong>{persona && <RankBadge rating={profile.rating} rd={profile.rd} precise size="sm" />}<ClockFace clock={clock} color="b" active={!over && rec.phase === "playing" && turn === "b"} /></div>
          </div>
          <span className="vs-x">vs</span>
          <div className="vs-side">
            {persona
              ? <><div className="vs-meta right"><strong>{persona.name}</strong>{botRating !== null && <RankBadge rating={botRating} size="sm" />}<ClockFace clock={clock} color="w" timed={false} align="right" /></div><Avatar name={persona.name} tint={persona.tint} size={34} bot /></>
              : <><div className="vs-meta right"><strong>{t("game.side.w")}</strong><ClockFace clock={clock} color="w" active={!over && rec.phase === "playing" && turn === "w"} align="right" /></div><div className="avatar duo sm"><User size={15} /></div></>}
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
            sizePx={BOARD_PX[rec.size]}
            disabled={boardDisabled}
            atari={atariIdx}
            captured={rec.lastCaptured || []} captureKey={rec.moves.length}
            territory={preview ? preview.territory : null} dead={rec.dead}
            coordinates={profile.coordinates} mark={profile.lastMoveMark} />
          {scoring ? (
            <div className="row">
              <Btn icon={Check} small primary onClick={onAccept}>{t("game.accept")}</Btn>
              <Btn icon={Undo2} small onClick={onResumePlay}>{t("game.keepPlaying")}</Btn>
              <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign, t)}</Btn>
            </div>
          ) : (
            <div className="row">
              <Btn icon={Flag} small onClick={onPass} disabled={!!over}>{t("game.pass")}</Btn>
              <Btn icon={RotateCcw} small onClick={onUndo} disabled={!canUndo}>{t("game.undo")}</Btn>
              <Btn icon={Handshake} small onClick={onResign} disabled={!canResign}>{resignLabel(confirmResign, t)}</Btn>
              {!duel && <Btn icon={RefreshCw} small onClick={reset}>{t("game.newGame")}</Btn>}
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
                    <div key={r.color} className={`result-row ${r.winner ? "winner" : ""}`}>
                      <span className={`dot dot-${r.color}`} />
                      <span className="result-side">{r.side}</span>
                      <span className="result-detail">{r.detail}</span>
                      <span className="result-total">{r.total}</span>
                    </div>
                  ))}
                </div>
              )}
              <Passage context={resultKind || "any"} size="sm" />
              <p className="fine">
                {duel ? t("game.noteDuel")
                  : master ? t("game.noteMaster")
                    : persona && coaching ? t("game.noteCoached")
                      : persona ? ratingLine(delta, t) ?? t("game.noteRated") : t("game.noteLocal")}
                {over.method === "score" && rec.dead.length > 0 && t("game.deadRemoved", { count: rec.dead.length })}
              </p>
              <div className="row">
                {duel
                  ? <ShareDuelButton small text={duelShareText({ key: duel.key, personaName: persona.name, code: duelOutcome(rec).code, moves: duelOutcome(rec).moves, url: duelShareUrl(window.location) })} />
                  : <Btn icon={RefreshCw} small primary onClick={reset}>{t("game.rematch")}</Btn>}
                <Btn icon={History} small onClick={() => setReviewing(true)}>{t("game.review")}</Btn>
                <Btn icon={Download} small onClick={downloadSgf}>{t("game.sgf")}</Btn>
                {duel && <Btn icon={ChevronLeft} small onClick={onExit}>{t("game.lobby")}</Btn>}
              </div>
            </Card>
          )}
          {duel && hostLost && !over && (
            <Card inset className="caps">
              <div className="stat-head"><Bot size={15} /><span>{t("game.hostLost.head")}</span></div>
              <p className="fine">{t("game.hostLost.body", { name: persona.name })}</p>
              <div className="row"><Btn small primary icon={RefreshCw} onClick={() => { setHostLost(false); botTurn(rec); }}>{t("game.hostLost.again")}</Btn></div>
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
              <p className="fine">{t("game.counting.tap")} {persona ? t("game.counting.botStands", { name: persona.name }) : t("game.counting.agree")}</p>
            </Card>
          )}
          {!over && !scoring && (
            <Card inset className="caps">
              <div><span className="dot dot-b" /> {t("game.captures.b", { n: rec.captures.b })}</div>
              <div><span className="dot dot-w" /> {t("game.captures.w", { n: rec.captures.w })}</div>
              <div className="fine">{captionText({ size: rec.size, komi: rec.komi, handicap: rec.handicap, rules: rec.rules, rated: !!persona && !duel && !master && !coaching, duel: !!duel }, t)}{hints ? t("game.hintsOn") : ""}{!over ? t("game.keys") : ""}</div>
            </Card>
          )}
          {persona ? (
            <Card className="chat-card">
              <div className="chat-head">
                <MessageCircle size={15} /><span>{t("game.chat.head")}</span>
                {!duel && !master && (
                  <button
                    type="button"
                    className={`coach-toggle${coaching ? " on" : ""}${confirmCoach ? " asking" : ""}`}
                    onClick={askCoaching}
                    aria-disabled={!canCoach}
                    aria-pressed={coaching}
                    title={t(coaching ? "game.chat.coachOnTitle" : "game.chat.coachOffTitle")}
                  >
                    <GraduationCap size={11} />
                    {t(coaching ? "game.chat.coachOn" : confirmCoach ? "game.chat.coachAsk" : "game.chat.coachOff")}
                  </button>
                )}
                <span className="bot-chip"><Bot size={11} /> {t(duel ? "game.chat.todayHost" : "game.chat.housePlayer")}</span>
              </div>
              <div className="chat-log" aria-live="polite">
                {chat.map((m, i) => (
                  <div key={i} className={`bubble ${m.who === "you" ? "mine" : ""}`}>{m.text}</div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-row">
                <input
                  className="chat-input" value={draft} placeholder={t("game.chat.placeholder")}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  aria-label={t("game.chat.label")}
                />
                <button className="chat-send" onClick={sendChat} aria-label={t("game.chat.send")}><Send size={15} /></button>
              </div>
            </Card>
          ) : (
            <Card inset>
              <p className="fine">{t("game.local")}</p>
            </Card>
          )}
        </div>
      </div>

      {ceremony && (
        <div className="ceremony" role="dialog" aria-modal="true" aria-label={t("game.ceremony.label", { belt: beltLabel(ceremony, t) })}>
          <Card className="ceremony-card">
            <MokuMark state="promoted" sash={ceremony.color} size={120} />
            <p className="eyebrow"><Award size={13} /> {t("game.ceremony.head")}</p>
            <h3 className="result-headline">{beltLabel(ceremony, t)}</h3>
            <BeltRibbon belt={ceremony} className="ceremony-belt" />
            <p className="lesson-text">{t("game.ceremony.now", { rank: preciseRankOf(profile.rating) })} {hintsFor(profile.rating, profile.rd) ? t(hintsForBelt(ceremony) ? "game.ceremony.hintsBelt" : "game.ceremony.hintsSettling") : t("game.ceremony.hintsOff")}</p>
            <Btn primary onClick={() => setCeremony(null)}>{t("game.ceremony.tie")}</Btn>
          </Card>
        </div>
      )}
    </div>
  );
}
