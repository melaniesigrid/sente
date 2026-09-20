/* ----------------------- THE POST (wording) -----------------------
   Why a letter was refused, said to the person who tried to write it.

   One of these is doing careful work. Somebody who has been blocked is told
   "not met", the same words a stranger gets, because blocking is silent: the
   server already folds `blocked` into `not-met` before it answers, and this
   table must not undo that by having a line for it. A message saying "you have
   been blocked" is a message, and it is the one thing the person who blocked
   chose not to send. */

import { BASE_LOCALE, makeT, lineOr } from "../i18n/index.js";

const EN = makeT(BASE_LOCALE);

export const WRITE_REFUSALS = [
  "not-met", "yourself", "no-player", "empty-letter", "too-many-letters-sent",
  "offline", "no-server", "unauthorized",
  /* And the ones a MOVE can be refused with. An illegal answer is named by the
     rule it broke, in the kernel's own words, so a reader is told which rule
     rather than that something went wrong. The last two are about the state of
     the thread rather than about the move. */
  "illegal-occupied", "illegal-suicide", "illegal-ko", "illegal-offboard",
  "bad-move", "nothing-to-answer", "your-own-position",
];

export const writeRefusal = (reason, t = EN) =>
  lineOr(t, `letters.refusal.${reason}`, t("online.friends.error.unknown", { reason }));

/** Is this thread waiting on me? The list says who spoke last rather than what
 *  has been read: a read receipt is a promise about somebody else's attention,
 *  and this is the question a person actually has. */
export const waitingOnMe = (row, me) => !!row && row.from !== me;

/** How many of these threads are waiting on me. */
export const waitingCount = (rows, me) => (rows || []).filter((r) => waitingOnMe(r, me)).length;

/* ----------------------- MAY I WRITE TO THEM? -----------------------
   Asked of the server, never worked out on the page.

   The rule is a friend or somebody you have finished a game against, and a
   page that tried to answer it from the lists it happens to be holding would
   be a second opinion about a question that already has one. It is the same
   reasoning the invite panel already follows.

   `api.thread` is the call because it already answers this: it hands back the
   thread AND whether you may write, so asking costs nothing extra and there is
   no new route to keep in step. For a stranger the thread is empty, and since
   `met:` arrived the check behind it is one key rather than a walk.

   WHY IT HIDES RATHER THAN EXPLAINS
   A button that says why you may not write to somebody tells you they blocked
   you — the server deliberately folds `blocked` into `not-met` so the words
   cannot give it away, and a control that appears for strangers and vanishes
   for one particular person would give it away again by its absence being
   conspicuous. So the offer is simply absent wherever it does not apply, the
   way it is absent on a search row. */

import { useState, useEffect } from "react";
import { api, serverEnabled } from "../net/api.js";

/** `null` while it is being asked, then true or false. Callers render nothing
 *  until it is true, so the beat before the answer shows no button rather than
 *  a button that may be about to disappear. */
export function useCanWrite(account, playerId) {
  const [can, setCan] = useState(null);
  useEffect(() => {
    if (!account || !playerId || !serverEnabled()) { setCan(false); return undefined; }
    if (account.player && account.player.id === playerId) { setCan(false); return undefined; }
    let live = true;
    api.thread(account.token, playerId)
      .then((r) => { if (live) setCan(!!r.can); })
      .catch(() => { if (live) setCan(false); });
    return () => { live = false; };
  }, [account, playerId]);
  return can;
}
