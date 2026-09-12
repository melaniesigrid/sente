import { describe, it, expect } from "vitest";
import {
  MAX_FEATURED, NOTE_MAX, cleanNote, readFeatured, isPinned, pin, unpin, featuredWith,
} from "./featured.js";

const NOW = 1_700_000_000_000;
const ids = (list) => list.map((e) => e.id);
const full = () => Array.from({ length: MAX_FEATURED }, (_, i) => ({ id: `g${i}`, note: "", at: NOW }));

describe("cleanNote", () => {
  it("keeps an ordinary sentence", () => {
    expect(cleanNote("The one where I finally killed a dragon.")).toBe("The one where I finally killed a dragon.");
  });

  it("turns newlines and tabs into a space rather than running words together", () => {
    expect(cleanNote("one\ntwo\tthree")).toBe("one two three");
  });

  /* Built rather than written out: a literal control byte in a source file
     makes git call the whole file binary and stop diffing it. */
  it("drops control characters", () => {
    const ctrl = (n) => String.fromCharCode(n);
    expect(cleanNote("a" + ctrl(0) + "b" + ctrl(7) + "c")).toBe("abc");
  });

  it("cuts a long line to the limit rather than refusing it", () => {
    expect(cleanNote("x".repeat(500)).length).toBe(NOTE_MAX);
  });

  it("is empty for anything that is not a string", () => {
    for (const bad of [null, undefined, 7, {}, []]) expect(cleanNote(bad), String(bad)).toBe("");
  });

  it("trims, so a line of spaces is no line at all", () => {
    expect(cleanNote("   ")).toBe("");
    expect(cleanNote("  hello  ")).toBe("hello");
  });
});

describe("readFeatured", () => {
  it("is empty for anything that is not a list", () => {
    for (const bad of [null, undefined, {}, "g1", 7]) expect(readFeatured(bad), String(bad)).toEqual([]);
  });

  it("keeps the id, the cleaned note and when it was pinned", () => {
    expect(readFeatured([{ id: "g1", note: "a\nb", at: NOW }]))
      .toEqual([{ id: "g1", note: "a b", at: NOW }]);
  });

  it("drops entries that lost their id", () => {
    expect(ids(readFeatured([{ note: "x" }, null, 5, { id: "" }, { id: "g1" }]))).toEqual(["g1"]);
  });

  it("never lets the same game in twice", () => {
    expect(ids(readFeatured([{ id: "g1" }, { id: "g1" }, { id: "g2" }]))).toEqual(["g1", "g2"]);
  });

  /* Storage may hold a longer list than this version allows, if the cap ever
     comes down. Reading must not then publish more than the cap. */
  it("never reads back more than the cap, whatever is stored", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `g${i}` }));
    expect(readFeatured(many).length).toBe(MAX_FEATURED);
  });

  it("treats a missing stamp as zero rather than NaN", () => {
    expect(readFeatured([{ id: "g1", at: "nonsense" }])[0].at).toBe(0);
  });
});

describe("pinning", () => {
  it("adds a game with its line", () => {
    const r = pin([], "g1", "My best win.", NOW);
    expect(r.error).toBeUndefined();
    expect(r.list).toEqual([{ id: "g1", note: "My best win.", at: NOW }]);
  });

  it("refuses a fourth", () => {
    expect(pin(full(), "g9", "", NOW).error).toBe("too-many-featured");
  });

  /* Re-pinning is an edit, not a refusal: the button on a pinned game says
     "change what you said", and a second route for that would be two names for
     one idea. */
  it("edits the line on a game already pinned, without refusing", () => {
    const once = pin([], "g1", "First thought.", NOW).list;
    const twice = pin(once, "g1", "Second thought.", NOW + 5000);
    expect(twice.error).toBeUndefined();
    expect(twice.list.length).toBe(1);
    expect(twice.list[0].note).toBe("Second thought.");
  });

  it("leaves a re-pinned game where it was, so a page does not reorder under its owner", () => {
    let list = pin(pin(pin([], "a", "", 1).list, "b", "", 2).list, "c", "", 3).list;
    list = pin(list, "a", "changed", 9).list;
    expect(ids(list)).toEqual(["a", "b", "c"]);
    expect(list[0].at).toBe(1);
  });

  it("edits a line on a full list rather than refusing it", () => {
    const r = pin(full(), "g0", "a new line", NOW);
    expect(r.error).toBeUndefined();
    expect(r.list.find((e) => e.id === "g0").note).toBe("a new line");
  });

  it("cleans the line on the way in", () => {
    expect(pin([], "g1", "  two\nlines  ", NOW).list[0].note).toBe("two lines");
  });

  it("never edits the list it was given", () => {
    const before = [];
    pin(before, "g1", "", NOW);
    expect(before).toEqual([]);
  });
});

describe("unpinning", () => {
  it("takes a game off", () => {
    const list = pin([], "g1", "", NOW).list;
    expect(unpin(list, "g1").list).toEqual([]);
  });

  it("is not an error for a game that was never on", () => {
    const r = unpin([], "g1");
    expect(r.error).toBeUndefined();
    expect(r.list).toEqual([]);
  });

  it("leaves the others alone and in order", () => {
    expect(ids(unpin(full(), "g1").list)).toEqual(["g0", "g2"]);
  });
});

describe("isPinned", () => {
  it("answers both ways", () => {
    expect(isPinned(full(), "g1")).toBe(true);
    expect(isPinned(full(), "nope")).toBe(false);
  });
});

describe("featuredWith", () => {
  const rows = new Map([["g1", { id: "g1", size: 19 }], ["g2", { id: "g2", size: 9 }]]);

  it("joins each pin to its row and carries the line", () => {
    const out = featuredWith([{ id: "g1", note: "mine", at: NOW }], rows);
    expect(out).toEqual([{ id: "g1", size: 19, note: "mine", pinnedAt: NOW }]);
  });

  it("keeps the order they were pinned in", () => {
    const out = featuredWith([{ id: "g2", note: "", at: 1 }, { id: "g1", note: "", at: 2 }], rows);
    expect(ids(out)).toEqual(["g2", "g1"]);
  });

  /* A pin whose game has gone is dropped rather than drawn as an empty card,
     so the list heals itself by being read. */
  it("drops a pin whose game is not there any more", () => {
    expect(featuredWith([{ id: "gone", note: "x", at: 1 }], rows)).toEqual([]);
  });

  it("takes a plain object as well as a Map", () => {
    expect(ids(featuredWith([{ id: "g1", note: "", at: 1 }], { g1: { id: "g1" } }))).toEqual(["g1"]);
  });

  it("is empty for no pins at all", () => {
    expect(featuredWith([], rows)).toEqual([]);
  });
});
