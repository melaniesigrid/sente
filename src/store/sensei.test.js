import { describe, it, expect } from "vitest";
import {
  SENSEI_KEY, LETTER_CAP, loadBox, saveBox, postLetter, unread, markRead, daysBetween, shouldWriteAbout,
  digestOf, phraseOpens,
} from "./sensei.js";

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
};

describe("the mailbox", () => {
  it("starts empty and reads back what it saved", () => {
    const s = memory();
    expect(loadBox(s)).toEqual({ letters: [], lastGame: "", wrote: "" });
    const box = postLetter(loadBox(s), "Come back.", "2026-09-13");
    saveBox({ ...box, lastGame: "2026-09-13" }, s);
    const back = loadBox(s);
    expect(back.letters).toEqual([{ at: "2026-09-13", text: "Come back.", read: false }]);
    expect(back.lastGame).toBe("2026-09-13");
    expect(back.wrote).toBe("2026-09-13");
  });

  it("keeps the last twenty and drops anything that is not a letter", () => {
    const s = memory();
    let box = loadBox(s);
    for (let i = 0; i < LETTER_CAP + 5; i++) box = postLetter(box, `l${i}`, "2026-09-13");
    expect(box.letters).toHaveLength(LETTER_CAP);
    expect(box.letters[0].text).toBe("l5");
    s.setItem(SENSEI_KEY, JSON.stringify({ letters: [{ at: 1 }, "x", { at: "d", text: "ok", read: true }], lastGame: 3 }));
    expect(loadBox(s)).toEqual({ letters: [{ at: "d", text: "ok", read: true }], lastGame: "", wrote: "" });
    s.setItem(SENSEI_KEY, "{not json");
    expect(loadBox(s).letters).toEqual([]);
  });

  it("marks letters read", () => {
    let box = postLetter(postLetter(loadBox(memory()), "a", "d"), "b", "d");
    expect(unread(box)).toHaveLength(2);
    box = markRead(box);
    expect(unread(box)).toHaveLength(0);
  });
});

describe("writing about an absence", () => {
  it("counts days between day keys", () => {
    expect(daysBetween("2026-09-10", "2026-09-13")).toBe(3);
    expect(daysBetween("", "2026-09-13")).toBe(0);
    expect(daysBetween("2026-09-13", "2026-09-10")).toBe(0);
  });
  it("writes once, after three days, and not before a game was ever played", () => {
    const box = { letters: [], lastGame: "2026-09-10", wrote: "" };
    expect(shouldWriteAbout(box, "2026-09-12")).toBe(false);
    expect(shouldWriteAbout(box, "2026-09-13")).toBe(true);
    expect(shouldWriteAbout({ ...box, wrote: "2026-09-13" }, "2026-09-13")).toBe(false);
    expect(shouldWriteAbout({ ...box, lastGame: "" }, "2026-09-13")).toBe(false);
  });
});

describe("the phrase", () => {
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
});
