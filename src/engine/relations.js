/* ----------------------- RELATIONS (pure) -----------------------
   The shapes a teacher points at. `shape.js` names three findings and stops
   there on purpose: it feeds the house players, who say one short thing about a
   move and must never be wrong. A trainer needs the rest of the vocabulary -
   the jump, the knight's move, the bamboo joint, the hane, the cut - because a
   player who cannot name what they played cannot be told what it cost.

   Everything here is local to the stone just played and is read off the board
   after the move. No board sweep, no history, no opinion: a relation is a fact
   about which points hold which stones, and nothing else. What each one is
   worth is content (`src/content/senseiShapes.js`), and where it is a bad
   bargain is the Book of Shapes.

   Three rules kept the list honest:

   A relation is between the stone just played and one of MY OWN stones, or
   between the stone just played and an enemy one. A jump I made forty moves ago
   is not something I just did, so it is not reported.

   The connecting points must be empty. A knight's move whose waist already
   holds an enemy stone is not a knight's move, it is two stones with a stone
   between them, and calling it keima would teach the player something false.

   Where two relations are both true, both are reported. A move can be a hane
   and an attachment at once; the caller decides which is worth saying, the same
   way `SEVERITY_RANK` does in `shape.js`. `RELATIONS` fixes the order, most
   worth saying first, so a caller that wants one can take the first. */
import { NBRS, chainAt, idx, inB } from "./board.js";
import { opponent } from "./rules.js";

/** Every relation this module can name, in the order a teacher would reach for
 *  them: what the move did to the opponent first, then what it did for me. */
export const RELATIONS = [
  "ponnuki", "cut", "hane", "shoulder-hit", "attachment",
  "bamboo-joint", "one-point-jump", "knights-move", "large-knights-move",
  "two-space-extension", "solid-extension", "diagonal",
];

const DIAGS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** The points strictly between two points on a straight line, or null when the
 *  two are not on one. Used to insist a jump's ground is empty. */
function between(a, b) {
  const [ac, ar] = a, [bc, br] = b;
  if (ac !== bc && ar !== br) return null;
  const n = Math.max(Math.abs(bc - ac), Math.abs(br - ar));
  const dc = Math.sign(bc - ac), dr = Math.sign(br - ar);
  const out = [];
  for (let i = 1; i < n; i++) out.push([ac + dc * i, ar + dr * i]);
  return out;
}

/**
 * Name the relations the move just made.
 *
 * @param {{ size: number, cells: (null|"b"|"w")[] }} board  position AFTER the move
 * @param {{ c: number, r: number }|null} move   the stone just played; null for a pass
 * @param {{ color: "b"|"w", captured?: [number, number][] }} opts
 *        `captured` is `rec.lastCaptured`: the ponnuki is read from it, because a
 *        ponnuki is a capture and not an arrangement.
 * @returns {string[]} relation ids, in `RELATIONS` order
 */
