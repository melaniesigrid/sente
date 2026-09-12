// Proves who may be told you are here, against a running sente-server.
// Usage: node presence.mjs [baseUrl]
//
// Presence is a live lobby socket and nothing stored, so this tool has to open
// real ones. Four handles are made: one friend, one stranger, one who lets
// anybody see them and one who lets nobody. All four are removed at the end
// however it goes, so it is safe against production.
//
// The claim being checked is the one in the module header of server/presence.js:
// the answer names only the people who are here AND who let the asker know, and
// nobody is ever reported as being away, so a hidden player and an absent one
// are the same silence.

const base = process.argv[2] || "http://127.0.0.1:8787";
const wsBase = base.replace(/^http/, "ws");

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

const stamp = Math.random().toString(36).slice(2, 6);
const tokens = [];
const sockets = [];

const make = async (who, showOnline) => {
  const p = await ok("/api/register", { method: "POST", body: { name: who + stamp, tint: "mint" } });
  tokens.push(p.token);
  if (showOnline) await ok("/api/me/profile", { method: "PATCH", token: p.token, body: { showOnline } });
  return p;
};

/** Sit in the lobby, which is the only thing that makes somebody "here". */
const arrive = (p) => new Promise((resolve, reject) => {
  const ws = new WebSocket(`${wsBase}/api/lobby?token=${encodeURIComponent(p.token)}`);
  sockets.push(ws);
  ws.addEventListener("open", () => resolve(ws));
  ws.addEventListener("error", reject);
  setTimeout(() => reject(new Error("lobby socket never opened")), 5000);
});

const leave = (ws) => new Promise((resolve) => {
  ws.addEventListener("close", () => resolve());
  ws.close();
  setTimeout(resolve, 2000);
});

const askAbout = async (viewer, people) => {
  const ids = people.map((p) => p.player.id).join(",");
  const r = await ok(`/api/presence?ids=${encodeURIComponent(ids)}`, viewer ? { token: viewer.token } : {});
  return new Set(r.online);
};

try {
  const me = await make("See");
  const friend = await make("Fri");           // default: friends
  const stranger = await make("Str");         // default: friends
  const open = await make("Opn", "everyone");
  const shut = await make("Sht", "nobody");
  const everybody = [friend, stranger, open, shut];

  /* ----- the setting ----- */
  assert((await ok("/api/me", { token: me.token })).showOnline === "friends",
    "a new handle lets its friends see it, not everybody");
  const set = await ok("/api/me/profile", { method: "PATCH", token: shut.token, body: { showOnline: "nobody" } });
  assert(set.showOnline === "nobody", "the setting comes back as chosen");
  const junk = await ok("/api/me/profile", { method: "PATCH", token: stranger.token, body: { showOnline: "PUBLIC" } });
  assert(junk.showOnline === "friends", "a setting the server does not know lands on the private default");

  const ladder = await ok("/api/ladder");
  assert(!JSON.stringify(ladder).includes("showOnline"),
    "the ladder does not carry anybody's setting, so it is not a list of who is hiding");
  const seen = await ok(`/api/players/${shut.player.id}`);
  assert(seen.showOnline === undefined, "nor does a player's public page");

  /* ----- nobody is here yet ----- */
  assert((await askAbout(me, everybody)).size === 0, "with nobody in the lobby, nobody is named");

  /* ----- become friends with one of them ----- */
  await ok(`/api/me/friends/${friend.player.id}`, { method: "POST", token: me.token });
  await ok(`/api/me/friends/${me.player.id}/accept`, { method: "POST", token: friend.token });

  /* ----- everybody arrives ----- */
  for (const p of everybody) await arrive(p);
  const here = await askAbout(me, everybody);

  assert(here.has(friend.player.id), "a friend on the default setting is named");
  assert(here.has(open.player.id), "so is somebody who lets anybody see them");
  assert(!here.has(stranger.player.id), "a stranger on the default setting is not");
  assert(!here.has(shut.player.id), "and neither is somebody who lets nobody see them");

  /* The privacy claim itself: the two absences are indistinguishable. Somebody
     hiding while present and somebody visible while away both simply are not
     in the answer, and the answer has no field that could tell them apart. */
  const raw = await ok(`/api/presence?ids=${shut.player.id},${stranger.player.id}`, { token: me.token });
  assert(Array.isArray(raw.online) && raw.online.length === 0,
    "the answer is a list of who is here, never a map with false in it");
  assert(!JSON.stringify(raw).includes("false") && !JSON.stringify(raw).includes("offline"),
    "so nothing in it says anybody is away, or hiding");

  /* ----- a request is not a friendship ----- */
  await ok(`/api/me/friends/${stranger.player.id}`, { method: "POST", token: me.token });
  assert(!(await askAbout(me, [stranger])).has(stranger.player.id),
    "asking somebody is not a way to watch them while they decide");

  /* ----- you can always see yourself ----- */
  await arrive(me);
  assert((await askAbout(me, [me])).has(me.player.id), "you see yourself, whatever you chose");
  await ok("/api/me/profile", { method: "PATCH", token: me.token, body: { showOnline: "nobody" } });
  assert((await askAbout(me, [me])).has(me.player.id), "including when you have hidden from everybody else");

  /* ----- a visitor with no handle ----- */
  const visitor = await askAbout(null, everybody);
  assert(visitor.has(open.player.id), "a visitor with no handle sees somebody who allows anybody");
  assert(!visitor.has(friend.player.id) && !visitor.has(shut.player.id),
    "and sees nobody else, having no friendships to stand on");

  /* ----- leaving the lobby ----- */
  await leave(sockets.find((s) => s.url.includes(encodeURIComponent(open.token))) || sockets[2]);
  const afterOpenLeft = await askAbout(me, [open]);
  assert(!afterOpenLeft.has(open.player.id), "closing the tab stops you being here, at once");

  /* ----- the shape of the route ----- */
  assert((await ok("/api/presence?ids=", { token: me.token })).online.length === 0,
    "asking about nobody answers with nobody");
  assert((await ok("/api/presence", { token: me.token })).online.length === 0,
    "and so does asking with no ids parameter at all");
  assert((await ok(`/api/presence?ids=p_nosuch,${friend.player.id}`, { token: me.token })).online.includes(friend.player.id),
    "an id that is not a player is skipped rather than failing the whole question");
  const noStore = await call(`/api/presence?ids=${friend.player.id}`, { token: me.token });
  assert(/no-store/.test(noStore.headers.get("cache-control") || ""),
    "the answer is never cached: it depends on who is asking and changes by the second");

  console.log("\nall presence checks passed");
} finally {
  for (const ws of sockets) { try { ws.close(); } catch { /* already gone */ } }
  for (const token of tokens) await call("/api/me", { method: "DELETE", token }).catch(() => {});
  console.log("cleaned up");
}
