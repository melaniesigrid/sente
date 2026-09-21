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

/** The enemy stones already standing inside `region`, added to it.
 *
 *  `enclosed` stops at stones, so a throw-in, a nakade left in place or any
 *  dead stone sitting in the eye space is a hole the search can never play
 *  in — not because the point is illegal but because it was never offered.
 *  That makes a whole class of kill invisible: Black throws in, White captures,
 *  and the points that just came free are outside the region, so `replies`
 *  will not generate them and the group is scored as living.
 *
 *  A chain counts as inside when every liberty it has lies in the region.
 *  `replies` already skips occupied points, so adding these costs nothing
 *  until a capture actually frees them.
 *
 *          . X X X X .          region as enclosed sees it:  a b
 *          X O O O O X                    the two O-eyes only
 *          X O a b O X          with the dead x inside:      a b x
 *          X O x O O X                    so the recapture is reachable
 *          . X X X X .
 */
function withDeadInside(b, region, owner) {
  if (!region.length) return region;
  const inRegion = new Set(region.map(p => `${p.c},${p.r}`));
  const extra = [], counted = new Set();
  for (const p of region) {
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q = P(p.c + dc, p.r + dr);
      if (q.c < 0 || q.r < 0 || q.c >= b.size || q.r >= b.size) continue;
      if (at(b, q) !== opponent(owner)) continue;
      const ch = chainAt(b, q.c, q.r);
      const key = ch.stones.map(([x, y]) => `${x},${y}`).sort().join(" ");
      if (counted.has(key)) continue;
      counted.add(key);
      const libs = [...ch.libs].map(i => P(i % b.size, Math.floor(i / b.size)));
      if (!libs.every(l => inRegion.has(`${l.c},${l.r}`))) continue;
      for (const [x, y] of ch.stones) extra.push(P(x, y));
    }
  }
  return extra.length ? [...region, ...extra] : region;
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

/* ----------------------- THE SEARCH ITSELF -----------------------
   One walk answers "does this group survive" for `survives`, `killers`,
   `savers` and the ko-blind check under `koOnlyKillers`. Both sides are
   confined to `region`, the defender may pass (which is what a ko threat
   played somewhere else amounts to), the attacker may not, and a position
   already on the path counts as survival: generous to the defender on
   purpose, so "dead" means dead.

   Without a memo the walk is exponential in the region and a nine-point
   corner space took ten seconds a verdict, which put the carpenter's square
   and everything above it out of reach. The memo is the one thing that is
   subtle here. A result that came from hitting a position already on the
   path depends on that position being on the path, so it is only true in
   that context and may not be stored. Every result therefore carries the
   depth of the shallowest ancestor it leaned on (`Infinity` for none), and a
   node stores its value only when nothing it relied on lies above it. A
   result cut off by the depth cap is never stored either, and a stored
   result is reused only where at least as many plies remain as when it was
   found, because a shallower horizon can only add cap hits, which count as
   survival. This is the standard treatment for search over graphs with
   cycles, and it keeps the answer identical to the unmemoised walk, which
   `grade.mjs` depends on: it reads the rank off the cap at which the answer
   settles. */
function search(b, target, owner, region, toPlay, ko, opts = {}) {
  const { cap = 40, koBlind = false, memo = new Map() } = opts;
  const path = new Map();
  const walk = (bd, mover, k0, depth) => {
    const kp = koBlind ? null : k0;
    const k = key(bd, mover, kp);
    const onPath = path.get(k);
    if (onPath !== undefined) return [true, onPath];
    if (depth > cap) return [true, -1];
    if (at(bd, target) !== owner) return [false, Infinity];
    const left = cap - depth;
    const hit = memo.get(k);
    if (hit !== undefined && left >= hit.left) return [hit.value, Infinity];
    path.set(k, depth);
    const other = opponent(mover);
    let value, dep = Infinity;
    const kids = replies(bd, region, mover, kp);
    if (mover === owner) {
      value = false;
      for (const [nb, nko] of kids) {
        const [v, d] = walk(nb, other, nko, depth + 1);
        dep = Math.min(dep, d);
        if (v) { value = true; break; }
      }
      if (!value) {
        const [v, d] = walk(bd, other, null, depth + 1);
        dep = Math.min(dep, d);
        value = v;
      }
    } else {
      value = true;
      for (const [nb, nko] of kids) {
        const [v, d] = walk(nb, other, nko, depth + 1);
        dep = Math.min(dep, d);
        if (!v) { value = false; break; }
      }
    }
    path.delete(k);
    if (dep >= depth) {
      if (hit === undefined || hit.left > left) memo.set(k, { value, left });
      return [value, Infinity];
    }
    return [value, dep];
  };
  return walk(b, toPlay, ko, 0)[0];
}

