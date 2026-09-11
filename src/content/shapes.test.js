import { describe, it, expect } from "vitest";
import { tryPlay, chainAt, idx, opponent } from "../engine/index.js";
import { lessonsInBook, lessonById } from "./library.js";
import { setupToBoard } from "./positions.js";
import { SHAPE_ARTICLES, SHAPE_FAMILIES, SHAPE_COUNT, shapeByKey, shapeForLesson, shapesInFamily, familyByKey } from "./shapes.js";

/* An article about a shape is a claim about what the shape does, and a claim
   about what a shape does is exactly the kind of thing that can be checked.
   So it is: every number the Book of Shapes states in prose is derived here
   from the engine rather than trusted. If someone edits a lesson and writes
   "seven liberties" where the board says eight, this file fails. */

const P = (c, r) => ({ c, r });
const at = (board, p) => board.cells[idx(board.size, p.c, p.r)];
const libs = (board, p) => chainAt(board, p.c, p.r).libs.size;

/** Distinct liberties over a set of stones, counting each empty point once. */
function sharedLibs(board, points) {
  const all = new Set();
  for (const p of points) for (const i of chainAt(board, p.c, p.r).libs) all.add(i);
  return all;
}

/** Play a line alternating from `color`, carrying the ko point. Throws on an illegal move. */
function play(board, color, moves) {
  let b = board, ko = null;
  for (const m of moves) {
    const res = tryPlay(b, m.c, m.r, color, { koPoint: ko });
    if (!res.ok) throw new Error(`(${m.c},${m.r}) for ${color}: ${res.reason}`);
    b = res.board; ko = res.ko; color = opponent(color);
  }
  return b;
}

describe("the catalogue", () => {
  it("is nine articles, each with all three parts", () => {
    expect(SHAPE_ARTICLES).toHaveLength(SHAPE_COUNT);
    expect(SHAPE_COUNT).toBeGreaterThanOrEqual(9);
    for (const a of SHAPE_ARTICLES) {
      expect(a.name, a.key).toBeTruthy();
      expect(a.japanese, a.key).toBeTruthy();
      expect(a.proverb, a.key).toBeTruthy();
      for (const part of ["buys", "costs", "breaks"]) {
        expect(a[part], `${a.key}.${part}`).toBeTruthy();
        expect(a[part].length, `${a.key}.${part}`).toBeGreaterThan(120);
        expect(a[part], `${a.key}.${part}`).not.toMatch(/!/);
      }
    }
  });
  it("has unique keys, known families, and lookups that work", () => {
    expect(new Set(SHAPE_ARTICLES.map(a => a.key)).size).toBe(SHAPE_COUNT);
    const families = new Set(SHAPE_FAMILIES.map(f => f.key));
    for (const a of SHAPE_ARTICLES) expect(families, a.key).toContain(a.family);
    expect(shapeByKey("ponnuki").name).toBe("The ponnuki");
    expect(shapeByKey("nope")).toBeNull();
    expect(familyByKey("bad").name).toBe("Residue");
    expect(shapesInFamily("connection").length).toBeGreaterThanOrEqual(3);
    expect(SHAPE_ARTICLES.every(a => shapesInFamily(a.family).includes(a))).toBe(true);
  });
  it("names a real lesson wherever it names one, and every shape lesson is on the shelf", () => {
    for (const a of SHAPE_ARTICLES) {
      if (a.lessonId === null) continue;
      expect(lessonById(a.lessonId), `article ${a.key} -> ${a.lessonId}`).not.toBeNull();
      expect(shapeForLesson(a.lessonId)).toBe(a);
    }
    const book = lessonsInBook("shapes");
    expect(book.length).toBeGreaterThanOrEqual(5);
    for (const l of book) expect(l.track === "shape" || l.track === "tactics", l.id).toBe(true);
  });
});

