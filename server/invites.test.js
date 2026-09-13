import { describe, it, expect } from "vitest";
import {
  cleanTerms, readInvite, fresh, shelf, expired, offer, takeUp, drop, seatsFor,
  inviteKey, invitePrefix, INVITE_TTL_MS, MAX_INCOMING, MAX_OUTGOING, HANDICAPS,
} from "./invites.js";

const NOW = 1_700_000_000_000;
const inv = (from, to, at = NOW, terms = {}) => ({ from, to, ...cleanTerms(terms), at });
/** A shelf holding `n` invitations in one direction, for the cap tests. */
const many = (n, dir, meId) => Array.from({ length: n }, (_, i) =>
  (dir === "out" ? inv(meId, `x${i}`) : inv(`x${i}`, meId)));

describe("the terms", () => {
  it("defaults to the board most of the world plays on", () => {
    expect(cleanTerms({}).size).toBe(19);
    expect(cleanTerms(null).size).toBe(19);
    expect(cleanTerms({ size: 42 }).size).toBe(19);
  });

  it("takes the sizes the server actually seats", () => {
    for (const size of [9, 13, 19]) expect(cleanTerms({ size }).size).toBe(size);
  });

  it("takes the handicaps the engine actually places, and no others", () => {
    for (const handicap of HANDICAPS) expect(cleanTerms({ handicap }).handicap).toBe(handicap);
    for (const bad of [1, 10, -2, "4", null]) expect(cleanTerms({ handicap: bad }).handicap).toBe(0);
  });

  it("rates an even game unless somebody said not to", () => {
    expect(cleanTerms({}).rated).toBe(true);
    expect(cleanTerms({ rated: false }).rated).toBe(false);
  });

  it("never rates a handicap game, whatever the frame claimed", () => {
    expect(cleanTerms({ handicap: 4, rated: true }).rated).toBe(false);
    expect(cleanTerms({ handicap: 9 }).rated).toBe(false);
  });
});

describe("a stored invitation", () => {
  it("reads back what was written", () => {
    const stored = { from: "a", to: "b", size: 13, handicap: 2, rated: true, at: NOW };
    expect(readInvite(stored)).toEqual({ from: "a", to: "b", size: 13, handicap: 2, rated: false, at: NOW });
  });

  it("is nothing at all when it has lost its shape", () => {
    for (const bad of [null, undefined, 7, "inv", [], {}, { from: "a" }, { from: "a", to: "" }]) {
      expect(readInvite(bad)).toBe(null);
    }
  });

  it("is nothing when it points at the person who sent it", () => {
    expect(readInvite({ from: "a", to: "a", at: NOW })).toBe(null);
  });

  it("stands for a day and not a moment longer", () => {
    expect(fresh(inv("a", "b"), NOW)).toBe(true);
    expect(fresh(inv("a", "b"), NOW + INVITE_TTL_MS - 1)).toBe(true);
    expect(fresh(inv("a", "b"), NOW + INVITE_TTL_MS)).toBe(false);
    expect(fresh(null, NOW)).toBe(false);
  });
});

describe("a shelf", () => {
  const rows = [inv("them", "me"), inv("me", "other"), inv("old", "me", NOW - INVITE_TTL_MS - 1)];

  it("splits by who did the asking", () => {
    const s = shelf(rows, "me", NOW);
    expect(s.incoming.map((i) => i.from)).toEqual(["them"]);
    expect(s.outgoing.map((i) => i.to)).toEqual(["other"]);
  });

  it("leaves out what has aged out", () => {
    expect(shelf(rows, "me", NOW).incoming.some((i) => i.from === "old")).toBe(false);
  });

  it("reads newest first, both ways", () => {
    const s = shelf([inv("a", "me", NOW - 500), inv("b", "me", NOW)], "me", NOW);
    expect(s.incoming.map((i) => i.from)).toEqual(["b", "a"]);
  });

  it("survives a row that is not one", () => {
    expect(() => shelf([null, 7, inv("a", "me")], "me", NOW)).not.toThrow();
    expect(shelf([null, 7, inv("a", "me")], "me", NOW).incoming).toHaveLength(1);
  });

  it("names the keys that have aged out, so reading tidies", () => {
    const entries = [
      ["inv:me:them", inv("them", "me")],
      ["inv:me:old", inv("old", "me", NOW - INVITE_TTL_MS - 1)],
      ["inv:me:junk", { nonsense: true }],
    ];
    expect(expired(entries, NOW)).toEqual(["inv:me:old", "inv:me:junk"]);
  });

  it("names both shelves the same way from either side", () => {
    expect(inviteKey("me", "them")).toBe("inv:me:them");
    expect(inviteKey("them", "me").startsWith(invitePrefix("them"))).toBe(true);
  });
});

