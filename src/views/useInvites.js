import { useState, useEffect, useCallback, useRef } from "react";
import { api, serverEnabled } from "../net/api.js";
import { withoutInvite, inviteOutcomeText, inviteErrorText } from "./invitation.js";
import { useT } from "../components/langStore.js";

/* ----------------------- THE SHELF -----------------------
   One fetch of the two lists, and one way to act on somebody on them, shared
   by the card in the lobby and by the button on a player's page so the two can
   never disagree about where the same two people stand over a board.

   Accepting is the one act here that does something irreversible: it opens a
   table. So it hands the answer back to whoever pressed, and the caller walks
   to the board. Everything else is a press, a hand-moved list, and a re-fetch. */
export function useInvites(token, notify, onTable) {
  const t = useT();
  const [invites, setInvites] = useState(null);
  /* The id currently being acted on, so one row can show it is working without
     disabling the rest of the list. */
  const [busy, setBusy] = useState(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const onTableRef = useRef(onTable);
  useEffect(() => { onTableRef.current = onTable; }, [onTable]);

  const refresh = useCallback(async () => {
    if (!token || !serverEnabled()) return;
    try {
      const r = await api.invites(token);
      if (alive.current) setInvites(r);
    } catch { /* a list that will not load is left as it was */ }
  }, [token]);

  /* The first read goes through the same path every refresh uses, so the shelf
     has one fetch routine and one place state is updated from its answer. */
  useEffect(() => { Promise.resolve().then(refresh); }, [refresh]);

  const act = useCallback(async (kind, person, terms = null) => {
    if (!token || busy) return null;
    setBusy(person.id);
    try {
      if (kind === "accept") {
        const table = await api.acceptInvite(token, person.id);
        if (alive.current) setInvites((v) => withoutInvite(v, person.id));
        notify({ icon: "trophy", text: t("online.invites.opened", { name: person.name }) });
        if (onTableRef.current) onTableRef.current(table);
        return table;
      }
      const r = kind === "invite"
        ? await api.invite(token, person.id, terms)
        : await api.forgetInvite(token, person.id);
      if (alive.current && kind !== "invite") setInvites((v) => withoutInvite(v, person.id));
      notify({ icon: "info", text: inviteOutcomeText(r.outcome, t) });
      return r;
    } catch (e) {
      notify({ icon: "info", text: inviteErrorText(e.reason, t) });
      return null;
    } finally {
      if (alive.current) setBusy(null);
      /* Whether it worked or not: a refusal usually means the shelf on screen
         is out of date, which is exactly when it is worth reading again. */
      await refresh();
    }
  }, [token, busy, notify, refresh, t]);

  return { invites, busy, act, refresh, setInvites };
}
