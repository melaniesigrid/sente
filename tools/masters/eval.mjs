#!/usr/bin/env node
/* ----------------------- MASTERS: OFFLINE EVAL -----------------------
   Scores, per master and per split, how often each arm picks the master's own move:

     a  the year profile alone: the network's best legal move
     b  the year profile plus his opening book (book hit overrides; else arm a)
     c  plus the style prior: PR 2; reported as null until it exists

   Agreement is judged on canonical moves: on a symmetric position a mirror-image
   reply counts as the same move, so the empty board's 3-4 openings agree whichever
   corner each side chose.

   Alongside top-1 agreement (all moves, moves 1 to 30, moves 31 on) it reports the
   style distance of each arm's choices from the master's own choices on the same
   positions, and the cross-master control: the other master's book on these positions.
   If the control moves the number as much as the master's own book, the book measures
   the era, not the man, and the card must not claim otherwise.

   Inputs: tools/masters/data/<id>.json (build.mjs), tools/masters/data/<id>.logits.jsonl
   (dump_logits.py), public/masters/<id>.json. Output: public/masters/eval.json, and
   `style.baseline` written into each master's JSON (the network's choices measured on
   the per-move axes, which the prior needs). Before scoring, every position's dumped
   logits are checked to cover the sampler's keep set; a gap is a failure, not a skip.

     node tools/masters/eval.mjs               # every master with a logit dump
     node tools/masters/eval.mjs shusaku       # one master */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createGame, play, legalMoves, canonical, canonicalMove, bookKey, fromCanonical,
  moveFeatures, meanStyle, styleDistance, MODEL_FILE,
} from "../../src/engine/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const DATA = join(here, "data");
const PUBLIC = join(ROOT, "public", "masters");

export const FLOOR = 0.02;               // must match choosePolicyMove's default
export const OPENING_MOVES = 30;
/** Per-move axes the arms are compared on (and the prior reads). */
export const MOVE_AXES = ["line1", "line2", "line3", "line4", "line5", "contact", "tenuki", "thickness", "quadrant", "atari"];

/** The sampler's keep set from sparse logits over the legal moves, and whether the
 *  dump covers it: any index missing from the dump has a logit below the smallest
 *  dumped one, so coverage holds when that smallest value is under the threshold. */
export function keepSet(sparse, legalIdx, floor = FLOOR) {
  let best = -Infinity;
  for (const i of legalIdx) if (sparse[i] !== undefined && sparse[i] > best) best = sparse[i];
  if (best === -Infinity) return { keep: [], covered: false };
  const threshold = best + Math.log(floor);
  let minDumped = Infinity;
  for (const v of Object.values(sparse)) if (v < minDumped) minDumped = v;
  const keep = legalIdx.filter((i) => sparse[i] !== undefined && sparse[i] >= threshold);
  return { keep, covered: minDumped < threshold, best };
}

/** Arm a: the best legal move by logit. */
export function networkTop(sparse, legalIdx) {
  let best = -Infinity, bi = null;
  for (const i of legalIdx) if (sparse[i] !== undefined && sparse[i] > best) { best = sparse[i]; bi = i; }
  return bi;
}

/** Arm b: the book's most played move at this position, in real coordinates, or null.
 *  The stored index is canonical under some tying transform; undoing `t` gives a point
 *  equivalent under the position's symmetry, which is what agreement is judged on. */
export function bookMove(book, board, color, can = canonical(board)) {
  const entry = book.entries[bookKey(can.hash, color)];
  if (!entry) return null;
  let bestMove = null, bestN = -1;
  for (const [mv, n] of Object.entries(entry)) if (n > bestN) { bestN = n; bestMove = Number(mv); }
  const N = board.size;
  const [c, r] = fromCanonical(can.t, bestMove % N, Math.floor(bestMove / N), N);
  return r * N + c;
}

/** Per-move axes of one candidate, as a flat numeric vector (nulls kept). */
export function moveVector(board, i, color, ctx) {
  const N = board.size;
  const f = moveFeatures(board, i % N, Math.floor(i / N), color, ctx);
  const v = { contact: f.contact, tenuki: f.tenuki, thickness: f.thickness, quadrant: f.quadrant, atari: f.atariGiven };
  for (let l = 1; l <= 5; l++) v[`line${l}`] = Math.min(f.line, 5) === l ? 1 : 0;
  return v;
}

