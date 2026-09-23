// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { Dock } from "./Dock.jsx";

/* ----------------------- THE DOCK'S ONE PROMISE -----------------------
   Opening the panel must not disturb what is underneath it.

   The brief asked for this in a parenthesis — "one must be able to be in a game
   and see the incoming chats without exiting the page (if one likes)" — and it
   is the kind of promise that is easy to make structurally and easy to break by
   accident later. A screen that unmounts a live board tears down its game
   socket and stutters its clock, and it does it silently: nothing throws, the
   board simply reappears a moment later having lost its place.

   Mounting the dock as a sibling of the router's output is what makes the
   promise true. This file is what keeps it true. It counts mounts of a stand-in
   for the board and asserts the count does not move while the dock opens,
   closes, and changes tab.

   A comment saying "this does not remount the board" would be a claim. This is
   the same claim, checkable. */

vi.mock("../net/api.js", () => ({
  api: { roll: () => new Promise(() => {}) },      // never settles: no roll in the way
  serverEnabled: () => false,
  SERVER_URL: "https://server.test",
}));

let mounts = 0;
/** Stands in for a live board: counts how many times it has been mounted. */
function BoardStandIn() {
  const first = useRef(true);
  if (first.current) { mounts += 1; first.current = false; }
  return <div data-testid="board">a board with a clock running</div>;
}

/** The shell, in the shape App puts it in: the dock is a SIBLING of the
 *  router's output and never a parent or a child of it. */
function Shell() {
  return (
    <>
      <main><BoardStandIn /></main>
      <Dock account={null} go={() => {}} view="play" />
    </>
  );
}

beforeEach(() => { mounts = 0; });
afterEach(() => cleanup());

describe("opening the dock", () => {
  it("does not remount what is underneath it", () => {
    render(<Shell />);
    expect(mounts).toBe(1);

    const handle = screen.getByRole("button", { name: /side panel/i });
    fireEvent.click(handle);                 // open
    fireEvent.click(handle);                 // closed again
    fireEvent.click(handle);                 // open again

    // THE ASSERTION THE FILE EXISTS FOR.
    expect(mounts).toBe(1);
    expect(screen.getByTestId("board")).toBeTruthy();
  });

  it("does not remount it when the tab inside the dock changes", () => {
    render(<Shell />);
    fireEvent.click(screen.getByRole("button", { name: /side panel/i }));
    fireEvent.click(screen.getByRole("tab", { name: /post/i }));
    fireEvent.click(screen.getByRole("tab", { name: /lately/i }));
    expect(mounts).toBe(1);
  });

  it("tells assistive technology whether it is open", () => {
    render(<Shell />);
    const handle = screen.getByRole("button", { name: /side panel/i });
    expect(handle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(handle);
    expect(handle.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("where it does not appear", () => {
  /* The front door is the one screen somebody reaches before they have chosen
     anything. A panel of other people's games is not an introduction. */
  it("is absent on the landing page", () => {
    render(<Dock account={null} go={() => {}} view="landing" />);
    expect(screen.queryByRole("button", { name: /side panel/i })).toBe(null);
  });

  it("is absent before the stored profile has been read", () => {
    render(<Dock account={null} go={() => {}} view={null} />);
    expect(screen.queryByRole("button", { name: /side panel/i })).toBe(null);
  });
});
