/* ----------------------- AUTHORING THE DRILLS -----------------------
   The two censuses find every position. This decides which of them are worth a
   learner's time, what rank each one is, and what it is called, and writes
   `src/content/drills.data.js`.

   It reads both kinds of census row and treats them differently, because they
   are different questions:

     life and death   `census.mjs` rows. A space with exactly one killing point
                      is a kill problem; one with exactly one living point is a
                      live problem, and both can come out of one position. Live
                      problems have their colours swapped, because the learner
                      plays Black everywhere else in the app and a collection
                      that sometimes hands them White is teaching two things at
                      once.

     capture          `capture.mjs` rows, already filtered to one answer each.

   Then, for both:

     the same problem twice   two boards related by a symmetry of the board are
                              one problem. The smallest spelling under all
                              eight wins and the rest are dropped. This matters
                              more than it sounds: the life-and-death census
                              hands back nine thousand boards that fold down to
                              fifty-eight distinct questions.

     the rank                 measured by `grade.mjs`, not assigned.

     the spread               a hundred boards at 19 kyu is not a collection.
                              Each rank keeps a capped number, chosen to spread
                              across shapes and across the corner, the edge and
                              the open board, so a learner working through one
                              rank meets different shapes rather than one shape
                              fifteen times.

   Every kept board is re-proved here from the data as it will ship, colours
   swapped and all, so a live problem is never trusted on the strength of a
   search run against the other colour. `drills.test.js` then proves the whole
   file again on every build, from the shipped data alone.

     node tools/problems/author.mjs life.json capture.json --out src/content/drills.data.js */
import { readFileSync, writeFileSync } from "node:fs";
import {
  board, killers, savers, catchers, captureValues, fightRegion, tesujiRegion,
  bounded, legal, P, fmt,
} from "./prove.mjs";
import { features, rankNumber, rankLabel, captureRank, tesujiRank } from "./grade.mjs";
import { nameOf } from "./name.mjs";
import { boardToRows } from "../../src/engine/index.js";
import { rankToNumber } from "../../src/content/library.js";

const SIZE = 9;
const PER_RANK = 20;

const parsePoints = (s) => s.split(" ").filter(Boolean).map(p => {
  const [c, r] = p.split(",").map(Number);
  return P(c, r);
});

const swap = (setup) => ({ b: setup.w, w: setup.b });
const slug = (name) => name.replace(/^the /, "").replace(/[^a-z]+/g, "-").replace(/-$/, "");

/* ----------------------- SAMENESS ACROSS THE WHOLE BOARD -----------------------
   `name.mjs` canonicalises a shape; this canonicalises a position. Two boards
   related by one of the eight symmetries of the square, answer and all, are
   the same problem however far apart they were drawn. */
const OPS = [
  (c, r) => [c, r], (c, r) => [SIZE - 1 - c, r], (c, r) => [c, SIZE - 1 - r],
  (c, r) => [SIZE - 1 - c, SIZE - 1 - r], (c, r) => [r, c], (c, r) => [SIZE - 1 - r, c],
  (c, r) => [r, SIZE - 1 - c], (c, r) => [SIZE - 1 - r, SIZE - 1 - c],
];

/** A drill's id, derived from the board rather than from its place in the
 *  list. Sequential ids were a quiet bug waiting to happen: every time a new
 *  census adds problems the whole file renumbers, and a reader's record of
 *  which drills they have solved then points at different boards. An id that
 *  comes out of the position never moves, so a later expansion adds ids
 *  without disturbing any that exist. */
export function drillId(setup, answers) {
  const key = positionKey(setup, answers);
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `d${h.toString(36).padStart(7, "0").slice(-7)}`;
}

/* The goal is deliberately not part of this. Two censuses can find the same
   board and ask about it differently - the capture census calling it a chain
   to take off, the tesuji census calling it a fight worth so many stones - and
   a reader who meets the identical position twice under two headings has been
   shown one drill twice. What makes two boards the same question is the stones
   and the answer, so that is the key, and the family that found it first keeps
   it. Kill and live are not affected: those are the same census row with the
   colours swapped, so their boards differ anyway. */
function positionKey(setup, answers) {
  let best = null;
  for (const op of OPS) {
    const g = Array(SIZE * SIZE).fill(".");
    for (const p of setup.w) { const [c, r] = op(p.c, p.r); g[r * SIZE + c] = "o"; }
    for (const p of setup.b) { const [c, r] = op(p.c, p.r); g[r * SIZE + c] = "x"; }
    const marks = answers.map(p => op(p.c, p.r).join(",")).sort().join(" ");
    const s = `${g.join("")}@${marks}`;
    if (best === null || s < best) best = s;
  }
  return best;
}

