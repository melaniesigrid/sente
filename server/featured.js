/* ----------------------- FEATURED GAMES (pure) -----------------------
   The few games a player chooses to show on their page, and the line they get
   to say about each one.

   WHAT IS STORED IS A PIN, NOT A GAME
   A featured game is an id and a sentence. The game itself stays in the room
   it was played in and in the archive index, so pinning copies nothing and a
   pinned game cannot drift out of step with the real one. It also means the
   pin costs the same whatever the game was, which matters on a record that is
   read every time somebody opens the page.

   WHY THREE
   A page that shows everything shows nothing. Three is enough for a best win,
   a favourite loss and the strange one, and few enough that choosing is a real
   act. It is also small enough that the whole list fits on the player record
   without the ladder's scan noticing.

   THE OTHER PLAYER GETS NO SAY, AND THAT IS DELIBERATE
   A game is two people's. Pinning one shows both names, which is already true
   of the room and of the ladder. What a person may NOT do is write a caption
   about somebody else and publish it under their name, so the note is shown as
   the pinner's words, attributed, and the notice says so in a sentence of its
   own. */

/** How many games one player may show. */
export const MAX_FEATURED = 3;

/** How long the line about a game may be. One sentence, not an essay: the page
 *  is a card and the game is the thing being pointed at. */
export const NOTE_MAX = 140;

/** Strip what would let one player's line break another's layout or smuggle a
 *  control code into a log. Newlines become spaces, because somebody pasting
 *  two lines into a one-line field means a gap and not two words run together. */
export function cleanNote(v) {
  if (typeof v !== "string") return "";
  return Array.from(v)
    .map((ch) => {
      const c = ch.codePointAt(0);
      if (c === 10 || c === 13 || c === 9) return " ";
      return c > 31 && c !== 127 ? ch : "";
    })
    .join("").replace(/\s+/g, " ").trim().slice(0, NOTE_MAX);
}

/** A stored list, read defensively. Storage holds whatever an older version of
 *  this file put there, and a list that has lost its shape reads as empty
 *  rather than throwing inside a request nobody can retry. */
export function readFeatured(stored) {
  if (!Array.isArray(stored)) return [];
  const seen = new Set();
  const out = [];
  for (const e of stored) {
    if (!e || typeof e !== "object") continue;
    if (typeof e.id !== "string" || e.id === "" || seen.has(e.id)) continue;
    seen.add(e.id);
    out.push({ id: e.id, note: cleanNote(e.note), at: Number(e.at) || 0 });
    if (out.length >= MAX_FEATURED) break;
  }
  return out;
}

/** Is this game already pinned? */
export const isPinned = (list, gameId) => list.some((e) => e.id === gameId);

/** Pin a game, or change the line on one already pinned.
 *
 *  Re-pinning is an edit rather than a refusal: the button on a pinned game
 *  says "change what you said", and making that a different call would be two
 *  routes for one idea. A game pinned twice keeps its original place in the
 *  list, so editing a note does not reorder somebody's page under them. */
export function pin(list, gameId, note, now) {
  const at = Number(now) || 0;
  if (isPinned(list, gameId)) {
    return { list: list.map((e) => (e.id === gameId ? { ...e, note: cleanNote(note) } : e)) };
  }
  if (list.length >= MAX_FEATURED) return { error: "too-many-featured" };
  return { list: [...list, { id: gameId, note: cleanNote(note), at }] };
}

/** Take a game off the page. Never an error: the button is on a pinned game,
 *  and pressing it twice means the same thing both times. */
export function unpin(list, gameId) {
  return { list: list.filter((e) => e.id !== gameId) };
}

/** What a stranger is shown: the pinned games, in the order they were pinned,
 *  each with the row from the archive and the pinner's line.
 *
 *  A pin whose game has gone (a room that never existed, an id from a previous
 *  life of the data) is dropped rather than drawn as an empty card. The list
 *  therefore heals itself by being read, the same way the friends lists do. */
export function featuredWith(list, rowsById) {
  return list
    .map((e) => {
      const row = rowsById.get ? rowsById.get(e.id) : rowsById[e.id];
      return row ? { ...row, note: e.note, pinnedAt: e.at } : null;
    })
    .filter(Boolean);
}
