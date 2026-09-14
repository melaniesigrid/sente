import { describe, it, expect } from "vitest";
import { DOOR_KEY, DOOR_DIGEST, tidyPassword, digestOf, opensDoor, doorIsOpen, rememberDoor, forgetDoor } from "./door.js";

/* ----------------------- THE DOOR -----------------------
   The password is not written down in this file either. The test knows the
   shape of a right answer (the tidy digest matches) and asserts the wrong ones
   are wrong; the one place the word itself is typed is by a member. */

const memory = () => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
};
const broken = {
  getItem() { throw new Error("no storage"); },
  setItem() { throw new Error("no storage"); },
  removeItem() { throw new Error("no storage"); },
};

describe("the door", () => {
  it("ships a digest, not a password", () => {
    expect(DOOR_DIGEST).toMatch(/^[0-9a-f]{64}$/);
    expect(DOOR_KEY.startsWith("sente.")).toBe(true);
  });

  it("tidies what people say to each other by mouth", () => {
    expect(tidyPassword("  Go Guatemala ")).toBe("go guatemala");
    expect(tidyPassword(null)).toBe("");
    expect(tidyPassword(undefined)).toBe("");
  });

  it("hashes to lowercase hex, and the same input twice to the same hex", async () => {
    const a = await digestOf("abc");
    expect(a).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await digestOf("abc")).toBe(a);
  });

  it("turns away the empty answer and a near miss", async () => {
    expect(await opensDoor("")).toBe(false);
    expect(await opensDoor("   ")).toBe(false);
    expect(await opensDoor("guatemala")).toBe(false);
    expect(await opensDoor("go guatemala")).toBe(false);
  });

  it("remembers a device by the digest, so a new password locks it again", () => {
    const s = memory();
    expect(doorIsOpen(s)).toBe(false);
    expect(rememberDoor(s)).toBe(true);
    expect(doorIsOpen(s)).toBe(true);
    s.setItem(DOOR_KEY, "an older digest");
    expect(doorIsOpen(s)).toBe(false);
    rememberDoor(s);
    forgetDoor(s);
    expect(doorIsOpen(s)).toBe(false);
  });

  it("is a locked door, never an open one, when storage is gone", () => {
    expect(doorIsOpen(broken)).toBe(false);
    expect(rememberDoor(broken)).toBe(false);
    expect(() => forgetDoor(broken)).not.toThrow();
    expect(doorIsOpen(null)).toBe(false);
  });
});
