/* ----------------------- DÉJÀ VU, CHECKED -----------------------
   The claim that makes this feel like memory is the symmetry one: the same
   opening played into a different corner has to come back as the same position,
   or the note almost never fires and the feature is a hash table with a nice
   sentence attached. That is the first thing tested here.

   The second is that the memory cannot be read back as a game. It keeps no
   order and no moves, and the test says so by checking there is nothing in a
   stored entry but four small numbers. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  keyFor, positionsOf, remember, recall, dejaNote, trim, sanitizeMemory, sanitizeEntry,
  summarize, loadMemory, rememberGame, clearMemory, STORE_KEY, CAP, FIRST, LAST,
} from "./deja.js";
import { createGame, play, pass } from "../engine/index.js";

/** A record from a list of [c, r] points, played alternately from Black. */
function game(points, size = 9) {
  let rec = createGame({ size });
  for (const [c, r] of points) rec = play(rec, c, r);
  return rec;
}

/** The same points turned a quarter turn on a board of `size`. */
const rotate = (points, size = 9) => points.map(([c, r]) => [size - 1 - r, c]);
/** The same points mirrored left to right. */
const mirror = (points, size = 9) => points.map(([c, r]) => [size - 1 - c, r]);

// Ten moves, deliberately asymmetric, so a position is not accidentally its own
// mirror image and the test is actually checking the transform.
const OPENING = [[2, 2], [6, 6], [2, 6], [6, 2], [4, 4], [7, 4], [1, 4], [4, 7], [3, 1], [5, 5]];

describe("a position is the same position, turned over", () => {
  it("keys a rotation and a mirror the same as the original", () => {
    const a = game(OPENING), b = game(rotate(OPENING)), c = game(mirror(OPENING));
    const key = (rec) => keyFor(rec.board, rec.toPlay, rec.moves.length);
    expect(key(a)).toBe(key(b));
    expect(key(a)).toBe(key(c));
  });

  it("keys a genuinely different position differently", () => {
    const a = game(OPENING);
    const b = game([...OPENING.slice(0, 9), [5, 6]]);   // one stone moved
    const key = (rec) => keyFor(rec.board, rec.toPlay, rec.moves.length);
    expect(key(a)).not.toBe(key(b));
  });

  it("tells the two sides to move apart on the same stones", () => {
    const rec = game(OPENING);
    expect(keyFor(rec.board, "b", 10)).not.toBe(keyFor(rec.board, "w", 10));
  });
});

describe("the window", () => {
  it("keeps nothing before the openings have diverged", () => {
    expect(keyFor(game(OPENING).board, "b", FIRST - 1)).toBe(null);
    expect(keyFor(game(OPENING).board, "b", FIRST)).not.toBe(null);
  });

  it("stops once a position could only ever be seen once", () => {
    expect(keyFor(game(OPENING).board, "b", LAST)).not.toBe(null);
    expect(keyFor(game(OPENING).board, "b", LAST + 1)).toBe(null);
  });

  it("takes only the window out of a finished game", () => {
    const long = [];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) long.push([c, r]);
    const keys = positionsOf(game(long.slice(0, 48)));
    expect(keys).toHaveLength(LAST - FIRST + 1);
  });

  it("stops at a resignation rather than reading past it", () => {
    let rec = game(OPENING);
    const before = positionsOf(rec).length;
    rec = { ...rec, moves: [...rec.moves, { type: "resign", color: "b" }] };
    expect(positionsOf(rec)).toHaveLength(before);
  });

  // A position is the stones plus whose turn it is, so the first pass is a
  // position of its own: same stones, other player to move. The second pass
  // hands the move back and lands on a position already written down, and it is
  // counted once. That is the guarantee, and a triple ko is the case that needs
  // it: a game can pass through one position several times and it is one entry.
  it("counts each position once, however often the game passes through it", () => {
    let rec = game(OPENING);
    const plain = positionsOf(rec).length;
    rec = pass(rec, "b");                  // same stones, White to move: new
    rec = pass(rec, "w");                  // same stones, Black to move: already seen
    const keys = positionsOf(rec);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toHaveLength(plain + 1);
  });
});

describe("remembering and recalling", () => {
  it("says nothing about a position it has not seen", () => {
    const rec = game(OPENING);
    expect(recall({}, rec.board, rec.toPlay, 10)).toBe(null);
    expect(dejaNote(null)).toBe(null);
  });

  it("recognises the same game played into another corner", () => {
    const played = game(OPENING);
    const memory = remember({}, played, true);
    const again = game(rotate(OPENING));
    const seen = recall(memory, again.board, again.toPlay, 10);
    expect(seen).toMatchObject({ n: 1, won: 1, lost: 0 });
    expect(dejaNote(seen)).toBe("You have been here before, and you won that game.");
  });

  it("tallies wins and losses across games", () => {
    const rec = game(OPENING);
    let memory = remember({}, rec, true);
    memory = remember(memory, rec, false);
    memory = remember(memory, rec, false);
    const seen = recall(memory, rec.board, rec.toPlay, 10);
    expect(seen).toMatchObject({ n: 3, won: 1, lost: 2, decided: 3 });
    expect(dejaNote(seen)).toBe("You have been here 3 times before. You won 1 and lost 2.");
  });

  // A jigo, or a master study that was never the player's to win. The position
  // is counted, because they did stand there, and neither column moves.
  it("counts an undecided game without claiming it either way", () => {
    const rec = game(OPENING);
    const memory = remember({}, rec, null);
    const seen = recall(memory, rec.board, rec.toPlay, 10);
    expect(seen).toMatchObject({ n: 1, won: 0, lost: 0, decided: 0 });
    expect(dejaNote(seen)).toBe("You have been here before. That game was never decided.");
  });

  it("never leaves the reader doing sums that do not add up", () => {
    const rec = game(OPENING);
    let memory = remember({}, rec, true);
    memory = remember(memory, rec, null);
    memory = remember(memory, rec, null);
    expect(dejaNote(recall(memory, rec.board, rec.toPlay, 10)))
      .toBe("You have been here 3 times before. Of the 1 that finished, you won 1.");
  });

  it("keeps no moves and no order, only four small numbers", () => {
    const memory = remember({}, game(OPENING), true);
    for (const entry of Object.values(memory)) {
      expect(entry).toHaveLength(4);
      expect(entry.every(n => Number.isInteger(n))).toBe(true);
    }
  });
});

