import { describe, it, expect } from "vitest";
import { tryPlay, chainAt, idx, opponent } from "../engine/index.js";
import { PROBLEMS } from "./problems.js";
import { setupToBoard } from "./positions.js";
import { rankToNumber } from "./library.js";

/* The lessons have had a verifier since the library shipped and the problems
   never did, which is backwards: a problem is a claim that one move is the
   answer, and that is the most checkable claim in the file. This closes it.

   Every problem is checked for the things that hold of all of them (a legal
   setup, a legal answer, a parsing rank) and the life-and-death ones are
   searched exhaustively: the stated answer must kill, and no other point in the
   eye space may. If somebody adds a second vital point by accident, this fails. */

const SIZE = 9;
const P = (c, r) => ({ c, r });
const at = (board, p) => board.cells[idx(board.size, p.c, p.r)];

function legalPosition(board) {
  for (let r = 0; r < board.size; r++) for (let c = 0; c < board.size; c++) {
    if (board.cells[idx(board.size, c, r)] === null) continue;
    if (chainAt(board, c, r).libs.size === 0) return `chain at (${c},${r}) has no liberties`;
  }
  return null;
}

/** Every empty point the two colours enclose around `space`'s group: the region
 *  a life-and-death search is allowed to play in. */
function eyeSpace(board, seed) {
  const out = [], seen = new Set(), stack = [seed];
  while (stack.length) {
    const p = stack.pop(), k = `${p.c},${p.r}`;
    if (seen.has(k) || !(p.c >= 0 && p.r >= 0 && p.c < board.size && p.r < board.size)) continue;
    seen.add(k);
    if (at(board, p) !== null) continue;
    out.push(p);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) stack.push(P(p.c + dc, p.r + dr));
  }
  return out;
}

/** Can `owner` keep the stone at `target` on the board, playing only inside
 *  `space`? Passes are allowed both ways and a repeated position counts as
 *  survival, so the search is generous to the defender. No ko arises in these. */
function lives(board, target, owner, space, toPlay, seen = new Set(), depth = 0) {
  const key = board.cells.map(v => (v === "b" ? "1" : v === "w" ? "2" : "0")).join("") + toPlay;
  if (seen.has(key) || depth > 20) return true;
  if (at(board, target) !== owner) return false;
  const next = new Set(seen).add(key);
  const tries = [];
  for (const m of space) {
    if (at(board, m) !== null) continue;
    const res = tryPlay(board, m.c, m.r, toPlay);
    if (res.ok) tries.push(res.board);
  }
  const other = opponent(toPlay);
  if (toPlay === owner) {
    return tries.some(b => lives(b, target, owner, space, other, next, depth + 1))
      || lives(board, target, owner, space, other, next, depth + 1);
  }
  return !tries.some(b => !lives(b, target, owner, space, other, next, depth + 1));
}

describe("the problem set", () => {
  it("has unique ids in a sensible order", () => {
    const ids = PROBLEMS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PROBLEMS.length).toBeGreaterThanOrEqual(12);
  });
  it("gets harder as it goes", () => {
    const ranks = PROBLEMS.map(p => rankToNumber(p.rank));
    expect(ranks.every(Number.isFinite)).toBe(true);
    expect(ranks[ranks.length - 1]).toBeGreaterThan(ranks[0]);
  });
});

describe.each(PROBLEMS.map(p => [p.id, p]))("problem %s", (id, prob) => {
  const board = setupToBoard(prob.setup, SIZE);

  it("has a title, a prompt and an explanation, in the house voice", () => {
    for (const k of ["title", "prompt", "explain", "theme"]) expect(prob[k], k).toBeTruthy();
    for (const k of ["prompt", "explain"]) expect(prob[k], prob[k]).not.toMatch(/!/);
  });
  it("sets up a legal position", () => {
    expect(legalPosition(board)).toBeNull();
  });
  it("has at least one answer, and every answer is an empty point and a legal move", () => {
    expect(prob.answers.length).toBeGreaterThan(0);
    for (const a of prob.answers) {
      expect(at(board, a), `(${a.c},${a.r}) is occupied`).toBeNull();
      const res = tryPlay(board, a.c, a.r, prob.toPlay);
      expect(res.ok, `(${a.c},${a.r}): ${res.reason}`).toBe(true);
    }
  });
});

/* The three classical shapes, searched out. `target` is a stone of the group
   whose life is in question and `seed` an empty point inside its eye space. */
const KILLS = [
  { id: "p7", target: P(3, 0), seed: P(0, 0) },
  { id: "p8", target: P(3, 0), seed: P(1, 1) },
  { id: "p9", target: P(3, 0), seed: P(0, 0) },
];

describe.each(KILLS.map(k => [k.id, k]))("the vital point of %s", (id, k) => {
  const prob = PROBLEMS.find(p => p.id === id);
  const board = setupToBoard(prob.setup, SIZE);
  const space = eyeSpace(board, k.seed);

  it("encloses a group with no liberties outside the eye space", () => {
    expect(at(board, k.target)).toBe("w");
    expect(chainAt(board, k.target.c, k.target.r).libs.size)
      .toBe(space.filter(p => chainAt(board, k.target.c, k.target.r).libs.has(idx(SIZE, p.c, p.r))).length);
  });
  it("lives if the defender moves first", () => {
    expect(lives(board, k.target, "w", space, "w")).toBe(true);
  });
  it("dies to the stated answer and to no other point in the space", () => {
    const killers = space.filter(m => {
      const res = tryPlay(board, m.c, m.r, "b");
      return res.ok && !lives(res.board, k.target, "w", space, "w");
    });
    expect(killers.map(p => `${p.c},${p.r}`))
      .toEqual(prob.answers.map(p => `${p.c},${p.r}`));
  });
});
