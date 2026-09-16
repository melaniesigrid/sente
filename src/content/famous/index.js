/* ----------------------- THE FAMOUS GAMES -----------------------
   Fifteen games that changed what people thought the game was, and what Joseki has
   to say about them. Three matches: AlphaGo against Fan Hui in London in October
   2015, against Lee Sedol in Seoul in March 2016, and the Future of Go Summit at
   Wuzhen in May 2017.

   Two rules hold this shelf up, and both of them are older than this file.

   **The records are facts and the words are ours.** A game record carries no rights
   and never has; the credits say so out loud, and these fifteen are as public as the
   moves of any game ever played. The commentary published alongside them is a
   different thing: it is somebody's writing, it is in copyright, and not a sentence
   of it is reproduced here. Some of the SGF files these records were read from ship a
   professional's match commentary inside them. `tools/famous/import.mjs` cannot carry
   it -- it writes points and nothing else -- and every word on this shelf was written
   for it. Where a player said something in public about their own game, they are
   quoted briefly and by name, with the day they said it, which is quotation and not
   reproduction.

   **The engine says what is on the board.** A note may say what a move was for and
   what people made of it. It may not invent a variation nobody played or a score
   nobody counted: the margins, the move counts and the resignations here are the
   ones in the record, and the record is replayed through the rules before any of it
   reaches a screen. Where the verdict is a matter of opinion the note says whose.

   The prose is English and is not translated, for the reason the journal gives: a
   note is somebody's writing rather than a label, and a machine's version of it would
   be worse than an honest English one. The chrome around it is translated the
   ordinary way, and the screen says which is which.

   One file per game under this directory holds the words; `records.js` beside them
   holds the moves and is generated. */

import { createGame, play, withMoveComment, resign, pointFromSgf } from "../../engine/index.js";
import { RECORDS } from "./records.js";

import { FAN_HUI_1 } from "./fan-hui-1.js";
import { FAN_HUI_2 } from "./fan-hui-2.js";
import { FAN_HUI_3 } from "./fan-hui-3.js";
import { FAN_HUI_4 } from "./fan-hui-4.js";
import { FAN_HUI_5 } from "./fan-hui-5.js";
import { LEE_SEDOL_1 } from "./lee-sedol-1.js";
import { LEE_SEDOL_2 } from "./lee-sedol-2.js";
import { LEE_SEDOL_3 } from "./lee-sedol-3.js";
import { LEE_SEDOL_4 } from "./lee-sedol-4.js";
import { LEE_SEDOL_5 } from "./lee-sedol-5.js";
import { KE_JIE_1 } from "./ke-jie-1.js";
import { KE_JIE_2 } from "./ke-jie-2.js";
import { KE_JIE_3 } from "./ke-jie-3.js";
import { WUZHEN_PAIR } from "./wuzhen-pair.js";
import { WUZHEN_TEAM } from "./wuzhen-team.js";

/* ---------------------------------------------------------------- the matches */

/** The three occasions. `games` is the order they are shown in, which is the order
    they were played in. A match's `lede` is the one sentence a reader gets before
    they decide whether to open it. */
export const MATCHES = [
  {
    id: "fan-hui",
    title: "AlphaGo and Fan Hui",
    where: "London",
    when: "5-9 October 2015",
    score: "AlphaGo 5-0",
    lede: "The first time a program beat a professional on an even 19x19 board. It was played behind a closed door and nobody outside the building knew for three months.",
    story: [
      "Fan Hui was the European champion, a 2 dan professional who had left China for France and had spent more of his life teaching the game than competing at it. In October 2015 he was invited to DeepMind's office in London to play five formal games against a program, one an afternoon, an hour each on the clock with three thirty-second periods after it.",
      "He lost all five. He also played five informal games at a faster clock and lost three of those, which is the closer number and the one that is usually left out. The match was kept quiet until 27 January 2016, when it was published in Nature with the algorithm that produced it, and the go world found out about a result that was already three months old.",
      "The games themselves are the least dramatic of the three matches here, and they are the most useful. This is the first version, the one that would be three stones weaker than the machine Ke Jie faced eighteen months later. It wins, but you can see it working.",
    ],
    games: ["fan-hui-1", "fan-hui-2", "fan-hui-3", "fan-hui-4", "fan-hui-5"],
  },
  {
    id: "lee-sedol",
    title: "AlphaGo and Lee Sedol",
    where: "Seoul",
    when: "9-15 March 2016",
    score: "AlphaGo 4-1",
    lede: "Five games at the Four Seasons in Seoul, watched by something like two hundred million people. One of them is the last game a human being has won against a top program under match conditions.",
    story: [
      "Lee Sedol had eighteen world titles and a reputation for finding moves nobody else would look at. He said before the match that he expected to win five-nil, or four-one at worst, and almost every professional asked agreed with him.",
      "He lost the first three. He won the fourth with a move that the professionals watching called divine, and lost the fifth. The prize of one million US dollars went to charity; Lee took one hundred and seventy thousand for turning up and for the game he won.",
      "Two moves out of the nine hundred and thirty-three played that week are remembered by number. Both of them are in this shelf, and both of them are moves a strong player would have called a mistake on sight.",
    ],
    games: ["lee-sedol-1", "lee-sedol-2", "lee-sedol-3", "lee-sedol-4", "lee-sedol-5"],
  },
  {
    id: "wuzhen",
    title: "The Future of Go Summit",
    where: "Wuzhen",
    when: "23-27 May 2017",
    score: "AlphaGo 3-0, and two games of its own kind",
    lede: "Ke Jie, the strongest player alive, against a machine three stones stronger than the one that beat Lee Sedol. Then two games that were not a contest at all.",
    story: [
      "By May 2017 the argument was over and everybody knew it. The interesting question at Wuzhen was not whether Ke Jie would lose but what the games would look like, and what a player at the very top of the human game would say afterwards.",
      "He lost three, the first of them by half a point after three hundred moves of the best go he had in him. In between the second and third games came the two events that are the reason this match is worth keeping: a pair go, two professionals each partnered with a copy of the machine and taking turns, and a game in which five of China's strongest played as one team against it.",
      "It was the last match AlphaGo played. It was retired from competition the week it ended.",
    ],
    games: ["ke-jie-1", "ke-jie-2", "wuzhen-pair", "wuzhen-team", "ke-jie-3"],
  },
];