/** Where a fight is, read off the fight rather than off the box it came out
 *  of. The corner means the region holds the 1-1 point, which is the thing
 *  that changes the answer; the edge means it reaches the first line without
 *  reaching the corner; everything else is the open board. The grading model
 *  asks the same question of the same points, so the two cannot disagree. */
function whereOf(region, size = SIZE) {
  const edge = (p) => p.c === 0 || p.r === 0 || p.c === size - 1 || p.r === size - 1;
  const corner = region.some(p => edge(p) && edge({ c: p.r, r: p.c })
    && (p.c === 0 || p.c === size - 1) && (p.r === 0 || p.r === size - 1));
  if (corner) return "corner";
  return region.some(edge) ? "edge" : "open";
}

/** A life-and-death census row as the problems it is worth asking. */
function lifeQuestions(row) {
  const space = parsePoints(row.space);
  const out = [];
  /* A kill with a ko in it is a real problem and often a better one, but only
     when the ko IS the answer. A board where some killing points need a ko and
     others do not is asking two questions at once. */
  const koOnly = row.koOnly || [];
  const clean = row.kill.length === 1 && koOnly.length === 0;
  const koKill = row.kill.length === 1 && koOnly.length === 1 && fmt(koOnly) === fmt(row.kill);
  if (clean || koKill) {
    out.push({ kind: "life", goal: "kill", where: row.anchor, space,
      setup: row.setup, toPlay: "b", answers: row.kill, ko: koKill });
  }
  if (row.live.length === 1 && row.kill.length > 0) {
    out.push({ kind: "life", goal: "live", where: row.anchor, space,
      setup: swap(row.setup), toPlay: "b", answers: row.live, ko: false });
  }
  return out;
}

/* A tesuji row is already one question with one answer: the census only kept
   arrangements where exactly one move is best, so there is nothing here to
   choose between the way a life-and-death position offers a kill and a live. */
const tesujiQuestion = (row) => ({
  kind: "tesuji", goal: "tesuji", where: row.anchor, setup: row.setup,
  toPlay: "b", answers: [row.answer], net: row.net, sacrifice: row.sacrifice,
  depth: row.depth, whites: row.whites, region: row.region,
});

const captureQuestion = (row) => ({
  kind: "capture", goal: "capture", where: row.anchor, setup: row.setup,
  toPlay: "b", answers: [row.answer], libs: row.libs, whites: row.whites,
  decoys: row.decoys, placement: row.placement, depth: row.depth, corner: row.corner,
});

/** Re-prove a candidate against the board as it will ship, and grade it. */
function settle(q) {
  const bd = board(q.setup, SIZE);
  if (legal(bd) !== null) return null;

  if (q.kind === "tesuji") {
    const region = tesujiRegion(bd);
    if (region.length !== q.region) return null;
    const v = captureValues(bd, region, "b", { cap: 7 });
    const best = v.moves[0];
    if (!best || fmt([best.point]) !== fmt(q.answers)) return null;
    if (v.moves.length < 2 || best.net <= v.moves[1].net) return null;
    const where = whereOf(region);
    /* The horizon comes from the census rather than being measured a third
       time here: it is the most expensive number in the pipeline, and
       `drills.test.js` re-derives it from the shipped board on every build,
       which is the check that matters. Everything else is re-proved here. */
    const f = { depth: q.depth, sacrifice: best.sacrifice ? 1 : 0,
      decoys: region.length - 1, whites: q.whites,
      corner: where === "corner" ? 1 : 0 };
    return { ...q, board: bd, region, f, where, rank: rankLabel(tesujiRank(f)),
      shape: null, net: best.net, sacrifice: best.sacrifice ? 1 : 0,
      flavour: `tesuji|${q.sacrifice}|${where}|${q.depth}` };
  }

  if (q.kind === "capture") {
    const target = q.setup.w[0];
    const region = fightRegion(bd, target);
    const hits = catchers(bd, target, region, "b");
    if (fmt(hits) !== fmt(q.answers)) return null;
    const where = whereOf(region);
    const f = { libs: q.libs, whites: q.whites, decoys: region.length - 1,
      placement: q.placement, corner: where === "corner" ? 1 : 0, depth: q.depth };
    return { ...q, board: bd, region, f, target, where, rank: rankLabel(captureRank(f)),
      shape: null, flavour: `capture|${q.libs}|${where}|${q.whites}|${q.placement}` };
  }

  const found = bounded(bd);
  if (!found) return null;
  const moves = found.owner === q.toPlay
    ? savers(bd, found.target, found.region, q.toPlay)
    : killers(bd, found.target, found.region, q.toPlay);
  if (fmt(moves) !== fmt(q.answers)) return null;
  const f = features(bd, found, q.toPlay, q.answers);
  const name = nameOf(found.region);
  const where = whereOf(found.region);
  return { ...q, board: bd, region: found.region, f, where, rank: rankLabel(rankNumber(f)),
    shape: name, flavour: `${name}|${where}|${q.goal}` };
}

