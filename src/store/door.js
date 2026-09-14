/* ----------------------- THE DOOR (storage) -----------------------
   Joseki is private to the association. Everything, the front door and the
   small print included, sits behind one shared password, and this file is the
   whole of the rule: what the password is, how an answer is checked, and how a
   device that has answered once is excused from answering again.

   What ships is the SHA-256 of the password and never the password. The bundle
   is public, so anybody who reads it learns a digest they still cannot type.
   That is also the honest limit of a gate on a static site: it keeps the club
   out of search results and out of a stranger's hands, and it does not keep out
   somebody who reads the source and edits their own storage. Secrecy against
   that reader belongs at the edge, in front of the files, not in them.

   The device remembers the digest rather than a flag, so changing DOOR_DIGEST
   below turns every remembered device away again on its own; nothing else has
   to be versioned. The key is lowercase `sente.` like every other stored thing:
   storage names are never renamed.

   The answer is tidied before it is hashed: surrounding space and letter case
   are not part of a password people pass to each other by mouth. */
export const DOOR_KEY = "sente.door";

/** SHA-256, hex, of the tidied password. */
export const DOOR_DIGEST = "af1ca70d3e10beeb5c2a987af011e5ac12e6efba95b2fe2b81a326d31bd0d036";

/** What a typed answer is reduced to before it is compared. */
export function tidyPassword(text) {
  return String(text ?? "").trim().toLowerCase();
}

/** SHA-256 of a string, as lowercase hex. Empty string when the platform has
 *  no digest, which then opens nothing: a missing WebCrypto is a locked door,
 *  never an open one. */
export async function digestOf(text) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) return "";
  const bytes = new TextEncoder().encode(text);
  const hash = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
}

/** Does this answer open the door. */
export async function opensDoor(text) {
  const tidy = tidyPassword(text);
  if (!tidy) return false;
  return (await digestOf(tidy)) === DOOR_DIGEST;
}

function storageOf(storage) {
  if (storage) return storage;
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
}

/** Has this device already answered, with the password as it is today. */
export function doorIsOpen(storage) {
  const s = storageOf(storage);
  if (!s) return false;
  try { return s.getItem(DOOR_KEY) === DOOR_DIGEST; } catch { return false; }
}

/** Excuse this device from answering again. Returns whether it could be kept. */
export function rememberDoor(storage) {
  const s = storageOf(storage);
  if (!s) return false;
  try { s.setItem(DOOR_KEY, DOOR_DIGEST); return true; } catch { return false; }
}

/** Ask this device again next time. */
export function forgetDoor(storage) {
  const s = storageOf(storage);
  if (!s) return;
  try { s.removeItem(DOOR_KEY); } catch { /* nothing to forget */ }
}