describe("the tiger's mouth", () => {
  const lesson = lessonById("shape-tigers-mouth");
  const mouth = setupToBoard(lesson.steps[0].setup, lesson.size);

  it("leaves an intruder with exactly one liberty", () => {
    const res = tryPlay(mouth, 4, 3, "w");
    expect(res.ok).toBe(true);
    expect(libs(res.board, P(4, 3))).toBe(1);
  });
  it("becomes a real eye once the intruder is eaten", () => {
    const after = play(mouth, "w", [P(4, 3), P(4, 2)]);
    for (const p of [P(3, 3), P(5, 3), P(4, 2), P(4, 4)]) expect(at(after, p)).toBe("b");
    expect(tryPlay(after, 4, 3, "w").reason).toBe("suicide");
  });
  it("stops being a connection when the intruder has a friend above it", () => {
    const propped = setupToBoard(lesson.steps[3].setup, lesson.size);
    const cut = play(propped, "b", [P(4, 4), P(4, 3)]);      // Black takes the mouth, White cuts
    expect(libs(cut, P(4, 3))).toBe(3);                      // and does not die
    const solid = play(propped, "b", [P(4, 3)]);
    expect(libs(solid, P(4, 3))).toBe(7);                    // the answer that does work
  });
});

describe("the ponnuki", () => {
  const lesson = lessonById("shape-ponnuki");
  const stones = [P(4, 3), P(3, 4), P(5, 4), P(4, 5)];

  it("is eight liberties and an eye in the middle of the board", () => {
    const made = setupToBoard(lesson.steps[2].setup, lesson.size);
    const all = sharedLibs(made, stones);
    all.delete(idx(made.size, 4, 4));
    expect(all.size).toBe(8);
    expect(tryPlay(made, 4, 4, "w").reason).toBe("suicide");
  });
  it("is six liberties and the same eye in the corner", () => {
    const corner = setupToBoard(lesson.steps[3].setup, lesson.size);
    const all = sharedLibs(corner, [P(1, 0), P(0, 1), P(2, 1), P(1, 2)]);
    all.delete(idx(corner.size, 1, 1));
    expect(all.size).toBe(6);
    expect(tryPlay(corner, 1, 1, "w").reason).toBe("suicide");
  });
  it("is made by a capture, not by placing four stones", () => {
    const atari = setupToBoard(lesson.steps[0].setup, lesson.size);
    expect(libs(atari, P(4, 4))).toBe(1);
    const res = tryPlay(atari, 4, 5, "b");
    expect(res.ok && res.captured.length).toBe(1);
  });
});

describe("the knight's move", () => {
  const lesson = lessonById("shape-keima-waist");
  const open = setupToBoard(lesson.steps[0].setup, lesson.size);
  const supported = setupToBoard(lesson.steps[3].setup, lesson.size);

  it("in the open leaves the cutter with the weakest group", () => {
    const after = play(open, "w", [P(5, 4), P(4, 4), P(5, 3), P(4, 2)]);
    expect(libs(after, P(5, 4))).toBe(3);   // White's cutting chain
    expect(libs(after, P(4, 4))).toBe(6);   // Black's wall
    expect(libs(after, P(5, 5))).toBe(3);   // the stone Black did not defend
  });
  it("with a white stone either side of the waist, the same cut splits Black", () => {
    const after = play(supported, "w", [P(4, 4)]);
    expect(libs(after, P(4, 4))).toBe(5);
    expect(libs(after, P(4, 3))).toBe(3);
    expect(libs(after, P(5, 5))).toBe(4);
  });
});

describe("the two-space extension", () => {
  const lesson = lessonById("shape-two-space-extension");
  const bare = setupToBoard(lesson.steps[2].setup, lesson.size);
  const backed = setupToBoard(lesson.steps[3].setup, lesson.size);

  it("answers a wedge the same way from either side", () => {
    for (const [wedge, block, far] of [[P(4, 2), P(5, 2), P(3, 2)], [P(5, 2), P(4, 2), P(6, 2)]]) {
      const after = play(bare, "w", [wedge, block]);
      expect(libs(after, wedge)).toBe(2);   // the wedge cannot live
      expect(libs(after, block)).toBe(5);   // the pair Black chose to keep
      expect(libs(after, far)).toBe(3);     // the stone Black let go of
    }
  });
  it("is cut when the wedge has a stone behind it", () => {
    const after = play(backed, "w", [P(5, 2), P(4, 2), P(5, 3)]);
    expect(libs(after, P(5, 2))).toBe(6);
    expect(libs(after, P(6, 2))).toBe(3);
  });
});

