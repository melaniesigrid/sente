// Proves how one player finds another by handle, against a running sente-server.
// Usage: node directory.mjs [baseUrl]
//
// Six handles are made and all six are removed at the end however it goes, so
// it is safe to run against production.
//
// The claims being checked are the ones in the header of server/directory.js:
// a handle is found by any of its words, folded the way somebody would type it;
// a search is a prefix and never a substring; two characters is the floor; only
// a player may search at all; and the answer carries no count, so it cannot be
// read out as a membership list. And two claims the index makes by existing:
// a renamed player is findable by the new handle and not the old, and a player
// who has left is findable by neither.

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

/* Four letters of nonsense, so a run against a live server cannot collide with
   anybody's real handle and cannot be found by anybody searching for a word. */
const stamp = Math.random().toString(36).slice(2, 6);
const made = [];

const make = async (name) => {
  const p = await ok("/api/register", { method: "POST", body: { name, tint: "mint" } });
  made.push(p.token);
  return p;
};

/** What `me` finds, as a list of handles in the order the server answered. */
const find = async (me, q) => {
  const r = await ok(`/api/players?q=${encodeURIComponent(q)}`, { token: me.token });
  assert2(!("count" in r) && !("total" in r) && !("cursor" in r),
    `a search for "${q}" answers with people and nothing to page or count`);
  return r.people.map((p) => p.name);
};
/* A second assert that does not print, for the checks made inside a helper that
   runs many times; the loud one is for the claims the tool exists to make. */
const assert2 = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); };

const run = async () => {
  const solo = `Zqx${stamp}`;
  const two = `Zqx${stamp} Mel${stamp}`;
  const gone = `Yrr${stamp}`;
  const accented = `José${stamp}`;
  const renamed = `Wvv${stamp}`;

  const a = await make(solo);
  await make(two);
  const c = await make(gone);
  await make(accented);
  const me = await make(`Obs${stamp}`);

  assert((await call(`/api/players?q=zqx`)).status === 401,
    "a search with no session is refused: you play here before you look anybody up");

  assert((await find(me, "z")).length === 0, "one character finds nobody");
  assert((await find(me, "z-")).length === 0, "punctuation cannot pad a search out to two characters");

  const zqx = await find(me, `zqx${stamp}`);
  assert(zqx.includes(solo) && zqx.includes(two),
    "a handle and a handle that begins with it both answer to the same prefix");
  assert(!zqx.includes(gone), "somebody whose handle does not begin that way does not answer");
  assert(zqx[0] === solo, "the shorter handle comes first");

  const word = await find(me, `mel${stamp}`);
  assert(word.includes(two) && !word.includes(solo),
    "a handle is found by its second word, which a prefix over the whole handle would miss");

  assert((await find(me, `el${stamp}`)).length === 0,
    "a search is a prefix and never a substring: the middle of a word finds nobody");

  assert((await find(me, `jose${stamp}`)).includes(accented),
    "an accent is folded away, so a handle is found by the letters somebody can type");

  assert(!(await find(a, `zqx${stamp}`)).includes(solo),
    "you are never in your own results: there is nothing on that row that works");
  assert((await find(a, `zqx${stamp}`)).includes(two), "but everybody else still is");

  await ok("/api/me", { method: "PATCH", token: a.token, body: { name: renamed } });
  const after = await find(me, `zqx${stamp}`);
  assert(!after.includes(solo) && !after.includes(renamed),
    "a renamed player is not findable by the handle they stopped using");
  assert((await find(me, `wvv${stamp}`)).includes(renamed),
    "and is findable by the one they chose");
  assert(after.includes(two), "the rename left everybody else's rows alone");

  await ok("/api/me", { method: "DELETE", token: c.token });
  assert((await find(me, `yrr${stamp}`)).length === 0,
    "somebody who has left answers nothing, because leaving takes the index rows too");

  assert((await find(me, `zqx${stamp}`)).length <= 20, "an answer is capped at a screen");
};

const cleanUp = async () => {
  for (const token of made) {
    try { await call("/api/me", { method: "DELETE", token }); } catch { /* already gone */ }
  }
};

try {
  await run();
  console.log("\nthe directory holds up");
} catch (e) {
  console.error("\nFAILED: " + e.message);
  process.exitCode = 1;
} finally {
  await cleanUp();
}