/** Does the chain standing at `target` survive, with `toPlay` to move and
 *  every move confined to `region`? See `search` for the rules. The trailing
 *  arguments are kept for callers that pass a depth cap. */
export function survives(b, target, owner, region, toPlay, ko = null, seen = undefined, depth = 0, cap = 40) {
  return search(b, target, owner, region, toPlay, ko, { cap });
}

/** Every point in `region` that, played by `attacker`, kills the target. */
export function killers(b, target, region, attacker, opts = {}) {
  const owner = at(b, target);
  const other = opponent(attacker);
  const search_ = withDeadInside(b, region, owner);
  const memo = new Map();
  return region.filter(m => {
    if (at(b, m) !== null) return false;
    const res = tryPlay(b, m.c, m.r, attacker);
    if (!res.ok) return false;
    if (at(res.board, target) !== owner) return true;
    return !search(res.board, target, owner, search_, other, res.ko, { ...opts, memo });
  });
}

/** Every point in `region` that, played by the group's owner, saves it. */
export function savers(b, target, region, owner, opts = {}) {
  const other = opponent(owner);
  const search_ = withDeadInside(b, region, owner);
  const memo = new Map();
  return region.filter(m => {
    if (at(b, m) !== null) return false;
    const res = tryPlay(b, m.c, m.r, owner);
    if (!res.ok) return false;
    if (at(res.board, target) !== owner) return false;
    return search(res.board, target, owner, search_, other, res.ko, { ...opts, memo });
  });
}

/** A verdict that changes when the ko rule is switched off was resting on a
 *  ko, and a problem has to say so rather than call it a clean kill. Returns
 *  the points that kill only because the defender may not retake. */
