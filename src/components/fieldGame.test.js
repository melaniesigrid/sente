import { describe, it, expect } from "vitest";
import {
  FIELD_N, SETTLED, LONGEST, freshField, stepField, advanceField, fieldSpent, fieldStones,
  departed,
} from "./fieldGame.js";
import { createBoard, withStone, tryPlay } from "../engine/index.js";

describe("the field's game", () => {
  it("deals an empty board of the size the page is about", () => {
    const s = freshField();
    expect(s.board.size).toBe(FIELD_N);
    expect(s.board.cells.every(c => c === null)).toBe(true);
    expect(s.turn).toBe("b");
  });

  it("puts a stone down and hands the turn over", () => {
    const s = stepField(freshField());
    expect(s.n).toBe(1);
    expect(s.turn).toBe("w");
    expect(fieldStones(s.board).length).toBe(1);
  });

  it("settles into a position with both colours on it", () => {
    const s = advanceField(freshField(), SETTLED);
    expect(s.n).toBe(SETTLED);
    const stones = fieldStones(s.board);
    expect(stones.some(p => p.colour === "b")).toBe(true);
    expect(stones.some(p => p.colour === "w")).toBe(true);
    // Captures mean stones on the board can be fewer than moves played, never more.
    expect(stones.length).toBeLessThanOrEqual(SETTLED);
    expect(stones.length).toBeGreaterThan(SETTLED / 2);
  });

  it("reports where every stone is, and nothing about the empty points", () => {
    const s = advanceField(freshField(), 12);
    for (const p of fieldStones(s.board)) {
      expect(s.board.cells[p.i]).toBe(p.colour);
      expect(p.i).toBe(p.r * FIELD_N + p.c);
    }
    expect(fieldStones(s.board).length).toBe(s.board.cells.filter(Boolean).length);
  });

  it("calls a game spent rather than letting it spin", () => {
    expect(fieldSpent(freshField())).toBe(false);
    expect(fieldSpent({ ...freshField(), passes: 2 })).toBe(true);
    expect(fieldSpent({ ...freshField(), n: LONGEST })).toBe(true);
  });

  // The whole point of advancing in chunks is that a chunk is bounded work.
  // A spent game must stop the walk rather than burn the rest of the budget.
  it("stops early once the game is spent", () => {
    const spent = { ...freshField(), passes: 2 };
    expect(advanceField(spent, 500)).toBe(spent);
  });
});

/** A board with these stones on it and nothing else. */
const board = (...stones) => {
  let b = createBoard(FIELD_N);
  for (const [c, r, colour] of stones) b = withStone(b, c, r, colour);
  return b;
};

describe("what came off the board", () => {
  it("names the stone that is gone, and nothing else", () => {
    const before = board([3, 3, "b"], [4, 3, "w"], [5, 5, "b"]);
    const after = board([3, 3, "b"], [5, 5, "b"]);
    expect(departed(before, after)).toEqual([
      { i: 3 * FIELD_N + 4, c: 4, r: 3, colour: "w" },
    ]);
  });

  it("says nothing when a stone is only added", () => {
    const before = board([3, 3, "b"]);
    const after = board([3, 3, "b"], [4, 3, "w"]);
    expect(departed(before, after)).toEqual([]);
    expect(departed(before, before)).toEqual([]);
  });

  it("counts a point that changed hands, because a stone did come off it", () => {
    const before = board([3, 3, "b"]);
    const after = board([3, 3, "w"]);
    expect(departed(before, after)).toEqual([
      { i: 3 * FIELD_N + 3, c: 3, r: 3, colour: "b" },
    ]);
  });

  it("finds every stone of a captured group", () => {
    const before = board([3, 3, "w"], [4, 3, "w"], [5, 3, "w"], [9, 9, "b"]);
    const after = board([9, 9, "b"]);
    expect(departed(before, after).map(s => s.c)).toEqual([3, 4, 5]);
    expect(departed(before, after).every(s => s.colour === "w")).toBe(true);
  });

  it("answers rather than throws when it is handed nothing usable", () => {
    expect(departed(null, board())).toEqual([]);
    expect(departed(board(), null)).toEqual([]);
    expect(departed(createBoard(9), createBoard(13))).toEqual([]);
  });

  it("agrees with a capture the engine actually made", () => {
    // Black surrounds a white stone on the edge and takes it.
    const before = board([0, 0, "w"], [1, 0, "b"]);
    const after = board([1, 0, "b"], [0, 1, "b"]);
    const gone = departed(before, after);
    expect(gone.length).toBe(1);
    expect(gone[0]).toMatchObject({ c: 0, r: 0, colour: "w" });
  });
});

