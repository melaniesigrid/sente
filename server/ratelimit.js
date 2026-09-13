/* ----------------------- RATE LIMIT (pure) -----------------------
   A fixed-window counter, kept pure so the policy is testable without a
   Durable Object. The caller holds the bucket in storage and hands it back;
   `hit` returns the new bucket and whether this request is allowed.

   Fixed windows are coarse: a caller can spend a whole window's budget at the
   end of one window and again at the start of the next. That is fine here.
   This exists to stop a script filling the account store, not to meter an API. */

/** @param {{ at: number, n: number } | null | undefined} bucket
 *  @param {number} now      milliseconds
 *  @param {number} limit    requests allowed per window
 *  @param {number} windowMs window length
 *  @returns {{ bucket: { at, n }, allowed: boolean, retryAfterMs: number }} */
export function hit(bucket, now, limit, windowMs) {
  const fresh = !bucket || typeof bucket.at !== "number" || now - bucket.at >= windowMs;
  const at = fresh ? now : bucket.at;
  const n = (fresh ? 0 : bucket.n) + 1;
  const allowed = n <= limit;
  return {
    bucket: { at, n: allowed ? n : bucket.n + 1 },
    allowed,
    retryAfterMs: allowed ? 0 : Math.max(0, at + windowMs - now),
  };
}

/** Give one back, for a handle that has been removed again. The limit exists to
 *  keep the account store from being filled; an account that no longer exists is
 *  not filling it, so leaving refunds what claiming spent. Never goes below zero. */
export function refund(bucket, now, windowMs) {
  if (!bucket || typeof bucket.at !== "number" || now - bucket.at >= windowMs) return null;
  const n = Math.max(0, bucket.n - 1);
  return n === 0 ? null : { at: bucket.at, n };
}

/** How many accounts one address may claim in an hour. Generous for a household
 *  or a classroom sharing an address, and no use to a script filling the store.
 *  Claiming and then leaving costs nothing, so ordinary churn never runs into it. */
export const REGISTER_LIMIT = 20;
export const REGISTER_WINDOW_MS = 60 * 60 * 1000;

/** Read a limit off the environment, falling back to the constant. The reason
 *  is `capFrom` in beta.js word for word: a refusal that can only be reached by
 *  editing the source is a refusal nobody has ever seen work. A server stood up
 *  with `SIGNIN_ACCOUNT_LIMIT=3` lets `tools/server/accounts.mjs` prove the
 *  thing rather than assert that the constant is still 30.
 *
 *  Plain decimal digits only: `Number()` alone takes "1e6" and "0x64", and
 *  neither is a limit anybody meant to type. Anything else is ignored rather
 *  than honoured, because a typo in a var must never quietly remove a limit. */
export const LIMIT_MAX = 100_000;
export const limitFrom = (raw, fallback, max = LIMIT_MAX) => {
  if (!/^\d+$/.test(String(raw ?? "").trim())) return fallback;
  const n = Number(String(raw).trim());
  if (n > 0 && n <= max) return n;
  console.warn(`limit ${raw} is outside 1..${max}; using ${fallback}`);
  return fallback;
};

/** How many sign-in attempts one address may make in an hour. Thirty is far
 *  more than a person who has forgotten which password they used will need,
 *  and far less than guessing one is worth. Every attempt counts, right or
 *  wrong, so a correct guess does not buy the guesser a fresh budget. */
export const SIGNIN_LIMIT = 30;
export const SIGNIN_WINDOW_MS = 60 * 60 * 1000;

/** And how many times one ACCOUNT may be guessed at in an hour, counted on the
 *  address that was typed rather than on the caller.
 *
 *  WHY THE LIMIT ABOVE IS NOT ENOUGH
 *  It meters whoever is asking. Somebody guessing at one person's password from
 *  a thousand addresses gets a thousand fresh budgets, which is thirty thousand
 *  guesses an hour at one account and is exactly the shape of the attack the
 *  per-caller limit looks like it stops. This is the one that actually bounds
 *  guessing at a person: the caller can change, the address they are guessing
 *  at cannot.
 *
 *  ONLY WRONG ANSWERS ARE CHARGED, AND GETTING IN CLEARS THE COUNT
 *  So a person who knows their password spends nothing at all: they succeed on
 *  the first try, and succeeding wipes whatever a guesser had accrued behind
 *  them. Ordinary use never touches this.
 *
 *  AND IT CAN STILL LOCK SOMEBODY OUT. SAY SO PLAINLY.
 *  Once the count is spent the refusal comes BEFORE the password is looked at,
 *  because a limit that checked first and refused only wrong answers would
 *  bound nothing at all: the guesser would simply be told 401, 401, 401, 200.
 *  So somebody who knows your address can spend your hour for you, and until
 *  it passes your own password will not get you in either. That is a real cost
 *  and it is what the limit costs to mean anything.
 *
 *  Three things keep it small. The window is anchored at the FIRST wrong
 *  answer and a spent bucket is never written to again, so nobody can hold a
 *  lockout open by keeping at it: one hour is the most it can ever be. Joseki
 *  discloses no address anywhere, so a guesser has to have got yours
 *  elsewhere. And the way back in does not pass through this counter: the
 *  reset letter is a different budget on a different key, so somebody who can
 *  read their mail is never locked out, only slowed down.
 *
 *  Thirty, the same as the per-caller number, because the two answer different
 *  questions and a person only ever meets this one after thirty WRONG answers
 *  in an hour, which is not a thing a person who has their password does. */
export const SIGNIN_ACCOUNT_LIMIT = 30;
export const SIGNIN_ACCOUNT_WINDOW_MS = 60 * 60 * 1000;

/** The window is overridable too, in seconds, and for a sharper reason than
 *  the limit: the property worth proving is that the lockout ENDS, and a test
 *  that proves it against an hour-long window is a test nobody runs. */
export const SIGNIN_ACCOUNT_WINDOW_MAX_S = 24 * 60 * 60;

/** Whether a bucket is already spent, WITHOUT spending from it.
 *
 *  `hit` is the wrong tool where only failures are charged: it counts the
 *  question as well as the wrong answer, so a person signing in correctly would
 *  pay for having asked. This reads the bucket and says nothing to it. An
 *  expired window is never over, the same way `hit` treats it as fresh. */
export function over(bucket, now, limit, windowMs) {
  if (!bucket || typeof bucket.at !== "number" || now - bucket.at >= windowMs) {
    return { over: false, retryAfterMs: 0 };
  }
  return { over: bucket.n >= limit, retryAfterMs: Math.max(0, bucket.at + windowMs - now) };
}

/** The caller's address, or null when the platform did not give us one
 *  (local `wrangler dev`, or a request that arrived without the header). */
export function callerIp(req) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for");
  if (!ip) return null;
  const first = ip.split(",")[0].trim();
  return first.length && first.length <= 64 ? first : null;
}

/** How many ways back in one address (the caller's, and the account's) may
 *  ask for in an hour. Low on purpose in both directions: a person who has
 *  forgotten a password asks once and waits for the letter, and the limit on
 *  the account's own address is what keeps this from being a way to fill
 *  somebody else's inbox by typing it over and over. */
export const FORGOT_LIMIT = 5;
export const FORGOT_WINDOW_MS = 60 * 60 * 1000;

/** How many confirmation letters one account may ask for in an hour. Enough
 *  for a letter that went to spam and a second try, and no more: the caller
 *  is signed in, so this is not a way in, only a way to send. */
export const VERIFY_LIMIT = 5;
export const VERIFY_WINDOW_MS = 60 * 60 * 1000;
