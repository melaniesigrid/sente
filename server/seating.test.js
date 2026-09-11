import { describe, it, expect } from "vitest";
import { fillRengoTable, rengoProgress, teamOf, TEAM_SIZE, TABLE_SIZE } from "./seating.js";

/** A seek: an id, when they arrived, and the team they asked for (or none). */
const s = (id, at, team) => ({ id, at, ...(team ? { team } : {}) });
const ids = (r) => r.order.map((x) => x.id);

describe("teamOf", () => {
  it("reads 1 and 2, and treats everything else as no preference", () => {
    expect(teamOf(s("a", 1, 1))).toBe(1);
    expect(teamOf(s("a", 1, 2))).toBe(2);
    for (const bad of [0, 3, -1, "1", null, undefined, {}]) {
      expect(teamOf({ id: "a", at: 1, team: bad })).toBeNull();
    }
    expect(teamOf(null)).toBeNull();
  });
});

describe("filling a table nobody has an opinion about", () => {
  it("waits until there are four", () => {
    for (let n = 0; n < TABLE_SIZE; n++) {
      expect(fillRengoTable(Array.from({ length: n }, (_, i) => s(`p${i}`, i)))).toBeNull();
    }
  });
  it("seats them in arrival order: b1 w1 b2 w2", () => {
    const r = fillRengoTable([s("d", 4), s("b", 2), s("a", 1), s("c", 3)]);
    expect(ids(r)).toEqual(["a", "b", "c", "d"]);
    expect(r.seats.b1.id).toBe("a");
    expect(r.seats.b2.id).toBe("c");
  });
  it("partners the first with the third, which is what the lobby promises", () => {
    const r = fillRengoTable([s("a", 1), s("b", 2), s("c", 3), s("d", 4)]);
    expect([r.seats.b1.id, r.seats.b2.id]).toEqual(["a", "c"]);
    expect([r.seats.w1.id, r.seats.w2.id]).toEqual(["b", "d"]);
  });
});

describe("filling a table people have chosen teams at", () => {
  it("puts two who picked the same team on the same team", () => {
    const r = fillRengoTable([s("a", 1, 1), s("b", 2, 2), s("c", 3, 1), s("d", 4, 2)]);
    expect([r.seats.b1.id, r.seats.b2.id]).toEqual(["a", "c"]);
    expect([r.seats.w1.id, r.seats.w2.id]).toEqual(["b", "d"]);
  });
  it("keeps partners together however they arrived", () => {
    // The two team-2 players arrive first and second; they are still a team.
    const r = fillRengoTable([s("a", 1, 2), s("b", 2, 2), s("c", 3, 1), s("d", 4, 1)]);
    expect([r.seats.b1.id, r.seats.b2.id]).toEqual(["a", "b"]);
    expect([r.seats.w1.id, r.seats.w2.id]).toEqual(["c", "d"]);
  });
  it("gives Black to the team whose first member waited longest", () => {
    const r = fillRengoTable([s("late", 9, 1), s("early", 1, 2), s("x", 10, 1), s("y", 11, 2)]);
    expect(r.seats.b1.id).toBe("early");
    expect(r.seats.w1.id).toBe("late");
  });
  it("fills the seats nobody claimed from the people who did not mind", () => {
    const r = fillRengoTable([s("pick", 1, 1), s("mate", 2, 1), s("any1", 3), s("any2", 4)]);
    expect([r.seats.b1.id, r.seats.b2.id]).toEqual(["pick", "mate"]);
    expect([r.seats.w1.id, r.seats.w2.id]).toEqual(["any1", "any2"]);
  });
  it("mixes one chooser with three who did not mind", () => {
    const r = fillRengoTable([s("any1", 1), s("pick", 2, 2), s("any2", 3), s("any3", 4)]);
    expect(r.order).toHaveLength(TABLE_SIZE);
    const team2 = [r.seats.w1.id, r.seats.w2.id].includes("pick")
      ? [r.seats.w1.id, r.seats.w2.id] : [r.seats.b1.id, r.seats.b2.id];
    expect(team2).toContain("pick");
  });
});

describe("when a team is over-subscribed", () => {
  /* Three people all want team 1. The first two get it; the third keeps waiting
     rather than being quietly moved, because being put on a team you did not
     choose is the one thing naming a team is supposed to prevent. */
  it("leaves the extra chooser waiting instead of reassigning them", () => {
    const seeks = [s("a", 1, 1), s("b", 2, 1), s("c", 3, 1), s("d", 4, 2)];
    expect(fillRengoTable(seeks)).toBeNull();
  });
  it("goes ahead once somebody takes the empty team, and the extra still waits", () => {
    const seeks = [s("a", 1, 1), s("b", 2, 1), s("c", 3, 1), s("d", 4, 2), s("e", 5, 2)];
    const r = fillRengoTable(seeks);
    expect(r).not.toBeNull();
    expect(ids(r)).toEqual(["a", "d", "b", "e"]);
    expect(ids(r)).not.toContain("c");
  });
  it("says which team is the reason four people are not playing", () => {
    const seeks = [s("a", 1, 1), s("b", 2, 1), s("c", 3, 1), s("d", 4, 2)];
    expect(rengoProgress(seeks)).toEqual({ seated: 4, of: 4, blocked: "team 1" });
  });
});

describe("rengoProgress", () => {
  it("counts the table while it fills, and blames nobody", () => {
    expect(rengoProgress([s("a", 1)])).toEqual({ seated: 1, of: 4, blocked: null });
    expect(rengoProgress([s("a", 1, 1), s("b", 2, 2)])).toEqual({ seated: 2, of: 4, blocked: null });
  });
  it("reports no blockage when the table is about to go ahead", () => {
    const full = [s("a", 1, 1), s("b", 2, 2), s("c", 3, 1), s("d", 4, 2)];
    expect(rengoProgress(full).blocked).toBeNull();
  });
});

describe("the shape of a table", () => {
  it("is two teams of two", () => {
    expect(TEAM_SIZE * 2).toBe(TABLE_SIZE);
  });
  it("never seats the same person twice", () => {
    const r = fillRengoTable([s("a", 1, 1), s("b", 2, 1), s("c", 3, 2), s("d", 4, 2)]);
    expect(new Set(ids(r)).size).toBe(TABLE_SIZE);
  });
});
