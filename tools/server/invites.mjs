// Proves asking one named person for a game, against a running sente-server.
// Usage: node invites.mjs [baseUrl]
//
// Four handles are made and all four are removed at the end however it goes,
// so it is safe to run against production. One real game is played to the end,
// because "somebody you have finished a game against" is half the rule about
// who may invite you and there is no other way to reach that state.
//
// The claims being checked are the ones in the header of server/invites.js:
// only a friend or somebody you have played may ask; an invitation waits on
// both shelves; the terms are the point and a handicap game is never rated;
// asking again edits rather than adds; asking somebody who asked first is
// refused rather than quietly turned into one of the two boards; the guest
// takes Black; and leaving takes the invitation off the other person's shelf.

const base = process.argv[2] || "http://127.0.0.1:8787";
const wsBase = base.replace(/^http/, "ws");

const call = async (path, { method = "GET", token, body } = {}) => {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const r = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => null) };
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

const make = async (who) => {
  const p = await ok("/api/register", { method: "POST", body: { name: who + stamp, tint: "mint" } });
  made.push(p.token);
  return p;
};

const shelf = (me) => ok("/api/me/invites", { token: me.token });
const invite = (me, them, terms) =>
  call(`/api/me/invites/${them.player.id}`, { method: "POST", token: me.token, body: terms });

/** Sit in the lobby, so a pushed invitation has somewhere to land. */
const arrive = (p) => new Promise((resolve, reject) => {
  const ws = new WebSocket(`${wsBase}/api/lobby?token=${encodeURIComponent(p.token)}`);
  ws.frames = [];
  sockets.push(ws);
  ws.addEventListener("message", (e) => { try { ws.frames.push(JSON.parse(e.data)); } catch { /* not ours */ } });
  ws.addEventListener("open", () => resolve(ws));
  ws.addEventListener("error", reject);
  setTimeout(() => reject(new Error("lobby socket never opened")), 5000);
});
const settle = (ms = 500) => new Promise((r) => setTimeout(r, ms));

/** Befriend two handles, both sides, so they may reach each other. */
const befriend = async (a, b) => {
  await ok(`/api/me/friends/${b.player.id}`, { method: "POST", token: a.token });
  await ok(`/api/me/friends/${a.player.id}/accept`, { method: "POST", token: b.token });
};

/** Play a whole game out through the room socket, so two handles end it having
 *  finished one together. Two passes and a scoring accept, which is the
 *  shortest finished game there is. */
