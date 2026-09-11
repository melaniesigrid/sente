/* ----------------------- LESSON POSITION SEARCH -----------------------
   The rule in .claude/rules/lessons.md is that tactical positions are searched
   for with the engine, not hand-written, because a hand-written position that
   looks right is usually wrong somewhere. This module is what does the
   searching. It is a dev tool: nothing here ships, and nothing under src/
   imports it.

   Three solvers, each answering the question its own kind of lesson asks:

     netted()     can this stone be caught, or does it get loose?
     killable()   attacker to kill, defender to live, inside a bounded region
     raceWinner() two chains, no eyes - which one comes off the board first?

   All three are exhaustive within their depth and region, so a positive answer
   is a proof and a negative one only means "not within these bounds". Keep the
   region small; the trees grow fast.

   All three obey the ko rule: the ko point is threaded through the search, and a
   pass clears it, which is what a ko threat played elsewhere amounts to. This
   matters more than it sounds. The false-eye position in Tier 2 is only a clean
   kill because White's retake is ko-banned; a search that ignored ko would call
   the same position dead for the wrong reason.

   Run it directly to re-prove the two positions already in the library:

     node tools/lessons/search.mjs */
import {
  idx, colRow, chainAt, tryPlay, opponent, boardFromRows, boardToRows,
} from "../../src/engine/index.js";

/** Board from rows of text: `.` empty, `X` black, `O` white. */
export const fromRows = (rows) => boardFromRows(rows);
export const show = (b) => boardToRows(b).join("\n");
export const libs = (b, c, r) => chainAt(b, c, r).libs.size;

const key = (b) => b.cells.map(v => (v === "b" ? "X" : v === "w" ? "O" : ".")).join("");
const at = (b, p) => b.cells[idx(b.size, p.c, p.r)];

/** Empty points within `radius` (manhattan) of the chain holding `seed`. */
function around(board, seed, radius) {
  const out = new Set();
  const ch = chainAt(board, seed.c, seed.r);
  for (const [x, y] of ch.stones) {
    for (let dx = -radius; dx <= radius; dx++) for (let dy = -radius; dy <= radius; dy++) {
      if (Math.abs(dx) + Math.abs(dy) > radius) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= board.size || ny >= board.size) continue;
      if (board.cells[idx(board.size, nx, ny)] === null) out.add(idx(board.size, nx, ny));
    }
  }
  return [...out];
}

/* ---------- nets and ladders ----------
   A net question is not "can I capture within N moves" but "can it ever get
   loose". The defender escapes the moment its chain reaches `escapeLibs`
   liberties, which is both the definition a tesuji book is using and a very
   much smaller tree than playing every capture out to the end. */
export function netted(board, target, attacker, depth, opts = {}) {
  const { escapeLibs = 4, radius = 2, first = attacker } = opts;
  const memo = new Map();

  function search(b, toMove, left, ko) {
    if (at(b, target) === null) return true;                     // captured
    if (chainAt(b, target.c, target.r).libs.size >= escapeLibs) return false;
    if (left <= 0) return false;
    const k = key(b) + toMove + left + ko;
    if (memo.has(k)) return memo.get(k);
    memo.set(k, false);                                          // cycle guard

    let out = toMove !== attacker;
    for (const i of around(b, target, radius)) {
      const [c, r] = colRow(b.size, i);
      const res = tryPlay(b, c, r, toMove, { koPoint: ko });
      if (!res.ok) continue;
      const sub = search(res.board, opponent(toMove), toMove === attacker ? left - 1 : left, res.ko);
      if (toMove === attacker && sub) { out = true; break; }
      if (toMove !== attacker && !sub) { out = false; break; }
    }
    memo.set(k, out);
    return out;
  }
  return search(board, first, depth, null);
}

/* ---------- life and death ----------
   Attacker to kill, defender to live, confined to `region` (an array of board
   indices). The defender may pass: if passing still survives, the group is
   alive, which is the working definition a tsumego uses. */
