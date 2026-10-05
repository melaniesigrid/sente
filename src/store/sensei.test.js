import { describe, it, expect } from "vitest";
import {
  SENSEI_KEY, THREAD_CAP, GAMES_CAP, loadBox, saveBox, postLetter, say, tell, unread, letters, markRead, rememberGame,
  daysBetween, shouldWriteAbout, playedWithoutHim, logMoved, markSeen, shouldAsk, MSG_MAX, digestOf, phraseOpens, accountOpens,
  teachShape, timesTaught, TAUGHT_CAP,
} from "./sensei.js";

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
};

/* Every marker that stops him repeating himself lives in the box, so a write that
   fails under a full quota cannot be allowed to drop a "yes" to his question. */
describe("saving the box when storage is full", () => {
  const tight = (limit) => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => { if (v.length > limit) throw new Error("QuotaExceededError"); m.set(k, v); },
      removeItem: (k) => m.delete(k),
    };
  };
  const chatty = (n) => {
    let b = loadBox(tight(1e9));
    for (let i = 0; i < n; i++) b = say(b, "x".repeat(100), "2026-09-10");
    return { ...b, bond: "yes", enticed: "2026-09-10" };
  };

  it("says what it stored, and stores it all when there is room", () => {
    const s = tight(1e9);
    const b = chatty(10);
    expect(saveBox(b, s)).toEqual(b);
    expect(loadBox(s).thread).toHaveLength(10);
  });

  it("gives up the oldest of the thread before it gives up a marker", () => {
    const s = tight(4000);
    const b = chatty(150);
    const kept = saveBox(b, s);
    expect(kept, "something landed").not.toBeNull();
    expect(kept.thread.length).toBeLessThan(150);
    expect(kept.thread.at(-1)).toEqual(b.thread.at(-1));
    const back = loadBox(s);
    expect(back.bond, "the answer to his question survived").toBe("yes");
    expect(back.enticed).toBe("2026-09-10");
  });

  it("answers null when nothing at all can be written", () => {
    const blocked = { getItem: () => null, setItem: () => { throw new Error("SecurityError"); } };
    expect(saveBox(chatty(3), blocked)).toBeNull();
  });

  it("will not keep a message longer than a message", () => {
    const b = tell(loadBox(tight(1e9)), "y".repeat(MSG_MAX + 500), "2026-09-10");
    expect(b.thread[0].text).toHaveLength(MSG_MAX);
    const s = tight(1e9);
    s.setItem(SENSEI_KEY, JSON.stringify({ thread: [{ who: "you", at: "d", text: "z".repeat(MSG_MAX + 1), read: true }] }));
    expect(loadBox(s).thread).toEqual([]);
  });
});

describe("the box", () => {
  it("starts empty and reads back what it saved", () => {
    const s = memory();
    expect(loadBox(s)).toEqual({ thread: [], games: [], lastGame: "", wrote: "", greeted: "", enticed: "", seen: 0, seenTail: "", bond: "", taught: {}, rung: "" });
    let box = postLetter(loadBox(s), "Come back.", "2026-09-13");
    box = tell(box, "Hi.", "2026-09-13");
    box = say(box, "Hello.", "2026-09-13", { read: true });
    saveBox({ ...box, lastGame: "2026-09-13", bond: "asked" }, s);
    const back = loadBox(s);
    expect(back.thread).toEqual([
      { who: "him", at: "2026-09-13", text: "Come back.", read: false, letter: true },
      { who: "you", at: "2026-09-13", text: "Hi.", read: true },
      { who: "him", at: "2026-09-13", text: "Hello.", read: true },
    ]);
    expect(back.lastGame).toBe("2026-09-13");
    expect(back.wrote).toBe("2026-09-13");
    expect(back.bond).toBe("asked");
    expect(unread(back)).toHaveLength(1);
    expect(letters(back)).toHaveLength(1);
  });

  it("carries the old letters into the thread", () => {
    const s = memory();
    s.setItem(SENSEI_KEY, JSON.stringify({ letters: [{ at: "d", text: "old", read: true }], lastGame: "d" }));
    const box = loadBox(s);
    expect(box.thread).toEqual([{ who: "him", at: "d", text: "old", read: true, letter: true }]);
  });

  it("keeps the caps and drops anything that is not a line or a game", () => {
    const s = memory();
    let box = loadBox(s);
    for (let i = 0; i < THREAD_CAP + 5; i++) box = say(box, `l${i}`, "d");
    expect(box.thread).toHaveLength(THREAD_CAP);
    expect(box.thread[0].text).toBe("l5");
    for (let i = 0; i < GAMES_CAP + 3; i++) box = rememberGame(box, { mean: 0.1, areas: {} }, "d");
    expect(box.games).toHaveLength(GAMES_CAP);
    s.setItem(SENSEI_KEY, JSON.stringify({ thread: [{ who: "us" }, "x", { who: "you", at: "d", text: "ok", read: true }], games: [1, { at: "d", mean: "x" }], bond: "maybe", seen: -1 }));
    const back = loadBox(s);
    expect(back.thread).toEqual([{ who: "you", at: "d", text: "ok", read: true }]);
    expect(back.games).toEqual([]);
    expect(back.bond).toBe("");
    expect(back.seen).toBe(0);
    s.setItem(SENSEI_KEY, "{not json");
    expect(loadBox(s).thread).toEqual([]);
  });

  it("marks his lines read and leaves a box with nothing unread alone", () => {
    let box = say(say(loadBox(memory()), "a", "d"), "b", "d");
    expect(unread(box)).toHaveLength(2);
    const read = markRead(box);
    expect(unread(read)).toHaveLength(0);
    expect(markRead(read)).toBe(read);
  });

  it("remembers a game with no summary as a date only", () => {
    const box = rememberGame(loadBox(memory()), null, "2026-09-14");
    expect(box.games).toEqual([]);
    expect(box.lastGame).toBe("2026-09-14");
  });
});

