import { describe, it, expect } from "vitest";
import { cleanEmail, cleanKey, passwordProblem, privateFields, KDF, MIN_PASSWORD } from "./accounts.js";

describe("cleanEmail", () => {
  it("folds case and trims, and keeps everything else", () => {
    expect(cleanEmail("  Ada.Lovelace+go@Example.CO.UK ")).toBe("ada.lovelace+go@example.co.uk");
  });
  it("does not merge a plus tag or a dotted local part into another address", () => {
    // Gmail treats these as one person; other providers do not, and it is not
    // the server's place to decide which.
    expect(cleanEmail("a+go@example.com")).not.toBe(cleanEmail("a@example.com"));
    expect(cleanEmail("a.b@example.com")).not.toBe(cleanEmail("ab@example.com"));
  });
  it("refuses anything that is not an address", () => {
    for (const v of [null, undefined, 7, "", "ada", "ada@", "@example.com", "a@b", "a b@c.com",
                     "a@@b.com", "a@b..com", "a@b.c", "<a@b.com>", "a@b.com,c@d.com"]) {
      expect(cleanEmail(v)).toBeNull();
    }
  });
  it("has bounds", () => {
    expect(cleanEmail("a@b.co")).toBe("a@b.co");
    expect(cleanEmail("a".repeat(250) + "@b.co")).toBeNull();
  });
});

describe("cleanKey", () => {
  it("takes 32 bytes of lowercase hex and nothing else", () => {
    expect(cleanKey("a".repeat(64))).toBe("a".repeat(64));
    for (const v of [null, 7, "", "A".repeat(64), "a".repeat(63), "a".repeat(65), "z".repeat(64)]) {
      expect(cleanKey(v)).toBeNull();
    }
  });
});

describe("passwordProblem", () => {
  it("passes a passphrase of the minimum length or more", () => {
    expect(passwordProblem("a".repeat(MIN_PASSWORD))).toBeNull();
    expect(passwordProblem("two eyes live in the corner")).toBeNull();
  });
  it("names what is wrong", () => {
    expect(passwordProblem(undefined)).toBe("password-required");
    expect(passwordProblem("short")).toBe("password-short");
    expect(passwordProblem("x".repeat(257))).toBe("password-long");
    expect(passwordProblem("           ")).toBe("password-blank");
  });
  it("asks for no digit, no capital and no symbol", () => {
    expect(passwordProblem("all lower case letters")).toBeNull();
  });
});

describe("privateFields", () => {
  it("says whether there is a way back in", () => {
    expect(privateFields({ email: "a@b.co", pw: { salt: "s", hash: "h" }, sessions: ["x", "y"], emailVerifiedAt: 1 }))
      .toEqual({ email: "a@b.co", hasPassword: true, emailVerified: true, sessions: 2 });
  });
  it("is honest about a handle with no account behind it", () => {
    expect(privateFields({}))
      .toEqual({ email: null, hasPassword: false, emailVerified: false, sessions: 0 });
  });
  it("separates an address that has been typed from one that has answered", () => {
    // Every account made before confirming existed has no stamp, and unproved
    // is the right thing to say about all of them.
    const typed = { email: "a@b.co", pw: { salt: "s", hash: "h" } };
    expect(privateFields(typed).emailVerified).toBe(false);
    expect(privateFields({ ...typed, emailVerifiedAt: Date.now() }).emailVerified).toBe(true);
  });
  it("never carries the stored hash or salt", () => {
    const out = privateFields({ email: "a@b.co", pw: { salt: "s", hash: "h" } });
    expect(JSON.stringify(out)).not.toContain("\"h\"");
    expect(out.pw).toBeUndefined();
  });
});

describe("KDF", () => {
  it("costs an attacker a real stretch per guess", () => {
    expect(KDF.iterations).toBeGreaterThanOrEqual(600_000);
    expect(KDF.bytes).toBe(32);
  });
});
