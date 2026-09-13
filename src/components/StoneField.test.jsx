// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { createBoard, withStone } from "../engine/index.js";
import { FIELD_N, SETTLED } from "./fieldGame.js";
import { observers, fakeObserver, noObserver, setMotion, setHidden } from "./domStubs.js";

/* ----------------------- THE FIELD, DRAWN -----------------------
   The pure half of the field is tested next door in fieldGame.test.js, and
   that is most of it. What is left is the wiring, and the wiring is where the
   interesting mistakes live: a capture drawn against the board it was captured
   from rather than the one that replaced it, sixty stones lifting off at once
   because a fresh deal was mistaken for a capture, two elements fighting over
   one React key, and an interval that keeps a browser busy behind a tab
   nobody is looking at.

   None of that can be read off the source with confidence, so it is rendered.
   This is the one suite in the project that needs a DOM, which is why the
   environment is named at the top of the file rather than switched on for
   everybody: the other eighty-six files are pure and should stay fast.

   The game is scripted rather than played. The field's own two bots capture
   about once in eight full games -- measured, not guessed -- so a test that
   waited for a real capture would be a test that waited. `advanceField` is
   replaced by a queue of positions the test wrote, and `departed` is left
   alone: it is the thing under test everywhere else, and a mock of it here
   would prove only that the mock works. */

/** A board with these stones on it and nothing else. */
const boardOf = (...stones) => {
  let b = createBoard(FIELD_N);
  for (const [c, r, colour] of stones) b = withStone(b, c, r, colour);
  return b;
};

/** The queue of positions the scripted game hands out, oldest first. */
let queue = [];
/** What `fieldSpent` answers, one answer per call, then `false` for ever. */
let spent = [];
/** Every state `advanceField` was asked to walk forward from. */
let asked = [];

vi.mock("./fieldGame.js", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    advanceField: (state, moves) => {
      asked.push({ n: state.n, moves });
      const next = queue.shift();
      return next || state;
    },
    fieldSpent: () => (spent.length ? spent.shift() : false),
  };
});

/** A state the scripted game can hand back. */
const state = (board, n) => ({ board, ko: null, turn: "w", n, passes: 0 });

/** Render the field and let the seed frame run. */
async function mount() {
  const { StoneField } = await import("./StoneField.jsx");
  const view = render(<StoneField />);
  await act(async () => { await vi.advanceTimersByTimeAsync(20); });
  return view;
}

/** One beat of the clock. */
const beat = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(2700); }); };

const stones = (el) => [...el.querySelectorAll(".fs-stone")];
const leaving = (el) => [...el.querySelectorAll(".fs-stone.leaving")];

