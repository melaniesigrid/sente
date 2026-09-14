// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { PROBLEMS, problemsInSet } from "../content/problems.js";
import { SENSEI_KEY } from "../store/sensei.js";

vi.mock("../net/api.js", () => ({ serverEnabled: () => false }));
vi.mock("../store/account.js", () => ({ loadAccount: () => null }));
vi.mock("../components/MiniSelfPlay.jsx", () => ({ MiniSelfPlay: () => null }));
vi.mock("../components/DuelCard.jsx", () => ({ DuelCard: () => null }));
vi.mock("../components/Chain.jsx", () => ({ ChainLine: () => null }));
vi.mock("../components/OpenSgf.jsx", () => ({ OpenSgf: () => null }));
vi.mock("../components/mokuStore.js", () => ({ useMokuFacts: () => {} }));
vi.mock("./Review.jsx", () => ({ Review: () => null }));
vi.mock("./session.js", () => ({ loadSession: () => null }));

const { Home } = await import("./Home.jsx");

const profile = (over = {}) => ({
  name: "Me",
  wins: 0,
  losses: 0,
  rating: 525,
  rd: 60,
  lessonsDone: [],
  problemsDone: [],
  kataDate: null,
  recall: {},
  ...over,
});

const show = (over = {}) => render(<Home profile={profile(over)} go={() => {}} onResume={() => {}} />);
const stat = (tile) => within(tile).getByText((_, e) => e?.classList.contains("stat-num") && e.textContent);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("the tsumego dashboard tile", () => {
  it("shows the current set and its progress while a reader is in the middle of it", () => {
    show({
      problemsDone: [
        ...problemsInSet("tactics").map(p => p.id),
        problemsInSet("shape")[0].id,
      ],
    });

    const tile = screen.getByText("Shape").closest("button");
    expect(tile).toBeTruthy();
    expect(stat(tile).textContent).toBe("1/3");
  });

  it("stays on the last set once every problem is solved", () => {
    show({ problemsDone: PROBLEMS.map(p => p.id) });

    const tile = screen.getByText("The corner").closest("button");
    expect(tile).toBeTruthy();
    expect(stat(tile).textContent).toBe("4/4");
  });
});

describe("the trainer mailbox", () => {
  it("appears when the trainer is unlocked later in the same session", async () => {
    const { rerender } = render(<Home profile={profile({ sensei: false })} go={() => {}} onResume={() => {}} />);
    expect(screen.queryByText("A lesson arrives.")).toBe(null);

    localStorage.setItem(SENSEI_KEY, JSON.stringify({
      letters: [{ at: "2026-09-14", text: "A lesson arrives.", read: false }],
      lastGame: "",
      wrote: "",
    }));

    rerender(<Home profile={profile({ sensei: true })} go={() => {}} onResume={() => {}} />);
    expect(await screen.findByText("A lesson arrives.")).toBeTruthy();
  });
});
