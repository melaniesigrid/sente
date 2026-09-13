// Proves the club and its roll, against a running sente-server.
// Usage: node clubs.mjs [baseUrl]
//
// Five handles are made and all five are removed at the end however it goes,
// so it is safe to run against production. The clubs they found go with them:
// a founder leaving closes their club, which is itself one of the checks.
//
// The claims being checked are the ones in the header of server/clubs.js and
// in docs/designs/the-club.md: nobody is added to a club; an unlisted club is
// invisible rather than merely unadvertised; three roles and four powers with
// no way round them; a founder cannot walk out of their own club; a code is
// revocable; and leaving Joseki leaves nothing behind, clubs included.

const base = process.argv[2] || "http://127.0.0.1:8787";

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
const make = async (who) => {
  const p = await ok("/api/register", { method: "POST", body: { name: who + stamp, tint: "mint" } });
  made.push(p.token);
  return p;
};

const run = async () => {
  const founder = await make("Fou");
  const keeper = await make("Kee");
  const member = await make("Mem");
  const stranger = await make("Str");
  const listedJoiner = await make("Lis");

  /* ----- founding ----- */
  const club = await ok("/api/clubs", {
    method: "POST", token: founder.token,
    body: { name: `Go Guatemala ${stamp}`, about: "We meet on Tuesdays.", listed: false },
  });
  assert(club.role === "founder" && club.members === 1,
    "founding a club makes the founder its first member, and there is never one with nobody in it");
  assert(typeof club.code === "string" && club.code.length === 8, "it comes with a code");
  assert(!/[01ILO]/.test(club.code), "written in an alphabet with nothing ambiguous in it");

  const bad = await call("/api/clubs", { method: "POST", token: founder.token, body: { name: "x" } });
  assert(bad.status === 400 && bad.data.error === "bad-club-name", "a name too short to be one is refused");

  /* ----- an unlisted club is invisible, not merely unadvertised ----- */
  const peek = await call(`/api/clubs/${club.id}`, { token: stranger.token });
  assert(peek.status === 404 && peek.data.error === "no-club",
    "a stranger asking about an unlisted club gets what a made-up id gets");
  assert((await ok(`/api/clubs?q=guatemala`, { token: stranger.token })).clubs.length === 0,
    "and it is in no index, so searching does not turn it up either");

  /* ----- the code is the way in, and it is the only way ----- */
  const noCode = await call(`/api/clubs/${club.id}/join`, { method: "POST", token: member.token, body: {} });
  assert(noCode.status === 403 && noCode.data.error === "bad-code", "walking in without the code is refused");
  const wrong = await call(`/api/clubs/${club.id}/join`, { method: "POST", token: member.token, body: { code: "ABCD2345" } });
  assert(wrong.status === 403, "and so is the wrong one");

  const face = await ok(`/api/clubs/code/${club.code}`, { token: member.token });
  assert(face.name.startsWith("Go Guatemala") && face.code === undefined,
    "a code says what it opens, and never carries itself back");
  assert(face.roll === undefined, "nor who is in it: a code is not a right to read the roll");

  for (const who of [keeper, member]) {
    await ok(`/api/clubs/${club.id}/join`, { method: "POST", token: who.token, body: { code: club.code } });
  }
  const again = await call(`/api/clubs/${club.id}/join`, { method: "POST", token: member.token, body: { code: club.code } });
  assert(again.status === 409 && again.data.error === "already-a-member", "nobody is counted twice");

  const full = await ok(`/api/clubs/${club.id}`, { token: founder.token });
  assert(full.members === 3 && full.roll.length === 3, "the roll and the count agree");
  assert(full.roll[0].role === "founder", "and the roll reads founder first");

  const mine = await ok("/api/me/clubs", { token: member.token });
  assert(mine.clubs.length === 1 && mine.clubs[0].role === "member",
    "a member's own list answers in one call, with their standing in it");

  /* ----- three roles, four powers, and no way round them ----- */
  const memberTries = await call(`/api/clubs/${club.id}/members/${keeper.player.id}`, {
    method: "PUT", token: member.token, body: { role: "keeper" },
  });
  assert(memberTries.status === 403, "a plain member may name nobody");

  await ok(`/api/clubs/${club.id}/members/${keeper.player.id}`, {
    method: "PUT", token: founder.token, body: { role: "keeper" },
  });
  assert((await ok(`/api/clubs/${club.id}`, { token: keeper.token })).role === "keeper",
    "a founder may name a keeper");

  const keeperNames = await call(`/api/clubs/${club.id}/members/${member.player.id}`, {
    method: "PUT", token: keeper.token, body: { role: "keeper" },
  });
  assert(keeperNames.status === 403, "a keeper may not name another keeper");

  const keeperChanges = await call(`/api/clubs/${club.id}`, {
    method: "PATCH", token: keeper.token, body: { name: "Keeper's Club" },
  });
  assert(keeperChanges.status === 403, "nor change the club");

  const outOfTurn = await call(`/api/clubs/${club.id}/members/${founder.player.id}`, {
    method: "DELETE", token: keeper.token,
  });
  assert(outOfTurn.status === 403, "nor show the founder the door");

  /* ----- a founder cannot walk out of their own club ----- */
  const walkOut = await call(`/api/clubs/${club.id}/me`, { method: "DELETE", token: founder.token });
  assert(walkOut.status === 409 && walkOut.data.error === "founder-cannot-leave",
    "a founder cannot walk out, because a club with no founder has nobody who can close it");

  /* ----- the door ----- */
  await ok(`/api/clubs/${club.id}/members/${member.player.id}`, { method: "DELETE", token: keeper.token });
  assert((await ok(`/api/clubs/${club.id}`, { token: founder.token })).members === 2,
    "a keeper may show a member out, and the count follows");
  assert((await ok("/api/me/clubs", { token: member.token })).clubs.length === 0,
    "and the club is off their own list in the same breath");

  /* ----- the code is revocable ----- */
  const old = club.code;
  const rolled = await ok(`/api/clubs/${club.id}/code`, { method: "POST", token: founder.token });
  assert(rolled.code !== old, "a founder may issue a new code");
  const staleCode = await call(`/api/clubs/${club.id}/join`, { method: "POST", token: member.token, body: { code: old } });
  assert(staleCode.status === 403, "and the old one stops working");
  assert((await call(`/api/clubs/code/${old}`, { token: member.token })).status === 403,
    "and no longer says what it used to open");

  /* ----- listing one puts it in the index ----- */
  const listedClub = await ok("/api/clubs", {
    method: "POST", token: founder.token,
    body: { name: `Xylo Club ${stamp}`, about: "", listed: true },
  });
  const hits = await ok(`/api/clubs?q=xylo`, { token: stranger.token });
  assert(hits.clubs.some((c) => c.id === listedClub.id), "a listed club is found by name");
  assert(hits.clubs.every((c) => c.code === undefined), "and no search result carries a code");
  await ok(`/api/clubs/${listedClub.id}/join`, { method: "POST", token: listedJoiner.token, body: {} });
  assert((await ok("/api/me/clubs", { token: listedJoiner.token })).clubs.length === 1,
    "and a listed club needs no code to walk into");

  await ok(`/api/clubs/${listedClub.id}`, { method: "PATCH", token: founder.token, body: { listed: false } });
  assert((await ok(`/api/clubs?q=xylo`, { token: stranger.token })).clubs.length === 0,
    "unlisting one takes it out of the index");

  /* ----- closing, and leaving ----- */
  await ok(`/api/clubs/${listedClub.id}`, { method: "DELETE", token: founder.token });
  assert((await ok("/api/me/clubs", { token: listedJoiner.token })).clubs.length === 0,
    "closing a club takes it off every member's list, not only the founder's");

  await ok("/api/me", { method: "DELETE", token: founder.token });
  assert((await ok("/api/me/clubs", { token: keeper.token })).clubs.length === 0,
    "and a founder leaving Joseki closes the club behind them");
  assert((await call(`/api/clubs/${club.id}`, { token: keeper.token })).status === 404,
    "the club itself is gone, not merely unlisted");
};

const cleanUp = async () => {
  for (const token of made) {
    try { await call("/api/me", { method: "DELETE", token }); } catch { /* already gone */ }
  }
};

try {
  await run();
  console.log("\nthe club holds up");
} catch (e) {
  console.error("\nFAILED: " + e.message);
  process.exitCode = 1;
} finally {
  await cleanUp();
}
