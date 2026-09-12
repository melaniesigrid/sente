/* ----------------------- THE CHAIN, CHECKED -----------------------
   The run is derived by replaying the record, so every case here is a record
   and the reading it has to produce. The rest days are the part worth being
   strict about: forgiveness that is wrong in the player's favour is a streak
   that lies about how often somebody practised, and forgiveness that is wrong
   the other way is the thing this replaced. */
import { describe, it, expect } from "vitest";
import {
  attendDay, chainRun, recentDays, sanitizeChain, seedFromKata, daysBetween,
  CHAIN_KEEP, REST_EVERY, REST_MAX,
} from "./chain.js";
import { addDays } from "./kata.js";
import { sanitizeProfile, defaultProfile } from "../store/profile.js";

const TODAY = "2026-09-12";
/** A record of `n` consecutive days ending `end`. */
const run = (n, end = TODAY) => Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
const withChain = (chain, extra = {}) => ({ ...defaultProfile, chain, ...extra });

describe("day arithmetic", () => {
  it("counts whole days across a month and a DST change", () => {
    expect(daysBetween("2026-09-12", "2026-09-13")).toBe(1);
    expect(daysBetween("2026-08-31", "2026-09-01")).toBe(1);
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);   // spring forward, in UTC
    expect(daysBetween("2026-09-13", "2026-09-12")).toBe(-1);
  });
});

describe("the run", () => {
  it("is nothing until a day is practised", () => {
    const r = chainRun(withChain([]), TODAY);
    expect(r).toMatchObject({ days: 0, alive: false, today: false, total: 0 });
  });

  it("counts consecutive days, today included", () => {
    const r = chainRun(withChain(run(5)), TODAY);
    expect(r).toMatchObject({ days: 5, alive: true, today: true, total: 5 });
  });

  // Yesterday's practice holds the run up until tonight. This is the state the
  // dashboard is in every morning, so it is the one the note has to get right.
  it("stays alive through a day that has not been used yet", () => {
    const r = chainRun(withChain(run(3, addDays(TODAY, -1))), TODAY);
    expect(r).toMatchObject({ days: 3, alive: true, today: false });
  });

  it("ends when a day is missed with nothing in hand", () => {
    const r = chainRun(withChain(run(3, addDays(TODAY, -2))), TODAY);
    expect(r).toMatchObject({ days: 0, alive: false, today: false });
  });

  it("keeps the longest run after it has ended", () => {
    const chain = run(9, addDays(TODAY, -30));
    const best = chainRun(withChain(chain), addDays(TODAY, -22)).best;
    expect(best).toBe(9);
    const after = chainRun(withChain(chain, { chainBest: best }), TODAY);
    expect(after).toMatchObject({ days: 0, alive: false, best: 9 });
  });
});

describe("rest days", () => {
  it("earns one for every seven days practised, and holds no more than two", () => {
    expect(chainRun(withChain(run(REST_EVERY - 1)), TODAY).rest).toBe(0);
    expect(chainRun(withChain(run(REST_EVERY)), TODAY).rest).toBe(1);
    expect(chainRun(withChain(run(REST_EVERY * 2)), TODAY).rest).toBe(REST_MAX);
    expect(chainRun(withChain(run(REST_EVERY * 9)), TODAY).rest).toBe(REST_MAX);
  });

  // The whole point of the mechanism: a fortnight of practice, one day away,
  // and the run carries on through the gap rather than starting again at one.
  it("carries the run through a missed day and charges it one", () => {
    const chain = [...run(14, addDays(TODAY, -2)), TODAY];   // 14 days, a gap, then today
    const r = chainRun(withChain(chain), TODAY);
    expect(r).toMatchObject({ days: 16, alive: true, today: true });
    expect(r.rest).toBe(REST_MAX - 1);
  });

  it("spends nothing it has not earned", () => {
    const chain = [...run(3, addDays(TODAY, -2)), TODAY];    // 3 days, a gap, then today
    expect(chainRun(withChain(chain), TODAY)).toMatchObject({ days: 1, alive: true, today: true });
  });

  it("cannot cover two days in a row on one rest day", () => {
    const chain = [...run(7, addDays(TODAY, -3)), TODAY];    // earns one, misses two
    expect(chainRun(withChain(chain), TODAY)).toMatchObject({ days: 1, today: true });
  });

  it("covers two days in a row when two are held", () => {
    const chain = [...run(14, addDays(TODAY, -3)), TODAY];
    const r = chainRun(withChain(chain), TODAY);
    expect(r).toMatchObject({ days: 17, alive: true });
    expect(r.rest).toBe(0);
  });

  // A rest day lengthens the run but is not practice, so it must not earn the
  // next rest day. Otherwise a player who practises once a week keeps a run
  // going for ever on rest days they never earned.
  it("does not let a rest day pay for the next one", () => {
    // 7 days earn one; it covers a gap; six more days is 13 practised, not 14,
    // so the second rest day is still unearned.
    const chain = [...run(7, addDays(TODAY, -7)), ...run(6, TODAY)];
    expect(chainRun(withChain(chain), TODAY).rest).toBe(0);
    // the seventh practised day after the gap earns it
    const more = [...run(7, addDays(TODAY, -8)), ...run(7, TODAY)];
    expect(chainRun(withChain(more), TODAY).rest).toBe(1);
  });

  it("warns only when the run really does end tonight", () => {
    // practised through yesterday, nothing in hand: tonight ends it
    expect(chainRun(withChain(run(3, addDays(TODAY, -1))), TODAY).endsToday).toBe(true);
    // a rest day in hand covers tonight, so there is nothing to warn about
    expect(chainRun(withChain(run(REST_EVERY, addDays(TODAY, -1))), TODAY).endsToday).toBe(false);
    // practised today: nothing to warn about either
    expect(chainRun(withChain(run(3)), TODAY).endsToday).toBe(false);
  });
});

