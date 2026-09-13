// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { problemsInSet } from "../content/problems.js";

vi.mock("../components/Board.jsx", () => ({ Board: () => null }));
vi.mock("../components/Passage.jsx", () => ({ Passage: () => null }));
vi.mock("../components/mokuStore.js", () => ({ useMokuFacts: () => {} }));
vi.mock("../store/profile.js", () => ({ saveProfile: () => {} }));

const { ProblemsView } = await import("./Problems.jsx");

const profile = (over = {}) => ({
  problemsDone: [],
  lessonsDone: [],
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
