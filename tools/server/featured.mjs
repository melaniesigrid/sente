// Proves the featured games (the few a player shows on their page).
// Usage: node featured.mjs [baseUrl]
//
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


// A featured game is a pin: an id and a line. The game stays in its room, so
// this checks that pinning copies nothing, that you cannot show a game you did
// not play, that the line is yours and attributed, and that leaving takes the
// pins with it.

try {
  const a = await make("Fea");
  const b = await make("Feb");
  const c = await make("Fec");

  const fresh = await j(`/api/players/${a.player.id}`);
  assert(Array.isArray(fresh.featured) && fresh.featured.length === 0,
    "a new handle shows no games");

  /* ----- play three, so there is something to choose between ----- */
  const played = [];
  for (let i = 0; i < 3; i += 1) {
    const g = await sitDown(a, b);
    g.ga.send({ t: "play", c: 2, r: 2 });
    await g.gb.next((m) => m.t === "state" && m.room.record.moves.length === 1, 6000, "a move");
    g.gb.send({ t: "resign" });
    await g.ga.next(ended, 6000, "the game to end");
    played.push(g.gid);
  }
  assert((await j("/api/me/archive", { headers: bearer(a.token) })).games.length === 3,
    "three games are in the archive to choose from");

  /* ----- pinning ----- */
  const one = await j(`/api/me/featured/${played[0]}`, {
    method: "PUT", headers: bearer(a.token), body: JSON.stringify({ note: "The first one." }),
  });
  assert(one.featured.length === 1 && one.featured[0].id === played[0],
    "pinning puts the game on your own record");

  const seen = await j(`/api/players/${a.player.id}`);
  assert(seen.featured.length === 1, "and on the page a stranger opens");
  assert(seen.featured[0].note === "The first one.", "with the line you wrote");
  assert(seen.featured[0].result && seen.featured[0].size === 9,
    "and the game itself, joined on rather than copied into the pin");

  /* Re-pinning is an edit of the line, not a refusal and not a second pin. */
  const edited = await j(`/api/me/featured/${played[0]}`, {
    method: "PUT", headers: bearer(a.token), body: JSON.stringify({ note: "Second thoughts." }),
  });
  assert(edited.featured.length === 1 && edited.featured[0].note === "Second thoughts.",
    "pinning the same game again edits the line rather than adding it twice");

  const longLine = "x".repeat(400);
  const cut = await j(`/api/me/featured/${played[1]}`, {
    method: "PUT", headers: bearer(a.token), body: JSON.stringify({ note: longLine }),
  });
  assert(cut.featured.find((e) => e.id === played[1]).note.length === 140,
    "a long line is cut to the limit rather than refused");

  await j(`/api/me/featured/${played[2]}`, {
    method: "PUT", headers: bearer(a.token), body: JSON.stringify({ note: "" }),
  });
  const fourth = await raw(`/api/me/featured/${played[0]}xx`, {
    method: "PUT", headers: { ...bearer(a.token), "content-type": "application/json" },
    body: JSON.stringify({ note: "" }),
  });
  assert(fourth.status === 403, "a game you did not play cannot be shown, whatever its id");

  /* ----- the cap ----- */
  const g4 = await sitDown(a, b);
  g4.ga.send({ t: "play", c: 3, r: 3 });
  await g4.gb.next((m) => m.t === "state" && m.room.record.moves.length === 1, 6000, "a move");
  g4.gb.send({ t: "resign" });
  await g4.ga.next(ended, 6000, "the game to end");
  const over = await raw(`/api/me/featured/${g4.gid}`, {
    method: "PUT", headers: { ...bearer(a.token), "content-type": "application/json" },
    body: JSON.stringify({ note: "" }),
  });
  assert(over.status === 409, "a fourth game is refused");
  assert((await over.json()).error === "too-many-featured", "and says why");

  /* ----- somebody else's game ----- */
  const notMine = await raw(`/api/me/featured/${played[0]}`, {
    method: "PUT", headers: { ...bearer(c.token), "content-type": "application/json" },
    body: JSON.stringify({ note: "I was not there." }),
  });
  assert(notMine.status === 403, "you cannot show a game you were not in");
  assert((await j(`/api/players/${c.player.id}`)).featured.length === 0, "so their page stays empty");

  /* The other player may show the same game, which is theirs too. */
  const theirs = await j(`/api/me/featured/${played[0]}`, {
    method: "PUT", headers: bearer(b.token), body: JSON.stringify({ note: "I lost this one." }),
  });
  assert(theirs.featured.length === 1, "but the opponent may show it, because it is their game as well");
  const bothPages = await Promise.all([a, b].map((p) => j(`/api/players/${p.player.id}`)));
  assert(bothPages[0].featured[0].note === "Second thoughts." && bothPages[1].featured[0].note === "I lost this one.",
    "and each of them keeps their own line about it");

  /* ----- unpinning ----- */
  const off = await j(`/api/me/featured/${played[1]}`, { method: "DELETE", headers: bearer(a.token) });
  assert(off.featured.length === 2, "taking a game off removes it and its line");
  const again = await j(`/api/me/featured/${played[1]}`, { method: "DELETE", headers: bearer(a.token) });
  assert(again.featured.length === 2, "and doing it twice means the same thing both times");

  assert((await raw(`/api/me/featured/${played[0]}`, { method: "PUT" })).status === 401,
    "showing a game needs a handle");
  assert((await raw(`/api/me/featured/${played[0]}`, { method: "GET", headers: bearer(a.token) })).status === 405,
    "a method the route does not have is a 405");

  /* ----- leaving ----- */
  await j("/api/me", { method: "DELETE", headers: bearer(a.token) });
  tokens.splice(tokens.indexOf(a.token), 1);
  assert((await raw(`/api/players/${a.player.id}`)).status === 404,
    "leaving takes the page and the games it was showing");
  assert((await j(`/api/players/${b.player.id}`)).featured.length === 1,
    "the opponent still shows their own copy of the same game");
  assert((await raw(`/api/game/${played[0]}/sgf`)).status === 200,
    "and the game itself is still in its room, as the notice says");

  console.log("");
  console.log("all featured checks passed");
} finally {
  for (const s of sockets) { try { s.close(); } catch { /* already gone */ } }
  for (const token of tokens) await raw("/api/me", { method: "DELETE", headers: bearer(token) }).catch(() => {});
  console.log("cleaned up");
}
