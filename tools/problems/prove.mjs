/* ----------------------- THE PROVER -----------------------
   A tsumego is a claim that one point settles a bounded space, and that is the
   most checkable claim anything in this repo makes. This is what checks it.

   `killers` and `savers` answer, exhaustively, which points in an enclosed
   region kill the group inside it and which ones save it. Both sides may pass,
   a repeated position counts as survival, and the ko rule is the engine's own,
   so a verdict that needs a ko is a verdict the defender genuinely cannot
   escape. Exhaustive within the region means a positive answer is a proof and
   an empty answer is a proof too: nothing in there works.

   The region is the whole trick. Flood-filled from one empty point
   (`enclosed`), a corner eye space is four to six squares and the search
   finishes in milliseconds; handed a quarter of the board it never returns.
   Every caller states its region, and `problems.test.js` refuses a board whose
   region is bigger than the search can honestly cover.

   Used by `src/content/problems.test.js` on every build, and by
   `tools/problems/shapes.mjs` to find the positions in the first place. Pure:
   it holds no state and reaches for nothing outside the engine. */
import { tryPlay, chainAt, idx, opponent, createBoard } from "../../src/engine/index.js";

export const P = (c, r) => ({ c, r });
export const at = (b, p) => b.cells[idx(b.size, p.c, p.r)];
export const samePoint = (a, b) => a.c === b.c && a.r === b.r;
export const fmt = (ps) => ps.map(p => `${p.c},${p.r}`).sort().join(" ");

/** A problem's `setup` as a board. The same conversion `positions.js` does for
 *  the app, kept here so the tool runs without pulling in the React side. */
export function board(setup, size = 9) {
  const b = createBoard(size);
  (setup.b || []).forEach(p => { b.cells[idx(size, p.c, p.r)] = "b"; });
  (setup.w || []).forEach(p => { b.cells[idx(size, p.c, p.r)] = "w"; });
  return b;
}

/** null if every chain on the board has a liberty, else what is wrong. */
export function legal(b) {
  for (let r = 0; r < b.size; r++) for (let c = 0; c < b.size; c++) {
    if (b.cells[idx(b.size, c, r)] === null) continue;
    if (chainAt(b, c, r).libs.size === 0) return `(${c},${r}) has no liberties`;
  }
  return null;
}

/** The empty region enclosed around `seed`: a flood fill that stops at stones.
 *  This is where a bounded search is allowed to play, and keeping it small is
 *  what makes the search finish. */
export function enclosed(b, seed) {
  const out = [], seen = new Set(), stack = [seed];
  while (stack.length) {
    const p = stack.pop(), k = `${p.c},${p.r}`;
    if (seen.has(k)) continue;
    if (p.c < 0 || p.r < 0 || p.c >= b.size || p.r >= b.size) continue;
    seen.add(k);
    if (at(b, p) !== null) continue;
    out.push(p);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) stack.push(P(p.c + dc, p.r + dr));
  }
  return out;
}

/** The one chain on the board whose every liberty lies inside one enclosed
 *  region, with the region beside it: the group a life-and-death problem is
 *  about, found rather than declared. Returns null if there is no such group,
 *  or more than one, or the region is larger than `cap` points, because a
 *  region the search cannot cover is one nobody should be quoting a verdict
 *  from. A region of one or two points is not a life-and-death problem either:
 *  it is a group already in atari, and the answer there is arithmetic. */
export function bounded(b, cap = 8, floor = 3) {
  const found = [];
  const seen = new Set();
  for (let r = 0; r < b.size; r++) for (let c = 0; c < b.size; c++) {
    const colour = b.cells[idx(b.size, c, r)];
    if (colour === null) continue;
    const ch = chainAt(b, c, r);
    const stones = ch.stones.map(([x, y]) => `${x},${y}`).sort().join(" ");
    if (seen.has(stones)) continue;
    seen.add(stones);
    const libs = [...ch.libs].map(i => P(i % b.size, Math.floor(i / b.size)));
    if (!libs.length) continue;
    const region = enclosed(b, libs[0]);
    if (libs.some(l => !region.some(q => samePoint(q, l)))) continue;
    if (region.length > cap || region.length < floor) continue;
    found.push({ target: P(c, r), owner: colour, region, size: ch.stones.length });
  }
  if (!found.length) return null;
  /* More than one chain can be sealed inside the same space: a wall with a
     stone of its own cut off in the corner is still one group's problem, and
     the group is the big chain. Two chains in two different spaces is two
     problems on one board, and the prover declines to guess which. */
  const regions = new Set(found.map(f => fmt(f.region)));
  if (regions.size !== 1) return null;
  return found.reduce((a, b) => (b.size > a.size ? b : a));
}