describe("noticing", () => {
  it("counts days between day keys", () => {
    expect(daysBetween("2026-09-10", "2026-09-13")).toBe(3);
    expect(daysBetween("", "2026-09-13")).toBe(0);
    expect(daysBetween("2026-09-13", "2026-09-10")).toBe(0);
  });
  it("writes once, after three days, and not before a game was ever played", () => {
    const box = { ...loadBox(memory()), lastGame: "2026-09-10" };
    expect(shouldWriteAbout(box, "2026-09-12")).toBe(false);
    expect(shouldWriteAbout(box, "2026-09-13")).toBe(true);
    expect(shouldWriteAbout({ ...box, wrote: "2026-09-13" }, "2026-09-13")).toBe(false);
    expect(shouldWriteAbout({ ...box, lastGame: "" }, "2026-09-13")).toBe(false);
  });
  it("sees a game played with somebody else since he last looked", () => {
    const log = [{ bot: "kejie" }, { bot: "yuki" }, { bot: null }, { bot: "tetsu" }];
    const box = { ...loadBox(memory()), seen: 1 };
    expect(playedWithoutHim(log, box, "kejie").map((g) => g.bot)).toEqual(["yuki", "tetsu"]);
    expect(playedWithoutHim(log, { ...box, seen: 4 }, "kejie")).toEqual([]);
  });
  /* The log is a ring of fifty. Counting its entries went blind for good the day
     it filled: the length stays at fifty, so a game against somebody else never
     looked new again. */
  it("still sees a new game once the log is full and the oldest has rolled out", () => {
    const game = (i, bot) => ({ at: "2026-09-10", size: 9, handicap: 0, bot, botRank: "10k", kind: "rated", result: "B+R", won: true, moves: i });
    const full = Array.from({ length: 50 }, (_, i) => game(i, "kejie"));
    const looked = markSeen(loadBox(memory()), full);
    expect(playedWithoutHim(full, looked, "kejie")).toEqual([]);
    expect(logMoved(full, looked)).toBe(false);
    const next = [...full.slice(1), game(50, "yuki")];
    expect(next.length, "still fifty").toBe(50);
    expect(playedWithoutHim(next, looked, "kejie").map((g) => g.bot)).toEqual(["yuki"]);
    expect(logMoved(next, looked)).toBe(true);
    const again = markSeen(looked, next);
    expect(playedWithoutHim(next, again, "kejie")).toEqual([]);
    // Fifty games with somebody else since he last looked: all of them are news.
    const away = Array.from({ length: 50 }, (_, i) => game(100 + i, "tetsu"));
    expect(playedWithoutHim(away, again, "kejie")).toHaveLength(50);
    // And the mark survives a round trip through storage.
    const s = memory();
    saveBox(again, s);
    expect(loadBox(s).seenTail).toBe(again.seenTail);
  });
  it("asks once there are enough games, and never twice", () => {
    const box = loadBox(memory());
    expect(shouldAsk(box, 2)).toBe(false);
    const two = rememberGame(rememberGame(box, { mean: 0, areas: {} }, "d"), { mean: 0, areas: {} }, "d");
    expect(shouldAsk(two, 2)).toBe(true);
    expect(shouldAsk({ ...two, bond: "no" }, 2)).toBe(false);
  });
});

