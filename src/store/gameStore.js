/* ----------------------- IN-PROGRESS GAME STORE -----------------------
   One slot: the game currently on the table. Saved on every record change,
   cleared when the game ends. The stored blob is versioned; anything that
   does not match the version, does not parse, or does not replay through
   the engine is discarded with a single console.warn. `storage` is injectable
   so the helper is testable without a DOM. */
import { replay } from "../engine/index.js";

export const GAME_KEY = "sente-game";
export const GAME_STORE_VERSION = 1;

const defaultStorage = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

/** @param {{ record: object, mode: { kind: string, personaId: string|null, rank?: string|null, key?: string|null } }} session
 *  `mode.rank` is the level a bot game is played at; `mode.key` is the calendar day of a
 *  daily duel. Modes that do not use them leave them null.
 *
 *  `mode.coaching` is whether the coach has spoken in this game, and it has to survive a
 *  reload: a coached game is unrated for its whole life, and one that came back without
 *  the flag would be rated - the dishonesty the flag exists to prevent. `spoken` is the
 *  coach's memory of what it has already remarked on, so a refresh does not make it
 *  repeat itself. */
export function saveGame(session, storage = defaultStorage()) {
  if (!storage) return false;
  try {
    const blob = {
      version: GAME_STORE_VERSION,
      savedAt: Date.now(),
      mode: {
        kind: session.mode.kind, personaId: session.mode.personaId ?? null,
        rank: session.mode.rank ?? null, key: session.mode.key ?? null,
        coaching: !!session.mode.coaching,
        // A pair game's other half: without it a resumed table would seat a
        // partner of a different strength than the one you left playing with.
        partnerRank: session.mode.partnerRank ?? null,
      },
      spoken: session.spoken ?? {},
      record: session.record,
    };
    storage.setItem(GAME_KEY, JSON.stringify(blob));
    return true;
  } catch (e) {
    console.warn("sente: could not save the game", e);
    return false;
  }
}

/** Returns `{ record, mode, savedAt }` or null. Bad data is removed, not thrown. */
export function loadGame(storage = defaultStorage()) {
  if (!storage) return null;
  let raw;
  try { raw = storage.getItem(GAME_KEY); } catch { return null; }
  if (!raw) return null;
  const discard = (why) => {
    console.warn(`sente: discarding saved game (${why})`);
    try { storage.removeItem(GAME_KEY); } catch { /* nothing to do */ }
    return null;
  };
  let blob;
  try { blob = JSON.parse(raw); } catch { return discard("not JSON"); }
  if (!blob || typeof blob !== "object") return discard("not an object");
  if (blob.version !== GAME_STORE_VERSION) return discard(`version ${blob.version} != ${GAME_STORE_VERSION}`);
  if (!blob.record || !Array.isArray(blob.record.moves) || !blob.mode || typeof blob.mode.kind !== "string") {
    return discard("malformed");
  }
  let record;
  try { record = replay(blob.record); } catch (e) { return discard(`record does not replay: ${e.message}`); }
  const rank = typeof blob.mode.rank === "string" ? blob.mode.rank : null;
  const key = typeof blob.mode.key === "string" ? blob.mode.key : null;
  const partnerRank = typeof blob.mode.partnerRank === "string" ? blob.mode.partnerRank : null;
  // Read tolerantly, defaulting to false: a blob written before coaching existed is not
  // a coached game, and false is the safe direction - it can only ever restore a rating,
  // never quietly grant one to a game that had help.
  const coaching = blob.mode.coaching === true;
  const spoken = blob.spoken && typeof blob.spoken === "object" && !Array.isArray(blob.spoken) ? blob.spoken : {};
  return {
    record,
    mode: { kind: blob.mode.kind, personaId: blob.mode.personaId ?? null, rank, key, coaching, partnerRank },
    spoken,
    savedAt: blob.savedAt ?? null,
  };
}

export function clearGame(storage = defaultStorage()) {
  if (!storage) return;
  try { storage.removeItem(GAME_KEY); } catch { /* nothing to do */ }
}
