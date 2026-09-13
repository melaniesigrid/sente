import { describe, it, expect } from "vitest";
import { makeT, BASE_LOCALE, CATALOGUES, flatten } from "../i18n/index.js";
import {
  roleLabel, clubLine, clubProblem, codeProblem, clubActs, rowActs,
  clubErrorText, CLUB_ERRORS, withoutClub, withoutMember, withRole,
  NAME_MIN, NAME_MAX, ABOUT_MAX,
} from "./club.js";

const t = makeT(BASE_LOCALE);
const club = (over = {}) => ({ id: "c_1", name: "Go Guatemala", about: "", listed: false, members: 4, ...over });

describe("what a role is called", () => {
  /* The roll is mostly members, and a badge on every row is a badge on nobody. */
  it("gives a plain member no chip at all", () => {
    expect(roleLabel("member", t)).toBe("");
    expect(roleLabel(null, t)).toBe("");
  });

  it("names the two that mean something", () => {
    expect(roleLabel("founder", t)).toBeTruthy();
    expect(roleLabel("keeper", t)).toBeTruthy();
    expect(roleLabel("founder", t)).not.toBe(roleLabel("keeper", t));
  });
});

describe("the line under a club's name", () => {
  it("says how many are in it and whether it can be found", () => {
    expect(clubLine(club({ members: 1 }), t)).toContain("1");
    expect(clubLine(club({ listed: true }), t)).not.toBe(clubLine(club({ listed: false }), t));
  });

  it("says something for a club that has not finished loading", () => {
    expect(() => clubLine({}, t)).not.toThrow();
    expect(clubLine({}, t)).toContain("0");
  });
});

describe("what a form refuses before it asks", () => {
  it("wants a name long enough to be one", () => {
    expect(clubProblem({ name: "" }, t)).toBeTruthy();
    expect(clubProblem({ name: "x" }, t)).toBeTruthy();
    expect(clubProblem({ name: "x".repeat(NAME_MIN) }, t)).toBe(null);
  });

  it("refuses a name or a description too long to store", () => {
    expect(clubProblem({ name: "x".repeat(NAME_MAX + 1) }, t)).toBeTruthy();
    expect(clubProblem({ name: "Club", about: "x".repeat(ABOUT_MAX + 1) }, t)).toBeTruthy();
    expect(clubProblem({ name: "Club", about: "x".repeat(ABOUT_MAX) }, t)).toBe(null);
  });

  it("does not count the spaces round a name against it", () => {
    expect(clubProblem({ name: "  Club  " }, t)).toBe(null);
  });

  it("reads a code however somebody grouped it, and refuses one that is not one", () => {
    expect(codeProblem("abcd-2345", t)).toBe(null);
    expect(codeProblem("ABCD2345", t)).toBe(null);
    expect(codeProblem("", t)).toBeTruthy();
    expect(codeProblem("ABCD234", t)).toBeTruthy();
    expect(codeProblem("ABCD234O", t)).toBeTruthy();
  });
});

describe("what a club's own page offers", () => {
  it("gives a founder everything, and no way out", () => {
    const a = clubActs("founder");
    expect(a.change && a.rollCode && a.close && a.nameKeepers && a.showTheDoor).toBe(true);
    expect(a.leave).toBe(false);
  });

  it("gives a keeper the door and nothing that changes the club", () => {
    const a = clubActs("keeper");
    expect(a.showTheDoor).toBe(true);
    expect(a.change || a.rollCode || a.close || a.nameKeepers).toBe(false);
    expect(a.leave).toBe(true);
  });

  it("gives a member the way out and the code, and nothing else", () => {
    const a = clubActs("member");
    expect(a.leave && a.seeCode).toBe(true);
    expect(a.change || a.rollCode || a.close || a.nameKeepers || a.showTheDoor).toBe(false);
  });

  /* The code is the key to the front door, and somebody who is not through it
     has no business holding one. */
  it("shows the code to nobody who is not in the club", () => {
    expect(clubActs(null).seeCode).toBe(false);
    expect(clubActs(null).leave).toBe(false);
  });
});

describe("what one row on the roll offers", () => {
  it("offers nothing on your own row", () => {
    expect(rowActs({ myRole: "founder", theirRole: "founder", mine: true }))
      .toEqual({ name: false, unname: false, door: false });
  });

  /* Nobody can name, unname or remove the founder. That is the rule that stops
     one bad afternoon emptying a club. */
  it("offers nothing on the founder's row, to anybody", () => {
    for (const myRole of ["founder", "keeper", "member"]) {
      expect(rowActs({ myRole, theirRole: "founder", mine: false }), myRole)
        .toEqual({ name: false, unname: false, door: false });
    }
  });

  it("lets a founder name a member and unname a keeper", () => {
    expect(rowActs({ myRole: "founder", theirRole: "member", mine: false }).name).toBe(true);
    expect(rowActs({ myRole: "founder", theirRole: "keeper", mine: false }).unname).toBe(true);
  });

  it("lets a keeper show a member out but not another keeper", () => {
    expect(rowActs({ myRole: "keeper", theirRole: "member", mine: false }).door).toBe(true);
    expect(rowActs({ myRole: "keeper", theirRole: "keeper", mine: false }).door).toBe(false);
  });

  it("lets a founder show a keeper out", () => {
    expect(rowActs({ myRole: "founder", theirRole: "keeper", mine: false }).door).toBe(true);
  });

  it("gives a plain member nothing on anybody's row", () => {
    expect(rowActs({ myRole: "member", theirRole: "member", mine: false }))
      .toEqual({ name: false, unname: false, door: false });
  });
});

describe("the words for a refusal", () => {
  const lines = flatten(CATALOGUES[BASE_LOCALE]);

  it("has a line for every refusal the server can give", () => {
    for (const reason of CLUB_ERRORS) {
      expect(lines.has(`club.error.${reason}`), reason).toBe(true);
    }
  });

  /* "You cannot leave" on its own reads as a bug. The line has to say why, and
     what to do instead. */
  it("says what a founder should do instead of leaving", () => {
    expect(clubErrorText("founder-cannot-leave", t)).toMatch(/hand|close/i);
  });

  it("falls back to something readable for a reason nobody wrote a line for", () => {
    expect(clubErrorText("a-new-refusal", t)).toContain("a-new-refusal");
  });
});

describe("the lists on screen", () => {
  const rows = [{ id: "p_1", role: "member" }, { id: "p_2", role: "keeper" }];

  it("takes a club out by hand so leaving shows its result", () => {
    expect(withoutClub([club(), club({ id: "c_2" })], "c_1").map((c) => c.id)).toEqual(["c_2"]);
    expect(withoutClub(null, "c_1")).toEqual([]);
  });

  it("takes a member out by hand", () => {
    expect(withoutMember(rows, "p_1").map((m) => m.id)).toEqual(["p_2"]);
  });

  /* Re-sorting on the client would move a row out from under the finger that
     just pressed it. */
  it("changes a role in place, keeping the order the server sent", () => {
    expect(withRole(rows, "p_1", "keeper").map((m) => [m.id, m.role]))
      .toEqual([["p_1", "keeper"], ["p_2", "keeper"]]);
  });

  it("survives being handed nothing", () => {
    expect(withoutMember(null, "p_1")).toEqual([]);
    expect(withRole(null, "p_1", "keeper")).toEqual([]);
  });
});
