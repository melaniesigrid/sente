// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import { dashboard } from "./dashboard.js";


/* ----------------------- THE LOBBY'S LIST OF TABLES -----------------------
   The order itself is settled in dashboard.test.js, which is pure, and the rule
   lives there because the front page asks the same question of the same games.
   What is not settled anywhere is that the list on screen is that order: a view
   that sorts and then renders `tables` instead of the ordered list passes every
   pure test there is and still shows a pile. So this reads the rows off the DOM
   and compares them with what `dashboard` says, rather than with a hand-written
   order that would only be a second copy of the rule.

   The other two are sentences. "N tables are waiting on you" has a singular
   nobody writes until a user with exactly one game reads it in the plural; and
   how long a table has sat there is a fact about a live game, because a
   finished one has not been waiting for anything. */

const me = vi.fn();
const games = vi.fn();
const signOut = vi.fn();
const sockets = [];
const lobbySocket = vi.fn((token, handlers) => {
  const sock = { token, handlers, send: vi.fn(() => true), close: vi.fn() };
  sockets.push(sock);
  return sock;
});
const loadAccount = vi.fn(() => null);

vi.mock("../net/api.js", () => ({
  api: {
    me: (...a) => me(...a),
    games: (...a) => games(...a),
    signOut: (...a) => signOut(...a),
    sendConfirmation: () => Promise.resolve(),
  },
  lobbySocket: (...a) => lobbySocket(...a),
  serverEnabled: () => true,
  SERVER_URL: "https://server.test",
}));
vi.mock("../store/account.js", () => ({
  loadAccount: () => loadAccount(),
  saveAccount: () => true,
  clearAccount: () => {},
}));

const { OnlineCard } = await import("./OnlineLobby.jsx");

const PLAYER = {
  id: "p_me", name: "Me", tint: "eucalyptus", rating: 1200, rd: 60,
  wins: 3, losses: 1, draws: 0, avatarAt: null, email: "me@example.test", emailVerified: true,
};
const ACCOUNT = { token: "a".repeat(64), player: PLAYER };

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const now = Date.now();

/** A lobby summary of a table. `toPlay` and `updatedAt` are what the order
  * turns on, so every fixture below differs in one of the two. */
const table = (id, over = {}) => ({
  id, size: 9, moves: 20, phase: "playing", toPlay: "b",
  black: { id: "p_me", name: "Me" }, white: { id: "p_you", name: "Ixchel" },
  updatedAt: now - HOUR, result: null, ...over,
});

const show = (over = {}) => render(
  <OnlineCard profile={{ name: "Me" }} notify={() => {}} onPlay={() => {}} size={9} {...over} />,
);
/** The rendered rows, in the order they are on screen, named by their opponent
  * line plus the detail beside it - which is enough to tell any two apart. */
const rows = () => [...document.querySelectorAll(".table-row")].map(el => el.textContent);
/** What the same games look like once the rule has had them. */
const expected = (list) => {
  const board = dashboard(list, PLAYER.id);
  const done = list.filter(g => g.phase === "ended")
    .sort((a, b) => (b.endedAt || b.updatedAt || 0) - (a.endedAt || a.updatedAt || 0))
    .slice(0, 3);
  return [...board.yours, ...board.theirs, ...done].map(g => g.id);
};

/** Render with these tables and let the two awaited calls in `refresh` settle. */
const withTables = async (list) => {
  games.mockResolvedValue(list);
  const r = show();
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  return r;
};

