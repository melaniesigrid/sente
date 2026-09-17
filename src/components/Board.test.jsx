// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { Board } from "./Board.jsx";
import { createBoard, withStone, pointLabel } from "../engine/index.js";
import { boardSpan } from "./boardGeometry.js";

/* ----------------------- THE STAGED STONE -----------------------
   A staged move is the one thing on this board that is drawn but has not
   happened. Reading the source cannot tell you that, so this asks the DOM
   three questions the source answers ambiguously: whether anything landed,
   whether the point says out loud that it is waiting, and whether the hover
   ghost is still underneath it pretending to be a second stone. */

afterEach(cleanup);

const empty = createBoard(9);
const staged = { c: 2, r: 6, color: "b" };
const stagedLabel = `${pointLabel(9, 2, 6)}, move waiting to be confirmed`;

describe("a move staged but not yet played", () => {
  it("draws the stone without putting it on the board", () => {
    const { container } = render(<Board board={empty} pending={staged} />);
    const g = container.querySelector(".stone-staged");
    expect(g, "the staged stone is drawn").not.toBeNull();
    expect(g.querySelector(".stone-b"), "and drawn in the colour to play").not.toBeNull();
    // Nothing has landed: a stone on the board is drawn by the cells, and there are none.
    expect(container.querySelectorAll(".stone-in, .stone-pop").length).toBe(0);
  });

  it("says at the point itself that the move is waiting", () => {
    render(<Board board={empty} pending={staged} />);
    expect(screen.getByLabelText(stagedLabel)).toBeTruthy();
    // The neighbouring point is an ordinary empty point and says nothing extra.
    expect(screen.getByLabelText(pointLabel(9, 3, 6))).toBeTruthy();
  });

  it("does not also draw a hover ghost under the staged stone", () => {
    const { container } = render(<Board board={empty} pending={staged} />);
    fireEvent.mouseEnter(screen.getByLabelText(stagedLabel));
    expect(container.querySelector(".ghost"), "the staged point already shows a stone").toBeNull();
    fireEvent.mouseEnter(screen.getByLabelText(pointLabel(9, 3, 6)));
    expect(container.querySelector(".ghost"), "every other empty point still ghosts").not.toBeNull();
  });

  it("is told apart from the stones that really are on the board", () => {
    const played = withStone(empty, 4, 4, "w");
    const { container } = render(<Board board={played} pending={staged} />);
    expect(container.querySelectorAll(".stone-w").length, "one white stone, really played").toBe(1);
    expect(container.querySelectorAll(".stone-staged .stone-b").length, "one black stone, only staged").toBe(1);
  });

  it("draws nothing extra when no move is staged", () => {
    const { container } = render(<Board board={empty} />);
    expect(container.querySelector(".stone-staged")).toBeNull();
    expect(screen.getByLabelText(pointLabel(9, 2, 6))).toBeTruthy();
  });
});

/* ----------------------- HOW A STONE IS DRAWN -----------------------
   The board draws its stones flat (design pass, 2026-09-15): a disc of the
   set's body, one hard shine on the black, a rim on the white, and no cast
   shadow. The stylesheet fills them; what the DOM has to say is which discs
   exist, where the shine sits, and that no gradient survived the change. A
   screenshot would show all of this, and a screenshot is not run on every
   commit. */