describe("what came off the board, in the order the field draws it", () => {
  // The field draws the departing stones before it draws the standing ones, so
  // the order this comes back in is the order they are painted in. Board order
  // is the only order that cannot surprise: it is the order every other list
  // on a board is in, and it keeps a render stable between two ticks.
  it("names them in board order, whatever order they were played in", () => {
    const before = board([9, 9, "b"], [1, 1, "b"], [5, 2, "b"]);
    const after = board();
    expect(departed(before, after).map(s => s.i)).toEqual(
      [...departed(before, after)].map(s => s.i).sort((a, b2) => a - b2),
    );
    expect(departed(before, after).map(s => [s.c, s.r])).toEqual([[1, 1], [5, 2], [9, 9]]);
  });

  // The column and the row are worked out from the index, so the far corner is
  // the one that catches an off-by-one: on a 19 the last point is 18, 18, and
  // an index read against the wrong size lands nowhere near it.
  it("places the last point on the board at the far corner", () => {
    const before = board([FIELD_N - 1, FIELD_N - 1, "w"]);
    expect(departed(before, board())).toEqual([
      { i: FIELD_N * FIELD_N - 1, c: FIELD_N - 1, r: FIELD_N - 1, colour: "w" },
    ]);
  });

  it("says nothing about two empty boards", () => {
    expect(departed(board(), board())).toEqual([]);
  });

  // This is the whole reason StoneField passes an empty list when it deals a
  // fresh game rather than asking this. Two positions that are not one move
  // apart are not a capture: handed the old game and the new one, this
  // truthfully reports sixty stones leaving at once, which on screen is every
  // stone on the board lifting off together. The guard belongs at the call.
  it("reports a whole position leaving when it is handed two unrelated games", () => {
    /* Built rather than played. Two self-played games would make this true
       almost always, which is the worst kind of test: it passes here and fails
       once, on a machine that is not this one, for a reason nobody can
       reproduce. `stepField` takes its move from an unseeded Math.random. */
    const settled = board(...Array.from({ length: 20 }, (_, i) => [i % 19, Math.floor(i / 19), i % 2 ? "b" : "w"]));
    const dealt = board([18, 18, "b"]);
    expect(departed(settled, dealt).length).toBe(20);
  });

  // A capture and the move that follows it into the same point are two stones
  // on one index, and the field keys the departing one apart for exactly this
  // reason: an index that is in both lists at once would otherwise be one key
  // used twice in a single render.
  it("can name a point that the position it is compared against still has a stone on", () => {
    const before = board([3, 3, "b"]);
    const after = board([3, 3, "w"]);
    const goneAt = departed(before, after).map(s => s.i);
    const standingAt = fieldStones(after).map(s => s.i);
    expect(goneAt).toEqual([3 * FIELD_N + 3]);
    expect(standingAt).toContain(goneAt[0]);
  });

  // The engine playing itself is the only caller there is, so the claim is put
  // to a real game rather than to three hand-set stones: over a whole position,
  // every stone this names was on the board before the move and is not the same
  // stone after it, and nothing that left is missed.
  it("agrees with the engine over a whole game it plays itself", () => {
    let s = freshField(), captures = 0, beats = 0;
    for (let n = 0; n < LONGEST && !fieldSpent(s); n++) {
      const before = s.board;
      s = stepField(s);
      const gone = departed(before, s.board);
      for (const g of gone) {
        expect(before.cells[g.i]).toBe(g.colour);
        expect(s.board.cells[g.i]).not.toBe(g.colour);
      }
      const lost = before.cells.filter((c, i) => c && s.board.cells[i] !== c).length;
      expect(gone.length).toBe(lost);
      if (gone.length) captures++;
      if (lost) beats++;
    }
    /* Not `>= 0`, which a counter cannot fail. A `departed` stubbed out to
       return nothing would satisfy that and nothing else here would notice:
       the per-move checks above are all vacuously true over an empty list. */
    expect(captures, "every beat that lost a stone is a beat departed named").toBe(beats);
  });

  // And against a capture the engine performs through `tryPlay`, which is the
  // path the field itself goes down. The self-played game above can run its
  // whole length without taking a stone off -- these two AIs rarely fight --
  // so the capture is set up here rather than waited for.
  it("names the stone a tryPlay capture took off", () => {
    const before = board([0, 0, "w"], [1, 0, "b"]);
    const res = tryPlay(before, 0, 1, "b");
    expect(res.ok).toBe(true);
    expect(departed(before, res.board)).toEqual([
      { i: 0, c: 0, r: 0, colour: "w" },
    ]);
    // and the move that was played is an arrival, not a departure
    expect(departed(before, res.board).some(s => s.c === 0 && s.r === 1)).toBe(false);
  });
});
