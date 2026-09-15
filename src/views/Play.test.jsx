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

const playScreen = async (size, profile = PROFILE) => {
  localStorage.setItem(LOBBY_KEY, JSON.stringify({ size }));
  await act(async () => {
    render(<PlayView profile={profile} setProfile={() => {}} notify={() => {}} resume={null} />);
    await Promise.resolve(); await Promise.resolve();
  });
};

const onlineCard = () => document.querySelector(".online-card");
const boardPicker = () => screen.getByRole("radiogroup", { name: /board/i });

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("the guided play screen", () => {
  it("starts with only the first decision and no board picker or online lobby", async () => {
    await playScreen(9);
    expect(screen.getByRole("button", { name: /^Human\b/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^AI\b/ })).toBeTruthy();
    expect(screen.queryByRole("radiogroup", { name: /board/i })).toBeNull();
    expect(onlineCard()).toBeNull();
  });

  it("shows the human branch first and only later the board picker and online card", async () => {
    await playScreen(9);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Human\b/ }));
    });
    expect(screen.getByRole("button", { name: /^Online match\b/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Pass & play\b/ })).toBeTruthy();
    expect(screen.queryByRole("radiogroup", { name: /board/i })).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Online match\b/ }));
    });
    expect(boardPicker()).toBeTruthy();
    expect(onlineCard()).toBeTruthy();
    expect(onlineCard().contains(boardPicker()), "the setup owns the board choice now").toBe(false);
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "19×19" }));
    });
    expect(JSON.parse(localStorage.getItem(LOBBY_KEY)).size).toBe(19);
    expect(screen.getAllByRole("radiogroup", { name: /board/i })).toHaveLength(1);
  });

  it("keeps team play off the first step and shows it only inside the human branch", async () => {
    await playScreen(13);
    expect(document.body.textContent).not.toContain("Team play");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Human\b/ }));
    });
    expect(document.body.textContent).toContain("Team play");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Team play\b/ }));
    });
    expect(document.body.textContent).not.toContain("Pass & play");
    expect(onlineCard()).toBeTruthy();
    expect(boardPicker()).toBeTruthy();
    expect(screen.getByRole("button", { name: /rengo/i }).textContent).toContain("13×13");
    expect(screen.getByRole("button", { name: /pair game/i }).textContent).toContain("13×13");
  });

  it("shows ai choices before house players and only reveals them after house play is chosen", async () => {
    await playScreen(19);
    expect(document.querySelectorAll(".persona-card")).toHaveLength(0);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^AI\b/ }));
    });
    expect(onlineCard()).toBeNull();
    expect(screen.getByRole("button", { name: /^House players\b/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Daily duel/i })).toBeTruthy();
    expect(document.querySelectorAll(".persona-card")).toHaveLength(0);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^House players\b/ }));
    });
    expect(document.querySelectorAll(".persona-card").length).toBeGreaterThan(0);
  });

  it("shows the Ke Jie shortcut only for Melanie", async () => {
    await playScreen(19, { ...PROFILE, name: "Melanie" });
    expect(screen.getByRole("button", { name: /^Ke Jie\b/ })).toBeTruthy();
    cleanup();
    await playScreen(19, PROFILE);
    expect(screen.queryByRole("button", { name: /^Ke Jie\b/ })).toBeNull();
  });
});
