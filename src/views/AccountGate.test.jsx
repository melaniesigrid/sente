// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";

/* ----------------------- THE DOOR, WHEN THERE IS NO SEAT -----------------------
   The beta is a hundred people (`server/beta.js`). What the hundred-and-first
   meets is this card, and there are three things about it that a pure test of
   the cap cannot check and a person would only find by being the
   hundred-and-first:

     the card appears at all, off `/api/stats` and before anybody types;
     the people already in can still get in, because a full beta must not lock
       out the hundred it is full of;
     the last seat going between asking and arriving lands on the list rather
       than in red text under a form.  */

const stats = vi.fn();
const waitlist = vi.fn();
const signUp = vi.fn();
const signIn = vi.fn();

vi.mock("../net/api.js", () => ({
  api: {
    stats: (...a) => stats(...a),
    waitlist: (...a) => waitlist(...a),
    signIn: (...a) => signIn(...a),
    signUp: (...a) => signUp(...a),
    forgot: () => Promise.resolve({ ok: true }),
    sendConfirmation: () => Promise.resolve(),
  },
  serverEnabled: () => true,
  SERVER_URL: "https://server.test",
}));
vi.mock("../store/account.js", () => ({ saveAccount: () => true, loadAccount: () => null, clearAccount: () => {} }));

const { AccountGate } = await import("./AccountGate.jsx");
const { forgetSeats, SEATS_TIMEOUT_MS } = await import("./seats.js");

