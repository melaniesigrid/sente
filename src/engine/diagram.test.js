import { describe, it, expect } from "vitest";
import {
  DEFAULT_PAD, boundsOf, boundsSize, inBounds, diagramOf, diagramAt, playOn,
  diagramToSgf, diagramFromSgf, readDiagram, sameDiagram, stoneCount, diagramCentre,
} from "./diagram.js";
import { createBoard, withStone, idx } from "./board.js";
import { createGame, play } from "./record.js";

const board = (size, stones = []) => {
  let b = createBoard(size);
  for (const [c, r, col] of stones) b = withStone(b, c, r, col);
  return b;
};

describe("boundsOf", () => {
  it("bounds the whole board when there are no stones", () => {
    expect(boundsOf(createBoard(9).cells, 9)).toEqual({ c0: 0, r0: 0, c1: 8, r1: 8 });
  });

  it("is inclusive: one stone with no padding is a single point", () => {
    const b = boundsOf(board(19, [[3, 3, "b"]]).cells, 19, 0);
    expect(b).toEqual({ c0: 3, r0: 3, c1: 3, r1: 3 });
    expect(boundsSize(b)).toEqual({ w: 1, h: 1 });
  });

  it("grows by pad and clips to the board", () => {
    // A stone on the 1-1 point cannot grow left or up.
    expect(boundsOf(board(9, [[0, 0, "b"]]).cells, 9, 2))
      .toEqual({ c0: 0, r0: 0, c1: 2, r1: 2 });
    // And one on the far corner cannot grow right or down.
    expect(boundsOf(board(9, [[8, 8, "w"]]).cells, 9, 2))
      .toEqual({ c0: 6, r0: 6, c1: 8, r1: 8 });
  });

  it("spans every stone, not just the first", () => {
    const cells = board(19, [[2, 2, "b"], [16, 3, "w"], [4, 15, "b"]]).cells;
    expect(boundsOf(cells, 19, 0)).toEqual({ c0: 2, r0: 2, c1: 16, r1: 15 });
  });

  it("treats nonsense padding as none rather than throwing", () => {
    const cells = board(9, [[4, 4, "b"]]).cells;
    expect(boundsOf(cells, 9, -3)).toEqual({ c0: 4, r0: 4, c1: 4, r1: 4 });
    expect(boundsOf(cells, 9, NaN)).toEqual({ c0: 4, r0: 4, c1: 4, r1: 4 });
  });
});

describe("diagramOf", () => {
  it("carries the whole board, not the crop", () => {
    const atom = diagramOf(board(19, [[3, 3, "b"]]), "w");
    expect(atom.cells).toHaveLength(19 * 19);
    expect(atom.size).toBe(19);
    expect(atom.toPlay).toBe("w");
    expect(atom.bounds).toEqual({ c0: 1, r0: 1, c1: 5, r1: 5 });
  });

  it("copies the cells so the source board cannot be mutated through it", () => {
    const src = board(9, [[4, 4, "b"]]);
    const atom = diagramOf(src);
    atom.cells[0] = "w";
    expect(src.cells[0]).toBe(null);
  });

  it("defaults a nonsense colour to black rather than storing it", () => {
    expect(diagramOf(board(9), "purple").toPlay).toBe("b");
  });
});

