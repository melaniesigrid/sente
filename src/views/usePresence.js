import { useState, useEffect } from "react";
import { api, serverEnabled } from "../net/api.js";
import { hereSet } from "./playerCard.js";

/** How often to ask again. Presence is the one thing on these screens that goes
 *  stale on its own, and half a minute is slow enough to cost nothing and quick
 *  enough that a friend arriving shows up before you have given up looking. */
export const PRESENCE_EVERY_MS = 30_000;

/* ----------------------- WHO IS HERE -----------------------
   One small poll, shared by the friends card and a player's page.

   It is a poll rather than a socket on purpose. The lobby socket already exists
   and could carry this, but it is opened when somebody is looking for a game,
   and a screen that had to join the lobby to see who is around would announce
   your own arrival as the price of asking about anybody else's. A poll asks
   without joining.

   `ids` is joined into the dependency rather than passed as an array, because a
   new array with the same ids in it every render would restart the interval
   forever. */
const NOBODY = new Set();

export function usePresence(token, ids) {
  const [here, setHere] = useState(NOBODY);
  const key = ids.join(",");
  /* Derived rather than set, so nothing here writes state in the body of an
     effect and a page with nobody to ask about cannot show a stale answer. */
  const idle = !serverEnabled() || key === "";

  useEffect(() => {
    if (idle) return undefined;
    let live = true;
    const ask = () => api.presence(token, key.split(","))
      .then((answer) => { if (live) setHere(hereSet(answer)); })
      .catch(() => { /* a presence that will not load is left as it was */ });
    ask();
    const timer = setInterval(ask, PRESENCE_EVERY_MS);
    return () => { live = false; clearInterval(timer); };
  }, [token, key, idle]);

  return idle ? NOBODY : here;
}
