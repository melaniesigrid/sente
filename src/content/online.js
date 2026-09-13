/* ----------------------- ONLINE PLAY (content) -----------------------
   Small pure helpers for how the server's numbers are shown.

   Whether a rating is still settling is one question with one answer, so it is
   asked of the engine rather than restated here. This file used to carry its own
   threshold of 150, which drifted when the engine settled on 160: a player whose
   deviation sat between the two read as provisional in this text and as settled
   on the rank badge beside it, in the same row of the same ladder. */
import { rankOf } from "./rank.js";
import { isProvisional, GLICKO } from "../engine/index.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

/** The deviation above which a rank is a guess. The engine owns the number. */
export const PROVISIONAL_RD = GLICKO.provisionalRd;

/** "12k" for a settled rating, "12k? provisional" while it is still settling. */
export function provisionalText(player, t = EN) {
  const rank = rankOf(player.rating);
  return t(isProvisional(player.rd) ? "online.provisional" : "online.settled", { rank, rd: player.rd });
}
