import { describe, it, expect } from "vitest";
import {
  SENSEI_KEY, THREAD_CAP, GAMES_CAP, loadBox, saveBox, postLetter, say, tell, unread, letters, markRead, rememberGame,
  daysBetween, shouldWriteAbout, playedWithoutHim, shouldAsk, digestOf, phraseOpens, accountOpens,
  teachShape, timesTaught, TAUGHT_CAP,
} from "./sensei.js";

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
};

describe("the box", () => {
  it("starts empty and reads back what it saved", () => {
    const s = memory();
    expect(loadBox(s)).toEqual({ thread: [], games: [], lastGame: "", wrote: "", greeted: "", seen: 0, bond: "", taught: {}, rung: "" });
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

  it("says nothing when there is no stop to speak about", () => {
    expect(rungPassed(loadBox(memory()), "")).toBe(false);
  });

  it("survives a round trip through storage", () => {
    const store = memory();
    saveBox(markRung(loadBox(store), "1d"), store);
    expect(loadBox(store).rung).toBe("1d");
  });

  it("ignores a rung stored as anything but a label", () => {
    const store = memory();
    store.setItem(SENSEI_KEY, JSON.stringify({ rung: 7 }));
    expect(loadBox(store).rung).toBe("");
  });
});
