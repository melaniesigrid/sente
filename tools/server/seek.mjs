// The phantom seek, proved against a running sente-server. Usage: node seek.mjs [baseUrl]
//
// A search belongs to the player, not to the tab that sent it. It used to be
// thrown away whenever a second tab replaced the first: the close handler
// counted the newcomer as the socket that was closing. The replaced tab is not
// reconnected, so it went on saying "Looking for an opponent" to a queue that
// no longer held it, and nobody could ever be matched with it.
const base = process.argv[2] || "http://127.0.0.1:8787";
const ws = base.replace(/^http/, "ws");
const j = async (path, opts = {}) => {
  const r = await fetch(base + path, { ...opts, headers: { "content-type": "application/json", ...(opts.headers || {}) } });
  const body = await r.json();
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${JSON.stringify(body)}`);
  return body;
};
const open = (url) => new Promise((res, rej) => {
  const s = new WebSocket(url);
  const inbox = [];
  const waiters = [];
  let closed = null;
  s.onmessage = (e) => { const m = JSON.parse(e.data); const i = waiters.findIndex(w => w.pred(m)); if (i >= 0) waiters.splice(i, 1)[0].res(m); else inbox.push(m); };
  s.onclose = (e) => { closed = e.code; };
  s.onopen = () => res({
    s,
    closed: () => closed,
    send: (m) => s.send(JSON.stringify(m)),
    next: (pred = () => true, ms = 4000) => new Promise((r2, j2) => {
      const i = inbox.findIndex(pred); if (i >= 0) return r2(inbox.splice(i, 1)[0]);
      const t = setTimeout(() => j2(new Error("timeout waiting for " + pred)), ms);
      waiters.push({ pred, res: (m) => { clearTimeout(t); r2(m); } });
    }),
    /** Nothing matching arrives within `ms`. */
    quiet: (pred, ms = 800) => new Promise((r2) => {
      if (inbox.some(pred)) return r2(false);
      const t = setTimeout(() => r2(true), ms);
      waiters.push({ pred, res: () => { clearTimeout(t); r2(false); } });
    }),
  });
  s.onerror = () => rej(new Error(`socket failed to open: ${url}`));
});
const assert = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); console.log("ok  " + msg); };
const pause = (ms) => new Promise(r => setTimeout(r, ms));

// Every handle this run registers is removed however the run ends, as in smoke.mjs.
const made = [];
const register = async (name, tint) => {
  const p = await j("/api/register", { method: "POST", body: JSON.stringify({ name, tint }) });
  made.push(p);
  return p;
};
const sweep = async () => {
  for (const p of made.splice(0)) {
    try { await j("/api/me", { method: "DELETE", headers: { authorization: `Bearer ${p.token}` } }); }
    catch { /* nothing left to remove */ }
  }
};
const died = async (how, e) => {
  console.error(`seek prover failed (${how}): ${(e && e.message) || e}`);
  await sweep();
  process.exit(1);
};
process.on("uncaughtException", (e) => died("uncaught", e));
process.on("unhandledRejection", (e) => died("rejected", e));

const lobby = async (p) => { const l = await open(`${ws}/api/lobby?token=${p.token}`); await l.next(m => m.t === "lobby"); return l; };
// A private rendezvous word, so the prover never collides with a real seeker.
const KEY = "phantom" + Math.random().toString(36).slice(2, 8);

/* ----- a second tab inherits the search ----- */
const a = await register("Ada", "coral");
const b = await register("Bea", "sky");
const tab1 = await lobby(a);
tab1.send({ t: "seek", size: 13, key: KEY });
assert((await tab1.next(m => m.t === "seek")).status === "waiting", "the first tab is waiting");

const tab2 = await open(`${ws}/api/lobby?token=${a.token}`);
const told = await tab2.next(m => m.t === "seek");
assert(told.status === "waiting" && told.size === 13 && told.key === KEY,
  "the tab that replaces it is told the search is still on, on the same board and word");
await pause(400);
assert(tab1.closed() === 4000, "the replaced tab is closed as replaced");

const lb = await lobby(b);
lb.send({ t: "seek", size: 13, key: KEY });
const bMatched = await lb.next(m => m.t === "matched");
const aMatched = await tab2.next(m => m.t === "matched");
assert(bMatched.gameId === aMatched.gameId && aMatched.color === "b",
  "and somebody seeking the same game is matched with it, not left beside a ghost");

/* ----- the last tab going takes the search with it ----- */
const c = await register("Cy", "moss");
const d = await register("Dee", "plum");
const lc = await lobby(c);
lc.send({ t: "seek", size: 9, key: KEY });
await lc.next(m => m.t === "seek" && m.status === "waiting");
lc.s.close(1000);
await pause(400);
const ld = await lobby(d);
ld.send({ t: "seek", size: 9, key: KEY });
assert((await ld.next(m => m.t === "seek")).status === "waiting",
  "a seek whose only tab has gone is dropped, so nobody is matched with an empty chair");
const lc2 = await lobby(c);
assert(await lc2.quiet(m => m.t === "seek"), "and coming back does not pretend the search survived");
ld.send({ t: "cancel" });
await ld.next(m => m.t === "seek" && m.status === "idle");

for (const s of [tab2, lb, ld, lc2]) s.s.close(1000);
await sweep();
console.log("seek prover passed");
process.exit(0);
