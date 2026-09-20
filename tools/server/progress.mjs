// Proves the progress routes (a signed-in player's record of what they have
// done, kept on the account) against a running sente-server.
// Usage: node progress.mjs [baseUrl]
import { PROGRESS_MAX_BYTES } from "../../src/store/progress.js";

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

const stamp = Math.random().toString(36).slice(2, 8);
const tokens = [];

try {
  const me = await ok("/api/register", { method: "POST", body: { name: "Prg" + stamp.slice(0, 3), tint: "mint" } });
  tokens.push(me.token);

  const empty = await ok("/api/me/progress", { token: me.token });
  assert(empty.at === 0 && Object.keys(empty.data).length === 0, "a new player has no progress on the account");

  const nobody = await call("/api/me/progress");
  assert(nobody.status === 401, "no token, no progress");

  /* ----- one device writes ----- */
  const laptop = await ok("/api/me/progress", {
    method: "PUT", token: me.token,
    body: { data: { lessonsDone: ["liberties"], chainBest: 2, streak: 2, recall: { "liberties#1": { box: 1, due: "2026-09-16" } } }, at: 1000 },
  });
  assert(laptop.data.lessonsDone.length === 1 && laptop.data.chainBest === 2 && laptop.at === 1000, "what one device wrote comes back as written");

  const read = await ok("/api/me/progress", { token: me.token });
  assert(read.data.chainBest === 2 && read.at === 1000, "and reads back the same");

  /* ----- another device, which did other things while apart ----- */
  const phone = await ok("/api/me/progress", {
    method: "PUT", token: me.token,
    body: { data: { lessonsDone: ["ko"], problemsDone: ["p1"], chainBest: 1, kataStreak: 1520, streak: 0, recall: { "liberties#1": { box: 0, due: "2026-09-17" } } }, at: 2000 },
  });
  assert(phone.data.lessonsDone.length === 2 && phone.data.problemsDone.length === 1, "two devices' finished work is joined");
  assert(phone.data.chainBest === 2, "a count keeps the higher");
  assert(phone.data.kataStreak === 1520 && phone.data.streak === 0, "a streak comes from whichever device wrote later");
  assert(phone.data.recall["liberties#1"].box === 1, "a recall card keeps the further of the two");

  const stale = await ok("/api/me/progress", { method: "PUT", token: me.token, body: { data: { kataStreak: 1300, drillsDone: ["d1"] }, at: 500 } });
  assert(stale.data.kataStreak === 1520 && stale.data.drillsDone.length === 1, "an older device cannot roll a streak back, but what it finished still counts");

  /* ----- shape ----- */
  const junk = await ok("/api/me/progress", { method: "PUT", token: me.token, body: { data: { lessonsDone: "x", theme: "night", chainBest: -4, extra: 1 }, at: 3000 } });
  assert(!("theme" in junk.data) && !("extra" in junk.data) && junk.data.chainBest === 2 && junk.data.lessonsDone.length === 2, "a preference, an unknown field and a wrong shape are dropped, not stored");

  const notObject = await call("/api/me/progress", { method: "PUT", token: me.token, body: { data: "all of it" } });
  assert(notObject.status === 400 && notObject.data.error === "bad-progress", "a document that is not one is refused");

  const big = await call("/api/me/progress", {
    method: "PUT", token: me.token,
    body: { data: { lessonsDone: Array.from({ length: 6000 }, (_, i) => `lesson-${i}-${"x".repeat(12)}`) }, at: 4000 },
  });
  assert(big.status === 413 && big.data.error === "progress-too-big", `more than ${PROGRESS_MAX_BYTES} bytes is refused`);
  const after = await ok("/api/me/progress", { token: me.token });
  assert(after.data.lessonsDone.length === 2, "and the refusal left the stored document alone");

  /* ----- leaving ----- */
  await ok("/api/me", { method: "DELETE", token: me.token });
  tokens.pop();
  const gone = await call("/api/me/progress", { token: me.token });
  assert(gone.status === 401, "leaving takes the progress with the account");

  console.log("\nall progress checks passed");
} finally {
  for (const t of tokens) await call("/api/me", { method: "DELETE", token: t }).catch(() => {});
}
