/* ----------------------- ONLINE ACCOUNT -----------------------
   The server-side identity: a bearer token plus the last player record the
   server gave us. Kept apart from the local profile because losing it means
   losing the seat on the ladder, and because the token must never end up in a
   share link or an SGF. `storage` is injectable for tests. */

export const ACCOUNT_KEY = "sente-account-v1";

const defaultStorage = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

const validToken = (t) => typeof t === "string" && /^[0-9a-f]{64}$/.test(t);

/** `{ token, player }` or null. Malformed data is removed, not thrown. */
export function loadAccount(storage = defaultStorage()) {
  if (!storage) return null;
  let raw;
  try { raw = storage.getItem(ACCOUNT_KEY); } catch { return null; }
  if (!raw) return null;
  let blob;
  try { blob = JSON.parse(raw); } catch { blob = null; }
  if (!blob || typeof blob !== "object" || !validToken(blob.token) || !blob.player || typeof blob.player.id !== "string") {
    console.warn("sente: discarding stored account");
    try { storage.removeItem(ACCOUNT_KEY); } catch { /* nothing to do */ }
    return null;
  }
  return { token: blob.token, player: blob.player };
}

export function saveAccount(account, storage = defaultStorage()) {
  if (!storage) return false;
  if (!account || !validToken(account.token) || !account.player) return false;
  try { storage.setItem(ACCOUNT_KEY, JSON.stringify({ token: account.token, player: account.player })); return true; }
  catch (e) { console.warn("sente: could not save the account", e); return false; }
}

export function clearAccount(storage = defaultStorage()) {
  if (!storage) return;
  try { storage.removeItem(ACCOUNT_KEY); } catch { /* nothing to do */ }
}
