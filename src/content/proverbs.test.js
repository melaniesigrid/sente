import { describe, it, expect } from "vitest";
import { tryPlay, chainAt, idx } from "../engine/index.js";
import { lessonsInBook, lessonById } from "./library.js";
import { setupToBoard } from "./positions.js";

/* A proverb is folk wisdom, which is exactly the kind of claim that deserves
   checking. These lessons state two things the engine can settle: a bamboo
   joint cannot be cut, and a ladder works only when nothing stands on its
   path. Both are checked here rather than asserted in the lesson text. */

const P = (c, r) => ({ c, r });
const at = (board, p) => board.cells[idx(board.size, p.c, p.r)];

/** Black ataris, White extends to its one remaining liberty. Returns the move
 *  list if the chase ends in a capture, or null if White ever gets loose. */
function ladder(board, wc, wr, moves = [], depth = 0) {
  if (depth > 40) return null;
  const libsOf = (b) => {
    const ch = chainAt(b, wc, wr);
    return [...ch.libs].map(i => ({ c: i % b.size, r: Math.floor(i / b.size) }));
  };
  const libs = libsOf(board);
  if (libs.length === 1) {
    const res = tryPlay(board, libs[0].c, libs[0].r, "b");
    return res.ok && res.captured && res.captured.length ? [...moves, libs[0]] : null;
  }
  if (libs.length !== 2) return null;         // loose: no ladder
  for (const atari of libs) {
    const a = tryPlay(board, atari.c, atari.r, "b");
    if (!a.ok) continue;
    const after = libsOf(a.board);
    if (after.length !== 1) continue;
    const run = tryPlay(a.board, after[0].c, after[0].r, "w");
    if (!run.ok) continue;
    const out = ladder(run.board, wc, wr, [...moves, atari, after[0]], depth + 1);
    if (out) return out;
  }
  return null;
}

describe("the proverbs are on the shelf", () => {
  it("uses the maxim step the library already had and never used", () => {
    const lessons = lessonsInBook("proverbs");
    expect(lessons.length).toBeGreaterThan(0);
    for (const l of lessons) {
      const maxims = l.steps.filter(s => s.type === "maxim");
      expect(maxims.length, `${l.id} states its proverb`).toBeGreaterThan(0);
      for (const m of maxims) {
        expect(m.line).toBeTruthy();
        expect(m.analogy).toBeTruthy();
      }
    }
  });
});

describe("Do Not Peep at a Bamboo Joint", () => {
  const joint = lessonById("proverb-bamboo-joint").steps[0].setup;

  it("connects into one chain whichever point White takes", () => {
    for (const [peep, answer] of [[P(3, 4), P(4, 4)], [P(4, 4), P(3, 4)]]) {
      const board = setupToBoard(joint, 9);
      const w = tryPlay(board, peep.c, peep.r, "w");
      expect(w.ok, `peep (${peep.c},${peep.r})`).toBe(true);
      const b = tryPlay(w.board, answer.c, answer.r, "b");
      expect(b.ok, `answer (${answer.c},${answer.r})`).toBe(true);
      // Both walls and the connecting stone are now a single chain.
      const chain = chainAt(b.board, 3, 3);
      expect(chain.stones.length, `after peep (${peep.c},${peep.r})`).toBe(9);
      expect(chain.libs.size).toBe(6);
    }
  });

  it("leaves the peeping stone with a single liberty", () => {
    const board = setupToBoard(joint, 9);
    const w = tryPlay(board, 4, 4, "w");
    const b = tryPlay(w.board, 3, 4, "b");
    expect(chainAt(b.board, 4, 4).libs.size).toBe(1);
  });
});

describe("If You Do Not Know Ladders", () => {
  const lesson = lessonById("proverb-ladder");
  const start = lesson.steps[0].setup;
  const broken = lesson.steps[3].setup;

  it("captures in eleven moves when the path is clear", () => {
    const line = ladder(setupToBoard(start, 9), 5, 5);
    expect(line).not.toBeNull();
    expect(line).toHaveLength(11);
    // The lesson's sequence step is the opening of that same ladder.
    const seq = lesson.steps.find(s => s.type === "sequence");
    seq.moves.forEach((m, i) => {
      expect({ c: m.c, r: m.r }, `sequence move ${i + 1}`).toEqual(line[i]);
    });
  });

  it("fails against a stone on its path and works against one off it", () => {
    for (const stone of [P(7, 7), P(6, 7), P(7, 6)]) {
      const setup = { b: start.b, w: [...start.w, stone] };
      expect(ladder(setupToBoard(setup, 9), 5, 5), `breaker (${stone.c},${stone.r})`).toBeNull();
    }
    for (const stone of [P(8, 8), P(2, 2)]) {
      const setup = { b: start.b, w: [...start.w, stone] };
      expect(ladder(setupToBoard(setup, 9), 5, 5), `off the path (${stone.c},${stone.r})`).not.toBeNull();
    }
  });

  it("shows the reader a genuine breaker in the broken position", () => {
    expect(at(setupToBoard(broken, 9), P(7, 7))).toBe("w");
    expect(ladder(setupToBoard(broken, 9), 5, 5)).toBeNull();
  });
});
