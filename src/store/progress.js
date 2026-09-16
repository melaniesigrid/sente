/* ----------------------- PROGRESS (pure) -----------------------
   The part of a profile that is what you have done rather than what you
   prefer: the lessons, problems and drills finished, the recall schedule, the
   days practised and the runs they make, the kata and duel records, and the
   house ladder record. A player who is signed in keeps it on their account as
   well as in the browser, so signing in on another device finds it. What you
   prefer (room, type, stones, language, sound, name and tint) stays on the
   device: a borrowed laptop keeps its own.

   Shared by the browser and the Worker. The merge is one function run on both
   ends, so what the server hands back is what the browser would have worked
   out itself, and two devices that both did things while apart lose nothing:
   sets are joined, records keep the higher, and the handful of values that
   can only be one thing (a rating, the day a duel was played) come from
   whichever side wrote more recently.

   No React, no fetch, no storage. */

/** Storage on the server takes at most 128 KiB a value; this leaves room for
 *  the envelope around the data. */
export const PROGRESS_MAX_BYTES = 96 * 1024;

/** The days practised are kept to this many, the same cap `src/content/chain.js` holds. */
const CHAIN_KEEP = 400;

/** Joined: anything either side has done, it has done. */
export const SETS = { lessonsDone: "string", problemsDone: "string", drillsDone: "string", tierPassed: "number", chain: "string" };
/** Higher wins: counts of things that only ever go up, and personal bests. */
export const HIGH = ["chainBest", "kataBest", "duelBestStreak", "duelPlayed", "duelWins", "wins", "losses", "bestStreak"];
/** Latest wins: values that describe now, not a total, each with its type. */
export const LATEST_TYPES = {
  rating: "number", rd: "number", vol: "number", streak: "number", kataStreak: "number", kataDate: "string",
  duelStreak: "number", duelStarted: "string", duelDate: "string", duelResult: "string", duelMoves: "number",
};
export const LATEST = Object.keys(LATEST_TYPES);
/** Merged by key: a map from something to a record of how it went. */
export const MAPS = ["bookProgress", "recall"];

export const PROGRESS_FIELDS = [...Object.keys(SETS), ...HIGH, ...LATEST, ...MAPS];

const isRecord = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v) => typeof v === "number" && Number.isFinite(v);

/** The progress in a profile, and nothing else of it. Fields the profile does
 *  not carry are left out rather than defaulted, so a merge cannot read an
 *  absence as a zero. */
export function progressOf(profile) {
  const out = {};
  if (!isRecord(profile)) return out;
  for (const key of PROGRESS_FIELDS) if (key in profile) out[key] = profile[key];
  return out;
}

/** A progress document as it arrives over the wire: every field checked for
 *  shape and anything unknown dropped. Null when the value is not an object at
 *  all. A wrong field is left out, not made up, for the same reason as above. */
export function cleanProgress(raw) {
  if (!isRecord(raw)) return null;
  const out = {};
  for (const [key, type] of Object.entries(SETS)) {
    const v = raw[key];
    if (Array.isArray(v) && v.every(x => typeof x === type && (type !== "number" || Number.isInteger(x)))) out[key] = [...new Set(v)];
  }
  for (const key of HIGH) if (finite(raw[key]) && raw[key] >= 0) out[key] = raw[key];
  for (const [key, type] of Object.entries(LATEST_TYPES)) {
    const v = raw[key];
    if (type === "number" ? finite(v) : typeof v === "string") out[key] = v;
  }
  for (const key of MAPS) if (isRecord(raw[key])) out[key] = { ...raw[key] };
  return out;
}

/* Sorted, so the answer is the same whichever side is given first; none of
   these lists carries meaning in its order. */
const byValue = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const union = (a = [], b = []) => [...new Set([...a, ...b])].sort(byValue);

/** Book progress: the better run of a replay lesson, score first. */
const betterRun = (a, b) => {
  if (!isRecord(a)) return b;
  if (!isRecord(b)) return a;
  if ((b.score ?? 0) > (a.score ?? 0)) return b;
  if ((b.score ?? 0) < (a.score ?? 0)) return a;
  return (b.stops ?? 0) > (a.stops ?? 0) ? b : a;
};

/** A recall card: the one further along, and of two in the same box the one
 *  due later, since that is the one that was answered more recently. */
const furtherCard = (a, b) => {
  if (!isRecord(a)) return b;
  if (!isRecord(b)) return a;
  if ((b.box ?? 0) !== (a.box ?? 0)) return (b.box ?? 0) > (a.box ?? 0) ? b : a;
  return String(b.due ?? "") > String(a.due ?? "") ? b : a;
};

const mergeMap = (a, b, pick) => {
  const out = { ...(a || {}) };
  for (const [key, v] of Object.entries(b || {})) out[key] = pick(out[key], v);
  return out;
};

/** Two documents `{ data, at }` into one. Commutative in everything but the
 *  latest-wins fields, where `at` decides, so the order the two sides are
 *  given in does not matter. */
export function mergeProgress(a, b) {
  const x = a?.data || {}, y = b?.data || {};
  const newer = (b?.at ?? 0) >= (a?.at ?? 0) ? y : x;
  const older = newer === y ? x : y;
  const data = {};
  for (const key of Object.keys(SETS)) {
    if (!(key in x) && !(key in y)) continue;
    const joined = union(x[key], y[key]);
    data[key] = key === "chain" ? joined.slice(-CHAIN_KEEP) : joined;
  }
  for (const key of HIGH) {
    if (!(key in x) && !(key in y)) continue;
    data[key] = Math.max(x[key] ?? 0, y[key] ?? 0);
  }
  for (const key of LATEST) {
    if (key in newer) data[key] = newer[key];
    else if (key in older) data[key] = older[key];
  }
  if ("bookProgress" in x || "bookProgress" in y) data.bookProgress = mergeMap(x.bookProgress, y.bookProgress, betterRun);
  if ("recall" in x || "recall" in y) data.recall = mergeMap(x.recall, y.recall, furtherCard);
  return { data, at: Math.max(a?.at ?? 0, b?.at ?? 0) };
}

/** A profile with a progress document laid over it. */
export const applyProgress = (profile, data) => ({ ...profile, ...(data || {}) });

/** How much a document weighs on the wire, for the cap. */
export const progressBytes = (doc) => JSON.stringify(doc).length;