const key = (b, toPlay, ko) => b.cells.map(v => (v === "b" ? 1 : v === "w" ? 2 : 0)).join("") + toPlay + (ko ?? "-");

/** Every legal move for `toPlay` inside `region`, as `[board, koPoint]` pairs.
 *  The ko point is the engine's own: a single stone taking a single stone and
 *  left on one liberty, and nothing looser. */
const replies = (b, region, toPlay, ko) => {
  const out = [];
  for (const m of region) {
    if (at(b, m) !== null) continue;
    const res = tryPlay(b, m.c, m.r, toPlay, { koPoint: ko });
    if (res.ok) out.push([res.board, res.ko]);
  }
  return out;
};

/** Does the chain standing at `target` survive, with `toPlay` to move and
 *  every move confined to `region`? Both sides may pass, which is what a ko
 *  threat played somewhere else amounts to, and a position seen before counts
 *  as survival: generous to the defender on purpose, so "dead" means dead. */
export function survives(b, target, owner, region, toPlay, ko = null, seen = new Set(), depth = 0, cap = 24) {
  const k = key(b, toPlay, ko);
  if (seen.has(k) || depth > cap) return true;
  if (at(b, target) !== owner) return false;
  const next = new Set(seen).add(k);
  const kids = replies(b, region, toPlay, ko);
  const other = opponent(toPlay);
  if (toPlay === owner) {
    return kids.some(([nb, nko]) => survives(nb, target, owner, region, other, nko, next, depth + 1, cap))
      || survives(b, target, owner, region, other, null, next, depth + 1, cap);
  }
  return !kids.some(([nb, nko]) => !survives(nb, target, owner, region, other, nko, next, depth + 1, cap));
}

/** Every point in `region` that, played by `attacker`, kills the target. */
export function killers(b, target, region, attacker) {
  const owner = at(b, target);
  const other = opponent(attacker);
  return region.filter(m => {
    if (at(b, m) !== null) return false;
    const res = tryPlay(b, m.c, m.r, attacker);
    if (!res.ok) return false;
    if (at(res.board, target) !== owner) return true;
    return !survives(res.board, target, owner, region, other, res.ko);
  });
}

/** Every point in `region` that, played by the group's owner, saves it. */
export function savers(b, target, region, owner) {
  const other = opponent(owner);
  return region.filter(m => {
    if (at(b, m) !== null) return false;
    const res = tryPlay(b, m.c, m.r, owner);
    if (!res.ok) return false;
    if (at(res.board, target) !== owner) return false;
    return survives(res.board, target, owner, region, other, res.ko);
  });
}

/** A verdict that changes when the ko rule is switched off was resting on a
 *  ko, and a problem has to say so rather than call it a clean kill. Returns
 *  the points that kill only because the defender may not retake. */
export function koOnlyKillers(b, target, region, attacker) {
  const owner = at(b, target);
  const other = opponent(attacker);
  const blind = region.filter(m => {
    if (at(b, m) !== null) return false;
    const res = tryPlay(b, m.c, m.r, attacker);
    if (!res.ok) return false;
    if (at(res.board, target) !== owner) return true;
    return !survivesKoBlind(res.board, target, owner, region, other);
  });
  return killers(b, target, region, attacker)
    .filter(m => !blind.some(q => samePoint(q, m)));
}

/** `survives` with the ko ban lifted, so a position can only be held by a
 *  repetition the defender is actually allowed to make. */
