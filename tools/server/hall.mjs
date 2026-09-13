// Proves the hall — the live room inside a club — against a running sente-server.
// Usage: node hall.mjs [baseUrl]
//
// Four handles are made and all four are removed at the end however it goes,
// so it is safe to run against production. Real sockets are opened, because
// everything this slice is for happens over one.
//
// The claims being checked are the ones in the headers of server/hall.js and
// server/clubObject.js: only a member gets a socket; what is said arrives at
// everybody standing there without anybody reloading; who is here is a live
// socket and nothing stored; anybody may unsay their own line and only a
// keeper may unsay somebody else's; a frame cannot invent a channel; being
// shown the door puts somebody out of the room but leaves what they said;
// leaving Joseki takes it; and closing a club takes the whole hall.

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
const settle = (ms = 500) => new Promise((r) => setTimeout(r, ms));

const stamp = Math.random().toString(36).slice(2, 6);
const made = [];
const sockets = [];

const make = async (who) => {
  const p = await ok("/api/register", { method: "POST", body: { name: who + stamp, tint: "mint" } });
  made.push(p.token);
  return p;
};

/** Stand in a hall. Frames are kept so a test can look at what arrived. */
const standIn = (who, clubId) => new Promise((resolve, reject) => {
  const ws = new WebSocket(`${wsBase}/api/clubs/${clubId}/hall?token=${encodeURIComponent(who.token)}`);
  ws.frames = [];
  ws.closedWith = null;
  sockets.push(ws);
  /* Resolved on the first `hall` frame and not on `open`: the socket is open a
     beat before the room arrives on it, and a check made in that beat is a
     check on an empty hand. */
  ws.addEventListener("message", (e) => {
    let frame;
    try { frame = JSON.parse(e.data); } catch { return; }
    ws.frames.push(frame);
    if (frame.t === "hall") resolve(ws);
  });
  ws.addEventListener("close", (e) => { ws.closedWith = e.code; });
  ws.addEventListener("error", reject);
  setTimeout(() => reject(new Error("hall socket never handed over the hall")), 5000);
});
const refused = (who, clubId) => new Promise((resolve) => {
  const ws = new WebSocket(`${wsBase}/api/clubs/${clubId}/hall?token=${encodeURIComponent(who.token)}`);
  sockets.push(ws);
  ws.addEventListener("open", () => resolve(false));
  ws.addEventListener("error", () => resolve(true));
  ws.addEventListener("close", () => resolve(true));
  setTimeout(() => resolve(false), 4000);
});
/** The code a socket was closed with, waited for rather than polled: a close
 *  travels, and a room with several sockets in it delivers them when it
 *  delivers them. */
const closedWith = (ws, ms = 4000) => new Promise((resolve) => {
  if (ws.closedWith !== null) return resolve(ws.closedWith);
  ws.addEventListener("close", (e) => resolve(e.code), { once: true });
  setTimeout(() => resolve(ws.closedWith), ms);
});
const last = (ws, t) => [...ws.frames].reverse().find((f) => f.t === t);
const saidIn = (ws) => (last(ws, "hall")?.hall.lines.hall ?? []);

