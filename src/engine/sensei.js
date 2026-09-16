/* ----------------------- THE TRAINER'S RULES (pure) -----------------------
   A trainer is a house player with two habits the others do not have: it gives
   you something on purpose now and then, and it grades the game afterwards. Both
   are rules about a game, so both are here and not in a view or a content file.

   The gift. Every so often the trainer plays a move the network thought clearly
   worse than its first choice, and says nothing about which one. Whether you
   punished it is read off the evaluation afterwards, and the review names every
   one. The gift is never the top move played badly by accident: it is drawn from
   the network's own shortlist, so it is a move a player of that rank might really
   play, only a worse one than the trainer would have chosen.

   The grade. The evaluation points are the same shape `analyseGame` produces, one
   per position, so the review is arithmetic on the same list the graph is drawn
   from, and the two can never disagree. */

import { swings, turningPoints, steadiness } from "./analysis.js";
import { phaseOf } from "./explain.js";

/** The trainer's habits, named so they can be argued about. */
export const TRAINER = {
  /** Its own moves before the first gift can come. */
  firstGiftAfter: 6,
  /** Its own moves between two gifts, at the least. */
  minGap: 5,
  /** Chance of a gift on any eligible move of its own. */
  chance: 0.22,
  /** A gift is at most this share as likely as the top move, so it is clearly worse... */
  worseBy: 0.4,
  /** ...and at least this share, so it is still a move somebody would play. */
  noWorseThan: 0.04,
  /** A gift counts as taken when your reply kept at least this much of what it gave. */
  keptShare: 0.5,
};

/* ----------------------- HOW HE TEACHES -----------------------
   One trainer, several ways of running a lesson. A mode is a set of rules about
   a game - how far above you he sits, how often he gives something away, whose
   moves he writes a note on, and how many stones you start with - so it lives
   here and not in a view. The words for each mode are his, and they are in
   `src/content/sensei.js`.

   `notes` is whose moves get a sentence while the game is running:
     "all"     his and yours, which is the lesson he has always given
     "yours"   only yours, so his own reading stays hidden
     "none"    nothing until the review, which is the test
   `teach` is whether the shape course runs during the game; "always" asks for a
   shape on every move it can name, which is what a drill is. */
export const TEACHING_MODES = {
  /** The lesson. Every move explained, the usual gift rate, two ranks above you. */
  walk: { rankStep: 2, giftChance: TRAINER.chance, notes: "all", handicap: 0, teach: true },
  /** The drill. He plays closer to your strength and names the shape every time. */
  shape: { rankStep: 1, giftChance: 0, notes: "all", handicap: 0, teach: "always" },
  /** The hunt. He gives away twice as much and explains none of it. */
  hunt: { rankStep: 2, giftChance: 0.45, notes: "yours", handicap: 0, teach: false },
  /** The spar. No gifts, no notes on his own moves, a rank harder. */
  spar: { rankStep: 3, giftChance: 0, notes: "yours", handicap: 0, teach: false },
  /** The test. Nothing said until the review, and he plays it straight. */
  test: { rankStep: 3, giftChance: 0, notes: "none", handicap: 0, teach: false },
  /** The teaching game. Four stones in front, and he plays far above you. */
  teaching: { rankStep: 6, giftChance: 0, notes: "all", handicap: 4, teach: true },
};

export const MODE_IDS = Object.keys(TEACHING_MODES);
export const DEFAULT_MODE = "walk";

/** The rules of a mode, falling back to the lesson for anything unknown, so a
 *  stored mode from an older version can never leave the table without rules. */
export const modeRules = (id) => TEACHING_MODES[id] ?? TEACHING_MODES[DEFAULT_MODE];

/** Whether the trainer should give something on this move of its own.
 *  @param {object} o
 *  @param {number} o.ownMoves     how many moves the trainer has played so far
 *  @param {number} o.moveNumber   the number this move will have
 *  @param {number} o.size         board size
 *  @param {number|null} o.lastGift  own-move count at the last gift, or null
 *  @param {() => number} o.rng
 *  @param {number} o.chance    the mode's gift rate; zero means never */
