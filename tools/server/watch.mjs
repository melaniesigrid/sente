// Proves the list of games to watch, against a running sente-server.
// Usage: node watch.mjs [baseUrl]
//
// Four handles are made and all four are removed at the end however it goes,
// so it is safe to run against production. One real game is opened by
// invitation and played out to the end, because the list is about games in
// progress and there is no other way to have one.
//
// The claims being checked are the ones in the header of server/watch.js: a
// game is on the list for a viewer only while every player at the board lets
// that viewer see they are here; a viewer's own game is not on their list;
// somebody with no handle sees only the games open to anybody; a game that
// ends leaves the list; and a spectator socket into a listed game is seated
// nowhere and counted as watching.

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
const made = [];
const sockets = [];
const settle = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const make = async (who, showOnline) => {
  const p = await ok("/api/register", { method: "POST", body: { name: who + stamp, tint: "mint" } });
  made.push(p.token);
  if (showOnline) await ok("/api/me/profile", { method: "PATCH", token: p.token, body: { showOnline } });
  return p;
};
const befriend = async (a, b) => {
  await ok(`/api/me/friends/${b.player.id}`, { method: "POST", token: a.token });
  await ok(`/api/me/friends/${a.player.id}/accept`, { method: "POST", token: b.token });
};
const live = async (p) => (await ok("/api/live", p ? { token: p.token } : {})).games;
const ids = (games) => games.map((g) => g.id);

const open = (gameId, p) => new Promise((resolve, reject) => {
  const ws = new WebSocket(`${wsBase}/api/game/${gameId}/ws${p ? `?token=${encodeURIComponent(p.token)}` : ""}`);
  ws.frames = [];
  sockets.push(ws);
  ws.addEventListener("message", (e) => { try { ws.frames.push(JSON.parse(e.data)); } catch { /* not ours */ } });
  ws.addEventListener("open", () => resolve(ws));
  ws.addEventListener("error", reject);
  setTimeout(() => reject(new Error("game socket never opened")), 5000);
});

const run = async () => {
  const ana = await make("Ana", "everyone");
  const bo = await make("Bo", "everyone");
  const cy = await make("Cy");            // never chose: friends, the default
  const viewer = await make("Vw");

  /* ----- a game opens, and is on the list ----- */
  await befriend(ana, bo);
  await ok(`/api/me/invites/${bo.player.id}`, { method: "POST", token: ana.token, body: { size: 9 } });
  const table = await ok(`/api/me/invites/${ana.player.id}/accept`, { method: "POST", token: bo.token });
  const gameId = table.gameId;
  assert(typeof gameId === "string", "an invitation taken up opens a board");
  await settle();

  let seen = await live(viewer);
  assert(ids(seen).includes(gameId), "a stranger is shown a game between two players who let anybody see them");
  const row = seen.find((g) => g.id === gameId);
  assert(row.black.name === bo.player.name && row.white.name === ana.player.name,
    "the row names both players, the guest on Black");
  assert(row.size === 9 && row.phase === "playing" && typeof row.moves === "number", "and says the board and how far along it is");
  assert(!("result" in row) && !("teams" in row), "and carries no more than the lobby needs");

  seen = await live(null);
  assert(ids(seen).includes(gameId), "so is somebody with no handle at all");
  const r = await call("/api/live");
  assert(r.headers.get("cache-control") === "no-store", "and the answer is never cached");

  assert(!ids(await live(ana)).includes(gameId), "a player is not offered their own game to watch");

  /* ----- presence decides ----- */
  await ok("/api/me/profile", { method: "PATCH", token: bo.token, body: { showOnline: "friends" } });
  assert(!ids(await live(viewer)).includes(gameId), "one player narrowing to friends takes the game off a stranger's list");
  assert(!ids(await live(null)).includes(gameId), "and off the list for somebody with no handle");
  await befriend(viewer, bo);
  assert(ids(await live(viewer)).includes(gameId), "a friend of that player sees it again");

  await ok("/api/me/profile", { method: "PATCH", token: bo.token, body: { showOnline: "nobody" } });
  assert(!ids(await live(viewer)).includes(gameId), "nobody means nobody, friend or not, and the other player's yes does not help");
  await ok("/api/me/profile", { method: "PATCH", token: bo.token, body: { showOnline: "everyone" } });
  assert(ids(await live(viewer)).includes(gameId), "and opening up again puts it back");

  /* ----- a game that ends leaves the list; a watcher is seated nowhere ----- */
  const b = await open(gameId, bo), w = await open(gameId, ana);
  const eye = await open(gameId, viewer);
  await settle();
  const seat = eye.frames.find((f) => f.t === "seat");
  assert(seat && seat.seat === null, "a spectator socket is given no chair");
  const state = eye.frames.find((f) => f.t === "state");
  assert(state && state.room && state.room.id === gameId, "and the whole room, as it stands");
  const counted = w.frames.concat(b.frames).find((f) => f.t === "seat");
  assert(counted && typeof counted.watching === "number", "the players are told how many are watching");

  b.send(JSON.stringify({ t: "pass" }));
  await settle(200);
  assert(ids(await live(viewer)).includes(gameId), "a move keeps the game on the list");
  w.send(JSON.stringify({ t: "pass" }));
  await settle(300);
  assert(ids(await live(viewer)).includes(gameId), "so does counting: the players are still at the board");
  b.send(JSON.stringify({ t: "accept" }));
  await settle(200);
  w.send(JSON.stringify({ t: "accept" }));
  await settle(600);
  assert(!ids(await live(viewer)).includes(gameId), "a finished game leaves the list");
  const last = eye.frames.filter((f) => f.t === "state").pop();
  assert(last.room.record.phase === "ended", "and the spectator saw it end");

  /* ----- a handle that never chose is friends-only, and its silence is the same silence ----- */
  await befriend(cy, bo);
  await ok(`/api/me/invites/${cy.player.id}`, { method: "POST", token: bo.token, body: { size: 9 } });
  const second = await ok(`/api/me/invites/${bo.player.id}/accept`, { method: "POST", token: cy.token });
  await settle();
  assert(!ids(await live(viewer)).includes(second.gameId),
    "a player who never chose is friends-only, so their game is not on a stranger's list");
  assert(ids(await live(null)).indexOf(second.gameId) === -1 && (await call("/api/live")).status === 200,
    "and the answer is a shorter list, never a refusal that would say a game exists");
};

const cleanup = async () => {
  for (const ws of sockets) { try { ws.close(); } catch { /* already closed */ } }
  for (const token of made) { try { await call("/api/me", { method: "DELETE", token }); } catch { /* gone */ } }
};

run()
  .then(() => console.log("\nall claims hold"))
  .catch((e) => { console.error("\nFAILED", e.message); process.exitCode = 1; })
  .finally(cleanup);