export function killable(board, target, region, depth, opts = {}) {
  const { attacker = "b", first = attacker } = opts;
  const memo = new Map();

  function search(b, toMove, left, passed, ko) {
    if (at(b, target) === null) return true;
    if (left <= 0) return false;
    const k = key(b) + toMove + left + passed + ko;
    if (memo.has(k)) return memo.get(k);
    memo.set(k, false);

    let out = toMove !== attacker;
    for (const i of region) {
      if (b.cells[i] !== null) continue;
      const [c, r] = colRow(b.size, i);
      const res = tryPlay(b, c, r, toMove, { koPoint: ko });
      if (!res.ok) continue;
      const sub = search(res.board, opponent(toMove), toMove === attacker ? left - 1 : left, 0, res.ko);
      if (toMove === attacker && sub) { out = true; break; }
      if (toMove !== attacker && !sub) { out = false; break; }
    }
    // a pass clears the ko ban, which is what a ko threat elsewhere amounts to
    if (toMove !== attacker && out && !passed && !search(b, attacker, left, 1, null)) out = false;
    memo.set(k, out);
    return out;
  }
  return search(board, first, depth, 0, opts.koPoint ?? null);
}

/* ---------- capturing races ----------
   One game, not two questions: whichever of the two chains leaves the board
   first decides it. Returns "b", "w", or "=" for a race neither side wins
   inside `depth` plies - a seki, or simply unresolved. */
export function raceWinner(board, bSeed, wSeed, region, depth, first = "b") {
  const memo = new Map();

  function search(b, toMove, left, passes, ko) {
    if (at(b, wSeed) === null) return "b";
    if (at(b, bSeed) === null) return "w";
    if (passes >= 2 || left <= 0) return "=";
    const k = key(b) + toMove + left + passes + ko;
    if (memo.has(k)) return memo.get(k);
    memo.set(k, "=");

    let best = null;
    const consider = (r) => {
      if (r === toMove) { best = r; return true; }               // winning: take it
      if (best === null || r === "=") best = r;
      return false;
    };
    for (const i of region) {
      if (b.cells[i] !== null) continue;
      const [c, r] = colRow(b.size, i);
      const res = tryPlay(b, c, r, toMove, { koPoint: ko });
      if (!res.ok) continue;
      if (consider(search(res.board, opponent(toMove), left - 1, 0, res.ko))) break;
    }
    if (best !== toMove) consider(search(b, opponent(toMove), left - 1, passes + 1, null));
    const out = best === null ? "=" : best;
    memo.set(k, out);
    return out;
  }
  return search(board, first, depth, 0, null);
}

/** Replay alternating moves from `first`; throws on the first illegal one. */
export function replayLine(board, first, moves) {
  let b = board, color = first, ko = null;
  moves.forEach(([c, r], n) => {
    const res = tryPlay(b, c, r, color, { koPoint: ko });
    if (!res.ok) throw new Error(`move ${n + 1} (${c},${r}) for ${color} is illegal: ${res.reason}`);
    b = res.board; ko = res.ko; color = opponent(color);
  });
  return b;
}

/** Each point in `points` played by `color`, with the verdict `judge` gives it. */
export function verdicts(board, color, points, judge) {
  return points.map((i) => {
    const [c, r] = colRow(board.size, i);
    const res = tryPlay(board, c, r, color);
    return [c, r, res.ok ? judge(res.board) : "illegal"];
  });
}

/* ---------- demonstration ----------
   The two searched positions already in the library, re-proved from scratch. */
function demo() {
  const net = fromRows([
    ".........", ".........", ".........",
    "..XXX....", "..XO.....", "..X......",
    ".........", ".........", ".........",
  ]);
  const cut = { c: 3, r: 4 };
  const holds = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const res = tryPlay(net, c, r, "b");
    if (res.ok && netted(res.board, cut, "b", 6, { first: "w" })) holds.push(`(${c},${r})`);
  }
  console.log(show(net));
  console.log("marvels-net - black moves that hold the cutting stone:", holds.join(" ") || "none");

  const race = fromRows([
    ".........", ".........", ".........", ".........", ".........",
    "XXXX.....", "OOO.X....", ".XOOX....", ".XXOX....",
  ]);
  const region = [];
  for (let r = 6; r <= 8; r++) for (let c = 0; c <= 3; c++) {
    const i = idx(9, c, r);
    if (race.cells[i] === null) region.push(i);
  }
  const B = { c: 1, r: 7 }, W = { c: 0, r: 6 };
  console.log("\n" + show(race));
  console.log("liberty-race - white liberties:", libs(race, 0, 6),
              " black liberties:", libs(race, 1, 7));
  console.log("liberty-race - black first:", raceWinner(race, B, W, region, 12, "b"),
              " white first:", raceWinner(race, B, W, region, 12, "w"));
  for (const [c, r, v] of verdicts(race, "b", region, (b) => raceWinner(b, B, W, region, 12, "w"))) {
    console.log(`  black (${c},${r}) -> ${v}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith("search.mjs")) demo();