export function giftDue({ ownMoves, moveNumber, size, lastGift = null, rng = Math.random, chance = TRAINER.chance }) {
  // A mode that gives nothing away never reaches the dice.
  if (!(chance > 0)) return false;
  if (ownMoves < TRAINER.firstGiftAfter) return false;
  if (lastGift !== null && ownMoves - lastGift < TRAINER.minGap) return false;
  // Nothing in the endgame: a bad endgame move is a point or two and teaches little.
  if (phaseOf(moveNumber, size) === "endgame") return false;
  return rng() < chance;
}

/** A worse move off the network's shortlist, or null when the list has nothing
 *  clearly worse yet still playable. `top` is best first, as `choosePolicyMove`
 *  reports it; a pass is never a gift. */
export function pickGift(top, rng = Math.random) {
  if (!top || top.length < 2) return null;
  const best = top[0];
  if (!best.move) return null;
  const cands = top.slice(1).filter((t) =>
    t.move && t.prob <= best.prob * TRAINER.worseBy && t.prob >= best.prob * TRAINER.noWorseThan);
  if (!cands.length) return null;
  const pick = cands[Math.min(cands.length - 1, Math.floor(rng() * cands.length))];
  return { move: pick.move, prob: pick.prob, best: best.move, bestProb: best.prob };
}

const at = (points, n) => points.find((p) => p.move === n) ?? null;

/** What a gift at move `m` by `color` was worth, and whether the reply took it.
 *  Read from the evaluation: the swing the gift cost its giver, and how much of
 *  that the reply held on to. Null when the positions around it were not looked at. */
export function giftOutcome(points, m, color) {
  const before = at(points, m - 1), after = at(points, m), reply = at(points, m + 1);
  if (!before || !after) return null;
  const mine = (p) => (color === "b" ? p.black : 1 - p.black);
  const gift = mine(before) - mine(after);
  if (!reply) return { gift, kept: null };
  const held = mine(before) - mine(reply);
  return { gift, kept: gift > 0 ? held >= gift * TRAINER.keptShare : null };
}

/** The trainer's report on a finished game, for `you` (the colour being trained).
 *  @param {object[]} points   evaluation points, as `analyseGame` produces them
 *  @param {object[]} gifts    [{ move, best }] the trainer gave on purpose
 *  @param {"b"|"w"} you
 *  @returns {{ turns, gifts, steady, worst, gained, looked }} */
export function trainerReport(points, gifts, you = "b") {
  const looked = points.length;
  const yourTurns = turningPoints(points, { limit: 3 }).filter((s) => s.color === you);
  const mine = swings(points).filter((s) => s.color === you);
  const gained = mine.filter((s) => s.cost <= -0.08).sort((a, b) => a.cost - b.cost).slice(0, 2);
  const steady = steadiness(points)[you];
  const trainer = you === "b" ? "w" : "b";
  const graded = gifts.map((g) => ({ ...g, ...(giftOutcome(points, g.move, trainer) ?? { gift: null, kept: null }) }));
  return {
    looked,
    turns: yourTurns,
    gained,
    steady,
    worst: steady ? steady.worst : null,
    gifts: graded,
  };
}

/* ----------------------- WHAT HE REMEMBERS -----------------------
   A trainer who tracks development needs a memory that is arithmetic, not
   anecdote. Each of your moves has facts (`describeMove`) and a cost (the swing
   between the two positions around it); grouped into areas, a game becomes a
   handful of numbers, and a run of games becomes a trend. The areas are chosen so
   that every one of them is decided by something the board holds:

     opening    what a stone cost in the opening phase
     fights     what a contact move cost in the middle game
     shape      what a move that made a poor shape or a self-atari cost
     direction  what a quiet, non-contact middle-game move cost: where to play
     endgame    what a stone cost in the endgame
     reading    what a move cost when his reply captured something */

export const AREAS = ["opening", "fights", "shape", "direction", "endgame", "reading"];

