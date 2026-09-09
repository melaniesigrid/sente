/* ----------------------- KATA OF THE DAY -----------------------
   One tsumego per calendar day, the same one for everyone, picked from the
   library by hashing the date. Solving it is "attendance"; consecutive days
   build a streak. Pure functions; the date is a "YYYY-MM-DD" key so the logic
   is testable and free of time zones. */

export function dayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const hashKey = (key) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
};

export function dailyProblem(problems, key) {
  if (!problems.length) return null;
  return problems[hashKey(key) % problems.length];
}

/** The key for the day before `key`, computed in UTC so DST cannot skip a day. */
export function previousDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) - 86400000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/** Profile patch after solving today's kata. Idempotent within a day. */
export function attend(profile, key) {
  if (profile.kataDate === key) return {};
  const streak = profile.kataDate === previousDay(key) ? profile.kataStreak + 1 : 1;
  return { kataDate: key, kataStreak: streak, kataBest: Math.max(profile.kataBest || 0, streak) };
}

/** Streak still alive today? Yesterday's attendance counts until tonight. */
export function liveStreak(profile, key) {
  if (profile.kataDate === key || profile.kataDate === previousDay(key)) return profile.kataStreak;
  return 0;
}
