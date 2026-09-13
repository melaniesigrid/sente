// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { problemsInSet } from "../content/problems.js";
import { drillQueue, DRILLS } from "../content/drills.js";
import { ratingOfValue } from "../content/rank.js";

vi.mock("../components/Board.jsx", () => ({ Board: () => null }));
vi.mock("../components/Passage.jsx", () => ({ Passage: () => null }));
vi.mock("../components/mokuStore.js", () => ({ useMokuFacts: () => {} }));
vi.mock("../store/profile.js", () => ({ saveProfile: () => {} }));

const { ProblemsView } = await import("./Problems.jsx");

const profile = (over = {}) => ({
  problemsDone: [],
  lessonsDone: [],
  drillsDone: [],
  kataDate: null,
  recall: {},
  ...over,
});

afterEach(cleanup);

describe("the problems set summary", () => {
  it("appears once a reader has finished at least one set", () => {
    render(
      <ProblemsView
        profile={profile({ problemsDone: problemsInSet("tactics").map(p => p.id) })}
        setProfile={() => {}}
      />,
    );

    expect(document.body.textContent).toContain("1 set of 4 finished.");
  });

  it("uses the plural form once more than one set is finished", () => {
    render(
      <ProblemsView
        profile={profile({
          problemsDone: [
            ...problemsInSet("tactics").map(p => p.id),
            ...problemsInSet("shape").map(p => p.id),
          ],
        })}
        setProfile={() => {}}
      />,
    );

    expect(document.body.textContent).toContain("2 sets of 4 finished.");
  });
});

/* The drill ground is a second activity sharing the screen's board. What is
   worth holding here is that switching to it really does put the queue's first
   board up, with the words composed for that board rather than the collection's
   - the two used to be one code path and could quietly become one again. */
describe("the drill ground", () => {
  const rating = ratingOfValue(30 - 12);      // a twelve kyu

  it("offers both activities and says how big each one is", () => {
    render(<ProblemsView profile={profile({ rating })} setProfile={() => {}} />);
    expect(document.body.textContent).toContain("The collection");
    expect(document.body.textContent).toContain("The drill ground");
    expect(document.body.textContent).toContain(`${DRILLS.length} boards`);
  });

  it("opens the first board of the queue, with that board's own words", () => {
    render(<ProblemsView profile={profile({ rating })} setProfile={() => {}} />);
    const first = drillQueue(rating, [], 8)[0];
    expect(first, "a twelve kyu has a queue").toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /the drill ground/i }));

    expect(document.body.textContent).toContain("Your queue");
    expect(document.body.textContent).toContain(first.rank);
    const words = first.kind === "capture" ? "white chain" : "eye space";
    expect(document.body.textContent).toContain(words);
  });

  it("does not offer the reader a board weaker than they are", () => {
    render(<ProblemsView profile={profile({ rating })} setProfile={() => {}} />);
    for (const d of drillQueue(rating, [], 8)) expect(d.rank).not.toBe("13k");
  });
});
