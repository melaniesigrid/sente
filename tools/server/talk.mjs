// Proves the voice signalling relay against a running sente-server.
// Usage: node talk.mjs [baseUrl]
//
// Three handles are made and all three are removed at the end however it goes,
// so it is safe to run against production. One real game is opened by
// invitation, because a call needs two people in the same two chairs.
//
// The claims being checked are the ones in the header of server/talk.js, and
// the one the privacy notice makes. In order: a seated player reaches the other
// chair and nobody else; neither side can be made to negotiate a call it never
// asked for; a spectator has no seat and therefore no call; a frame of the
// wrong shape or size is refused by name; a flood is refused; and, the one that
// matters most, none of it is written down. The room after a whole exchange
// must be indistinguishable from the room before it.
//
// What this does NOT prove is that the call is private. It cannot: this script
// talks to the relay, and the relay is the party the design assumes is hostile.
// The security property is the committed key agreement in talk/, checked by
// `go test ./...` there and by two people saying three go terms out loud.

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

const make = async (who) => {
  const p = await ok("/api/register", { method: "POST", body: { name: who + stamp, tint: "mint" } });
  made.push(p.token);
  return p;
};
const befriend = async (a, b) => {
  await ok(`/api/me/friends/${b.player.id}`, { method: "POST", token: a.token });
  await ok(`/api/me/friends/${a.player.id}/accept`, { method: "POST", token: b.token });
};

const open = (gameId, p) => new Promise((resolve, reject) => {
  const ws = new WebSocket(`${wsBase}/api/game/${gameId}/ws${p ? `?token=${encodeURIComponent(p.token)}` : ""}`);
  ws.frames = [];
  sockets.push(ws);
  ws.addEventListener("message", (e) => { try { ws.frames.push(JSON.parse(e.data)); } catch { /* not ours */ } });
  ws.addEventListener("open", () => resolve(ws));
  ws.addEventListener("error", reject);
  setTimeout(() => reject(new Error("game socket never opened")), 5000);
});

const say = (ws, frame) => ws.send(JSON.stringify(frame));
const talkFrames = (ws) => ws.frames.filter((f) => typeof f.t === "string" && f.t.startsWith("talk/"));
const errors = (ws) => talkFrames(ws).filter((f) => f.t === "talk/error").map((f) => f.reason);
const lastError = (ws) => errors(ws).pop();
const roomOf = (ws) => ws.frames.filter((f) => f.t === "state").pop().room;
// Which chair a socket was given. The guest takes Black, so which of the two
// players is b1 depends on who sent the invitation; reading it beats assuming.
const seatOf = (ws) => ws.frames.find((f) => f.t === "seat").seat;

// A commitment and a public key are base64; the relay only checks the shape.
const B64 = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5";
const FP = "sha-256 " + Array.from({ length: 32 }, (_, i) => (i + 16).toString(16).padStart(2, "0")).join(":");

