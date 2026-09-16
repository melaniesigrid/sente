// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import { createGame, play } from "../engine/index.js";


/* ----------------------- THE TABLE, DRAWN -----------------------
   What a chat line is made of is settled in tableTalk.test.js, which is pure.
   This is about the four things the view does with those parts, and not one of
   them can be read off the source with any confidence.

   A lit coordinate is a piece of UI state that points at a board. Nothing here
   proves it reaches the board except asking the board; nothing proves it stops
   pointing when the stones move except moving them.

   The etiquette row is the other half. It is offered to the players and not to
   the people watching, and - this is the regression - a line leaves the row the
   instant it is tapped rather than when the server echoes it back. Waiting for
   the echo leaves the button live for a whole round trip, and two taps in that
   window post the same greeting twice. So the test below sends no echo at all. */

const sockets = [];
const gameSocket = vi.fn((id, token, handlers) => {
  const sock = { id, token, handlers, send: vi.fn(() => true), close: vi.fn() };
  sockets.push(sock);
  return sock;
});
const loadAccount = vi.fn(() => null);

vi.mock("../net/api.js", () => ({
  gameSocket: (...a) => gameSocket(...a),
  SERVER_URL: "https://server.test",
  // Review asks whether there is a server, to decide whether the trainer is here.
  serverEnabled: () => false,
}));
vi.mock("../store/account.js", () => ({ loadAccount: () => loadAccount() }));
/* The table makes a noise on every move the server confirms. That is not what
   this suite is about, and jsdom has no speaker to make it on. */
vi.mock("../components/sound.js", () => ({
  playStone: () => {}, playCapture: () => {}, playBell: () => {}, haptic: () => {},
}));

/* The chat log scrolls itself to the bottom on every new line. jsdom has no
   layout and so no such method, and a missing scroll is not a failure. */
Element.prototype.scrollIntoView = () => {};

const { OnlineGame } = await import("./OnlineGame.jsx");

const ACCOUNT = { token: "t".repeat(64), player: { id: "p_me", name: "Me" } };
const SEATS = {
  b1: { id: "p_me", name: "Me", tint: "eucalyptus", rating: 900, avatarAt: null },
  w1: { id: "p_you", name: "Ixchel", tint: "clay", rating: 950, avatarAt: null },
};
const room = (over = {}) => ({
  id: "g1", seats: SEATS, record: createGame({ size: 9 }), chat: [],
  pair: false, undo: null, accepted: null, settled: false, rated: true,
  ...over,
});
const line = (text, over = {}) => ({ from: "p_you", name: "Ixchel", seat: "w1", text, ...over });

const PROFILE = { sound: false, rating: 1200, coordinates: true, lastMoveMark: "dot" };
const show = (props = {}) =>
  render(<OnlineGame gameId="g1" onExit={() => {}} profile={PROFILE} notify={() => {}} {...props} />);

/** The one socket this render opened, and the frames pushed down it. */
const sock = () => sockets[sockets.length - 1];
const push = (frame) => act(() => { sock().handlers.onFrame(frame); });
const open = () => act(() => { sock().handlers.onStatus("open"); });
/** Everything this browser has said, as the server would have received it. */
const chatFrames = () => sock().send.mock.calls.map(([f]) => f).filter(f => f.t === "chat");

