/* ----------------------- MASTER DATA (pure) -----------------------
   What a master's JSON (public/masters/<id>.json, built by tools/masters/build.mjs)
   must look like, and the two reads the bot seam makes of it: the opening book at a
   position, and a weighted draw from it. Anything malformed is a `StyleDataError`
   naming the file and the reason, never a silent fallback. */

import { canonical, bookKey, fromCanonical } from "./symmetries.js";

export class StyleDataError extends Error {
  constructor(message, file = null) {
    super(file ? `${file}: ${message}` : message);
    this.name = "StyleDataError";
    this.file = file;
  }
}

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

/** Shape-check a master's JSON and return it. Throws `StyleDataError`. */
export function validateMaster(json, file = null) {
  const fail = (why) => { throw new StyleDataError(why, file); };
  if (!isObj(json)) fail("not an object");
  if (typeof json.id !== "string" || !json.id) fail("missing id");
  if (typeof json.name !== "string" || !json.name) fail("missing name");
  if (!Array.isArray(json.years) || json.years.length !== 2 || !json.years.every(Number.isInteger)) fail("years must be two integers");
  if (!isObj(json.games) || !Number.isInteger(json.games.even)) fail("games.even must be an integer");
  if (!isObj(json.style) || !isObj(json.style.master)) fail("style.master missing");
  if (!isObj(json.book) || !isObj(json.book.entries)) fail("book.entries missing");
  for (const [key, entry] of Object.entries(json.book.entries)) {
    if (!isObj(entry)) fail(`book entry ${key} is not an object`);
    for (const [mv, n] of Object.entries(entry)) {
      if (!/^\d+$/.test(mv) || !Number.isInteger(n) || n <= 0) fail(`book entry ${key} has a bad move ${mv}: ${n}`);
    }
  }
  return json;
}

/** The book's entry for the side to move at `rec`'s position, with the moves mapped
 *  back to the real board, or null. Moves are not legality-checked here; the seam
 *  does that with the rules. */
export function bookEntry(master, rec) {
  const can = canonical(rec.board);
  const entry = master.book.entries[bookKey(can.hash, rec.toPlay)];
  if (!entry) return null;
  const N = rec.board.size;
  const moves = Object.entries(entry).map(([mv, n]) => {
    const i = Number(mv);
    const [c, r] = fromCanonical(can.t, i % N, Math.floor(i / N), N);
    return { c, r, n };
  }).sort((a, b) => b.n - a.n);
  return { hash: can.hash, moves };
}

/** A draw from a book entry, weighted by how many games played each move. */
export function sampleBook(moves, rng = Math.random) {
  const total = moves.reduce((s, m) => s + m.n, 0);
  let u = rng() * total;
  for (const m of moves) {
    u -= m.n;
    if (u <= 0) return { c: m.c, r: m.r, prob: m.n / total };
  }
  const last = moves[moves.length - 1];
  return { c: last.c, r: last.r, prob: last.n / total };
}
