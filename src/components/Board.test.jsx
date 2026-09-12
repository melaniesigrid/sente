// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { Board } from "./Board.jsx";
import { createBoard, withStone, pointLabel } from "../engine/index.js";

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
