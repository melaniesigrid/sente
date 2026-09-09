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

/** @param {{ record: object, mode: { kind: string, personaId: string|null, rank?: string|null } }} session */
export function saveGame(session, storage = defaultStorage()) {
  if (!storage) return false;
  try {
    const blob = {
      version: GAME_STORE_VERSION,
      savedAt: Date.now(),
      mode: { kind: session.mode.kind, personaId: session.mode.personaId ?? null, rank: session.mode.rank ?? null },
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
  return { record, mode: { kind: blob.mode.kind, personaId: blob.mode.personaId ?? null, rank }, savedAt: blob.savedAt ?? null };
}

export function clearGame(storage = defaultStorage()) {
  if (!storage) return;
  try { storage.removeItem(GAME_KEY); } catch { /* nothing to do */ }
}
