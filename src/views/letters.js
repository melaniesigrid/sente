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
];

export const writeRefusal = (reason, t = EN) =>
  lineOr(t, `letters.refusal.${reason}`, t("online.friends.error.unknown", { reason }));

/** Is this thread waiting on me? The list says who spoke last rather than what
 *  has been read: a read receipt is a promise about somebody else's attention,
 *  and this is the question a person actually has. */
export const waitingOnMe = (row, me) => !!row && row.from !== me;

/** How many of these threads are waiting on me. */
export const waitingCount = (rows, me) => (rows || []).filter((r) => waitingOnMe(r, me)).length;
