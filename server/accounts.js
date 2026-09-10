/* ----------------------- ACCOUNTS (pure) -----------------------
   Email and password policy, kept out of the Durable Object so it can be
   tested without one. Nothing here touches storage or the network.

   WHY THE PASSWORD IS STRETCHED IN THE BROWSER
   A Worker on the free plan gets 10 ms of CPU per invocation. A password hash
   worth the name costs far more than that: PBKDF2 at the iteration count OWASP
   asks for is tens of milliseconds, and a memory-hard hash is worse. So the
   stretching happens where there is time for it — in the browser, before the
   password is ever sent (`src/net/password.js`). What arrives here is a
   *derived key*: 32 bytes of PBKDF2-SHA256 over the password, salted with the
   address, at a cost the attacker also has to pay for every guess.

   The key is the credential on the wire, exactly as a password would be, and
   TLS protects it exactly as it would protect a password. What the server
   stores is a fast SHA-256 of the key with a random per-account salt, so a
   stolen store still costs an attacker the whole stretch per guess. The one
   thing this gives up is a server-chosen work factor: raising the iteration
   count means every browser starts deriving with the new one, and old accounts
   keep their old count until their owner next sets a password. `KDF` carries
   the parameters used, so a record always says how it was made. */

/** The stretch the browser is asked to perform. Stored on every account so a
 *  record made under one set of parameters can still be verified later. */
export const KDF = { v: 1, name: "PBKDF2-SHA256", iterations: 600_000, bytes: 32 };

/** Fold an address to the one form it is stored and looked up under: trimmed,
 *  lowercased. Nothing else is normalised — an address is the mail server's to
 *  interpret, and stripping dots or plus tags would silently merge two people
 *  whose provider treats them as two. */
const FORBIDDEN = [" ", "<", ">", '"', ",", ";", ":", "\\", "'", "(", ")", "[", "]"];
export function cleanEmail(v) {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (s.length < 6 || s.length > 254) return null;
  // None of the punctuation a mail header uses to mean something other than an
  // address, and then: one @, something either side, a dot in the domain.
  if (Array.from(FORBIDDEN).some(ch => s.includes(ch))) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return null;
  if (s.includes("..")) return null;
  return s;
}

/** A derived key as it arrives from the browser: 64 lowercase hex characters
 *  (32 bytes). Anything else is a client that has not read the contract. */
export function cleanKey(v) {
  return typeof v === "string" && /^[0-9a-f]{64}$/.test(v) ? v : null;
}

/** Refuse a password the browser should not have derived from in the first
 *  place. The browser checks this too; the server checks it again because a
 *  browser is not the only thing that can post to an API.
 *
 *  Length is the only rule with teeth. Composition rules (a digit, a capital)
 *  push people towards `Password1!` and buy nothing, so there are none. */
export const MIN_PASSWORD = 10;
export function passwordProblem(v) {
  if (typeof v !== "string") return "password-required";
  if (v.length < MIN_PASSWORD) return "password-short";
  if (v.length > 256) return "password-long";
  if (/^\s+$/.test(v)) return "password-blank";
  return null;
}

/** Everything the account's owner may see about themselves that nobody else
 *  may. `publicPlayer` stays the view for everyone else. */
export function privateFields(p) {
  return {
    email: p.email ?? null,
    // Whether there is a way back in besides the token in this browser.
    hasPassword: Boolean(p.pw),
    // Whether the address has been proved, rather than merely typed. Nobody
    // else is told this: it says something about a person's mailbox, not
    // about their play, and it belongs on no page but their own.
    emailVerified: Boolean(p.emailVerifiedAt),
    sessions: (p.sessions ?? []).length,
  };
}