const playOut = async (gameId, black, white) => {
  const open = (p) => new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsBase}/api/game/${gameId}/ws?token=${encodeURIComponent(p.token)}`);
    sockets.push(ws);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", reject);
    setTimeout(() => reject(new Error("game socket never opened")), 5000);
  });
  const b = await open(black), w = await open(white);
  b.send(JSON.stringify({ t: "pass" }));
  await settle(200);
  w.send(JSON.stringify({ t: "pass" }));
  await settle(300);
  b.send(JSON.stringify({ t: "accept" }));
  await settle(200);
  w.send(JSON.stringify({ t: "accept" }));
  await settle(500);
};

const run = async () => {
  const ana = await make("Ana");
  const bo = await make("Bo");
  const stranger = await make("Str");
  const played = await make("Pld");

  /* ----- who may ask ----- */
  const no = await invite(ana, stranger, { size: 9 });
  assert(no.status === 403 && no.data.error === "not-met",
    "a stranger off the ladder cannot be asked for a game, the same way they cannot be written to");

  await befriend(ana, bo);

  /* ----- the terms ----- */
  const first = await invite(ana, bo, { size: 13, handicap: 4, rated: true });
  assert(first.status === 201 && first.data.outcome === "invited", "a friend can be asked");
  assert(first.data.invite.rated === false,
    "a handicap game is never rated, whatever the caller asked for");
  assert(first.data.invite.size === 13 && first.data.invite.handicap === 4,
    "the board and the handicap are the ones that were asked for");

  const mine = await shelf(ana);
  const theirs = await shelf(bo);
  assert(mine.outgoing.length === 1 && mine.incoming.length === 0, "it is on the asker's shelf as outgoing");
  assert(theirs.incoming.length === 1 && theirs.outgoing.length === 0, "and on theirs as incoming");
  assert(theirs.incoming[0].player.name === ana.player.name, "the row names the person who asked");

  const again = await invite(ana, bo, { size: 9 });
  assert(again.status === 201 && again.data.outcome === "changed",
    "asking again edits the terms rather than leaving two rows about one question");
  assert((await shelf(bo)).incoming.length === 1, "and their shelf still holds exactly one");
  assert((await shelf(bo)).incoming[0].size === 9, "with the terms that were asked for second");

  const crossed = await invite(bo, ana, { size: 19 });
  assert(crossed.status === 409 && crossed.data.error === "they-asked-first",
    "asking somebody who asked first is refused rather than quietly picking one of the two boards");

  /* ----- taking one back, and declining ----- */
  assert((await ok(`/api/me/invites/${bo.player.id}`, { method: "DELETE", token: ana.token })).outcome === "withdrawn",
    "the asker taking it back is called taking it back");
  assert((await shelf(bo)).incoming.length === 0, "and it is off the other shelf in the same breath");

  await invite(ana, bo, { size: 9 });
  assert((await ok(`/api/me/invites/${ana.player.id}`, { method: "DELETE", token: bo.token })).outcome === "declined",
    "the person asked declining is called declining");
  assert((await shelf(ana)).outgoing.length === 0, "and that is off both shelves too");

  /* ----- the push ----- */
  const waiting = await arrive(bo);
  await invite(ana, bo, { size: 9, rated: false });
  await settle(600);
  const pushed = waiting.frames.filter((f) => f.t === "invited");
  assert(pushed.length === 1, "somebody sitting in the lobby is told at once");
  assert(pushed[0].from.name === ana.player.name, "and told who asked");

  /* ----- opening the board ----- */
  const wrong = await call(`/api/me/invites/${bo.player.id}/accept`, { method: "POST", token: ana.token });
  assert(wrong.status === 409 && wrong.data.error === "no-invite",
    "the person who asked cannot accept their own invitation, however much they want the game");

  const table = await ok(`/api/me/invites/${ana.player.id}/accept`, { method: "POST", token: bo.token });
  assert(table.color === "b", "the guest takes Black");
  assert(table.size === 9 && table.rated === false, "the board opens on the terms that were agreed");
  const room = await ok(`/api/game/${table.gameId}`);
  assert(room.seats.b1.id === bo.player.id && room.seats.w1.id === ana.player.id,
    "and the room seats them that way round");
  assert((await shelf(bo)).incoming.length === 0, "the invitation is gone once the board is open");
  assert((await shelf(ana)).outgoing.length === 0, "from both shelves");

  /* ----- somebody you have played ----- */
  const seek = (p, ws) => ws.send(JSON.stringify({ t: "seek", size: 9, key: `k${stamp}` }));
  const one = await arrive(played);
  const two = await arrive(stranger);
  seek(played, one);
  await settle(300);
  seek(stranger, two);
  await settle(800);
  const matched = one.frames.find((f) => f.t === "matched");
  assert(!!matched, "two handles met at a word, so there is a game to finish");
  await playOut(matched.gameId, played, stranger);
  const after = await invite(played, stranger, { size: 9 });
  assert(after.status === 201,
    "somebody you have finished a game against can be asked, without being a friend");

  /* ----- leaving ----- */
  await ok("/api/me", { method: "DELETE", token: played.token });
  assert((await shelf(stranger)).incoming.length === 0,
    "leaving takes the invitation off the other person's shelf, not only your own");
};

const cleanUp = async () => {
  for (const ws of sockets) { try { ws.close(); } catch { /* already closed */ } }
  for (const token of made) {
    try { await call("/api/me", { method: "DELETE", token }); } catch { /* already gone */ }
  }
};

try {
  await run();
  console.log("\nthe invitation holds up");
} catch (e) {
  console.error("\nFAILED: " + e.message);
  process.exitCode = 1;
} finally {
  await cleanUp();
}
