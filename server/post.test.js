import { describe, it, expect } from "vitest";
import {
  LETTER_MAX, THREAD_KEEP, MAX_BLOCKED,
  threadKey, cleanLetter, readThread, withLetter, mayWrite,
  threadSummary, byRecent, readBlocked, block, unblock,
  LETTERS_PREFIX, lettersKey, readIndexRow, unreadRow, unreadRows,
  rowsAfterLetter, rowAfterRead, metKey, metDoneKey,
} from "./post.js";

const NOW = 1_700_000_000_000;
const letter = (from, text, at = NOW) => ({ from, text, at });

describe("the thread key", () => {
  /* One thread per pair, not two half-threads each holding one side. */
  it("is the same whichever of them computes it", () => {
    expect(threadKey("a", "b")).toBe(threadKey("b", "a"));
  });

  it("is different for different pairs", () => {
    expect(threadKey("a", "b")).not.toBe(threadKey("a", "c"));
  });
});

describe("cleanLetter", () => {
  it("keeps a letter with paragraphs in it", () => {
    expect(cleanLetter("Good game.\n\nThe wedge at move 40 was the moment."))
      .toBe("Good game.\n\nThe wedge at move 40 was the moment.");
  });

  it("caps the blank lines, so nobody pushes a thread off the screen", () => {
    expect(cleanLetter("a\n\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("drops control characters but keeps newlines", () => {
    const ctrl = (n) => String.fromCharCode(n);
    expect(cleanLetter("a" + ctrl(0) + "b\nc")).toBe("ab\nc");
  });

  it("cuts a long letter to the limit rather than refusing it", () => {
    expect(cleanLetter("x".repeat(5000)).length).toBe(LETTER_MAX);
  });

  it("is empty for anything that is not a string, and for only spaces", () => {
    for (const bad of [null, undefined, 7, {}]) expect(cleanLetter(bad), String(bad)).toBe("");
    expect(cleanLetter("   \n  ")).toBe("");
  });
});

describe("readThread", () => {
  it("is empty for anything that is not a thread", () => {
    for (const bad of [null, undefined, {}, "x"]) expect(readThread(bad), String(bad)).toEqual([]);
  });

  it("drops letters that lost their shape", () => {
    const got = readThread([letter("a", "hi"), null, { from: "a" }, { text: "x" }, 5]);
    expect(got.length).toBe(1);
    expect(got[0].from).toBe("a");
  });

  it("treats a missing stamp as zero rather than NaN", () => {
    expect(readThread([{ from: "a", text: "x", at: "soon" }])[0].at).toBe(0);
  });
});

describe("adding a letter", () => {
  it("puts it on the end, so a thread reads top to bottom", () => {
    const t = withLetter(withLetter([], "a", "first", 1), "b", "second", 2);
    expect(t.map((l) => l.text)).toEqual(["first", "second"]);
  });

  it("keeps the newest and drops the oldest past the cap", () => {
    let t = [];
    for (let i = 0; i < THREAD_KEEP + 20; i += 1) t = withLetter(t, "a", `n${i}`, i);
    expect(t.length).toBe(THREAD_KEEP);
    expect(t[0].text).toBe("n20");
    expect(t[t.length - 1].text).toBe(`n${THREAD_KEEP + 19}`);
  });

  it("does not edit the thread it was given", () => {
    const before = [];
    withLetter(before, "a", "x", 1);
    expect(before).toEqual([]);
  });
});

describe("who may write", () => {
  const can = (over) => mayWrite({ from: "a", to: "b", friends: false, played: false, blocked: false, ...over });

  it("lets a friend write", () => {
    expect(can({ friends: true })).toBe(null);
  });

  it("lets somebody you have played write", () => {
    expect(can({ played: true })).toBe(null);
  });

  /* The whole of the spam policy, and it needs no filter, no reporting queue
     and nobody's judgement: a stranger off the ladder cannot write at all. */
  it("refuses a stranger", () => {
    expect(can({})).toBe("not-met");
  });

  it("refuses yourself", () => {
    expect(mayWrite({ from: "a", to: "a", friends: true, played: true })).toBe("yourself");
  });

  it("refuses a missing player either side", () => {
    expect(mayWrite({ from: null, to: "b", played: true })).toBe("no-player");
    expect(mayWrite({ from: "a", to: null, played: true })).toBe("no-player");
  });

  /* Blocking wins over everything, friendship included: somebody who blocks a
     friend has said the clearer of the two things. */
  it("refuses somebody who has been blocked, however well they know each other", () => {
    expect(can({ friends: true, played: true, blocked: true })).toBe("blocked");
  });
});

describe("a thread in a list of them", () => {
  it("shows the last thing said, and when", () => {
    const s = threadSummary([letter("a", "hello", 1), letter("b", "hi there", 2)], "a");
    expect(s.preview).toBe("hi there");
    expect(s.at).toBe(2);
    expect(s.letters).toBe(2);
  });

  /* "Unread" is absent on purpose. A read receipt is a promise about somebody
     else's attention; what a person actually wants to know is whether they are
     the one being waited on, which is answered by who spoke last. */
  it("says whose turn it is to answer, and never whether it was read", () => {
    const t = [letter("a", "hello", 1)];
    expect(threadSummary(t, "a").theirTurn).toBe(true);
    expect(threadSummary(t, "b").theirTurn).toBe(false);
    expect(Object.keys(threadSummary(t, "a"))).not.toContain("unread");
    expect(Object.keys(threadSummary(t, "a"))).not.toContain("read");
  });

  it("flattens a multi-line letter into one line of preview", () => {
    expect(threadSummary([letter("a", "one\n\ntwo", 1)], "a").preview).toBe("one two");
  });

  it("cuts a long preview", () => {
    expect(threadSummary([letter("a", "x".repeat(500), 1)], "a").preview.length).toBe(120);
  });

  it("is null for a thread with nothing in it", () => {
    expect(threadSummary([], "a")).toBe(null);
  });
});

describe("byRecent", () => {
  it("puts the newest conversation first", () => {
    const rows = [{ id: 1, at: 10 }, { id: 2, at: 30 }, { id: 3, at: 20 }];
    expect(byRecent(rows).map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it("does not edit the list it was given", () => {
    const rows = [{ at: 1 }, { at: 2 }];
    byRecent(rows);
    expect(rows[0].at).toBe(1);
  });

  it("copes with rows that have no stamp", () => {
    expect(byRecent([{ id: 1 }, { id: 2, at: 5 }]).map((r) => r.id)).toEqual([2, 1]);
  });
});

describe("blocking", () => {
  it("adds somebody, once", () => {
    expect(block(block([], "a"), "a")).toEqual(["a"]);
  });

  it("takes somebody off again", () => {
    expect(unblock(["a", "b"], "a")).toEqual(["b"]);
  });

  it("is not an error to unblock somebody who was never on", () => {
    expect(unblock([], "a")).toEqual([]);
  });

  it("stops growing at the cap rather than without limit", () => {
    let list = [];
    for (let i = 0; i < MAX_BLOCKED + 10; i += 1) list = block(list, `p${i}`);
    expect(list.length).toBe(MAX_BLOCKED);
  });

  it("reads a stored list defensively, and without duplicates", () => {
    expect(readBlocked(["a", "a", "", null, 7, "b"])).toEqual(["a", "b"]);
    expect(readBlocked(null)).toEqual([]);
  });

  it("never edits the list it was given", () => {
    const before = ["a"];
    block(before, "b");
    unblock(before, "a");
    expect(before).toEqual(["a"]);
  });
});

/* ----------------------- THE INDEX ROW -----------------------
   The mail count, its cursor, and the two ways the old code would have got it
   wrong: one value written to both shelves, and a sequence number with nowhere
   to live. */

describe("readIndexRow", () => {
  it("reads a full row", () => {
    expect(readIndexRow({ at: 9, theirLast: 8, read: 5 })).toEqual({ at: 9, theirLast: 8, read: 5 });
  });

  it("reads the old bare-timestamp shape as a row that is already read", () => {
    // The shape before the count existed. There is no cursor in it to recover,
    // and marking it unread would hand every player a full post box on the
    // morning of the deploy for letters they read months ago.
    const row = readIndexRow(1789616082000);
    expect(row.at).toBe(1789616082000);
    expect(unreadRow(row)).toBe(false);
  });

  it("survives nonsense without throwing", () => {
    for (const junk of [null, undefined, "x", [], { at: "soon" }]) {
      expect(unreadRow(readIndexRow(junk))).toBe(false);
    }
  });
});

describe("unreadRow", () => {
  it("is unread when they wrote after this side last looked", () => {
    expect(unreadRow({ at: 9, theirLast: 9, read: 4 })).toBe(true);
  });
  it("is read when this side has caught up", () => {
    expect(unreadRow({ at: 9, theirLast: 9, read: 9 })).toBe(false);
  });
  it("is read when the last word was this side's own", () => {
    expect(unreadRow({ at: 9, theirLast: 4, read: 4 })).toBe(false);
  });
});

describe("unreadRows", () => {
  const rows = [
    { other: "ana", row: { at: 9, theirLast: 9, read: 0 } },
    { other: "marco", row: { at: 8, theirLast: 8, read: 8 } },
    { other: "sofia", row: { at: 7, theirLast: 7, read: 1 } },
  ];

  it("counts threads, not letters", () => {
    expect(unreadRows(rows)).toBe(2);
  });

  it("never counts a blocked person", () => {
    expect(unreadRows(rows, ["ana"])).toBe(1);
    expect(unreadRows(rows, ["ana", "sofia"])).toBe(0);
  });

  it("takes a Set as readily as a list", () => {
    expect(unreadRows(rows, new Set(["sofia"]))).toBe(1);
  });

  it("is zero for an empty post box", () => {
    expect(unreadRows([])).toBe(0);
  });
});

describe("rowsAfterLetter — the two shelves are not the same value", () => {
  it("does not clear the recipient's count when a letter arrives", () => {
    // THE BUG THIS EXISTS TO PREVENT. The old write put one object to both
    // keys. With a cursor in the value that would copy the sender's `read`
    // onto the recipient's row and zero their unread on every incoming letter.
    const senderRow = { at: 5, theirLast: 0, read: 5 };
    const readerRow = { at: 5, theirLast: 5, read: 0 };
    const { from, to } = rowsAfterLetter(senderRow, readerRow, 9);
    expect(from).not.toEqual(to);
    expect(to.read).toBe(0);
    expect(unreadRow(to)).toBe(true);
  });

  it("moves both rows' `at` so the list still orders by recency", () => {
    const { from, to } = rowsAfterLetter({ at: 1, theirLast: 0, read: 0 }, { at: 1, theirLast: 1, read: 1 }, 9);
    expect(from.at).toBe(9);
    expect(to.at).toBe(9);
  });

  it("leaves the writer's own unread state alone", () => {
    // Somebody writes to you, then you write back before reading theirs.
    // Writing does not mark their letter read.
    const mine = { at: 5, theirLast: 5, read: 0 };
    const { from } = rowsAfterLetter(mine, { at: 5, theirLast: 0, read: 5 }, 9);
    expect(unreadRow(from)).toBe(true);
  });
});

describe("rowAfterRead", () => {
  it("clears the thread", () => {
    expect(unreadRow(rowAfterRead({ at: 9, theirLast: 9, read: 0 }))).toBe(false);
  });

  it("reads up to their last letter and not to the clock", () => {
    // A letter stamped in the future by a skewed clock must not be marked read
    // before it has been written, or the reader never sees it.
    const row = rowAfterRead({ at: 100, theirLast: 40, read: 0 });
    expect(row.read).toBe(40);
  });

  it("leaves `at` where it is, so opening a thread does not reorder the list", () => {
    expect(rowAfterRead({ at: 9, theirLast: 9, read: 0 }).at).toBe(9);
  });
});

describe("key builders", () => {
  it("keeps the letter index off the mail: prefix", () => {
    // `mail:<hash>` is verify and reset tokens. A prefix list over `mail:`
    // would walk both record types.
    expect(lettersKey("a", "b").startsWith("mail:")).toBe(false);
    expect(lettersKey("a", "b")).toBe("letters:a:b");
    expect(LETTERS_PREFIX("a")).toBe("letters:a:");
  });

  it("names a met: row from each side", () => {
    expect(metKey("a", "b")).toBe("met:a:b");
    expect(metKey("b", "a")).toBe("met:b:a");
    expect(metDoneKey("a")).toBe("metDone:a");
  });
});
