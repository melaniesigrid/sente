/* ----------------------- DÉJÀ VU -----------------------
   Every position you have reached in a finished game, and how that game went.
   It is a personal opening book with no engine behind it: nothing here judges a
   move, suggests one, or knows anything about go beyond what a position is. It
   only remembers that you have stood here before, and what happened last time.

   A position is stored canonically (`canonical` in engine/style/symmetries.js),
   so the eight ways of turning a board over are one entry. Play your 4-4 in the
   bottom left this time and the top right last time and the board still knows
   it. That is the whole reason this feels like memory rather than like a hash
   table: a human does not remember which corner it was either.

   The same three rules the game log runs on hold here, for the same reasons.

   It never leaves the device. There is no endpoint, no beacon and no fetch in
   this module, and it sits under its own storage key rather than on the profile
   so that it cannot be swept along when a profile learns how to sync.

   It keeps no moves. An entry is a hash, a count and a win-loss tally. There is
   no order in it, so nothing here can be turned back into a game you played:
   you cannot replay a set of positions that does not know which followed which.

   It forgets. A cap, and the least-visited positions go first, because a
   position you have reached once is the one you are least likely to meet again.
   The player can empty it from their profile in one press.

   One kind of game is left out: pass-and-play. A shared board has no "you" to
   file a result under, and "you have been here before" with nothing after it is
   half a sentence. Views read this memory whatever they are showing, so a
   position met while playing a friend is still recognised; it is only the
   writing down that a shared board does not do. */
import { canonical, bookKey } from "../engine/style/symmetries.js";
import { replay, play, pass } from "../engine/index.js";

export const STORE_KEY = "sente-deja-v1";

/** Positions kept. At roughly forty bytes an entry this is well under a hundred
 *  kilobytes, and it is a couple of seasons of play at the window below. */
export const CAP = 1500;

/* The window of a game that is worth remembering, counted in moves played.
   Before FIRST every game looks like every other game, so a note there would
   fire constantly and mean nothing; after LAST a position on a full board has
   essentially never been seen before and never will be again, so keeping it
   spends the cap on entries that can only ever say "once". What is left is the
   opening and the early middle game, which is the part a player really does
   arrive at again. */
export const FIRST = 8;
export const LAST = 44;

const isCount = (n) => Number.isInteger(n) && n >= 0;

/** One entry: `[times, won, lost, lastSeen]`, where lastSeen is a day count
 *  used only to break ties when the cap is reached. Returns null if it is not
 *  one, so a store somebody has edited by hand costs them their memory rather
 *  than breaking a game. */
export function sanitizeEntry(value) {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const [n, w, l, t] = value;
  if (![n, w, l, t].every(isCount)) return null;
  if (n === 0 || w + l > n) return null;
  return [n, w, l, t];
}

/** The whole store, cleaned and capped. */
export function sanitizeMemory(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const [key, entry] of Object.entries(value)) {
    const ok = typeof key === "string" && key.length <= 16 ? sanitizeEntry(entry) : null;
    if (ok) out[key] = ok;
  }
  return trim(out);
}

/** Drop the least-visited positions until the store is inside the cap, oldest
 *  first among equals. A position reached once is the one least likely to come
 *  round again, which makes visit count the right thing to forget by. */
export function trim(memory, cap = CAP) {
  const keys = Object.keys(memory);
  if (keys.length <= cap) return memory;
  keys.sort((a, b) => memory[a][0] - memory[b][0] || memory[a][3] - memory[b][3]);
  const out = { ...memory };
  for (const key of keys.slice(0, keys.length - cap)) delete out[key];
  return out;
}

/** Days since the epoch, which is all the tie-breaker needs and is two bytes
 *  rather than the thirteen a timestamp would spend on every entry. */
export const today = (now = Date.now()) => Math.floor(now / 86400000);

/** The canonical key for a position and the side to move, or null outside the
 *  window. One function, so what is written at the end of a game and what is
 *  looked up during one can never drift apart. */
export function keyFor(board, toPlay, moveNumber) {
  if (moveNumber < FIRST || moveNumber > LAST) return null;
  return bookKey(canonical(board).hash, toPlay);
}

/** Every position of a finished game that is worth keeping, as keys. Replayed
 *  from the record rather than collected during play, because a game that was
 *  abandoned has no result to attribute and a game that was taken back never
 *  really passed through the position it took back. Deduplicated: a triple ko
 *  is one position, whatever the move numbers say. */
export function positionsOf(record) {
  const keys = new Set();
  // Stepped forward one move at a time rather than replayed from the start at
  // every length: the same positions, without walking the game LAST times.
  let state = replay(record, []);
  let n = 0;
  for (const mv of record.moves) {
    if (mv.type === "play") state = play(state, mv.c, mv.r, mv.color);
    else if (mv.type === "pass") state = pass(state, mv.color);
    else break;                       // a resignation or a timeout ends the board
    n += 1;
    if (n > LAST) break;
    const key = keyFor(state.board, state.toPlay, n);
    if (key) keys.add(key);
  }
  return [...keys];
}

/** The memory after a finished game. `won` is null where the game was not the
 *  player's to win, and then the position is counted but neither tallied. */
export function remember(memory, record, won, day = today()) {
  const out = { ...memory };
  for (const key of positionsOf(record)) {
    const [n, w, l] = out[key] || [0, 0, 0, day];
    out[key] = [n + 1, w + (won === true ? 1 : 0), l + (won === false ? 1 : 0), day];
  }
  return trim(out);
}

/** What the memory has to say about a position, or null for nothing. */
export function recall(memory, board, toPlay, moveNumber) {
  const key = keyFor(board, toPlay, moveNumber);
  const entry = key && memory[key];
  if (!entry) return null;
  const [n, w, l] = entry;
  return { n, won: w, lost: l, decided: w + l };
}

/** The whisper. Plain, and precise where the arithmetic could be questioned:
 *  where some of those games did not finish, the two numbers are given against
 *  the count that did, so nobody is left doing sums that do not add up. */
export function dejaNote(seen) {
  if (!seen) return null;
  const { n, won, lost, decided } = seen;
  if (n === 1) {
    if (won === 1) return "You have been here before, and you won that game.";
    if (lost === 1) return "You have been here before, and you lost that game.";
    return "You have been here before. That game was never decided.";
  }
  const head = `You have been here ${n} times before.`;
  if (decided === 0) return `${head} None of them was decided.`;
  if (decided < n) return `${head} Of the ${decided} that finished, you won ${won}.`;
  if (lost === 0) return `${head} You won every one.`;
  if (won === 0) return `${head} You lost every one.`;
  return `${head} You won ${won} and lost ${lost}.`;
}

/** How much is in there, for the profile to show. */
export function summarize(memory) {
  const keys = Object.keys(memory);
  const revisited = keys.filter(k => memory[k][0] > 1).length;
  return { positions: keys.length, revisited, full: keys.length >= CAP };
}

/* ---- storage. Everything above is pure. ---- */

export function loadMemory() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? sanitizeMemory(JSON.parse(raw)) || {} : {};
  } catch {
    // Unreadable: an empty memory is the right answer. Losing this costs a
    // pleasant remark, and it is not worth a message to somebody mid-game.
    return {};
  }
}

/** Fold a finished game in and save. Returns the new memory, saved or not. */
export function rememberGame(record, won) {
  const next = remember(loadMemory(), record, won);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or refused. The memory is a pleasure; the game is not.
  }
  return next;
}

export function clearMemory() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // If it cannot be removed it could not have been written.
  }
  return {};
}
