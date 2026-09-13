// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";

/* ----------------------- THE SEARCH BOX, DRAWN -----------------------
   What the box SAYS is settled in finding.test.js, which is pure. This is
   about the component, and there are four things it can get wrong that reading
   the source will not catch.

   The first is asking at all. A search box that calls the server on every
   keystroke is eight requests for one handle, on a Worker with ten
   milliseconds an invocation.

   The second is asking too early. One letter would answer with a slice of the
   membership in alphabetical order, so the box must refuse to send it rather
   than trust the server to refuse it.

   The third is the stale answer: type `an`, keep typing, and the four people
   called An- must not be on screen under a box that now reads `anastasia`.

   The fourth is the muddle between "nobody by that name" and "nothing has been
   asked yet", which render identically if the component only keeps the list. */

const find = vi.fn();
const presence = vi.fn();

vi.mock("../net/api.js", () => ({
  api: {
    find: (...a) => find(...a),
    presence: (...a) => presence(...a),
  },
  serverEnabled: () => true,
  SERVER_URL: "https://server.test",
}));

const { FindCard } = await import("./FindCard.jsx");

const ACCOUNT = { token: "t", player: { id: "p_me", name: "Me" } };
const EMPTY_BOOK = { friends: [], incoming: [], outgoing: [] };
const FRIENDS = { book: EMPTY_BOOK, busy: null, act: vi.fn(), refresh: vi.fn() };
const person = (id, name) => ({
  id, name, tint: "eucalyptus", rating: 900, rd: 80, wins: 3, losses: 1, draws: 0, avatarAt: null,
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  find.mockReset();
  presence.mockReset();
  presence.mockResolvedValue({ online: [] });
  find.mockResolvedValue({ people: [] });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

const show = () => render(<FindCard account={ACCOUNT} go={() => {}} friends={FRIENDS} />);
const box = () => screen.getByLabelText(/find a player by handle/i);
const type = (value) => fireEvent.change(box(), { target: { value } });
/** Past the pause the box waits for, so the call it decided to make is made. */
const settle = async () => { await vi.advanceTimersByTimeAsync(400); };

describe("before anything is typed", () => {
  it("says what the box is for rather than showing an empty result", () => {
    show();
    expect(screen.getByText(/two letters of a handle is enough/i)).toBeTruthy();
    expect(screen.queryByText(/nobody here answers/i)).toBe(null);
  });

  it("asks the server nothing", async () => {
    show();
    await settle();
    expect(find).not.toHaveBeenCalled();
  });
});

describe("one letter", () => {
  it("asks for another rather than sending it", async () => {
    show();
    type("a");
    await settle();
    expect(find).not.toHaveBeenCalled();
    expect(screen.getByText(/two letters, at least/i)).toBeTruthy();
  });

  it("does not send punctuation padded out to look like two characters", async () => {
    show();
    type("a-");
    await settle();
    expect(find).not.toHaveBeenCalled();
  });
});

describe("a handle worth asking about", () => {
  it("waits for a pause in the typing and then asks once", async () => {
    show();
    type("a");
    type("an");
    type("ana");
    expect(find).not.toHaveBeenCalled();
    await settle();
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith("t", "ana");
  });

  it("asks with the folded handle, the way the server holds it", async () => {
    show();
    type("José");
    await settle();
    expect(find).toHaveBeenCalledWith("t", "jose");
  });

  it("draws everybody it found", async () => {
    find.mockResolvedValue({ people: [person("p_1", "Ana"), person("p_2", "Anabel")] });
    show();
    type("ana");
    await settle();
    await waitFor(() => expect(screen.getByText("Ana")).toBeTruthy());
    expect(screen.getByText("Anabel")).toBeTruthy();
  });

  it("offers to ask each of them, without leaving the search", async () => {
    find.mockResolvedValue({ people: [person("p_1", "Ana")] });
    show();
    type("ana");
    await settle();
    await waitFor(() => expect(screen.getByText("Ana")).toBeTruthy());
    expect(screen.getByRole("button", { name: /add friend/i })).toBeTruthy();
  });

  it("says nobody answers to it, and says so only once the answer is in", async () => {
    let answer;
    find.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
    show();
    type("zzz");
    await settle();
    expect(screen.queryByText(/nobody here answers/i)).toBe(null);
    expect(screen.getByText(/looking/i)).toBeTruthy();
    answer({ people: [] });
    await waitFor(() => expect(screen.getByText(/nobody here answers/i)).toBeTruthy());
  });

  it("says the server is out of reach when the request fails", async () => {
    find.mockRejectedValueOnce(new Error("offline"));
    show();
    type("ana");
    await settle();
    await waitFor(() => expect(screen.getByText(/server is out of reach/i)).toBeTruthy());
    expect(screen.queryByText(/nobody here answers/i)).toBe(null);
  });
});

describe("an answer that arrives late", () => {
  it("is never painted under a box that has moved on", async () => {
    find.mockImplementation((_token, q) => (q === "an"
      ? new Promise((resolve) => setTimeout(() => resolve({ people: [person("p_1", "Ana")] }), 900))
      : Promise.resolve({ people: [person("p_9", "Anastasia")] })));
    show();
    type("an");
    await settle();
    type("anastasia");
    await settle();
    await waitFor(() => expect(screen.getByText("Anastasia")).toBeTruthy());
    await vi.advanceTimersByTimeAsync(1500);
    expect(screen.queryByText("Ana")).toBe(null);
    expect(screen.getByText("Anastasia")).toBeTruthy();
  });

  it("clears stale rows when the query is shortened, before repeating it", async () => {
    let second;
    find
      .mockResolvedValueOnce({ people: [person("p_1", "Ana")] })
      .mockImplementationOnce(() => new Promise((resolve) => { second = resolve; }));

    show();
    type("ana");
    await settle();
    await waitFor(() => expect(screen.getByText("Ana")).toBeTruthy());

    type("a");
    await settle();
    await waitFor(() => expect(screen.queryByText("Ana")).toBe(null));

    type("ana");
    await settle();
    expect(screen.queryByText("Ana")).toBe(null);
    expect(screen.getByText(/looking/i)).toBeTruthy();

    second({ people: [person("p_9", "Anastasia")] });
    await waitFor(() => expect(screen.getByText("Anastasia")).toBeTruthy());
  });
});
