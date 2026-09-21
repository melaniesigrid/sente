/* ----------------------- CARRYING THE HOUSE GAMES -----------------------
   The rating is the account's, and a house game is rated onto it as it is
   played (`api.houseGame`). What about the games played before the account
   was there, or before the account carried the rating at all? The device
   kept them: the ring buffer in telemetry.js holds the last fifty games
   against the house players, and for each rated one it holds exactly what a
   rating needs, which house player, at what rank, with how many stones, and
   who won. So they are replayed, once, onto the account, in the order they
   were played, through the same route a live game uses.

   Once means once per account on this device. The mark is kept beside the
   log, not on the account, because it is about this device's log; another
   device carries its own. A new game played after the carry is posted live,
   so nothing is counted twice. Nothing here can carry a coached game, a
   duel, a master study or a jigo, for the same reason none of them moved the
   device's own rating.

   Pure except for `carried`, `markCarried` and `carryHouseGames`. */
import { ratingOfRank, rankWithHandicap } from "../content/rank.js";
import { GLICKO } from "../engine/index.js";
import { api, serverEnabled } from "../net/api.js";
import { loadTelemetry } from "./telemetry.js";
import { saveAccount } from "./account.js";

export const CARRIED_KEY = "sente-carried-v1";
/** The house player's deviation, the same one Game.jsx rates against. */
export const HOUSE_RD = GLICKO.minRd;

/** The rated games in a log as the server takes them: `{ opponent: { rating,
 *  rd }, score }` each, oldest first. One rank per handicap stone, exactly as
 *  the live game rates it. A game with no rank on record cannot be rated and
 *  is left out. */
export function houseGamesFrom(log) {
  const out = [];
  for (const g of log ?? []) {
    if (!g || g.kind !== "rated" || g.won === null || typeof g.botRank !== "string") continue;
    const rating = ratingOfRank(rankWithHandicap(g.botRank, g.handicap));
    if (!Number.isFinite(rating)) continue;
    out.push({ opponent: { rating: Math.round(rating), rd: HOUSE_RD }, score: g.won ? 1 : 0 });
  }
  return out;
}

const storage = () => { try { return globalThis.localStorage || null; } catch { return null; } };
const readMarks = () => {
  try { const v = JSON.parse(storage()?.getItem(CARRIED_KEY) ?? "{}"); return v && typeof v === "object" ? v : {}; }
  catch { return {}; }
};

/** Whether this device has already told that account its games. */
export const carried = (playerId) => !!readMarks()[playerId];
export function markCarried(playerId) {
  try { storage()?.setItem(CARRIED_KEY, JSON.stringify({ ...readMarks(), [playerId]: Date.now() })); } catch { /* nothing to do */ }
}

/** Carry the device's house games onto the account, once. Answers the player
 *  as the server now holds them when something was carried, or null when
 *  nothing was: no server, already carried, no games, or a send that failed
 *  (in which case nothing is marked, and the next visit tries again). */
export async function carryHouseGames(account, { log = loadTelemetry() } = {}) {
  if (!serverEnabled() || !account?.player?.id) return null;
  const id = account.player.id;
  if (carried(id)) return null;
  const games = houseGamesFrom(log);
  if (!games.length) { markCarried(id); return null; }
  try {
    const player = await api.houseGames(account.token, games);
    markCarried(id);
    saveAccount({ token: account.token, player });
    return player;
  } catch { return null; }
}