describe("how a stone is drawn", () => {
  const both = withStone(withStone(empty, 2, 2, "b"), 6, 6, "w");
  const n = (el, a) => Number(el.getAttribute(a));

  it("gives the black stone one shine and the white stone none", () => {
    const { container } = render(<Board board={both} />);
    expect(container.querySelectorAll(".stone-b").length).toBe(1);
    expect(container.querySelectorAll(".stone-w").length).toBe(1);
    expect(container.querySelectorAll(".stone-gloss").length, "one shine, on the black").toBe(1);
    const white = container.querySelector(".stone-w").parentElement;
    expect(white.querySelector(".stone-gloss"), "the white stone is held off the wood by its rim").toBeNull();
  });

  it("sets the shine high on the left shoulder, inside the disc", () => {
    const { container } = render(<Board board={both} />);
    const body = container.querySelector(".stone-b");
    const gloss = container.querySelector(".stone-gloss");
    expect(n(gloss, "cx")).toBeLessThan(n(body, "cx"));
    expect(n(gloss, "cy")).toBeLessThan(n(body, "cy"));
    const off = Math.hypot(n(body, "cx") - n(gloss, "cx"), n(body, "cy") - n(gloss, "cy"));
    expect(off + n(gloss, "r"), "a shine that spills past the rim is a second stone").toBeLessThan(n(body, "r"));
  });

  it("paints no gradient and names no fill of its own", () => {
    const { container } = render(<Board board={both} pending={staged} />);
    expect(container.querySelector("defs, radialGradient"), "the gradients left with the shadows").toBeNull();
    for (const c of container.querySelectorAll(".stone-b, .stone-w, .stone-gloss")) {
      expect(c.getAttribute("fill"), "the colour is the room's, from the stylesheet").toBeNull();
    }
  });

  it("draws the staged stone the same way, in either colour", () => {
    const { container } = render(<Board board={empty} pending={staged} />);
    expect(container.querySelectorAll(".stone-staged .stone-gloss").length).toBe(1);
    cleanup();
    const { container: w } = render(<Board board={empty} pending={{ ...staged, color: "w" }} />);
    expect(w.querySelectorAll(".stone-staged .stone-w").length).toBe(1);
    expect(w.querySelector(".stone-staged .stone-gloss")).toBeNull();
  });
});

/* The wood is the board's, not the well's: the well is the page the board is
   set on. So the rect is drawn first, under everything, and it is the whole
   board even when the viewBox shows a corner of it. */
describe("the wood", () => {
  it("is the first thing drawn, and is the whole board", () => {
    const { container } = render(<Board board={empty} />);
    const svg = container.querySelector("svg.goban");
    const wood = svg.firstElementChild;
    expect(wood.classList.contains("wood"), "under everything").toBe(true);
    expect(Number(wood.getAttribute("width"))).toBe(boardSpan(9));
    expect(Number(wood.getAttribute("height"))).toBe(boardSpan(9));
  });

  it("stays the whole board when the view is cropped to a corner", () => {
    const { container } = render(<Board board={empty} crop={{ c0: 0, r0: 0, c1: 4, r1: 4 }} />);
    const svg = container.querySelector("svg.goban");
    const [, , vw] = svg.getAttribute("viewBox").split(" ").map(Number);
    expect(vw, "the view is a corner").toBeLessThan(boardSpan(9));
    expect(Number(svg.querySelector(".wood").getAttribute("width")), "the rect is the board, not the view").toBe(boardSpan(9));
  });
});

/* ----------------------- A NAMED POINT -----------------------
   `labels` is for a figure that has to talk about two points after drawing
   them, which is a different job from `numbers`: numbers name stones that were
   played, and a label names an empty point nobody has played yet. The rule is
   in the component rather than in the caller, so it is asked here. */
describe("a point named on the board", () => {
  it("prints the letter on the empty point it names", () => {
    const { container } = render(<Board board={empty} labels={[{ c: 2, r: 3, text: "A" }]} />);
    const marks = container.querySelectorAll(".point-label");
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe("A");
  });

  it("names several points at once, each with its own letter", () => {
    const { container } = render(
      <Board board={empty} labels={[{ c: 2, r: 3, text: "A" }, { c: 5, r: 6, text: "B" }]} />,
    );
    expect([...container.querySelectorAll(".point-label")].map(n => n.textContent)).toEqual(["A", "B"]);
  });

  it("says nothing on a point that has a stone on it", () => {
    const played = withStone(empty, 2, 3, "w");
    const { container } = render(<Board board={played} labels={[{ c: 2, r: 3, text: "A" }]} />);
    expect(container.querySelector(".point-label"), "a played stone is named by `numbers`").toBeNull();
    expect(container.querySelectorAll(".stone-w").length).toBe(1);
  });

  it("draws no labels when it is given none", () => {
    const { container } = render(<Board board={empty} />);
    expect(container.querySelector(".point-label")).toBeNull();
  });
});
