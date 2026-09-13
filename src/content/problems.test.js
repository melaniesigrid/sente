import { describe, it, expect } from "vitest";
import { tryPlay, chainAt, idx } from "../engine/index.js";
import {
  PROBLEMS, SETS, setById, problemsInSet, setProgress, currentSet, setsComplete, nextProblem,
} from "./problems.js";
import { setupToBoard } from "./positions.js";
import { rankToNumber, TRACKS } from "./library.js";
import {
  board, legal, bounded, killers, savers, koOnlyKillers, enclosed, at, fmt, P,
} from "../../tools/problems/prove.mjs";

/* The lessons have had a verifier since the library shipped and the problems
   never did, which is backwards: a problem is a claim that one move is the
   answer, and that is the most checkable claim in the repo. This closes it.

   Every problem is checked for the things that hold of all of them (a legal
   setup, a legal answer, a parsing rank, a set it belongs to). Every problem
   whose group is enclosed in a small space is then searched exhaustively by
   `tools/problems/prove.mjs`: the stated answers have to be EXACTLY the moves
   that work, so a second vital point added by accident fails the build rather
   than telling a learner their correct move was wrong.

   The prover finds the group itself (`bounded`) instead of reading a hand-kept
   table of targets and seeds. A board that grows an outside liberty, or whose
   eye space grows past what the search can honestly cover, stops being proved
   and says so here rather than going quiet. */

const SIZE = 9;
const cell = (b, p) => b.cells[idx(b.size, p.c, p.r)];

describe("the problem set", () => {
  it("has unique ids in a sensible order", () => {
    const ids = PROBLEMS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PROBLEMS.length).toBeGreaterThanOrEqual(16);
  });

  it("gets harder as it goes", () => {
    const ranks = PROBLEMS.map(p => rankToNumber(p.rank));
    expect(ranks.every(Number.isFinite)).toBe(true);
    expect(ranks[ranks.length - 1]).toBeGreaterThan(ranks[0]);
  });
});

