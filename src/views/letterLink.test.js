import { describe, it, expect } from "vitest";
import { linkFromQuery, forgetLink } from "./letterLink.js";

const TOKEN = "a1b2c3d4".repeat(8);   // 64 hex characters, as the server mints them

describe("linkFromQuery", () => {
  it("reads either kind of link", () => {
    expect(linkFromQuery(`?verify=${TOKEN}`)).toEqual({ kind: "verify", token: TOKEN });
    expect(linkFromQuery(`?reset=${TOKEN}`)).toEqual({ kind: "reset", token: TOKEN });
  });

  it("ignores a query with neither", () => {
    for (const q of ["", "?", "?game=g_0123456789ab", "?verify", "?reset="]) {
      expect(linkFromQuery(q)).toBeNull();
    }
    expect(linkFromQuery(undefined)).toBeNull();
  });

  it("refuses a token that is not the shape the server mints", () => {
    // A paste that lost its tail, one with a stray character, one in capitals,
    // and something that is not a token at all. None of these are worth a
    // round trip, and none of them should be sent anywhere.
    for (const bad of [TOKEN.slice(0, 63), TOKEN + "a", TOKEN.toUpperCase(), "yes", "../../etc"]) {
      expect(linkFromQuery(`?reset=${encodeURIComponent(bad)}`)).toBeNull();
    }
  });

  it("tolerates whitespace around a token, which a mail client can add", () => {
    expect(linkFromQuery(`?verify=%20${TOKEN}%20`)).toEqual({ kind: "verify", token: TOKEN });
  });

  it("keeps its footing when the query holds other things too", () => {
    expect(linkFromQuery(`?game=g_0123456789ab&reset=${TOKEN}`)).toEqual({ kind: "reset", token: TOKEN });
  });
});

describe("forgetLink", () => {
  it("does nothing, rather than throwing, where there is no window", () => {
    // Tests and any future server render have no address bar to clean up.
    expect(() => forgetLink()).not.toThrow();
  });
});
