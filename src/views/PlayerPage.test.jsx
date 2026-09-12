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
const friends = vi.fn();
const askFriend = vi.fn();
const acceptFriend = vi.fn();
const forgetFriend = vi.fn();
const presence = vi.fn();
const archive = vi.fn();

vi.mock("../net/api.js", () => ({
  api: {
    profile: (...a) => profile(...a),
    friends: (...a) => friends(...a),
    askFriend: (...a) => askFriend(...a),
    acceptFriend: (...a) => acceptFriend(...a),
    forgetFriend: (...a) => forgetFriend(...a),
    presence: (...a) => presence(...a),
    archive: (...a) => archive(...a),
    sgfUrl: (id) => `https://server.test/api/game/${id}/sgf`,
  },
  serverEnabled: () => true,
  SERVER_URL: "https://server.test",
}));
vi.mock("../store/account.js", () => ({ loadAccount: () => loadAccount() }));

const EMPTY_BOOK = { friends: [], incoming: [], outgoing: [] };
/** Signed in as somebody who is not the player being looked at. */
const signedIn = (book = EMPTY_BOOK) => {
  loadAccount.mockReturnValue({ token: "t", player: { id: "p_me" } });
  friends.mockResolvedValue(book);
};

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

beforeEach(() => {
  profile.mockReset();
  loadAccount.mockReset();
  loadAccount.mockReturnValue(null);
  for (const fn of [friends, askFriend, acceptFriend, forgetFriend, presence, archive]) fn.mockReset();
  archive.mockResolvedValue({ games: [], cursor: null });
  presence.mockResolvedValue({ online: [] });
  friends.mockResolvedValue(EMPTY_BOOK);
});
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

  /* The promise in legal.js, asserted rather than trusted, and narrowed
     deliberately when the featured-games slice widened the sentence it rests
     on. A player may now show games they chose; what is still forbidden is a
     list of everything they have played on a page anybody can open, and the
     page is given no way to fetch one. */
  it("shows no games at all for a player who chose to show none", async () => {
    profile.mockResolvedValue({ ...PLAYER, featured: [] });
    show();
    await screen.findByText("Ixchel");
    expect(screen.queryByText(/is showing/i)).toBe(null);
    expect(document.body.textContent).not.toMatch(/moves/i);
  });

  it("never fetches anybody's archive, which is theirs and not public", async () => {
    show();
    await screen.findByText("Ixchel");
    expect(archive).not.toHaveBeenCalled();
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
    friends.mockResolvedValue(EMPTY_BOOK);
    profile.mockResolvedValue(PLAYER);
    show();
    await screen.findByText(/edit your card/i);
    expect(screen.getByText(/as everybody else sees you/i)).toBeTruthy();
  });

  it("offers no way to befriend yourself", async () => {
    loadAccount.mockReturnValue({ token: "t", player: { id: "p_abc" } });
    friends.mockResolvedValue(EMPTY_BOOK);
    profile.mockResolvedValue(PLAYER);
    show();
    await screen.findByText(/edit your card/i);
    expect(screen.queryByRole("button", { name: /add friend/i })).toBe(null);
  });
});

