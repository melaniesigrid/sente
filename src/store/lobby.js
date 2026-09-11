/* ----------------------- LOBBY PREFERENCES -----------------------
   The table the player last set up: rules, board size, handicap, komi and clock.
   A device preference, not part of the profile, so it never travels with a
   rating. Stored JSON is untrusted and falls back per field. 19x19 is the
   default because it is the board most of the world plays on.

   `komi` is null until the player touches it, meaning "whatever this table is
   owed" - the engine's default for the ruleset, board and handicap. Setting it
   is a deliberate act and survives a change of board or ruleset, because a
   player who has chosen 4.5 has chosen it for a reason.

   `rank` is null on the same terms, and means "my level, whatever it is now".
   A remembered rank would otherwise freeze a player at the strength they were
   the first time they touched the stepper, and a rating that moves is the
   whole point of having one. Step it and the choice is kept, because a player
   who has asked for 5k has asked for it on purpose. */
import { SIZES, isRulesId, DEFAULT_RULES } from "../engine/index.js";
import { CLOCK_PRESETS } from "../content/clockFace.js";
import { RANK_LADDER } from "../content/rank.js";

export const LOBBY_KEY = "sente-lobby";
export const HANDICAPS = [0, 2, 3, 4, 5, 6, 7, 8, 9];
/** Every komi the stepper can reach: half points, and the whole numbers that
 *  New Zealand rules use, where a drawn game is allowed. */
export const KOMI_STEPS = Array.from({ length: 20 }, (_, i) => i / 2);
export const defaultLobby = {
  rules: DEFAULT_RULES, size: 19, handicap: 0, komi: null, clock: "none", rank: null,
};

const defaultStorage = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

/** Coerce anything into a valid table setup. */
export function sanitizeLobby(raw) {
  const out = { ...defaultLobby };
  if (!raw || typeof raw !== "object") return out;
  if (SIZES.includes(raw.size)) out.size = raw.size;
  if (HANDICAPS.includes(raw.handicap)) out.handicap = raw.handicap;
  if (CLOCK_PRESETS.some((p) => p.id === raw.clock)) out.clock = raw.clock;
  if (isRulesId(raw.rules)) out.rules = raw.rules;
  if (KOMI_STEPS.includes(raw.komi)) out.komi = raw.komi;
  if (RANK_LADDER.includes(raw.rank)) out.rank = raw.rank;
  return out;
}

export function loadLobby(storage = defaultStorage()) {
  if (!storage) return { ...defaultLobby };
  try {
    const s = storage.getItem(LOBBY_KEY);
    return s ? sanitizeLobby(JSON.parse(s)) : { ...defaultLobby };
  } catch {
    return { ...defaultLobby };
  }
}

export function saveLobby(lobby, storage = defaultStorage()) {
  if (!storage) return false;
  try { storage.setItem(LOBBY_KEY, JSON.stringify(sanitizeLobby(lobby))); return true; } catch { return false; }
}
