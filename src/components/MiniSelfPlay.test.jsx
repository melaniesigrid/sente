// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup, screen } from "@testing-library/react";
import { pointLabel } from "../engine/index.js";
import { setMotion } from "./domStubs.js";

/* ----------------------- THE DEMO BOARD, WIRED UP -----------------------
   The loop itself is pure and tested next door in selfPlay.test.js. What is
   left here is everything that only happens in a browser, and all of it is
   about the second player: the human network answers on a promise, and a
   promise can come back empty, come back broken, or come back after the board
   it was asked about has been taken off the screen.

   None of that can be read off the source with confidence, so the network is
   replaced by a promise the test holds the ends of, and the board is rendered.
   The heuristic underneath is left real: it is the fallback under test, and a
   mock of it would prove only that the mock works. */

const ready = vi.fn(() => true);
const choose = vi.fn();

vi.mock("../engine/index.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    modelReady: () => ready(),
    kataChooseMoveForRecord: (...args) => choose(...args),
  };
});

const { MiniSelfPlay } = await import("./MiniSelfPlay.jsx");

const SIZE = 9;
const PAIR = {
  b: { persona: { id: "one", name: "One" }, rank: "5k" },
  w: { persona: { id: "two", name: "Two" }, rank: "2d" },
};

const stones = (container) => container.querySelectorAll(".stone-b, .stone-w").length;
/** One tick of the demo clock, with whatever the network promised settled. */
const tick = async (times = 1) => {
  for (let i = 0; i < times; i++) await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
};