const show = () => render(<AccountGate profile={{ name: "Me", tint: "eucalyptus" }} notify={() => {}} onSignedIn={() => {}} />);
/** Let the mounted `api.stats()` promise settle before reading the DOM. */
const settle = async () => {
  await act(async () => { for (let i = 0; i < 4; i++) await Promise.resolve(); });
};
const text = () => document.body.textContent;
/** Open the sign-up door and fill it in well enough to be sent. */
const fillSignup = async () => {
  await act(async () => { fireEvent.click(screen.getByRole("tab", { name: "Create an account" })); });
  fireEvent.change(screen.getByLabelText("Handle"), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "ada@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "two eyes live" } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "two eyes live" } });
  await act(async () => { fireEvent.click(screen.getByText("Create the account")); });
};

beforeEach(() => {
  // The seat answer is remembered for the page session, so each test starts by
  // forgetting it; otherwise every test after the first reads the first one's
  // answer and the mocks below do nothing.
  forgetSeats();
  stats.mockReset(); waitlist.mockReset(); signUp.mockReset(); signIn.mockReset();
  stats.mockResolvedValue({ players: 4, online: 0, seeking: 0, cap: 100, full: false, seatsLeft: 96 });
  waitlist.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

describe("while there are seats", () => {
  it("offers the two doors and no waiting list", async () => {
    show();
    await settle();
    expect(screen.getByRole("tab", { name: "Create an account" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Sign in" })).toBeTruthy();
    expect(text()).not.toContain("The beta is full");
  });

  /* The third door, a handle with nothing behind it, closed on 2026-09-15.
     Everybody signs in now, so every handle has a way back to it. */
  it("no longer offers a handle with nothing behind it", async () => {
    show();
    await settle();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.queryByRole("tab", { name: "Just a handle" })).toBeNull();
    expect(screen.queryByText("Claim handle")).toBeNull();
  });

  it("offers them anyway when the server cannot be asked, rather than turning people away on a network error", async () => {
    stats.mockRejectedValue(new Error("offline"));
    show();
    await settle();
    expect(text()).not.toContain("The beta is full");
    expect(screen.getByRole("tab", { name: "Create an account" })).toBeTruthy();
  });
});

describe("when the beta is full", () => {
  beforeEach(() => {
    stats.mockResolvedValue({ players: 100, online: 3, seeking: 0, cap: 100, full: true, seatsLeft: 0 });
  });

  it("says so before anybody has typed anything", async () => {
    show();
    await settle();
    expect(text()).toContain("The beta is full");
    expect(screen.queryByRole("tab", { name: "Create an account" })).toBeNull();
  });

  it("takes an address and says the same thing whatever the server knew", async () => {
    show();
    await settle();
    fireEvent.change(screen.getByLabelText("Your email address"), { target: { value: "ada@example.com" } });
    await act(async () => { fireEvent.click(screen.getByText("Put me on the list")); });
    expect(waitlist).toHaveBeenCalledWith("ada@example.com");
    expect(text()).toContain("Your address is on the list");
  });

  it("sends one ask however many times Enter is pressed", async () => {
    let release;
    waitlist.mockReturnValue(new Promise(r => { release = r; }));
    show();
    await settle();
    const box = screen.getByLabelText("Your email address");
    fireEvent.change(box, { target: { value: "ada@example.com" } });
    await act(async () => {
      fireEvent.keyDown(box, { key: "Enter" });
      fireEvent.keyDown(box, { key: "Enter" });
      release({ ok: true });
    });
    // Three an hour is the budget. A double tap must not cost a third of it.
    expect(waitlist).toHaveBeenCalledTimes(1);
  });

  it("still lets the hundred who are in get in", async () => {
    show();
    await settle();
    await act(async () => { fireEvent.click(screen.getByText("Already have an account? Sign in.")); });
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });
});

describe("asking the server whether there is a seat", () => {
  it("asks once however many times the gate is mounted", async () => {
    const { unmount } = show();
    await settle();
    unmount();
    show();
    await settle();
    // A request per visit to the lobby is spent from the same daily budget the
    // cap exists to protect, and the answer does not change that fast.
    expect(stats).toHaveBeenCalledTimes(1);
  });

  it("shows neither the doors nor the waiting list until it knows", () => {
    let answer;
    stats.mockReturnValue(new Promise(r => { answer = r; }));
    show();
    // Rendering the three doors first and swapping them a moment later took
    // the form out from under the hundred-and-first person mid-keystroke.
    expect(screen.queryByRole("tab", { name: "Create an account" })).toBeNull();
    expect(text()).not.toContain("The beta is full");
    expect(text()).toContain("Play people");
    answer({ players: 4, cap: 100, full: false });
  });
});

describe("when the server does not answer at all", () => {
  it("offers the doors anyway rather than holding the screen for ever", async () => {
    vi.useFakeTimers();
    try {
      // Not a rejection: a connection that hangs. `api.stats()` has no timeout
      // of its own, so without the clock in seats.js the whole online screen
      // stays a title and nothing else for as long as the socket is open.
      stats.mockReturnValue(new Promise(() => {}));
      show();
      expect(screen.queryByRole("tab", { name: "Create an account" })).toBeNull();
      await act(async () => { await vi.advanceTimersByTimeAsync(SEATS_TIMEOUT_MS + 50); });
      expect(screen.getByRole("tab", { name: "Create an account" })).toBeTruthy();
      expect(text()).not.toContain("The beta is full");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("after the door has been shut in somebody's face", () => {
  it("does not offer them the same form again on the way back", async () => {
    signUp.mockRejectedValue(Object.assign(new Error("beta-full"), { reason: "beta-full" }));
    const { unmount } = show();
    await settle();
    await fillSignup();
    expect(text()).toContain("The beta is full");

    // Leaving the screen and coming back used to offer the three doors again,
    // because only the component state had learned anything. The refusal is
    // remembered for the page session now, and no second request is spent.
    unmount();
    show();
    await settle();
    expect(text()).toContain("The beta is full");
    expect(stats).toHaveBeenCalledTimes(1);
  });
});

describe("when the last seat goes while somebody is typing", () => {
  it("hands them the list rather than an error under a form they can no longer use", async () => {
    signUp.mockRejectedValue(Object.assign(new Error("beta-full"), { reason: "beta-full" }));
    show();
    await settle();
    await fillSignup();
    expect(text()).toContain("The beta is full");
    expect(screen.getByLabelText("Your email address")).toBeTruthy();
  });
});

describe("what the waiting list says when it cannot take an address", () => {
  beforeEach(() => {
    stats.mockResolvedValue({ players: 100, online: 3, seeking: 0, cap: 100, full: true, seatsLeft: 0 });
  });

  /* The one answer that must never be given wrongly. Telling somebody their
     address is on the list when the server refused it means they wait for a
     letter that is never coming, so a refusal has to keep the form and say
     what happened. */
  it("keeps the form and says why when the server refuses the ask", async () => {
    waitlist.mockRejectedValue(Object.assign(new Error("too-many-asks"), { reason: "too-many-asks" }));
    show();
    await settle();
    fireEvent.change(screen.getByLabelText("Your email address"), { target: { value: "ada@example.com" } });
    await act(async () => { fireEvent.click(screen.getByText("Put me on the list")); });
    expect(text()).toContain("Try again in an hour");
    expect(text()).not.toContain("Your address is on the list");
    expect(screen.getByLabelText("Your email address")).toBeTruthy();
  });

  /* A typo is caught here rather than spent against the hourly budget the
     server keeps per address: three of them and a person would be locked out
     of a list they never got onto. */
  it("refuses something that is not an address without asking the server at all", async () => {
    show();
    await settle();
    fireEvent.change(screen.getByLabelText("Your email address"), { target: { value: "ada at example" } });
    await act(async () => { fireEvent.click(screen.getByText("Put me on the list")); });
    expect(text()).toContain("That does not look like an address");
    expect(waitlist).not.toHaveBeenCalled();
  });

  it("takes the address on Enter, so the box works the way a one-field form looks like it should", async () => {
    show();
    await settle();
    const box = screen.getByLabelText("Your email address");
    fireEvent.change(box, { target: { value: "ada@example.com" } });
    await act(async () => { fireEvent.keyDown(box, { key: "Enter" }); });
    expect(waitlist).toHaveBeenCalledWith("ada@example.com");
    expect(text()).toContain("Your address is on the list");
  });

  /* Somebody who opened the sign-in door by mistake has to be able to get back
     to the list, or the card is a dead end for the person it was written for. */
  it("comes back to the list from the sign-in door", async () => {
    show();
    await settle();
    await act(async () => { fireEvent.click(screen.getByText("Already have an account? Sign in.")); });
    await act(async () => { fireEvent.click(screen.getByText("Never mind")); });
    expect(screen.getByLabelText("Your email address")).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();
  });
});

describe("a server that answers oddly", () => {
  /* `stats` is read for one field. An answer with no `full` in it — an older
     deployment, a proxy handing back something empty — has to leave the doors
     open, for the same reason a network error does. */
  it("leaves the doors open when the answer carries no verdict", async () => {
    for (const odd of [null, undefined, {}, { players: 4 }]) {
      stats.mockResolvedValue(odd);
      show();
      await settle();
      expect(text()).not.toContain("The beta is full");
      cleanup();
    }
  });
});