/** Which areas a move of yours belongs to, from its facts and what came next.
 *  `nextCaptured` is how many stones his reply took. A move can be in several. */
export function areasOf(f, nextCaptured = 0) {
  if (!f || f.pass) return [];
  const out = [];
  if (f.phase === "opening") out.push("opening");
  if (f.phase === "endgame") out.push("endgame");
  if (f.phase === "middle") out.push(f.contact > 0 ? "fights" : "direction");
  if (f.selfAtari || f.shapes.includes("empty-triangle") || f.shapes.includes("dumpling")) out.push("shape");
  if (nextCaptured > 0 || f.selfAtari) out.push("reading");
  return out;
}

/** One game as numbers. `facts` maps your move numbers to their facts; `points`
 *  are the evaluation points. Returns null when nothing of yours was graded. */
export function gameSummary(points, facts, you = "b") {
  const mine = swings(points).filter((s) => s.color === you);
  if (!mine.length) return null;
  const byArea = Object.fromEntries(AREAS.map((a) => [a, { n: 0, cost: 0 }]));
  let selfAtari = 0;
  for (const s of mine) {
    const f = facts[s.move];
    if (!f) continue;
    if (f.selfAtari) selfAtari++;
    const next = facts[s.move + 1];   // not yours; his capture count rides on his own facts when given
    for (const a of areasOf(f, next && next.captured ? next.captured : 0)) {
      byArea[a].n++;
      byArea[a].cost += Math.max(0, s.cost);
    }
  }
  const areas = {};
  for (const a of AREAS) areas[a] = { n: byArea[a].n, mean: byArea[a].n ? byArea[a].cost / byArea[a].n : null };
  const lost = mine.map((s) => Math.max(0, s.cost));
  const worst = mine.reduce((a, s) => (s.cost > a.cost ? s : a));
  return {
    moves: mine.length,
    mean: lost.reduce((a, b) => a + b, 0) / lost.length,
    worst: worst.cost > 0 ? { move: worst.move, cost: worst.cost } : null,
    selfAtari,
    areas,
  };
}

/** The mean cost per area over a run of summaries, weighting by moves. Areas with
 *  fewer than `min` moves across the run are null: not enough to say. */
export function areaMeans(summaries, min = 4) {
  const out = {};
  for (const a of AREAS) {
    let n = 0, cost = 0;
    for (const g of summaries) {
      const x = g && g.areas && g.areas[a];
      if (!x || x.mean === null) continue;
      n += x.n; cost += x.mean * x.n;
    }
    out[a] = n >= min ? cost / n : null;
  }
  return out;
}

/** Where he should look next: the area that has cost you most over the last few
 *  games, or null while there is not enough to say. */
export function focusFor(summaries, last = 5) {
  const means = areaMeans(summaries.slice(-last));
  let best = null;
  for (const a of AREAS) {
    if (means[a] === null) continue;
    if (!best || means[a] > means[best]) best = a;
  }
  return best;
}

/** How each area moved: the last `n` games against the `n` before them. A lower
 *  cost is "up". Null where either half has too little to compare. `step` is how
 *  much of the win rate per move counts as movement rather than noise. */
export function trend(summaries, n = 5, step = 0.01) {
  const recent = summaries.slice(-n), before = summaries.slice(-2 * n, -n);
  const a = areaMeans(recent), b = areaMeans(before);
  const out = {};
  for (const k of AREAS) {
    if (a[k] === null || b[k] === null) { out[k] = null; continue; }
    const d = b[k] - a[k];
    out[k] = d > step ? "up" : d < -step ? "down" : "flat";
  }
  const overall = (list) => {
    const xs = list.filter((g) => g && typeof g.mean === "number");
    return xs.length ? xs.reduce((s, g) => s + g.mean, 0) / xs.length : null;
  };
  const ra = overall(recent), rb = overall(before);
  out.overall = ra === null || rb === null ? null : rb - ra > step ? "up" : ra - rb > step ? "down" : "flat";
  return out;
}
