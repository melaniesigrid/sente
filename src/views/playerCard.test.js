import { describe, it, expect } from "vitest";
import { monthYear, joinedText, seenText, recordText, factRows, saidAnything,
  hereSet, presenceLine } from "./playerCard.js";
import { FACTS } from "../../server/profile.js";
import { BASE_LOCALE, makeT } from "../i18n/index.js";

/* The wording lives in the catalogue now, so these ask it in English; the
   parity test holds the other three languages to the same lines. */
const EN = makeT(BASE_LOCALE);

/* A fixed afternoon to measure against, so "yesterday" means yesterday and not
   whatever the clock says when the suite runs. */
const NOW = new Date(2026, 8, 12, 15, 0, 0).getTime();   // 12 September 2026, 15:00 local
const daysBefore = (n, hour = 15) => new Date(2026, 8, 12 - n, hour, 0, 0).getTime();

describe("monthYear", () => {
  it("names the month and the year and nothing finer", () => {
    expect(monthYear(new Date(2026, 2, 9).getTime(), EN)).toBe("March 2026");
  });

  it("answers null rather than 'Invalid Date' for a stamp that is not one", () => {
    expect(monthYear("not a date")).toBe(null);
  });
});

describe("joinedText", () => {
  it("says when somebody arrived", () => {
    expect(joinedText(new Date(2026, 2, 9).getTime(), EN)).toBe("Here since March 2026");
  });

  it("says nothing at all without a date", () => {
    expect(joinedText(null, EN)).toBe(null);
    expect(joinedText(undefined, EN)).toBe(null);
  });
});

describe("seenText", () => {
  it("says today for a game earlier the same day", () => {
    expect(seenText(daysBefore(0, 2), EN, NOW)).toBe("Played today");
  });

  it("counts calendar days, so late last night is yesterday and not ten hours ago", () => {
    expect(seenText(daysBefore(1, 23), EN, NOW)).toBe("Played yesterday");
  });

  it("widens to the week, then the month, then a month and a year", () => {
    expect(seenText(daysBefore(3), EN, NOW)).toBe("Played this week");
    expect(seenText(daysBefore(20), EN, NOW)).toBe("Played this month");
    expect(seenText(daysBefore(200), EN, NOW)).toBe("Last played February 2026");
  });

  it("never says anything finer than a day", () => {
    const said = [0, 1, 2, 6, 7, 30, 31, 400].map((d) => seenText(daysBefore(d), EN, NOW));
    for (const line of said) expect(line).not.toMatch(/hour|minute|:|\bam\b|\bpm\b/i);
  });

  it("reads a stamp slightly ahead of this clock as today rather than the future", () => {
    expect(seenText(NOW + 60_000, EN, NOW)).toBe("Played today");
  });

  it("says nothing without a stamp", () => {
    expect(seenText(null, EN, NOW)).toBe(null);
    expect(seenText(0, EN, NOW)).toBe(null);
  });
});

describe("recordText", () => {
  it("gives the record", () => {
    expect(recordText({ wins: 12, losses: 9, draws: 0 }, EN)).toBe("12 W · 9 L");
  });

  it("mentions draws only when there are some", () => {
    expect(recordText({ wins: 3, losses: 1, draws: 2 }, EN)).toBe("3 W · 1 L · 2 drawn");
  });

  it("says plainly that nothing has finished yet", () => {
    expect(recordText({ wins: 0, losses: 0, draws: 0 }, EN)).toBe("No finished games yet");
    expect(recordText({}, EN)).toBe("No finished games yet");
  });

  it("treats a record without a draws field as having none", () => {
    expect(recordText({ wins: 1, losses: 0 }, EN)).toBe("1 W · 0 L");
  });
});

describe("factRows", () => {
  it("keeps the order profile.js declares, so the page and the form agree", () => {
    const facts = Object.fromEntries(FACTS.map((f) => [f.key, "x"]));
    expect(factRows({ facts }, EN).map((r) => r.key)).toEqual(FACTS.map((f) => f.key));
  });

  it("carries the label from profile.js rather than a copy of it", () => {
    const [first] = FACTS;
    expect(factRows({ facts: { [first.key]: "a club" } }, EN)).toEqual(
      [{ key: first.key, label: first.label, value: "a club" }]);
  });

  it("leaves out a fact that is empty or only spaces", () => {
    const [first, second] = FACTS;
    expect(factRows({ facts: { [first.key]: "", [second.key]: "   " } }, EN)).toEqual([]);
  });

  it("survives a player with no facts at all", () => {
    expect(factRows({}, EN)).toEqual([]);
    expect(factRows(null, EN)).toEqual([]);
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

describe("hereSet", () => {
  it("reads the ids out of a presence answer", () => {
    expect([...hereSet({ online: ["a", "b"] })]).toEqual(["a", "b"]);
  });

  it("is empty for an answer that names nobody, and for no answer at all", () => {
    for (const bad of [{ online: [] }, {}, null, undefined]) {
      expect([...hereSet(bad)], String(bad)).toEqual([]);
    }
  });
});

describe("presenceLine", () => {
  it("says somebody is here now, in place of when they last played", () => {
    expect(presenceLine(true, daysBefore(3), EN, NOW)).toBe("Here now");
  });

  /* Two lines saying "Here now, played this week" is one fact twice, and the
     second is the weaker version of the first. */
  it("never says both at once", () => {
    expect(presenceLine(true, daysBefore(0), EN, NOW)).not.toMatch(/played/i);
  });

  it("falls back to exactly what was said before presence existed", () => {
    for (const d of [0, 1, 3, 20, 200]) {
      expect(presenceLine(false, daysBefore(d), EN, NOW), String(d)).toBe(seenText(daysBefore(d), EN, NOW));
    }
  });

  /* Somebody who is away and somebody who did not say are the same silence:
     the screen is handed `false` for both and cannot tell them apart. */
  it("says nothing at all for somebody who is not here and never played", () => {
    expect(presenceLine(false, null, EN, NOW)).toBe(null);
  });

  it("says nothing finer than a day when they are not here", () => {
    expect(presenceLine(false, daysBefore(2), EN, NOW)).not.toMatch(/\d{1,2}:\d{2}/);
  });
});