const run = async () => {
  const kuro = await make("Kuro");
  const shiro = await make("Shiro");
  const eye = await make("Eye");

  await befriend(kuro, shiro);
  await ok(`/api/me/invites/${shiro.player.id}`, { method: "POST", token: kuro.token, body: { size: 9 } });
  const table = await ok(`/api/me/invites/${kuro.player.id}/accept`, { method: "POST", token: shiro.token });
  const gameId = table.gameId;
  assert(typeof gameId === "string", "an invitation taken up opens a board");
  await settle();

  const a = await open(gameId, kuro);
  const b = await open(gameId, shiro);
  const watcher = await open(gameId, eye);
  await settle();

  const before = roomOf(a);
  assert(before && before.id === gameId, "both players and a watcher are at the board");
  const aSeat = seatOf(a);
  assert(aSeat && seatOf(b) && aSeat !== seatOf(b), "the two players hold different chairs");
  assert(seatOf(watcher) === null, "and the watcher holds none");

  /* ----- nobody is made to negotiate a call they never asked for ----- */
  say(a, { t: "talk/offer", sdp: "v=0\r\n" });
  await settle(250);
  assert(lastError(a) === "talk-not-open",
    "signalling before saying hello is refused, so a call cannot start itself");
  assert(talkFrames(b).length === 0, "and nothing reached the other chair");

  say(a, { t: "talk/hello", role: "initiator" });
  await settle(250);
  assert(talkFrames(b).some((f) => f.t === "talk/hello" && f.role === "initiator" && f.from === aSeat),
    "hello reaches the other chair, carrying the role its sender claims and the chair it came from");
  say(a, { t: "talk/commit", commitment: B64 });
  await settle(250);
  assert(lastError(a) === "peer-not-ready",
    "and the rest waits until the other side has asked for a call too");

  /* ----- both in, and the exchange relays in order ----- */
  say(b, { t: "talk/hello", role: "responder" });
  await settle(250);
  say(a, { t: "talk/commit", commitment: B64 });
  await settle(200);
  say(b, { t: "talk/reveal", pub: B64, fingerprint: FP });
  await settle(200);
  say(a, { t: "talk/reveal", pub: B64, fingerprint: FP });
  await settle(200);
  say(a, { t: "talk/offer", sdp: "v=0\r\na=fingerprint:sha-256 AA\r\n" });
  await settle(200);
  say(b, { t: "talk/answer", sdp: "v=0\r\n" });
  await settle(200);
  say(a, { t: "talk/ice", candidate: "candidate:1 1 UDP 1 1.2.3.4 1 typ relay" });
  say(a, { t: "talk/ice", candidate: null });
  await settle(300);

  const heard = talkFrames(b).map((f) => f.t);
  assert(heard.includes("talk/commit") && heard.includes("talk/reveal"),
    "the committed exchange relays: commit, then the responder's reveal, then the initiator's");
  assert(heard.indexOf("talk/commit") < heard.indexOf("talk/offer"),
    "and the commitment arrives before the offer that carries the fingerprint it covers");
  assert(talkFrames(a).some((f) => f.t === "talk/answer"), "the answer comes back");
  assert(talkFrames(b).some((f) => f.t === "talk/ice" && f.candidate === null),
    "end-of-candidates is carried, or the other side waits for candidates that never come");
  assert(errors(a).filter((r) => r !== "talk-not-open" && r !== "peer-not-ready").length === 0,
    "and a whole exchange between two willing players draws no refusals");

  /* ----- the relay reaches the other chair and nobody else ----- */
  assert(talkFrames(watcher).length === 0,
    "a spectator at the same board is sent none of it, in either direction");

  say(watcher, { t: "talk/hello", role: "initiator" });
  await settle(250);
  assert(lastError(watcher) === "not-seated",
    "and a spectator cannot open a call: watching a game stays watching a game");

  /* ----- shape and size are refused by name ----- */
  say(a, { t: "talk/commit", commitment: "not base64!" });
  await settle(200);
  assert(lastError(a) === "bad-commitment", "a commitment that is not base64 is refused");
  say(a, { t: "talk/hello", role: "both" });
  await settle(200);
  assert(lastError(a) === "bad-role", "a role that is neither is refused");
  say(a, { t: "talk/offer", sdp: "x".repeat(9000) });
  await settle(200);
  assert(lastError(a) === "talk-frame-too-big",
    "and an oversized frame is refused, so the relay is not a file transfer");

  // Put the call back in order after those refusals.
  say(a, { t: "talk/hello", role: "initiator" });
  await settle(200);

  /* ----- a flood is refused ----- */
  for (let i = 0; i < 90; i++) say(a, { t: "talk/ice", candidate: `candidate:${i} 1 UDP 1 1.2.3.4 1 typ relay` });
  await settle(700);
  assert(errors(a).includes("too-fast"), "a socket pushing frames faster than a call ever needs is refused");

  /* ----- and none of it was written down ----- */
  say(a, { t: "talk/bye" });
  say(b, { t: "talk/bye" });
  await settle(400);

  const after = roomOf(watcher);
  assert(after.record.moves.length === before.record.moves.length,
    "a whole call added no moves to the game");
  assert(JSON.stringify(after.chat || []) === JSON.stringify(before.chat || []),
    "and said nothing in the chat");
  const text = JSON.stringify(after);
  assert(!text.includes("talk/") && !text.includes(B64) && !text.includes("fingerprint"),
    "and left no trace of itself anywhere in the room: no frame, no key, no fingerprint");

  const fresh = await open(gameId, eye);
  await settle(300);
  const reloaded = roomOf(fresh);
  assert(!JSON.stringify(reloaded).includes("talk/"),
    "a socket opened afterwards is handed a room that never heard of the call");
  assert(reloaded.record.moves.length === before.record.moves.length,
    "the game is exactly the game it was");
};

const cleanup = async () => {
  for (const ws of sockets) { try { ws.close(); } catch { /* already closed */ } }
  for (const token of made) { try { await call("/api/me", { method: "DELETE", token }); } catch { /* gone */ } }
};

run()
  .then(() => console.log("\nall claims hold"))
  .catch((e) => { console.error("\nFAILED", e.message); process.exitCode = 1; })
  .finally(cleanup);
