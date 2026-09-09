/* ----------------------- HUMAN-STYLE HOUSE PLAYER -----------------------
   The seam the Game view calls. Given a record and a persona's profile it asks the
   human network what a player of that rank would do and samples a move. Returns
   null when the network is unavailable so the caller can fall back to the
   heuristic house player and the game never stalls.

   A master (`profile.master`, the loaded masters JSON) plays his opening book
   literally when the position is in it, then the strong-player-of-his-year profile
   with a small lean his way on the network's own shortlist, if the eval let the
   lean ship (`style.lambda` above zero). Masters are 19x19 only; a master on
   another size is a `StyleDataError`, never a downgrade. */

import { humanPolicy } from "./net.js";
import { choosePolicyMove } from "./policy.js";
import { RANKS } from "./features.js";
import { createRng, positionSeed } from "../rng.js";
import { tryPlay } from "../rules.js";
import { StyleDataError, bookEntry, sampleBook } from "../style/master.js";
import { stylePrior } from "../style/prior.js";

/** The network profile for any ladder rank. The network stops at 20k; players
 *  weaker than that get the 20k policy sampled more loosely, one notch of
 *  temperature per rank, so 25k really is softer than 20k. */
export function profileForRank(label, temperature = 0.8) {
  const m = /^(\d+)([kd])$/.exec(label ?? "");
  if (m && m[2] === "k" && parseInt(m[1], 10) > 20) {
    const below = parseInt(m[1], 10) - 20;
    return { rank: "20k", temperature: Math.min(2, temperature + 0.25 * below), floor: 0.005 };
  }
  return { rank: clampRank(label) ?? "20k", temperature };
}

/** Snap a rank label like "23k" or "9d" onto the range the network was trained on. */
export function clampRank(label) {
  if (!label) return undefined;
  if (RANKS.includes(label)) return label;
  const m = /^(\d+)([kd])$/.exec(label);
  if (!m) return undefined;
  return m[2] === "k" ? "20k" : "9d";
}

/** The year a master's profile plays as: the JSON's `year`, else the middle of his span. */
export const masterYear = (master) => master.year ?? Math.round((master.years[0] + master.years[1]) / 2);

/** @param {object} rec       GameRecord in the "playing" phase
 *  @param {object} profile   { rank, oppRank?, preAZ?, temperature?, seed? } or, for a
 *                            master, { master, temperature?, seed?, lean? } where `master`
 *                            is the loaded masters JSON and `lean` (λ) overrides the
 *                            eval's `style.lambda`; 0 switches the prior off
 *  With `seed`, the sample is drawn from a generator seeded by (seed, position hash), so
 *  the same seed and position give the same move on every device: a shared daily game.
 *  @returns {Promise<{move: [number,number]|null, prob: number, top: object[], value: number[]|null, source?: string} | null>} */
export async function kataChooseMoveForRecord(rec, profile) {
  if (rec.phase !== "playing") return null;
  if (profile.master) return masterMove(rec, profile);
  const oppRank = clampRank(profile.oppRank) ?? profile.rank;
  const res = await humanPolicy(rec, { ...profile, oppRank });
  if (!res) return null;
  const rng = seededRng(profile.seed, rec);
  const pick = choosePolicyMove(res.logits, rec, { temperature: profile.temperature ?? 0.8, floor: profile.floor ?? 0.02, rng });
  return { ...pick, value: res.value };
}

const seededRng = (seed, rec, hash = rec.hashes ? rec.hashes[rec.hashes.length - 1] : 0) =>
  seed !== undefined ? createRng(positionSeed(seed, hash)) : undefined;

async function masterMove(rec, profile) {
  const master = profile.master;
  const N = rec.board.size;
  if (N !== 19) throw new StyleDataError(`${master.id} plays 19x19 only, not ${N}x${N}`);

  const entry = bookEntry(master, rec);
  if (entry) {
    const legal = entry.moves.filter((m) => tryPlay(rec.board, m.c, m.r, rec.toPlay, {
      koPoint: rec.koPoint, history: rec.hashes, hash: rec.hashes[rec.hashes.length - 1],
    }).ok);
    if (legal.length) {
      // Seeded by the canonical hash so every orientation of a duel draws alike.
      const rng = seededRng(profile.seed, rec, entry.hash) ?? Math.random;
      const pick = sampleBook(legal, rng);
      const total = legal.reduce((s, m) => s + m.n, 0);
      return {
        move: [pick.c, pick.r], prob: pick.prob,
        top: legal.slice(0, 5).map((m) => ({ move: [m.c, m.r], prob: m.n / total })),
        value: null, source: "book",
      };
    }
  }

  const res = await humanPolicy(rec, { pro: true, year: masterYear(master) });
  if (!res) return null;
  const lambda = profile.lean ?? master.style.lambda ?? 0;
  const bias = lambda > 0 ? stylePrior(master.style, rec, { lambda, clamp: master.style.clamp }) : null;
  const rng = seededRng(profile.seed, rec);
  const pick = choosePolicyMove(res.logits, rec, {
    temperature: profile.temperature ?? 0.8, floor: profile.floor ?? 0.02, rng, bias: bias ?? undefined,
  });
  return { ...pick, value: res.value, source: bias ? "network+prior" : "network" };
}
