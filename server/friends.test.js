import { describe, it, expect } from "vitest";
import {
  emptyBook, readBook, has, without, withEntry, standing,
  ask, accept, forget, forgetting, everyoneWhoKnows,
  MAX_FRIENDS, MAX_PENDING,
} from "./friends.js";

const NOW = 1_700_000_000_000;
const ids = (list) => list.map((e) => e.id);
/** A book holding `n` strangers on one of its lists, for the cap tests. */
const filled = (key, n, prefix = "x") => ({
  ...emptyBook(),
  [key]: Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, at: NOW })),
});

describe("readBook", () => {
  it("gives an empty book for anything that is not one", () => {
    for (const bad of [null, undefined, 7, "friends", []]) {
      expect(readBook(bad)).toEqual(emptyBook());
    }
  });

  it("keeps the three lists and drops entries that lost their shape", () => {
    const book = readBook({
      friends: [{ id: "a", at: 1 }, { id: "" }, null, 5, { at: 2 }],
      outgoing: "not a list",
      incoming: [{ id: "b", at: 3 }],
    });
    expect(ids(book.friends)).toEqual(["a"]);
    expect(book.outgoing).toEqual([]);
    expect(ids(book.incoming)).toEqual(["b"]);
  });

  it("ignores a list this version has never heard of rather than carrying it", () => {
    expect(readBook({ blocked: [{ id: "c" }] })).toEqual(emptyBook());
  });
});

describe("the small list operations", () => {
  it("never edits a list in place, so a refusal cannot half-apply", () => {
    const list = [{ id: "a", at: 1 }];
    expect(without(list, "a")).not.toBe(list);
    expect(withEntry(list, "b", 2)).not.toBe(list);
    expect(list).toEqual([{ id: "a", at: 1 }]);
  });

  it("puts the newest at the front and never the same id twice", () => {
    let list = [];
    list = withEntry(list, "a", 1);
    list = withEntry(list, "b", 2);
    list = withEntry(list, "a", 3);
    expect(ids(list)).toEqual(["a", "b"]);
    expect(list[0].at).toBe(3);
  });

  it("has answers the three lists the same way", () => {
    expect(has([{ id: "a", at: 1 }], "a")).toBe(true);
    expect(has([{ id: "a", at: 1 }], "b")).toBe(false);
  });
});

describe("standing", () => {
  it("names which of the three lists somebody is on", () => {
    const book = { friends: [{ id: "f" }], outgoing: [{ id: "o" }], incoming: [{ id: "i" }] };
    expect(standing(book, "f")).toBe("friends");
    expect(standing(book, "o")).toBe("asked");
    expect(standing(book, "i")).toBe("asking");
    expect(standing(book, "nobody")).toBe("none");
  });
});

