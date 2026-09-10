import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import INDEX from "./masters.json";
import { mastersFor, masterClaim, agreementLine, controlLine, MASTER_SIZE } from "./masters.js";

const EVAL = JSON.parse(readFileSync(new URL("../../public/masters/eval.json", import.meta.url), "utf8"));

describe("mastersFor", () => {
  const masters = mastersFor(EVAL);

  it("offers every master the eval has measured", () => {
    expect(masters.map((m) => m.id).sort()).toEqual(INDEX.map((m) => m.id).sort());
  });
  it("drops a master with no measurement, because the card would have nothing honest on it", () => {
    expect(mastersFor({ masters: { shusaku: EVAL.masters.shusaku } })).toHaveLength(1);
    expect(mastersFor({ masters: {} })).toEqual([]);
    expect(mastersFor(null)).toEqual([]);
  });
  it("gives every master a number measured on held-out positions", () => {
    for (const m of masters) {
      expect(m.claim.agreement).toBeGreaterThan(0);
      expect(m.claim.agreement).toBeLessThan(1);
      expect(m.claim.positions).toBeGreaterThan(0);
    }
  });
  it("always carries the control beside the book", () => {
    for (const m of masters) {
      expect(m.claim.controlText).not.toBeNull();
      expect(m.claim.withBookText).not.toBeNull();
    }
  });
});

describe("anonymity", () => {
  it("names no anonymous master anywhere on his card", () => {
    const anon = mastersFor(EVAL).filter((m) => m.anonymous);
    expect(anon.length).toBeGreaterThan(0);
    for (const m of anon) {
      const text = [m.name, m.tagline, m.bio, agreementLine(m), controlLine(m)].join(" ");
      // The persona name is all he has; the card is dates and counts otherwise.
      expect(text).toContain(String(m.year));
      expect(text.toLowerCase()).not.toMatch(/\bke\b|jie/);
    }
  });
  it("keeps the source terms with the data, so the corpus can be checked", () => {
    for (const m of mastersFor(EVAL)) {
      expect(m.source.page).toMatch(/^https?:\/\//);
      expect(m.source.terms.length).toBeGreaterThan(10);
    }
  });
});

describe("masterClaim", () => {
  it("reads the arms it is given and invents nothing", () => {
    const c = masterClaim({
      crossBook: "jowa",
      test: { positions: 100, arms: { a: { top1: 0.5 }, b: { top1: 0.6 }, cross: { top1: 0.55 } } },
      prior: { ships: true, lambda: 0.5 },
    });
    expect(c).toMatchObject({
      agreementText: "50.0%", withBookText: "60.0%", controlText: "55.0%",
      crossBook: "jowa", positions: 100, leanShips: true,
    });
  });
  it("is null when there is nothing measured", () => {
    expect(masterClaim(null)).toBeNull();
    expect(masterClaim({})).toBeNull();
    expect(masterClaim({ test: { arms: {} } })).toBeNull();
  });
  it("reports a lean that did not ship as not shipping", () => {
    const c = masterClaim({ test: { positions: 1, arms: { a: { top1: 0.5 } } }, prior: { ships: false, lambda: 0 } });
    expect(c.leanShips).toBe(false);
  });
});

describe("the claim on the card", () => {
  const masters = mastersFor(EVAL);
  const find = (id) => masters.find((m) => m.id === id);

  it("claims agreement with a year profile, never a style", () => {
    for (const m of masters) {
      const line = agreementLine(m);
      expect(line).toContain("agreement with the strong-player-of-");
      expect(line).not.toMatch(/style|plays like|in the style/i);
    }
  });
  it("names the control in the same breath as the book", () => {
    for (const m of masters) {
      expect(controlLine(m)).toContain("the control");
    }
  });
  it("matches the eval's own numbers for the 2017 profile", () => {
    const star = find("star-player");
    expect(star.claim.agreementText).toBe("61.6%");
    expect(star.claim.withBookText).toBe("61.9%");
    expect(star.claim.controlText).toBe("61.8%");
    // The control moves the number as much as his own book does, which is exactly
    // why the card claims agreement and says nothing about style.
    expect(star.claim.leanShips).toBe(false);
  });
  it("keeps Jowa's shipped lean and Shusaku's unshipped one straight", () => {
    expect(find("jowa").claim.leanShips).toBe(true);
    expect(find("shusaku").claim.leanShips).toBe(false);
  });
});

describe("board size", () => {
  it("is nineteen, the only board the books and style vectors mean anything on", () => {
    expect(MASTER_SIZE).toBe(19);
  });
});
