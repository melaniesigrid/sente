/* ----------------------- THE POST (pure) -----------------------
   Letters between two players, and who may write one.

   It is called the post and not "messages" because it is shaped like a post
   and not like a chat: one thread per pair of people, for good, with no typing
   indicator, no read receipt and no notification. You write, and the other
   person finds it when they next look.

   WHAT THIS IS NOT
   Not a broadcast. Not a list anybody can be added to. There is no unsubscribe
   link because there is nothing to leave. One person writes to one person, and
   only to somebody they have already met at a board or agreed to be friends
   with. Anything wider is a spam surface on a free Worker with the founder's
   name on it, and the first thing a stranger would use it for is exactly what
   the founding complaint about other servers was about.

   WHO MAY WRITE TO YOU
   A friend, or somebody you have finished a game against. Both are things you
   took part in: one you agreed to, the other you sat down for. A stranger off
   the ladder cannot write at all, which is the whole of the spam policy and
   needs no filter, no reporting queue and nobody's judgement.

   AND WHO MAY NOT
   Anybody you have blocked. Blocking is one-sided and silent: the blocked
   person is told nothing, their old letters stay where they are, and they
   simply cannot write another. It is deliberately not the same act as
   unfriending, because the two mean different things and doing both at once
   would take the choice away from the person being protected. */

/** How long one letter may be. Long enough for a real note about a game, short
 *  enough that nobody writes an essay into a box with no formatting. */
export const LETTER_MAX = 2000;

/** How many letters one thread keeps. Old ones fall off the bottom, the way
 *  the chat in a room does at 200, so a thread cannot grow without limit.
 *  Nothing here is anybody's archive of record. */
export const THREAD_KEEP = 100;

/** How many letters one player may send in an hour, across all threads. */
export const POST_LIMIT = 60;
export const POST_WINDOW_MS = 60 * 60 * 1000;

/** The thread two people share, named so that either of them computes the same
 *  key. Sorted, so `a→b` and `b→a` are one thread and not two half-threads
 *  that each hold one side of a conversation. */
export function threadKey(a, b) {
  return [a, b].sort().join("~");
}

/** Strip what would break a layout or smuggle a control code into a log, while
 *  keeping the paragraph breaks that make a letter readable. At most one blank
 *  line between paragraphs, so nobody can push a thread off the screen. */
export function cleanLetter(v) {
  if (typeof v !== "string") return "";
  const kept = Array.from(v)
    .filter((ch) => {
      const c = ch.codePointAt(0);
      return c > 31 || ch === "\n";
    })
    .join("");
  return kept.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, LETTER_MAX);
}

/** A stored thread, read defensively. */
export function readThread(stored) {
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((l) => l && typeof l === "object" && typeof l.from === "string" && typeof l.text === "string")
    .map((l) => ({ from: l.from, text: l.text, at: Number(l.at) || 0 }));
}

/** The thread with one more letter on the end, capped. */
export function withLetter(thread, from, text, now) {
  return [...thread, { from, text, at: Number(now) || 0 }].slice(-THREAD_KEEP);
}

/** May `from` write to `to`? `friends` is whether they are settled friends and
 *  `played` whether they have finished a game together; `blocked` is whether
 *  `to` has blocked `from`.
 *
 *  Blocking wins over everything, including friendship: somebody who blocks a
 *  friend has said the clearer of the two things. */
export function mayWrite({ from, to, friends, played, blocked }) {
  if (!from || !to) return "no-player";
  if (from === to) return "yourself";
  if (blocked) return "blocked";
  if (!friends && !played) return "not-met";
  return null;
}

/** What one thread looks like in a list of them: who it is with, the last
 *  thing said, when, and whether the last word was theirs.
 *
 *  "Unread" is deliberately absent. A read receipt is a promise about somebody
 *  else's attention, and the thing a person actually wants to know is whether
 *  they are the one being waited on, which is the same question the dashboard
 *  asks about a board and is answered the same way: who spoke last. */
export function threadSummary(thread, me) {
  const last = thread[thread.length - 1];
  if (!last) return null;
  return {
    at: last.at,
    from: last.from,
    theirTurn: last.from === me,
    preview: last.text.replace(/\s+/g, " ").slice(0, 120),
    letters: thread.length,
  };
}

/** A list of threads, newest conversation first. */
export const byRecent = (rows) => [...rows].sort((a, b) => (b.at || 0) - (a.at || 0));

/** The block list, read defensively, capped so it cannot grow without limit. */
export const MAX_BLOCKED = 500;

export function readBlocked(stored) {
  if (!Array.isArray(stored)) return [];
  return [...new Set(stored.filter((id) => typeof id === "string" && id !== ""))].slice(0, MAX_BLOCKED);
}

/** Blocking is one-sided and silent. It is not unfriending: the two mean
 *  different things, and doing both at once would take the second choice away
 *  from the person the first one is protecting. */
export function block(list, id) {
  if (list.includes(id)) return list;
  if (list.length >= MAX_BLOCKED) return list;
  return [...list, id];
}

export const unblock = (list, id) => list.filter((x) => x !== id);
