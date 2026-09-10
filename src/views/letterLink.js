/* ----------------------- LINKS OUT OF A LETTER (pure) -----------------------
   Joseki's two letters each carry one link back into the app: `?verify=` to
   confirm an address and `?reset=` to choose a new password. This is the
   reading and the forgetting of those, kept apart from the card that acts on
   them so the parsing can be tested without a browser.

   Both are query parameters rather than paths. The app is one page served by a
   static host, and a path that host has never heard of is its 404, not ours. */

/** A link from the address bar, or null. `search` is `window.location.search`.
 *
 *  A token that is not the 64 hex characters the server mints is ignored
 *  rather than sent: a paste that lost its tail can say so here, without a
 *  round trip, and a `?reset=` that means something else to somebody else is
 *  not mistaken for one of ours. Verifying is checked first, but the two never
 *  arrive together — each letter carries one. */
export function linkFromQuery(search) {
  const q = new URLSearchParams(search || "");
  for (const kind of ["verify", "reset"]) {
    const token = (q.get(kind) ?? "").trim();
    if (/^[0-9a-f]{64}$/.test(token)) return { kind, token };
  }
  return null;
}

/** Take the token back out of the address bar, without reloading the page.
 *  Spent or abandoned, it should not be left in browser history, and a reload
 *  should not try to spend it a second time. Everything else in the query is
 *  left exactly as it was — `?game=` opens a table, and following a link from
 *  a letter is no reason to lose it. */
export function forgetLink() {
  if (typeof window === "undefined" || !window.history || !window.history.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("verify");
  url.searchParams.delete("reset");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}
