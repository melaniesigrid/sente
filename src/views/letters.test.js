import { describe, it, expect } from "vitest";
import { WRITE_REFUSALS, writeRefusal, waitingOnMe, waitingCount } from "./letters.js";

describe("what is said when a letter is refused", () => {
  it("has a line for every reason the server can give", () => {
    for (const reason of ["not-met", "yourself", "no-player", "empty-letter", "too-many-letters-sent"]) {
      expect(WRITE_REFUSALS[reason], reason).toBeTruthy();
    }
  });

  it("covers the reasons the client raises before anything is sent", () => {
    for (const reason of ["offline", "no-server", "unauthorized"]) {
      expect(WRITE_REFUSALS[reason], reason).toBeTruthy();
    }
  });

  /* The careful one. The server folds `blocked` into `not-met` before it
     answers, and this table must not undo that by having a line for it: a
     message saying "you have been blocked" is a message, and it is the one
     thing the person who blocked chose not to send. */
  it("has no line for being blocked, because nobody is ever told they were", () => {
    expect(WRITE_REFUSALS.blocked).toBeUndefined();
    for (const line of Object.values(WRITE_REFUSALS)) {
      expect(line).not.toMatch(/block/i);
    }
  });

  it("says the same thing to a stranger and to somebody who was blocked", () => {
    // The server answers "not-met" for both, so there is one line and one only.
    expect(writeRefusal("not-met")).toBe(WRITE_REFUSALS["not-met"]);
  });

  it("says who may write, rather than only that this person may not", () => {
    expect(writeRefusal("not-met")).toMatch(/friends/i);
    expect(writeRefusal("not-met")).toMatch(/finished a game/i);
  });

  it("names an unknown reason rather than swallowing it", () => {
    expect(writeRefusal("brand-new")).toContain("brand-new");
  });
});

describe("who is being waited on", () => {
  it("is me when the last word was theirs", () => {
    expect(waitingOnMe({ from: "them" }, "me")).toBe(true);
    expect(waitingOnMe({ from: "me" }, "me")).toBe(false);
  });

  it("is nobody for a row that is not one", () => {
    expect(waitingOnMe(null, "me")).toBe(false);
  });

  it("counts the threads waiting on me", () => {
    const rows = [{ from: "them" }, { from: "me" }, { from: "other" }];
    expect(waitingCount(rows, "me")).toBe(2);
    expect(waitingCount([], "me")).toBe(0);
    expect(waitingCount(null, "me")).toBe(0);
  });
});
