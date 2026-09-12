/* ----------------------- TABLE TALK (pure) -----------------------
   What a chat line at a go board is made of, free of React so it can be
   unit-tested.

   Two things happen here and nothing else. A message is split into the words
   and the points it names, so "the cut at D4 was the whole game" can light D4
   on the board instead of asking the reader to find it. And the etiquette a
   game opens and closes with is offered as a tap, because the phrases are
   fixed, everybody says them, and somebody playing in their second language
   should not have to spell them to be polite.

   Neither is a rule, so neither is in the engine. Reading a coordinate is,
   which is why `parsePoint` lives there and this file only calls it. */
import { parsePoint, pointLabel } from "../engine/index.js";

/* A candidate coordinate: a letter and one or two digits, standing alone as a
   word. The boundaries are what keep "3D" and "mod42" out; whether the token
   is really a point on this board is `parsePoint`'s answer, not this one's. */
const TOKEN = /(?<![A-Za-z0-9])([A-Za-z]\d{1,2})(?![A-Za-z0-9])/g;

/** A chat message as parts: `{ t: "text", s }` and `{ t: "point", s, c, r }`.
  *
  * Every part's `s` concatenates back to the original message exactly, so the
  * reader sees what was typed and never a tidied version of it. A point part
  * carries the coordinates the caller needs to mark the board; its `s` is still
  * the player's own spelling, so somebody who typed "d4" reads back "d4". */
export function talkParts(text, size) {
  const s = typeof text === "string" ? text : "";
  const parts = [];
  let at = 0;
  TOKEN.lastIndex = 0;
  for (let m = TOKEN.exec(s); m; m = TOKEN.exec(s)) {
    const pt = parsePoint(size, m[1]);
    if (!pt) continue;
    if (m.index > at) parts.push({ t: "text", s: s.slice(at, m.index) });
    parts.push({ t: "point", s: m[1], c: pt.c, r: pt.r });
    at = m.index + m[1].length;
  }
  if (at < s.length) parts.push({ t: "text", s: s.slice(at) });
  return parts;
}

/** Every distinct point a message names, in the order it names them. The board
  * marks all of them, so a line that compares two points shows both. */
export function pointsNamed(text, size) {
  const seen = new Set();
  const out = [];
  for (const p of talkParts(text, size)) {
    if (p.t !== "point") continue;
    const key = `${p.c},${p.r}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ c: p.c, r: p.r, label: pointLabel(size, p.c, p.r) });
  }
  return out;
}

/* The lines a game is bracketed by. They are phrased plainly because most of
   the people reading them do not speak Japanese, and the traditional pair is
   offered beside the plain one rather than instead of it: a player who wants
   to open the game the way it is opened at a club can, and a player who has
   never heard the word is not asked to guess at it.

   No line is an opinion about a move. "Nice move" belongs to whoever means it
   and can type it; a button that says it for you makes the compliment worth
   nothing. */
const OPENING = [
  { text: "Have a good game", note: "the usual opening" },
  { text: "Onegaishimasu", note: "please, let us play" },
];
const CLOSING = [
  { text: "Thank you for the game", note: "the usual closing" },
  { text: "Arigatou gozaimashita", note: "thank you very much" },
];
const COUNTING = [
  { text: "Shall we count?", note: "" },
  { text: "That marking looks right to me", note: "" },
];

/** The etiquette offered at this moment, already filtered by what this player
  * has said in this room.
  *
  * `phase` is the record's, `moves` its move count, `said` the texts this
  * browser has already sent here. A line drops off the row once you have used
  * it: the row is for the thing that is said once, and a button that can be
  * pressed twenty times is a button for flooding somebody. Spectators get no
  * row at all, because the greeting is between the players. */
export function etiquette({ phase, moves = 0, seated = true, said = [] } = {}) {
  if (!seated) return [];
  const pool = phase === "ended" ? CLOSING
    : phase === "scoring" ? COUNTING
    : moves <= 2 ? OPENING
    : [];
  const already = new Set(said);
  return pool.filter((line) => !already.has(line.text));
}