describe("the friend button", () => {
  beforeEach(() => { profile.mockResolvedValue(PLAYER); });

  it("is absent for somebody who has not claimed a handle", async () => {
    loadAccount.mockReturnValue(null);
    show();
    await screen.findByText("Ixchel");
    expect(screen.queryByRole("button", { name: /add friend/i })).toBe(null);
    expect(friends).not.toHaveBeenCalled();
  });

  it("offers to add a stranger, and sends one request", async () => {
    signedIn();
    askFriend.mockResolvedValue({ outcome: "asked", standing: "asked" });
    show({ notify: vi.fn() });
    (await screen.findByRole("button", { name: /add friend/i })).click();
    await waitFor(() => expect(askFriend).toHaveBeenCalledWith("t", "p_abc"));
  });

  /* The case the pure module exists for: they asked me first, so this page
     must offer to accept rather than send a second request back across a table
     where the answer was already waiting. */
  it("offers to accept, not to ask again, when they asked first", async () => {
    signedIn({ ...EMPTY_BOOK, incoming: [{ id: "p_abc", name: "Ixchel" }] });
    acceptFriend.mockResolvedValue({ outcome: "friends", standing: "friends" });
    show({ notify: vi.fn() });
    await screen.findByRole("button", { name: /^accept$/i });
    expect(screen.queryByRole("button", { name: /add friend/i })).toBe(null);
    screen.getByRole("button", { name: /^decline$/i });
  });

  it("shows a settled friendship with a way out and no way to ask again", async () => {
    signedIn({ ...EMPTY_BOOK, friends: [{ id: "p_abc", name: "Ixchel" }] });
    show({ notify: vi.fn() });
    await screen.findByText(/^Friends$/);
    expect(screen.queryByRole("button", { name: /add friend/i })).toBe(null);
    screen.getByRole("button", { name: /remove friend/i });
  });

  it("says a request is out, and offers to take it back", async () => {
    signedIn({ ...EMPTY_BOOK, outgoing: [{ id: "p_abc", name: "Ixchel" }] });
    show({ notify: vi.fn() });
    await screen.findByText(/^Asked$/);
    screen.getByRole("button", { name: /take the request back/i });
  });

  it("says what happened in the words the outcome was given, not the call", async () => {
    const notify = vi.fn();
    signedIn({ ...EMPTY_BOOK, outgoing: [{ id: "p_abc", name: "Ixchel" }] });
    forgetFriend.mockResolvedValue({ outcome: "withdrawn", standing: "none" });
    show({ notify });
    (await screen.findByRole("button", { name: /take the request back/i })).click();
    await waitFor(() => expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Request taken back" })));
  });

  it("puts a refusal in front of the person rather than swallowing it", async () => {
    const notify = vi.fn();
    signedIn();
    askFriend.mockRejectedValue(Object.assign(new Error("x"), { reason: "their-list-is-full" }));
    show({ notify });
    (await screen.findByRole("button", { name: /add friend/i })).click();
    await waitFor(() => expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Their friends list is full" })));
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

describe("whether they are here", () => {
  beforeEach(() => { profile.mockResolvedValue(PLAYER); });

  it("says Here now in place of when they last played", async () => {
    presence.mockResolvedValue({ online: ["p_abc"] });
    show();
    await screen.findByText(/Here now/);
    expect(screen.queryByText(/Played this week/)).toBe(null);
  });

  /* Away and "did not say I may know" reach this page as the same silence, and
     the page must not invent a difference by saying one of them out loud. */
  it("never says anybody is offline, away, or hidden", async () => {
    presence.mockResolvedValue({ online: [] });
    show();
    await screen.findByText("Ixchel");
    const text = document.body.textContent;
    for (const word of [/offline/i, /away/i, /hidden/i, /not here/i, /invisible/i]) {
      expect(text, String(word)).not.toMatch(word);
    }
  });

  it("falls back to the last-played bucket when they are not shown as here", async () => {
    presence.mockResolvedValue({ online: [] });
    show();
    await screen.findByText(/Played/);
  });

  it("asks about the one player the page is about, and nobody else", async () => {
    signedIn();
    show({ notify: vi.fn() });
    await screen.findByText("Ixchel");
    await waitFor(() => expect(presence).toHaveBeenCalledWith("t", ["p_abc"]));
  });

  /* A player who lets anybody see them is visible to a visitor with no handle,
     so the page asks even when there is no token to ask with. */
  it("asks without a handle too", async () => {
    loadAccount.mockReturnValue(null);
    show();
    await screen.findByText("Ixchel");
    await waitFor(() => expect(presence).toHaveBeenCalledWith(null, ["p_abc"]));
  });

  it("still says nothing finer than a day about somebody who is not here", async () => {
    presence.mockResolvedValue({ online: [] });
    show();
    await screen.findByText("Ixchel");
    expect(document.body.textContent).not.toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("the games they chose to show", () => {
  const FEATURED = {
    id: "g1", size: 19, rated: true, pair: false, moves: 210,
    black: { id: "p_abc", name: "Ixchel" },
    white: { id: "p_zzz", name: "Balam" },
    teams: { b: [{ id: "p_abc", name: "Ixchel" }], w: [{ id: "p_zzz", name: "Balam" }] },
    result: { winner: "b", method: "resign" },
    endedAt: new Date(2026, 5, 1).getTime(),
    note: "The one where I finally killed a dragon.",
  };

  it("draws each one, naming the opponent and how it went", async () => {
    profile.mockResolvedValue({ ...PLAYER, featured: [FEATURED] });
    show();
    await screen.findByText(/is showing/i);
    expect(screen.getByText("Balam")).toBeTruthy();
    expect(screen.getByText(/won by resignation/)).toBeTruthy();
  });

  /* A game is two people's. The line beside it is one person's, and the page
     says whose rather than letting it float free next to somebody else's game. */
  it("attributes the line to the player who wrote it", async () => {
    profile.mockResolvedValue({ ...PLAYER, featured: [FEATURED] });
    show();
    const note = await screen.findByText(/finally killed a dragon/);
    expect(note.textContent).toContain("Ixchel");
  });

  it("draws a game with no line beside it just the same", async () => {
    profile.mockResolvedValue({ ...PLAYER, featured: [{ ...FEATURED, note: "" }] });
    show();
    await screen.findByText(/is showing/i);
    expect(screen.getByText("Balam")).toBeTruthy();
  });

  it("says nothing at all when the server sends no featured field", async () => {
    profile.mockResolvedValue(PLAYER);
    show();
    await screen.findByText("Ixchel");
    expect(screen.queryByText(/is showing/i)).toBe(null);
  });

  it("opens the game when a row is pressed", async () => {
    const go = vi.fn();
    profile.mockResolvedValue({ ...PLAYER, featured: [FEATURED] });
    show({ go });
    (await screen.findByRole("button", { name: /open the game against balam/i })).click();
    await waitFor(() => expect(go).toHaveBeenCalledWith("play", { gameId: "g1" }));
  });
});

describe("badges", () => {
  /* They are derived from the record on the card, so a page that shows a badge
     the numbers do not support is the one thing that cannot happen. */
  it("shows what the record supports and nothing else", async () => {
    profile.mockResolvedValue({ ...PLAYER, wins: 40, losses: 20, draws: 0 });   // 60 games
    show();
    await screen.findByText("Fifty games");
    expect(screen.queryByText("A hundred games")).toBe(null);
  });

  it("shows nothing at all for a handle that has finished nothing", async () => {
    profile.mockResolvedValue({ ...PLAYER, wins: 0, losses: 0, draws: 0, createdAt: Date.now() });
    show();
    await screen.findByText("Ixchel");
    expect(screen.queryByText(/games$/)).toBe(null);
    expect(screen.queryByText(/Settled rank/)).toBe(null);
  });

  it("says what each badge measures, so a stranger can check it", async () => {
    profile.mockResolvedValue({ ...PLAYER, wins: 40, losses: 20 });   // 60 games
    show();
    const badge = await screen.findByText("Fifty games");
    expect(badge.closest("li").getAttribute("title")).toMatch(/finished fifty games/i);
  });

  it("shows only the highest of a tier, not the whole staircase", async () => {
    profile.mockResolvedValue({ ...PLAYER, wins: 300, losses: 250 });
    show();
    await screen.findByText("Five hundred games");
    for (const beaten of ["First game", "Ten games", "Fifty games", "A hundred games"]) {
      expect(screen.queryByText(beaten), beaten).toBe(null);
    }
  });
});