const rate = (n, d) => (d ? n / d : null);

/** Score one master. `positions` are the dumped lines; `games` the data games. */
export function scoreMaster({ games, positions, book, crossBook = null, floor = FLOOR }) {
  const byFile = new Map(games.map((g) => [g.file, g]));
  const arms = { a: [], b: [], cross: [], master: [] };
  const agree = { a: [0, 0, 0], b: [0, 0, 0], cross: [0, 0, 0] };   // [all, opening, late]
  const totals = [0, 0, 0];
  const hits = { b: 0, cross: 0 };
  let uncovered = 0;
  const bySplit = {};

  // Replay each game once, visiting its dumped positions in order.
  const perFile = new Map();
  for (const p of positions) {
    if (!perFile.has(p.file)) perFile.set(p.file, []);
    perFile.get(p.file).push(p);
  }
  for (const [file, ps] of perFile) {
    const g = byFile.get(file);
    if (!g) throw new Error(`logits for ${file} but no such game in the data`);
    ps.sort((x, y) => x.k - y.k);
    let rec = createGame({ size: 19, toPlay: g.firstToPlay });
    let lastEnemy = null;
    let pi = 0;
    for (let k = 0; k < g.seq.length && pi < ps.length; k++) {
      const [color, c, r] = g.seq[k];
      if (ps[pi].k === k) {
        const p = ps[pi++];
        const N = 19;
        const legalIdx = legalMoves(rec.board, color, {
          koPoint: rec.koPoint, history: rec.hashes, hash: rec.hashes[rec.hashes.length - 1],
        }).map(([x, y]) => y * N + x);
        const sparse = Object.fromEntries(Object.entries(p.logits).map(([i, v]) => [Number(i), v]));
        const ks = keepSet(sparse, legalIdx, floor);
        if (!ks.covered) { uncovered++; continue; }
        const target = r * N + c;
        const can = canonical(rec.board);
        const targetIdx = canonicalMove(rec.board, c, r, color, can).idx;
        const same = (i) => canonicalMove(rec.board, i % N, Math.floor(i / N), color, can).idx === targetIdx;
        const a = networkTop(sparse, legalIdx);
        const bm = bookMove(book, rec.board, color, can);
        const b = bm !== null && legalIdx.includes(bm) ? bm : a;
        if (bm !== null) hits.b++;
        const xm = crossBook ? bookMove(crossBook, rec.board, color, can) : null;
        const cross = xm !== null && legalIdx.includes(xm) ? xm : a;
        if (xm !== null) hits.cross++;
        const bucket = k + 1 <= OPENING_MOVES ? 1 : 2;
        totals[0]++; totals[bucket]++;
        for (const [arm, choice] of [["a", a], ["b", b], ["cross", cross]]) {
          if (same(choice)) { agree[arm][0]++; agree[arm][bucket]++; }
        }
        const ctx = { lastEnemy, moveNumber: k + 1 };
        arms.a.push(moveVector(rec.board, a, color, ctx));
        arms.b.push(moveVector(rec.board, b, color, ctx));
        if (crossBook) arms.cross.push(moveVector(rec.board, cross, color, ctx));
        arms.master.push(moveVector(rec.board, target, color, ctx));
        const s = g.split ?? "?";
        bySplit[s] = bySplit[s] ?? { n: 0, a: 0, b: 0 };
        bySplit[s].n++; if (same(a)) bySplit[s].a++; if (same(b)) bySplit[s].b++;
      }
      if (color !== g.masterColor) lastEnemy = [c, r];
      rec = play(rec, c, r, color);
    }
  }

  const masterMean = meanStyle(arms.master, MOVE_AXES);
  const spread = spreadOf(arms.master);
  const result = (arm) => ({
    top1: rate(agree[arm][0], totals[0]),
    top1Opening: rate(agree[arm][1], totals[1]),
    top1Late: rate(agree[arm][2], totals[2]),
    styleDistance: arms[arm].length ? styleDistance(meanStyle(arms[arm], MOVE_AXES), masterMean, spread, MOVE_AXES) : null,
  });
  return {
    positions: totals[0], opening: totals[1], late: totals[2], uncovered,
    bookHits: hits.b, crossHits: crossBook ? hits.cross : null,
    arms: { a: result("a"), b: result("b"), c: null, cross: crossBook ? result("cross") : null },
    bySplit: Object.fromEntries(Object.entries(bySplit).map(([s, v]) => [s, { positions: v.n, a: rate(v.a, v.n), b: rate(v.b, v.n) }])),
    baseline: meanStyle(arms.a, MOVE_AXES),
    masterMoves: masterMean,
    spread,
  };
}

