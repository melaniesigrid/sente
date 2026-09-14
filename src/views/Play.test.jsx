// @vitest-environment jsdom
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

const PROFILE = { name: "Me", rating: 1200, rd: 60, tint: "eucalyptus", sensei: false };

const playScreen = async (size) => {
  localStorage.setItem(LOBBY_KEY, JSON.stringify({ size }));
  await act(async () => {
    render(<PlayView profile={PROFILE} setProfile={() => {}} notify={() => {}} resume={null} />);
    await Promise.resolve(); await Promise.resolve();
  });
};

const onlineCard = () => document.querySelector(".online-card");
const boardPicker = () => screen.getByRole("radiogroup", { name: /board/i });
const findBtn = () => screen.getByRole("button", { name: /opponent/i });

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("the guided play screen", () => {
  it("starts with one board picker in the guide, not duplicated inside the online card", async () => {
    await playScreen(9);
    expect(boardPicker()).toBeTruthy();
    expect(onlineCard()).toBeTruthy();
    expect(onlineCard().contains(boardPicker()), "the guide owns the board choice now").toBe(false);
    expect(screen.getAllByRole("radiogroup", { name: /board/i })).toHaveLength(1);
  });

  it("changes the board the human-play button names when the guide board is pressed", async () => {
    await playScreen(9);
    expect(findBtn().textContent).toContain("9×9");
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "19×19" }));
    });
    expect(findBtn().textContent).toContain("19×19");
    expect(JSON.parse(localStorage.getItem(LOBBY_KEY)).size).toBe(19);
  });

  it("switches the human branch from normal play to rengo without showing pass-and-play", async () => {
    await playScreen(13);
    expect(document.body.textContent).toContain("Pass & play");
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /rengo/i }));
    });
    expect(document.body.textContent).not.toContain("Pass & play");
    expect(screen.getByRole("button", { name: /rengo/i }).textContent).toContain("13×13");
  });

  it("switches from human play to ai play and then to pair go", async () => {
    await playScreen(19);
    expect(onlineCard()).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "AI" }));
    });
    expect(onlineCard()).toBeNull();
    expect(document.querySelectorAll(".persona-card").length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /rengo/i }));
    });
    expect(document.querySelector(".pair-card")).toBeTruthy();
    expect(document.querySelectorAll(".persona-card")).toHaveLength(0);
  });
});
