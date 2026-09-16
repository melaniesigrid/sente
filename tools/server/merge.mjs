// Proves folding one handle into another against a running sente-server, and
// cleans up after itself. Usage:
//
//   SENTE_ADMIN_TOKEN=... node merge.mjs [baseUrl]
//
// Two handles play a game; a third is made; the loser is merged into the
// third. Afterwards the third holds the loser's record, sees the game in its
// list and its archive, and gets the loser's chair on opening the room. The
// loser's token is dead and the ladder no longer lists it.
const base = process.argv[2] || "http://127.0.0.1:8787";
const ws = base.replace(/^http/, "ws");
const admin = process.env.SENTE_ADMIN_TOKEN;
if (!admin) {
  console.error("SENTE_ADMIN_TOKEN is not set. It is the secret the operator routes are behind.");
  process.exit(2);
}

const call = async (path, { method = "GET", token, body } = {}) => {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const r = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await r.json().catch(() => null);
  return { status: r.status, data };
};
const ok = async (path, opts) => {
  const r = await call(path, opts);
  if (r.status >= 400) throw new Error(`${path} -> ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
};
const assert = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); console.log("ok  " + msg); };
const open = (url) => new Promise((res, rej) => {
  const s = new WebSocket(url);
  const inbox = [];
  const waiters = [];
  s.onmessage = (e) => { const m = JSON.parse(e.data); const i = waiters.findIndex(w => w.pred(m)); if (i >= 0) waiters.splice(i, 1)[0].res(m); else inbox.push(m); };
  s.onopen = () => res({
    s,
    send: (m) => s.send(JSON.stringify(m)),
    next: (pred = () => true, ms = 6000) => new Promise((r2, j2) => {
      const i = inbox.findIndex(pred); if (i >= 0) return r2(inbox.splice(i, 1)[0]);
      const t = setTimeout(() => j2(new Error("timeout waiting for a frame")), ms);
      waiters.push({ pred, res: (m) => { clearTimeout(t); r2(m); } });
    }),
  });
  s.onerror = () => rej(new Error(`socket failed to open: ${url}`));
});

const stamp = Math.random().toString(36).slice(2, 6);
const made = [];
const register = async (name, tint) => {
  const p = await ok("/api/register", { method: "POST", body: { name, tint } });
  made.push(p);
  return p;
};

try {
  const a = await register("Old" + stamp, "coral");
  const b = await register("Lost" + stamp, "sky");
  const c = await register("Kept" + stamp, "moss");

  /* ----- a game between the first two, which the second loses ----- */
  const la = await open(`${ws}/api/lobby?token=${a.token}`);
  const lb = await open(`${ws}/api/lobby?token=${b.token}`);
  await la.next(m => m.t === "lobby");
  const KEY = "merge-" + stamp;
  la.send({ t: "seek", size: 9, key: KEY });
  await la.next(m => m.t === "seek");
  lb.send({ t: "seek", size: 9, key: KEY });
  const ma = await la.next(m => m.t === "matched");
  await lb.next(m => m.t === "matched");
  const gid = ma.gameId;
  const ga = await open(`${ws}/api/game/${gid}/ws?token=${a.token}`);
  const gb = await open(`${ws}/api/game/${gid}/ws?token=${b.token}`);
  await ga.next(m => m.t === "seat"); await gb.next(m => m.t === "seat");
  ga.send({ t: "play", c: 4, r: 4 });
  await gb.next(m => m.t === "state" && m.room.record.moves.length === 1);
  gb.send({ t: "resign" });
  const fin = await ga.next(m => m.t === "state" && m.room.settled, 8000);
  assert(fin.room.settled.rated && fin.room.record.result.winner === "b", "a rated game, lost by the handle about to be folded");
  for (const s of [la, lb, ga, gb]) s.s.close();

  const lost = await ok("/api/me", { token: b.token });
  assert(lost.losses === 1, "the losing handle carries the loss");

  /* ----- refusals ----- */
  const self = await call(`/api/admin/players/${c.player.id}/merge`, { method: "POST", token: admin, body: { from: c.player.id } });
  assert(self.status === 400 && self.data.error === "same-player", "a handle cannot be folded into itself");
  const nobody = await call(`/api/admin/players/${c.player.id}/merge`, { method: "POST", token: admin, body: { from: "p_0000000000000000" } });
  assert(nobody.status === 404 && nobody.data.error === "no-player", "a handle that does not exist is said so");
  const unguarded = await call(`/api/admin/players/${c.player.id}/merge`, { method: "POST", body: { from: b.player.id } });
  assert(unguarded.status === 401, "the route is behind the operator secret");

  /* ----- the merge ----- */
  const before = await ok("/api/me", { token: c.token });
  const { merged } = await ok(`/api/admin/players/${c.player.id}/merge`, { method: "POST", token: admin, body: { from: b.player.id } });
  assert(merged.games === 1 && merged.reseated === 1, "one game came across and its room was re-seated");
  assert(merged.player.id === c.player.id && merged.player.losses === 1 && merged.player.wins === 0, "the surviving handle carries the loss now");
  assert(merged.player.rating === before.rating && merged.player.rd === before.rd, "and keeps its own rating");

  const gone = await call("/api/me", { token: b.token });
  assert(gone.status === 401, "the folded handle's token is dead");
  made.splice(made.indexOf(b), 1);
  const ladder = await ok("/api/ladder");
  assert(!ladder.some(r => r.id === b.player.id), "and the ladder no longer lists it");

  const list = await ok("/api/games", { token: c.token });
  assert(list.length === 1 && list[0].id === gid && list[0].white.id === c.player.id && list[0].white.name === c.player.name,
    "the survivor's list shows the game, with the survivor in the white seat");
  const arch = await ok("/api/me/archive", { token: c.token });
  assert(arch.games.length === 1 && arch.games[0].id === gid && arch.games[0].white.id === c.player.id,
    "and so does the survivor's archive");
  const room = await ok(`/api/game/${gid}`);
  assert(room.seats.w1.id === c.player.id && room.seats.w1.name === c.player.name && room.seats.b1.id === a.player.id,
    "the room seats the survivor where the folded handle sat, and the opponent where they were");
  const gc = await open(`${ws}/api/game/${gid}/ws?token=${c.token}`);
  await gc.next(m => m.t === "state");
  const seat = await gc.next(m => m.t === "seat");
  assert(seat.seat === "w1", "opening the game from the survivor gives them their chair, not a spectator's");
  gc.s.close();

  const again = await call(`/api/admin/players/${c.player.id}/merge`, { method: "POST", token: admin, body: { from: b.player.id } });
  assert(again.status === 404, "folding the same handle twice finds nothing the second time");

  console.log("\nall good");
} catch (e) {
  console.error("\nFAILED " + e.message);
  process.exitCode = 1;
} finally {
  for (const p of made) await call("/api/me", { method: "DELETE", token: p.token }).catch(() => {});
}