export function koOnlyKillers(b, target, region, attacker, opts = {}) {
  const owner = at(b, target);
  const other = opponent(attacker);
  const search_ = withDeadInside(b, region, owner);
  const memo = new Map();
  const blind = region.filter(m => {
    if (at(b, m) !== null) return false;
    const res = tryPlay(b, m.c, m.r, attacker);
    if (!res.ok) return false;
    if (at(res.board, target) !== owner) return true;
    return !search(res.board, target, owner, search_, other, null, { ...opts, memo, koBlind: true });
  });
  return killers(b, target, region, attacker, opts)
    .filter(m => !blind.some(q => samePoint(q, m)));
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


/* ----------------------- NET PRISONERS -----------------------
   `catches` watches one chain and asks whether it comes off the board. That is
   the right question for a ladder or a net and it is the wrong one for a
   snapback, and the reason is worth stating because it cost a census to find.

   In a snapback Black plays a stone White can take at once. White takes it, and
   the shape White is left with is a chain Black now captures whole. The chain
   that comes off the board at the end is not the chain the search was
   watching, and it is not even the chain that was in trouble when the problem
   began, so a solver written around a target never sees the move. The same
   applies to a throw-in, and to a capture under the stones.

   So this asks the other question: over the whole sequence, how many stones
   does Black take, less the stones White takes back. A sacrifice costs one and
   is therefore never worth making to a solver that counts the sacrifice as a
   loss and stops; counted to the end of the fight, it comes out plus two.

   Black maximises the count and White minimises it, both confined to `region`,
   both allowed to pass, and two passes end it. The ko rule is the engine's
   own. The remaining depth is part of the memo key because the value of a
   position here is the value of what is left to play, not of the position
   alone. */
export function prisoners(b, region, toMove, opts = {}) {
  const { cap = 8 } = opts;
  const memo = new Map();

  const walk = (bd, mover, passes, ko, left) => {
    if (passes >= 2 || left <= 0) return 0;
    const k = `${key(bd, mover, ko)}|${passes}|${left}`;
    const hit = memo.get(k);
    if (hit !== undefined) return hit;

    let best = null;
    const take = (v) => {
      if (best === null) best = v;
      else best = mover === "b" ? Math.max(best, v) : Math.min(best, v);
    };
    for (const m of region) {
      if (at(bd, m) !== null) continue;
      const res = tryPlay(bd, m.c, m.r, mover, { koPoint: ko });
      if (!res.ok) continue;
      const got = res.captured.length * (mover === "b" ? 1 : -1);
      take(got + walk(res.board, opponent(mover), 0, res.ko, left - 1));
    }
    take(walk(bd, opponent(mover), passes + 1, null, left - 1));
    const out = best === null ? 0 : best;
    memo.set(k, out);
    return out;
  };

  return walk(b, toMove, 0, null, cap);
}

/** What every legal move in `region` is worth in net prisoners, best first for
 *  the mover, beside what the mover gets by not playing here at all. A move
 *  has to beat the pass or it is not a move, it is a habit. */
export function captureValues(b, region, toMove, opts = {}) {
  const { cap = 8 } = opts;
  const other = opponent(toMove);
  const moves = [];
  for (const m of region) {
    if (at(b, m) !== null) continue;
    const res = tryPlay(b, m.c, m.r, toMove, {});
    if (!res.ok) continue;
    const got = res.captured.length * (toMove === "b" ? 1 : -1);
    moves.push({
      point: m,
      net: got + prisoners(res.board, region, other, { ...opts, cap: cap - 1 }),
      /* Whether the stone just played can be taken straight back. A move that
         gives a stone away and is still the best move in the position is the
         definition of a sacrifice tesuji, and this is what marks one. */
      sacrifice: at(res.board, m) === toMove
        && chainAt(res.board, m.c, m.r).libs.size === 1,
      takes: res.captured.length,
    });
  }
  moves.sort((a, b) => (toMove === "b" ? b.net - a.net : a.net - b.net));
  return { moves, pass: prisoners(b, region, other, { ...opts, cap: cap - 1 }) };
}

/** The region a tesuji problem is fought in: the empty points within two of
 *  any white stone. A capturing problem has one target and can measure from
 *  it; a tesuji has no single target, which is the whole reason it needed a
 *  different solver, so the fight is measured from the stones under siege.
 *
 *  Derived from the board alone, so the census, the author and the test that
 *  re-proves the shipped drill all see the same points. */
export function tesujiRegion(b) {
  const white = [];
  for (let r = 0; r < b.size; r++) for (let c = 0; c < b.size; c++) {
    if (b.cells[idx(b.size, c, r)] === "w") white.push(P(c, r));
  }
  const out = [];
  for (let r = 0; r < b.size; r++) for (let c = 0; c < b.size; c++) {
    if (b.cells[idx(b.size, c, r)] !== null) continue;
    if (white.some(w => Math.abs(w.c - c) + Math.abs(w.r - r) <= 2)) out.push(P(c, r));
  }
  return out;
}

/** How deep you have to read before the answer is the answer: the smallest
 *  horizon at which `move` is still strictly the best move in `region`. A move
 *  that pays at two plies is one anybody sees; one that only comes out on top
 *  at seven has to be read, and that difference is most of what makes a tesuji
 *  hard. Shared so the census, the author and the test measure it the same way. */
export function readingHorizon(b, region, toMove, move, cap = 7) {
  for (let d = 2; d <= cap; d++) {
    const v = captureValues(b, region, toMove, { cap: d });
    const top = v.moves[0];
    if (top && top.point.c === move.c && top.point.r === move.r
      && v.moves.length > 1 && top.net > v.moves[1].net) return d;
  }
  return cap;
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
