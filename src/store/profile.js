/* ----------------------- PERSISTENT PROFILE -----------------------
   Stored JSON is untrusted: every field is checked against the default's
   type and falls back per field, with one console.warn naming what was reset. */
import { TINTS } from "../content/rank.js";
import { DEFAULT_TYPEFACE, typefaceOf } from "../content/typeface.js";
import { DEFAULT_THEME, themeOf } from "../content/theme.js";

export const STORE_KEY = "sente-profile-v2";

export const defaultProfile = {
  name: "Player", tint: "eucalyptus", rating: 1000,
  wins: 0, losses: 0, streak: 0, bestStreak: 0,
  lessonsDone: [], problemsDone: [],
  tierPassed: [],                            // library tier ids whose exit test was passed
  sound: false,                              // stone click + haptic, opt-in
  onboarded: false,                          // the welcome flow has been seen or skipped
  coordinates: false,                        // letters and numbers around the board
  lastMoveMark: "dot",                       // how the last stone played is marked

  typeface: DEFAULT_TYPEFACE,                // font pairing id, src/content/typeface.js
  theme: DEFAULT_THEME,                      // palette id, src/content/theme.js
  kataDate: "", kataStreak: 0, kataBest: 0,  // kata of the day attendance
  duelStarted: "", duelDate: "", duelResult: "", duelMoves: 0,  // daily duel: day started, day finished, code ("B+3.5")
  duelPlayed: 0, duelWins: 0, duelStreak: 0, duelBestStreak: 0,
  bookProgress: {},                          // { [lessonId]: { stops, score, total } } from replay lessons
};

const isCount = (n) => Number.isInteger(n) && n >= 0;
/** A bookProgress map, keeping only entries of the right shape (unknown ids are
 *  harmless: the library ignores them). Returns null when the value itself is wrong. */
function sanitizeBookProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const [id, p] of Object.entries(value)) {
    if (typeof id === "string" && p && typeof p === "object" && isCount(p.stops) && isCount(p.score) && isCount(p.total)) {
      out[id] = { stops: p.stops, score: p.score, total: p.total };
    }
  }
  return out;
}

/** How the last stone played is marked. A preference, not a rule: some readers want
 *  the dot, some the ring around the stone, and some want the board left alone. */
export const MARKS = ["dot", "ring", "none"];

// Element type for each array field; anything else in an array is a corrupt profile.
const ARRAY_OF = { lessonsDone: "string", problemsDone: "string", tierPassed: "number" };

const validField = (key, value) => {
  const def = defaultProfile[key];
  if (Array.isArray(def)) {
    const t = ARRAY_OF[key];
    return Array.isArray(value) && value.every(v => typeof v === t && (t !== "number" || Number.isInteger(v)));
  }
  if (typeof def === "number") return typeof value === "number" && Number.isFinite(value);
  if (typeof def === "boolean") return typeof value === "boolean";
  if (key === "tint") return typeof value === "string" && Object.hasOwn(TINTS, value);
  if (key === "lastMoveMark") return MARKS.includes(value);
  if (key === "typeface") return typeof value === "string" && typefaceOf(value).id === value;
  if (key === "theme") return typeof value === "string" && themeOf(value).id === value;
  if (typeof def === "string") return typeof value === "string";
  if (key === "bookProgress") return sanitizeBookProgress(value) !== null;
  return false;
};

/** Merge stored data over the defaults, keeping only fields of the right shape.
 *  Unknown keys are dropped. Returns a fresh object; never throws. */
export function sanitizeProfile(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    console.warn("sente: stored profile is not an object; using defaults");
    return { ...defaultProfile };
  }
  const out = { ...defaultProfile };
  const bad = [];
  for (const key of Object.keys(defaultProfile)) {
    if (!(key in raw)) continue;
    if (!validField(key, raw[key])) { bad.push(key); continue; }
    if (key === "bookProgress") out[key] = sanitizeBookProgress(raw[key]);
    else out[key] = Array.isArray(raw[key]) ? raw[key].slice() : raw[key];
  }
  if (bad.length) console.warn(`sente: profile field(s) reset to default: ${bad.join(", ")}`);
  return out;
}

export async function loadProfile() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? sanitizeProfile(JSON.parse(raw)) : defaultProfile;
  } catch { return defaultProfile; }
}

export async function saveProfile(p) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { console.error("save failed", e); }
}

/* ----------------------- FIRST VISIT -----------------------
   Whether to show the welcome flow. `onboarded` alone is not enough: every profile
   saved before the flag existed lacks it, and interrupting somebody who already has
   a rating and a shelf of finished lessons to teach them what a liberty is would be
   insulting. So a player with any history at all is treated as already welcomed, and
   only a genuinely untouched profile sees it. */
export function needsOnboarding(profile) {
  if (!profile || profile.onboarded) return false;
  const played = (profile.wins ?? 0) + (profile.losses ?? 0) > 0;
  const studied = (profile.lessonsDone?.length ?? 0) + (profile.problemsDone?.length ?? 0) > 0;
  const named = profile.name !== defaultProfile.name;
  const rated = (profile.rating ?? defaultProfile.rating) !== defaultProfile.rating;
  return !played && !studied && !named && !rated;
}
