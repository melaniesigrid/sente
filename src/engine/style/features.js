/* ----------------------- STYLE FEATURES (pure) -----------------------
   How one side played a game, as numbers. Two layers:

     moveFeatures(board, c, r, color, ctx)   what one candidate move exhibits, from the
                                             position before it: line, contact, tenuki,
                                             thickness, quadrant, atari given, captures
     gameFeatures(rec, color, opts)          the same axes aggregated over every move
                                             `color` played, plus corners, sacrifice
                                             and header facts

   Definitions are fixed in docs/designs/masters-and-books.md. Aggregates over many
   games (`meanStyle`, `spreadStyle`, `styleDistance`) turn a corpus into a style
   vector and a spread, and measure how far a set of choices sits from it. The same
   code runs at build time over a master's corpus and in the browser over the
   network's own candidates, so master and baseline are always measured alike. */

import { createBoard, withStone, idx, inB, NBRS, chainAt } from "../board.js";
import { tryPlay, opponent } from "../rules.js";

export const PHASES = ["opening", "middle", "endgame"];
export const LINES = ["1", "2", "3", "4", "5+"];
export const CORNER_CLASSES = ["33", "34", "44", "53", "54", "other"];

/** Move number (1-based, both colours) at which each phase begins. */
export const PHASE_STARTS = { opening: 1, middle: 41, endgame: 151 };
/** Manhattan distance from the last enemy stone beyond which a move is a tenuki. */
export const TENUKI_DISTANCE = 6;

export const phaseOf = (moveNumber) =>
  moveNumber >= PHASE_STARTS.endgame ? "endgame" : moveNumber >= PHASE_STARTS.middle ? "middle" : "opening";

/** Line from the nearest edge, 1 at the edge; "5+" bucket for the centre. */
export const lineOf = (c, r, N) => Math.min(c, r, N - 1 - c, N - 1 - r) + 1;
export const lineBucket = (line) => (line >= 5 ? "5+" : String(line));

/** Corner class of a point by its lines from the two nearest edges. */
export function cornerClass(c, r, N) {
  const a = Math.min(c, N - 1 - c) + 1, b = Math.min(r, N - 1 - r) + 1;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  if (lo === 3 && hi === 3) return "33";
  if (lo === 3 && hi === 4) return "34";
  if (lo === 4 && hi === 4) return "44";
  if (lo === 3 && hi === 5) return "53";
  if (lo === 4 && hi === 5) return "54";
  return "other";
}

/** Quadrant of a point split at tengen: 0..3, or -1 on either centre line. */
export function quadrantOf(c, r, N) {
  const mid = (N - 1) / 2;
  if (c === mid || r === mid) return -1;
  return (c < mid ? 0 : 1) + (r < mid ? 0 : 2);
}

const manhattan = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

/** Stones of `color` per quadrant. */
function quadrantCounts(board, color) {
  const { size, cells } = board;
  const counts = [0, 0, 0, 0];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== color) continue;
    const q = quadrantOf(i % size, Math.floor(i / size), size);
    if (q >= 0) counts[q]++;
  }
  return counts;
}

/** What a candidate move at (c, r) exhibits, judged from the position before it.
 *  @param {object} board   `{size, cells}` before the move
 *  @param {string} color   side playing
 *  @param {object} [ctx]
 *  @param {[number,number]|null} [ctx.lastEnemy]  the last stone the other side played
 *  @param {number} [ctx.moveNumber]              1-based, for the phase (default 1)
 *  @returns {{line:number, phase:string, contact:0|1, tenuki:0|1|null, thickness:number|null,
 *             quadrant:0|1|null, atariGiven:number, captures:number, legal:boolean}}
 *  `null` means the axis is undefined here (no enemy stone yet, no own stone yet, no
 *  enemy stones in any quadrant) and is left out of every rate. */
export function moveFeatures(board, c, r, color, ctx = {}) {
  const { size, cells } = board;
  const opp = opponent(color);
  const line = lineOf(c, r, size);
  const phase = phaseOf(ctx.moveNumber ?? 1);

  let contact = 0;
  for (const [dx, dy] of NBRS) {
    const nx = c + dx, ny = r + dy;
    if (inB(size, nx, ny) && cells[idx(size, nx, ny)] === opp) { contact = 1; break; }
  }

  const tenuki = ctx.lastEnemy ? (manhattan([c, r], ctx.lastEnemy) > TENUKI_DISTANCE ? 1 : 0) : null;

  let thickness = null;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== color) continue;
    const d = Math.abs(i % size - c) + Math.abs(Math.floor(i / size) - r);
    if (thickness === null || d < thickness) thickness = d;
  }

  let quadrant = null;
  const q = quadrantOf(c, r, size);
  const enemyBy = quadrantCounts(board, opp);
  const most = Math.max(...enemyBy);
  if (most > 0) quadrant = q >= 0 && enemyBy[q] === most ? 1 : 0;

  const res = tryPlay(board, c, r, color);
  if (!res.ok) {
    return { line, phase, contact, tenuki, thickness, quadrant, atariGiven: 0, captures: 0, legal: false };
  }
  let atariGiven = 0;
  const seen = new Set();
  for (const [dx, dy] of NBRS) {
    const nx = c + dx, ny = r + dy;
    if (!inB(size, nx, ny) || res.board.cells[idx(size, nx, ny)] !== opp) continue;
    const ch = chainAt(res.board, nx, ny);
    const key = idx(size, ch.stones[0][0], ch.stones[0][1]);
    if (seen.has(key)) continue;
    seen.add(key);
    if (ch.libs.size === 1) atariGiven++;
  }
  return { line, phase, contact, tenuki, thickness, quadrant, atariGiven, captures: res.captured.length, legal: true };
}

