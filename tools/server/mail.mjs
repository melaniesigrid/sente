// Proves the two letters against a running sente-server, end to end, and
// cleans up after itself. Usage:
//
//   SENTE_ADMIN_TOKEN=... node mail.mjs [baseUrl]
//
// The links themselves are the problem this tool has to solve: they arrive by
// post, and there is no mailbox here to read. So it mints them through the
// operator route (POST /api/admin/mail/:kind/:id), which hands back exactly
// the link the letter would have carried without sending anything. That route
// needs ADMIN_TOKEN — `npx wrangler secret put ADMIN_TOKEN` for a deployment,
// or a line in `.dev.vars` for `npm run dev:server`.
//
// The password is stretched here exactly as the browser stretches it, because
// the server is only ever shown the derived key.
import { deriveKey } from "../../src/net/password.js";

const base = process.argv[2] || "http://127.0.0.1:8787";
const admin = process.env.SENTE_ADMIN_TOKEN;
if (!admin) {
  console.error("SENTE_ADMIN_TOKEN is not set. It is the secret the operator routes are behind;");
  console.error("this tool needs it to mint the links a letter would have carried.");
  process.exit(2);
}

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

/** Mint a link through the operator route and pull the token back out of it. */
const mint = async (kind, id) => {
  const { link } = await ok(`/api/admin/mail/${kind}/${id}`, { method: "POST", token: admin });
  const token = new URL(link, "https://example.invalid").searchParams.get(kind);
  if (!/^[0-9a-f]{64}$/.test(token || "")) throw new Error(`minted link has no ${kind} token: ${link}`);
  return token;
};

const stamp = Math.random().toString(36).slice(2, 8);
const email = `letters-${stamp}@example.com`;
const was = "two eyes live in the corner";
const now = "one eye dies in the corner, alone";
const [wasKey, nowKey] = await Promise.all([deriveKey(email, was), deriveKey(email, now)]);
const junk = "f".repeat(64);
let live = null;   // the session to clean up with

try {
  const health = await ok("/api/health");
  console.log(`--- ${base} · mail is "${health.mail}" ---`);
  if (health.mail !== "sending") {
    console.log("    (nothing will actually be posted; the links are minted, not sent)");
  }

  /* ----- an address starts out typed, not proved ----- */
  const up = await ok("/api/signup", {
    method: "POST",
    body: { name: "Post" + stamp.slice(0, 3), tint: "sky", email, key: wasKey },
  });
  live = up.token;
  assert(up.player.emailVerified === false, "a new account's address is unconfirmed");

  /* ----- asking for the letter ----- */
  await ok("/api/me/verify", { method: "POST", token: live });
  assert(true, "the owner can ask for a confirmation letter");

  /* ----- and following the link in it ----- */
  const firstLink = await mint("verify", up.player.id);
  const secondLink = await mint("verify", up.player.id);
  assert(firstLink !== secondLink, "asking twice mints two different tokens");
  const stale = await call("/api/verify", { method: "POST", body: { token: firstLink } });
  assert(stale.status === 400 && stale.data.error === "bad-token",
    "the earlier link stops working, so two live keys are never left in one inbox");

  const done = await ok("/api/verify", { method: "POST", body: { token: secondLink } });
  assert(done.ok === true && done.email === email, "the newest link confirms the address");
  const me = await ok("/api/me", { token: live });
  assert(me.emailVerified === true, "and the account says so afterwards");

  const again = await call("/api/verify", { method: "POST", body: { token: secondLink } });
  assert(again.status === 400 && again.data.error === "bad-token", "a confirmation link works once");
  const pointless = await call("/api/me/verify", { method: "POST", token: live });
  assert(pointless.status === 409 && pointless.data.error === "already-verified",
    "and there is nothing to send once an address is confirmed");

  /* ----- forgetting the password ----- */
  const asked = await ok("/api/forgot", { method: "POST", body: { email } });
  const nobody = await ok("/api/forgot", { method: "POST", body: { email: `nobody-${stamp}@example.com` } });
  assert(JSON.stringify(asked) === JSON.stringify(nobody),
    "an address with an account and one without give the same answer, byte for byte");
  const nonsense = await ok("/api/forgot", { method: "POST", body: { email: "not an address" } });
  assert(JSON.stringify(nonsense) === JSON.stringify(asked), "so does something that is not an address");

  /* ----- a second device, so the reset has something to sign out ----- */
  const elsewhere = await ok("/api/signin", { method: "POST", body: { email, key: wasKey } });
  assert(elsewhere.player.sessions === 2, "two devices are signed in before the reset");

  /* ----- the page behind the link ----- */
  const resetToken = await mint("reset", up.player.id);
  const target = await ok(`/api/reset/${resetToken}`);
  assert(target.email === email, "the reset page is told which address the link went to");
  assert(target.name === up.player.name, "and who it belongs to");
  assert(target.pw === undefined && target.id === undefined, "and nothing else about the account");

  const peeked = await ok(`/api/reset/${resetToken}`);
  assert(peeked.email === email, "looking at the link does not spend it");

  /* ----- setting the new password ----- */
  const reset = await ok("/api/reset", { method: "POST", body: { token: resetToken, key: nowKey } });
  const previous = live;
  live = reset.token;
  assert(reset.token !== previous && reset.token !== elsewhere.token, "the reset hands back a fresh session");
  assert(reset.player.sessions === 1, "and it is the only one left");

  const oldSession = await call("/api/me", { token: previous });
  const otherSession = await call("/api/me", { token: elsewhere.token });
  assert(oldSession.status === 401 && otherSession.status === 401,
    "every session that existed before is signed out, this browser's included");

  const withOld = await call("/api/signin", { method: "POST", body: { email, key: wasKey } });
  assert(withOld.status === 401 && withOld.data.error === "bad-credentials", "the old password is no good now");
  const withNew = await ok("/api/signin", { method: "POST", body: { email, key: nowKey } });
  assert(withNew.player.id === up.player.id, "and the new one signs into the same handle");

  const spent = await call("/api/reset", { method: "POST", body: { token: resetToken, key: nowKey } });
  assert(spent.status === 400 && spent.data.error === "bad-token", "a way back in works once");

  /* ----- links that were never real ----- */
  const guessed = await call(`/api/reset/${junk}`);
  assert(guessed.status === 400 && guessed.data.error === "bad-token", "a guessed reset link is refused");
  const guessedVerify = await call("/api/verify", { method: "POST", body: { token: junk } });
  assert(guessedVerify.status === 400 && guessedVerify.data.error === "bad-token",
    "so is a guessed confirmation link, in exactly the same words");
  const short = await call("/api/verify", { method: "POST", body: { token: "abc" } });
  assert(short.status === 400 && short.data.error === "bad-token", "and so is one that is not a token at all");

  console.log("\nall good");
} catch (e) {
  console.error("\nFAILED " + e.message);
  process.exitCode = 1;
} finally {
  // Leave nothing behind, whether it passed or not.
  if (live) await call("/api/me", { method: "DELETE", token: live }).catch(() => {});
}
