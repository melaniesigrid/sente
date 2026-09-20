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
/* The roll is about everybody else and has its own suite; this one is about
   the dashboard and the trainer. */
vi.mock("./RollCard.jsx", () => ({ RollCard: () => null }));
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

import { CHAMPION, championStep, enticeLine, KE_JIE, GLOSSARY } from "../content/sensei.js";
import { ratingOfRank } from "../content/rank.js";
import { loadBox } from "../store/sensei.js";

/* Everything he could say as an invitation, across enough seeds to cover the
   list: the thread picks one by its own length, which is not the test's business. */
const anyEntice = (name) => new Set(Array.from({ length: 24 }, (_, i) => enticeLine(i, name, false, { focus: null })));

describe("the road to champion, on the dashboard", () => {
  const atRank = (rank, over = {}) => profile({ sensei: true, rating: ratingOfRank(rank), wins: 1, ...over });

  it("says the milestone the day she reaches a stop, and never says it again", () => {
    const rung = championStep(ratingOfRank("10k")).at;
    render(<Home profile={atRank("10k")} go={() => {}} onResume={() => {}} />);
    expect(screen.getByText((s) => s.includes(rung.him.slice(0, 40)))).toBeTruthy();
    // It is marked in the box, which is what stops it being said every morning.
    expect(loadBox().rung).toBe(rung.at);
    const before = loadBox().thread.filter((m) => m.text.includes(rung.him.slice(0, 40))).length;
    expect(before).toBe(1);
    cleanup();
    render(<Home profile={atRank("10k")} go={() => {}} onResume={() => {}} />);
    expect(loadBox().thread.filter((m) => m.text.includes(rung.him.slice(0, 40))).length).toBe(1);
  });

  it("says nothing about the road before she has played a game at all", () => {
    // A rating with no games behind it is a starting position, not an achievement.
    render(<Home profile={atRank("10k", { wins: 0, losses: 0 })} go={() => {}} onResume={() => {}} />);
    expect(loadBox().rung).toBe("");
    expect(loadBox().thread.some((m) => CHAMPION.some((c) => m.text.includes(c.him.slice(0, 40))))).toBe(false);
  });
});

describe("his invitation to the board", () => {
  it("asks her to sit down on a day with no game on the record", () => {
    render(<Home profile={profile({ sensei: true, wins: 2 })} go={() => {}} onResume={() => {}} />);
    const said = loadBox().thread.map((m) => m.text);
    expect(said.some((line) => anyEntice("Me").has(line))).toBe(true);
  });

  it("asks once a day, however many times she opens the dashboard", () => {
    /* Home is mounted fresh on every return to the dashboard, so an invitation
       guarded only by "no game today" - a day key the line itself never writes -
       appended another one every visit and pushed the rest of the thread off the
       end of it. He asks once. */
    const p = profile({ sensei: true, wins: 2 });
    for (let visit = 0; visit < 4; visit++) {
      const { unmount } = render(<Home profile={p} go={() => {}} onResume={() => {}} />);
      unmount();
    }
    const asked = loadBox().thread.filter((m) => anyEntice("Me").has(m.text));
    expect(asked).toHaveLength(1);
  });

  it("stops the moment there is a game with him today", () => {
    /* The app's own day key, which is local. Building one from toISOString gives
       the UTC date, and west of Greenwich those are different days all evening -
       the seeded "he played today" landed on tomorrow and the guard never saw it. */
    const today = dayKey();
    localStorage.setItem(SENSEI_KEY, JSON.stringify({ thread: [], games: [], lastGame: today, rung: "" }));
    render(<Home profile={profile({ sensei: true, wins: 2 })} go={() => {}} onResume={() => {}} />);
    const said = loadBox().thread.map((m) => m.text);
    expect(said.some((line) => anyEntice("Me").has(line))).toBe(false);
  });
});

describe("the names on his card", () => {
  it("gives both Chinese names their sound and their meaning where they are shown", () => {
    render(<Home profile={profile({ sensei: true })} go={() => {}} onResume={() => {}} />);
    for (const name of [KE_JIE.nickname, KE_JIE.yourHandle]) {
      const g = GLOSSARY.find((x) => x.name === name);
      expect(screen.getByText((s) => s.includes(g.pinyin) && s.includes(g.means)), name).toBeTruthy();
    }
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
