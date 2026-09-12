import { useState, useEffect, useCallback, useRef } from "react";
import { api, serverEnabled } from "../net/api.js";
import { moved, STANDING_AFTER, outcomeText, friendErrorText } from "./friendship.js";

/* ----------------------- THE FRIENDS BOOK -----------------------
   One fetch of the three lists, and one way to act on somebody in them, shared
   by the friends card and by the button on a player's page so the two can
   never disagree about where you stand with the same person.

   A press moves the person by hand first and asks the server after. The
   arithmetic for that is in `friendship.js` and tested there; what is here is
   the wiring. The re-fetch afterwards is not belt and braces: accepting
   changes the other person's row as well as their list, and the answer to a
   press is one word, so the book has to be read again to be right. */
export function useFriends(token, notify) {
  const [book, setBook] = useState(null);
  /* The id currently being acted on, so one row can show it is working without
     disabling the rest of the list. */
  const [busy, setBusy] = useState(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const refresh = useCallback(async () => {
    if (!token || !serverEnabled()) return;
    try {
      const b = await api.friends(token);
      if (alive.current) setBook(b);
    } catch { /* a list that will not load is left as it was */ }
  }, [token]);

  /* The first read is written out rather than calling `refresh`, so the state
     it sets is plainly inside a promise and not in the body of an effect. */
  useEffect(() => {
    if (!token || !serverEnabled()) return undefined;
    let live = true;
    api.friends(token).then((b) => { if (live) setBook(b); }).catch(() => { /* left as it was */ });
    return () => { live = false; };
  }, [token]);

  const act = useCallback(async (kind, person) => {
    if (!token || busy) return;
    setBusy(person.id);
    const call = kind === "ask" ? api.askFriend : kind === "accept" ? api.acceptFriend : api.forgetFriend;
    try {
      const r = await call(token, person.id);
      if (alive.current) setBook((b) => moved(b, person, STANDING_AFTER[r.outcome] ?? "none"));
      notify({ icon: "info", text: outcomeText(r.outcome) });
    } catch (e) {
      notify({ icon: "info", text: friendErrorText(e.reason) });
    } finally {
      if (alive.current) setBusy(null);
      /* Whether it worked or not: a refusal usually means the book on screen
         is out of date, which is exactly when it is worth reading again. */
      await refresh();
    }
  }, [token, busy, notify, refresh]);

  return { book, busy, act, refresh };
}