beforeEach(() => {
  sockets.length = 0;
  lobbySocket.mockClear();
  for (const fn of [me, games, signOut, loadAccount]) fn.mockReset();
  loadAccount.mockReturnValue(ACCOUNT);
  me.mockResolvedValue(PLAYER);
  games.mockResolvedValue([]);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("the list of tables", () => {
  /* The rows carry no id, so each fixture is given an opponent of its own and
     the order is read back through those names. */
  const named = (id, name, over = {}) =>
    table(id, { white: { id: "p_" + name, name }, ...over });

  it("draws the live tables in the order the rule puts them in", async () => {
    const list = [
      named("g1", "Theirs", { toPlay: "w", updatedAt: now - 5 * HOUR }),
      named("g2", "Yours", { toPlay: "b", updatedAt: now - HOUR }),
      named("g3", "Counting", { phase: "scoring", updatedAt: now - 9 * HOUR }),
    ];
    await withTables(list);
    /* A game being counted is waiting on you: it sits there until somebody
       accepts, and that somebody is usually you. So it groups with your moves
       and the nine-hour one leads the two of them. */
    const order = expected(list);
    expect(order, "yours first, longest waiting at the top").toEqual(["g3", "g2", "g1"]);
    expect(rows().length).toBe(3);
    expect(rows()[0]).toMatch(/Counting/);
    expect(rows()[1]).toMatch(/Yours/);
    expect(rows()[2]).toMatch(/Theirs/);
  });

  /* Finished games come after every live one however recently they ended, and
     only three of them: the lobby is for what to do next. */
  it("puts the finished tables under the live ones, three at most", async () => {
    const ended = (id, name, endedAt) => named(id, name, {
      phase: "ended", endedAt, updatedAt: endedAt,
      result: { winner: "b", method: "resign" },
    });
    const list = [
      ended("d1", "Oldest", now - 4 * HOUR),
      ended("d2", "Older", now - 3 * HOUR),
      ended("d3", "Old", now - 2 * HOUR),
      ended("d4", "Newest", now - HOUR),
      named("g1", "Live"),
    ];
    await withTables(list);
    expect(expected(list)).toEqual(["g1", "d4", "d3", "d2"]);
    const text = rows();
    expect(text.length, "one live table and three finished").toBe(4);
    expect(text[0]).toMatch(/Live/);
    expect(text[1]).toMatch(/Newest/);
    expect(text[3]).toMatch(/vs Older/);
    expect(document.body.textContent).not.toMatch(/Oldest/);
  });
});

describe("how many tables are waiting on you", () => {
  it("says it in words, and in the singular, when there is one", async () => {
    await withTables([
      table("g1", { toPlay: "b" }),
      table("g2", { toPlay: "w", white: { id: "p_you", name: "Ixchel" } }),
    ]);
    expect(screen.getByText(/One table is waiting on you/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/1 tables?/);
  });

  it("counts them when there are several", async () => {
    await withTables([
      table("g1", { toPlay: "b" }),
      table("g2", { toPlay: "b" }),
      table("g3", { toPlay: "b" }),
    ]);
    expect(screen.getByText(/3 tables are waiting on you/)).toBeTruthy();
  });

  /* A table where they are to move is not a table waiting on you, so a lobby
     full of those says nothing at all rather than saying nought. */
  it("says nothing when none of them are yours to move", async () => {
    await withTables([table("g1", { toPlay: "w" }), table("g2", { toPlay: "w" })]);
    expect(rows().length, "the tables are still listed").toBe(2);
    expect(document.body.textContent).not.toMatch(/waiting on you/);
  });
});

describe("how long a table has sat there", () => {
  it("says it on a live table", async () => {
    await withTables([table("g1", { updatedAt: now - 3 * HOUR })]);
    expect(rows()[0]).toMatch(/3 hours/);
  });

  /* A finished game has not been waiting for anything, and saying it had been
     waiting two days would read as a game somebody had abandoned. */
  it("says nothing of the sort on a finished one", async () => {
    await withTables([table("g1", {
      phase: "ended", updatedAt: now - 3 * HOUR, endedAt: now - 3 * HOUR,
      result: { winner: "b", method: "resign" },
    })]);
    expect(rows().length).toBe(1);
    expect(rows()[0]).toMatch(/won by resignation/);
    expect(rows()[0]).not.toMatch(/hour|minute|day/);
  });
});

/* ----------------------- THE BOARD THE BUTTON NAMES -----------------------
   "Find an opponent on 9x9" is a sentence with a number in it, and for a while
   the only control over that number lived in the table card three cards down
   the page, past fourteen other controls, under a heading that does not say
   "online". The wiring was never broken - the picker down there did set the
   board and the button did follow it - so every test passed while a player who
   wanted 19x19 had no way to find out that 9 was a choice.

   So what is checked here is placement, not state: the control is in the same
   card as the button, and the board it reports is the board the seek is sent
   with. A test that only asserted the state would go green on the bug. */
describe("the board the find button names", () => {
  const card = () => document.querySelector(".online-card");
  const findBtn = () => screen.getByRole("button", { name: /opponent/i });
  const boards = () => screen.getByRole("radiogroup", { name: /board/i });

  const ready = async (over) => {
    const r = show(over);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    return r;
  };

  it("puts a board picker in the same card as the button, offering every size", async () => {
    await ready();
    expect(card().contains(boards()), "the picker is inside the online card").toBe(true);
    expect(card().contains(findBtn()), "and so is the button it belongs to").toBe(true);
    expect([...boards().querySelectorAll("button")].map(b => b.textContent))
      .toEqual(["9×9", "13×13", "19×19"]);
  });

  it("marks the board the button is naming, and no other", async () => {
    await ready({ size: 13 });
    expect(findBtn().textContent).toContain("13×13");
    const on = [...boards().querySelectorAll("button")].filter(b => b.getAttribute("aria-checked") === "true");
    expect(on.map(b => b.textContent)).toEqual(["13×13"]);
  });

  it("reports a new board to the table it shares with the rest of the lobby", async () => {
    const setSize = vi.fn();
    await ready({ setSize });
    const nineteen = [...boards().querySelectorAll("button")].find(b => b.textContent === "19×19");
    await act(async () => { fireEvent.click(nineteen); });
    expect(setSize).toHaveBeenCalledWith(19);
  });

  /* The board is a choice only if the seek carries it. This is the half that
     would still be worth having if the picker were ever moved again. */
  it("seeks on the board that is showing, not on nine", async () => {
    await ready({ size: 19 });
    await act(async () => { sockets[0].handlers.onStatus("open"); });
    await act(async () => { fireEvent.click(findBtn()); });
    expect(sockets[0].send).toHaveBeenCalledWith(expect.objectContaining({ t: "seek", size: 19 }));
  });
});
