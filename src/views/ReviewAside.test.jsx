// @vitest-environment jsdom
/* Review grew three optional props so a screen that reads a game rather than plays
   one - the famous games shelf - can borrow the room instead of building a second
   one. This file holds the contract on all three, from both sides.

   `openAt` says where the cursor starts. Left out, a game you played still opens at
   its last move, because you were there.

   `autoAnalyse` says whether the win-rate graph starts by itself. Left out, a
   finished game still asks for it without being asked, which is what every screen
   that shipped before this one relies on.

   `aside` is whatever a screen wants in the side column. Review's own reason for
   that column is the conversation at a shared table, and the table still wins: a
   game you are reading with somebody is a conversation first, and a commentary that
   pushed the talk off the screen would be a regression nobody would notice until
   two people were in the room. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { createGame, play, pass, resign } from "../engine/index.js";

vi.mock("../net/api.js", () => ({ serverEnabled: () => false }));
vi.mock("../store/account.js", () => ({ loadAccount: () => null }));
vi.mock("../components/WinGraph.jsx", () => ({ WinGraph: () => null }));

/* The analysis hook is the thing `autoAnalyse` talks to, so this mock keeps what it
   was asked for rather than throwing it away. */
const asked = [];
vi.mock("./useAnalysis.js", () => ({
  useAnalysis: (_record, opts = {}) => {
    asked.push(opts);
    return { points: [], running: false, done: 0, total: 0, start: () => {}, stop: () => {} };
  },
  remainingText: () => "",
}));

const { Review } = await import("./Review.jsx");

/* Two stones and two passes: four positions to stand at, and then a resignation, so
   the game is over rather than waiting to be counted. A resignation is not a
   position, so there are still four. */
const record = () => {
  let rec = createGame({ size: 9 });
  rec = play(rec, 2, 2);
  rec = play(rec, 6, 6);
  rec = pass(rec);
  rec = pass(rec);
  return resign(rec, "w");
};

const scrub = () => document.querySelector(".review-scrub");
const lastAsk = () => asked[asked.length - 1];

afterEach(() => { asked.length = 0; cleanup(); });

describe("where the cursor starts", () => {
  it("opens a game you played at its end, when nobody says otherwise", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} />);
    expect(scrub().value).toBe("4");
  });

  it("opens at the beginning for a game you have never seen", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} openAt={0} />);
    expect(scrub().value).toBe("0");
  });

  it("stands at the move it is handed, and clamps one past either end", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} openAt={2} />);
    expect(scrub().value).toBe("2");
    cleanup();
    render(<Review record={record()} onExit={() => {}} profile={{}} openAt={99} />);
    expect(scrub().value, "no further than the last position").toBe("4");
    cleanup();
    render(<Review record={record()} onExit={() => {}} profile={{}} openAt={-5} />);
    expect(scrub().value, "and no earlier than the empty board").toBe("0");
  });

  it("still walks from wherever it opened", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} openAt={0} />);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(scrub().value).toBe("1");
  });
});

describe("who asks for the graph", () => {
  it("runs the network over a finished game without being asked", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} />);
    expect(lastAsk().auto).toBe(true);
  });

  it("leaves a game still being played alone", () => {
    let rec = createGame({ size: 9 });
    rec = play(rec, 2, 2);
    render(<Review record={rec} onExit={() => {}} profile={{}} />);
    expect(lastAsk().auto).toBe(false);
  });

  it("does not run it over a game somebody opened to read", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} autoAnalyse={false} />);
    expect(lastAsk().auto, "three hundred positions on a phone, unasked").toBe(false);
  });

  it("runs it when a screen asks for it outright", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} autoAnalyse={true} />);
    expect(lastAsk().auto).toBe(true);
  });
});

describe("the side column", () => {
  const aside = (n) => <p className="test-aside">Standing at {n}</p>;

  it("draws what the screen handed it, at the move the reader is on", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} openAt={1} aside={aside} />);
    expect(screen.getByText("Standing at 1")).toBeTruthy();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByText("Standing at 2"), "and follows the walk").toBeTruthy();
  });

  it("has no column at all when no screen wants one", () => {
    render(<Review record={record()} onExit={() => {}} profile={{}} />);
    expect(document.querySelector(".side")).toBeNull();
  });

  /* The regression this file exists for: a table's conversation is not displaced by
     a commentary, whichever screen is doing the handing. */
  it("gives the column back to the conversation at a shared table", () => {
    const shared = {
      move: 1, base: 1, line: [], marks: [], can: true, with: "Bea",
      talk: <p className="test-talk">Bea says hello</p>,
      onMove: vi.fn(), onTry: vi.fn(), onBack: vi.fn(), onMark: vi.fn(), onLeave: vi.fn(),
    };
    render(<Review record={record()} onExit={() => {}} profile={{}} shared={shared} aside={aside} />);
    expect(screen.getByText("Bea says hello")).toBeTruthy();
    expect(document.querySelector(".test-aside"), "and not beside it").toBeNull();
  });
});
