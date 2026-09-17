// @vitest-environment jsdom
/* The record room is three screens deep and no deeper: a shelf of three matches, a
   page for one game, and the game itself in Review's own room. This file walks that
   path the way a reader does, because the three levels are one piece of state and a
   wrong turn between them is not visible to any test of the lines.

   Two of the things checked here are promises rather than behaviour. The shelf says
   out loud that the studies are English and that the analysis is Joseki's own, and
   both of those sentences are on the first screen a reader sees. And the room the
   game is walked in opens at move one rather than at the end: a game you have never
   seen is read forwards. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { MATCHES, ALL_GAMES, gameById } from "../content/famous/index.js";

vi.mock("../net/api.js", () => ({ serverEnabled: () => false }));
vi.mock("../store/account.js", () => ({ loadAccount: () => null }));
vi.mock("../components/WinGraph.jsx", () => ({ WinGraph: () => null }));
vi.mock("./useAnalysis.js", () => ({
  useAnalysis: () => ({ points: [], running: false, done: 0, total: 0, start: () => {}, stop: () => {} }),
  remainingText: () => "",
}));

const { FamousView } = await import("./Famous.jsx");

afterEach(cleanup);

const scrub = () => document.querySelector(".review-scrub");

describe("the shelf", () => {
  it("puts every game of every match on a card", () => {
    render(<FamousView />);
    expect(document.querySelectorAll(".fm-card").length).toBe(ALL_GAMES.length);
    for (const m of MATCHES) expect(screen.getByText(m.title)).toBeTruthy();
  });

  it("says whose words these are before a reader opens one", () => {
    render(<FamousView />);
    const notice = document.querySelector(".fm-notice").textContent;
    expect(notice, "that the studies are not translated").toMatch(/not translated/i);
    expect(notice, "and that the analysis is the house's own").toMatch(/copyright/i);
  });

  it("is what a game id nobody has heard of falls back to", () => {
    render(<FamousView gameId="no-such-game" />);
    expect(document.querySelectorAll(".fm-card").length).toBe(ALL_GAMES.length);
    expect(document.querySelector(".fm-page")).toBeNull();
  });
});

describe("one game's page", () => {
  it("opens from its card, with the facts and the chapters on it", () => {
    render(<FamousView />);
    fireEvent.click(screen.getByText(gameById("lee-sedol-2").title).closest("button"));
    const page = document.querySelector(".fm-page");
    expect(page).toBeTruthy();
    expect(page.textContent).toContain("AlphaGo (black) against Lee Sedol (white)");
    expect(document.querySelectorAll(".fm-chapters li").length)
      .toBe(gameById("lee-sedol-2").phases.length);
  });

  it("is what an id in the address opens straight to", () => {
    render(<FamousView gameId="lee-sedol-4" />);
    expect(document.querySelector(".fm-page").textContent).toContain(gameById("lee-sedol-4").title);
  });

  /* Which game is open belongs to the shell, so going back is a navigation rather
     than a local state flip: the screen asks, and the shelf arrives when the shell
     hands back a null gameId. Anything else would let the address and the screen
     disagree, which is how the nav button came to be dead inside a game. */
  it("asks the shell for the shelf rather than swapping itself out", () => {
    const go = vi.fn();
    render(<FamousView gameId="lee-sedol-4" go={go} />);
    fireEvent.click(screen.getByText("All games"));
    expect(go).toHaveBeenCalledWith("famous");
  });

  it("shows the shelf once the shell says no game is open", () => {
    const go = vi.fn();
    const { rerender } = render(<FamousView gameId="lee-sedol-4" go={go} />);
    expect(document.querySelector(".fm-page")).not.toBeNull();
    rerender(<FamousView gameId={null} go={go} />);
    expect(document.querySelector(".fm-page")).toBeNull();
    expect(document.querySelectorAll(".fm-card").length).toBe(ALL_GAMES.length);
  });

  it("opens a card through the shell, so the address follows the reader", () => {
    const go = vi.fn();
    render(<FamousView go={go} />);
    fireEvent.click(screen.getByText("Move 37"));
    expect(go).toHaveBeenCalledWith("famous", { gameId: "lee-sedol-2" });
  });

  /* With no shell to ask, the screen still works on its own - that is what the
     tests above lean on and what a caller without `go` gets. */
  it("falls back to its own state when nobody hands it a shell", () => {
    render(<FamousView />);
    fireEvent.click(screen.getByText("Move 37"));
    expect(document.querySelector(".fm-page")).not.toBeNull();
    fireEvent.click(screen.getByText("All games"));
    expect(document.querySelectorAll(".fm-card").length).toBe(ALL_GAMES.length);
  });
});

describe("walking it", () => {
  const walk = (id) => {
    render(<FamousView gameId={id} />);
    fireEvent.click(screen.getAllByText("Walk the game")[0]);
  };

  /* A game you have never seen opens at the beginning, and the column beside the
     board says which chapter that is. */
  it("opens the room at the empty board, in the first chapter", () => {
    walk("lee-sedol-2");
    expect(scrub().value).toBe("0");
    expect(document.querySelector(".side").textContent).toMatch(/\(1 of \d+\)/);
  });

  /* The opening line is the record's root comment, so Review prints it under the
     board at move 0 and the side column does not repeat it. One place to look. */
  it("prints the opening under the board and nowhere else", () => {
    walk("lee-sedol-2");
    const opening = gameById("lee-sedol-2").opening.slice(0, 40);
    expect(document.querySelector(".review-note").textContent).toContain(opening);
    expect(document.querySelector(".side").textContent).not.toContain(opening);
  });

  /* What travels when a reader downloads the game: the record is a fact, the notes
     beside it are the Studio's, and the file says so at its head. */
  it("heads the record with where the moves come from and whose the words are", () => {
    walk("lee-sedol-2");
    const note = document.querySelector(".review-note").textContent;
    expect(note).toContain("Game record: public domain");
    expect(note).toContain("Not licensed for reuse");
  });

  it("follows the reader to the move everybody knows, note and chapter together", () => {
    walk("lee-sedol-2");
    fireEvent.change(scrub(), { target: { value: "37" } });
    expect(document.querySelector(".side").textContent).toContain("The move");
    expect(document.body.textContent, "and Review prints the note under the board")
      .toContain(gameById("lee-sedol-2").notes[37].slice(0, 40));
  });

  it("names the hand that placed the stone, in the pair go and only there", () => {
    walk("wuzhen-pair");
    fireEvent.change(scrub(), { target: { value: "1" } });
    expect(document.querySelector(".fm-seat").textContent).toContain("Gu Li");
    fireEvent.change(scrub(), { target: { value: "2" } });
    expect(document.querySelector(".fm-seat").textContent).toContain("Lian Xiao");
    cleanup();
    walk("lee-sedol-2");
    fireEvent.change(scrub(), { target: { value: "1" } });
    expect(document.querySelector(".fm-seat")).toBeNull();
  });

  it("comes back out of the room to the page it was opened from", () => {
    walk("lee-sedol-4");
    expect(scrub()).toBeTruthy();
    fireEvent.click(screen.getByText("Back"));
    expect(document.querySelector(".review-scrub")).toBeNull();
    expect(document.querySelector(".fm-page").textContent).toContain(gameById("lee-sedol-4").title);
  });
});