describe("playOn — the rules kernel decides, not the crop", () => {
  it("plays a stone and hands back the turn", () => {
    const atom = diagramOf(board(9), "b");
    const res = playOn(atom, 4, 4);
    expect(res.ok).toBe(true);
    expect(res.atom.cells[idx(9, 4, 4)]).toBe("b");
    expect(res.atom.toPlay).toBe("w");
  });

  it("refuses an occupied point in the kernel's own vocabulary", () => {
    const atom = diagramOf(board(9, [[4, 4, "b"]]), "w");
    expect(playOn(atom, 4, 4)).toEqual({ ok: false, reason: "occupied" });
  });

  it("refuses a point off the board", () => {
    expect(playOn(diagramOf(board(9)), 9, 0)).toEqual({ ok: false, reason: "offboard" });
  });

  it("captures, and the capture is reflected in the next atom", () => {
    // Black stone at 0,0 with its last liberty at 1,0 about to be filled.
    const atom = diagramOf(board(9, [[0, 0, "b"], [0, 1, "w"]]), "w");
    const res = playOn(atom, 1, 0);
    expect(res.ok).toBe(true);
    expect(res.atom.cells[idx(9, 0, 0)]).toBe(null);
    expect(res.captured).toEqual([[0, 0]]);
  });

  it("refuses suicide", () => {
    // White surrounded on every side: 1,0 / 0,1 are black, so 0,0 is death.
    const atom = diagramOf(board(9, [[1, 0, "b"], [0, 1, "b"]]), "w");
    expect(playOn(atom, 0, 0)).toEqual({ ok: false, reason: "suicide" });
  });

  /* THE POINT OF THE WHOLE FILE.
     A chain whose liberties are outside the crop must still be judged by
     those liberties. If the atom carried only the cropped rectangle, the
     black stone below would look surrounded and white's move would look like
     a capture. It is not: the chain runs out of the picture and breathes. */
  it("judges a chain by liberties OUTSIDE the crop", () => {
    // A black wall down column 4, rows 0 to 6. White presses both sides of
    // the top, leaving the chain exactly one liberty inside the crop: 5,2.
    const stones = [];
    for (let r = 0; r <= 6; r++) stones.push([4, r, "b"]);
    stones.push([3, 0, "w"], [5, 0, "w"], [3, 1, "w"], [5, 1, "w"], [3, 2, "w"]);
    const atom = { ...diagramOf(board(9, stones), "w"), bounds: { c0: 3, r0: 0, c1: 5, r1: 2 } };

    // Inside the crop, filling 5,2 takes black's last visible liberty and
    // looks exactly like a capture of three stones. It is not one: the chain
    // runs out of the picture to row 6 and breathes there.
    const res = playOn(atom, 5, 2);
    expect(res.ok).toBe(true);
    expect(res.captured).toEqual([]);
    for (let r = 0; r <= 6; r++) {
      expect(res.atom.cells[idx(9, 4, r)]).toBe("b");
    }
  });

  it("and captures the same shape when the chain really does end", () => {
    // The converse, so the test above is proving the kernel works rather than
    // proving playOn never captures anything. Same crop, same white move —
    // but black stops at row 2 and is sealed from below.
    const stones = [[4, 0, "b"], [4, 1, "b"], [4, 2, "b"],
      [3, 0, "w"], [5, 0, "w"], [3, 1, "w"], [5, 1, "w"], [3, 2, "w"], [4, 3, "w"]];
    const atom = { ...diagramOf(board(9, stones), "w"), bounds: { c0: 3, r0: 0, c1: 5, r1: 2 } };

    const res = playOn(atom, 5, 2);
    expect(res.ok).toBe(true);
    expect(res.captured).toHaveLength(3);
    for (let r = 0; r <= 2; r++) {
      expect(res.atom.cells[idx(9, 4, r)]).toBe(null);
    }
  });

  it("does not consult bounds when deciding legality", () => {
    const b = board(9, [[8, 8, "b"]]);
    // A crop that excludes the far corner entirely.
    const atom = { ...diagramOf(b, "w"), bounds: { c0: 0, r0: 0, c1: 2, r1: 2 } };
    // Playing on the occupied point outside the crop is still occupied.
    expect(playOn(atom, 8, 8)).toEqual({ ok: false, reason: "occupied" });
  });

  it("keeps the crop when the move lands inside it", () => {
    const atom = diagramOf(board(19, [[3, 3, "b"]]), "w");
    const before = atom.bounds;
    const res = playOn(atom, 3, 4);
    expect(res.atom.bounds).toEqual(before);
  });

  it("grows the crop to hold a move played outside it", () => {
    const atom = diagramOf(board(19, [[3, 3, "b"]]), "w");
    expect(inBounds(atom.bounds, 15, 15)).toBe(false);
    const res = playOn(atom, 15, 15);
    expect(inBounds(res.atom.bounds, 15, 15)).toBe(true);
    // And still holds what it held before.
    expect(inBounds(res.atom.bounds, 3, 3)).toBe(true);
  });

  it("plays for an explicit colour when asked, not only the one to move", () => {
    const atom = diagramOf(board(9), "b");
    const res = playOn(atom, 2, 2, "w");
    expect(res.atom.cells[idx(9, 2, 2)]).toBe("w");
    expect(res.atom.toPlay).toBe("b");
  });
});

describe("diagramAt", () => {
  const gameOfThree = () => {
    let g = createGame({ size: 9 });
    g = play(g, 2, 2);
    g = play(g, 6, 6);
    g = play(g, 2, 6);
    return g;
  };

  it("0 is the position before anybody moved", () => {
    const atom = diagramAt(gameOfThree(), 0);
    expect(stoneCount(atom)).toBe(0);
    expect(atom.toPlay).toBe("b");
  });

  it("counts moves, not indexes", () => {
    expect(stoneCount(diagramAt(gameOfThree(), 1))).toBe(1);
    expect(stoneCount(diagramAt(gameOfThree(), 3))).toBe(3);
  });

  it("defaults to the position now", () => {
    expect(stoneCount(diagramAt(gameOfThree()))).toBe(3);
  });

  it("clamps out of range rather than throwing", () => {
    expect(stoneCount(diagramAt(gameOfThree(), 99))).toBe(3);
    expect(stoneCount(diagramAt(gameOfThree(), -4))).toBe(0);
  });

  it("carries the turn from the position, not the caller", () => {
    expect(diagramAt(gameOfThree(), 1).toPlay).toBe("w");
    expect(diagramAt(gameOfThree(), 2).toPlay).toBe("b");
  });
});

