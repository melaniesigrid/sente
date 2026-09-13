/* ----------------------- FINDING SOMEBODY (pure) -----------------------
   What the search box says while somebody types in it.

   Five states and no more, worked out from what has been typed and what the
   last answer was for. They are here rather than in the card because the
   difference between "nobody by that name" and "nothing has been asked yet" is
   the whole of what a search box communicates, and getting it wrong shows an
   empty result to somebody who has typed one letter.

   The answer carries the search it was for, so a slow reply to `an` cannot
   paint itself under a box that now reads `anastasia`. */

import { query } from "../../server/directory.js";

export { MIN_QUERY } from "../../server/directory.js";

/** The folded search, or null for one too short to ask with. */
export const searchable = (typed) => query(typed);

/** What the card should be showing.
 *
 *  `answer` is the last result that came back, `{ for, people }` on success,
 *  `{ for, error }` on failure, or null.
 *  `busy` is whether a call is in the air. The two are read together because
 *  an answer for an older search is not an answer to this one: the box has
 *  moved on, and showing the old list under the new word is the one thing a
 *  search box must never do. */
export function findState(typed, answer, busy) {
  const raw = typeof typed === "string" ? typed.trim() : "";
  if (!raw) return { kind: "idle", people: [] };
  const q = searchable(raw);
  if (!q) return { kind: "short", people: [] };
  const fresh = answer && answer.for === q;
  if (!fresh) return { kind: "searching", people: [] };
  if (answer.error) return { kind: "error", people: [] };
  return answer.people.length
    ? { kind: "found", people: answer.people }
    : { kind: busy ? "searching" : "empty", people: [] };
}

/** How long to wait after a keystroke before asking. Long enough that typing a
 *  handle is one call and not eight, short enough that it still feels like the
 *  list is following your hands. */
export const TYPING_PAUSE_MS = 250;