describe("the three connections", () => {
  const lesson = lessonById("shape-three-connections");
  const base = setupToBoard(lesson.steps[0].setup, lesson.size);

  it("solid is one chain of nine liberties", () => {
    const after = play(base, "b", [P(3, 4)]);
    expect(libs(after, P(3, 4))).toBe(9);
  });
  it("the bamboo joint is two chains of six, ten between them, and cannot be cut", () => {
    const after = play(base, "b", [P(4, 5)]);
    expect(libs(after, P(3, 3))).toBe(6);
    expect(libs(after, P(3, 5))).toBe(6);
    expect(sharedLibs(after, [P(3, 3), P(3, 5)]).size).toBe(10);
    for (const gap of [P(3, 4), P(4, 4)]) {
      const poke = tryPlay(after, gap.c, gap.r, "w");
      expect(poke.ok && libs(poke.board, gap)).toBe(2);
    }
  });
  it("the tiger's mouth leaves three chains and a mouth that eats", () => {
    const after = play(base, "b", [P(2, 4)]);
    expect([libs(after, P(3, 3)), libs(after, P(3, 5)), libs(after, P(2, 4))]).toEqual([6, 4, 4]);
    const poke = tryPlay(after, 3, 4, "w");
    expect(poke.ok && libs(poke.board, P(3, 4))).toBe(1);
  });
});

describe("six points that die", () => {
  const lesson = lessonById("life-and-death-tesuji");
  const corner = setupToBoard(lesson.steps[0].setup, lesson.size);
  const space = [P(0, 0), P(1, 0), P(2, 0), P(0, 1), P(1, 1), P(2, 1)];

  /* Exhaustive search of the eye space: can White keep the wall on the board?
     Passes are allowed both ways and a repeated position counts as survival,
     so the search is generous to the defender. Ko is out of scope and does not
     arise here. */
  function lives(board, toPlay, seen = new Set(), depth = 0) {
    const key = board.cells.map(v => (v === "b" ? "1" : v === "w" ? "2" : "0")).join("") + toPlay;
    if (seen.has(key) || depth > 20) return true;
    if (at(board, P(3, 0)) !== "w") return false;
    const next = new Set(seen).add(key);
    const tries = [];
    for (const m of space) {
      if (at(board, m) !== null) continue;
      const res = tryPlay(board, m.c, m.r, toPlay);
      if (res.ok) tries.push(res.board);
    }
    const other = opponent(toPlay);
    if (toPlay === "w") {
      return tries.some(b => lives(b, other, next, depth + 1)) || lives(board, other, next, depth + 1);
    }
    return !tries.some(b => !lives(b, other, next, depth + 1));
  }

  it("is a sealed six-point eye space with no outside liberties", () => {
    expect(libs(corner, P(3, 0))).toBe(6 - 2);   // four of the six touch the wall
    expect(space.every(p => at(corner, p) === null)).toBe(true);
  });
  it("lives if White moves first", () => {
    expect(lives(corner, "w")).toBe(true);
  });
  it("dies to the 2-2 point, and to nothing else", () => {
    const killers = space.filter(m => {
      const res = tryPlay(corner, m.c, m.r, "b");
      return res.ok && !lives(res.board, "w");
    });
    expect(killers).toEqual([P(1, 1)]);
  });
  it("the lesson's line is the kill, and its refutations really do let White live", () => {
    const seq = lesson.steps[2];
    const dead = play(corner, "b", seq.moves);
    expect(lives(dead, "w")).toBe(false);
    for (const rf of lesson.steps[1].refutations) {
      const saved = play(corner, "b", [rf.move, rf.reply]);
      expect(lives(saved, "b"), `${rf.move.c},${rf.move.r}`).toBe(true);
    }
  });
});

describe("the ko is a ko", () => {
  const lesson = lessonById("ko-as-strategy");
  const board = setupToBoard(lesson.steps[0].setup, lesson.size);

  it("White's stone has one liberty and Black's capture cannot be answered in kind", () => {
    expect(libs(board, P(4, 3))).toBe(1);
    const took = tryPlay(board, 3, 3, "b");
    expect(took.ok && took.captured.length).toBe(1);
    expect(tryPlay(took.board, 4, 3, "w", { koPoint: took.ko }).reason).toBe("ko");
  });
  it("and can be retaken after a threat and an answer", () => {
    expect(() => play(board, "b", lesson.steps[1].moves)).not.toThrow();
  });
});