function survivesKoBlind(b, target, owner, region, toPlay, seen = new Set(), depth = 0, cap = 24) {
  const k = key(b, toPlay, null);
  if (seen.has(k) || depth > cap) return true;
  if (at(b, target) !== owner) return false;
  const next = new Set(seen).add(k);
  const kids = replies(b, region, toPlay, null);
  const other = opponent(toPlay);
  if (toPlay === owner) {
    return kids.some(([nb]) => survivesKoBlind(nb, target, owner, region, other, next, depth + 1, cap))
      || survivesKoBlind(b, target, owner, region, other, next, depth + 1, cap);
  }
  return !kids.some(([nb]) => !survivesKoBlind(nb, target, owner, region, other, next, depth + 1, cap));
}


/* ----------------------- CATCHING A CHAIN -----------------------
   Life and death asks whether a sealed group can make two eyes. The other half
   of a problem collection asks something cheaper and, below about ten kyu,
   more useful: can this chain be taken off the board at all.

   The rules of the search are the ones a capturing problem means by "caught".
   Both sides are confined to `region`, as everywhere else here. The defender
   escapes by reaching `escapeLibs` liberties, which is the working definition
   a tesuji book uses - a chain with four liberties and the run of the board is
   not caught, whatever happens next - or by growing a liberty outside the
   region, which is the same thing said geometrically. The attacker wins only
   by actually removing the stones.

   A defender may pass; an attacker who passes has given up, so passing is the
   defender's move alone. Repetition counts for the defender, as it does in
   `survives`: generous to the side being hunted on purpose, so that "caught"
   means caught. */
const outsideLiberty = (b, target, region) => {
  const ch = chainAt(b, target.c, target.r);
  return [...ch.libs].some(i => !region.some(p => idx(b.size, p.c, p.r) === i));
};

export function catches(b, target, region, attacker, toMove, opts = {}) {
  const { escapeLibs = 4, cap = 10 } = opts;
  const owner = opponent(attacker);
  const seen = new Set();

  const walk = (bd, mover, ko, depth) => {
    if (at(bd, target) !== owner) return true;
    const ch = chainAt(bd, target.c, target.r);
    if (ch.libs.size >= escapeLibs) return false;
    if (outsideLiberty(bd, target, region)) return false;
    if (depth >= cap) return false;
    const k = key(bd, mover, ko) + depth;
    if (seen.has(k)) return false;
    seen.add(k);
    const kids = replies(bd, region, mover, ko);
    if (mover === attacker) return kids.some(([nb, nko]) => walk(nb, owner, nko, depth + 1));
    return kids.every(([nb, nko]) => walk(nb, attacker, nko, depth + 1))
      && walk(bd, attacker, null, depth + 1);
  };
  return walk(b, toMove, null, 0);
}

/** Every point in `region` that, played by `attacker`, catches the target. */
export function catchers(b, target, region, attacker, opts = {}) {
  const owner = opponent(attacker);
  return region.filter(m => {
    if (at(b, m) !== null) return false;
    const res = tryPlay(b, m.c, m.r, attacker);
    if (!res.ok) return false;
    if (at(res.board, target) !== owner) return true;
    return catches(res.board, target, region, attacker, owner, opts);
  });
}

/** The region a capturing problem is fought in: the empty points within two
 *  of the chain at `target`. One step out is where the liberties are, two is
 *  where a block or an extension goes, and a chain that grows a liberty past
 *  that ring has got out, which `catches` already counts as an escape.
 *
 *  Both the tool that finds these positions and the test that re-proves them
 *  call this, so they cannot drift into searching two different boards. */
export function fightRegion(b, target) {
  const ch = chainAt(b, target.c, target.r);
  const out = [];
  for (let r = 0; r < b.size; r++) for (let c = 0; c < b.size; c++) {
    if (b.cells[idx(b.size, c, r)] !== null) continue;
    if (ch.stones.some(([x, y]) => Math.abs(x - c) + Math.abs(y - r) <= 2)) out.push(P(c, r));
  }
  return out;
}

/** A board as text, for reading a search result in a terminal. */
export function show(b) {
  let s = "";
  for (let r = 0; r < b.size; r++) {
    for (let c = 0; c < b.size; c++) {
      const v = b.cells[idx(b.size, c, r)];
      s += v === "b" ? " X" : v === "w" ? " O" : " .";
    }
    s += "\n";
  }
  return s;
}
