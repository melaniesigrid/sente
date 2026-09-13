import { describe, it, expect } from "vitest";
import { makeT, BASE_LOCALE, CATALOGUES, flatten } from "../i18n/index.js";
import {
  termsText, colourFor, inviteAction, standingOver, withoutInvite, shelfIsEmpty,
  inviteOutcomeText, inviteErrorText, INVITE_OUTCOMES, INVITE_ERRORS,
} from "./invitation.js";

const t = makeT(BASE_LOCALE);
const inv = (from, to, terms = {}) => ({ from, to, size: 19, handicap: 0, rated: true, at: 1, ...terms });

describe("the terms, said on the row", () => {
  it("gives the board and whether it counts, always", () => {
    expect(termsText(inv("a", "b"), t)).toBe("19×19 · rated");
    expect(termsText(inv("a", "b", { rated: false }), t)).toBe("19×19 · not rated");
  });

  it("says the handicap only when there is one", () => {
    expect(termsText(inv("a", "b", { size: 9, handicap: 4 }), t)).toBe("9×9 · handicap 4 · not rated");
    expect(termsText(inv("a", "b", { size: 9 }), t)).not.toContain("handicap");
  });

  /* The server forces this and the row must not contradict it: a card reading
     "handicap 4 · rated" would be promising a number that is never written. */
  it("never calls a handicap game rated, whatever the row claimed", () => {
    expect(termsText(inv("a", "b", { handicap: 2, rated: true }), t)).toContain("not rated");
  });

  it("says something readable for a row that has lost its shape", () => {
    expect(() => termsText(null, t)).not.toThrow();
    expect(termsText({}, t)).toBe("19×19 · rated");
  });
});

describe("which colour you play", () => {
  /* The guest takes Black. Whoever asked chose the board, the handicap and
     whether it counts, and the engine places a handicap for Black, so an
     inviter on that side would be handing themselves the stones. */
  it("gives Black to the person who was asked", () => {
    expect(colourFor(inv("them", "me"), "me")).toBe("b");
    expect(colourFor(inv("me", "them"), "me")).toBe("w");
  });
});

describe("where two people stand over a board", () => {
  const shelf = { incoming: [inv("asker", "me")], outgoing: [inv("me", "asked")] };

  it("reads the four standings off the two lists", () => {
    expect(standingOver(shelf, "asker")).toBe("inviting");
    expect(standingOver(shelf, "asked")).toBe("invited");
    expect(standingOver(shelf, "stranger")).toBe("none");
  });

  it("says so when they cannot be asked at all", () => {
    expect(standingOver(shelf, "stranger", false)).toBe("cannot");
    expect(standingOver(null, "stranger", false)).toBe("cannot");
  });

  it("answers something for a shelf that has not arrived yet", () => {
    expect(standingOver(null, "x")).toBe("none");
    expect(standingOver(undefined, undefined)).toBe("none");
  });
});

describe("what the button offers", () => {
  /* The case that matters: a page offering "Invite to a game" to somebody who
     has already invited you would put a second board in the air across a table
     where the first question was still waiting. */
  it("offers to play, not to invite again, when they asked first", () => {
    const a = inviteAction("inviting", t);
    expect(a.act).toBe("accept");
    expect(a.undo.act).toBe("forget");
  });

  it("offers nothing to press when yours is still out, and a way to take it back", () => {
    const a = inviteAction("invited", t);
    expect(a.act).toBe(null);
    expect(a.done).toBe(true);
    expect(a.undo.act).toBe("forget");
  });

  it("says plainly why a stranger cannot be asked, and offers nothing", () => {
    const a = inviteAction("cannot", t);
    expect(a.act).toBe(null);
    expect(a.undo).toBe(null);
    expect(a.label).toMatch(/first/i);
  });

  it("offers the invitation to somebody there is nothing standing with", () => {
    expect(inviteAction("none", t).act).toBe("invite");
  });
});

describe("the shelf on screen", () => {
  it("takes somebody off both lists at once, so a press shows its result", () => {
    const shelf = { incoming: [inv("a", "me"), inv("b", "me")], outgoing: [inv("me", "a")] };
    const next = withoutInvite(shelf, "a");
    expect(next.incoming.map((i) => i.from)).toEqual(["b"]);
    expect(next.outgoing).toEqual([]);
  });

  it("survives being handed nothing", () => {
    expect(withoutInvite(null, "a")).toEqual({ incoming: [], outgoing: [] });
    expect(shelfIsEmpty(null)).toBe(true);
    expect(shelfIsEmpty({ incoming: [], outgoing: [] })).toBe(true);
    expect(shelfIsEmpty({ incoming: [inv("a", "me")], outgoing: [] })).toBe(false);
  });
});

describe("the words for what happened", () => {
  const lines = flatten(CATALOGUES[BASE_LOCALE]);

  it("has a line for every outcome the server can answer with", () => {
    for (const outcome of INVITE_OUTCOMES) {
      expect(lines.has(`online.invites.outcome.${outcome}`), outcome).toBe(true);
      expect(inviteOutcomeText(outcome, t)).not.toBe("");
    }
  });

  it("has a line for every refusal the server can give", () => {
    for (const reason of INVITE_ERRORS) {
      expect(lines.has(`online.invites.error.${reason}`), reason).toBe(true);
    }
  });

  /* Declining and taking one back come back from the same DELETE and mean
     opposite things to whoever pressed it. If these two ever read the same, the
     one call is telling two people the same thing about different acts. */
  it("says opposite things about the two ends of one call", () => {
    expect(inviteOutcomeText("declined", t)).not.toBe(inviteOutcomeText("withdrawn", t));
  });

  it("falls back to something readable for a reason nobody wrote a line for", () => {
    expect(inviteErrorText("a-new-refusal", t)).toContain("a-new-refusal");
    expect(inviteOutcomeText("something-new", t)).toBe(inviteOutcomeText("done", t));
  });
});
