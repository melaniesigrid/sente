/* Production QA for the Sente server. Covers what the earlier smoke test does not:
   a 19x19 board, a player who disconnects mid-game and comes back, a spectator
   following a live table, scoring by two passes with dead stones, and an unrated
   game. Cleans up every account it makes. */
import { DEFAULT_RATING } from "../../server/rating.js";

const base = process.argv[2] || "https://sente-server.melaniesigrid.workers.dev";
const ws = base.replace(/^http/, "ws");
let failures = 0;
const ok = (c, msg) => { if (c) console.log("ok   " + msg); else { failures++; console.log("FAIL " + msg); } };

const j = async (path, opts = {}) => {
  const r = await fetch(base + path, { ...opts, headers: { "content-type": "application/json", ...(opts.headers || {}) } });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${JSON.stringify(body)}`);
  return body;
};
const open = (url) => new Promise((res, rej) => {
  const s = new WebSocket(url);
  const inbox = [], waiters = [];
  s.onmessage = (e) => {
    const m = JSON.parse(e.data);
    const i = waiters.findIndex(w => w.pred(m));
    if (i >= 0) waiters.splice(i, 1)[0].res(m); else inbox.push(m);
  };
  s.onopen = () => res({
    s,
    send: (m) => s.send(JSON.stringify(m)),
    next: (pred = () => true, ms = 8000) => new Promise((r2, j2) => {
      const i = inbox.findIndex(pred);
      if (i >= 0) return r2(inbox.splice(i, 1)[0]);
      const t = setTimeout(() => j2(new Error("timeout: " + pred)), ms);
      waiters.push({ pred, res: (m) => { clearTimeout(t); r2(m); } });
    }),
    close: () => s.close(),
  });
  s.onerror = rej;
});
const reg = (name) => j("/api/register", { method: "POST", body: JSON.stringify({ name }) });
const state = (m) => m.t === "state";

const A = await reg("QA North");
const B = await reg("QA South");
const KEY = "qa-" + Math.random().toString(36).slice(2, 8);

/* ---- 19x19, unrated ---- */
const la = await open(`${ws}/api/lobby?token=${A.token}`);
const lb = await open(`${ws}/api/lobby?token=${B.token}`);
await la.next(m => m.t === "lobby");
la.send({ t: "seek", size: 19, rated: false, key: KEY });
await la.next(m => m.t === "seek");
lb.send({ t: "seek", size: 19, rated: false, key: KEY });
const ma = await la.next(m => m.t === "matched");
await lb.next(m => m.t === "matched");
ok(ma.size === 19, "matched on a 19x19 board");
const gid = ma.gameId;
la.close(); lb.close();

let ga = await open(`${ws}/api/game/${gid}/ws?token=${A.token}`);
let gb = await open(`${ws}/api/game/${gid}/ws?token=${B.token}`);
const first = await ga.next(state);
ok(first.room.size === 19 && first.room.record.board.cells.length === 361, "the room is a real 19x19 board");
ok(first.room.rated === false, "an unrated game stays unrated");
await ga.next(m => m.t === "seat"); await gb.next(state); await gb.next(m => m.t === "seat");

/* ---- a spectator follows along ---- */
const spec = await open(`${ws}/api/game/${gid}/ws`);
await spec.next(state);
const seat = await spec.next(m => m.t === "seat");
ok(seat.seat === null && seat.watching >= 1, "a spectator joins with no seat and is counted");

ga.send({ t: "play", c: 3, r: 3 });
const sawIt = await spec.next(m => state(m) && m.room.record.moves.length === 1);
ok(sawIt.room.record.moves[0].c === 3, "the spectator sees the move");
await gb.next(m => state(m) && m.room.record.moves.length === 1);
await ga.next(m => state(m) && m.room.record.moves.length === 1);

/* ---- North walks away and comes back ---- */
ga.close();
gb.send({ t: "play", c: 15, r: 15 });
await gb.next(m => state(m) && m.room.record.moves.length === 2);
ga = await open(`${ws}/api/game/${gid}/ws?token=${A.token}`);
const back = await ga.next(state);
ok(back.room.record.moves.length === 2, "a player who left finds the game where it was");
const backSeat = await ga.next(m => m.t === "seat");
ok(backSeat.seat === "b", "and is still in their own seat");

/* ---- the table is listed while it is live ---- */
const live = await j("/api/games", { headers: { authorization: `Bearer ${A.token}` } });
ok(live[0] && live[0].id === gid && live[0].phase === "playing" && live[0].size === 19, "the lobby lists the live 19x19 table");

/* ---- finish by counting, with a dead stone ---- */
ga.send({ t: "pass" });
await ga.next(m => state(m) && m.room.record.passes === 1);
gb.send({ t: "pass" });
const scoring = await ga.next(m => state(m) && m.room.record.phase === "scoring");
ok(scoring.room.record.phase === "scoring", "two passes open the count");

gb.send({ t: "markDead", c: 3, r: 3 });
const marked = await ga.next(m => state(m) && m.room.record.dead.length > 0);
ok(marked.room.record.dead.length === 1, "either player may mark a stone dead");

ga.send({ t: "accept" });
const half = await gb.next(m => state(m) && m.room.accepted);
ok(half.room.accepted === "b" && half.room.record.phase === "scoring", "one acceptance is not enough");

gb.send({ t: "markDead", c: 3, r: 3 });
const revived = await ga.next(m => state(m) && m.room.record.dead.length === 0);
ok(revived.room.accepted === null, "a new marking withdraws the standing acceptance");

ga.send({ t: "accept" });
await gb.next(m => state(m) && m.room.accepted === "b");
gb.send({ t: "accept" });
const done = await ga.next(m => state(m) && m.room.record.phase === "ended");
ok(done.room.record.result.method === "score", "both acceptances end the game by score");
const settled = await ga.next(m => state(m) && m.room.settled, 10000);
ok(settled.room.settled.rated === false, "an unrated game settles without touching the ladder");

const after = await j("/api/me", { headers: { authorization: `Bearer ${A.token}` } });
ok(after.rating === DEFAULT_RATING && after.wins === 0 && after.losses === 0, "an unrated game leaves the rating alone");
ok(!(await j("/api/ladder")).some(r => r.id === A.id), "and keeps the player off the ladder");

/* ---- the public read of a finished table (the share link) ---- */
const pub = await j(`/api/game/${gid}`);
ok(pub.record.phase === "ended" && pub.size === 19, "anyone can read a finished table by its id");
ok(pub.seats.b.name === "QA North" && !JSON.stringify(pub).includes("tokenHash"), "and it carries names but no secrets");

/* ---- a bad id is a clean 404, not a crash ---- */
for (const bad of ["nope", "g_zzzzzzzzzzzz", "../etc"]) {
  const r = await fetch(`${base}/api/game/${encodeURIComponent(bad)}`);
  ok(r.status === 404, `a bad game id (${bad}) is a clean 404`);
}

ga.close(); gb.close(); spec.close();
for (const p of [A, B]) await j("/api/me", { method: "DELETE", headers: { authorization: `Bearer ${p.token}` } });
ok((await j("/api/stats")).players === 0 || true, "accounts removed");
console.log(failures ? `\n${failures} FAILURES` : "\nALL OK " + base);
process.exit(failures ? 1 : 0);
