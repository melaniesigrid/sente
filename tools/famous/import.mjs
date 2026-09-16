#!/usr/bin/env node
/* ----------------------- FAMOUS GAMES: RECORD IMPORT -----------------------
   Turns a directory of SGF files into `src/content/famous/records.js`: the moves of
   each game and nothing else.

     node tools/famous/import.mjs --in <dir-of-sgf> --out src/content/famous/records.js

   Three things this tool is careful about, each of them a house rule rather than a
   convenience:

   1. **It keeps the moves and drops the words.** A game record is a fact and carries no
      rights; the commentary published alongside one is somebody's writing and is in
      copyright. Several of the files this was first run against ship a professional's
      match commentary inside `C[]`. Not one character of it is written out. Every word
      of analysis in Joseki is Joseki's own, and the only way to keep that true under a
      generator is for the generator to be unable to carry the other kind.

      The one exception is narrow and is not commentary: a pair go record whose comments
      say *which of the four players placed the stone*. That is a fact about the game,
      the same kind of fact as the date, so `--seats` extracts it as a list of names and
      refuses anything that is not one.

   2. **It replays every move through the rules** before writing anything. A record that
      does not stand up is a bug here, in the dark, rather than a screen that breaks in
      somebody's hand.

   3. **It writes points, not prose.** The output is a compact string of two-character
      SGF points, decoded by `movesOf` in `src/content/famous/index.js`. Colours
      alternate from the first move and the importer refuses a record where they do not,
      so the colour of a move is its position and does not have to be stored.

   The words -- what happened, who said what, what a move was for -- live in
   `src/content/famous/<id>.js` and are written by hand. This file's output is data:
   do not edit it. */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { parseSgf, recordFromSgf, pointToSgf } from "../../src/engine/index.js";

const arg = (name, dflt = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? dflt : process.argv[i + 1];
};
const has = (name) => process.argv.includes(`--${name}`);

/* Two of the Wuzhen records in the wild open `(EV[...]` instead of `(;EV[...]`: the
   root node's semicolon is missing. The parser is strict on purpose and stays that
   way -- a malformed file a player opens should say so -- so the repair happens here,
   named, once, and only for that exact shape. */
export function repairRoot(text) {
  return text.replace(/^﻿?\s*\(\s*(?!;)/, "(;");
}

/** A move's colour is its position in the list. Refuse anything that is not. */
export function alternates(moves) {
  if (!moves.length) return false;
  let expect = moves[0].color;
  for (const m of moves) {
    if (m.color !== expect) return false;
    expect = expect === "b" ? "w" : "b";
  }
  return true;
}

/** The moves as one string of two-character SGF points. A pass is "..", which is not
    a point and so cannot collide with one. */
export function packMoves(moves) {
  return moves.map(m => (m.pass ? ".." : pointToSgf(m.c, m.r))).join("");
}

/* A pair go record's comments name the player who placed the stone. Anything longer or
   stranger than that is commentary and is dropped with a warning, never guessed at. */
const SEAT_RE = /^This move by (?:black|white) is played by (.+?)\.?$/i;

export function seatOf(comment) {
  if (!comment) return null;
  const m = SEAT_RE.exec(comment.trim());
  return m ? m[1].trim() : null;
}

export function seatsOf(moves, id) {
  const names = [];
  for (let i = 0; i < moves.length; i++) {
    const who = seatOf(moves[i].comment);
    if (!who) {
      console.warn(`${id}: move ${i + 1} carries a comment that is not a seat; dropped`);
      return null;
    }
    names.push(who);
  }
  const roster = [...new Set(names)].sort();
  return { roster, seats: names.map(n => roster.indexOf(n)) };
}

export function readGame(text, id, { seats = false } = {}) {
  const sgf = repairRoot(text);
  const g = parseSgf(sgf);
  if (g.size !== 19) throw new Error(`${id}: board is ${g.size}x${g.size}, not 19x19`);
  if (g.handicap || g.setup.b.length || g.setup.w.length) throw new Error(`${id}: record has setup stones`);
  if (!alternates(g.moves)) throw new Error(`${id}: colours do not alternate`);
  recordFromSgf(sgf); // every move through the rules, or this throws
  const out = { id, komi: g.komi, rules: g.rules, moves: packMoves(g.moves), count: g.moves.length };
  if (seats) {
    const s = seatsOf(g.moves, id);
    if (!s) throw new Error(`${id}: --seats asked for, but the comments are not seats`);
    out.roster = s.roster;
    out.seats = s.seats;
  }
  return out;
}

/* ---------------------------------------------------------------- writing out */

const wrap = (s, width, indent) => {
  const lines = [];
  for (let i = 0; i < s.length; i += width) lines.push(indent + JSON.stringify(s.slice(i, i + width)));
  return lines.join(" +\n");
};

export function render(games) {
  const head = `/* ----------------------- FAMOUS GAMES: THE RECORDS -----------------------
   Generated by tools/famous/import.mjs. Do not edit.

   Moves only. A game record is a fact and carries no rights; the commentary that
   was published beside these games is somebody's writing and is in copyright, so
   none of it is here and none of it is anywhere else in Joseki. What Joseki says
   about these games it says in its own words, in src/content/famous/<id>.js.

   \`moves\` is one string of two-character SGF points, black first and alternating;
   ".." is a pass. \`movesOf\` in ./index.js turns it back into points. */

export const RECORDS = {\n`;
  const body = games.map(g => {
    const seats = g.seats
      ? `,\n    roster: ${JSON.stringify(g.roster)},\n    seats: ${JSON.stringify(g.seats)}`
      : "";
    return `  "${g.id}": {\n    komi: ${g.komi}, rules: ${JSON.stringify(g.rules)}, count: ${g.count},\n` +
      `    moves:\n${wrap(g.moves, 76, "      ")}${seats},\n  },`;
  }).join("\n");
  return `${head}${body}\n};\n`;
}

/* ---------------------------------------------------------------- the run */

/** `<dir>/<name>.sgf` becomes the id `<name>`, so the names on disk are the ids. */
function gather(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) { out.push(...gather(p)); continue; }
    if (entry.toLowerCase().endsWith(".sgf")) out.push(p);
  }
  return out;
}

function main() {
  const dir = arg("in");
  const out = arg("out");
  if (!dir || !out) {
    console.error("usage: node tools/famous/import.mjs --in <dir> --out <file> [--seats <id,id>]");
    process.exit(2);
  }
  const seatIds = new Set((arg("seats", "") || "").split(",").filter(Boolean));
  const games = [];
  for (const file of gather(dir)) {
    const id = basename(file, ".sgf");
    const g = readGame(readFileSync(file, "utf8"), id, { seats: seatIds.has(id) });
    games.push(g);
    console.log(`${id}: ${g.count} moves${g.seats ? `, ${g.roster.length} seats` : ""}`);
  }
  if (!games.length) { console.error("no SGF files found"); process.exit(1); }
  const text = render(games);
  if (has("dry-run")) { console.log(text); return; }
  writeFileSync(out, text);
  console.log(`\nwrote ${out}: ${games.length} games, ${games.reduce((n, g) => n + g.count, 0)} moves`);
}

if (process.argv[1] && process.argv[1].endsWith("import.mjs")) main();
