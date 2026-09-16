// @vitest-environment jsdom
/* The trainer's card is no longer one button. He teaches six ways and which one
   she wants is the real decision at this step, so the card is the man and the
   list under it is the lesson. What each row has to carry is the mode's id, the
   rank the mode puts him at, and - for the teaching game - the stones she starts
   with, because those three are what the game reads back out. The table here is
   a stand-in for `Game`, which reports the seat it was handed instead of playing
   it: the wiring is the thing under test, not the board. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";

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
    invites: () => Promise.resolve({ incoming: [], outgoing: [] }),
    friends: () => Promise.resolve({ friends: [], incoming: [], outgoing: [] }),
    presence: () => Promise.resolve({ online: [] }),
  },
  lobbySocket: () => ({ send: vi.fn(() => true), close: vi.fn() }),
  serverEnabled: () => false,
  SERVER_URL: "https://server.test",
}));
vi.mock("../store/account.js", () => ({
  loadAccount: () => null,
  saveAccount: () => true,
  clearAccount: () => {},
}));
vi.mock("./Game.jsx", () => ({
  Game: ({ mode }) => <div data-testid="seat">{JSON.stringify({
    persona: mode.persona ? mode.persona.id : null,
    rank: mode.rank, handicap: mode.handicap, komi: mode.komi, senseiMode: mode.senseiMode,
  })}</div>,
}));

const { PlayView } = await import("./Play.jsx");
const { LOBBY_KEY } = await import("../store/lobby.js");
const { MODES, SENSEI_ID, trainerRank } = await import("../content/sensei.js");
const { modeRules } = await import("../engine/index.js");
const { rankOf } = await import("../content/rank.js");

const PROFILE = { name: "Me", rating: 1200, rd: 60, tint: "eucalyptus", sensei: true };

/** The play screen, walked as far as his card. His shortcut sits at the first
 *  step and skips the AI chooser: sitting down with him is its own decision. */
const trainerCard = async (profile = PROFILE, lobby = { size: 19 }) => {
  localStorage.setItem(LOBBY_KEY, JSON.stringify(lobby));
  await act(async () => {
    render(<PlayView profile={profile} setProfile={() => {}} notify={() => {}} resume={null} />);
    await Promise.resolve(); await Promise.resolve();
  });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Ke Jie\b/ })); });
};

const seat = () => JSON.parse(screen.getByTestId("seat").textContent);

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("choosing how he teaches", () => {
  it("offers every mode by name, with the rank he will sit at", async () => {
    await trainerCard();
    const rows = document.querySelectorAll(".trainer-mode");
    expect(rows).toHaveLength(MODES.length);
    const shown = [...rows].map((r) => r.textContent);
    for (const m of MODES) {
      const row = shown.find((s) => s.includes(m.name));
      expect(row, m.name).toBeTruthy();
      // The promise is the one thing the mode is for; she chooses on it.
      expect(row, m.name).toContain(m.promise);
      expect(row, m.name).toContain(trainerRank(rankOf(PROFILE.rating), modeRules(m.id).rankStep));
    }
  });

  it("sits down straight away in the mode she picked, at that mode's rank", async () => {
    await trainerCard();
    const spar = [...document.querySelectorAll(".trainer-mode")].find((r) => r.textContent.includes("Spar"));
    await act(async () => { fireEvent.click(spar); });
    const sat = seat();
    expect(sat.persona).toBe(SENSEI_ID);
    expect(sat.senseiMode).toBe("spar");
    expect(sat.rank).toBe(trainerRank(rankOf(PROFILE.rating), modeRules("spar").rankStep));
    // A spar is an even game: only the teaching game puts stones down first.
    expect(sat.handicap).toBe(0);
  });

  it("leaves a handicap set on the lobby table behind when the mode is an even game", async () => {
    /* Five of the six modes declare no stones. Declaring none has to mean zero of
       them, not "whatever the table last had": a handicap left on the lobby table
       from a game against somebody else must not follow her into an even game with
       him, least of all now that his card does not draw the picker to take it back. */
    await trainerCard(PROFILE, { size: 19, handicap: 5 });
    const spar = [...document.querySelectorAll(".trainer-mode")].find((r) => r.textContent.includes("Spar"));
    await act(async () => { fireEvent.click(spar); });
    expect(seat().handicap).toBe(0);
  });

  it("gives her the four stones a teaching game is made of, whatever the table said", async () => {
    // The table's own handicap picker defaults to none, and the mode's stones are
    // the lesson, not a setting: four in front of her or it is not a teaching game.
    await trainerCard();
    const teaching = [...document.querySelectorAll(".trainer-mode")].find((r) => r.textContent.includes("Teaching game"));
    expect(teaching.textContent).toMatch(/4 stones/);
    await act(async () => { fireEvent.click(teaching); });
    const sat = seat();
    expect(sat.senseiMode).toBe("teaching");
    expect(sat.handicap).toBe(modeRules("teaching").handicap);
    // Stones on the board are paid for in komi, or the score is a lie.
    expect(sat.komi).toBeLessThanOrEqual(0.5);
  });

  it("keeps his card shut to a profile that has not unlocked him", async () => {
    await act(async () => {
      render(<PlayView profile={{ ...PROFILE, sensei: false }} setProfile={() => {}} notify={() => {}} resume={null} />);
      await Promise.resolve();
    });
    expect(screen.queryByRole("button", { name: /^Ke Jie\b/ })).toBeNull();
    expect(document.querySelectorAll(".trainer-mode")).toHaveLength(0);
  });
});