/* ---------------------------------------------------------------- the games */

const STUDIES = [
  FAN_HUI_1, FAN_HUI_2, FAN_HUI_3, FAN_HUI_4, FAN_HUI_5,
  LEE_SEDOL_1, LEE_SEDOL_2, LEE_SEDOL_3, LEE_SEDOL_4, LEE_SEDOL_5,
  KE_JIE_1, KE_JIE_2, KE_JIE_3, WUZHEN_PAIR, WUZHEN_TEAM,
];

/** Every game on the shelf, keyed by id. */
export const GAMES = Object.fromEntries(STUDIES.map(g => [g.id, g]));

export const gameById = (id) => GAMES[id] ?? null;
export const matchById = (id) => MATCHES.find(m => m.id === id) ?? null;
export const matchOf = (game) => (game ? matchById(game.match) : null);

/** The games of a match, in playing order, skipping any that is not on the shelf. */
export const gamesOf = (match) => (match ? match.games.map(gameById).filter(Boolean) : []);

/* ---------------------------------------------------------------- the moves */

/** The packed record back into points. `null` is a pass. */
export function movesOf(id) {
  const rec = RECORDS[id];
  if (!rec) return [];
  const out = [];
  for (let i = 0; i < rec.moves.length; i += 2) {
    const s = rec.moves.slice(i, i + 2);
    out.push(s === ".." ? null : pointFromSgf(s, 19));
  }
  return out;
}

/** Which of the four players placed move `n`, in a game where that is recorded.
    Pair go and nothing else; `null` everywhere it is not a fact we hold. The record
    keeps the names exactly as the file spelled them and the game's `seatNames` maps
    them to how they are written: the data is not edited to make it read better. */
export function seatAt(id, n) {
  const rec = RECORDS[id];
  if (!rec || !rec.seats || n < 1 || n > rec.seats.length) return null;
  const raw = rec.roster[rec.seats[n - 1]];
  if (raw === undefined) return null;
  const names = (gameById(id) || {}).seatNames || {};
  return names[raw] ?? raw;
}

/** Does this game know who placed each stone? Pair go does; nothing else does. */
export const hasSeats = (id) => Boolean(RECORDS[id] && RECORDS[id].seats);

/** The whole game as a record the review room can walk, with each note already
    attached to the move it belongs to. The moves are replayed through the rules,
    so anything wrong here throws at the first bad move rather than drawing it. */
export function recordFor(id) {
  const game = gameById(id);
  const packed = RECORDS[id];
  if (!game || !packed) return null;
  let rec = createGame({
    size: 19, rules: packed.rules, komi: packed.komi, handicap: 0,
    toPlay: "b", players: { b: game.black, w: game.white },
  });
  if (game.opening) rec = { ...rec, comment: game.opening };
  const moves = movesOf(id);
  moves.forEach((pt, i) => {
    rec = play(rec, pt[0], pt[1], i % 2 === 0 ? "b" : "w");
    const note = game.notes[i + 1];
    if (note) rec = withMoveComment(rec, note);
  });
  /* The result is the one the match recorded, which the moves alone cannot always
     give: a game counted out on the board ends with neither a resignation nor two
     passes in the file. A resignation is played, so the record ends the way it did. */
  if (game.result.method === "resign") {
    rec = resign(rec, game.result.winner === "b" ? "w" : "b");
  } else {
    rec = { ...rec, phase: "ended", result: { ...game.result, score: null } };
  }
  return rec;
}

/* ---------------------------------------------------------------- the words */

/** The chapter a move falls in: the last phase that starts at or before it. Move 0 is
    the empty board, which belongs to the first chapter the way a title page does. */
export function phaseAt(game, n) {
  if (!game || !game.phases.length) return null;
  let found = game.phases[0];
  for (const p of game.phases) { if (p.from <= Math.max(n, 1)) found = p; }
  return found;
}

/** The note written for this exact move, or null. */
export const noteAt = (game, n) => (game && n >= 1 ? game.notes[n] ?? null : null);

/** Every game on the shelf in playing order, across all three matches. */
export const ALL_GAMES = MATCHES.flatMap(m => gamesOf(m));

/** How many moves carry a note of their own, which is what the shelf claims. */
export const notedMoves = (game) => (game ? Object.keys(game.notes).length : 0);
