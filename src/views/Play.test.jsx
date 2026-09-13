// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";

/* ----------------------- THE PLAY SCREEN'S ONE BOARD -----------------------
   The board an online game is played on used to be settable in exactly one
   place: the table card, three cards below the online card, past the level
   stepper and the duel card and fourteen other controls, under a heading that
   never says the word "online". The wiring was correct the whole time - the
   picker down there did set the board and the button up here did follow it -
   so `OnlineLobby.test.jsx` was green, `Play.jsx` was green, and a player whose
   table happened to read 9x9 still had no way to learn that the 9 was a choice.

   That is the bug this file exists to catch, and it can only be caught here.
   A test that renders the online card alone cannot tell you where the card is
   or what else is on the page with it; `.online-card` is the whole document in
   that test, so "the picker is inside the card" is true by construction. The
   question is about the screen, so the screen is what gets rendered.

   The second case is the wiring itself. `OnlineCard` takes `size` and `setSize`
   with no defaults precisely so that dropping either one fails loudly, but
   nothing proves `Play.jsx` passes them until something renders `Play.jsx`. */

const PLAYER = {
  id: "p_me", name: "Me", tint: "eucalyptus", rating: 1200, rd: 60,
  wins: 0, losses: 0, draws: 0, avatarAt: null, email: "me@example.test", emailVerified: true,
};

vi.mock("../net/api.js", () => ({
  api: {
    me: () => Promise.resolve(PLAYER),
    games: () => Promise.resolve([]),
    signOut: () => Promise.resolve(),
    sendConfirmation: () => Promise.resolve(),
  },
  lobbySocket: () => ({ send: vi.fn(() => true), close: vi.fn() }),
  serverEnabled: () => true,
  SERVER_URL: "https://server.test",
}));
vi.mock("../store/account.js", () => ({
  loadAccount: () => ({ token: "a".repeat(64), player: PLAYER }),
  saveAccount: () => true,
  clearAccount: () => {},
}));

const { PlayView } = await import("./Play.jsx");
const { LOBBY_KEY } = await import("../store/lobby.js");

const PROFILE = { name: "Me", rating: 1200, rd: 60 };

/** The whole Play screen, with the table already set to `size`. */
const playScreen = async (size) => {
  localStorage.setItem(LOBBY_KEY, JSON.stringify({ size }));
  await act(async () => {
    render(<PlayView profile={PROFILE} setProfile={() => {}} notify={() => {}} resume={null} />);
    await Promise.resolve(); await Promise.resolve();
  });
};

const onlineCard = () => document.querySelector(".online-card");
const findBtn = () => screen.getByRole("button", { name: /opponent/i });
/** The board pickers on the screen, in document order: the online card's and
  * the table card's. Named by which card each one is in, never by index. */
const boardPickers = () => [...screen.getAllByRole("radiogroup")]
  .filter(g => /board/i.test(g.getAttribute("aria-label") || ""));

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("the board an online game is played on", () => {
  it("is settable from the card that names it, not only from the table below", async () => {
    await playScreen(9);
    const inCard = boardPickers().filter(g => onlineCard().contains(g));
    expect(inCard.length, "the online card carries a board picker of its own").toBe(1);
    expect(onlineCard().contains(findBtn()), "beside the button it belongs to").toBe(true);
    expect([...inCard[0].querySelectorAll("button")].map(b => b.textContent))
      .toEqual(["9×9", "13×13", "19×19"]);
  });

  /* The half that the card alone cannot prove: that the screen actually hands
     the card a way to write the board back. Drop `setSize` in Play.jsx and the
     picker still renders and still highlights, so only pressing it and reading
     the button again can tell the difference. */
  it("changes the board the button names when the card's picker is pressed", async () => {
    await playScreen(9);
    expect(findBtn().textContent).toContain("9×9");
    const inCard = boardPickers().find(g => onlineCard().contains(g));
    const nineteen = [...inCard.querySelectorAll("button")].find(b => b.textContent === "19×19");
    await act(async () => { fireEvent.click(nineteen); });
    expect(findBtn().textContent, "the button follows the card's own picker").toContain("19×19");
  });

  /* One board, two controls. They are two views of `table.size`, so the table
     card has to agree the moment the online card is touched - otherwise the
     screen holds two answers to one question, which is the thing the old
     single picker at least got right. */
  it("keeps the table card and the online card telling the same story", async () => {
    await playScreen(9);
    const [first, second] = boardPickers();
    expect(boardPickers().length, "one picker per card, and no more").toBe(2);
    const inCard = onlineCard().contains(first) ? first : second;
    const inTable = inCard === first ? second : first;
    const checked = (group) => [...group.querySelectorAll("button")]
      .filter(b => b.getAttribute("aria-checked") === "true").map(b => b.textContent);
    expect(checked(inTable)).toEqual(["9×9"]);
    await act(async () => {
      fireEvent.click([...inCard.querySelectorAll("button")].find(b => b.textContent === "13×13"));
    });
    expect(checked(inCard)).toEqual(["13×13"]);
    expect(checked(inTable), "the table card moved with it").toEqual(["13×13"]);
  });

  /* The board survives a reload, because it is the table's board and the table
     is a device preference. A picker that only moved React state would pass
     every case above and lose the choice the moment the page came back. */
  it("remembers the board the card was left on", async () => {
    await playScreen(9);
    const inCard = boardPickers().find(g => onlineCard().contains(g));
    await act(async () => {
      fireEvent.click([...inCard.querySelectorAll("button")].find(b => b.textContent === "19×19"));
    });
    expect(JSON.parse(localStorage.getItem(LOBBY_KEY)).size).toBe(19);
  });
});
