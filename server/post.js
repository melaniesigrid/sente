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
   would take the choice away from the person being protected.

   WHAT CHANGED WHEN THE MAIL COUNT ARRIVED
   The paragraph above used to say the post had no typing indicator, no read
   receipt and no notification. Two of those three are still true, and the
   third was never the same thing as the second.

   A read receipt tells the SENDER something about the reader's attention, and
   that is still refused: nothing anywhere reports that a letter was opened,
   and the cursor that records it is on the reader's own row where the writer
   cannot see it. What the count does is tell YOU that somebody wrote to you,
   which is a fact about your own post box. An app that makes you go and look
   in a drawer to find out whether anybody wrote is not protecting anybody's
   privacy, it is just hiding the mail.

   There is still no notification: nothing is pushed, nothing is emailed,
   nothing interrupts a game. The number is there when you next look up. */

import { readDiagram } from "../src/engine/diagram.js";

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

/* ----- the index -----

   One row per person you have a thread with, on your own shelf, so "my
   letters" is one prefix list and never a walk over every thread on the
   server.

   THE PREFIX IS `letters:` AND NOT `mail:`
   `mail:<hash>` was already taken, by the one-shot tokens that verify an
   address and reset a password (see `registry.js`). Two unrelated record types
   under one prefix are told apart only by counting colons, and the first
   `list({prefix: "mail:"})` written by somebody who did not know that would
   walk both. This is the same collision the engine's `rateGame` once was, and
   the fix is the same: give the newer thing its own name. */
export const LETTERS_PREFIX = (me) => `letters:${me}:`;
export const lettersKey = (me, other) => `letters:${me}:${other}`;

/** One row of that index, read defensively.
 *
 *  `at`        when the thread last moved, either way. Orders the list.
 *  `theirLast` when the other person last wrote. Only they move it.
 *  `read`      how far this side has read. Only this side moves it.
 *
 *  THERE IS NO SEQUENCE NUMBER, deliberately. A per-letter counter has nowhere
 *  to live: `readThread` maps every letter to exactly `{from, text, at}` so an
 *  extra field is dropped on the way back in, and `withLetter` trims to
 *  THREAD_KEEP so position in the array is not monotonic either. Storing one
 *  would mean changing a thread from an array to an object with a header —
 *  a migration of the one value in this system that is somebody's
 *  correspondence. `at` is already monotonic within a thread, already stored,
 *  and already survives the round trip, so `at` is the cursor.
 *
 *  A bare number is the shape this row had before the count existed. It
 *  becomes a row that is READ rather than unread: there is no cursor in it to
 *  recover, and the alternative is every player meeting a full post box on the
 *  morning of the deploy for letters they read months ago. */
export function readIndexRow(stored) {
  if (typeof stored === "number") return { at: stored, theirLast: 0, read: 0 };
  if (!stored || typeof stored !== "object") return { at: 0, theirLast: 0, read: 0 };
  return {
    at: Number(stored.at) || 0,
    theirLast: Number(stored.theirLast) || 0,
    read: Number(stored.read) || 0,
  };
}

/** Is there something in this thread this side has not read? */
export const unreadRow = (row) => row.theirLast > row.read;

/** How many of these threads are unread, skipping anybody blocked.
 *
 *  The blocked filter is applied HERE and nowhere else, so there is one place
 *  that decides whether a blocked person's letter counts. It does not: a
 *  blocked writer's old letters stay in the thread and can still be read, but
 *  they never light the number up, because the point of blocking is not to
 *  hear from somebody again.
 *
 *  `rows` is `[{ other, row }]`. */
export function unreadRows(rows, blocked = []) {
  const no = blocked instanceof Set ? blocked : new Set(blocked);
  let n = 0;
  for (const { other, row } of rows) if (!no.has(other) && unreadRow(row)) n += 1;
  return n;
}

/** The two index rows after one letter travels, as `{ from, to }`.
 *
 *  THE TWO SIDES ARE NOT THE SAME VALUE. The old code put one number to both
 *  keys, which was correct when the value was only "when did this thread last
 *  move". It stops being correct the moment the row carries a cursor: writing
 *  the sender's `read` onto the recipient's row would clear their count every
 *  time somebody wrote to them, which is the exact opposite of the feature.
 *  So this returns two objects and the caller stores each under its own key. */
