import { describe, it, expect } from "vitest";
import {
  standingWith, friendAction, outcomeText, OUTCOME_TEXT,
  friendErrorText, FRIEND_ERRORS, moved, STANDING_AFTER, bookIsEmpty,
} from "./friendship.js";

const p = (id) => ({ id, name: id.toUpperCase(), tint: "eucalyptus", rating: 900, rd: 80 });
const book = (over = {}) => ({ friends: [], incoming: [], outgoing: [], ...over });

describe("standingWith", () => {
  it("finds somebody on each of the three lists", () => {
    expect(standingWith(book({ friends: [p("a")] }), "a")).toBe("friends");
    expect(standingWith(book({ outgoing: [p("a")] }), "a")).toBe("asked");
    expect(standingWith(book({ incoming: [p("a")] }), "a")).toBe("asking");
  });

  it("is none for a stranger, and for no book at all", () => {
    expect(standingWith(book(), "a")).toBe("none");
    expect(standingWith(null, "a")).toBe("none");
    expect(standingWith(book({ friends: [p("a")] }), null)).toBe("none");
  });

  it("survives a book whose lists are missing or not lists", () => {
    expect(standingWith({ friends: undefined, incoming: "no", outgoing: 7 }, "a")).toBe("none");
    expect(standingWith({ friends: [null, undefined, p("a")] }, "a")).toBe("friends");
  });
});

describe("friendAction", () => {
  /* The case worth having a test for: somebody has already asked me, and the
     page must offer to accept rather than to ask again across a table where
     the answer is already waiting. */
  it("offers to accept, not to ask, when they asked first", () => {
    const a = friendAction("asking");
    expect(a.act).toBe("accept");
    expect(a.label).toBe("Accept");
    expect(a.undo.act).toBe("forget");
    expect(a.undo.label).toBe("Decline");
  });

  it("offers to add a stranger", () => {
    const a = friendAction("none");
    expect(a.act).toBe("ask");
    expect(a.undo).toBe(null);
  });

  it("shows a settled state with a quiet way out, and no main action", () => {
    for (const standing of ["friends", "asked"]) {
      const a = friendAction(standing);
      expect(a.act).toBe(null);
      expect(a.done).toBe(true);
      expect(a.undo.act).toBe("forget");
    }
  });

  it("names the two undos differently, because they are different acts", () => {
    expect(friendAction("friends").undo.label).not.toBe(friendAction("asked").undo.label);
  });

  it("treats anything it has never heard of as a stranger", () => {
    expect(friendAction("nonsense").act).toBe("ask");
  });
});

describe("what is said afterwards", () => {
  it("has a line for every outcome the server can answer with", () => {
    for (const outcome of ["friends", "asked", "unfriended", "declined", "withdrawn", "nothing"]) {
      expect(OUTCOME_TEXT[outcome], outcome).toBeTruthy();
      expect(outcomeText(outcome)).toBe(OUTCOME_TEXT[outcome]);
    }
  });

  /* Withdrawn and declined come back from the same DELETE and mean opposite
     things to whoever pressed it, so they must never read the same. */
  it("says something different for withdrawing and for declining", () => {
    expect(OUTCOME_TEXT.withdrawn).not.toBe(OUTCOME_TEXT.declined);
  });

  it("says something rather than nothing for an outcome it has not met", () => {
    expect(outcomeText("invented")).toBe("Done");
  });
});

describe("what is said when it is refused", () => {
  it("has a line for every error the server's status table can produce", () => {
    const fromServer = ["no-player", "yourself", "already-friends", "no-request",
      "your-list-is-full", "their-list-is-full", "too-many-asked",
      "their-requests-are-full", "too-many-requests"];
    for (const reason of fromServer) expect(FRIEND_ERRORS[reason], reason).toBeTruthy();
  });

  it("covers the two the client itself raises before anything is sent", () => {
    expect(FRIEND_ERRORS.offline).toBeTruthy();
    expect(FRIEND_ERRORS["no-server"]).toBeTruthy();
  });

  it("tells the two full lists apart, since only one of them is yours to fix", () => {
    expect(FRIEND_ERRORS["your-list-is-full"]).not.toBe(FRIEND_ERRORS["their-list-is-full"]);
    expect(FRIEND_ERRORS["your-list-is-full"]).toMatch(/remove somebody/i);
  });

  it("names an unknown reason rather than swallowing it", () => {
    expect(friendErrorText("brand-new")).toContain("brand-new");
  });
});

describe("moving somebody by hand, so a press shows at once", () => {
  it("puts a stranger on the outgoing list and nowhere else", () => {
    const next = moved(book(), p("a"), "asked");
    expect(next.outgoing.map((x) => x.id)).toEqual(["a"]);
    expect(next.friends).toEqual([]);
    expect(next.incoming).toEqual([]);
  });

  it("moves somebody off the list they were on, never onto two at once", () => {
    const next = moved(book({ incoming: [p("a")] }), p("a"), "friends");
    expect(next.friends.map((x) => x.id)).toEqual(["a"]);
    expect(next.incoming).toEqual([]);
  });

  it("removes them entirely for a standing of none", () => {
    const next = moved(book({ friends: [p("a"), p("b")] }), p("a"), "none");
    expect(next.friends.map((x) => x.id)).toEqual(["b"]);
    expect(next.outgoing).toEqual([]);
    expect(next.incoming).toEqual([]);
  });

  it("leaves everybody else where they were", () => {
    const next = moved(book({ friends: [p("b")], incoming: [p("c")] }), p("a"), "asked");
    expect(next.friends.map((x) => x.id)).toEqual(["b"]);
    expect(next.incoming.map((x) => x.id)).toEqual(["c"]);
  });

  it("does not edit the book it was given", () => {
    const before = book({ friends: [p("a")] });
    moved(before, p("a"), "none");
    expect(before.friends.map((x) => x.id)).toEqual(["a"]);
  });

  it("copes with no book at all, which is what a signed-out page has", () => {
    expect(moved(null, p("a"), "asked").outgoing.map((x) => x.id)).toEqual(["a"]);
  });

  /* The round trip the screen actually makes: press, move by hand, read the
     standing back, and get the one the button was promising. */
  it("round-trips every outcome through the standing it implies", () => {
    for (const [outcome, standing] of Object.entries(STANDING_AFTER)) {
      const next = moved(book({ incoming: [p("a")] }), p("a"), standing);
      expect(standingWith(next, "a"), outcome).toBe(standing === "none" ? "none" : standing);
    }
  });
});

describe("bookIsEmpty", () => {
  it("is true for nothing at all and for three empty lists", () => {
    expect(bookIsEmpty(null)).toBe(true);
    expect(bookIsEmpty(book())).toBe(true);
  });

  it("is false when any one of the three has somebody on it", () => {
    expect(bookIsEmpty(book({ friends: [p("a")] }))).toBe(false);
    expect(bookIsEmpty(book({ incoming: [p("a")] }))).toBe(false);
    expect(bookIsEmpty(book({ outgoing: [p("a")] }))).toBe(false);
  });
});