function spreadOf(vectors) {
  const mean = meanStyle(vectors, MOVE_AXES);
  const out = {};
  for (const a of MOVE_AXES) {
    const vals = vectors.map((v) => v[a]).filter((x) => x !== null && x !== undefined);
    if (!vals.length) { out[a] = null; continue; }
    const varc = vals.reduce((s, x) => s + (x - mean[a]) ** 2, 0) / vals.length;
    out[a] = Math.max(Math.sqrt(varc), 1e-3);
  }
  return out;
}

export function readJsonl(path) {
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const manifest = JSON.parse(readFileSync(join(here, "manifest.json"), "utf8"));
  const only = process.argv.slice(2);
  const evalPath = join(PUBLIC, "eval.json");
  const report = existsSync(evalPath) ? JSON.parse(readFileSync(evalPath, "utf8")) : { masters: {} };
  report.model = MODEL_FILE;
  report.floor = FLOOR;
  report.note = "top-1 agreement with the master's move on positions the network's training data has likely seen (GoGoD); arm a is the control and is always shown beside arm b";
  const built = manifest.masters.filter((m) => existsSync(join(DATA, `${m.id}.logits.jsonl`)));
  for (const m of built) {
    if (only.length && !only.includes(m.id)) continue;
    const data = JSON.parse(readFileSync(join(DATA, `${m.id}.json`), "utf8"));
    const positions = readJsonl(join(DATA, `${m.id}.logits.jsonl`));
    const masterPath = join(PUBLIC, `${m.id}.json`);
    const master = JSON.parse(readFileSync(masterPath, "utf8"));
    const other = built.find((x) => x.id !== m.id);
    const crossBook = other ? JSON.parse(readFileSync(join(PUBLIC, `${other.id}.json`), "utf8")).book : null;
    const out = {};
    for (const split of ["dev", "test"]) {
      const games = data.games.filter((g) => g.even && g.split === split);
      const files = new Set(games.map((g) => g.file));
      const ps = positions.filter((p) => files.has(p.file));
      if (!ps.length) continue;
      const r = scoreMaster({ games, positions: ps, book: master.book, crossBook });
      if (r.uncovered) throw new Error(`${m.id}/${split}: ${r.uncovered} positions whose dump does not cover the keep set`);
      out[split] = r;
      const a = r.arms.a, b = r.arms.b, x = r.arms.cross;
      console.log(`${m.id} ${split}: ${r.positions} positions; top-1 a ${pct(a.top1)} b ${pct(b.top1)}` +
        (x ? ` cross(${other.id}) ${pct(x.top1)}` : "") +
        ` | opening a ${pct(a.top1Opening)} b ${pct(b.top1Opening)} | book hits ${r.bookHits}` +
        ` | style dist a ${a.styleDistance.toFixed(3)} b ${b.styleDistance.toFixed(3)}`);
    }
    report.masters[m.id] = { crossBook: other?.id ?? null, ...out };
    if (out.dev) {
      master.style.baseline = out.dev.baseline;
      master.style.moveAxes = MOVE_AXES;
      master.style.moveSpread = out.dev.spread;
      master.style.masterMoves = out.dev.masterMoves;
      writeFileSync(masterPath, JSON.stringify(master));
    }
  }
  report.generatedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(evalPath, JSON.stringify(report, null, 1) + "\n");
  console.log(`wrote ${evalPath}`);
}

function pct(x) { return x === null ? "n/a" : `${(x * 100).toFixed(1)}%`; }