/** How unlike two boards are: the points where they differ, plus the answer,
 *  which is the point the whole board is about. */
function distance(a, b) {
  let d = 0;
  for (let i = 0; i < a.cells.length; i++) if (a.cells[i] !== b.cells[i]) d++;
  return d;
}

/** As unlike itself as the rank allows. Taking the first `cap` boards of a
 *  rank gives near twins, because the enumeration walks the board a point at a
 *  time and neighbouring arrangements differ by one stone. So the set is grown
 *  greedily instead: start from one board, and each time add whichever of the
 *  rest is furthest from everything chosen so far. It is the plainest way to
 *  make a page of twenty boards look like twenty boards.
 *
 *  Flavour still comes first - a life-and-death question and a capture are not
 *  made alike by counting stones - so each flavour is entered once before any
 *  flavour is entered twice. */
function spread(rows, cap) {
  const byFlavour = new Map();
  for (const r of rows) {
    if (!byFlavour.has(r.flavour)) byFlavour.set(r.flavour, []);
    byFlavour.get(r.flavour).push(r);
  }
  const chosen = [];
  const pool = [...byFlavour.values()];
  while (chosen.length < cap) {
    let took = false;
    for (const queue of pool) {
      const left = queue.filter(q => !chosen.includes(q));
      if (!left.length) continue;
      const next = chosen.length === 0
        ? left[0]
        : left.reduce((best, q) => {
          const d = Math.min(...chosen.map(c => distance(c.board, q.board)));
          return d > best.d ? { d, q } : best;
        }, { d: -1, q: left[0] }).q;
      chosen.push(next);
      took = true;
      if (chosen.length >= cap) break;
    }
    if (!took) break;
  }
  return chosen;
}

export function build(files, { perRank = PER_RANK } = {}) {
  const questions = [];
  for (const file of files) {
    const rows = JSON.parse(readFileSync(file, "utf8"));
    for (const row of rows) {
      if (row.kind === "tesuji") questions.push(tesujiQuestion(row));
      else if (row.answer) questions.push(captureQuestion(row));
      else questions.push(...lifeQuestions(row));
    }
  }
  const seen = new Set();
  const distinct = [];
  for (const q of questions) {
    const key = positionKey(q.setup, q.answers);
    if (seen.has(key)) continue;
    seen.add(key);
    distinct.push(q);
  }
  const settled = [];
  for (const q of distinct) {
    const s = settle(q);
    if (s) settled.push(s);
  }
  /* One board per life-and-death question. The census hands back the same
     question wearing a dozen different walls, and the walls are not the
     problem: a reader who meets the bent four in the corner five times has met
     it once. The drawing kept is the plainest one, which is the one with the
     fewest stones on the board. */
  const best = new Map();
  const capture = [];
  for (const s of settled) {
    if (s.kind !== "life") { capture.push(s); continue; }
    const stones = s.board.cells.filter(v => v !== null).length;
    const held = best.get(s.flavour);
    if (!held || stones < held.stones) best.set(s.flavour, { stones, row: s });
  }
  const oneEach = [...capture, ...[...best.values()].map(v => v.row)];

  /* And one last pass on the boards as they will actually be drawn. The key
     above works on the position a census handed over; this works on the nine
     rows that ship, which is what a reader sees and what `drills.test.js`
     checks. Two censuses finding the same fight and describing it differently
     is not a hypothetical: the capture census and the tesuji census turned out
     to share five boards exactly, one calling a 21 kyu capture what the other
     called an 11 kyu tesuji. The family that found it first keeps it. */
  const drawn = new Set();
  const unique = [];
  for (const s2 of oneEach) {
    const key = boardToRows(s2.board).join("") + "@" + fmt(s2.answers);
    if (drawn.has(key)) continue;
    drawn.add(key);
    unique.push(s2);
  }
  /* Capped per rank AND per kind, which is not tidiness either. Capping by
     rank alone means the day a new census arrives its problems compete for the
     same slots as the ones already shipped, and boards a reader may have
     solved quietly drop out of the collection. A family gets its own shelf at
     each rank, so an expansion only ever adds. */
  const byBucket = new Map();
  for (const s of unique) {
    const bucket = `${s.rank}|${s.kind}`;
    if (!byBucket.has(bucket)) byBucket.set(bucket, []);
    byBucket.get(bucket).push(s);
  }
  const kept = [];
  for (const group of byBucket.values()) kept.push(...spread(group, perRank));
  kept.sort((a, b) => rankToNumber(a.rank) - rankToNumber(b.rank)
    || a.kind.localeCompare(b.kind) || a.flavour.localeCompare(b.flavour));
  return { questions: questions.length, distinct: distinct.length, settled: settled.length, unique: unique.length, kept };
}