describe("the doors", () => {
  it("digests to the known SHA-256", async () => {
    expect(await digestOf("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("opens on the phrase whatever its case or spacing, and on nothing else", async () => {
    const d = await digestOf("open sesame");
    expect(await phraseOpens("  Open Sesame ", d)).toBe(true);
    expect(await phraseOpens("open sesame!", d)).toBe(false);
    expect(await phraseOpens("", d)).toBe(false);
    expect(await phraseOpens(null, d)).toBe(false);
  });
  it("opens for an account whose address digests to the list, and no other", async () => {
    const allowed = [await digestOf("someone@example.com")];
    expect(await accountOpens({ player: { email: "  SomeOne@Example.com " } }, allowed)).toBe(true);
    expect(await accountOpens({ player: { email: "other@example.com" } }, allowed)).toBe(false);
    expect(await accountOpens(null, allowed)).toBe(false);
    expect(await accountOpens({ player: {} }, allowed)).toBe(false);
  });
});

describe("the register of what he has taught", () => {
  it("counts a shape up and stops at the cap", () => {
    let box = loadBox(memory());
    expect(timesTaught(box, "keima")).toBe(0);
    box = teachShape(box, "keima");
    box = teachShape(box, "keima");
    expect(timesTaught(box, "keima")).toBe(2);
    for (let i = 0; i < 40; i++) box = teachShape(box, "keima");
    expect(timesTaught(box, "keima")).toBe(TAUGHT_CAP);
  });

  it("ignores being told about nothing, and does not mutate the box it was given", () => {
    const box = teachShape(loadBox(memory()), "cut");
    expect(teachShape(box, null)).toBe(box);
    const next = teachShape(box, "hane");
    expect(timesTaught(box, "hane")).toBe(0);
    expect(timesTaught(next, "hane")).toBe(1);
  });

  it("survives the round trip and drops counts that are not counts", () => {
    const s = memory();
    saveBox(teachShape(loadBox(s), "ponnuki"), s);
    expect(loadBox(s).taught).toEqual({ ponnuki: 1 });
    s.setItem(SENSEI_KEY, JSON.stringify({ taught: { cut: 3, hane: "many", ko: -1, keima: 2.5, tobi: 99 } }));
    expect(loadBox(s).taught).toEqual({ cut: 3, tobi: TAUGHT_CAP });
    s.setItem(SENSEI_KEY, JSON.stringify({ taught: "no" }));
    expect(loadBox(s).taught).toEqual({});
  });
});

import { rungPassed, markRung } from "./sensei.js";

describe("the milestones on the road", () => {
  it("marks a stop once and never speaks about it again", () => {
    const box = loadBox(memory());
    expect(rungPassed(box, "10k")).toBe(true);
    const marked = markRung(box, "10k");
    expect(rungPassed(marked, "10k")).toBe(false);
    // The next stop up is still ahead, so it is still worth saying.
    expect(rungPassed(marked, "5k")).toBe(true);
  });

  it("never walks a milestone backwards, however the rating moves", () => {
    // A rating that slips a rank must not re-announce a stop she passed long ago,
    // and must not oscillate between two of them for ever. Only upward counts.
    const box = markRung(loadBox(memory()), "10k");
    expect(rungPassed(box, "15k")).toBe(false);
    expect(rungPassed(box, "10k")).toBe(false);
    expect(rungPassed(box, "5k")).toBe(true);
  });

  it("says nothing when there is no stop to speak about", () => {
    expect(rungPassed(loadBox(memory()), "")).toBe(false);
  });

  it("survives a round trip through storage", () => {
    const store = memory();
    saveBox(markRung(loadBox(store), "1d"), store);
    expect(loadBox(store).rung).toBe("1d");
  });

  it("keeps the day he last asked her to play, so he asks once", () => {
    const store = memory();
    saveBox({ ...loadBox(store), enticed: "2026-09-16" }, store);
    expect(loadBox(store).enticed).toBe("2026-09-16");
    store.setItem(SENSEI_KEY, JSON.stringify({ enticed: 7 }));
    expect(loadBox(store).enticed).toBe("");
  });

  it("ignores a rung stored as anything but a label", () => {
    const store = memory();
    store.setItem(SENSEI_KEY, JSON.stringify({ rung: 7 }));
    expect(loadBox(store).rung).toBe("");
  });
});

describe("a summary read back from the box", () => {
  it("drops one whose counts are not counts", () => {
    const s = new Map();
    const store = { getItem: (k) => s.get(k) ?? null, setItem: (k, v) => s.set(k, v) };
    const good = { at: "2026-09-10", mean: 1.5, areas: { shape: { n: 3, mean: 0.5 }, life: { n: 0, mean: null } } };
    const bad = { ...good, areas: { shape: { n: "9999", mean: 0.5 } } };
    const nan = { ...good, mean: NaN };
    store.setItem(SENSEI_KEY, JSON.stringify({ games: [good, bad, nan] }));
    expect(loadBox(store).games).toEqual([good]);
  });
});
