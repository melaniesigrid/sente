/* ----------------------- HTTP HELPERS -----------------------
   Small, dependency-free helpers shared by the router and the objects. */

export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type",
  "access-control-max-age": "86400",
};

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...headers },
  });

export class HttpError extends Error {
  constructor(status, reason) { super(reason); this.status = status; this.reason = reason; }
}

export const fail = (status, reason) => json({ error: reason }, status);

/** Parse a JSON body, tolerating an empty one. Throws HttpError on garbage. */
export async function readJson(req) {
  const text = await req.text();
  if (!text) return {};
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? v : {};
  } catch { throw new HttpError(400, "bad-json"); }
}

export const bearer = (req) => {
  const h = req.headers.get("authorization") || "";
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  return m ? m[1] : null;
};

const HEX = "0123456789abcdef";
export function randomHex(bytes) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  let s = "";
  for (const b of buf) s += HEX[b >> 4] + HEX[b & 15];
  return s;
}

export async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  let s = "";
  for (const b of new Uint8Array(digest)) s += HEX[b >> 4] + HEX[b & 15];
  return s;
}

/** Compare two hex digests without letting the time taken say how much of the
 *  first one an attacker has guessed right. */
export function sameDigest(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Display names: trimmed, 2 to 18 characters, no control characters. */
export function cleanName(v) {
  if (typeof v !== "string") return null;
  // Strip control characters (U+0000..U+001F and DEL) without a literal control regex.
  const s = Array.from(v).filter(ch => { const c = ch.codePointAt(0); return c > 31 && c !== 127; }).join("").trim().slice(0, 18);
  return s.length >= 2 ? s : null;
}

/** Bytes to base64 and back. Durable Object storage takes JSON, so a picture
 *  makes the round trip as text; `btoa` is byte-wise, hence the latin1 dance. */
export function base64(buf) {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}

export function bytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export const TINTS = ["eucalyptus", "coral", "sun", "mint", "sky", "grape"];
export const cleanTint = (v) => (TINTS.includes(v) ? v : "eucalyptus");
