import { describe, it, expect } from "vitest";
import { RECORD, RECORD_HEADLINE, RECORD_SOURCES, SOURCES, sourceFor } from "./press.js";
import { POSTS } from "./blog.js";

/* The Record is the one part of the front door that makes claims about the
   world rather than about this app, so it is the one part that can embarrass
   us. These tests are the house rule written down: a column that cannot point
   at something does not ship. */

describe("The Record", () => {
  it("gives every column a source, or a signature instead", () => {
    for (const col of RECORD) {
      if (col.signed) continue;
      expect(col.sources.length, col.title).toBeGreaterThan(0);
    }
  });

  // A recollection is sourced by whoever is willing to put their name to it.
  // What it may not do is borrow the authority of the columns around it, so a
  // signed column cites nobody and is not allowed the figure treatment, which
  // on this page means "here is a measured number".
  it("lets a signed column stand on its signature and nothing else", () => {
    for (const col of RECORD.filter(c => c.signed)) {
      expect(col.signed.length, col.title).toBeGreaterThan(0);
      expect(col.sources, col.title).toEqual([]);
      expect(col.figure, col.title).toBeUndefined();
    }
  });

  it("opens on a headline that asks rather than asserts", () => {
    expect(RECORD_HEADLINE.length).toBeGreaterThan(10);
    expect(RECORD_HEADLINE.endsWith("?"), RECORD_HEADLINE).toBe(true);
  });

  it("points every citation at a source that exists", () => {
    for (const col of RECORD) {
      for (const id of col.sources) {
        expect(sourceFor(id), `${col.title} cites ${id}`).toBeTruthy();
      }
    }
  });

  it("leaves no source unused, counting the blog as well as the columns", () => {
    const cited = new Set([
      ...RECORD.flatMap(c => c.sources),
      ...POSTS.flatMap(p => p.sources || []),
    ]);
    for (const s of SOURCES) {
      expect(cited.has(s.id), `${s.id} is listed but nothing cites it`).toBe(true);
    }
  });

  // The rail under the front door prints what the front door used. A source
  // the blog needed and the Record did not is a footnote to a page the reader
  // is not on, and a numbered line pointing at nothing above it is worse than
  // no line at all.
  it("rails only the sources the columns actually cite", () => {
    const cited = new Set(RECORD.flatMap(c => c.sources));
    expect(RECORD_SOURCES.map(s => s.id)).toEqual(
      SOURCES.filter(s => cited.has(s.id)).map(s => s.id));
    for (const s of RECORD_SOURCES) {
      expect(cited.has(s.id), `${s.id} is railed but no column cites it`).toBe(true);
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