describe("writing the day down", () => {
  it("is idempotent within a day", () => {
    const p = withChain(run(2));
    expect(attendDay(p, TODAY)).toEqual({});
  });

  it("adds today and carries the best forward", () => {
    const p = withChain(run(4, addDays(TODAY, -1)), { chainBest: 4 });
    const patch = attendDay(p, TODAY);
    expect(patch.chain).toHaveLength(5);
    expect(patch.chainBest).toBe(5);
  });

  it("keeps the record inside its cap", () => {
    const p = withChain(run(CHAIN_KEEP, addDays(TODAY, -1)));
    const patch = attendDay(p, TODAY);
    expect(patch.chain).toHaveLength(CHAIN_KEEP);
    expect(patch.chain.at(-1)).toBe(TODAY);
  });

  // A day written out of order (a device whose clock was wrong, or a profile
  // carried between time zones) must not leave the record unsorted, since the
  // replay walks it in order and would read the gaps backwards.
  it("keeps the record sorted whatever order days arrive in", () => {
    const p = withChain([addDays(TODAY, -1), addDays(TODAY, -5)]);
    expect(attendDay(p, TODAY).chain).toEqual([addDays(TODAY, -5), addDays(TODAY, -1), TODAY]);
  });
});

describe("the strip", () => {
  it("ends on today and reports each day once", () => {
    const days = recentDays(withChain(run(3)), TODAY, 28);
    expect(days).toHaveLength(28);
    expect(days.at(-1)).toEqual({ key: TODAY, practised: true });
    expect(days.filter(d => d.practised)).toHaveLength(3);
  });
});

describe("the stored record", () => {
  it("drops anything that is not a real day", () => {
    expect(sanitizeChain(["2026-09-12", "banana", 7, null, "2026-13-45"])).toEqual(["2026-09-12"]);
    expect(sanitizeChain("2026-09-12")).toBe(null);
  });

  it("sorts, de-duplicates and caps what it keeps", () => {
    const long = run(CHAIN_KEEP + 50);
    expect(sanitizeChain([...long, ...long].reverse())).toEqual(long.slice(-CHAIN_KEEP));
  });

  it("survives a profile full of rubbish", () => {
    const p = sanitizeProfile({ chain: ["2026-09-12", "nope"], chainBest: 3 });
    expect(p.chain).toEqual(["2026-09-12"]);
    expect(p.chainBest).toBe(3);
  });
});

describe("the profile that predates the chain", () => {
  it("keeps a streak somebody was already holding", () => {
    const seeded = seedFromKata({ kataDate: TODAY, kataStreak: 4 });
    expect(seeded).toEqual(run(4));
    expect(chainRun({ ...defaultProfile, chain: seeded }, TODAY).days).toBe(4);
  });

  it("is seeded on load, so the run does not reset on the day this ships", () => {
    const p = sanitizeProfile({ kataDate: TODAY, kataStreak: 6, kataBest: 9 });
    expect(p.chain).toHaveLength(6);
    expect(chainRun(p, TODAY)).toMatchObject({ days: 6, today: true });
  });

  it("seeds nothing from a profile that never attended", () => {
    expect(seedFromKata({ kataDate: "", kataStreak: 0 })).toBe(null);
    expect(sanitizeProfile({}).chain).toEqual([]);
  });
});
