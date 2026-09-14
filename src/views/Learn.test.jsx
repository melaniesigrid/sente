// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { pt } from "../content/positions.js";

vi.mock("../components/Moku.jsx", () => ({ MokuCard: () => null }));
vi.mock("../components/mokuStore.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useMokuFacts: () => {} };
});

const { LessonPlayer } = await import("./Learn.jsx");

/* Two puzzles on a nine-line board: capture the one white stone, twice. */
const puzzle = (id) => ({
  type: "quiz",
  setup: { b: [pt(3, 4), pt(4, 3), pt(5, 4)], w: [pt(4, 4)] },
  toPlay: "b", answers: [pt(4, 5)],
  text: `Question ${id}.`, success: `Solved ${id}.`,
});
const lesson = (steps, id = "fixture") => ({
  id, title: "Fixture", subtitle: "", plain: "", tier: 1, rank: "30k", track: "tactics", size: 9,
  prereqs: [], minutes: 1, author: "Joseki", sources: [], steps,
});
const N = 9;
const play = (c, r) => fireEvent.click(screen.getAllByRole("gridcell")[r * N + c]);
const show = (l, over = {}) => render(
  <LessonPlayer lesson={l} nextLesson={null} onDone={() => {}} onExit={() => {}} onOpenNext={() => {}} rank="30k" {...over} />,
);

afterEach(cleanup);

describe("crediting a lesson", () => {
  it("fires onSolved once, when the last step is solved, and not before", () => {
    const onSolved = vi.fn();
    const { rerender } = show(lesson([puzzle(1), puzzle(2)]), { onSolved });
    expect(onSolved).not.toHaveBeenCalled();
    play(4, 5);                                       // step one solved
    expect(screen.getByText("Solved 1.")).toBeTruthy();
    expect(onSolved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(/continue/i));
    expect(onSolved).not.toHaveBeenCalled();          // the last step is open, not solved
    play(4, 5);
    expect(screen.getByText("Solved 2.")).toBeTruthy();
    expect(onSolved).toHaveBeenCalledTimes(1);
    rerender(<LessonPlayer lesson={lesson([puzzle(1), puzzle(2)])} nextLesson={null} onDone={() => {}}
      onExit={() => {}} onOpenNext={() => {}} rank="30k" onSolved={onSolved} />);
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no onSolved is given, as the welcome demo gives none", () => {
    show(lesson([puzzle(1)], "fixture-2"));
    play(4, 5);
    expect(screen.getByText("Solved 1.")).toBeTruthy();
  });
});

describe("a told step folded into the puzzle after it", () => {
  it("reads the explanation above the question, on a board that can be played at once", () => {
    const told = { type: "info", setup: puzzle(1).setup, marks: [pt(4, 5)], text: "Here is why." };
    const onSolved = vi.fn();
    show(lesson([told, puzzle(1)], "fixture-3"), { onSolved });
    expect(screen.getByText("Here is why.")).toBeTruthy();
    expect(screen.getByText("Question 1.")).toBeTruthy();
    expect(screen.getByText(/step 1 of 1/i)).toBeTruthy();
    play(4, 5);
    expect(screen.getByText("Solved 1.")).toBeTruthy();
    expect(onSolved).toHaveBeenCalledTimes(1);
  });
});
