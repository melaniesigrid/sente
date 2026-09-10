// Proves the account routes against a running sente-server, end to end, and
// cleans up after itself. Usage: node accounts.mjs [baseUrl]
//
// The password is stretched here exactly as the browser stretches it, because
// the server is only ever shown the derived key. `deriveKey` is the app's own
// module, so this fails if the two ever drift apart.
import { deriveKey } from "../../src/net/password.js";

const base = process.argv[2] || "http://127.0.0.1:8787";
const call = async (path, { method = "GET", token, body } = {}) => {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const r = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await r.json().catch(() => null);
  return { status: r.status, data };
};
const ok = async (path, opts) => {
  const r = await call(path, opts);
  if (r.status >= 400) throw new Error(`${path} -> ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
};
const assert = (c, msg) => { if (!c) throw new Error("ASSERT " + msg); console.log("ok  " + msg); };

const stamp = Math.random().toString(36).slice(2, 8);
const email = `smoke-${stamp}@example.com`;
const password = "two eyes live in the corner";
const key = await deriveKey(email, password);
const wrongKey = await deriveKey(email, "one eye dies in the corner");
const cleanup = [];

try {
  /* ----- sign up ----- */
  const up = await ok("/api/signup", { method: "POST", body: { name: "Smoke" + stamp.slice(0, 3), tint: "coral", email, key } });
  cleanup.push(up.token);
  assert(up.token.length === 64, "sign-up gives a session token");
  assert(up.player.email === email && up.player.hasPassword === true, "the owner sees their own address");
  assert(up.player.sessions === 1, "one session, on this device");

  /* ----- the address is taken now ----- */
  const dup = await call("/api/signup", { method: "POST", body: { name: "Other", email, key } });
  assert(dup.status === 409 && dup.data.error === "email-taken", "the same address cannot be claimed twice");

  /* ----- sign in from somewhere else ----- */
  const inA = await ok("/api/signin", { method: "POST", body: { email: email.toUpperCase(), key } });
  cleanup.push(inA.token);
  assert(inA.player.id === up.player.id, "signing in with a differently-cased address finds the same player");
  assert(inA.token !== up.token, "a second device gets its own session token");
  assert(inA.player.sessions === 2, "both sessions are live at once");

  /* ----- a wrong password, and one that does not exist ----- */
  const bad = await call("/api/signin", { method: "POST", body: { email, key: wrongKey } });
  assert(bad.status === 401 && bad.data.error === "bad-credentials", "a wrong password is refused");
  const nobody = await call("/api/signin", { method: "POST", body: { email: `nobody-${stamp}@example.com`, key } });
  assert(nobody.status === 401 && nobody.data.error === "bad-credentials",
    "an address with no account answers exactly as a wrong password does");

  /* ----- the first token still works: signing in elsewhere logs nobody out ----- */
  const still = await ok("/api/me", { token: up.token });
  assert(still.id === up.player.id, "the first device is still signed in");

  /* ----- change the password ----- */
  const newKey = await deriveKey(email, "the corner is worth more than the side");
  const wrongOld = await call("/api/me/password", { method: "POST", token: up.token, body: { oldKey: wrongKey, key: newKey } });
  assert(wrongOld.status === 401, "changing the password needs the old one, session or no session");
  await ok("/api/me/password", { method: "POST", token: up.token, body: { oldKey: key, key: newKey } });
  const afterOld = await call("/api/signin", { method: "POST", body: { email, key } });
  assert(afterOld.status === 401, "the old password stops working");
  const afterNew = await ok("/api/signin", { method: "POST", body: { email, key: newKey } });
  cleanup.push(afterNew.token);
  assert(afterNew.player.id === up.player.id, "the new one works");

  /* ----- sign out of one device only ----- */
  await ok("/api/signout", { method: "POST", token: inA.token });
  const gone = await call("/api/me", { token: inA.token });
  assert(gone.status === 401, "the signed-out session is dead");
  assert((await call("/api/me", { token: up.token })).status === 200, "the other one is untouched");

  /* ----- a guest handle keeps its rating when an address is added ----- */
  const guest = await ok("/api/register", { method: "POST", body: { name: "Guest" + stamp.slice(0, 3), tint: "sky" } });
  cleanup.push(guest.token);
  assert(guest.player.email === null && guest.player.hasPassword === false, "a handle with no address says so");
  const guestEmail = `guest-${stamp}@example.com`;
  const guestKey = await deriveKey(guestEmail, password);
  const attached = await ok("/api/me/account", { method: "POST", token: guest.token, body: { email: guestEmail, key: guestKey } });
  assert(attached.id === guest.player.id && attached.rating === guest.player.rating,
    "attaching an address keeps the same player and the same rating");
  const backIn = await ok("/api/signin", { method: "POST", body: { email: guestEmail, key: guestKey } });
  cleanup.push(backIn.token);
  assert(backIn.player.id === guest.player.id, "and that handle can now be signed into from anywhere");
  const twice = await call("/api/me/account", { method: "POST", token: guest.token, body: { email: `x-${stamp}@example.com`, key: guestKey } });
  assert(twice.status === 409, "a handle cannot collect a second address");

  /* ----- nothing leaks ----- */
  const ladder = await ok("/api/ladder");
  assert(!JSON.stringify(ladder).includes("@"), "no address appears on the public ladder");
  const seen = await ok("/api/me", { token: up.token });
  assert(seen.pw === undefined && seen.tokenHash === undefined, "no stored hash reaches the owner either");

  console.log("\nall account checks passed");
} finally {
  for (const token of cleanup) await call("/api/me", { method: "DELETE", token }).catch(() => {});
  console.log("cleaned up");
}
