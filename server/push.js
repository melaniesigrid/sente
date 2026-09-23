/* ----------------------- PUSH (pure, plus one signature) -----------------------
   Telling a browser that a letter arrived, without telling anybody what it said.

   WHAT IS SENT, AND WHAT IS NOT
   A push here carries NO PAYLOAD. The request the server makes to the push
   service (Google's, Apple's or Mozilla's, whichever the browser belongs to)
   is an empty POST to an endpoint the browser handed us, signed so the
   service knows it came from Joseki. The service learns that something
   happened; it does not learn who wrote, or what. The service worker in the
   browser then shows a fixed line ("there is post") and the app fetches the
   real count when it opens, the way it always has.

   That is the whole reason there is no encryption in this file. Encrypting a
   payload (RFC 8291) is a page of ECDH and HKDF that exists to keep the
   letter's words from the push service, and the cheapest way to keep the
   words from it is not to send them.

   IT IS OFF UNTIL THE KEYS ARE SET
   `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are Worker secrets, the same
   shape as the TURN keys and the mail domain: absent, and the server reports
   `"push": "off"`, refuses to hand out a key, and files a letter exactly as
   before. Nothing else in the post depends on this being on.

   Make a pair with `node tools/server/vapid.mjs` and set them with
   `npx wrangler secret put`. Both are base64url: the public key is the raw
   uncompressed P-256 point (65 bytes), the private key is the scalar (32
   bytes). That is what `pushManager.subscribe` wants on the browser side
   and what WebCrypto wants on this one, so nothing is converted anywhere.

   WHAT IS KEPT
   `push:<player>`: the endpoints this player's browsers handed over, each
   with the day it was added, at most PUSH_KEEP of them. An endpoint is an
   opaque URL minted by the push service; it names a browser, not a person,
   and it stops working when the browser unsubscribes or the service says it
   is gone (404 or 410), at which point it is dropped here too. Leaving
   deletes the row. */

/** How many browsers one player may be told on. A phone, a laptop, a work
 *  machine and two spare: a sixth pushes the oldest off. */
export const PUSH_KEEP = 5;

export const pushKey = (id) => `push:${id}`;

/** A subscription row is an endpoint and when it was added, nothing else.
 *  The `keys` a browser hands out with a subscription (p256dh and auth) are
 *  for encrypting a payload, and there is no payload, so they are never sent
 *  to the server and never stored. */
export function readSubs(stored) {
  if (!Array.isArray(stored)) return [];
  const seen = new Set();
  const out = [];
  for (const s of stored) {
    const endpoint = cleanEndpoint(s && s.endpoint);
    if (!endpoint || seen.has(endpoint)) continue;
    seen.add(endpoint);
    out.push({ endpoint, at: Number(s.at) || 0 });
  }
  return out.slice(-PUSH_KEEP);
}

/** An endpoint the push service minted, or null. Only https, only a sane
 *  length: anything else arrived from a browser that is not a browser. */
export function cleanEndpoint(v) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.length < 12 || s.length > 2048) return null;
  let url;
  try { url = new URL(s); } catch { return null; }
  if (url.protocol !== "https:") return null;
  return url.toString();
}

/** The list with this endpoint on it (moved to the end if it was already
 *  there), capped. */
export function withSub(list, endpoint, now) {
  const rest = list.filter((s) => s.endpoint !== endpoint);
  return [...rest, { endpoint, at: Number(now) || 0 }].slice(-PUSH_KEEP);
}

export const withoutSub = (list, endpoint) => list.filter((s) => s.endpoint !== endpoint);

/* ----- the keys ----- */

const B64URL = /^[A-Za-z0-9_-]+$/;

export function fromB64url(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function toB64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** What the environment says about push. `mode` is "on" only when both keys
 *  are present and the right shape; a half-set pair is "off" and says so at
 *  /api/health rather than failing on the first letter. */
export function pushConfig(env = {}) {
  const pub = typeof env.VAPID_PUBLIC_KEY === "string" ? env.VAPID_PUBLIC_KEY.trim() : "";
  const priv = typeof env.VAPID_PRIVATE_KEY === "string" ? env.VAPID_PRIVATE_KEY.trim() : "";
  const from = typeof env.MAIL_FROM === "string" && env.MAIL_FROM.trim() ? `mailto:${env.MAIL_FROM.trim()}` : "";
  const app = typeof env.APP_URL === "string" ? env.APP_URL.trim().replace(/\/+$/, "") : "";
  const subject = from || app || "";
  let shaped = false;
  if (B64URL.test(pub) && B64URL.test(priv)) {
    const p = fromB64url(pub);
    shaped = p.length === 65 && p[0] === 4 && fromB64url(priv).length === 32;
  }
  return { publicKey: shaped ? pub : "", privateKey: shaped ? priv : "", subject, mode: shaped && subject ? "on" : "off" };
}

/** The JWT a push service wants (RFC 8292): ES256 over {aud, exp, sub}, where
 *  `aud` is the origin of the endpoint and nothing more. Twelve hours is the
 *  most the spec allows a token to live and there is no reason to mint a
 *  shorter one for a request that is sent at once. */
export async function vapidToken(config, endpoint, now = Date.now()) {
  const pub = fromB64url(config.publicKey);
  const key = await crypto.subtle.importKey("jwk", {
    kty: "EC", crv: "P-256",
    x: toB64url(pub.slice(1, 33)), y: toB64url(pub.slice(33, 65)),
    d: config.privateKey,
  }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const enc = (o) => toB64url(new TextEncoder().encode(JSON.stringify(o)));
  const head = enc({ typ: "JWT", alg: "ES256" });
  const body = enc({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: config.subject });
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${toB64url(new Uint8Array(sig))}`;
}

/** The headers on the empty POST. TTL is a day: a phone that is off tonight
 *  should still hear about a letter tomorrow morning, and after that the app
 *  will have been opened or the news is stale. */
export async function pushHeaders(config, endpoint, now = Date.now()) {
  return {
    authorization: `vapid t=${await vapidToken(config, endpoint, now)}, k=${config.publicKey}`,
    ttl: "86400",
    urgency: "normal",
    "content-length": "0",
  };
}

/** One empty push to one endpoint. `gone` is the service saying the browser
 *  unsubscribed or the endpoint never existed, which is the caller's cue to
 *  drop it; any other failure is left alone, because a push that did not get
 *  through today is not evidence that it will not tomorrow. */
export async function sendPush(config, endpoint, doFetch = fetch) {
  try {
    const res = await doFetch(endpoint, { method: "POST", headers: await pushHeaders(config, endpoint) });
    return { ok: res.ok, gone: res.status === 404 || res.status === 410 };
  } catch {
    return { ok: false, gone: false };
  }
}

/** A fresh pair, base64url, for `tools/server/vapid.mjs` and for tests. */
export async function makeKeys() {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  return { publicKey: toB64url(raw), privateKey: jwk.d };
}