export function rowsAfterLetter(fromRow, toRow, at) {
  return {
    // The writer's own shelf: the thread moved, but they have not been written
    // to, so nothing about their unread state changes.
    from: { at, theirLast: fromRow.theirLast, read: fromRow.read },
    // The reader's shelf: this is the newest thing the other person has said.
    to: { at, theirLast: at, read: toRow.read },
  };
}

/** The row after this side opens the thread.
 *
 *  Read up to `theirLast` and not to the clock: a letter stamped in the future
 *  by a skewed clock would otherwise be marked read before it was written, and
 *  the reader would never see it. */
export const rowAfterRead = (row) => ({ at: row.at, theirLast: row.theirLast, read: row.theirLast });

/* ----- have these two met? -----

   `#havePlayed` used to answer this by listing a player's whole archive, with
   no limit, and scanning it. That was cheap while the only caller was opening
   a thread. It stopped being cheap when "write to them" arrived on every
   player card, because the overwhelming majority of player cards are strangers
   and a stranger is a full scan that finds nothing.

   THIS REVERSES A DECISION THIS FILE'S NEIGHBOUR MADE ON PURPOSE.
   `registry.js` used to say that a list of everybody you have ever played "is
   exactly the data this feature exists to avoid needing", and answered out of
   the archive instead. The reasoning was good and the cost changed underneath
   it. What is stored here is deliberately the smallest thing that answers the
   question: existence and nothing else — no timestamp, no count, no order. It
   says you two have met. It does not say when, how often, or who won, all of
   which the archive already knows and this does not duplicate.

   `metDone:<player>` marks a player whose archive has been walked once, so a
   miss becomes an answer rather than a reason to walk it again. Without it the
   stranger case — the common case — never stops scanning, and the fix fixes
   nothing. */
export const metKey = (a, b) => `met:${a}:${b}`;
export const metDoneKey = (id) => `metDone:${id}`;

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

/** A stored thread, read defensively.
 *
 *  A letter may carry a position. It is read through `readDiagram`, which
 *  refuses a board of the wrong size, the wrong number of points, or a crop
 *  outside it, and a letter whose picture will not read keeps its words and
 *  loses the picture — which is what a reader would have seen if it had never
 *  been attached. A broken diagram is never repaired into a different
 *  position: guessing at somebody's go problem is worse than dropping it. */
export function readThread(stored) {
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((l) => l && typeof l === "object" && typeof l.from === "string" && typeof l.text === "string")
    .map((l) => {
      const out = { from: l.from, text: l.text, at: Number(l.at) || 0 };
      const atom = l.diagram ? readDiagram(l.diagram) : null;
      if (atom) out.diagram = atom;
      /* A move letter says which point was played, so the thread can draw the
         answer as an answer rather than as another picture. It is the move ON
         the diagram in the same letter, which is the position AFTER it. */
      if (atom && l.move && Number.isInteger(l.move.c) && Number.isInteger(l.move.r)) {
        out.move = { c: l.move.c, r: l.move.r };
      }
      return out;
    });
}

/** The thread with one more letter on the end, capped.
 *
 *  `extra` carries the optional position and the optional move. It is spread
 *  last and the letter's own three fields are written first, so nothing handed
 *  in can overwrite who wrote it or when. */
export function withLetter(thread, from, text, now, extra = null) {
  const letter = { from, text, at: Number(now) || 0 };
  if (extra && extra.diagram) letter.diagram = extra.diagram;
  if (extra && extra.move) letter.move = extra.move;
  return [...thread, letter].slice(-THREAD_KEEP);
}

/** The most recent position in a thread, and who put it there.
 *
 *  This is what a reply is played on. It is the LAST one rather than the first
 *  because a thread is a conversation: if two positions have been sent, the
 *  question on the table is the newer one.
 *
 *  Returns null when there is nothing to answer. */
export function lastDiagram(thread) {
  for (let i = thread.length - 1; i >= 0; i--) {
    if (thread[i].diagram) return { letter: thread[i], at: i };
  }
  return null;
}

/** May this person answer the position on the table?
 *
 *  Not their own: a diagram is a question, and answering your own question in
 *  the thread you asked it in is a note to yourself, which the box above is
 *  already for. Everything else about who may write at all is `mayWrite`'s,
 *  and this does not restate it. */
export const mayAnswer = (found, me) => !!found && found.letter.from !== me;

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