describe("the sets", () => {
  it("have unique ids and name a track the library knows", () => {
    const ids = SETS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SETS) {
      expect(TRACKS.map(t => t.key), s.id).toContain(s.track);
      expect(s.name, s.id).toBeTruthy();
      expect(s.blurb, s.id).toBeTruthy();
      expect(s.blurb, s.id).not.toMatch(/!/);
    }
  });

  it("account for every problem, and none of them is empty", () => {
    for (const p of PROBLEMS) expect(setById(p.set), p.id).toBeTruthy();
    for (const s of SETS) expect(problemsInSet(s.id).length, s.id).toBeGreaterThan(2);
  });

  /* A set is read top to bottom, so the file has to be written that way: the
     tab strip is the array, and a problem filed out of order would show up in
     somebody else's section. */
  it("hold their problems together, in the order the sets are declared", () => {
    const order = PROBLEMS.map(p => SETS.findIndex(s => s.id === p.set));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("climb within themselves", () => {
    for (const s of SETS) {
      const ranks = problemsInSet(s.id).map(p => rankToNumber(p.rank));
      expect(ranks, s.id).toEqual([...ranks].sort((a, b) => a - b));
    }
  });
});

/* Where a reader is, which is what the dashboard tile and the set headings
   both draw. Pure functions over the list of solved ids, so they are checked
   at the ends: nothing solved, one set solved, everything solved. */
describe("progress through the sets", () => {
  const all = PROBLEMS.map(p => p.id);
  const firstSet = problemsInSet(SETS[0].id).map(p => p.id);

  it("counts a set, and calls it complete only when every board in it is solved", () => {
    const empty = setProgress(SETS[0].id, []);
    expect(empty.solved).toBe(0);
    expect(empty.total).toBe(firstSet.length);
    expect(empty.complete).toBe(false);
    expect(setProgress(SETS[0].id, firstSet.slice(0, -1)).complete).toBe(false);
    expect(setProgress(SETS[0].id, firstSet).complete).toBe(true);
    // An id from another set does not count towards this one.
    expect(setProgress(SETS[1].id, firstSet).solved).toBe(0);
  });

  it("names the set in front of the reader, and never sends a finisher back", () => {
    expect(currentSet([]).id).toBe(SETS[0].id);
    expect(currentSet(firstSet).id).toBe(SETS[1].id);
    /* Everything solved: the last set, not the first. A dashboard that told a
       reader who has finished the collection to start again would be lying
       about what is left. */
    expect(currentSet(all).id).toBe(SETS[SETS.length - 1].id);
  });

  it("lists the finished sets in the order they are declared", () => {
    expect(setsComplete([])).toEqual([]);
    expect(setsComplete(firstSet).map(s => s.id)).toEqual([SETS[0].id]);
    expect(setsComplete(all).map(s => s.id)).toEqual(SETS.map(s => s.id));
  });

  it("opens on the first board still open, and on the last one when none are", () => {
    expect(nextProblem([]).id).toBe(PROBLEMS[0].id);
    expect(nextProblem([PROBLEMS[0].id]).id).toBe(PROBLEMS[1].id);
    /* A set finished sends the reader into the next set rather than to the
       first gap in the array, which may be behind them. */
    expect(nextProblem(firstSet).set).toBe(SETS[1].id);
    expect(nextProblem(all).id).toBe(PROBLEMS[PROBLEMS.length - 1].id);
  });

  it("survives an id nobody recognises", () => {
    expect(setProgress("nowhere", all)).toEqual({ total: 0, solved: 0, complete: false });
    expect(currentSet(["not-a-problem"]).id).toBe(SETS[0].id);
  });
});

describe.each(PROBLEMS.map(p => [p.id, p]))("problem %s", (id, prob) => {
  const bd = setupToBoard(prob.setup, SIZE);

  it("has a title, a prompt and an explanation, in the house voice", () => {
    for (const k of ["title", "prompt", "explain", "theme"]) expect(prob[k], k).toBeTruthy();
    for (const k of ["prompt", "explain"]) expect(prob[k], prob[k]).not.toMatch(/!/);
  });

  it("sets up a legal position", () => {
    expect(legal(bd)).toBeNull();
  });

  it("has at least one answer, and every answer is an empty point and a legal move", () => {
    expect(prob.answers.length).toBeGreaterThan(0);
    for (const a of [...prob.answers, ...(prob.koAnswers || [])]) {
      expect(cell(bd, a), `(${a.c},${a.r}) is occupied`).toBeNull();
      const res = tryPlay(bd, a.c, a.r, prob.toPlay);
      expect(res.ok, `(${a.c},${a.r}): ${res.reason}`).toBe(true);
    }
  });

  it("says why, if it accepts a move that only works because of a ko", () => {
    if (prob.koAnswers) {
      expect(prob.koNote, prob.id).toBeTruthy();
      expect(prob.koNote, prob.id).not.toMatch(/!/);
    }
    /* A verdict that rests on a ko has to say the word somewhere a reader
       will meet it, or the board is claiming a clean kill it has not got. */
    if (prob.koVerdict) expect(prob.explain, prob.id).toMatch(/\bko\b/);
  });
});

/* ----------------------- CAPTURE AND ESCAPE -----------------------
   These boards are not bounded spaces and the life-and-death search would
   never finish on them, but their claims are just as checkable and cheaper:
   a capture either comes off the board on the stated move or it does not, and
   a rescue either leaves the chain breathing or it does not. Both are checked
   against every other point on the board, so "the answer" means the only one. */
const captures = (bd, p, colour) => {
  const res = tryPlay(bd, p.c, p.r, colour);
  return res.ok && res.captured.length > 0 ? res.captured.length : 0;
};

describe.each(PROBLEMS.filter(p => p.theme === "Capture").map(p => [p.id, p]))(
  "the capture on %s", (id, prob) => {
    const bd = setupToBoard(prob.setup, SIZE);
    it("takes stones off on the stated move, and on no other point", () => {
      const taking = [];
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        if (captures(bd, P(c, r), prob.toPlay)) taking.push(P(c, r));
      }
      expect(fmt(taking)).toBe(fmt(prob.answers));
    });
  });

