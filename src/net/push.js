/* ----------------------- PUSH, IN THE BROWSER -----------------------
   Asking this browser to be told when a letter arrives, and telling the
   server where to say so.

   The whole thing is one subscription and one endpoint. The browser's push
   service mints an address that means "this browser"; the server keeps it
   and POSTs nothing to it when a letter is filed (see `server/push.js` for
   why nothing: the letter never leaves Joseki). The service worker in
   `public/sw.js` turns that empty signal into a fixed line on the screen.

   The words on that line are put where the worker can read them, in the
   Cache API under a name of ours, because a worker has no access to the
   app's language store and a push carries no payload to say them in. They
   are written every time the switch is turned on, so a player who changes
   language and flips it again gets the new words.

   Permission is asked HERE and never on load: a site that asks to notify
   you before you have asked it for anything is the thing everybody blocks. */

import { api } from "./api.js";
import { fromB64url } from "../../server/push.js";

const WORDS_CACHE = "joseki-push";
const WORDS_KEY = "/__joseki/push-words";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
  && window.isSecureContext;

const swUrl = () => `${import.meta.env.BASE_URL}sw.js`;

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration(swUrl());
  return reg ? reg.pushManager.getSubscription() : null;
}

/** "unsupported" | "denied" | "on" | "off". "on" means this browser holds a
 *  subscription; whether the server still has it is the server's to say. */
export async function pushState() {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try { return (await currentSubscription()) ? "on" : "off"; } catch { return "off"; }
}

async function sayWords(words) {
  try {
    const cache = await caches.open(WORDS_CACHE);
    await cache.put(WORDS_KEY, new Response(JSON.stringify(words), { headers: { "content-type": "application/json" } }));
  } catch { /* no cache: the worker falls back to its own words */ }
}

/** Turn it on. Throws "unsupported", "push-off" (the server has no keys),
 *  "denied" (the person or the browser said no), or whatever the server said. */
export async function enablePush(token, words) {
  if (!pushSupported()) throw new Error("unsupported");
  const cfg = await api.push();
  if (cfg.mode !== "on" || !cfg.key) throw new Error("push-off");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("denied");
  const reg = await navigator.serviceWorker.register(swUrl());
  await navigator.serviceWorker.ready;
  await sayWords(words);
  const sub = (await reg.pushManager.getSubscription())
    || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64url(cfg.key) }));
  await api.subscribePush(token, sub.endpoint);
}

/** Turn it off, on this browser only. The server is told first so a browser
 *  that then fails to unsubscribe is at worst knocked on once more, harmlessly;
 *  the other order would leave the server holding an address nothing answers. */
export async function disablePush(token) {
  const sub = await currentSubscription().catch(() => null);
  if (!sub) return;
  await api.unsubscribePush(token, sub.endpoint).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}
