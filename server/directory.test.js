import { describe, it, expect } from "vitest";
import {
  fold, terms, findKey, findKeys, idFrom, idsFrom, query, closest,
  MIN_QUERY, MAX_RESULTS, MAX_TERMS, FIND_PREFIX, FIND_CLUB_PREFIX,
} from "./directory.js";

describe("folding a handle", () => {
  it("drops case, accents, punctuation and spaces", () => {
    expect(fold("José")).toBe("jose");
    expect(fold("Ana Melendez")).toBe("anamelendez");
    expect(fold("O'Brien-Smith")).toBe("obriensmith");
    expect(fold("  Ka Ya  ")).toBe("kaya");
  });

  it("leaves a script that has no case or accents alone", () => {
    expect(fold("囲碁")).toBe("囲碁");
    expect(fold("たなか")).toBe("たなか");
  });

  it("answers empty for anything that is not text, rather than throwing", () => {
    for (const bad of [null, undefined, 7, {}, []]) expect(fold(bad)).toBe("");
  });

  it("folds a handle and a search of it the same way", () => {
    expect(fold("José")).toBe(fold("jose"));
  });
});

describe("the terms a handle is written under", () => {
  it("writes the whole handle and each of its words", () => {
    expect(terms("Ana Melendez").sort()).toEqual(["ana", "anamelendez", "melendez"]);
  });

  it("writes a one-word handle once", () => {
    expect(terms("Kaya")).toEqual(["kaya"]);
  });

  it("splits on the punctuation people actually put in a handle", () => {
    expect(terms("ana.melendez").sort()).toEqual(["ana", "anamelendez", "melendez"]);
    expect(terms("ana_melendez")).toContain("melendez");
    expect(terms("ana-melendez")).toContain("melendez");
  });

  it("caps how many keys one handle may write", () => {
    expect(terms("a b c d e f g h").length).toBeLessThanOrEqual(MAX_TERMS);
  });

  it("gives nothing for a handle with no letters or numbers in it", () => {
    expect(terms("!!")).toEqual([]);
    expect(terms(null)).toEqual([]);
  });
});

describe("index keys", () => {
  it("puts the term first so a search is a prefix", () => {
    expect(findKey("ana", "p_1")).toBe("find:ana:p_1");
    expect(findKey("ana", "p_1").startsWith(FIND_PREFIX + "an")).toBe(true);
  });

  it("reads the id back off the end", () => {
    expect(idFrom("find:ana:p_1")).toBe("p_1");
    expect(idFrom("find:anamelendez:p_deadbeef")).toBe("p_deadbeef");
  });

  it("refuses a key that is not one of ours", () => {
    for (const bad of ["player:p_1", "find:", "", null, 7]) expect(idFrom(bad)).toBe(null);
  });

  it("names every key a handle should have", () => {
    expect(findKeys("Ana Melendez", "p_1").sort())
      .toEqual(["find:ana:p_1", "find:anamelendez:p_1", "find:melendez:p_1"]);
  });

  it("counts a person matching on two terms once", () => {
    expect(idsFrom(["find:ana:p_1", "find:anamelendez:p_1", "find:ann:p_2"]))
      .toEqual(["p_1", "p_2"]);
  });

  it("keeps the order storage gave the keys back in", () => {
    expect(idsFrom(["find:ab:p_2", "find:ab:p_1"])).toEqual(["p_2", "p_1"]);
  });
});

describe("what may be searched for", () => {
  it("refuses a search too short to ask with", () => {
    expect(query("a")).toBe(null);
    expect(query("")).toBe(null);
    expect(query("  ")).toBe(null);
    expect(query("!")).toBe(null);
  });

  it("folds a search the way it folds a handle", () => {
    expect(query("Jos")).toBe("jos");
    expect(query("José")).toBe("jose");
    expect(query(" An a ")).toBe("ana");
  });

  it("counts characters after folding, so punctuation cannot pad a search", () => {
    expect(query("a-")).toBe(null);
    expect("ab".length).toBe(MIN_QUERY);
    expect(query("a-b")).toBe("ab");
  });
});

describe("which match comes first", () => {
  const p = (name) => ({ id: name, name });

  it("puts the handle that was typed in full above the ones that start with it", () => {
    const got = closest([p("Anabel"), p("Ana"), p("Anastasia")], "ana");
    expect(got.map((x) => x.name)).toEqual(["Ana", "Anabel", "Anastasia"]);
  });

  it("puts the short handles first, so a whole club named Ana is readable", () => {
    const got = closest([p("Ana Melendez"), p("Anabel")], "ana");
    expect(got.map((x) => x.name)).toEqual(["Anabel", "Ana Melendez"]);
  });

  it("puts a handle matched only on its second word last", () => {
    const got = closest([p("Bo Melendez"), p("Mel")], "mel");
    expect(got.map((x) => x.name)).toEqual(["Mel", "Bo Melendez"]);
  });

  it("answers in the same order however storage felt", () => {
    const people = [p("Bo"), p("Bob"), p("Boa")];
    expect(closest(people, "bo").map((x) => x.name))
      .toEqual(closest([...people].reverse(), "bo").map((x) => x.name));
  });

  it("leaves the list it was given alone", () => {
    const people = [p("Bob"), p("Bo")];
    closest(people, "bo");
    expect(people.map((x) => x.name)).toEqual(["Bob", "Bo"]);
  });

  it("caps at a screen rather than a page", () => {
    expect(MAX_RESULTS).toBe(20);
  });
});

describe("the second index, for clubs that let themselves be found", () => {
  it("writes the same terms under a prefix of its own", () => {
    expect(findKeys("Go Guatemala", "c_1", FIND_CLUB_PREFIX).sort())
      .toEqual(["cfind:go:c_1", "cfind:goguatemala:c_1", "cfind:guatemala:c_1"]);
  });

  /* Two indexes rather than one with a type field: a shared index would answer
     both questions at once whichever one was asked, so a search for a person
     would turn up clubs and the other way round. */
  it("cannot be read as the handle index, nor the handle index as it", () => {
    expect(idFrom("cfind:go:c_1")).toBe(null);
    expect(idFrom("find:go:p_1", FIND_CLUB_PREFIX)).toBe(null);
    expect(idFrom("cfind:go:c_1", FIND_CLUB_PREFIX)).toBe("c_1");
    expect(idsFrom(["cfind:go:c_1", "find:go:p_1"], FIND_CLUB_PREFIX)).toEqual(["c_1"]);
  });

  it("still names the handle index by default, so no caller has to say so", () => {
    expect(findKeys("Ana", "p_1")).toEqual(["find:ana:p_1"]);
    expect(idFrom("find:ana:p_1")).toBe("p_1");
  });
});
