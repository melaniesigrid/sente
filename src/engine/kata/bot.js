/* ----------------------- HUMAN-STYLE HOUSE PLAYER -----------------------
   The seam the Game view calls. Given a record and a persona's profile it asks the
   human network what a player of that rank would do and samples a move. Returns
   null when the network is unavailable so the caller can fall back to the
   heuristic house player and the game never stalls. */

import { humanPolicy } from "./net.js";
import { choosePolicyMove } from "./policy.js";
import { RANKS } from "./features.js";
import { createRng, positionSeed } from "../rng.js";

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

/** @param {object} rec       GameRecord in the "playing" phase
 *  @param {object} profile   { rank, oppRank?, preAZ?, temperature?, seed? } or, for a
 *                            master, { pro: true, year, temperature?, seed? }; `pro` wins
 *                            over the rank the lobby spreads in
 *  With `seed`, the sample is drawn from a generator seeded by (seed, position hash), so
 *  the same seed and position give the same move on every device: a shared daily game.
 *  @returns {Promise<{move: [number,number]|null, prob: number, top: object[], value: number[]} | null>} */
export async function kataChooseMoveForRecord(rec, profile) {
  if (rec.phase !== "playing") return null;
  const oppRank = clampRank(profile.oppRank) ?? profile.rank;
  const res = await humanPolicy(rec, { ...profile, oppRank });
  if (!res) return null;
  const rng = profile.seed !== undefined
    ? createRng(positionSeed(profile.seed, rec.hashes ? rec.hashes[rec.hashes.length - 1] : 0))
    : undefined;
  const pick = choosePolicyMove(res.logits, rec, { temperature: profile.temperature ?? 0.8, floor: profile.floor ?? 0.02, rng });
  return { ...pick, value: res.value };
}
