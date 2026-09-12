// Proves that a game in progress reports itself, which is what the dashboard
// on the front page is read from. Usage: node dashboard.mjs [baseUrl]
//
// Until this slice, `noteGame` was called when a room was made and when it
// ended and never in between, so `GET /api/games` held a summary frozen at move
// zero: every table in progress read "0 moves, your move" however long it had
// been going. That is the thing being checked here, from both seats.

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
      const t = setTimeout(() => j2(new Error("timeout waiting for " + what)), ms);
      waiters.push({ pred, res: (m) => { clearTimeout(t); r2(m); } });
    }),
  });
  s.onerror = rej;
});
const assert = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); console.log("ok  " + msg); };
const bearer = (t) => ({ authorization: `Bearer ${t}` });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const stamp = Math.random().toString(36).slice(2, 6);
const tokens = [];
const sockets = [];
const make = async (who) => {
  const p = await j("/api/register", { method: "POST", body: JSON.stringify({ name: who + stamp, tint: "mint" }) });
  tokens.push(p.token);
  return p;
};
/** The summary of one game out of a player's list. */
const listed = async (p, gid) => (await j("/api/games", { headers: bearer(p.token) })).find((g) => g.id === gid);

try {
  const a = await make("Daa");
  const b = await make("Dab");

  assert((await j("/api/games", { headers: bearer(a.token) })).length === 0,
    "a new handle has no tables");

  const la = await open(`${ws}/api/lobby?token=${a.token}`);
  const lb = await open(`${ws}/api/lobby?token=${b.token}`);
  sockets.push(la.s, lb.s);
  await la.next((m) => m.t === "lobby", 6000, "the lobby");
  const key = "dash-" + Math.random().toString(36).slice(2, 8);
  la.send({ t: "seek", size: 9, key });
  await la.next((m) => m.t === "seek", 6000, "the seek ack");
  lb.send({ t: "seek", size: 9, key });
  const ma = await la.next((m) => m.t === "matched", 6000, "a match");
  await lb.next((m) => m.t === "matched", 6000, "a match for B");
  const gid = ma.gameId;

  const ga = await open(`${ws}/api/game/${gid}/ws?token=${a.token}`);
  const gb = await open(`${ws}/api/game/${gid}/ws?token=${b.token}`);
  sockets.push(ga.s, gb.s);
  await ga.next((m) => m.t === "seat", 6000, "A seated");
  await gb.next((m) => m.t === "seat", 6000, "B seated");

  const fresh = await listed(a, gid);
  assert(fresh && fresh.phase === "playing", "a new game is on both players' lists");
  assert(fresh.moves === 0 && fresh.toPlay === "b", "with nobody having moved and Black to play");

  /* ----- the bug this slice fixes ----- */
  ga.send({ t: "play", c: 2, r: 2 });
  await gb.next((m) => m.t === "state" && m.room.record.moves.length === 1, 6000, "the move");
  await wait(400);   // the report is sent after the broadcast, deliberately
  const afterOne = await listed(a, gid);
  assert(afterOne.moves === 1, "a move updates the summary the list is read from");
  assert(afterOne.toPlay === "w", "and the turn passes on it, so the list knows whose move it is");

  const theirs = await listed(b, gid);
  assert(theirs.moves === 1 && theirs.toPlay === "w", "on the other player's list in the same breath");

  const before = afterOne.updatedAt;
  await wait(1100);
  gb.send({ t: "play", c: 4, r: 4 });
  await ga.next((m) => m.t === "state" && m.room.record.moves.length === 2, 6000, "the reply");
  await wait(400);
  const afterTwo = await listed(a, gid);
  assert(afterTwo.moves === 2 && afterTwo.toPlay === "b", "and again for the reply");
  assert(afterTwo.updatedAt > before, "the stamp moves, which is what the waiting time is measured from");

  /* ----- scoring, which waits on both of them ----- */
  ga.send({ t: "pass" });
  await gb.next((m) => m.t === "state" && m.room.record.moves.length === 3, 6000, "a pass");
  gb.send({ t: "pass" });
  await ga.next((m) => m.t === "state" && m.room.record.phase === "scoring", 6000, "scoring");
  await wait(400);
  assert((await listed(a, gid)).phase === "scoring", "counting shows on the list as counting");

  /* ----- and the end ----- */
  ga.send({ t: "accept" });
  gb.send({ t: "accept" });
  await ga.next((m) => m.t === "state" && m.room.record.phase === "ended", 8000, "the end");
  await wait(600);
  const done = await listed(a, gid);
  assert(done.phase === "ended", "a finished game is marked finished rather than left running");
  assert(done.result, "and carries its result");
  assert((await j("/api/me/archive", { headers: bearer(a.token) })).games.some((g) => g.id === gid),
    "and is in the archive, which the end has always reported to");

  console.log("");
  console.log("all dashboard checks passed");
} finally {
  for (const s of sockets) { try { s.close(); } catch { /* already gone */ } }
  for (const token of tokens) await raw("/api/me", { method: "DELETE", headers: bearer(token) }).catch(() => {});
  console.log("cleaned up");
}
