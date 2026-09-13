/* ----------------------- THE POST (wording) -----------------------
   Why a letter was refused, said to the person who tried to write it.

   One of these is doing careful work. Somebody who has been blocked is told
   "not met", the same words a stranger gets, because blocking is silent: the
   server already folds `blocked` into `not-met` before it answers, and this
   table must not undo that by having a line for it. A message saying "you have
   been blocked" is a message, and it is the one thing the person who blocked
   chose not to send. */

export const WRITE_REFUSALS = {
  "not-met": "You can write to your friends, and to anybody you have finished a game against.",
  yourself: "You cannot write to yourself",
  "no-player": "That player is not here any more",
  "empty-letter": "A letter needs something in it",
  "too-many-letters-sent": "That is a lot of letters in an hour. Try again later.",
  offline: "The server is out of reach right now",
  "no-server": "This copy of Joseki is running without a server",
  unauthorized: "Claim a handle before writing",
};

export const writeRefusal = (reason) =>
  WRITE_REFUSALS[reason] ?? `Something went wrong (${reason})`;

/** Is this thread waiting on me? The list says who spoke last rather than what
 *  has been read: a read receipt is a promise about somebody else's attention,
 *  and this is the question a person actually has. */
export const waitingOnMe = (row, me) => !!row && row.from !== me;

/** How many of these threads are waiting on me. */
export const waitingCount = (rows, me) => (rows || []).filter((r) => waitingOnMe(r, me)).length;
