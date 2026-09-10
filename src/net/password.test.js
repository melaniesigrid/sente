import { describe, it, expect } from "vitest";
import { deriveKey, KDF } from "./password.js";
import { cleanKey } from "../../server/accounts.js";

describe("deriveKey", () => {
  it("produces what the server will accept", async () => {
    const key = await deriveKey("ada@example.com", "two eyes live");
    expect(cleanKey(key)).toBe(key);
  });
  it("is the same every time for the same pair, so a person can sign in twice", async () => {
    const a = await deriveKey("ada@example.com", "two eyes live");
    const b = await deriveKey("ada@example.com", "two eyes live");
    expect(a).toBe(b);
  });
  it("is salted by the address, so one table does not open two accounts", async () => {
    const a = await deriveKey("ada@example.com", "two eyes live");
    const b = await deriveKey("bob@example.com", "two eyes live");
    expect(a).not.toBe(b);
  });
  it("changes with the password", async () => {
    const a = await deriveKey("ada@example.com", "two eyes live");
    const b = await deriveKey("ada@example.com", "two eyes died");
    expect(a).not.toBe(b);
  });
  it("carries the parameters it was made under", () => {
    expect(KDF).toMatchObject({ v: 1, name: "PBKDF2-SHA256" });
  });
}, 30_000);
