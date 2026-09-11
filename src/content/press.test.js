import { describe, it, expect } from "vitest";
import { RECORD, SOURCES, sourceFor } from "./press.js";

/* The Record is the one part of the front door that makes claims about the
   world rather than about this app, so it is the one part that can embarrass
   us. These tests are the house rule written down: a column that cannot point
   at something does not ship. */

describe("The Record", () => {
  it("gives every column a source", () => {
    for (const col of RECORD) {
      expect(col.sources.length, col.title).toBeGreaterThan(0);
    }
  });

  it("points every citation at a source that exists", () => {
    for (const col of RECORD) {
      for (const id of col.sources) {
        expect(sourceFor(id), `${col.title} cites ${id}`).toBeTruthy();
      }
    }
  });

  it("leaves no source unused, so the rail is the page and not a bibliography", () => {
    const cited = new Set(RECORD.flatMap(c => c.sources));
    for (const s of SOURCES) {
      expect(cited.has(s.id), `${s.id} is listed but nothing cites it`).toBe(true);
    }
  });

  it("gives every source enough to find it again", () => {
    for (const s of SOURCES) {
      expect(s.title, s.id).toBeTruthy();
      expect(s.where, s.id).toBeTruthy();
      expect(String(s.year), s.id).toMatch(/^\d{4}$/);
      expect(s.url, s.id).toMatch(/^https:\/\//);
    }
  });

  it("has no two sources under one id", () => {
    const ids = SOURCES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // The house voice, same as the plain words: no exclaiming, no superlatives
  // we would have to defend, and nothing in quotation marks that is not
  // actually a quotation with a source beside it.
  it("speaks in the house voice", () => {
    for (const col of RECORD) {
      for (const para of col.body) {
        expect(para, col.title).not.toMatch(/!/);
        expect(para, col.title).not.toMatch(/\b(amazing|incredible|revolutionary|unbelievable)\b/i);
      }
    }
  });

  it("keeps the one column that refuses a claim", () => {
    const refusal = RECORD.find(c => c.refuses);
    expect(refusal, "a page selling something needs the column that says no").toBeTruthy();
    expect(refusal.sources.length).toBeGreaterThan(0);
  });

  it("returns nothing for a source that is not there", () => {
    expect(sourceFor("nowhere")).toBeNull();
  });
});
