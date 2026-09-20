#!/usr/bin/env node
/* ----------------------- FAMOUS GAMES: THE FACTS OF A MOVE -----------------------
   What is actually true on the board at a given move of a given game, so a note
   written beside it can be checked rather than believed.

     node tools/famous/facts.mjs --game lee-sedol-2 --move 37
     node tools/famous/facts.mjs --game fan-hui-3 --notes      # every annotated move
     node tools/famous/facts.mjs --game fan-hui-3 --thin 14    # only the short notes

   It replays the real record and reports, for each move asked about: the point, the
   colour, what it captured, what it put in atari, what it saved from atari, whether
   it connected or cut, how near it is to the last move and to the nearest friendly
   and enemy stone, and the running capture count. Nothing here is an opinion. It
   exists so that "this threatens the corner" is a claim somebody checked.

   Not part of the suite: it is a writing aid, and the writing it aids is checked by
   `famous.test.js` on the way in. */

import { recordFor, gameById } from "../../src/content/famous/index.js";
import { replay } from "../../src/engine/record.js";
import { playedMoves } from "../../src/engine/review.js";
import { pointLabel, chainAt, idx, inB, NBRS } from "../../src/engine/board.js";

const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const has = (n) => process.argv.includes(`--${n}`);

const at = (board, c, r) => (inB(board.size, c, r) ? board.cells[idx(board.size, c, r)] : null);
const libs = (board, c, r) => {
  const ch = chainAt(board, c, r);
  return ch ? ch.libs.size : null;
};
const dist = (a, b) => (a && b ? Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) : null);

/** The nearest stone of a colour, and how far. Distance is in board steps. */
function nearest(board, c, r, color) {
  let best = null;
  for (let i = 0; i < board.cells.length; i++) {
    if (board.cells[i] !== color) continue;
    const cc = i % board.size, rr = Math.floor(i / board.size);
    if (cc === c && rr === r) continue;
    const d = Math.max(Math.abs(cc - c), Math.abs(rr - r));
    if (!best || d < best.d) best = { d, c: cc, r: rr };
  }
  return best;
}

/** Which chains of `color` stand in atari on this board. */
function atariChains(board, color) {
  const seen = new Set(), out = [];
  for (let i = 0; i < board.cells.length; i++) {
    if (board.cells[i] !== color || seen.has(i)) continue;
    const c = i % board.size, r = Math.floor(i / board.size);
    const ch = chainAt(board, c, r);
    ch.stones.forEach(([x, y]) => seen.add(idx(board.size, x, y)));
    if (ch.libs.size === 1) out.push({ size: ch.stones.length, at: pointLabel(board.size, c, r) });
  }
  return out;
}

function factsFor(id, ns) {
  const rec = recordFor(id);
  if (!rec) { console.error(`no record for ${id}`); process.exit(1); }
  const game = gameById(id);
  const moves = playedMoves(rec);
  const size = rec.size;
  const out = [];
  for (const n of ns) {
    if (n < 1 || n > moves.length) continue;
    const beforeRec = replay(rec, moves.slice(0, n - 1));
    const afterRec = replay(rec, moves.slice(0, n));
    const before = beforeRec.board, after = afterRec.board;
    const mv = moves[n - 1];
    if (mv.type !== "play") { out.push({ n, pass: true }); continue; }
    const me = mv.color, you = me === "b" ? "w" : "b";
    const took = (afterRec.captures.b + afterRec.captures.w) - (beforeRec.captures.b + beforeRec.captures.w);
    const prev = n > 1 && moves[n - 2].type === "play" ? [moves[n - 2].c, moves[n - 2].r] : null;

    const gaveAtari = atariChains(after, you).filter(a =>
      !atariChains(before, you).some(b => b.at === a.at));
    const wasInAtari = atariChains(before, me).length;
    const nowInAtari = atariChains(after, me).length;
    const myNear = nearest(before, mv.c, mv.r, me);
    const yourNear = nearest(before, mv.c, mv.r, you);
    const touching = NBRS.map(([dc, dr]) => at(before, mv.c + dc, mv.r + dr));

    out.push({
      n, point: pointLabel(size, mv.c, mv.r), colour: me === "b" ? "Black" : "White",
      captured: took,
      liberties: libs(after, mv.c, mv.r),
      chainSize: chainAt(after, mv.c, mv.r).stones.length,
      putInAtari: gaveAtari,
      ownGroupsInAtariBefore: wasInAtari, ownGroupsInAtariAfter: nowInAtari,
      touchesOwn: touching.filter(x => x === me).length,
      touchesEnemy: touching.filter(x => x === you).length,
      fromLastMove: prev ? dist([mv.c, mv.r], prev) : null,
      nearestOwn: myNear ? `${pointLabel(size, myNear.c, myNear.r)} (${myNear.d})` : null,
      nearestEnemy: yourNear ? `${pointLabel(size, yourNear.c, yourNear.r)} (${yourNear.d})` : null,
      runningCaptures: `B${afterRec.captures.b}/W${afterRec.captures.w}`,
      note: game.notes[n] ?? null,
    });
  }
  return out;
}

const id = arg("game");
if (!id) { console.error("usage: --game <id> [--move N | --notes | --thin N]"); process.exit(2); }
const game = gameById(id);
let ns;
if (arg("move")) ns = [Number(arg("move"))];
else if (has("thin")) {
  const lim = Number(arg("thin", "14"));
  ns = Object.keys(game.notes).map(Number)
    .filter(n => game.notes[n].split(/\s+/).filter(Boolean).length < lim);
} else if (has("notes")) ns = Object.keys(game.notes).map(Number);
else ns = [1];

for (const f of factsFor(id, ns.sort((a, b) => a - b))) {
  if (f.pass) { console.log(`${f.n}: pass`); continue; }
  const bits = [
    `${f.colour} ${f.point}`,
    `libs ${f.liberties}`, `chain ${f.chainSize}`,
    f.captured ? `CAPTURED ${f.captured}` : null,
    f.putInAtari.length ? `ATARI on ${f.putInAtari.map(a => `${a.at}(${a.size})`).join(",")}` : null,
    f.ownGroupsInAtariBefore > f.ownGroupsInAtariAfter ? `saved own group` : null,
    f.touchesEnemy ? `touches ${f.touchesEnemy} enemy` : null,
    f.touchesOwn ? `touches ${f.touchesOwn} own` : null,
    f.fromLastMove !== null ? `${f.fromLastMove} from last move` : null,
    `near own ${f.nearestOwn}`, `near enemy ${f.nearestEnemy}`,
    `caps ${f.runningCaptures}`,
  ].filter(Boolean);
  console.log(`\n#${f.n}  ${bits.join(" | ")}`);
  if (f.note) console.log(`   note: ${f.note}`);
}
