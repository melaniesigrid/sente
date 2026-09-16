/* ----------------------- TURN CREDENTIALS (pure) -----------------------
   Short-lived credentials for the one relay a call is allowed to use.

   THE SERVER DOES NOT CHOOSE THE HOST
   It imports `TURN_HOST` from the client's own module rather than declaring one,
   and that is the whole arrangement in one import. The browser refuses any ICE
   server that is not that host (src/talk/ice.js), so a Worker that tried to name
   a different one would be refused rather than obeyed. Importing the same
   constant means the host the credentials are minted for and the host the
   browser will accept cannot drift apart and quietly break every call.

   What the Worker contributes is the part it cannot help contributing: a secret.
   Minting needs a Cloudflare Realtime TURN key, which cannot live in a bundle
   served to everybody, so it lives here and is spent on behalf of a player who
   is already signed in.

   A DEPLOYMENT WITHOUT THE KEY SAYS SO
   Same shape as mail. No key, no credentials, and `/api/health` reports
   `"talk": "off"` so a deployment that cannot carry a call is visible at a
   glance rather than discovered by two people staring at a button. The client
   treats the refusal as "talk is unavailable here", which is a state it needs
   anyway for a browser with no microphone. */

import { TURN_HOST } from "../src/talk/ice.js";

export { TURN_HOST };

/** How long a minted credential lives. Long enough for a game that goes to
 *  byo-yomi, short enough that a leaked one is worth little. */
export const TURN_TTL_S = 6 * 60 * 60;

/** Where Cloudflare mints them. */
const ENDPOINT = (keyId) =>
  `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(keyId)}/credentials/generate`;

/** Is this deployment able to carry a call at all? */
export const talkConfigured = (env) => !!(env && env.TURN_KEY_ID && env.TURN_API_TOKEN);

/** What `/api/health` says about it. */
export const talkMode = (env) => (talkConfigured(env) ? "on" : "off");

/** The three URLs a browser is given for one host: UDP, TCP for a network that
 *  blocks it, and TLS for one that blocks both. All the same host, so the
 *  client's check passes on every one of them. */
export const turnUrls = (host = TURN_HOST) => [
  `turn:${host}:3478?transport=udp`,
  `turn:${host}:3478?transport=tcp`,
  `turns:${host}:5349?transport=tcp`,
];

/** Turn whatever the minting call answered into the list the browser expects,
 *  or null if it does not contain a usable pair.
 *
 *  Deliberately does not pass the vendor's own `urls` through. The answer
 *  carries them, and using them would make the host a thing the network said
 *  rather than a thing the bundle said, which is the property this whole design
 *  is built to keep. Only the username and credential are taken. */
export function iceServersFrom(raw, host = TURN_HOST) {
  const got = raw && raw.iceServers ? raw.iceServers : null;
  const username = got && typeof got.username === "string" ? got.username : null;
  const credential = got && typeof got.credential === "string" ? got.credential : null;
  if (!username || !credential) return null;
  return [{ urls: turnUrls(host), username, credential }];
}

/** Mint a set. Answers `{ ok, iceServers }` or `{ ok: false, reason }`; never
 *  throws, because a relay that cannot be reached is an ordinary Tuesday and
 *  the caller's job is to say "not now" rather than to fall over.
 *
 *  @param {object} env
 *  @param {typeof fetch} doFetch  injected so the policy can be tested without
 *         reaching the network. */
export async function mintIceServers(env, doFetch = fetch) {
  if (!talkConfigured(env)) return { ok: false, reason: "talk-unconfigured" };
  let res;
  try {
    res = await doFetch(ENDPOINT(env.TURN_KEY_ID), {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.TURN_API_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ ttl: TURN_TTL_S }),
    });
  } catch {
    return { ok: false, reason: "turn-unreachable" };
  }
  if (!res || !res.ok) return { ok: false, reason: "turn-refused" };
  let body;
  try { body = await res.json(); } catch { return { ok: false, reason: "turn-unreadable" }; }
  const iceServers = iceServersFrom(body);
  if (!iceServers) return { ok: false, reason: "turn-unreadable" };
  return { ok: true, iceServers };
}