beforeEach(() => {
  vi.useFakeTimers();
  queue = []; spent = []; asked = [];
  fakeObserver();
  setMotion(false);
  Object.defineProperty(document, "hidden", { value: false, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.resetModules();
});

describe("the field, on the page", () => {
  it("draws the seeded position and nothing leaving it", async () => {
    const seeded = boardOf([3, 3, "b"], [4, 3, "w"], [15, 15, "b"]);
    queue.push(state(seeded, SETTLED));
    const { container } = await mount();

    expect(stones(container).length).toBe(3);
    expect(leaving(container).length).toBe(0);
    /* The seed is taken in chunks across frames: the point of that arrangement
       is that the work never lands in the same frame as the page's first
       paint, and a chunk that walked the whole game would put it there. */
    expect(asked[0].moves).toBeLessThan(SETTLED);
  });

  it("draws a captured stone on its way off, against the board that replaced it", async () => {
    const before = boardOf([3, 3, "b"], [4, 3, "w"]);
    const after = boardOf([3, 3, "b"], [5, 5, "b"]);
    queue.push(state(before, SETTLED), state(after, SETTLED + 1));
    const { container } = await mount();
    expect(leaving(container).length).toBe(0);

    await beat();

    /* Two standing stones and the white one lifting off, in one frame. The
       capture and the position it belongs to are one piece of state for
       exactly this reason: set apart, a render could land between them and
       draw the departure against the board it departed from. */
    expect(stones(container).length).toBe(3);
    expect(leaving(container).length).toBe(1);
  });

  it("deals a fresh game with nothing leaving, however different it looks", async () => {
    const old = boardOf([3, 3, "b"], [4, 3, "w"], [9, 9, "b"]);
    const fresh = boardOf([15, 15, "w"]);
    queue.push(state(old, SETTLED), state(fresh, SETTLED));
    spent.push(true);          // the game is spent when the next beat comes
    const { container } = await mount();

    await beat();

    /* Sixty stones lifting off at once is not a capture, it is a bug that
       looks like one. A deal is the one beat that compares nothing. */
    expect(stones(container).length).toBe(1);
    expect(leaving(container).length).toBe(0);
  });

  it("keeps a departing stone and a new stone on one point apart", async () => {
    const before = boardOf([7, 7, "w"]);
    const after = boardOf([7, 7, "b"]);       // the same point, the other colour
    queue.push(state(before, SETTLED), state(after, SETTLED + 1));
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = await mount();

    await beat();

    /* Both are drawn, and React never sees two children claiming one key:
       the departing stone is keyed apart from the point it left. */
    expect(stones(container).length).toBe(2);
    expect(leaving(container).length).toBe(1);
    const keyComplaint = warn.mock.calls
      .map(args => String(args[0]))
      .filter(msg => /same key|duplicate key/i.test(msg));
    expect(keyComplaint).toEqual([]);
    warn.mockRestore();
  });

  it("stops playing when the band is scrolled away, and starts again when it is back", async () => {
    queue.push(state(boardOf([3, 3, "b"]), SETTLED));
    for (let i = 0; i < 6; i++) queue.push(state(boardOf([3, 3, "b"], [4 + i, 4, "w"]), SETTLED + 1 + i));
    await mount();
    const atStart = asked.length;

    observers.forEach(o => o.fire(false));
    await beat();
    await beat();
    expect(asked.length, "a field nobody can see costs nothing").toBe(atStart);

    observers.forEach(o => o.fire(true));
    await beat();
    expect(asked.length).toBeGreaterThan(atStart);
  });

  it("stops playing while the tab is hidden", async () => {
    queue.push(state(boardOf([3, 3, "b"]), SETTLED));
    for (let i = 0; i < 4; i++) queue.push(state(boardOf([3, 3, "b"], [5 + i, 5, "w"]), SETTLED + 1 + i));
    await mount();
    const atStart = asked.length;

    setHidden(true);
    document.dispatchEvent(new Event("visibilitychange"));
    await beat();
    expect(asked.length).toBe(atStart);

    setHidden(false);
    document.dispatchEvent(new Event("visibilitychange"));
    await beat();
    expect(asked.length).toBeGreaterThan(atStart);
  });

  it("never opens its clock in a tab that was already in the background", async () => {
    /* visibilitychange only fires on a transition, so a field mounted behind a
       restored session or a middle-clicked link hears nothing and would
       otherwise take `awake` on trust. It has to ask. */
    setHidden(true);
    queue.push(state(boardOf([3, 3, "b"]), SETTLED));
    for (let i = 0; i < 4; i++) queue.push(state(boardOf([3, 3, "b"], [6 + i, 6, "w"]), SETTLED + 1 + i));
    await mount();
    const atStart = asked.length;

    await beat();
    await beat();
    expect(asked.length, "a tab nobody is looking at costs nothing").toBe(atStart);

    setHidden(false);
    document.dispatchEvent(new Event("visibilitychange"));
    await beat();
    expect(asked.length).toBeGreaterThan(atStart);
  });

  it("stops when a reader turns the motion switch on mid-session", async () => {
    /* One list object, the way a browser hands one out: the component keeps
       the object and re-reads `matches` off it, so the stub has to be the
       thing that changes rather than a new object handed out later. */
    const listeners = [];
    const list = {
      matches: false, media: "(prefers-reduced-motion: reduce)", onchange: null,
      addEventListener: (_, fn) => listeners.push(fn),
      removeEventListener() {}, addListener() {}, removeListener() {},
      dispatchEvent: () => false,
    };
    window.matchMedia = () => list;
    queue.push(state(boardOf([3, 3, "b"]), SETTLED));
    for (let i = 0; i < 4; i++) queue.push(state(boardOf([3, 3, "b"], [8 + i, 8, "w"]), SETTLED + 1 + i));
    await mount();
    await beat();
    const running = asked.length;

    /* The switch goes on. The stylesheet has already taken the landing off, so
       a position that kept changing under it would be a jump cut -- worse than
       the animation they asked to be rid of. */
    list.matches = true;
    await act(async () => { listeners.forEach(fn => fn(list)); });
    await beat();
    await beat();
    expect(asked.length).toBe(running);
  });

  it("keeps playing in a browser with no observer at all", async () => {
    noObserver();
    queue.push(state(boardOf([3, 3, "b"]), SETTLED));
    queue.push(state(boardOf([3, 3, "b"], [4, 4, "w"]), SETTLED + 1));
    await mount();
    const atStart = asked.length;

    await beat();

    /* The observer only ever stops the interval. A browser without one plays
       on, which costs a couple of milliseconds a move and is the right way to
       fail: an empty band for ever is the wrong one. */
    expect(asked.length).toBeGreaterThan(atStart);
  });

  it("holds one settled position for a reader who asked for less motion", async () => {
    setMotion(true);
    queue.push(state(boardOf([3, 3, "b"], [4, 3, "w"]), SETTLED));
    queue.push(state(boardOf([9, 9, "b"]), SETTLED + 1));
    const { container } = await mount();
    const atStart = asked.length;

    await beat();
    await beat();

    expect(stones(container).length).toBe(2);
    expect(asked.length, "the position, and not the game").toBe(atStart);
  });

  it("draws every stone with its rim and its light", async () => {
    queue.push(state(boardOf([3, 3, "b"], [4, 3, "w"]), SETTLED));
    const { container } = await mount();

    /* A white stone on a pale ground is the same value as the ground, so the
       rim is not decoration here: without it half the position is a hole in
       the field rather than a stone in it. */
    expect(container.querySelectorAll(".fs-rim").length).toBe(2);
    expect(container.querySelectorAll(".fs-shine").length).toBe(2);
  });
});