describe("forgetting", () => {
  it("drops the least-visited positions first, oldest among equals", () => {
    const memory = { a: [1, 0, 0, 5], b: [3, 0, 0, 1], c: [1, 0, 0, 9], d: [2, 0, 0, 1] };
    expect(Object.keys(trim(memory, 2)).sort()).toEqual(["b", "d"]);
    expect(Object.keys(trim(memory, 3)).sort()).toEqual(["b", "c", "d"]);
  });

  it("leaves a memory inside the cap alone", () => {
    const memory = { a: [1, 0, 0, 1] };
    expect(trim(memory, CAP)).toBe(memory);
  });

  it("holds the store to the cap however it got there", () => {
    const big = {};
    for (let i = 0; i < CAP + 40; i++) big[`b${i.toString(36)}`] = [1, 0, 0, i];
    expect(Object.keys(sanitizeMemory(big))).toHaveLength(CAP);
  });
});

describe("the stored memory is untrusted", () => {
  it("refuses an entry that is not four counts", () => {
    expect(sanitizeEntry([1, 0, 0, 1])).toEqual([1, 0, 0, 1]);
    expect(sanitizeEntry([1, 0, 0])).toBe(null);
    expect(sanitizeEntry(["1", 0, 0, 1])).toBe(null);
    expect(sanitizeEntry([0, 0, 0, 1])).toBe(null);          // never visited
    expect(sanitizeEntry([1, 1, 1, 1])).toBe(null);          // more results than visits
    expect(sanitizeEntry(null)).toBe(null);
  });

  it("drops bad entries and keeps the rest", () => {
    expect(sanitizeMemory({ good: [2, 1, 1, 3], bad: "no", worse: [0, 0, 0, 0] }))
      .toEqual({ good: [2, 1, 1, 3] });
    expect(sanitizeMemory([])).toBe(null);
    expect(sanitizeMemory(null)).toBe(null);
  });
});

describe("what the profile shows", () => {
  it("counts the positions and the ones that came round again", () => {
    const rec = game(OPENING);
    let memory = remember({}, rec, true);
    const first = summarize(memory);
    expect(first.positions).toBeGreaterThan(0);
    expect(first.revisited).toBe(0);
    memory = remember(memory, rec, false);
    expect(summarize(memory)).toMatchObject({ positions: first.positions, revisited: first.positions });
  });
});

/** The same standin the game log's tests use: a Map behind the browser's four
 *  methods, which can be told to refuse a read or a write. */
function fakeStorage({ failRead = false, failWrite = false } = {}) {
  const data = new Map();
  return {
    getItem(k) { if (failRead) throw new Error("blocked"); return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { if (failWrite) throw new Error("QuotaExceeded"); data.set(k, String(v)); },
    removeItem(k) { data.delete(k); },
    clear() { data.clear(); },
  };
}

describe("storage", () => {
  beforeEach(() => { globalThis.localStorage = fakeStorage(); });
  afterEach(() => { delete globalThis.localStorage; vi.restoreAllMocks(); });

  it("round-trips a finished game through the browser under its own key", () => {
    const rec = game(OPENING);
    rememberGame(rec, false);
    expect(localStorage.getItem(STORE_KEY)).toBeTruthy();
    const seen = recall(loadMemory(), rec.board, rec.toPlay, 10);
    expect(dejaNote(seen)).toBe("You have been here before, and you lost that game.");
  });

  it("counts the same position up across two games", () => {
    const rec = game(OPENING);
    rememberGame(rec, true);
    rememberGame(game(mirror(OPENING)), true);      // the same game, turned over
    expect(recall(loadMemory(), rec.board, rec.toPlay, 10)).toMatchObject({ n: 2, won: 2 });
  });

  it("stays out of the profile, so it cannot be swept along when a profile syncs", () => {
    rememberGame(game(OPENING), true);
    expect(STORE_KEY).not.toMatch(/profile/);
    expect(localStorage.getItem("sente-profile-v3")).toBeNull();
  });

  it("forgets everything in one press", () => {
    rememberGame(game(OPENING), true);
    expect(clearMemory()).toEqual({});
    expect(loadMemory()).toEqual({});
  });

  it("reads an empty memory out of nonsense rather than throwing", () => {
    localStorage.setItem(STORE_KEY, "{not json");
    expect(loadMemory()).toEqual({});
  });

  it("keeps playing when storage refuses to be written or read", () => {
    globalThis.localStorage = fakeStorage({ failWrite: true });
    expect(() => rememberGame(game(OPENING), true)).not.toThrow();
    globalThis.localStorage = fakeStorage({ failRead: true });
    expect(loadMemory()).toEqual({});
    expect(() => rememberGame(game(OPENING), true)).not.toThrow();
  });
});