beforeEach(() => {
  sockets.length = 0;
  gameSocket.mockClear();
  loadAccount.mockReset();
  loadAccount.mockReturnValue(ACCOUNT);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("a coordinate somebody typed", () => {
  it("lights the point it names, and unlights it when tapped again", () => {
    const { container } = show();
    open();
    push({ t: "state", room: room({ chat: [line("the cut at D4 was the whole game")] }) });
    push({ t: "seat", seat: "b1", runs: [], watching: 0 });

    const coord = screen.getByRole("button", { name: "D4", pressed: false });
    expect(container.querySelectorAll(".point-ring").length, "nothing is lit yet").toBe(0);
    fireEvent.click(coord);
    expect(container.querySelectorAll(".point-ring").length, "D4 is ringed").toBe(1);
    // The same button offers the way back out, and says so as a pressed toggle.
    fireEvent.click(screen.getByRole("button", { name: "D4", pressed: true }));
    expect(container.querySelectorAll(".point-ring").length).toBe(0);
  });

  /* A sentence at a go table is usually about a stone that is already there,
     and an SVG has no z-index: a ring drawn before the stones is a ring nobody
     ever sees. This is the case the feature exists for. */
  it("rings a point that already has a stone on it", () => {
    const played = room({ chat: [line("the cut at D4 was the whole game")] });
    // D4 on 9x9 is column 3, row 5; put a stone there before anybody talks.
    played.record.board.cells[5 * 9 + 3] = "b";
    const { container } = show();
    open();
    push({ t: "state", room: played });
    fireEvent.click(screen.getByRole("button", { name: "D4", pressed: false }));
    expect(container.querySelectorAll(".point-ring").length, "the ring is drawn").toBe(1);
    const svg = container.querySelector(".goban");  // the board, not a Lucide icon
    const nodes = [...svg.querySelectorAll("circle")];
    const ring = nodes.findIndex(e => e.classList.contains("point-ring"));
    const stone = nodes.findIndex(e => e.classList.contains("stone-b"));
    expect(ring, "and painted after the stone, not under it").toBeGreaterThan(stone);
  });

  it("rings every distinct point one line names, and no others", () => {
    const { container } = show();
    open();
    push({ t: "state", room: room({ chat: [line("D4 or E5, but not D4 twice")] }) });
    fireEvent.click(screen.getAllByRole("button", { name: "D4" })[0]);
    expect(container.querySelectorAll(".point-ring").length, "two points, said three times").toBe(2);
  });

  /* One line at a time: two lit lines would put rings on the board with no way
     to tell which sentence meant which. */
  it("moves the light to the second line rather than lighting both", () => {
    const { container } = show();
    open();
    push({ t: "state", room: room({ chat: [line("D4"), line("E5 and F6", { text: "E5 and F6" })] }) });
    fireEvent.click(screen.getByRole("button", { name: "D4", pressed: false }));
    fireEvent.click(screen.getByRole("button", { name: "E5" }));
    expect(container.querySelectorAll(".point-ring").length, "only the second line is lit").toBe(2);
    expect(screen.getByRole("button", { name: "D4", pressed: false })).toBeTruthy();
  });

  it("keeps the light on the exact duplicate line that was tapped", () => {
    show();
    open();
    const at = 1234567890;
    push({ t: "state", room: room({ chat: [line("D4", { at }), line("D4", { at })] }) });
    const coords = screen.getAllByRole("button", { name: "D4" });
    fireEvent.click(coords[1]);
    expect(coords[0].getAttribute("aria-pressed")).toBe("false");
    expect(coords[1].getAttribute("aria-pressed")).toBe("true");
  });

  /* A ring points at a board, so it means nothing the moment the stones move. */
  it("goes out when the board changes underneath it", () => {
    const { container } = show();
    open();
    const first = room({ chat: [line("the cut at D4 was the whole game")] });
    push({ t: "state", room: first });
    fireEvent.click(screen.getByRole("button", { name: "D4", pressed: false }));
    expect(container.querySelectorAll(".point-ring").length).toBe(1);

    const moved = { ...first, record: play(first.record, 4, 4) };
    push({ t: "state", room: moved });
    expect(container.querySelectorAll(".point-ring").length, "the stones moved, the ring went").toBe(0);
  });

  it("goes out when the game stops being a game and starts being a count", () => {
    const { container } = show();
    open();
    const first = room({ chat: [line("D4 is dead surely")] });
    push({ t: "state", room: first });
    fireEvent.click(screen.getByRole("button", { name: "D4", pressed: false }));
    push({ t: "state", room: { ...first, record: { ...first.record, phase: "scoring" } } });
    expect(container.querySelectorAll(".point-ring").length).toBe(0);
  });
});

describe("the etiquette row", () => {
  it("is offered to somebody who is sitting at the table", () => {
    show();
    open();
    push({ t: "state", room: room() });
    push({ t: "seat", seat: "b1", runs: [], watching: 0 });
    expect(screen.getByRole("button", { name: /^Have a good game/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Onegaishimasu/ })).toBeTruthy();
  });

  /* The greeting is between the players. Somebody who wandered in to watch is
     not owed a button that says it for them. */
  it("is not offered to somebody who is only watching", () => {
    show();
    open();
    push({ t: "state", room: room() });
    push({ t: "seat", seat: null, runs: [], watching: 3 });
    expect(screen.queryByRole("button", { name: /^Have a good game/ })).toBe(null);
    expect(screen.queryByRole("button", { name: /^Onegaishimasu/ })).toBe(null);
  });

  it("sends the line as a chat frame, exactly as it is written on the button", () => {
    show();
    open();
    push({ t: "state", room: room() });
    push({ t: "seat", seat: "b1", runs: [], watching: 0 });
    fireEvent.click(screen.getByRole("button", { name: /^Have a good game/ }));
    expect(chatFrames()).toEqual([{ t: "chat", text: "Have a good game" }]);
  });

  /* Tapping a greeting is not the same act as sending what you were typing, so
     the half-written sentence in the box has to survive it. */
  it("leaves a half-typed message in the box alone", () => {
    show();
    open();
    push({ t: "state", room: room() });
    push({ t: "seat", seat: "b1", runs: [], watching: 0 });
    const input = screen.getByLabelText(/chat message/i);
    fireEvent.change(input, { target: { value: "what happened at D4" } });
    fireEvent.click(screen.getByRole("button", { name: /^Onegaishimasu/ }));
    expect(input.value).toBe("what happened at D4");
    expect(chatFrames()).toEqual([{ t: "chat", text: "Onegaishimasu" }]);
  });

  /* THE REGRESSION. No echo arrives in this test at all: the row is filtered on
     what this browser has sent, not on what the server has repeated back. If the
     view ever waits for the echo again, the button is still on screen here and
     the second tap posts the greeting a second time. */
  it("takes the line off the row the moment it is tapped, with no echo from the server", () => {
    show();
    open();
    push({ t: "state", room: room() });
    push({ t: "seat", seat: "b1", runs: [], watching: 0 });

    const button = screen.getByRole("button", { name: /^Have a good game/ });
    fireEvent.click(button);
    expect(screen.queryByRole("button", { name: /^Have a good game/ }), "gone on the first tap").toBe(null);

    // The impatient second tap, on the button the finger is still over.
    fireEvent.click(button);
    expect(chatFrames(), "one greeting, however many taps").toEqual([{ t: "chat", text: "Have a good game" }]);
    // The other opener is untouched: only the line that was said drops off.
    expect(screen.getByRole("button", { name: /^Onegaishimasu/ })).toBeTruthy();
  });

  it("drops the line the server echoes back too, without offering it twice over", () => {
    show();
    open();
    push({ t: "state", room: room() });
    push({ t: "seat", seat: "b1", runs: [], watching: 0 });
    fireEvent.click(screen.getByRole("button", { name: /^Have a good game/ }));
    push({ t: "chat", msg: line("Have a good game", { from: "p_me", name: "Me", seat: "b1" }) });
    expect(screen.queryByRole("button", { name: /^Have a good game/ })).toBe(null);
    expect(chatFrames().length).toBe(1);
  });
});

/* A line the socket refused was never said. It used to leave the row anyway,
   so a tap during a reconnect cost you the greeting for the rest of the game. */
describe("a greeting the socket would not take", () => {
  it("stays on the row, so it can be said once the line is back", () => {
    show();
    open();
    sockets[sockets.length - 1].send.mockImplementation(() => false);
    push({ t: "state", room: room() });
    push({ t: "seat", seat: "b1", runs: [], watching: 0 });
    fireEvent.click(screen.getByRole("button", { name: /^Have a good game/ }));
    expect(screen.getByRole("button", { name: /^Have a good game/ }),
      "still offered, because it never went").toBeTruthy();
  });

  it("keeps a typed message in the box rather than eating it", () => {
    show();
    open();
    sockets[sockets.length - 1].send.mockImplementation(() => false);
    push({ t: "state", room: room() });
    push({ t: "seat", seat: "b1", runs: [], watching: 0 });
    const box = screen.getByLabelText(/chat message/i);
    fireEvent.change(box, { target: { value: "good shape" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(box.value, "the words are still there to try again").toBe("good shape");
  });
});

/* ----------------------- AFTER THE LAST STONE -----------------------
   The table used to end with the game. What is checked here is that it does
   not: the socket stays open, the invitation is on the result card, and once
   both of them are in the review it is the room that says where the board is
   standing - this screen never moves it on its own. */
describe("the table a finished game leaves behind", () => {
  const finished = (over = {}) => {
    let rec = createGame({ size: 9 });
    rec = play(rec, 2, 2);
    rec = { ...rec, phase: "ended", result: { winner: "b", method: "resign" } };
    return room({ record: rec, ...over });
  };
  const seated = (roomState) => {
    const r = show();
    open();
    push({ t: "state", room: roomState });
    push({ t: "seat", seat: "b1", runs: [], watching: 0 });
    return r;
  };
  const sent = (type) => sock().send.mock.calls.map(([f]) => f).filter(f => f.t === type);

  it("keeps the socket open and offers to read the game back together", () => {
    seated(finished());
    expect(sock().close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Read it back together"));
    expect(sent("reviewAsk")).toHaveLength(1);
  });

  it("asks the other side, and takes their answer", () => {
    seated(finished({ review: { asked: "w1", in: ["w1"], move: 1, base: 1, line: [], marks: [] } }));
    fireEvent.click(screen.getByText("Read it back with Ixchel"));
    expect(sent("reviewJoin")).toHaveLength(1);
    fireEvent.click(screen.getByText("Decline"));
    expect(sent("reviewDecline")).toHaveLength(1);
  });

  it("opens the shared review once this player is in it, and moves nothing itself", () => {
    seated(finished({ review: { asked: null, in: ["b1", "w1"], move: 1, base: 1, line: [], marks: [] } }));
    expect(screen.getByText("Reading it with Ixchel")).toBeTruthy();
    // The conversation came along: this is the table's chat box, in review.
    expect(document.querySelector(".chat-card")).not.toBeNull();
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(sent("reviewMove")).toEqual([{ t: "reviewMove", n: 0 }]);
    expect(document.querySelector(".review-scrub").value, "until the room says so").toBe("1");
  });

  it("leaves by telling the room rather than by closing the screen", () => {
    seated(finished({ review: { asked: null, in: ["b1"], move: 1, base: 1, line: [], marks: [] } }));
    fireEvent.click(screen.getByText("Read it alone"));
    expect(sent("reviewLeave")).toHaveLength(1);
    expect(sock().close).not.toHaveBeenCalled();
  });
});