describe("sgf round trip", () => {
  const atoms = [
    diagramOf(board(9), "b"),
    diagramOf(board(9, [[4, 4, "b"]]), "w"),
    diagramOf(board(13, [[2, 2, "b"], [3, 2, "w"], [2, 3, "w"]]), "b"),
    diagramOf(board(19, [[3, 3, "b"], [15, 15, "w"], [3, 15, "b"], [15, 3, "w"]]), "w"),
  ];

  it.each(atoms.map((a, i) => [i, a]))("round trips board and turn exactly (%i)", (_i, atom) => {
    const back = diagramFromSgf(diagramToSgf(atom));
    expect(back.size).toBe(atom.size);
    expect(back.toPlay).toBe(atom.toPlay);
    expect(back.cells).toEqual(atom.cells);
    expect(sameDiagram(back, atom)).toBe(true);
  });

  it("recomputes the crop rather than claiming SGF carried it", () => {
    // A hand-widened crop is NOT preserved — documented, and asserted so the
    // documentation cannot quietly stop being true.
    const atom = { ...diagramOf(board(9, [[4, 4, "b"]]), "b"), bounds: { c0: 0, r0: 0, c1: 8, r1: 8 } };
    const back = diagramFromSgf(diagramToSgf(atom));
    expect(back.bounds).toEqual(boundsOf(atom.cells, 9, DEFAULT_PAD));
    expect(back.bounds).not.toEqual(atom.bounds);
  });

  it("writes PL so the turn is not lost to a parser that ignores it", () => {
    expect(diagramToSgf(diagramOf(board(9), "w"))).toContain("PL[W]");
    expect(diagramToSgf(diagramOf(board(9), "b"))).toContain("PL[B]");
  });
});

describe("readDiagram — stored JSON is untrusted", () => {
  const good = diagramOf(board(9, [[4, 4, "b"]]), "w");

  it("reads one back", () => {
    expect(sameDiagram(readDiagram(JSON.parse(JSON.stringify(good))), good)).toBe(true);
  });

  it.each([
    ["not an object", 7],
    ["null", null],
    ["a board size the app does not play", { ...good, size: 11 }],
    ["the wrong number of cells", { ...good, cells: good.cells.slice(0, 10) }],
    ["cells that are not an array", { ...good, cells: "bbbb" }],
  ])("refuses %s", (_name, raw) => {
    expect(readDiagram(raw)).toBe(null);
  });

  it("scrubs a colour that is not b or w rather than storing it", () => {
    const raw = { ...good, cells: good.cells.map((v, i) => (i === 0 ? "purple" : v)) };
    expect(readDiagram(raw).cells[0]).toBe(null);
  });

  it("replaces a crop outside the board with a computed one", () => {
    const raw = { ...good, bounds: { c0: 0, r0: 0, c1: 99, r1: 99 } };
    expect(readDiagram(raw).bounds).toEqual(boundsOf(good.cells, 9));
  });

  it("replaces an inside-out crop with a computed one", () => {
    const raw = { ...good, bounds: { c0: 5, r0: 5, c1: 1, r1: 1 } };
    expect(readDiagram(raw).bounds).toEqual(boundsOf(good.cells, 9));
  });
});

describe("helpers", () => {
  it("counts stones", () => {
    expect(stoneCount(diagramOf(board(9)))).toBe(0);
    expect(stoneCount(diagramOf(board(9, [[1, 1, "b"], [2, 2, "w"]])))).toBe(2);
  });

  it("names the middle of the crop", () => {
    const atom = diagramOf(board(19, [[3, 3, "b"]]), "b");
    expect(diagramCentre(atom)).toEqual([3, 3]);
  });

  it("sameDiagram ignores the crop and respects the turn", () => {
    const a = diagramOf(board(9, [[4, 4, "b"]]), "b");
    const wideCrop = { ...a, bounds: { c0: 0, r0: 0, c1: 8, r1: 8 } };
    expect(sameDiagram(a, wideCrop)).toBe(true);
    expect(sameDiagram(a, { ...a, toPlay: "w" })).toBe(false);
  });
});
