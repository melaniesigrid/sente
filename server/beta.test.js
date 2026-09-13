import { describe, it, expect } from "vitest";
import { BETA_CAP, isFull, seatsLeft, waitRow, waiting, byWaiting, waitKey, listFull, capFrom,
  WAITLIST_LIMIT, WAITLIST_MAX } from "./beta.js";

describe("the cap", () => {
  it("is open under it and shut at it", () => {
    expect(isFull(99, 100)).toBe(false);
    expect(isFull(100, 100)).toBe(true);
  });

  it("stays shut for a count that has already passed a lowered cap", () => {
    expect(isFull(140, 100)).toBe(true);
    expect(seatsLeft(140, 100)).toBe(0);
  });

  it("counts the seats left", () => {
    expect(seatsLeft(0, 100)).toBe(100);
    expect(seatsLeft(97, 100)).toBe(3);
  });

  /* The number this whole feature exists to hold. A change here is a change to
     what the server can survive, so it is a change somebody has to make on
     purpose and not one that arrives inside a refactor. The arithmetic is in
     the header of beta.js. */
  it("is a hundred, and the free plan's ceiling is why", () => {
    expect(BETA_CAP).toBe(100);
    expect(BETA_CAP * 700).toBeLessThan(100_000);   // a doubled day still fits
  });
});

describe("the cap a deployment is running", () => {
  it("takes a whole number from the environment", () => {
    expect(capFrom("1")).toBe(1);
    expect(capFrom("250")).toBe(250);
    expect(capFrom(7)).toBe(7);
  });

  /* A typo in a var must not silently open the door to everybody or shut it on
     the people already in, so anything that is not a positive whole number
     falls back to the shipped cap rather than being honoured. */
  it("ignores anything that is not one, rather than honouring it", () => {
    for (const bad of [undefined, null, "", "  ", "lots", "0", 0, -5, "1.5", 2.5, NaN, {}, [],
      "1e6", "0x64", "1001", " 12x", "-3"]) {
      expect(capFrom(bad), String(bad)).toBe(BETA_CAP);
    }
  });

  it("falls back to whatever the caller names", () => {
    expect(capFrom("nope", 42)).toBe(42);
  });
});

describe("room on the waiting list", () => {
  it("lets a newcomer on while there is room", () => {
    expect(listFull(5, 10)).toBe(false);
  });

  it("uses the shipped ceiling when the caller names none", () => {
    expect(listFull(WAITLIST_MAX - 1)).toBe(false);
    expect(listFull(WAITLIST_MAX)).toBe(true);
  });

  /* The branch this function exists to make reachable. The server used to
     answer {ok: true} here and store nothing, which made the card say "your
     address is on the list" to somebody who was not on it. Every other uniform
     answer in this server hides whether a PERSON is known here; the size of
     the list is a fact about nobody, so it is said out loud. */
  it("refuses once the list is full, out loud", () => {
    expect(listFull(10, 10)).toBe(true);
    expect(listFull(11, 10)).toBe(true);
  });

  /* It takes no address, and that is the point. An earlier version let
     somebody already on the list through a full list, which meant the answer
     differed by who was asking: 200 for an address already stored, 409 for one
     that was not, which is a way to ask whether a given person asked for a
     seat here. A function with nothing but a count cannot leak that. */
  it("is a question about the list and not about any address", () => {
    expect(listFull.length).toBeLessThanOrEqual(2);
    expect(listFull(10, 10)).toBe(listFull(10, 10));
  });
});

describe("the waiting list", () => {
  it("keeps the date somebody first asked", () => {
    const first = waitRow("ada@example.com", 1000);
    expect(waiting(first, "ada@example.com", 9000)).toBe(first);
  });

  it("makes a row for somebody who has not asked before", () => {
    expect(waiting(undefined, "ada@example.com", 1000)).toEqual({ email: "ada@example.com", at: 1000 });
  });

  it("holds an address and a date and nothing else", () => {
    expect(Object.keys(waitRow("ada@example.com", 1000)).sort()).toEqual(["at", "email"]);
  });

  it("puts the longest wait first, which is the order to invite them", () => {
    const rows = [waitRow("c@x.com", 300), waitRow("a@x.com", 100), waitRow("b@x.com", 200)];
    expect(byWaiting(rows).map(r => r.email)).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("keys rows under their own prefix", () => {
    expect(waitKey("ada@example.com")).toBe("wait:ada@example.com");
  });

  it("has limits of its own, so the list cannot become the thing that fills the store", () => {
    expect(WAITLIST_LIMIT).toBeGreaterThan(0);
    expect(WAITLIST_MAX).toBeGreaterThan(BETA_CAP);
  });
});

describe("rows that came back wrong", () => {
  /* A row is read back out of storage, and storage holds whatever an older
     version of this file put there. A row with no date is not a row that keeps
     anybody's place, so it is remade rather than trusted — the same forgiveness
     `hit` gives a malformed bucket. */
  it("treats a row with no usable date as somebody who has not asked before", () => {
    for (const bad of [{}, { email: "ada@x.com" }, { email: "ada@x.com", at: "yesterday" }, { at: null }]) {
      expect(waiting(bad, "ada@x.com", 1000)).toEqual({ email: "ada@x.com", at: 1000 });
    }
  });

  it("sorts a row with no date to the front rather than throwing", () => {
    const rows = [waitRow("b@x.com", 200), { email: "a@x.com" }];
    expect(byWaiting(rows).map(r => r.email)).toEqual(["a@x.com", "b@x.com"]);
  });

  /* The operator reads this list while people are still joining it, so the
     sort must not be a side effect on whatever array it was handed. */
  it("leaves the caller's array in the order it was given", () => {
    const rows = [waitRow("c@x.com", 300), waitRow("a@x.com", 100)];
    byWaiting(rows);
    expect(rows.map(r => r.email)).toEqual(["c@x.com", "a@x.com"]);
  });
});

describe("the cap with nobody passing one", () => {
  /* Nothing in the server relies on these defaults any more. If the default
     ever drifted from the exported number, the card would say one thing and
     the door would do another. */
  it("uses the shipped cap when the caller names none", () => {
    expect(isFull(BETA_CAP - 1)).toBe(false);
    expect(isFull(BETA_CAP)).toBe(true);
    expect(seatsLeft(BETA_CAP - 3)).toBe(3);
    expect(seatsLeft(BETA_CAP + 40)).toBe(0);
  });

  /* The waiting list shares a store with the players, the addresses and the
     rate buckets. Its keys have to stay in their own corner of it. */
  it("keys rows where nothing else in the store lives", () => {
    const key = waitKey("ada@example.com");
    for (const taken of ["player:", "email:", "rate:", "seek:", "day:"]) {
      expect(key.startsWith(taken)).toBe(false);
    }
  });
});
