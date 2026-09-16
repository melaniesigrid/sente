/* ----------------------- READING A FINGERPRINT (pure) -----------------------
   Pulling the DTLS fingerprint out of a session description, and refusing the
   descriptions that would make the check meaningless.

   WHY THIS IS SECURITY CODE AND server/talk.js IS NOT
   The committed key agreement binds the fingerprint each side actually sees.
   "Actually sees" is this file's job, and it is the part the Go module cannot
   do for itself: it is handed a string and has no idea where the string came
   from. If this file reads the wrong line, the whole exchange verifies a
   fingerprint nobody is using and the words match while a middle listens.

   THREE WAYS TO READ IT WRONG
   1. An SDP may carry a session-level fingerprint and one per media section.
      Reading the first one found and trusting it lets an attacker put the
      committed value at the top and the one it actually uses further down.
      So: every fingerprint in the description must be the SAME value, and any
      description carrying two different ones is refused rather than resolved.
   2. Hash algorithms other than sha-256 are refused rather than accommodated.
      A peer offering sha-1 is offering a weaker binding than the SAS assumes,
      and "be liberal in what you accept" is how that becomes the weakest link.
   3. The text checked has to be the browser-normalised description, read back
      from the peer connection after setRemoteDescription, and never the raw
      string the relay handed over. The relay is the adversary; what it sent and
      what the browser validated the certificate against are not the same
      question, and only the second one matters. This module parses whatever it
      is given, so the caller has to give it the right thing: see call.js. */

/** Every `a=fingerprint:` value in a description, lowercased, in order. */
export function fingerprintsIn(sdp) {
  if (typeof sdp !== "string") return [];
  const out = [];
  for (const line of sdp.split(/\r\n|\r|\n/)) {
    const m = /^a=fingerprint:(\S+)\s+(\S+)\s*$/i.exec(line.trim());
    if (m) out.push(`${m[1].toLowerCase()} ${m[2].toLowerCase()}`);
  }
  return out;
}

/** The one fingerprint a description carries, or why it does not have exactly
 *  one. Never picks a winner: a description that disagrees with itself is a
 *  description nobody should be negotiating with.
 *
 *  @returns {{ ok: true, fingerprint: string } | { ok: false, reason: string }} */
export function soleFingerprint(sdp) {
  const all = fingerprintsIn(sdp);
  if (all.length === 0) return { ok: false, reason: "no-fingerprint" };
  const distinct = [...new Set(all)];
  if (distinct.length > 1) return { ok: false, reason: "mixed-fingerprints" };
  const only = distinct[0];
  if (!only.startsWith("sha-256 ")) return { ok: false, reason: "not-sha-256" };
  const hex = only.slice("sha-256 ".length);
  if (!/^[0-9a-f]{2}(:[0-9a-f]{2}){31}$/.test(hex)) return { ok: false, reason: "malformed-fingerprint" };
  return { ok: true, fingerprint: only };
}

/** Do these two describe the same certificate? Used when a renegotiation
 *  arrives: a changed fingerprint voids a verification that was bound to the
 *  old one, and the call has to be verified again rather than carry on wearing
 *  a tick it no longer earns. */
export const sameFingerprint = (a, b) =>
  typeof a === "string" && typeof b === "string" && a.length > 0 && a === b;
