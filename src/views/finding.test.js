import { describe, it, expect } from "vitest";
import { findState, searchable, MIN_QUERY, TYPING_PAUSE_MS } from "./finding.js";

const answer = (q, names = []) => ({ for: q, people: names.map((name) => ({ id: name, name })) });
const failed = (q) => ({ for: q, error: "offline" });

describe("what the search box says", () => {
  it("says nothing at all before anything is typed", () => {
    expect(findState("", null, false).kind).toBe("idle");
    expect(findState("   ", null, false).kind).toBe("idle");
    expect(findState(undefined, null, false).kind).toBe("idle");
  });

  it("asks for another letter rather than showing an empty result", () => {
    expect(findState("a", null, false).kind).toBe("short");
    expect(findState("a", answer("a"), false).kind).toBe("short");
    expect(MIN_QUERY).toBe(2);
  });

  it("is searching while the answer has not arrived", () => {
    expect(findState("ana", null, true).kind).toBe("searching");
    expect(findState("ana", null, false).kind).toBe("searching");
  });

  it("shows the people it found", () => {
    const s = findState("ana", answer("ana", ["Ana", "Anabel"]), false);
    expect(s.kind).toBe("found");
    expect(s.people.map((p) => p.name)).toEqual(["Ana", "Anabel"]);
  });

  it("says nobody by that name only once the answer is in", () => {
    expect(findState("ana", answer("ana"), false).kind).toBe("empty");
    expect(findState("ana", answer("ana"), true).kind).toBe("searching");
  });

  it("shows an error state when the request failed", () => {
    expect(findState("ana", failed("ana"), false).kind).toBe("error");
  });

  it("never paints an older answer under a newer word", () => {
    const stale = answer("an", ["Ana"]);
    expect(findState("anastasia", stale, true).kind).toBe("searching");
    expect(findState("anastasia", stale, true).people).toEqual([]);
  });

  it("does not stay on looking once an older request has already failed", () => {
    expect(findState("anastasia", failed("an"), false).kind).toBe("idle");
  });

  it("reads a typed search the way the server folds a handle", () => {
    expect(searchable("José")).toBe("jose");
    expect(searchable(" An a ")).toBe("ana");
    expect(searchable("a")).toBe(null);
  });

  it("waits for a pause in the typing rather than for every key", () => {
    expect(TYPING_PAUSE_MS).toBeGreaterThan(120);
    expect(TYPING_PAUSE_MS).toBeLessThan(600);
  });
});
