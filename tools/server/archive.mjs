// Proves the archive against a running sente-server.
// Usage: node archive.mjs [baseUrl]
//
// The archive only has anything in it once a game has actually finished, so
// this plays two whole games on a 9x9 (one by resignation, one by two passes
// and a count) and then reads them back. Both handles are removed at the end.
//
// What it is checking beyond "the rows come back": that the page is ordered
// newest first, that a cursor pages rather than repeats, that a cursor for
// somebody else's archive is refused, that the SGF is the record and not a
// second copy of it, and that leaving takes the index with it.

const base = process.argv[2] || "http://127.0.0.1:8787";
const ws = base.replace(/^http/, "ws");

const j = async (path, opts = {}) => {
  const r = await fetch(base + path, { ...opts, headers: { "content-type": "application/json", ...(opts.headers || {}) } });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${JSON.stringify(body)}`);
  return body;
};
const raw = (path, opts = {}) => fetch(base + path, opts);
const open = (url) => new Promise((res, rej) => {
  const s = new WebSocket(url);
  const inbox = [], waiters = [];
  s.onmessage = (e) => {
    const m = JSON.parse(e.data);
    const i = waiters.findIndex((w) => w.pred(m));
    if (i >= 0) waiters.splice(i, 1)[0].res(m); else inbox.push(m);
  };
  s.onopen = () => res({
    s,
    send: (m) => s.send(JSON.stringify(m)),
    next: (pred = () => true, ms = 6000, what = "a frame") => new Promise((r2, j2) => {
      const i = inbox.findIndex(pred);
      if (i >= 0) return r2(inbox.splice(i, 1)[0]);
      const t = setTimeout(() => j2(new Error("timeout waiting for " + what + "; inbox: " + JSON.stringify(inbox.map(x => x.t)))), ms);
      waiters.push({ pred, res: (m) => { clearTimeout(t); r2(m); } });
    }),
  });
  s.onerror = rej;
});
const assert = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); console.log("ok  " + msg); };
const bearer = (t) => ({ authorization: `Bearer ${t}` });

const stamp = Math.random().toString(36).slice(2, 6);
const tokens = [];
const sockets = [];

const make = async (who) => {
  const p = await j("/api/register", { method: "POST", body: JSON.stringify({ name: who + stamp, tint: "mint" }) });
  tokens.push(p.token);
  return p;
};

/** Sit two people down together and hand back their two game sockets. */
async function sitDown(a, b) {
  const la = await open(`${ws}/api/lobby?token=${a.token}`);
  const lb = await open(`${ws}/api/lobby?token=${b.token}`);
  sockets.push(la.s, lb.s);
  await la.next((m) => m.t === "lobby", 6000, "the lobby frame");
  const key = "arch-" + Math.random().toString(36).slice(2, 8);
  la.send({ t: "seek", size: 9, key });
  await la.next((m) => m.t === "seek", 6000, "the seek ack");
  lb.send({ t: "seek", size: 9, key });
  const ma = await la.next((m) => m.t === "matched", 6000, "a match for A");
  await lb.next((m) => m.t === "matched", 6000, "a match for B");
  const ga = await open(`${ws}/api/game/${ma.gameId}/ws?token=${a.token}`);
  const gb = await open(`${ws}/api/game/${ma.gameId}/ws?token=${b.token}`);
  sockets.push(ga.s, gb.s);
  await ga.next((m) => m.t === "seat", 6000, "A to be seated");
  await gb.next((m) => m.t === "seat", 6000, "B to be seated");
  la.s.close(); lb.s.close();
  return { gid: ma.gameId, ga, gb };
}

const ended = (m) => m.t === "state" && m.room.record.phase === "ended";

try {
  const a = await make("Arc");
  const b = await make("Brc");

  const empty = await j("/api/me/archive", { headers: bearer(a.token) });
  assert(Array.isArray(empty.games) && empty.games.length === 0 && empty.cursor === null,
    "a new handle has an empty archive and no cursor");

  /* ----- one game, ended by resignation ----- */
  const one = await sitDown(a, b);
  one.ga.send({ t: "play", c: 2, r: 2 });
  await one.gb.next((m) => m.t === "state" && m.room.record.moves.length === 1, 6000, "black's move");
  one.gb.send({ t: "resign" });
  await one.ga.next(ended, 6000, "the resignation to end it");

  /* ----- a second game, ended by two passes and a count ----- */
  const two = await sitDown(a, b);
  two.ga.send({ t: "pass" });
  await two.gb.next((m) => m.t === "state" && m.room.record.moves.length === 1, 6000, "the first pass");
  two.gb.send({ t: "pass" });
  await two.ga.next((m) => m.t === "state" && m.room.record.phase === "scoring", 6000, "scoring to begin");
  two.ga.send({ t: "accept" });
  two.gb.send({ t: "accept" });
  await two.ga.next(ended, 8000, "both acceptances to end it");

  /* ----- reading it back ----- */
  const mine = await j("/api/me/archive", { headers: bearer(a.token) });
  assert(mine.games.length === 2, "both finished games are in the archive");
  assert(mine.games[0].id === two.gid && mine.games[1].id === one.gid,
    "newest first, without the caller sorting anything");
  assert(mine.games[1].result.method === "resign", "a resignation is recorded as one");
  assert(mine.games[0].moves === 2 && mine.games[0].size === 9, "the row carries the board and the move count");
  assert(mine.games[0].toPlay === undefined && mine.games[0].updatedAt === undefined,
    "and not the fields that only meant something while it was running");

  const theirs = await j("/api/me/archive", { headers: bearer(b.token) });
  assert(theirs.games.length === 2, "both players get the game, filed under each of them");

  /* ----- paging ----- */
  const firstOfOne = await j("/api/me/archive?limit=1", { headers: bearer(a.token) });
  assert(firstOfOne.games.length === 1 && firstOfOne.cursor,
    "a full page hands back a cursor to carry on with");
  assert(firstOfOne.games[0].id === two.gid, "and starts at the newest");
  const second = await j(`/api/me/archive?limit=1&cursor=${encodeURIComponent(firstOfOne.cursor)}`, { headers: bearer(a.token) });
  assert(second.games.length === 1 && second.games[0].id === one.gid,
    "the next page carries on rather than repeating");
  const third = await j(`/api/me/archive?limit=1&cursor=${encodeURIComponent(second.cursor)}`, { headers: bearer(a.token) });
  assert(third.games.length === 0 && third.cursor === null, "and the page after the last one is empty");

  /* A cursor is a storage key. One belonging to somebody else must not page
     their archive; it is ignored and the caller gets their own first page. */
  const stolen = await j(`/api/me/archive?cursor=${encodeURIComponent(`arch:${b.player.id}:00000000000000:g`)}`,
    { headers: bearer(a.token) });
  assert(stolen.games.length === 2, "a cursor for somebody else's archive is refused, not followed");

  assert((await raw("/api/me/archive")).status === 401, "the archive needs a handle to read");

  /* ----- the SGF ----- */
  const sgf = await raw(`/api/game/${one.gid}/sgf`);
  const text = await sgf.text();
  assert(sgf.status === 200, "a finished game hands over its record as a file");
  assert(/^\(;FF\[4\]GM\[1\]/.test(text), "which is an SGF");
  assert(text.includes("SZ[9]") && text.includes("RE["), "carrying the board and the result");
  assert(text.includes(a.player.name) && text.includes(b.player.name), "and both players' names");
  assert(/attachment; filename=/.test(sgf.headers.get("content-disposition") || ""),
    "offered as a download with a name on it");
  assert((await raw("/api/game/g_zzzzzzzzzzzz/sgf")).status === 404, "a game that is not there is a clean 404");
  assert((await raw("/api/game/nonsense/sgf")).status === 404, "and so is an id that is not one");

  /* ----- leaving ----- */
  await j("/api/me", { method: "DELETE", headers: bearer(b.token) });
  tokens.splice(tokens.indexOf(b.token), 1);
  assert((await raw("/api/me/archive", { headers: bearer(b.token) })).status === 401,
    "leaving takes the archive index with the account");
  const stillMine = await j("/api/me/archive", { headers: bearer(a.token) });
  assert(stillMine.games.length === 2,
    "but the other player still has their own copy of the same games");
  assert((await raw(`/api/game/${one.gid}/sgf`)).status === 200,
    "and the record stays in its room, as the notice says it does");

  console.log("\nall archive checks passed");
} finally {
  for (const s of sockets) { try { s.close(); } catch { /* already gone */ } }
  for (const token of tokens) await raw("/api/me", { method: "DELETE", headers: bearer(token) }).catch(() => {});
  console.log("cleaned up");
}