const HEADER = `/* ----------------------- THE DRILLS (GENERATED) -----------------------
   Written by \`node tools/problems/author.mjs\`. Do not edit by hand: the next
   run will overwrite it, and every board here was proved by a search rather
   than drawn, so a hand edit would be a claim nothing checked.

   The prose lives in \`drills.js\`, composed from these facts. The board is
   nine rows of nine, in the engine's own spelling: \`.\` empty, \`X\` black,
   \`O\` white. \`answers\` are [column, row].

   Every board is re-proved from this file by \`drills.test.js\` on every
   build, so if a row here is wrong the build says so. */
`;

function emit(d) {
  const id = drillId(d.setup, d.answers);
  const rows = boardToRows(d.board).map(r => `"${r}"`).join(", ");
  const answers = d.answers.map(p => `[${p.c}, ${p.r}]`).join(", ");
  if (d.kind === "tesuji") {
    const rows2 = boardToRows(d.board).map(r => `"${r}"`).join(", ");
    const answers2 = d.answers.map(p => `[${p.c}, ${p.r}]`).join(", ");
    return `  { id: "${id}", rank: "${d.rank}", kind: "tesuji", goal: "tesuji",
`
      + `    where: "${d.where}", net: ${d.net}, stones: ${d.f.whites},`
      + ` decoys: ${d.f.decoys}, depth: ${d.f.depth},`
      + ` sacrifice: ${d.f.sacrifice},
`
      + `    rows: [${rows2}],
`
      + `    answers: [${answers2}] },`;
  }
  const facts = d.kind === "capture"
    ? `libs: ${d.f.libs}, stones: ${d.f.whites}, decoys: ${d.f.decoys},`
      + ` target: [${d.target.c}, ${d.target.r}]`
    : `shape: "${slug(d.shape)}", space: ${d.f.space}`;
  return `  { id: "${id}", rank: "${d.rank}", kind: "${d.kind}", goal: "${d.goal}",\n`
    + `    where: "${d.where}", ${facts}, depth: ${d.f.depth},`
    + ` placement: ${d.f.placement}${d.ko ? ", ko: true" : ""},\n`
    + `    rows: [${rows}],\n`
    + `    answers: [${answers}] },`;
}

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const RUN = process.argv[1] && process.argv[1].split(String.fromCharCode(92)).join("/");
if (RUN && import.meta.url.endsWith(RUN)) {
  const files = process.argv.slice(2).filter(a => a.endsWith(".json"));
  const out = arg("--out", "");
  const built = build(files, { perRank: Number(arg("--per-rank", PER_RANK)) });
  console.log(`${built.questions} questions -> ${built.distinct} distinct`
    + ` -> ${built.settled} re-proved -> ${built.unique} after one board per`
    + ` life-and-death question -> ${built.kept.length} kept`);
  const tally = new Map();
  for (const d of built.kept) tally.set(d.rank, (tally.get(d.rank) || 0) + 1);
  console.log([...tally].map(([r, n]) => `${r}:${n}`).join("  "));
  if (out) {
    const body = built.kept.map(emit).join("\n");
    writeFileSync(out, `${HEADER}export const DRILL_DATA = [\n${body}\n];\n`);
    console.log(`\nwritten to ${out}`);
  }
}
