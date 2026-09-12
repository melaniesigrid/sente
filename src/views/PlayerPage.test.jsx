// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { FACTS } from "../../server/profile.js";

/* ----------------------- A PLAYER'S PAGE, DRAWN -----------------------
   What the page SAYS is settled in playerCard.test.js, which is pure. This is
   about the page itself, and there are four things it can get wrong that
   reading the source will not catch.

   The first is the one that matters legally. `legal.js` says a finished game
   may be shown "to the players and to anyone holding the link to that room",
   and a list of somebody's games on a page anybody can open is wider than that
   sentence. So this suite asserts the absence of a games list, and it will fail
   the day somebody adds one without widening the notice in the same commit.

   The second is the same promise about time: nothing on a public page may say
   when a person was at their desk. The wording is tested pure; that the page
   renders no other stamp is tested here.

   The third is the three-state muddle. "Still asking" and "there is nobody by
   that name" render identically if the component only keeps the object, and a
   page that says "no such player" for half a second on every visit is worse
   than one that says nothing.

   The fourth is the stale answer: open a page, open a second player from it,
   and the first player's card must not be on screen while the second is in the
   air. */

const profile = vi.fn();
const loadAccount = vi.fn(() => null);

vi.mock("../net/api.js", () => ({
  api: { profile: (...a) => profile(...a) },
  serverEnabled: () => true,
  SERVER_URL: "https://server.test",
}));
vi.mock("../store/account.js", () => ({ loadAccount: () => loadAccount() }));

const { PlayerPage } = await import("./PlayerPage.jsx");

const PLAYER = {
  id: "p_abc", name: "Ixchel", tint: "eucalyptus",
  rating: 900, rd: 80, wins: 12, losses: 9, draws: 0,
  avatarAt: null,
  createdAt: new Date(2026, 2, 9).getTime(),
  lastSeen: new Date(2026, 8, 11).getTime(),
  bio: "I learned on a kitchen table in Guatemala City.",
  facts: { [FACTS[0].key]: "Go Guatemala" },
};

beforeEach(() => { profile.mockReset(); loadAccount.mockReset(); loadAccount.mockReturnValue(null); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const show = (props = {}) => render(<PlayerPage playerId="p_abc" go={() => {}} {...props} />);

describe("while the server is being asked", () => {
  it("says it is looking, not that there is nobody", async () => {
    profile.mockReturnValue(new Promise(() => {}));      // never settles
    show();
    expect(screen.getByText(/looking them up/i)).toBeTruthy();
    expect(screen.queryByText(/no player by that name/i)).toBe(null);
  });
});

describe("a player who exists", () => {
  beforeEach(() => { profile.mockResolvedValue(PLAYER); });

  it("draws the name, the paragraph and the fact they filled in", async () => {
    show();
    await screen.findByText("Ixchel");
    expect(screen.getByText(/kitchen table in Guatemala City/)).toBeTruthy();
    expect(screen.getByText("Go Guatemala")).toBeTruthy();
    expect(screen.getByText(FACTS[0].label)).toBeTruthy();
  });

  it("gives the record and when they arrived", async () => {
    show();
    await screen.findByText("Ixchel");
    expect(screen.getByText("12 W · 9 L")).toBeTruthy();
    expect(screen.getByText(/Here since March 2026/)).toBeTruthy();
  });

  /* The promise in legal.js, asserted rather than trusted. */
  it("carries no list of their games", async () => {
    show();
    await screen.findByText("Ixchel");
    const text = document.body.textContent;
    expect(text).not.toMatch(/\bSGF\b/i);
    expect(text).not.toMatch(/recent games|their games|game record|\bmoves\b/i);
    expect(document.querySelectorAll("a[href*='game']").length).toBe(0);
  });

  /* The other promise: a public page is not a way to learn somebody's hours. */
  it("says nothing finer about time than a week or a month", async () => {
    show();
    await screen.findByText("Ixchel");
    const text = document.body.textContent;
    expect(text).not.toMatch(/\d{1,2}:\d{2}/);
    expect(text).not.toMatch(/\b(hours?|minutes?|seconds?) ago\b/i);
    expect(text).not.toMatch(/\bonline now\b/i);
  });

  it("does not offer to edit somebody else's card", async () => {
    show();
    await screen.findByText("Ixchel");
    expect(screen.queryByText(/edit your card/i)).toBe(null);
  });
});

describe("a player who has written nothing", () => {
  it("says so in their name rather than leaving a hole", async () => {
    profile.mockResolvedValue({ ...PLAYER, bio: "", facts: {} });
    show();
    await screen.findByText("Ixchel");
    expect(screen.getByText(/Ixchel has not written anything/)).toBeTruthy();
  });

  it("still gives the record, which is theirs whether they wrote or not", async () => {
    profile.mockResolvedValue({ ...PLAYER, bio: "", facts: {} });
    show();
    await screen.findByText("12 W · 9 L");
  });
});

describe("your own page", () => {
  it("says it is you and offers the way to change it", async () => {
    loadAccount.mockReturnValue({ token: "t", player: { id: "p_abc" } });
    profile.mockResolvedValue(PLAYER);
    show();
    await screen.findByText(/edit your card/i);
    expect(screen.getByText(/as everybody else sees you/i)).toBeTruthy();
  });
});

describe("a player who is not there", () => {
  it("says so plainly once the server has answered", async () => {
    profile.mockRejectedValue(new Error("no-player"));
    show();
    await screen.findByText(/no player by that name/i);
  });
});

describe("opening a second player from the first one's page", () => {
  it("never shows the first player's card while the second is in the air", async () => {
    let settleSecond;
    profile.mockResolvedValueOnce(PLAYER)
      .mockReturnValueOnce(new Promise((res) => { settleSecond = res; }));
    const { rerender } = show();
    await screen.findByText("Ixchel");

    rerender(<PlayerPage playerId="p_xyz" go={() => {}} />);
    expect(screen.queryByText("Ixchel")).toBe(null);
    expect(screen.getByText(/looking them up/i)).toBeTruthy();

    settleSecond({ ...PLAYER, id: "p_xyz", name: "Balam" });
    await screen.findByText("Balam");
  });
});

describe("getting back", () => {
  it("uses the way back it was given", async () => {
    const onBack = vi.fn();
    profile.mockResolvedValue(PLAYER);
    show({ onBack });
    (await screen.findByRole("button", { name: /back/i })).click();
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });

  it("falls back to the ladder, which is where the links come from", async () => {
    const go = vi.fn();
    profile.mockResolvedValue(PLAYER);
    show({ go, onBack: null });
    (await screen.findByRole("button", { name: /back/i })).click();
    await waitFor(() => expect(go).toHaveBeenCalledWith("ladder"));
  });
});
