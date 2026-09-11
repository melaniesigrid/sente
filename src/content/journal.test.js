import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import {
  RELEASES, NOTES, ENTRIES, COUNTS, LATEST,
  parseChangelog, leadOf, segments, entryById, bodySections,
} from "./journal.js";

/* The journal is the one screen whose job is to say what we did, which makes
   it the easiest place on the site to be out of date without anybody noticing.
   Two rules hold it up, and they are what these tests are.

   A release is never authored here: it is read out of CHANGELOG.md, so the
   shelf cannot claim a version the repository does not have. And a note names
   the modules it is about, which are checked to exist -- the cheapest guard
   available against a piece of writing outliving the code it describes. */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("reading the changelog", () => {
  it("finds every release the file has, and dates each one", () => {
    const md = readFileSync(new URL("../../CHANGELOG.md", import.meta.url), "utf8");
    const headings = [...md.matchAll(/^## +v[\d.]+ +\(\d{4}-\d{2}-\d{2}\)$/gm)];
    expect(RELEASES.length).toBe(headings.length);
    expect(RELEASES.length).toBeGreaterThan(0);
    for (const r of RELEASES) {
      expect(r.date, r.version).toMatch(DATE);
      expect(r.version, r.version).toMatch(/^\d+(\.\d+)*$/);
      expect(r.sections.length, r.version).toBeGreaterThan(0);
    }
  });

  it("puts the newest release first", () => {
    const dates = RELEASES.map(r => r.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("keeps a wrapped bullet as one item", () => {
    const md = [
      "# Changelog", "",
      "## v1.0.0.0 (2026-01-02)", "",
      "### Added", "",
      "- **A thing.** It does something,",
      "  and the sentence carries on",
      "  over three lines.",
      "- A second thing.", "",
      "### Fixed", "",
      "- A third thing.", "",
    ].join("\n");
    const [r] = parseChangelog(md);
    expect(r.version).toBe("1.0.0.0");
    expect(r.date).toBe("2026-01-02");
    expect(r.sections.map(s => s.title)).toEqual(["Added", "Fixed"]);
    expect(r.sections[0].items).toEqual([
      "**A thing.** It does something, and the sentence carries on over three lines.",
      "A second thing.",
    ]);
    expect(r.sections[1].items).toEqual(["A third thing."]);
  });

  it("ignores anything before the first release, and any heading it does not know", () => {
    const md = [
      "# Changelog", "", "Some preamble with a - dash in it.", "",
      "## Unversioned heading", "", "- not a release item", "",
      "## v0.1.0.0 (2026-01-01)", "", "### Added", "", "- the only item", "",
    ].join("\n");
    const out = parseChangelog(md);
    expect(out.length).toBe(1);
    expect(out[0].sections[0].items).toEqual(["the only item"]);
  });

  it("drops a release with no items rather than showing an empty one", () => {
    expect(parseChangelog("## v9.9.9.9 (2026-01-01)\n\n### Added\n").length).toBe(0);
  });

  it("never throws, whatever it is handed", () => {
    expect(() => parseChangelog("")).not.toThrow();
    expect(() => parseChangelog(null)).not.toThrow();
    expect(parseChangelog("")).toEqual([]);
  });
});

describe("a line of a release", () => {
  it("splits a bold lead off the front", () => {
    expect(leadOf("**The look.** It changed.")).toEqual({ lead: "The look.", rest: "It changed." });
    expect(leadOf("No lead here.")).toEqual({ lead: null, rest: "No lead here." });
    expect(leadOf("**Only a lead.**")).toEqual({ lead: "Only a lead.", rest: "" });
  });

  it("marks code spans as code and leaves the rest as text", () => {
    expect(segments("see `a/b.js` for it")).toEqual([
      { code: false, text: "see " },
      { code: true, text: "a/b.js" },
      { code: false, text: " for it" },
    ]);
    expect(segments("nothing special")).toEqual([{ code: false, text: "nothing special" }]);
  });

  it("leaves an unclosed span as plain text rather than swallowing the line", () => {
    const out = segments("half `open and then the rest of the sentence");
    expect(out.every(s => !s.code)).toBe(true);
    expect(out.map(s => s.text).join("")).toBe("half open and then the rest of the sentence");
  });
});

describe("the notes", () => {
  it("gives each one an id, a date, a kicker, a title and a dek", () => {
    const ids = NOTES.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of NOTES) {
      expect(n.id, n.id).toMatch(/^[a-z0-9-]+$/);
      expect(n.date, n.id).toMatch(DATE);
      expect(n.kicker.length, n.id).toBeGreaterThan(0);
      expect(n.title.length, n.id).toBeGreaterThan(10);
      expect(n.dek.length, n.id).toBeGreaterThan(20);
      expect(n.body.length, n.id).toBeGreaterThan(2);
    }
  });

  it("builds every body out of blocks the view knows how to set", () => {
    for (const n of NOTES) {
      for (const block of n.body) {
        const keys = Object.keys(block);
        expect(keys.length, n.id).toBe(1);
        expect(["p", "h"], `${n.id}: ${keys[0]}`).toContain(keys[0]);
        expect(String(Object.values(block)[0]).trim(), n.id).not.toBe("");
      }
    }
  });

  it("is about modules that exist", () => {
    for (const n of NOTES) {
      expect(n.about.length, n.id).toBeGreaterThan(0);
      for (const path of n.about) {
        const url = new URL(`../../${path}`, import.meta.url);
        expect(existsSync(url), `${n.id} is about ${path}, which is not in the repository`).toBe(true);
      }
    }
  });

  it("keeps the house voice: nothing here shouts", () => {
    for (const n of NOTES) {
      const prose = [n.title, n.dek, ...n.body.map(b => Object.values(b)[0])].join(" ");
      expect(prose, n.id).not.toContain("!");
    }
  });
});

describe("the shelf", () => {
  it("carries every note and every release, newest first", () => {
    expect(ENTRIES.length).toBe(NOTES.length + RELEASES.length);
    expect(COUNTS).toEqual({
      notes: NOTES.length, releases: RELEASES.length, entries: ENTRIES.length,
    });
    const dates = ENTRIES.map(e => e.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(LATEST).toBe(dates[0]);
  });

  it("gives every entry a unique id and one of the two kinds", () => {
    const ids = ENTRIES.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of ENTRIES) {
      expect(["note", "release"], e.id).toContain(e.kind);
      expect(e.title.trim(), e.id).not.toBe("");
    }
  });

  it("puts a note ahead of a release that landed the same day", () => {
    const day = ENTRIES.filter(e => e.date === LATEST);
    const kinds = day.map(e => e.kind);
    expect(kinds.indexOf("release") === -1 || kinds.lastIndexOf("note") < kinds.indexOf("release")).toBe(true);
  });

  it("finds an entry by id and answers null for one it does not have", () => {
    expect(entryById(ENTRIES[0].id)).toBe(ENTRIES[0]);
    expect(entryById("no-such-entry")).toBe(null);
    expect(entryById(undefined)).toBe(null);
  });

  it("promotes the headline item out of the list rather than printing it twice", () => {
    for (const e of ENTRIES.filter(x => x.kind === "release")) {
      const body = bodySections(e);
      const items = body.flatMap(s => s.items);
      const all = e.release.sections.flatMap(s => s.items);
      expect(items.length, e.id).toBe(all.length - 1);
      expect(items, e.id).not.toContain(e.head);
      expect(body.every(s => s.items.length > 0), e.id).toBe(true);
      // the words are not lost: the headline is still the entry's own title
      const { lead, rest } = leadOf(e.head);
      expect(e.title, e.id).toBe(lead || "What shipped");
      expect(e.dek, e.id).toBe(lead ? rest : e.head);
    }
  });

  it("drops only the first copy when a changelog repeats a line", () => {
    const twice = {
      head: "the same line",
      release: {
        sections: [
          { title: "Added", items: ["the same line", "another"] },
          { title: "Fixed", items: ["the same line"] },
        ],
      },
    };
    expect(bodySections(twice)).toEqual([
      { title: "Added", items: ["another"] },
      { title: "Fixed", items: ["the same line"] },
    ]);
  });

  it("names a release after its version and hangs the release on it", () => {
    for (const e of ENTRIES.filter(x => x.kind === "release")) {
      expect(e.id).toBe(`v${e.release.version}`);
      expect(e.kicker).toContain(e.release.version);
    }
  });
});
