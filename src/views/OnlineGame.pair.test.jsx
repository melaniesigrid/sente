// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { createGame, play, resign } from "../engine/index.js";

/* ----------------------- THE PARTNER, INTERRUPTED -----------------------
   A pair table runs the partner's moves in this browser. While the network is
   reading, anything can happen around it: the socket drops, somebody resigns,
   a move lands. The answer it was preparing is then thrown away - and the
   table used to keep both the "thinking" flag and its claim on the position.
   The flag drew "thinking" for a seat that no longer existed once the game had
   ended, which threw; the claim made a reconnect believe the position had been
   answered, so the partner never moved again. */

const sockets = [];
const gameSocket = vi.fn((id, token, handlers) => {
  const sock = { id, token, handlers, send: vi.fn(() => true), close: vi.fn() };
  sockets.push(sock);
  return sock;
});
vi.mock("../net/api.js", () => ({
  gameSocket: (...a) => gameSocket(...a),
  SERVER_URL: "https://server.test",
  serverEnabled: () => false,
  api: { me: () => Promise.resolve(null) },
}));
vi.mock("../store/account.js", () => ({
  loadAccount: () => ({ token: "t".repeat(64), player: { id: "p_me", name: "Me" } }),
  saveAccount: () => true,
}));
vi.mock("../components/sound.js", () => ({
  playStone: () => {}, playCapture: () => {}, playBell: () => {}, haptic: () => {},
}));
// The network is asked and never answers until a test says so.
const asks = [];
vi.mock("../engine/index.js", async (orig) => ({
  ...(await orig()),
  kataChooseMoveForRecord: vi.fn(() => new Promise((res) => { asks.push(res); })),
  loadModel: () => Promise.resolve(),
  modelReady: () => true,
}));
Element.prototype.scrollIntoView = () => {};

const { OnlineGame } = await import("./OnlineGame.jsx");

const who = (id, name) => ({ id, name, tint: "clay", rating: 900, avatarAt: null });
const SEATS = {
  b1: who("p_me", "Me"), w1: who("p_you", "Ixchel"),
  b2: { ...who("bot_b", "Hoshi"), bot: true, rank: "5k" }, w2: { ...who("bot_w", "Tetsu"), bot: true, rank: "5k" },
};
// Two moves in: b1 and w1 have played, so the partner on b2 is to move.
const twoIn = () => play(play(createGame({ size: 9 }), 2, 2), 6, 6);
const room = (record) => ({
  id: "g1", seats: SEATS, record, chat: [], pair: true, undo: null, accepted: null, settled: false, rated: false,
});

const sock = () => sockets[sockets.length - 1];
const push = (frame) => act(() => { sock().handlers.onFrame(frame); });
const status = (s) => act(() => { sock().handlers.onStatus(s); });

beforeEach(() => { sockets.length = 0; asks.length = 0; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const sitDown = () => {
  render(<OnlineGame gameId="g1" onExit={() => {}} profile={{ sound: false, rating: 1200 }} notify={() => {}} />);
  status("open");
  push({ t: "state", room: room(twoIn()) });
  push({ t: "seat", seat: "b1", runs: ["b2"], watching: 0 });
};

describe("a partner interrupted while reading", () => {
  it("draws the finished game, not a crash, when somebody resigns mid-thought", () => {
    sitDown();
    expect(asks, "the partner was asked").toHaveLength(1);
    push({ t: "state", room: room(resign(twoIn(), "w")) });
    expect(screen.queryByText(/thinking/i), "nobody is thinking at a finished table").toBeNull();
  });

  it("asks again after a dropped connection, instead of waiting for ever", async () => {
    sitDown();
    expect(asks).toHaveLength(1);
    status("closed");
    status("open");
    expect(asks, "the same position is asked again").toHaveLength(2);
    await act(async () => { asks[1]({ move: [4, 4] }); });
    expect(sock().send).toHaveBeenCalledWith({ t: "play", c: 4, r: 4 });
  });
});