describe.each(PROBLEMS.filter(p => p.theme === "Escape").map(p => [p.id, p]))(
  "the escape on %s", (id, prob) => {
    const bd = setupToBoard(prob.setup, SIZE);
    it("is the only move that leaves the group breathing", () => {
      const inAtari = prob.setup[prob.toPlay]
        .filter(p => chainAt(bd, p.c, p.r).libs.size === 1);
      expect(inAtari.length, "something has to be in atari").toBeGreaterThan(0);
      const saving = [];
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        const res = tryPlay(bd, c, r, prob.toPlay);
        if (!res.ok) continue;
        const still = inAtari.filter(p => cell(res.board, p) === prob.toPlay);
        if (still.length && still.every(p => chainAt(res.board, p.c, p.r).libs.size > 2)) {
          saving.push(P(c, r));
        }
      }
      expect(fmt(saving)).toBe(fmt(prob.answers));
    });
  });

/* ----------------------- THE SEARCH -----------------------
   Every board with an enclosed group, solved. Where the group belongs to the
   player to move the problem is a living problem and its answers must be the
   saving points; every other one is a kill, and its answers must be the
   killing points, with any move that kills only through a ko listed
   separately and explained. */
const SEARCHED = PROBLEMS
  .map(p => [p.id, p, bounded(setupToBoard(p.setup, SIZE))])
  .filter(([, , found]) => found !== null);

describe("the life and death boards", () => {
  it("are every board whose group is enclosed, and there are plenty of them", () => {
    expect(SEARCHED.length).toBeGreaterThanOrEqual(9);
    /* A board themed life and death that the prover cannot find a bounded
       group in is either mis-drawn or too big to be quoting a verdict from. */
    const unproved = PROBLEMS
      .filter(p => p.theme === "Life & Death" && !SEARCHED.some(([id]) => id === p.id))
      .map(p => p.id);
    expect(unproved).toEqual([]);
  });
});

describe.each(SEARCHED)("the search on %s", (id, prob, found) => {
  const bd = setupToBoard(prob.setup, SIZE);
  const { target, owner, region } = found;
  const defending = owner === prob.toPlay;

  it("encloses one group, with every liberty inside the eye space", () => {
    expect(cell(bd, target)).toBe(owner);
    expect(region.length).toBeGreaterThan(2);
  });

  it(defending ? "lives to the stated answer and to nothing else"
    : "dies to the stated answer and to nothing else", () => {
    const answers = fmt([...prob.answers, ...(prob.koAnswers || [])]);
    const moves = defending
      ? savers(bd, target, region, owner)
      : killers(bd, target, region, prob.toPlay);
    expect(fmt(moves)).toBe(answers);
  });

  /* A verdict that changes when the ko rule is switched off was resting on a
     ko. Either the board declares that move as a ko answer, or the board says
     in its explanation that the kill itself is a ko kill. What it may not do
     is stay quiet: an undeclared ko is a lie about how clean the answer is. */
  it("declares every point that kills only because of a ko", () => {
    if (defending) return;
    const koOnly = koOnlyKillers(bd, target, region, prob.toPlay);
    const declared = [...(prob.koAnswers || []), ...(prob.koVerdict ? prob.answers : [])];
    expect(fmt(koOnly), `${id}: undeclared ko in the killing line`).toBe(fmt(declared));
  });
});

/* ----------------------- THE CLAIM p15 MAKES -----------------------
   "The same bend out on the edge is alive." A sentence the engine could check
   and nobody checked is the failure this whole file exists to stop, so it is
   checked: the identical four-point bend, walled in the same way two lines off
   the corner, has two living points and no killing one. The position came out
   of `node tools/problems/shapes.mjs edge 4`. */
const BEND_ON_THE_EDGE = {
  w: [P(1, 0), P(1, 1), P(2, 1), P(3, 1), P(5, 0), P(5, 1), P(3, 2), P(4, 2), P(5, 2)],
  b: [P(0, 0), P(0, 1), P(0, 2), P(1, 2), P(2, 2), P(6, 0), P(6, 1), P(6, 2),
    P(2, 3), P(3, 3), P(4, 3), P(5, 3), P(6, 3)],
};

describe("the bend that lives on the edge", () => {
  const bd = board(BEND_ON_THE_EDGE, SIZE);
  const target = P(1, 0);
  const region = enclosed(bd, P(2, 0));

  it("is the same four points, walled in the same way", () => {
    expect(legal(bd)).toBeNull();
    expect(at(bd, target)).toBe("w");
    expect(region.length).toBe(4);
  });

  it("has no killing point at all, which is what the corner board contrasts with", () => {
    expect(fmt(killers(bd, target, region, "b"))).toBe("");
    expect(savers(bd, target, region, "w").length).toBe(2);
  });
});
