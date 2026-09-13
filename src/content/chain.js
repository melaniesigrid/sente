/* ----------------------- THE CHAIN -----------------------
   What the player has actually practised, day by day, and the run it adds up
   to. It replaces the kata's own attendance counter, which had two problems
   worth stating, because both are the kind a streak is usually allowed to keep.

   It counted one button. A player who finished two lessons, sat a recall and
   played three rated games, and did not tap the kata, lost the streak anyway:
   the number punished exactly the day it was meant to reward.

   And it was a number with no record behind it. `kataStreak` was an integer,
   so nothing could show the reader the chain they were being asked not to
   break, and nothing could be checked afterwards.

   Here a day is either practised or it is not, and the record is the list of
   days. Everything else (the run, the rest days, whether tonight ends it) is
   derived from that list by replaying it, the way a belt is derived from a
   rating rather than stored beside it. Nothing here is a rule about go, so
   nothing here belongs in the engine; it is a fact about a reader's week.

   Rest days: seven days of practice earn one, and a player may hold two. A
   missed day spends one if there is one to spend, and the run carries on
   through it. That is the whole forgiveness mechanism, and it is written down
   rather than hidden, because a run that quietly survives gaps is a run that
   is lying about how often somebody practised. A player who holds none and
   misses a day starts again the next day, and the record still holds every day
   they did practise. */
import { dayKey, addDays, previousDay } from "./kata.js";

/** Days of the record kept. Thirteen months, so the profile's year grid is
 *  always full and a chain that ran all last year is still worth looking at.
 *  About five kilobytes of day keys at the cap. */
export const CHAIN_KEEP = 400;

/** Days of practice that earn one rest day, and the most a player may hold.
 *  Two is deliberate: enough for a weekend away, not enough to hold a run
 *  together with one sitting a fortnight. */
export const REST_EVERY = 7;
export const REST_MAX = 2;

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Whole days from `a` to `b`, both day keys. Negative if b is before a. */
export function daysBetween(a, b) {
  const t = (k) => { const [y, m, d] = k.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 86400000);
}

const isDayKey = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && addDays(v, 0) === v;

/** The stored record, cleaned: day keys only, in order, no repeats, capped at
 *  the last CHAIN_KEEP of them. Stored JSON is untrusted like every other
 *  field, and a chain full of rubbish should cost the reader their run rather
 *  than crash the dashboard. */
export function sanitizeChain(value) {
  if (!Array.isArray(value)) return null;
  const seen = [...new Set(value.filter(isDayKey))].sort();
  return seen.slice(-CHAIN_KEEP);
}

/** Today's practice, written down. Idempotent within the day: a reader who
 *  solves the kata, sits a recall and finishes a game has practised once. */
export function attendDay(profile, key = dayKey()) {
  const chain = profile.chain || [];
  if (chain[chain.length - 1] === key) return {};
  const next = [...new Set([...chain, key])].sort().slice(-CHAIN_KEEP);
  const run = replay(next, key);
  return { chain: next, chainBest: Math.max(profile.chainBest || 0, run.days) };
}

/** Walk the record forward, carrying the run and the rest days held. Returns
 *  the state as of the last day in the record, which is all the reader's own
 *  history can say; what today makes of it is `chainRun`'s business. */
function replay(chain, _today) {
  let days = 0, rest = 0, best = 0, prev = null;
  // Days actually practised inside the current run. A rest day lengthens the
  // run but earns nothing, because what is being rewarded is turning up: seven
  // days of practice earn one rest day, not seven days of elapsed calendar.
  let practised = 0;
  for (const day of chain) {
    if (prev === null) { days = 1; practised = 1; }
    else {
      const missed = daysBetween(prev, day) - 1;
      if (missed === 0) { days += 1; practised += 1; }
      else if (missed <= rest) { rest -= missed; days += missed + 1; practised += 1; }
      else { days = 1; practised = 1; rest = 0; }
    }
    // Never more than REST_MAX held: a long run does not bank a month away.
    if (practised % REST_EVERY === 0) rest = Math.min(REST_MAX, rest + 1);
    best = Math.max(best, days);
    prev = day;
  }
  return { days, rest, best, last: prev };
}

