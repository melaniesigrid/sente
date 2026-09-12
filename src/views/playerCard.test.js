import { describe, it, expect } from "vitest";
import { monthYear, joinedText, seenText, recordText, factRows, saidAnything } from "./playerCard.js";
import { FACTS } from "../../server/profile.js";

/* A fixed afternoon to measure against, so "yesterday" means yesterday and not
   whatever the clock says when the suite runs. */
const NOW = new Date(2026, 8, 12, 15, 0, 0).getTime();   // 12 September 2026, 15:00 local
const daysBefore = (n, hour = 15) => new Date(2026, 8, 12 - n, hour, 0, 0).getTime();

describe("monthYear", () => {
  it("names the month and the year and nothing finer", () => {
    expect(monthYear(new Date(2026, 2, 9).getTime())).toBe("March 2026");
  });

  it("answers null rather than 'Invalid Date' for a stamp that is not one", () => {
    expect(monthYear("not a date")).toBe(null);
  });
});

describe("joinedText", () => {
  it("says when somebody arrived", () => {
    expect(joinedText(new Date(2026, 2, 9).getTime())).toBe("Here since March 2026");
  });

  it("says nothing at all without a date", () => {
    expect(joinedText(null)).toBe(null);
    expect(joinedText(undefined)).toBe(null);
  });
});

describe("seenText", () => {
  it("says today for a game earlier the same day", () => {
    expect(seenText(daysBefore(0, 2), NOW)).toBe("Played today");
  });

  it("counts calendar days, so late last night is yesterday and not ten hours ago", () => {
    expect(seenText(daysBefore(1, 23), NOW)).toBe("Played yesterday");
  });

  it("widens to the week, then the month, then a month and a year", () => {
    expect(seenText(daysBefore(3), NOW)).toBe("Played this week");
    expect(seenText(daysBefore(20), NOW)).toBe("Played this month");
    expect(seenText(daysBefore(200), NOW)).toBe("Last played February 2026");
  });

  it("never says anything finer than a day", () => {
    const said = [0, 1, 2, 6, 7, 30, 31, 400].map((d) => seenText(daysBefore(d), NOW));
    for (const line of said) expect(line).not.toMatch(/hour|minute|:|\bam\b|\bpm\b/i);
  });

  it("reads a stamp slightly ahead of this clock as today rather than the future", () => {
    expect(seenText(NOW + 60_000, NOW)).toBe("Played today");
  });

  it("says nothing without a stamp", () => {
    expect(seenText(null, NOW)).toBe(null);
    expect(seenText(0, NOW)).toBe(null);
  });
});

describe("recordText", () => {
  it("gives the record", () => {
    expect(recordText({ wins: 12, losses: 9, draws: 0 })).toBe("12 W · 9 L");
  });

  it("mentions draws only when there are some", () => {
    expect(recordText({ wins: 3, losses: 1, draws: 2 })).toBe("3 W · 1 L · 2 drawn");
  });

  it("says plainly that nothing has finished yet", () => {
    expect(recordText({ wins: 0, losses: 0, draws: 0 })).toBe("No finished games yet");
    expect(recordText({})).toBe("No finished games yet");
  });

  it("treats a record without a draws field as having none", () => {
    expect(recordText({ wins: 1, losses: 0 })).toBe("1 W · 0 L");
  });
});

describe("factRows", () => {
  it("keeps the order profile.js declares, so the page and the form agree", () => {
    const facts = Object.fromEntries(FACTS.map((f) => [f.key, "x"]));
    expect(factRows({ facts }).map((r) => r.key)).toEqual(FACTS.map((f) => f.key));
  });

  it("carries the label from profile.js rather than a copy of it", () => {
    const [first] = FACTS;
    expect(factRows({ facts: { [first.key]: "a club" } })).toEqual(
      [{ key: first.key, label: first.label, value: "a club" }]);
  });

  it("leaves out a fact that is empty or only spaces", () => {
    const [first, second] = FACTS;
    expect(factRows({ facts: { [first.key]: "", [second.key]: "   " } })).toEqual([]);
  });

  it("survives a player with no facts at all", () => {
    expect(factRows({})).toEqual([]);
    expect(factRows(null)).toEqual([]);
  });
});

describe("saidAnything", () => {
  it("is true when there is a paragraph", () => {
    expect(saidAnything({ bio: "I like the 3-4 point." })).toBe(true);
  });

  it("is true when there is one fact and no paragraph", () => {
    expect(saidAnything({ facts: { [FACTS[0].key]: "Guatemala City" } })).toBe(true);
  });

  it("is false for a card nobody has written on", () => {
    expect(saidAnything({ bio: "   ", facts: {} })).toBe(false);
    expect(saidAnything({})).toBe(false);
    expect(saidAnything(null)).toBe(false);
  });
});
