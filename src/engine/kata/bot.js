/* ----------------------- HUMAN-STYLE HOUSE PLAYER -----------------------
   The seam the Game view calls. Given a record and a persona's profile it asks the
   human network what a player of that rank would do and samples a move. Returns
   null when the network is unavailable so the caller can fall back to the
   heuristic house player and the game never stalls. */

import { humanPolicy } from "./net.js";
import { choosePolicyMove } from "./policy.js";
import { RANKS } from "./features.js";

/** Snap a rank label like "23k" or "9d" onto the range the network was trained on. */
export function clampRank(label) {
  if (!label) return undefined;
  if (RANKS.includes(label)) return label;
  const m = /^(\d+)([kd])$/.exec(label);
  if (!m) return undefined;
  return m[2] === "k" ? "20k" : "9d";
}

/** @param {object} rec       GameRecord in the "playing" phase
 *  @param {object} profile   { rank, oppRank?, preAZ?, temperature? }
 *  @returns {Promise<{move: [number,number]|null, prob: number, top: object[], value: number[]} | null>} */
export async function kataChooseMoveForRecord(rec, profile) {
  if (rec.phase !== "playing") return null;
  const oppRank = clampRank(profile.oppRank) ?? profile.rank;
  const res = await humanPolicy(rec, { ...profile, oppRank });
  if (!res) return null;
  const pick = choosePolicyMove(res.logits, rec, { temperature: profile.temperature ?? 0.8 });
  return { ...pick, value: res.value };
}