/** Every axis of a game-level style vector, in a fixed order. */
export const AXES = [
  ...CORNER_CLASSES.map((k) => `corner_${k}`),
  ...PHASES.flatMap((p) => LINES.map((l) => `line_${p}_${l}`)),
  "contact", "tenuki", "atari100", "captures100",
  "sacrificed", "netTraded", "thickness", "quadrant",
  "length", "resigned", "komi", "year",
];

/** Axes the runtime prior can read off a single candidate move. */
export const PRIOR_AXES = ["line", "contact", "tenuki", "thickness", "quadrant", "atari"];

const share = (n, d) => (d > 0 ? n / d : 0);

/** How `color` played `rec`, aggregated. Replays the game from its setup position.
 *  @param {object} rec      GameRecord (moves, setup, size, komi, result)
 *  @param {string} color    "b" or "w"
 *  @param {object} [opts]   `{ year }` header fact; `null` when unknown
 *  @returns {Record<string, number|null>} one value per entry of `AXES`, plus `moves` */
export function gameFeatures(rec, color, opts = {}) {
  const N = rec.size;
  let board = createBoard(N);
  for (const [c, r] of rec.setup?.b ?? []) board = withStone(board, c, r, "b");
  for (const [c, r] of rec.setup?.w ?? []) board = withStone(board, c, r, "w");

  const corners = Object.fromEntries(CORNER_CLASSES.map((k) => [k, 0]));
  const lines = Object.fromEntries(PHASES.map((p) => [p, Object.fromEntries(LINES.map((l) => [l, 0]))]));
  const perPhase = Object.fromEntries(PHASES.map((p) => [p, 0]));
  let own = 0, contact = 0, tenuki = 0, tenukiN = 0, atari = 0, captures = 0;
  let thickness = 0, thicknessN = 0, quadrant = 0, quadrantN = 0, cornerMoves = 0;
  let lostStones = 0;
  let lastEnemy = null;
  let koPoint = null;
  const history = [];

  for (let k = 0; k < rec.moves.length; k++) {
    const m = rec.moves[k];
    if (m.type !== "play") continue;
    const moveNumber = k + 1;
    if (m.color === color) {
      const f = moveFeatures(board, m.c, m.r, color, { lastEnemy, moveNumber });
      own++;
      perPhase[f.phase]++;
      lines[f.phase][lineBucket(f.line)]++;
      contact += f.contact;
      if (f.tenuki !== null) { tenukiN++; tenuki += f.tenuki; }
      if (f.thickness !== null) { thicknessN++; thickness += f.thickness; }
      if (f.quadrant !== null) { quadrantN++; quadrant += f.quadrant; }
      atari += f.atariGiven;
      captures += f.captures;
      const q = quadrantOf(m.c, m.r, N);
      if (q >= 0 && quadrantCounts(board, "b")[q] + quadrantCounts(board, "w")[q] === 0) {
        cornerMoves++;
        corners[cornerClass(m.c, m.r, N)]++;
      }
    }
    const res = tryPlay(board, m.c, m.r, m.color, { koPoint, history });
    if (!res.ok) throw new RangeError(`move ${moveNumber} does not replay: ${res.reason}`);
    if (m.color !== color) { lastEnemy = [m.c, m.r]; lostStones += res.captured.length; }
    board = res.board;
    koPoint = res.ko;
    history.push(res.hash);
  }

  const out = { moves: own };
  for (const k of CORNER_CLASSES) out[`corner_${k}`] = share(corners[k], cornerMoves);
  for (const p of PHASES) for (const l of LINES) out[`line_${p}_${l}`] = share(lines[p][l], perPhase[p]);
  out.contact = share(contact, own);
  out.tenuki = share(tenuki, tenukiN);
  out.atari100 = share(atari, own) * 100;
  out.captures100 = share(captures, own) * 100;
  out.sacrificed = lostStones;
  out.netTraded = captures - lostStones;
  out.thickness = thicknessN ? thickness / thicknessN : 0;
  out.quadrant = share(quadrant, quadrantN);
  out.length = rec.moves.filter((m) => m.type === "play").length;
  out.resigned = rec.result?.method === "resign" ? 1 : 0;
  out.komi = rec.komi ?? 0;
  out.year = opts.year ?? null;
  return out;
}

/** Per-axis mean over feature vectors; axes that are `null` everywhere stay `null`. */
export function meanStyle(vectors, axes = AXES) {
  const out = {};
  for (const a of axes) {
    const vals = vectors.map((v) => v[a]).filter((x) => x !== null && x !== undefined && Number.isFinite(x));
    out[a] = vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : null;
  }
  return out;
}

/** Per-axis population standard deviation, never below `floor` so a constant axis
 *  cannot blow up a z-score. */
export function spreadStyle(vectors, axes = AXES, floor = 1e-3) {
  const mean = meanStyle(vectors, axes);
  const out = {};
  for (const a of axes) {
    if (mean[a] === null) { out[a] = null; continue; }
    const vals = vectors.map((v) => v[a]).filter((x) => x !== null && x !== undefined && Number.isFinite(x));
    const varc = vals.reduce((s, x) => s + (x - mean[a]) ** 2, 0) / vals.length;
    out[a] = Math.max(Math.sqrt(varc), floor);
  }
  return out;
}

/** Root-mean-square z-distance between two style vectors over the axes both define. */
export function styleDistance(a, b, spread, axes = AXES) {
  let sum = 0, n = 0;
  for (const ax of axes) {
    if (a[ax] == null || b[ax] == null || spread[ax] == null) continue;
    sum += ((a[ax] - b[ax]) / spread[ax]) ** 2;
    n++;
  }
  return n ? Math.sqrt(sum / n) : 0;
}
