// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within, act } from "@testing-library/react";
import { PROBLEMS, problemsInSet } from "../content/problems.js";
import { SENSEI_KEY } from "../store/sensei.js";
import { PERSONAS } from "../content/personas.js";
import { demoPair } from "../content/demo.js";
import { dayKey } from "../content/kata.js";

const serverEnabled = vi.fn(() => false);
const loadAccount = vi.fn(() => null);

vi.mock("../net/api.js", () => ({ serverEnabled: () => serverEnabled() }));
vi.mock("../store/account.js", () => ({ loadAccount: () => loadAccount() }));
vi.mock("./DashboardCard.jsx", () => ({ DashboardCard: ({ account }) => <div>dashboard:{account.player.name}</div> }));
/* The demo board is a clock and a network, both tested in its own suite. Here
   it only has to hand back the one thing the dashboard reads off it: which
   engine settled in. `mini` is the props it was given, so a test can answer. */
let mini = null;
vi.mock("../components/MiniSelfPlay.jsx", () => ({
  MiniSelfPlay: (props) => { mini = props; return null; },
}));
vi.mock("../components/DuelCard.jsx", () => ({ DuelCard: () => null }));
vi.mock("../components/Chain.jsx", () => ({ ChainLine: () => null }));
vi.mock("../components/OpenSgf.jsx", () => ({ OpenSgf: () => null }));
vi.mock("../components/mokuStore.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useMokuFacts: () => {} };
});
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
  mini = null;
  vi.useRealTimers();
  localStorage.clear();
  serverEnabled.mockReset();
  serverEnabled.mockReturnValue(false);
  loadAccount.mockReset();
  loadAccount.mockReturnValue(null);
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

  it("shows the dashboard card after signing in later in the same session", () => {
    serverEnabled.mockReturnValue(true);
    const { rerender } = render(<Home profile={profile()} go={() => {}} onResume={() => {}} />);
    expect(screen.queryByText("dashboard:Ada")).toBe(null);

    loadAccount.mockReturnValue({ player: { name: "Ada" } });
    rerender(<Home profile={profile()} go={() => {}} onResume={() => {}} />);
    expect(screen.getByText("dashboard:Ada")).toBeTruthy();
  });
});

describe("the credit under the demo board", () => {
  /* Two of these work out the pair they expect by calling demoPair themselves,
     and the dashboard calls dayKey() while it renders. Across midnight those
     are two different days and two different pairs, so the day is held still
     before the board is drawn rather than after. */
  const onDay = (day = "2026-09-16T12:00:00Z") => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(day));
  };

  it("names the move picker when the network is not the one playing", () => {
    show();
    expect(mini).not.toBeNull();
    act(() => mini.onSource("heuristic"));
    const note = document.querySelector(".board-note");
    expect(note.textContent).toContain("move picker");
    expect(note.textContent).not.toContain("(");
  });

  it("names both house players and the rank each is playing at", () => {
    onDay();
    const pair = demoPair(PERSONAS, dayKey());
    show();
    expect(mini).not.toBeNull();
    act(() => mini.onSource("kata"));
    const note = document.querySelector(".board-note");
    expect(note.textContent).toContain(pair.b.persona.name);
    expect(note.textContent).toContain(pair.b.rank);
    expect(note.textContent).toContain(pair.w.persona.name);
    expect(note.textContent).toContain(pair.w.rank);
  });

  it("hands the demo board today's pair to seat", () => {
    onDay();
    const pair = demoPair(PERSONAS, dayKey());
    show();
    expect(mini).not.toBeNull();
    expect(mini.players.b.persona.id).toBe(pair.b.persona.id);
    expect(mini.players.w.rank).toBe(pair.w.rank);
  });

  it("does not hide the credit from a screen reader with the board", () => {
    show();
    const note = document.querySelector(".board-note");
    expect(note.closest("[aria-hidden='true']"), "the board is decoration; its credit is not").toBe(null);
  });
});
