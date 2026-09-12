/* ----------------------- WALKING A GAME PAST THE NETWORK -----------------------
   The graph's source. Every position the game stood in is handed to the human
   network once, and its value head becomes one point on the curve.

   Three things this file is careful about.

   It asks at one strength, not at the players'. The network is rank-conditioned:
   ask it at 20k and it answers what a 20k believes about the position, which is a
   fine way to pick a 20k's move and a poor way to say who was winning. Analysis
   asks at `ANALYSIS_RANK` so the whole graph is one opinion held to one standard,
   and the view says whose opinion it is.

   It walks the game forward rather than replaying it from the start each time.
   `atMove` rebuilds a position from the opening every time it is called, which is
   right for scrubbing and quadratic for a whole game.

   It yields. A run is one uninterruptible WebAssembly call of up to a couple of
   seconds even in its own thread, and a long game is hundreds of them, so the
   caller gets each point as it lands and can stop the walk at any position. A
   half-drawn graph of the first forty moves is worth something; a frozen page for
   four minutes is not. */

import { play, pass, createGame } from "../record.js";
import { playedMoves } from "../review.js";
import { humanPolicy } from "./net.js";
import { choosePolicyMove } from "./policy.js";
import { winRateForBlack } from "../analysis.js";

/** The strength the network is asked at. Dan-level, and the same for every game, so
 *  two graphs can be compared with each other. */
export const ANALYSIS_RANK = "9d";

/** Analysis of the same moves is the same answer, and on 19x19 it is minutes of
 *  work, so a game already walked is not walked again while the page is open.
 *  Session-lived and in memory only: nothing here is written to disk.
 *
 *  The key has to name everything the answer depends on, not just the moves. Two
 *  9x9 games with the same two moves and different setup stones are different games,
 *  and an opened SGF can carry setup stones with no handicap at all; a key that
 *  missed them would draw one game's graph over the other with nothing on screen to
 *  say so. It is the whole string rather than a hash of it, because a hash here buys
 *  nothing and gives away a collision. */
const done = new Map();
const cacheKey = (rec, rank) =>
  [rank, rec.size, rec.komi, rec.handicap, rec.rules, rec.firstToPlay,
    (rec.setup?.b ?? []).map(([c, r]) => `${c},${r}`).join(","),
    (rec.setup?.w ?? []).map(([c, r]) => `${c},${r}`).join(","),
    playedMoves(rec).map((m) => (m.type === "pass" ? "p" : `${m.c},${m.r}`)).join(";"),
  ].join("|");

/** What is kept is whatever was walked, whole game or not. A walk is strictly in move
 *  order, so a stopped one leaves the positions 0..k and never a gap; keeping it is
 *  what lets somebody leave review after four minutes of 19x19 and come back to it.
 *  A shorter walk never overwrites a longer one. */
function remember(rec, rank, points) {
  if (!points.length) return;
  const key = cacheKey(rec, rank);
  const had = done.get(key);
  if (!had || had.length < points.length) done.set(key, points);
}

/** Points already known for this record, oldest first, or null. Contiguous from the
 *  opening position, and possibly short of the end. */
export const cachedAnalysis = (rec, rank = ANALYSIS_RANK) => done.get(cacheKey(rec, rank)) ?? null;

/** The positions of a game, in order, including the opening position. Built forward,
 *  each from the one before, so a 300 move game replays 300 moves and not 45,000. */
export function positions(rec) {
  let cur = createGame({
    size: rec.size, rules: rec.rules, komi: rec.komi, handicap: rec.handicap,
    clock: rec.clock, players: rec.players, setup: rec.setup, toPlay: rec.firstToPlay,
  });
  const out = [cur];
  for (const mv of playedMoves(rec)) {
    cur = mv.type === "pass" ? pass(cur, mv.color) : play(cur, mv.c, mv.r, mv.color);
    out.push(cur);
  }
  return out;
}

/** Walk `rec` past the network.
 *
 *  @param {object} rec        a finished or unfinished GameRecord
 *  @param {object} [o]
 *  @param {(point, i, total) => void} [o.onPoint]  called as each point lands
 *  @param {() => boolean} [o.stopped]  asked before every run; true abandons the walk
 *  @param {object[]} [o.have] points from an earlier, stopped walk; these positions
 *                             are not asked about again (the cache is consulted for
 *                             the same thing when this is empty)
 *  @param {string} [o.rank]   strength to ask at
 *  @returns {Promise<{points: object[], complete: boolean, reason?: string}>}
 *    `complete` is false when the walk was stopped or the network was unavailable,
 *    and the points gathered so far are still returned. */
export async function analyseGame(rec, o = {}) {
  const { onPoint, stopped, have = [], rank = ANALYSIS_RANK } = o;
  const list = positions(rec);
  const cached = done.get(cacheKey(rec, rank));
  if (cached && cached.length === list.length) {
    cached.forEach((p, i) => onPoint && onPoint(p, i, cached.length));
    return { points: cached, complete: true };
  }
  const moves = playedMoves(rec);
  const profile = { rank, oppRank: rank };
  // Anything the caller already has, plus anything left over from an earlier walk.
  const known = have.length ? have : (cached ?? []);
  const points = [];
  for (let i = 0; i < list.length; i++) {
    if (stopped && stopped()) {
      remember(rec, rank, points);
      return { points, complete: false, reason: "stopped" };
    }
    // A walk that was stopped and started again picks up where it left off rather
    // than paying for the opening twice.
    const already = known.find((q) => q.move === i);
    if (already) {
      points.push(already);
      if (onPoint) onPoint(already, i, list.length);
      continue;
    }
    const pos = list[i];
    // `humanPolicy` answers null when the network cannot be loaded at all, and throws
    // if a run itself fails: a worker that died, or memory that ran out on a long
    // 19x19 walk. Both leave the reader with what was drawn rather than nothing.
    let res;
    try {
      res = await humanPolicy(pos, profile);
    } catch (e) {
      console.warn(`joseki: the network stopped answering during analysis (${e && e.message ? e.message : e})`);
      res = null;
    }
    if (!res) {
      remember(rec, rank, points);
      return { points, complete: false, reason: "unavailable" };
    }
    const { black, noResult } = winRateForBlack(res.value, pos.toPlay);
    // The network's own first choice here, for "what would it have played". At
    // temperature 0 this is the top move and not a sample of the policy; `rng` is
    // pinned so that a tie between two equal moves breaks the same way every time,
    // which is what makes it "the" top move rather than one of them. A position with
    // no legal move left gives a pass, which is null and simply shows no ring. Nothing
    // is caught here: the one thing that throws is a logit count that does not match
    // the board, and that is a bug worth hearing about rather than a missing ring.
    const best = choosePolicyMove(res.logits, pos, { temperature: 0, floor: 0.02, rng: () => 0 }).move;
    const mv = moves[i - 1];
    const point = {
      move: i,
      black,
      noResult,
      color: mv ? mv.color : null,
      played: mv && mv.type === "play" ? { c: mv.c, r: mv.r } : null,
      best,
    };
    points.push(point);
    if (onPoint) onPoint(point, i, list.length);
  }
  remember(rec, rank, points);
  return { points, complete: true };
}
