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
  // `retry-after` is half of what a 429 is for: a refusal that does not say
  // when to come back is a refusal a client can only answer by hammering.
  return { status: r.status, data, retryAfter: Number(r.headers.get("retry-after") || 0) };
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

  /* ----- guessing at one account, from anywhere -----
     The per-caller limit meters whoever is asking, so a guesser spread over a
     thousand addresses gets a thousand budgets. This is the one keyed on the
     address being guessed at, and it is the only one that bounds guessing at a
     person. Two things have to hold and only a running server can show them:
     the refusal arrives, and it arrives the same way for an address with
     nothing behind it, or the 429 becomes the membership oracle that every
     other answer on this route is written to avoid.

     Needs a server stood up with the limit lowered, because proving a limit of
     thirty from one caller runs into the per-caller thirty first:

       npx wrangler dev --var SIGNIN_ACCOUNT_LIMIT:3 --var SIGNIN_ACCOUNT_WINDOW_S:5
       SIGNIN_ACCOUNT_LIMIT=3 SIGNIN_ACCOUNT_WINDOW_S=5 node tools/server/accounts.mjs

     The vars go to the server, the environment goes to this script, and they
     have to agree: this script is only told what to expect. */
  const guessLimit = Number(process.env.SIGNIN_ACCOUNT_LIMIT || 0);
  if (!guessLimit || guessLimit > 10) {
    console.log("--  guess limit not lowered, skipping (see the comment above this line)");
  } else {
    const guessed = `guessed-${stamp}@example.com`;
    const guessedKey = await deriveKey(guessed, password);
    const victim = await ok("/api/signup", { method: "POST", body: { name: "Vic" + stamp.slice(0, 3), tint: "mint", email: guessed, key: guessedKey } });
    cleanup.push(victim.token);

    // Wrong answers up to the limit are refused as wrong answers, not as too many.
    const wrong = await deriveKey(guessed, "not the password at all");
    for (let i = 0; i < guessLimit; i++) {
      const r = await call("/api/signin", { method: "POST", body: { email: guessed, key: wrong } });
      assert(r.status === 401 && r.data.error === "bad-credentials", `guess ${i + 1} of ${guessLimit} is simply wrong`);
    }
    const done = await call("/api/signin", { method: "POST", body: { email: guessed, key: wrong } });
    assert(done.status === 429 && done.data.error === "too-many-attempts",
      "one guess past the limit is refused for being one too many");
    assert(done.retryAfter > 0 && done.retryAfter <= 3600, `and says when to come back (${done.retryAfter}s)`);

    /* The oracle check, and the reason the charge happens after the lookup and
       the key is the address that was typed. An address nobody has ever used
       must run out of guesses exactly as the real one did. */
    const ghost = `ghost-${stamp}@example.com`;
    const ghostKey = await deriveKey(ghost, password);
    for (let i = 0; i < guessLimit; i++) {
      const r = await call("/api/signin", { method: "POST", body: { email: ghost, key: ghostKey } });
      assert(r.status === 401 && r.data.error === "bad-credentials", `an address with no account: guess ${i + 1} answers as a wrong password`);
    }
    const ghostDone = await call("/api/signin", { method: "POST", body: { email: ghost, key: ghostKey } });
    assert(ghostDone.status === 429 && ghostDone.data.error === "too-many-attempts",
      "and runs out of guesses identically, so the refusal names nobody");

    /* The cost of the limit, proved rather than hoped for. A spent budget is
       read before the password is, so it refuses the owner too. This is the
       assertion that caught the comment claiming otherwise. */
    const owner = await call("/api/signin", { method: "POST", body: { email: guessed, key: guessedKey } });
    assert(owner.status === 429,
      "the owner is refused too while the budget is spent: the read has to come before the password");

    /* What keeps that bounded: the window is anchored at the first wrong
       answer, and a spent bucket is never written to again. So a guesser who
       keeps hammering cannot hold the door shut any longer than one window. */
    const first = await call("/api/signin", { method: "POST", body: { email: guessed, key: wrong } });
    for (let i = 0; i < 3; i++) await call("/api/signin", { method: "POST", body: { email: guessed, key: wrong } });
    const later = await call("/api/signin", { method: "POST", body: { email: guessed, key: wrong } });
    assert(later.retryAfter <= first.retryAfter,
      `hammering never extends the lockout (${first.retryAfter}s then ${later.retryAfter}s)`);

    /* And that it ENDS. Only provable against a window short enough to sit
       through, which is what SIGNIN_ACCOUNT_WINDOW_S is for. */
    const windowS = Number(process.env.SIGNIN_ACCOUNT_WINDOW_S || 0);
    if (windowS && windowS <= 20) {
      await new Promise((r) => setTimeout(r, windowS * 1000 + 500));
      const back = await call("/api/signin", { method: "POST", body: { email: guessed, key: guessedKey } });
      assert(back.status === 200 && back.data.player.id === victim.player.id,
        `the lockout ends on its own: the owner is back in after ${windowS}s`);
      cleanup.push(back.data.token);

      // And a clean slate: one wrong answer after the window is only wrong.
      const fresh = await call("/api/signin", { method: "POST", body: { email: guessed, key: wrong } });
      assert(fresh.status === 401 && fresh.data.error === "bad-credentials",
        "and the count started over, so the next wrong guess is only wrong again");
    } else {
      console.log("--  window not shortened, skipping the it-ends check (set SIGNIN_ACCOUNT_WINDOW_S)");
    }

    /* The other half of not being locked out: the way back in never went
       through this counter. Someone who can read their mail is never stuck,
       whatever a guesser has spent. */
    const letter = await call("/api/forgot", { method: "POST", body: { email: guessed } });
    assert(letter.status === 200 && letter.data.ok === true,
      "asking for a way back in still works while sign-in is locked: a different budget on a different key");
  }

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