describe("asking somebody for a game", () => {
  it("writes one invitation with the terms that were asked for", () => {
    const r = offer({ mine: [], theirs: [], meId: "me", themId: "you", terms: { size: 9 }, now: NOW });
    expect(r.outcome).toBe("invited");
    expect(r.invite).toEqual({ from: "me", to: "you", size: 9, handicap: 0, rated: true, at: NOW });
  });

  it("refuses to invite yourself", () => {
    expect(offer({ mine: [], theirs: [], meId: "me", themId: "me", terms: {}, now: NOW }).error).toBe("yourself");
  });

  it("edits the terms rather than leaving two rows about one question", () => {
    const mine = [inv("me", "you", NOW - 1000, { size: 19 })];
    const r = offer({ mine, theirs: [inv("me", "you", NOW - 1000)], meId: "me", themId: "you", terms: { size: 9 }, now: NOW });
    expect(r.outcome).toBe("changed");
    expect(r.invite.size).toBe(9);
    expect(r.invite.at).toBe(NOW);
  });

  it("refuses when they asked first, rather than picking one of the two boards", () => {
    const mine = [inv("you", "me", NOW, { size: 19 })];
    const r = offer({ mine, theirs: [], meId: "me", themId: "you", terms: { size: 9 }, now: NOW });
    expect(r.error).toBe("they-asked-first");
  });

  it("lets you ask again once their invitation has aged out", () => {
    const mine = [inv("you", "me", NOW - INVITE_TTL_MS - 1)];
    expect(offer({ mine, theirs: [], meId: "me", themId: "you", terms: {}, now: NOW }).outcome).toBe("invited");
  });

  it("stops one player having too many out at once", () => {
    const mine = many(MAX_OUTGOING, "out", "me");
    expect(offer({ mine, theirs: [], meId: "me", themId: "you", terms: {}, now: NOW }).error).toBe("too-many-invites");
  });

  it("but still lets them change the terms of one they already sent", () => {
    const mine = [...many(MAX_OUTGOING - 1, "out", "me"), inv("me", "you")];
    expect(offer({ mine, theirs: [inv("me", "you")], meId: "me", themId: "you", terms: { size: 9 }, now: NOW }).outcome)
      .toBe("changed");
  });

  it("stops one player's shelf being filled by everybody else", () => {
    const theirs = many(MAX_INCOMING, "in", "you");
    expect(offer({ mine: [], theirs, meId: "me", themId: "you", terms: {}, now: NOW }).error)
      .toBe("their-invites-are-full");
  });

  it("counts only what is still standing against either cap", () => {
    const old = Array.from({ length: MAX_OUTGOING }, (_, i) => inv("me", `x${i}`, NOW - INVITE_TTL_MS - 1));
    expect(offer({ mine: old, theirs: [], meId: "me", themId: "you", terms: {}, now: NOW }).outcome).toBe("invited");
  });
});

describe("taking one up", () => {
  it("needs an invitation addressed to you", () => {
    const mine = [inv("you", "me")];
    expect(takeUp({ mine, meId: "me", themId: "you", now: NOW }).invite.from).toBe("you");
  });

  it("refuses one you sent, however much you would like the game", () => {
    const mine = [inv("me", "you")];
    expect(takeUp({ mine, meId: "me", themId: "you", now: NOW }).error).toBe("no-invite");
  });

  it("refuses one that has aged out", () => {
    const mine = [inv("you", "me", NOW - INVITE_TTL_MS - 1)];
    expect(takeUp({ mine, meId: "me", themId: "you", now: NOW }).error).toBe("no-invite");
  });

  it("seats the person who was asked as Black", () => {
    expect(seatsFor(inv("me", "you"))).toEqual({ black: "you", white: "me" });
  });
});

describe("undoing one", () => {
  it("calls it declining when they asked", () => {
    expect(drop({ mine: [inv("you", "me")], meId: "me", themId: "you", now: NOW }).outcome).toBe("declined");
  });

  it("calls it taking it back when you asked", () => {
    expect(drop({ mine: [inv("me", "you")], meId: "me", themId: "you", now: NOW }).outcome).toBe("withdrawn");
  });

  it("says plainly that there was nothing there", () => {
    expect(drop({ mine: [], meId: "me", themId: "you", now: NOW }).outcome).toBe("nothing");
    expect(drop({ mine: [inv("you", "me", NOW - INVITE_TTL_MS - 1)], meId: "me", themId: "you", now: NOW }).outcome)
      .toBe("nothing");
  });
});