export function relationsAt(board, move, opts = {}) {
  if (!board || !move) return [];
  const { size, cells } = board;
  const { c, r } = move;
  if (!inB(size, c, r)) return [];
  const color = opts.color ?? cells[idx(size, c, r)];
  if (color !== "b" && color !== "w") return [];
  const enemy = opponent(color);
  const captured = opts.captured ?? [];

  const at = (x, y) => (inB(size, x, y) ? cells[idx(size, x, y)] : undefined);
  const mine = (x, y) => at(x, y) === color;
  const empty = (x, y) => at(x, y) === null;
  const clear = (a, b) => {
    const mid = between(a, b);
    return mid !== null && mid.every(([x, y]) => empty(x, y));
  };
  const found = new Set();

  /* ---- what the move did to the other player ---- */

  /* Ponnuki: one stone taken, and all four of its neighbours on the board are
     mine. On the edge the diamond cannot close, so the edge shape - worth about
     six points, says the second half of the proverb - is not called a ponnuki
     here. A multi-stone capture is a bigger shape and a different lesson. */
  if (captured.length === 1) {
    const [kc, kr] = captured[0];
    const nb = NBRS.map(([dx, dy]) => [kc + dx, kr + dy]).filter(([x, y]) => inB(size, x, y));
    if (nb.length === 4 && nb.every(([x, y]) => mine(x, y))) found.add("ponnuki");
  }

  /* Cut: the stone landed between two enemy stones that were holding hands
     diagonally and are now separate chains. Two orthogonal enemy neighbours,
     diagonal to each other, in different chains - which is the whole of what a
     cut is, and why filling one's own cutting point is called a connection. */
  const enemyNb = NBRS.map(([dx, dy]) => [c + dx, r + dy]).filter(([x, y]) => at(x, y) === enemy);
  if (enemyNb.length >= 2) {
    const chainKey = (x, y) => [...chainAt(board, x, y).stones].map(([a, b]) => idx(size, a, b)).sort((p, q) => p - q)[0];
    outer:
    for (let i = 0; i < enemyNb.length; i++) {
      for (let j = i + 1; j < enemyNb.length; j++) {
        const a = enemyNb[i], b = enemyNb[j];
        // Diagonal to each other: they differ on both axes. Opposite neighbours do not.
        if (a[0] === b[0] || a[1] === b[1]) continue;
        if (chainKey(a[0], a[1]) !== chainKey(b[0], b[1])) { found.add("cut"); break outer; }
      }
    }
  }

  /* Hane: reaching around the head of an enemy stone. The move is diagonal to
     one of my own stones and touches an enemy stone that touches that stone too
     - the bend around a contact fight, which is what the word means. */
  for (const [dx, dy] of DIAGS) {
    const x = c + dx, y = r + dy;
    if (!mine(x, y)) continue;
    const shared = [[c, y], [x, r]].filter(([px, py]) => at(px, py) === enemy);
    if (shared.length) { found.add("hane"); break; }
  }

  // Attachment (tsuke): touching an enemy stone with nothing of mine adjacent.
  if (enemyNb.length > 0 && !NBRS.some(([dx, dy]) => mine(c + dx, r + dy))) found.add("attachment");

  /* Shoulder hit: shoulder to shoulder, diagonally, with no contact at all. It
     is only a shoulder hit against a stone that has somewhere to be pushed -
     the third or fourth line - which is where the move is played in practice. */
  if (enemyNb.length === 0) {
    for (const [dx, dy] of DIAGS) {
      const x = c + dx, y = r + dy;
      if (at(x, y) !== enemy) continue;
      const line = Math.min(x, y, size - 1 - x, size - 1 - y) + 1;
      if (line >= 3 && line <= 4) { found.add("shoulder-hit"); break; }
    }
  }

  /* ---- what the move did for me ---- */

  /* Bamboo joint: my new stone and one of my own make a pair, and two points
     across, parallel to it, stands another pair of mine with both connecting
     points empty. Neither point can be taken away, which is the whole virtue of
     the shape: unlike the tiger's mouth there is nothing to throw in. */
  joint:
  for (const [dx, dy] of NBRS) {
    const px = c + dx, py = r + dy;              // the partner making my pair
    if (!mine(px, py)) continue;
    const perp = dx === 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
    for (const [ex, ey] of perp) {
      const a = [c + ex * 2, r + ey * 2], b = [px + ex * 2, py + ey * 2];
      if (!mine(a[0], a[1]) || !mine(b[0], b[1])) continue;
      if (!empty(c + ex, r + ey) || !empty(px + ex, py + ey)) continue;
      found.add("bamboo-joint");
      break joint;
    }
  }

  // One-point jump (ikken tobi): my stone two away in a straight line, the point
  // between it and me empty. The connection every player learns second.
  for (const [dx, dy] of NBRS) {
    const x = c + dx * 2, y = r + dy * 2;
    if (mine(x, y) && clear([c, r], [x, y])) { found.add("one-point-jump"); break; }
  }

  // Knight's move (keima) and the large one: the waist must be empty, both points
  // of it, or the stones are not related at all.
  const jumps = [
    ["knights-move", [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]],
    ["large-knights-move", [[1, 3], [3, 1], [-1, 3], [-3, 1], [1, -3], [3, -1], [-1, -3], [-3, -1]]],
  ];
  for (const [id, offsets] of jumps) {
    for (const [dx, dy] of offsets) {
      const x = c + dx, y = r + dy;
      if (!mine(x, y)) continue;
      /* The waist: the points of the rectangle the two stones span whose
         coordinate along the long axis lies strictly between them. For the
         knight's move that is the famous pair; for the large one it is four.
         The short axis is only one step, so both of its files are waist. */
      const long = Math.abs(dx) > Math.abs(dy) ? 0 : 1;
      const step = long === 0 ? Math.sign(dx) : Math.sign(dy);
      const waist = [];
      for (let i = 1; i < Math.abs(long === 0 ? dx : dy); i++) {
        for (const short of [0, long === 0 ? dy : dx]) {
          waist.push(long === 0 ? [c + step * i, r + short] : [c + short, r + step * i]);
        }
      }
      if (waist.every(([wx, wy]) => empty(wx, wy))) { found.add(id); break; }
    }
  }

  /* Two-space extension: my stone three away along a line, both points between
     empty, and both stones low enough that the shape is a base rather than a
     loose reach across the middle. The extension that makes a group hard to
     take the eyes from. */
  const lineAt = (x, y) => Math.min(x, y, size - 1 - x, size - 1 - y) + 1;
  for (const [dx, dy] of NBRS) {
    const x = c + dx * 3, y = r + dy * 3;
    if (!mine(x, y) || !clear([c, r], [x, y])) continue;
    if (lineAt(c, r) <= 4 && lineAt(x, y) <= 4) { found.add("two-space-extension"); break; }
  }

  // Solid extension (nobi) and the diagonal (kosumi): the two slowest, strongest
  // ways of saying "these two stones are one thing".
  if (NBRS.some(([dx, dy]) => mine(c + dx, r + dy))) found.add("solid-extension");
  if (!NBRS.some(([dx, dy]) => mine(c + dx, r + dy)) && DIAGS.some(([dx, dy]) => mine(c + dx, r + dy))) {
    found.add("diagonal");
  }

  return RELATIONS.filter((id) => found.has(id));
}
