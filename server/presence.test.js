import { describe, it, expect } from "vitest";
import {
  SHOW_ONLINE, SHOW_ONLINE_IDS, DEFAULT_SHOW_ONLINE,
  cleanShowOnline, canSeeOnline, whoIsHere, askedIds, MAX_ASK,
} from "./presence.js";

const who = (id, showOnline) => ({ id, showOnline });
const allHere = () => true;
const noneHere = () => false;

describe("the three settings", () => {
  it("offers exactly three, each with a label and a hint", () => {
    expect(SHOW_ONLINE_IDS).toEqual(["nobody", "friends", "everyone"]);
    for (const o of SHOW_ONLINE) {
      expect(o.label, o.id).toBeTruthy();
      expect(o.hint, o.id).toBeTruthy();
    }
  });

  /* The default is the whole privacy posture of this slice, so it gets a test
     of its own rather than being an implementation detail of cleanShowOnline. */
  it("defaults to friends, not everyone", () => {
    expect(DEFAULT_SHOW_ONLINE).toBe("friends");
    expect(cleanShowOnline(undefined)).toBe("friends");
    expect(cleanShowOnline(null)).toBe("friends");
  });

  it("keeps a real setting", () => {
    for (const id of SHOW_ONLINE_IDS) expect(cleanShowOnline(id)).toBe(id);
  });

  /* A browser sending nonsense must leave somebody more private than they
     asked for, never less, so everything unknown lands on the default and the
     default is not "everyone". */
  it("turns anything it does not know into the default", () => {
    for (const bad of ["", "EVERYONE", "public", 1, true, {}, [], "friends "]) {
      expect(cleanShowOnline(bad), String(bad)).toBe(DEFAULT_SHOW_ONLINE);
    }
  });
});

describe("canSeeOnline", () => {
  it("shows you to yourself whatever you chose", () => {
    for (const id of SHOW_ONLINE_IDS) {
      expect(canSeeOnline(who("me", id), "me", false), id).toBe(true);
    }
  });

  it("shows an everyone player to a stranger, and to somebody with no handle", () => {
    expect(canSeeOnline(who("them", "everyone"), "me", false)).toBe(true);
    expect(canSeeOnline(who("them", "everyone"), null, false)).toBe(true);
  });

  it("shows a friends player only to a settled friend", () => {
    expect(canSeeOnline(who("them", "friends"), "me", true)).toBe(true);
    expect(canSeeOnline(who("them", "friends"), "me", false)).toBe(false);
  });

  /* A request is not a friendship. Asking somebody must not be a way to watch
     when they are at their desk while they decide whether to answer. */
  it("does not show a friends player to somebody merely waiting on an answer", () => {
    expect(canSeeOnline(who("them", "friends"), "me", false)).toBe(false);
  });

  it("shows a friends player to nobody at all without a handle", () => {
    expect(canSeeOnline(who("them", "friends"), null, true)).toBe(false);
  });

  it("shows a nobody player to nobody, friend or not", () => {
    expect(canSeeOnline(who("them", "nobody"), "me", true)).toBe(false);
    expect(canSeeOnline(who("them", "nobody"), "me", false)).toBe(false);
  });

  it("treats a player who never chose as having chosen friends", () => {
    expect(canSeeOnline({ id: "them" }, "me", true)).toBe(true);
    expect(canSeeOnline({ id: "them" }, "me", false)).toBe(false);
  });

  it("is false for something that is not a player", () => {
    expect(canSeeOnline(null, "me", true)).toBe(false);
    expect(canSeeOnline({}, "me", true)).toBe(false);
  });
});

describe("whoIsHere", () => {
  const people = [who("a", "everyone"), who("b", "friends"), who("c", "nobody"), who("d", "friends")];

  it("gives back only ids, and only the ones that may be seen and are here", () => {
    expect(whoIsHere(people, "me", ["b"], allHere)).toEqual(["a", "b"]);
  });

  it("leaves out somebody permitted but not here", () => {
    const here = (id) => id === "a";
    expect(whoIsHere(people, "me", ["b", "d"], here)).toEqual(["a"]);
  });

  /* The privacy claim in the module header, asserted: nothing in the answer
     distinguishes "not here" from "not telling you". Both are simply absent,
     so the shape of the answer can never publish a hidden player's setting. */
  it("never says anybody is offline, so hidden and away look identical", () => {
    const hiddenButHere = whoIsHere([who("c", "nobody")], "me", [], allHere);
    const shownButAway = whoIsHere([who("a", "everyone")], "me", [], noneHere);
    expect(hiddenButHere).toEqual([]);
    expect(shownButAway).toEqual([]);
    expect(hiddenButHere).toEqual(shownButAway);
  });

  it("takes a Set or an array of friend ids alike", () => {
    expect(whoIsHere(people, "me", new Set(["d"]), allHere)).toEqual(["a", "d"]);
    expect(whoIsHere(people, "me", ["d"], allHere)).toEqual(["a", "d"]);
  });

  it("copes with no friends at all", () => {
    expect(whoIsHere(people, "me", null, allHere)).toEqual(["a"]);
    expect(whoIsHere([], "me", ["b"], allHere)).toEqual([]);
  });

  it("includes the viewer themselves when they are here", () => {
    expect(whoIsHere([who("me", "nobody")], "me", [], allHere)).toEqual(["me"]);
  });

  it("shows an everyone player to a caller with no handle", () => {
    expect(whoIsHere(people, null, [], allHere)).toEqual(["a"]);
  });
});

describe("askedIds", () => {
  it("splits, trims and keeps the order asked", () => {
    expect(askedIds("a, b ,c")).toEqual(["a", "b", "c"]);
  });

  it("drops duplicates, so one id cannot be used to multiply the work", () => {
    expect(askedIds("a,a,a,b")).toEqual(["a", "b"]);
  });

  it("is empty for nothing, for nonsense, and for a string of commas", () => {
    for (const bad of ["", null, undefined, 7, ",,,", " , "]) {
      expect(askedIds(bad), String(bad)).toEqual([]);
    }
  });

  it("drops an id too long to be one rather than passing it to storage", () => {
    expect(askedIds(`ok,${"x".repeat(65)}`)).toEqual(["ok"]);
  });

  /* The route must not become a way to sweep the whole ladder in one request. */
  it("caps how many may be asked about at once", () => {
    const many = Array.from({ length: MAX_ASK + 50 }, (_, i) => `p${i}`).join(",");
    expect(askedIds(many).length).toBe(MAX_ASK);
  });
});

describe("the setting is never on a public view", () => {
  /* The whole value of choosing "nobody" is that nobody knows you chose it. If
     `publicPlayer` ever carried the setting, the ladder would be a list of who
     has something to hide, which is worse than the presence it was hiding. */
  it("publicPlayer does not carry showOnline", async () => {
    const { publicPlayer } = await import("./players.js");
    const row = publicPlayer({
      id: "p1", name: "A", tint: "mint", rating: 900, rd: 80,
      wins: 1, losses: 0, draws: 0, createdAt: 1, lastSeen: 2,
      showOnline: "nobody",
    });
    expect("showOnline" in row).toBe(false);
    expect(JSON.stringify(row)).not.toContain("nobody");
  });
});
