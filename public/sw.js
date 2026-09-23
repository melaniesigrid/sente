/* Joseki's service worker. It does one thing: turn an empty push into a line
   on the screen saying there is post. It caches nothing, fetches nothing on
   the page's behalf, and is only ever registered by a person turning notices
   on. The words it shows are put in the Cache API by the app (src/net/push.js)
   because a push here carries no payload: the letter stays on Joseki. */

const WORDS_CACHE = "joseki-push";
const WORDS_KEY = "/__joseki/push-words";
const FALLBACK = { title: "Joseki", body: "There is post for you." };

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

async function words() {
  try {
    const cache = await caches.open(WORDS_CACHE);
    const hit = await cache.match(WORDS_KEY);
    if (hit) return { ...FALLBACK, ...(await hit.json()) };
  } catch { /* fall through */ }
  return FALLBACK;
}

self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    const w = await words();
    await self.registration.showNotification(w.title, {
      body: w.body,
      /* One tag, so ten letters overnight are one notice and not ten. */
      tag: "joseki-post",
      icon: new URL("favicon.svg", self.registration.scope).toString(),
    });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const here = open.find((c) => c.url.startsWith(self.registration.scope));
    if (here) { await here.focus(); return; }
    await self.clients.openWindow(self.registration.scope);
  })());
});