describe("asking", () => {
  it("puts them on my outgoing and me on their incoming, and nowhere else", () => {
    const r = ask(emptyBook(), emptyBook(), "me", "them", NOW);
    expect(r.outcome).toBe("asked");
    expect(ids(r.mine.outgoing)).toEqual(["them"]);
    expect(ids(r.theirs.incoming)).toEqual(["me"]);
    expect(r.mine.friends).toEqual([]);
    expect(r.theirs.friends).toEqual([]);
    expect(r.mine.incoming).toEqual([]);
    expect(r.theirs.outgoing).toEqual([]);
  });

  /* The case worth having: both people press first. */
  it("makes them friends on the spot when the asking crossed in the post", () => {
    const first = ask(emptyBook(), emptyBook(), "a", "b", NOW);
    const second = ask(first.theirs, first.mine, "b", "a", NOW + 1);
    expect(second.outcome).toBe("friends");
    expect(ids(second.mine.friends)).toEqual(["a"]);
    expect(ids(second.theirs.friends)).toEqual(["b"]);
    for (const book of [second.mine, second.theirs]) {
      expect(book.outgoing).toEqual([]);
      expect(book.incoming).toEqual([]);
    }
  });

  it("is quiet about asking twice, and does not stack the request", () => {
    const first = ask(emptyBook(), emptyBook(), "me", "them", NOW);
    const again = ask(first.mine, first.theirs, "me", "them", NOW + 1000);
    expect(again.error).toBeUndefined();
    expect(again.outcome).toBe("asked");
    expect(ids(again.mine.outgoing)).toEqual(["them"]);
    expect(ids(again.theirs.incoming)).toEqual(["me"]);
    expect(again.mine.outgoing[0].at).toBe(NOW);       // not re-stamped, so nothing re-sends
  });

  it("refuses yourself and somebody already a friend", () => {
    expect(ask(emptyBook(), emptyBook(), "me", "me", NOW).error).toBe("yourself");
    const both = ask(ask(emptyBook(), emptyBook(), "a", "b", NOW).theirs,
      ask(emptyBook(), emptyBook(), "a", "b", NOW).mine, "b", "a", NOW);
    expect(ask(both.mine, both.theirs, "b", "a", NOW).error).toBe("already-friends");
  });

  it("refuses when either side's friend list is full, and says whose", () => {
    expect(ask(filled("friends", MAX_FRIENDS), emptyBook(), "me", "them", NOW).error)
      .toBe("your-list-is-full");
    expect(ask(emptyBook(), filled("friends", MAX_FRIENDS), "me", "them", NOW).error)
      .toBe("their-list-is-full");
  });

  it("refuses when too much is already in the air, in either direction", () => {
    expect(ask(filled("outgoing", MAX_PENDING), emptyBook(), "me", "them", NOW).error)
      .toBe("too-many-asked");
    expect(ask(emptyBook(), filled("incoming", MAX_PENDING), "me", "them", NOW).error)
      .toBe("their-requests-are-full");
  });

  it("still lets a full list accept somebody already on it", () => {
    const mine = filled("friends", MAX_FRIENDS);
    const withThem = { ...mine, friends: [{ id: "them", at: NOW }, ...mine.friends.slice(1)] };
    expect(ask(withThem, emptyBook(), "me", "them", NOW).error).toBe("already-friends");
  });
});

describe("accepting", () => {
  const asked = () => ask(emptyBook(), emptyBook(), "them", "me", NOW);   // they asked me

  it("binds both sides and clears the request from both", () => {
    const r = accept(asked().theirs, asked().mine, "me", "them", NOW + 1);
    expect(r.outcome).toBe("friends");
    expect(ids(r.mine.friends)).toEqual(["them"]);
    expect(ids(r.theirs.friends)).toEqual(["me"]);
    expect(r.mine.incoming).toEqual([]);
    expect(r.theirs.outgoing).toEqual([]);
  });

  /* Consent lives on the incoming list. Somebody who sent a request cannot
     accept it on the other person's behalf by calling this. */
  it("refuses when there is no request on my incoming list, whatever theirs says", () => {
    const sent = ask(emptyBook(), emptyBook(), "me", "them", NOW);
    expect(accept(sent.mine, sent.theirs, "me", "them", NOW).error).toBe("no-request");
  });

  it("refuses yourself, a stranger, and somebody already a friend", () => {
    expect(accept(emptyBook(), emptyBook(), "me", "me", NOW).error).toBe("yourself");
    expect(accept(emptyBook(), emptyBook(), "me", "them", NOW).error).toBe("no-request");
    const friends = accept(asked().theirs, asked().mine, "me", "them", NOW);
    expect(accept(friends.mine, friends.theirs, "me", "them", NOW).error).toBe("already-friends");
  });

  it("refuses when accepting would put either side over the cap", () => {
    const mine = { ...filled("friends", MAX_FRIENDS), incoming: [{ id: "them", at: NOW }] };
    expect(accept(mine, emptyBook(), "me", "them", NOW).error).toBe("your-list-is-full");
  });
});