beforeEach(() => {
  vi.useFakeTimers();
  setMotion(false);
  ready.mockReset();
  ready.mockReturnValue(true);
  choose.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("the demo board and the network", () => {
  it("plays the move the network chose, at the point it chose", async () => {
    choose.mockResolvedValue({ move: [4, 4] });
    render(<MiniSelfPlay size={SIZE} players={PAIR} />);
    await tick();
    expect(screen.getByLabelText(`${pointLabel(SIZE, 4, 4)}, black stone`)).toBeTruthy();
  });

  it("says which engine is playing before it has played anything", async () => {
    choose.mockResolvedValue({ move: [4, 4] });
    const onSource = vi.fn();
    render(<MiniSelfPlay size={SIZE} players={PAIR} onSource={onSource} />);
    expect(onSource).toHaveBeenCalledWith("kata");
  });

  it("asks at the rank the seat is playing at, and swaps seats each move", async () => {
    choose.mockResolvedValueOnce({ move: [4, 4] }).mockResolvedValueOnce({ move: [2, 2] });
    render(<MiniSelfPlay size={SIZE} players={PAIR} />);
    await tick(2);
    expect(choose.mock.calls[0][1].rank).toBe("5k");   // Black's seat
    expect(choose.mock.calls[1][1].rank).toBe("2d");   // White's
  });

  it("does not ask a second time while the first answer is still coming", async () => {
    choose.mockReturnValue(new Promise(() => {}));     // never answers
    const { container } = render(<MiniSelfPlay size={SIZE} players={PAIR} />);
    await tick(3);
    expect(choose).toHaveBeenCalledTimes(1);
    expect(stones(container)).toBe(0);
  });

  it("plays the heuristic's move when the network has no answer", async () => {
    choose.mockResolvedValue(null);
    const { container } = render(<MiniSelfPlay size={SIZE} players={PAIR} />);
    await tick();
    expect(stones(container), "a board that stops is a board nobody watches").toBe(1);
  });

  it("keeps playing when the network throws rather than freezing", async () => {
    choose.mockRejectedValue(new Error("the worker died"));
    const { container } = render(<MiniSelfPlay size={SIZE} players={PAIR} />);
    await tick(2);
    expect(stones(container)).toBe(2);
  });

  /* The credit is the point of the whole feature: it may not go on naming two
     house players and a network once the heuristic has taken over the game. */
  it("takes the network's name off the board when the network stops answering", async () => {
    choose.mockRejectedValue(new Error("the worker died"));
    const onSource = vi.fn();
    render(<MiniSelfPlay size={SIZE} players={PAIR} onSource={onSource} />);
    expect(onSource).toHaveBeenLastCalledWith("kata");
    await tick();
    expect(onSource, "the line under the board has to stop saying KataGo").toHaveBeenLastCalledWith("heuristic");
  });

  it("does the same when the network declines rather than fails", async () => {
    choose.mockResolvedValue(null);
    const onSource = vi.fn();
    render(<MiniSelfPlay size={SIZE} players={PAIR} onSource={onSource} />);
    await tick();
    expect(onSource).toHaveBeenLastCalledWith("heuristic");
  });

  it("says it once, not once a move", async () => {
    choose.mockResolvedValue(null);
    const onSource = vi.fn();
    render(<MiniSelfPlay size={SIZE} players={PAIR} onSource={onSource} />);
    await tick(4);
    expect(onSource.mock.calls.map(c => c[0])).toEqual(["kata", "heuristic"]);
  });

  it("gives up on a question that never comes back, and says so", async () => {
    choose.mockReturnValue(new Promise(() => {}));   // never answers
    const onSource = vi.fn();
    const { container } = render(<MiniSelfPlay size={SIZE} players={PAIR} onSource={onSource} />);
    await tick(2);
    expect(stones(container), "still waiting, patiently").toBe(0);
    // Past PATIENCE_MS the board stops waiting: the heuristic plays on.
    await tick(6);
    expect(onSource).toHaveBeenLastCalledWith("heuristic");
    expect(stones(container), "a dead worker may not freeze the board").toBeGreaterThan(0);
  });

  it("never touches the network when the model is not in memory", async () => {
    ready.mockReturnValue(false);
    const onSource = vi.fn();
    const { container } = render(<MiniSelfPlay size={SIZE} players={PAIR} onSource={onSource} />);
    await tick(2);
    expect(choose, "a decoration may not cost somebody a 54MB download").not.toHaveBeenCalled();
    expect(onSource).toHaveBeenCalledWith("heuristic");
    expect(stones(container)).toBe(2);
  });

  /* The clock is the expensive half now: every tick is a third of a second of
     wasm in the worker a real game shares. A dashboard left open behind another
     tab may not go on asking. */
  it("stops asking while the tab is in the background, and picks up again", async () => {
    // A fresh point each time: the same one twice is an illegal move, which the
    // loop treats as a pass, and a pass puts no stone down to count.
    let n = 0;
    choose.mockImplementation(() => Promise.resolve({ move: [n % SIZE, Math.floor(n++ / SIZE)] }));
    const hide = (hidden) => {
      Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
      act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    };
    const { container } = render(<MiniSelfPlay size={SIZE} players={PAIR} />);
    await tick();
    const played = stones(container);
    expect(played).toBe(1);

    hide(true);
    await tick(3);
    expect(stones(container), "a board nobody can see may not burn a core").toBe(played);

    hide(false);
    await tick();
    expect(stones(container)).toBeGreaterThan(played);
  });

  it("is the heuristic when nobody handed it players at all", async () => {
    const onSource = vi.fn();
    const { container } = render(<MiniSelfPlay size={SIZE} onSource={onSource} />);
    await tick();
    expect(onSource).toHaveBeenCalledWith("heuristic");
    expect(choose).not.toHaveBeenCalled();
    expect(stones(container)).toBe(1);
  });

  /* The two guards that make a late answer safe. Deleting either one left this
     suite green until these went in: the unmount case only counted calls, and
     the stale-frame case -- an answer about a position the board has already
     moved past -- was never exercised at all. Both assert the board instead. */
  it("does not play an answer about a position the board has moved past", async () => {
    let answer;
    // The first question never resolves; the board is meanwhile stepped on by
    // hand, which is what a size change or a restart does underneath a tick.
    choose.mockReturnValueOnce(new Promise(res => { answer = res; }));
    const { container, rerender } = render(<MiniSelfPlay size={SIZE} players={PAIR} />);
    await tick();
    expect(choose).toHaveBeenCalledTimes(1);
    expect(stones(container)).toBe(0);

    // A different board is a different game: the frame the question was asked
    // about is gone.
    choose.mockReturnValue(new Promise(() => {}));
    rerender(<MiniSelfPlay size={13} players={PAIR} />);
    await act(async () => {});
    const before = stones(container);

    await act(async () => { answer({ move: [4, 4] }); await Promise.resolve(); });
    expect(stones(container), "a stale answer may not land on the new board").toBe(before);
  });

  it("stops asking once it has been taken off the screen", async () => {
    let answer;
    choose.mockReturnValue(new Promise(res => { answer = res; }));
    const { container, unmount } = render(<MiniSelfPlay size={SIZE} players={PAIR} />);
    await tick();
    unmount();
    // The answer arrives after the board is gone: nothing may be set on it,
    // and nothing may be drawn on what is left behind.
    await act(async () => { answer({ move: [4, 4] }); await Promise.resolve(); });
    await tick(2);
    expect(choose).toHaveBeenCalledTimes(1);
    expect(container.innerHTML, "nothing may be drawn back into a board that is gone").toBe("");
  });

  it("does not hand a caller a fresh callback the power to restart the game", async () => {
    choose.mockResolvedValue({ move: [4, 4] });
    const { container, rerender } = render(<MiniSelfPlay size={SIZE} players={PAIR} onSource={() => {}} />);
    await tick();
    rerender(<MiniSelfPlay size={SIZE} players={PAIR} onSource={() => {}} />);
    await act(async () => {});
    expect(stones(container), "the stone played is still there").toBe(1);
  });
});
