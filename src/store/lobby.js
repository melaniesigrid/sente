/* ----------------------- LOBBY PREFERENCES -----------------------
   The table the player last set up: board size and handicap. A device
   preference, not part of the profile, so it never travels with a rating.
   Stored JSON is untrusted and falls back per field. 19x19 is the default
   because it is the board most of the world plays on. */
import { SIZES } from "../engine/index.js";

export const LOBBY_KEY = "sente-lobby";
export const HANDICAPS = [0, 2, 3, 4, 5, 6, 7, 8, 9];
export const defaultLobby = { size: 19, handicap: 0 };

const defaultStorage = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

/** Coerce anything into a valid table setup. */
export function sanitizeLobby(raw) {
  const out = { ...defaultLobby };
  if (!raw || typeof raw !== "object") return out;
  if (SIZES.includes(raw.size)) out.size = raw.size;
  if (HANDICAPS.includes(raw.handicap)) out.handicap = raw.handicap;
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