describe("forgetting, which is one act with three names", () => {
  const friends = () => {
    const a = ask(emptyBook(), emptyBook(), "me", "them", NOW);
    return accept(a.theirs, a.mine, "them", "me", NOW + 1);   // mine is them's book here
  };

  it("ends a friendship from either side and leaves neither holding the other", () => {
    const f = friends();
    const r = forget(f.theirs, f.mine, "me", "them");          // back to my point of view
    expect(r.outcome).toBe("unfriended");
    expect(r.mine.friends).toEqual([]);
    expect(r.theirs.friends).toEqual([]);
  });

  it("declines a request I was sent", () => {
    const sent = ask(emptyBook(), emptyBook(), "them", "me", NOW);
    const r = forget(sent.theirs, sent.mine, "me", "them");
    expect(r.outcome).toBe("declined");
    expect(r.mine.incoming).toEqual([]);
    expect(r.theirs.outgoing).toEqual([]);
  });

  it("withdraws a request I sent", () => {
    const sent = ask(emptyBook(), emptyBook(), "me", "them", NOW);
    const r = forget(sent.mine, sent.theirs, "me", "them");
    expect(r.outcome).toBe("withdrawn");
    expect(r.mine.outgoing).toEqual([]);
    expect(r.theirs.incoming).toEqual([]);
  });

  it("says nothing happened rather than failing, for somebody who was never there", () => {
    const r = forget(emptyBook(), emptyBook(), "me", "them");
    expect(r.error).toBeUndefined();
    expect(r.outcome).toBe("nothing");
  });

  it("refuses yourself", () => {
    expect(forget(emptyBook(), emptyBook(), "me", "me").error).toBe("yourself");
  });

  it("lets a declined request be sent again, because declining is not blocking", () => {
    const sent = ask(emptyBook(), emptyBook(), "them", "me", NOW);
    const declined = forget(sent.theirs, sent.mine, "me", "them");
    const again = ask(declined.theirs, declined.mine, "them", "me", NOW + 5);
    expect(again.outcome).toBe("asked");
  });
});

describe("leaving", () => {
  it("takes this player off every list of somebody else's book", () => {
    const book = {
      friends: [{ id: "gone", at: 1 }, { id: "stays", at: 2 }],
      outgoing: [{ id: "gone", at: 3 }],
      incoming: [{ id: "gone", at: 4 }, { id: "other", at: 5 }],
    };
    const left = forgetting(book, "gone");
    expect(ids(left.friends)).toEqual(["stays"]);
    expect(left.outgoing).toEqual([]);
    expect(ids(left.incoming)).toEqual(["other"]);
  });

  it("names everybody whose book has to be rewritten, each of them once", () => {
    const book = {
      friends: [{ id: "a", at: 1 }, { id: "b", at: 2 }],
      outgoing: [{ id: "c", at: 3 }],
      incoming: [{ id: "a", at: 4 }],
    };
    expect(everyoneWhoKnows(book).sort()).toEqual(["a", "b", "c"]);
  });

  it("names nobody for a player who knew nobody", () => {
    expect(everyoneWhoKnows(emptyBook())).toEqual([]);
  });
});

describe("the invariant that holds the whole thing up", () => {
  /* Every transition writes both books or neither. If one side can ever carry
     an edge the other does not, a friends list becomes a claim rather than an
     agreement, and there is no scan cheap enough to find the mismatch later. */
  it("leaves the two books agreeing after any sequence of moves", () => {
    let a = emptyBook(), b = emptyBook();
    const moves = [
      () => { const r = ask(a, b, "a", "b", NOW); if (!r.error) { a = r.mine; b = r.theirs; } },
      () => { const r = ask(b, a, "b", "a", NOW); if (!r.error) { b = r.mine; a = r.theirs; } },
      () => { const r = accept(a, b, "a", "b", NOW); if (!r.error) { a = r.mine; b = r.theirs; } },
      () => { const r = accept(b, a, "b", "a", NOW); if (!r.error) { b = r.mine; a = r.theirs; } },
      () => { const r = forget(a, b, "a", "b"); if (!r.error) { a = r.mine; b = r.theirs; } },
      () => { const r = forget(b, a, "b", "a"); if (!r.error) { b = r.mine; a = r.theirs; } },
    ];
    /* A fixed shuffle rather than a random one: a suite that fails once a week
       and passes on a rerun teaches nobody anything. */
    const order = [0, 2, 4, 1, 3, 0, 1, 2, 5, 0, 3, 4, 1, 0, 2, 5, 4, 3, 0, 1];
    for (const i of order) {
      moves[i]();
      expect(has(a.friends, "b")).toBe(has(b.friends, "a"));
      expect(has(a.outgoing, "b")).toBe(has(b.incoming, "a"));
      expect(has(a.incoming, "b")).toBe(has(b.outgoing, "a"));
      // Nobody is ever on two of their own lists at once.
      for (const book of [a, b]) {
        const other = book === a ? "b" : "a";
        const on = [book.friends, book.outgoing, book.incoming].filter((l) => has(l, other));
        expect(on.length).toBeLessThanOrEqual(1);
      }
    }
  });
});