const run = async () => {
  const founder = await make("Fou");
  const keeper = await make("Kee");
  const member = await make("Mem");
  const stranger = await make("Str");

  const club = await ok("/api/clubs", {
    method: "POST", token: founder.token,
    body: { name: `Hall Club ${stamp}`, about: "", listed: false },
  });
  for (const who of [keeper, member]) {
    await ok(`/api/clubs/${club.id}/join`, { method: "POST", token: who.token, body: { code: club.code } });
  }
  await ok(`/api/clubs/${club.id}/members/${keeper.player.id}`, {
    method: "PUT", token: founder.token, body: { role: "keeper" },
  });

  /* ----- only a member gets a socket ----- */
  assert(await refused(stranger, club.id), "a stranger is given no socket into a hall they are not in");

  const f = await standIn(founder, club.id);
  assert(!!last(f, "hall"), "a member walks in and is handed the hall");
  assert(saidIn(f).length === 0, "which is empty until somebody says something");

  /* ----- what is said arrives, live ----- */
  const m = await standIn(member, club.id);
  await settle(600);
  assert((last(f, "here")?.ids ?? []).length === 2, "the people already there are told somebody arrived");

  m.send(JSON.stringify({ t: "say", text: "Anybody for a game on Tuesday?" }));
  await settle(700);
  const heard = last(f, "said");
  assert(!!heard && heard.line.text.startsWith("Anybody for a game"),
    "what one person says arrives at the other without anybody reloading");
  assert(heard.line.name === member.player.name, "carrying who said it, so a room looks nobody up");
  assert(heard.line.from === member.player.id && typeof heard.line.id === "string", "and an id of its own");

  m.send(JSON.stringify({ t: "say", text: "   " }));
  await settle(400);
  assert(last(m, "error")?.reason === "empty-saying", "saying nothing is refused, to the person who said it");
  assert(!last(f, "error"), "and to nobody else");

  /* ----- a frame cannot invent a channel ----- */
  m.send(JSON.stringify({ t: "say", text: "in a made-up room", channel: "invented" }));
  await settle(600);
  assert(last(f, "said").channel === "hall",
    "naming a channel that is not there falls back rather than making one");

  /* ----- taking a line down ----- */
  f.send(JSON.stringify({ t: "say", text: "Tuesday suits me." }));
  await settle(600);
  const theirs = last(m, "said").line.id;
  m.send(JSON.stringify({ t: "takeDown", id: theirs }));
  await settle(500);
  assert(last(m, "error")?.reason === "not-allowed",
    "a plain member cannot take down somebody else's line");

  const k = await standIn(keeper, club.id);
  await settle(400);
  k.send(JSON.stringify({ t: "takeDown", id: theirs }));
  await settle(600);
  assert(last(m, "gone")?.id === theirs, "a keeper can, and everybody standing there is told");

  m.send(JSON.stringify({ t: "say", text: "one of my own" }));
  await settle(500);
  const own = last(m, "said").line.id;
  m.send(JSON.stringify({ t: "takeDown", id: own }));
  await settle(500);
  assert(last(f, "gone")?.id === own,
    "and anybody may unsay their own, which is not a power and needs none");

  /* ----- channels ----- */
  const asMember = await call(`/api/clubs/${club.id}/channels`, {
    method: "POST", token: member.token, body: { name: "Study" },
  });
  assert(asMember.status === 403, "a plain member may not add a channel");
  const added = await ok(`/api/clubs/${club.id}/channels`, {
    method: "POST", token: keeper.token, body: { name: "Study group" },
  });
  const study = added.channels.find((c) => c.name === "Study group");
  assert(!!study, "a keeper may, and it arrives in the hall");
  await settle(500);
  assert((last(f, "hall")?.hall.channels ?? []).length === 2,
    "and everybody standing there is handed the new shape");

  m.send(JSON.stringify({ t: "say", text: "in the study", channel: study.id }));
  await settle(600);
  assert(last(f, "said").channel === study.id, "and it can be said in");

  await ok(`/api/clubs/${club.id}/channels/${study.id}`, {
    method: "DELETE", token: keeper.token,
  });
  await settle(500);
  assert((last(f, "hall")?.hall.channels ?? []).length === 1, "removing one takes what was in it");
  const noFirst = await call(`/api/clubs/${club.id}/channels/hall`, { method: "DELETE", token: founder.token });
  assert(noFirst.status === 403, "and the one every club has cannot be removed at all");

  /* ----- a board put up in the room ----- */
  const f2 = await standIn(founder, club.id);
  f2.send(JSON.stringify({ t: "open", terms: { size: 9, handicap: 0, rated: true } }));
  await settle(700);
  const board = last(m, "said");
  assert(board && board.line.kind === "table",
    "a board put up is a line, in the flow of what was being said");
  assert(board.line.terms.size === 9 && board.line.terms.rated === true,
    "carrying the terms it was put up on");

  f2.send(JSON.stringify({ t: "sit", id: board.line.id }));
  await settle(500);
  assert(last(f2, "error")?.reason === "your-own-table",
    "the person who put it up cannot sit at their own board");

  m.send(JSON.stringify({ t: "sit", id: board.line.id }));
  await settle(1200);
  const sat = last(m, "sat");
  assert(!!sat && typeof sat.gameId === "string", "somebody else sitting down opens a real board");
  assert(sat.color === "b", "and the guest takes Black, as an invitation does");
  const room = await ok(`/api/game/${sat.gameId}`);
  assert(room.seats.b1.id === member.player.id && room.seats.w1.id === founder.player.id,
    "the room seats them that way round");
  assert(room.size === 9 && room.rated === true, "on the terms the board was put up on");
  assert(last(f2, "seated")?.taken.gameId === sat.gameId,
    "and everybody in the room is told which game it became");

  m.send(JSON.stringify({ t: "sit", id: board.line.id }));
  await settle(500);
  assert(last(m, "error")?.reason === "already-taken", "nobody else can take a seat that is taken");

  /* ----- the door ----- */
  m.send(JSON.stringify({ t: "say", text: "something I said before I left" }));
  await settle(500);
  await ok(`/api/clubs/${club.id}/members/${member.player.id}`, { method: "DELETE", token: keeper.token });
  assert(await closedWith(m) === 4002, "somebody shown the door is put out of the room, not merely told");
  /* Asked of the room again rather than read off an old frame: a `hall` frame
     is a snapshot of the moment it was sent, and what is being checked here is
     what the hall actually holds. */
  const fresh = await standIn(founder, club.id);
  assert(saidIn(fresh).some((l) => l.text === "something I said before I left"),
    "but what they said stays: they said it in a room, to the people in it");

  /* ----- leaving Joseki ----- */
  k.send(JSON.stringify({ t: "say", text: "a keeper said this" }));
  await settle(500);
  assert(saidIn(await standIn(founder, club.id)).some((l) => l.from === keeper.player.id),
    "a keeper's line is in the hall before they go");
  await ok("/api/me", { method: "DELETE", token: keeper.token });
  await settle(900);
  assert(!saidIn(fresh).some((l) => l.from === keeper.player.id),
    "leaving Joseki takes every line that player said, which being shown the door does not");

  /* ----- closing the club ----- */
  await ok(`/api/clubs/${club.id}`, { method: "DELETE", token: founder.token });
  await settle(900);
  /* The frame is the contract and the close is hygiene: see the note on
     `erase` in server/clubObject.js. What a client acts on is being told. */
  assert(!!last(fresh, "closed"), "closing a club tells everybody standing in the hall");
  assert(fresh.readyState !== 1, "and the socket is on its way out");
  assert(await refused(founder, club.id), "and there is no way back into it");
};

const cleanUp = async () => {
  for (const ws of sockets) { try { ws.close(); } catch { /* already closed */ } }
  for (const token of made) {
    try { await call("/api/me", { method: "DELETE", token }); } catch { /* already gone */ }
  }
};

try {
  await run();
  console.log("\nthe hall holds up");
} catch (e) {
  console.error("\nFAILED: " + e.message);
  process.exitCode = 1;
} finally {
  await cleanUp();
}
