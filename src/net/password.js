/* ----------------------- PASSWORD DERIVATION -----------------------
   The password never leaves this file. What goes to the server is a key
   derived from it: PBKDF2-SHA256 over the password, salted with the address,
   at the iteration count in `KDF`. The reasoning is in `server/accounts.js`;
   the short version is that a Worker gets 10 ms of CPU and a password hash
   worth the name costs more, so the stretch happens here, where there is time.

   The salt is the address rather than a random value the server hands out,
   because asking the server for a salt would tell anyone who asked which
   addresses have accounts here. A per-address salt still makes one precomputed
   table useless against a second person. */

import { KDF } from "../../server/accounts.js";
export { KDF, MIN_PASSWORD, passwordProblem, cleanEmail } from "../../server/accounts.js";

const HEX = "0123456789abcdef";
const hex = (bytes) => {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += HEX[b >> 4] + HEX[b & 15];
  return s;
};

/** Derive the credential the server will see. Costs about a second on a phone,
 *  which is the point: the attacker pays it once per guess too.
 *  @param {string} email  the address, folded the way the server folds it
 *  @param {string} password  what the person typed
 *  @returns {Promise<string>} 64 hex characters */
export async function deriveKey(email, password) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(`sente-v${KDF.v}:${email}`), iterations: KDF.iterations },
    material, KDF.bytes * 8,
  );
  return hex(bits);
}
