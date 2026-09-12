// Proves the friends routes against a running sente-server.
// Usage: node friends.mjs [baseUrl]
//
// Three handles are made and removed again, so this is safe to run against
// production: nothing it touches belongs to anybody else, and the `finally`
// removes all three however it ends.
//
// What it is really checking is the invariant the pure module is built around:
// an edge is on both books or on neither. Every assertion below that reads one
// player's list immediately reads the other's.

const base = process.argv[2] || "http://127.0.0.1:8787";
const call = async (path, { method = "GET", token, body } = {}) => {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const r = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, headers: r.headers, data: await r.json().catch(() => null) };
};
const ok = async (path, opts) => {
  const r = await call(path, opts);
  if (r.status >= 400) throw new Error(`${path} -> ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
};
const assert = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); console.log("ok  " + msg); };
const ids = (list) => list.map((p) => p.id);

const stamp = Math.random().toString(36).slice(2, 6);
const tokens = [];
const make = async (who) => {
  const p = await ok("/api/register", { method: "POST", body: { name: who + stamp, tint: "mint" } });
  tokens.push(p.token);
  return p;
};

try {
  const a = await make("Ann");
  const b = await make("Bo");
  const c = await make("Cy");

  const book = (me) => ok("/api/me/friends", { token: me.token });

  /* ----- nothing, to begin with ----- */
  const empty = await book(a);
  assert(empty.friends.length === 0 && empty.incoming.length === 0 && empty.outgoing.length === 0,
    "a new handle has three empty lists");

  /* ----- asking ----- */
  const asked = await ok(`/api/me/friends/${b.player.id}`, { method: "POST", token: a.token });
  assert(asked.outcome === "asked" && asked.standing === "asked", "asking answers with the outcome and the new standing");
  assert(ids((await book(a)).outgoing).includes(b.player.id), "they are on my outgoing list");
  assert(ids((await book(b)).incoming).includes(a.player.id), "and I am on their incoming list, in the same breath");
  assert((await book(b)).friends.length === 0, "which is not yet a friendship");

  const again = await ok(`/api/me/friends/${b.player.id}`, { method: "POST", token: a.token });
  assert(again.outcome === "asked", "asking twice is quiet rather than an error");
  assert((await book(b)).incoming.length === 1, "and does not stack a second request");

  /* ----- what a stranger may not do with somebody else's request ----- */
  const notMine = await call(`/api/me/friends/${b.player.id}/accept`, { method: "POST", token: a.token });
  assert(notMine.status === 409 && notMine.data.error === "no-request",
    "the person who asked cannot accept on the other's behalf");

  /* ----- accepting ----- */
  const yes = await ok(`/api/me/friends/${a.player.id}/accept`, { method: "POST", token: b.token });
  assert(yes.outcome === "friends" && yes.standing === "friends", "accepting makes them friends");
  const [ab, ba] = [await book(a), await book(b)];
  assert(ids(ab.friends).includes(b.player.id) && ids(ba.friends).includes(a.player.id), "on both books");
  assert(ab.outgoing.length === 0 && ba.incoming.length === 0, "and the request is cleared from both");
  assert(ab.friends[0].name === b.player.name && typeof ab.friends[0].rating === "number",
    "a friend comes back as a full row, not a bare id");

  const twice = await call(`/api/me/friends/${b.player.id}`, { method: "POST", token: a.token });
  assert(twice.status === 409 && twice.data.error === "already-friends", "asking a friend is refused as a conflict");

  /* ----- the requests that crossed in the post ----- */
  await ok(`/api/me/friends/${c.player.id}`, { method: "POST", token: a.token });
  const crossed = await ok(`/api/me/friends/${a.player.id}`, { method: "POST", token: c.token });
  assert(crossed.outcome === "friends", "two people who each asked first are friends on the spot");
  assert((await book(c)).incoming.length === 0 && (await book(c)).outgoing.length === 0,
    "and neither is left holding a request");

  /* ----- the one DELETE, doing its three jobs ----- */
  const undone = await ok(`/api/me/friends/${c.player.id}`, { method: "DELETE", token: a.token });
  assert(undone.outcome === "unfriended", "DELETE on a friend ends the friendship");
  assert((await book(c)).friends.length === 0, "on their side too");

  await ok(`/api/me/friends/${c.player.id}`, { method: "POST", token: a.token });
  const declined = await ok(`/api/me/friends/${a.player.id}`, { method: "DELETE", token: c.token });
  assert(declined.outcome === "declined", "DELETE on a request I was sent declines it");
  assert((await book(a)).outgoing.length === 0, "and takes it off the asker's list without telling them anything else");

  await ok(`/api/me/friends/${c.player.id}`, { method: "POST", token: a.token });
  const withdrawn = await ok(`/api/me/friends/${c.player.id}`, { method: "DELETE", token: a.token });
  assert(withdrawn.outcome === "withdrawn", "DELETE on a request I sent takes it back");
  assert((await book(c)).incoming.length === 0, "and off the other person's list");

  const nothing = await ok(`/api/me/friends/${c.player.id}`, { method: "DELETE", token: a.token });
  assert(nothing.outcome === "nothing", "DELETE on a stranger says nothing happened rather than failing");

  /* ----- declining is not blocking ----- */
  await ok(`/api/me/friends/${a.player.id}`, { method: "POST", token: c.token });
  assert((await book(a)).incoming.length === 1, "somebody who was declined may still be asked, and may still ask");

  /* ----- the refusals ----- */
  const self = await call(`/api/me/friends/${a.player.id}`, { method: "POST", token: a.token });
  assert(self.status === 400 && self.data.error === "yourself", "you cannot befriend yourself");

  const ghost = await call("/api/me/friends/p_nosuchplayer", { method: "POST", token: a.token });
  assert(ghost.status === 404 && ghost.data.error === "no-player", "nor somebody who is not here");

  const anon = await call(`/api/me/friends/${b.player.id}`, { method: "POST" });
  assert(anon.status === 401, "and not without a handle of your own");

  assert((await call("/api/me/friends")).status === 401, "the lists need a handle to read");
  assert((await call(`/api/me/friends/${b.player.id}`, { method: "PUT", token: a.token })).status === 405,
    "a method the route does not have is a 405");

  /* ----- leaving takes the friendship off everybody else's list ----- */
  assert(ids((await book(a)).friends).includes(b.player.id), "before leaving, they are friends");
  await ok("/api/me", { method: "DELETE", token: b.token });
  tokens.splice(tokens.indexOf(b.token), 1);
  const after = await book(a);
  assert(!ids(after.friends).includes(b.player.id),
    "leaving takes the departed off the lists of everybody who had them");
  assert(!ids(after.incoming).concat(ids(after.outgoing)).includes(b.player.id),
    "and off the request lists too, not only the friends list");

  console.log("\nall friend checks passed");
} finally {
  for (const token of tokens) await call("/api/me", { method: "DELETE", token }).catch(() => {});
  console.log("cleaned up");
}
