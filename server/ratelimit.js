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

/** The caller's address, or null when the platform did not give us one
 *  (local `wrangler dev`, or a request that arrived without the header). */
export function callerIp(req) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for");
  if (!ip) return null;
  const first = ip.split(",")[0].trim();
  return first.length && first.length <= 64 ? first : null;
}
