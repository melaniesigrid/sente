// Proves the post: who may write to whom, and that blocking is silent.
// Usage: node post.mjs [baseUrl]
//
// The spam policy is the whole design and it is one rule: only somebody you
// agreed to be friends with, or finished a game against, can write to you. So
// this makes four handles who know each other in four different ways and tries
// to write in every direction. All four are removed at the end.

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

/** Sit two people down together and hand back their two game sockets. */
async function sitDown(a, b) {
  const la = await open(`${ws}/api/lobby?token=${a.token}`);
  const lb = await open(`${ws}/api/lobby?token=${b.token}`);
  sockets.push(la.s, lb.s);
  await la.next((m) => m.t === "lobby", 6000, "the lobby");
  const key = "post-" + Math.random().toString(36).slice(2, 8);
  la.send({ t: "seek", size: 9, key });
  await la.next((m) => m.t === "seek", 6000, "the seek ack");
  lb.send({ t: "seek", size: 9, key });
  const ma = await la.next((m) => m.t === "matched", 6000, "a match");
  await lb.next((m) => m.t === "matched", 6000, "a match for B");
  const ga = await open(`${ws}/api/game/${ma.gameId}/ws?token=${a.token}`);
  const gb = await open(`${ws}/api/game/${ma.gameId}/ws?token=${b.token}`);
  sockets.push(ga.s, gb.s);
  await ga.next((m) => m.t === "seat", 6000, "A seated");
  await gb.next((m) => m.t === "seat", 6000, "B seated");
  la.s.close(); lb.s.close();
  return { gid: ma.gameId, ga, gb };
}

const post = (token, toId, text) =>
  raw(`/api/me/letters/${toId}`, {
    method: "POST",
    headers: { ...bearer(token), "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });

try {
  const me = await make("Pom");
  const friend = await make("Pof");
  const opponent = await make("Poo");
  const stranger = await make("Pos");

  /* ----- a stranger cannot write at all ----- */
  const cold = await post(stranger.token, me.player.id, "Buy my go stones");
  assert(cold.status === 403, "somebody you have never met cannot write to you");
  assert((await cold.json()).error === "not-met", "and is told which rule stopped them");
  assert((await j("/api/me/letters", { headers: bearer(me.token) })).length === 0,
    "so nothing lands in your letters");

  /* ----- a friend can ----- */
  await j(`/api/me/friends/${friend.player.id}`, { method: "POST", headers: bearer(me.token) });
  await j(`/api/me/friends/${me.player.id}/accept`, { method: "POST", headers: bearer(friend.token) });
  const sent = await (await post(friend.token, me.player.id, "Good game yesterday.")).json();
  assert(sent.thread.length === 1 && sent.thread[0].text === "Good game yesterday.",
    "a friend may write, and the letter is in the thread");

  /* ----- one thread, read from both sides ----- */
  const mineSide = await j(`/api/me/letters/${friend.player.id}`, { headers: bearer(me.token) });
  assert(mineSide.thread.length === 1, "and the same thread is what the other one opens");
  await post(me.token, friend.player.id, "It was. That wedge.");
  const both = await j(`/api/me/letters/${me.player.id}`, { headers: bearer(friend.token) });
  assert(both.thread.length === 2 && both.thread[1].from === me.player.id,
    "a reply joins the same thread rather than starting a second one");

  /* ----- somebody you have played, without being friends ----- */
  const g = await sitDown(me, opponent);
  g.ga.send({ t: "play", c: 2, r: 2 });
  await g.gb.next((m) => m.t === "state" && m.room.record.moves.length === 1, 6000, "a move");
  g.gb.send({ t: "resign" });
  await g.ga.next((m) => m.t === "state" && m.room.record.phase === "ended", 6000, "the end");
  await wait(500);
  const afterGame = await (await post(opponent.token, me.player.id, "Thanks for the game.")).json();
  assert(afterGame.thread.length === 1, "sitting down at a board is enough, without being friends");

  /* ----- the list ----- */
  const list = await j("/api/me/letters", { headers: bearer(me.token) });
  assert(list.length === 2, "your letters list one thread a person");
  assert(list[0].at >= list[1].at, "newest conversation first");
  assert(list.every((r) => r.player && r.player.name), "each row names who it is with");
  assert(list.every((r) => r.preview), "and shows the last thing said");
  const asText = JSON.stringify(list);
  assert(!asText.includes("unread") && !asText.includes("readAt"),
    "and never claims anything was read");

  /* ----- blocking, which is silent ----- */
  await j(`/api/me/blocked/${friend.player.id}`, { method: "PUT", headers: bearer(me.token) });
  const stopped = await post(friend.token, me.player.id, "Are you there?");
  assert(stopped.status === 403, "a blocked friend cannot write again");
  /* The half that matters: they are told exactly what a stranger is told, so
     nothing in the answer says they were blocked. */
  assert((await stopped.json()).error === "not-met",
    "and is told what a stranger is told, never that they were blocked");
  const theirView = await j(`/api/me/letters/${me.player.id}`, { headers: bearer(friend.token) });
  assert(theirView.can === false && theirView.why === "not-met",
    "their own view of the thread says the same and no more");
  assert(theirView.thread.length === 2, "and the letters already written stay where they are");

  /* ----- and is undone ----- */
  await j(`/api/me/blocked/${friend.player.id}`, { method: "DELETE", headers: bearer(me.token) });
  const again = await (await post(friend.token, me.player.id, "There you are.")).json();
  assert(again.thread.length === 3, "letting them write again works");

  /* ----- nobody is told who has blocked whom ----- */
  assert((await j(`/api/players/${me.player.id}`)).blocked === undefined,
    "a public page carries no block list");
  assert(Array.isArray((await j("/api/me", { headers: bearer(me.token) })).blocked),
    "the owner sees their own");

  /* ----- the shape of it ----- */
  assert((await post(me.token, friend.player.id, "   ")).status === 400, "an empty letter is refused");
  assert((await post(me.token, me.player.id, "hello me")).status === 400, "you cannot write to yourself");
  assert((await post(me.token, "p_nosuchplayer", "hello")).status === 404, "nor to somebody who is not here");
  assert((await raw("/api/me/letters")).status === 401, "letters need a handle to read");
  assert((await raw(`/api/me/letters/${friend.player.id}`, { method: "PUT", headers: bearer(me.token) })).status === 405,
    "a method the route does not have is a 405");
  const long = await (await post(me.token, friend.player.id, "x".repeat(5000))).json();
  assert(long.thread[long.thread.length - 1].text.length === 2000,
    "a long letter is cut to the limit rather than refused");

  /* ----- leaving takes the letters, on both sides ----- */
  await j("/api/me", { method: "DELETE", headers: bearer(friend.token) });
  tokens.splice(tokens.indexOf(friend.token), 1);
  const left = await j("/api/me/letters", { headers: bearer(me.token) });
  assert(left.length === 1, "leaving takes your letters off the other person's list too");
  assert(left[0].player.id === opponent.player.id, "and leaves the rest alone");

  console.log("");
  console.log("all post checks passed");
} finally {
  for (const s of sockets) { try { s.close(); } catch { /* already gone */ } }
  for (const token of tokens) await raw("/api/me", { method: "DELETE", headers: bearer(token) }).catch(() => {});
  console.log("cleaned up");
}
