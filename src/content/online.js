/* ----------------------- ONLINE PLAY (content) -----------------------
   Small pure helpers for how the server's numbers are shown. */
import { rankOf } from "./rank.js";

/** A deviation this wide means the rating is still settling. Mirrors the server. */
export const PROVISIONAL_RD = 150;

/** "12k" for a settled rating, "12k?" while provisional. */
export function provisionalText(player) {
  const label = rankOf(player.rating);
  return player.rd > PROVISIONAL_RD ? `${label}? provisional` : `${label} · ±${player.rd}`;
}
