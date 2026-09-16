/* ----------------------- PROGRESS SYNC -----------------------
   Keeps a signed-in player's progress on their account. Two directions:

     queuePush(profile)   every save of the profile, when there is an account
                          and a server, sends the progress a moment later. The
                          wait folds a burst of saves (a lesson finishing writes
                          three fields in a row) into one request, and a request
                          that fails is simply tried again on the next save.
     pullProgress()       what the server holds, or null when there is nothing
                          to ask: no server, no account, or it is unreachable.
     withProgress(p, doc) that document merged into the profile in hand. The
                          merge is the shared one in progress.js, so it is the
                          same whether the browser or the Worker did it, and
                          the server merges again on the next push, so the two
                          ends settle on one answer.

   The device remembers when it last had something to say, so that a pull on
   an old laptop does not let a stale rating overwrite the one earned since
   on the phone: the shared merge takes the latest-wins fields from whichever
   side wrote more recently. A handle with no address behind it is still an
   account here; what makes it one browser only is that it cannot be signed
   into anywhere else, not that its progress is kept differently. */
import { api, serverEnabled } from "../net/api.js";
import { loadAccount } from "./account.js";
import { progressOf, mergeProgress, applyProgress, cleanProgress } from "./progress.js";

export const PUSH_DELAY_MS = 1500;
/** When this device last changed its progress, so a merge knows which side is newer. */
export const AT_KEY = "sente-progress-at";

const storage = () => { try { return globalThis.localStorage || null; } catch { return null; } };
const readAt = () => { const v = Number(storage()?.getItem(AT_KEY)); return Number.isFinite(v) ? v : 0; };
const writeAt = (at) => { try { storage()?.setItem(AT_KEY, String(at)); } catch { /* nothing to do */ } };

let timer = null;
let lastSent = "";

/** Send the progress in `profile` to the account, a moment from now. Nothing
 *  happens without a server and an account, and a document identical to the
 *  last one sent is not sent twice. */
export function queuePush(profile, { delay = PUSH_DELAY_MS, now = Date.now() } = {}) {
  if (!serverEnabled()) return false;
  const account = loadAccount();
  if (!account) return false;
  const data = progressOf(profile);
  const text = JSON.stringify(data);
  if (text === lastSent) return false;
  writeAt(now);
  clearTimeout(timer);
  timer = setTimeout(() => {
    lastSent = text;
    api.putProgress(account.token, data, now).catch(() => { lastSent = ""; });
  }, delay);
  return true;
}

/** The account's progress document `{ data, at }`, or null when there is
 *  nothing to ask or no answer. Never throws: a sync that cannot happen is a
 *  device that keeps working on its own. */
export async function pullProgress() {
  if (!serverEnabled()) return null;
  const account = loadAccount();
  if (!account) return null;
  try {
    const doc = await api.progress(account.token);
    const data = cleanProgress(doc?.data);
    return data ? { data, at: Number(doc.at) || 0 } : null;
  } catch { return null; }
}

/** The profile with the account's document merged in. */
export function withProgress(profile, doc) {
  if (!doc) return profile;
  const merged = mergeProgress({ data: progressOf(profile), at: readAt() }, doc);
  return applyProgress(profile, merged.data);
}

/** For tests: forget what was sent and any send waiting. */
export function resetSync() {
  clearTimeout(timer);
  timer = null;
  lastSent = "";
}