/** What the chain looks like standing on `key`, which is the only question any
 *  view asks of it.
 *
 *  `days`      the run, counting today if today has been practised
 *  `alive`     the run is still going: today or yesterday was practised, or a
 *              rest day covers the gap
 *  `today`     today has been practised
 *  `rest`      rest days held right now, after any spent covering the gap
 *  `endsToday` the run is alive, today is unpractised, and there is no rest day
 *              left to cover tonight. The one honest warning in the product. */
export function chainRun(profile, key = dayKey()) {
  const chain = profile.chain || [];
  const best = Math.max(profile.chainBest || 0, 0);
  if (!chain.length) return { days: 0, alive: false, today: false, rest: 0, endsToday: false, best, total: 0 };

  const state = replay(chain, key);
  // The record outranks the stored counter: it can prove a run that the
  // counter never saw, and `chainBest` only survives runs older than the cap.
  const ever = Math.max(best, state.best);
  const total = chain.length;
  const missed = daysBetween(state.last, key) - 1;   // days between the last practice and today
  if (state.last === key) {
    return { days: state.days, alive: true, today: true, rest: state.rest, endsToday: false, best: ever, total };
  }
  if (missed < 0) {
    // The record runs past today: a device whose clock moved backwards, or a
    // profile carried across time zones. The run stands; tonight is not ours to
    // judge, so nothing is said about it.
    return { days: state.days, alive: true, today: false, rest: state.rest, endsToday: false, best: ever, total };
  }
  if (missed > state.rest) {
    return { days: 0, alive: false, today: false, rest: 0, endsToday: false, best: ever, total };
  }
  const rest = state.rest - missed;
  return { days: state.days, alive: true, today: false, rest, endsToday: rest === 0, best: ever, total };
}

/** What the chain has to say, in one sentence and without a threat. The warning
 *  is real (the run does end tonight) so it is said plainly once, and the
 *  sentence never asks twice, never counts down and never says what is lost. It
 *  lives here rather than in the component because it is the record talking,
 *  and both surfaces have to say the same thing. */
export function chainNote(run) {
  if (!run.alive) {
    return run.best > 0
      ? `No run going. Your longest was ${plural(run.best, "day", "days")}, and today starts the next one.`
      : "Practise today and the chain starts.";
  }
  if (run.today) {
    const held = run.rest > 0 ? ` ${plural(run.rest, "rest day", "rest days")} in hand.` : "";
    return `Practised today.${held}`;
  }
  if (run.endsToday) return "Today is still open, and it is the day this run needs.";
  return `Today is still open. ${plural(run.rest, "rest day", "rest days")} in hand if it stays that way.`;
}

/** The last `n` days ending today, oldest first, each `{ key, practised }`.
 *  What the strip on the dashboard and the grid on the profile are drawn from,
 *  so both are reading the same record rather than two counts of it. */
export function recentDays(profile, key = dayKey(), n = 28) {
  const attended = new Set(profile.chain || []);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = addDays(key, -i);
    out.push({ key: day, practised: attended.has(day) });
  }
  return out;
}

/** A v3 profile saved before the chain existed still has its kata attendance,
 *  and those days were practised: the reader solved a problem on each of them.
 *  Seeding the record from the counter keeps a run that somebody has been
 *  holding for a month from resetting to nothing on the day this ships. The
 *  days are reconstructed backwards from `kataDate`, which is exactly what the
 *  counter meant. */
export function seedFromKata(profile) {
  const { kataDate, kataStreak } = profile;
  if (!isDayKey(kataDate) || !Number.isInteger(kataStreak) || kataStreak < 1) return null;
  const days = Math.min(kataStreak, CHAIN_KEEP);
  const out = [];
  let day = kataDate;
  for (let i = 0; i < days; i++) { out.push(day); day = previousDay(day); }
  return out.reverse();
}
