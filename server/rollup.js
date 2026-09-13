/* The daily roll-up: how many people are here and how much go gets played,
   kept as one row a day and nothing else.

   What is counted and what is not is the whole point of this file. Joseki's
   privacy notice says there is no analytics script, no tracking pixel and no
   cookie, and that it has never counted a visit. All three stay true: nothing
   here runs in a browser, and none of these numbers is a page view. A game is
   not a visit and an account is not a visit. Somebody who reads the site all
   afternoon and never sits down at a board moves none of these figures.

   Nor is any of it about a person. A row is six integers and a date. There is
   no identifier in it, so there is nothing to join it against later, which is
   the property that makes publishing the whole series safe.

   Everything in here is pure so that it can be read, tested and argued with
   away from the Durable Object that calls it. */

/** How many days of history are kept. The privacy notice quotes this number,
 *  so it is enforced here rather than merely promised: `stale` names the rows
 *  the seal deletes. */
export const RETAIN_DAYS = 365;

/** What `/api/stats/history` hands back when nobody asked for a window. */
export const DEFAULT_DAYS = 90;

/** The most rows one request may ask for: the whole retained window. */
export const MAX_DAYS = RETAIN_DAYS;

const DAY_MS = 86_400_000;
/** The seal runs a few minutes after midnight so that a late write on a busy
 *  day lands before its row closes, never after. */
const SEAL_MINUTE = 5;

/** The UTC day a moment belongs to, as `YYYY-MM-DD`. UTC and not the server's
 *  idea of local time, because a Worker has no locality worth speaking of and
 *  a row that means a different span in June than in December is not a row. */
export const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);

const msOf = (date) => Date.parse(`${date}T00:00:00Z`);

/** The day before a given one. The seal wakes at 00:05 and closes *yesterday*:
 *  anything counted in the first five minutes of today already belongs to
 *  today, and folding it backwards would quietly misdate it. */
export const dayBefore = (date) => dayOf(msOf(date) - DAY_MS);

/** A day nobody has touched yet. A quiet day seals as this rather than as a
 *  gap, so the series has no holes to explain. */
export const emptyDay = () => ({
  newAccounts: 0,
  gamesStarted: 0,
  gamesFinished: 0,
  peakOnline: 0,
});

/** One more of something. */
export const counted = (day, field, n = 1) => ({ ...day, [field]: (day[field] ?? 0) + n });

/** The high-water mark of players in the lobby at once. Only ever raised, so
 *  it can be sampled when a socket opens and ignored when one closes. */
export const raised = (day, online) => ({ ...day, peakOnline: Math.max(day.peakOnline ?? 0, online) });

/** A room reports itself both when it is made and when it ends, through the
 *  same call with the same shape. `endedAt` is what tells the two apart; the
 *  room sets it at the move that finishes the game. */
export const isFinish = (summary) => Boolean(summary && summary.endedAt);

/** Close a day. `accounts` is a level counted at seal time, not a running
 *  total, so it corrects itself when somebody leaves and takes their handle
 *  with them. */
export const sealed = (day, date, accounts) => ({ date, accounts, ...emptyDay(), ...day });

/** The dates that have fallen out of the retained window: `RETAIN_DAYS` of
 *  history ending today, and nothing behind that. */
export const stale = (dates, today, keep = RETAIN_DAYS) => {
  const floor = msOf(today) - (keep - 1) * DAY_MS;
  return dates.filter((d) => msOf(d) < floor);
};

/** What a caller may ask for. A missing or unreadable `days` is the default
 *  rather than an error: this route is meant to be opened by hand. */
export const clampDays = (v, fallback = DEFAULT_DAYS) => {
  // Absent has to be caught before Number sees it: `Number(null)` and
  // `Number("")` are both 0, which is a perfectly finite number and would
  // quietly turn `?days=` into a one-day window instead of the default.
  if (v === null || v === undefined || String(v).trim() === "") return fallback;
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_DAYS, Math.max(1, n));
};

/** The last `days` rows, oldest first. Rows are filtered by date rather than
 *  sliced by count, so a series with a hole in it from before the seal existed
 *  still answers for the window that was asked for. */
export const recent = (rows, days, today) => {
  const floor = msOf(today) - (clampDays(days) - 1) * DAY_MS;
  return rows
    .filter((r) => r && r.date && msOf(r.date) >= floor)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
};

/** When the next seal is due: the coming 00:05 UTC, and never a moment already
 *  past, so re-arming from inside the alarm cannot schedule a wake in the
 *  past and spin. */
export const nextSeal = (nowMs) => {
  const d = new Date(nowMs);
  const at = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, SEAL_MINUTE);
  return at > nowMs ? at : at + DAY_MS;
};
